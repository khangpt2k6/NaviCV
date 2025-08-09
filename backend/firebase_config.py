import firebase_admin
from firebase_admin import credentials, firestore, storage
import os
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class FirebaseManager:
    def __init__(self):
        """Initialize Firebase connection"""
        try:
            # Check if Firebase is already initialized
            if not firebase_admin._apps:
                # Use service account key if available, otherwise use default credentials
                if os.path.exists('firebase-service-account.json'):
                    cred = credentials.Certificate('firebase-service-account.json')
                    firebase_admin.initialize_app(cred, {
                        'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'microservice-78e2f.firebasestorage.app')
                    })
                else:
                    # Use default credentials (for production with environment variables)
                    firebase_admin.initialize_app()
            
            self.db = firestore.client()
            self.bucket = storage.bucket()
            logger.info("Firebase initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {str(e)}")
            raise
    
    # User Profile Management
    async def create_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Create or update user profile"""
        try:
            doc_ref = self.db.collection('users').document(user_id)
            doc_ref.set(profile_data, merge=True)
            logger.info(f"User profile created/updated for {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error creating user profile: {str(e)}")
            return False
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile by ID"""
        try:
            doc_ref = self.db.collection('users').document(user_id)
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error(f"Error getting user profile: {str(e)}")
            return None
    
    async def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update specific fields in user profile"""
        try:
            doc_ref = self.db.collection('users').document(user_id)
            doc_ref.update(updates)
            logger.info(f"User profile updated for {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating user profile: {str(e)}")
            return False
    
    # Resume Analysis Storage
    async def save_resume_analysis(self, user_id: str, analysis_data: Dict[str, Any]) -> str:
        """Save resume analysis results"""
        try:
            analysis_data['user_id'] = user_id
            analysis_data['timestamp'] = firestore.SERVER_TIMESTAMP
            
            doc_ref = self.db.collection('resume_analyses').add(analysis_data)
            logger.info(f"Resume analysis saved for user {user_id}")
            return doc_ref[1].id
        except Exception as e:
            logger.error(f"Error saving resume analysis: {str(e)}")
            raise
    
    async def get_user_analyses(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's resume analyses"""
        try:
            analyses = self.db.collection('resume_analyses')\
                .where('user_id', '==', user_id)\
                .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                .limit(limit)\
                .stream()
            
            return [doc.to_dict() for doc in analyses]
        except Exception as e:
            logger.error(f"Error getting user analyses: {str(e)}")
            return []
    
    # Job Metadata Storage
    async def save_job_metadata(self, job_data: Dict[str, Any]) -> str:
        """Save job metadata"""
        try:
            job_data['timestamp'] = firestore.SERVER_TIMESTAMP
            
            doc_ref = self.db.collection('jobs').add(job_data)
            logger.info(f"Job metadata saved: {job_data.get('title', 'Unknown')}")
            return doc_ref[1].id
        except Exception as e:
            logger.error(f"Error saving job metadata: {str(e)}")
            raise
    
    async def get_jobs_by_criteria(self, criteria: Dict[str, Any], limit: int = 50) -> List[Dict[str, Any]]:
        """Get jobs by specific criteria"""
        try:
            query = self.db.collection('jobs')
            
            for field, value in criteria.items():
                if isinstance(value, dict):
                    # Handle range queries
                    if 'min' in value:
                        query = query.where(field, '>=', value['min'])
                    if 'max' in value:
                        query = query.where(field, '<=', value['max'])
                else:
                    query = query.where(field, '==', value)
            
            jobs = query.limit(limit).stream()
            return [doc.to_dict() for doc in jobs]
        except Exception as e:
            logger.error(f"Error getting jobs by criteria: {str(e)}")
            return []
    
    # Analytics and Logging
    async def log_user_activity(self, user_id: str, activity_type: str, details: Dict[str, Any]) -> bool:
        """Log user activity for analytics"""
        try:
            log_data = {
                'user_id': user_id,
                'activity_type': activity_type,
                'details': details,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'ip_address': details.get('ip_address'),
                'user_agent': details.get('user_agent')
            }
            
            self.db.collection('user_activities').add(log_data)
            logger.info(f"User activity logged: {activity_type} for {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error logging user activity: {str(e)}")
            return False
    
    async def get_analytics_data(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get analytics data for a date range"""
        try:
            # Get user activities in date range
            activities = self.db.collection('user_activities')\
                .where('timestamp', '>=', start_date)\
                .where('timestamp', '<=', end_date)\
                .stream()
            
            activity_data = [doc.to_dict() for doc in activities]
            
            # Get resume analyses in date range
            analyses = self.db.collection('resume_analyses')\
                .where('timestamp', '>=', start_date)\
                .where('timestamp', '<=', end_date)\
                .stream()
            
            analysis_data = [doc.to_dict() for doc in analyses]
            
            return {
                'activities': activity_data,
                'analyses': analysis_data,
                'total_activities': len(activity_data),
                'total_analyses': len(analysis_data)
            }
        except Exception as e:
            logger.error(f"Error getting analytics data: {str(e)}")
            return {}
    
    # File Storage
    async def upload_resume_file(self, user_id: str, file_data: bytes, filename: str) -> str:
        """Upload resume file to Firebase Storage"""
        try:
            blob_name = f"resumes/{user_id}/{filename}"
            blob = self.bucket.blob(blob_name)
            blob.upload_from_string(file_data, content_type='application/pdf')
            
            # Make the file publicly readable (optional)
            blob.make_public()
            
            logger.info(f"Resume file uploaded: {blob_name}")
            return blob.public_url
        except Exception as e:
            logger.error(f"Error uploading resume file: {str(e)}")
            raise
    
    async def delete_resume_file(self, user_id: str, filename: str) -> bool:
        """Delete resume file from Firebase Storage"""
        try:
            blob_name = f"resumes/{user_id}/{filename}"
            blob = self.bucket.blob(blob_name)
            blob.delete()
            
            logger.info(f"Resume file deleted: {blob_name}")
            return True
        except Exception as e:
            logger.error(f"Error deleting resume file: {str(e)}")
            return False

# Global Firebase manager instance
firebase_manager = FirebaseManager()


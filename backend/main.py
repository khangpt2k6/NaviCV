from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="JobsDreamer API", description="AI Career Assistant")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

from app.models import JobMatch, ResumeAnalysis, MatchRequest
from app.analysis import extract_text_from_pdf, analyze_resume
from app.matching import calculate_semantic_similarity, calculate_keyword_match
from app.state import initialize_models, refresh_jobs_data, jobs_data, sentence_model


@app.on_event("startup")
async def startup_event():
    await initialize_models(load_spacy=True)

"""
main.py is intentionally slim; models and business logic live under app/* modules.
"""

from app.scraping import JobScraper
from app.matching import normalize_job_data

"""Endpoints below use functionality from app/* modules."""

from app.matching import normalize_job_data

from app.state import refresh_jobs_data

# API endpoints
@app.get("/")
async def root():
    return {"message": "JobsDreamer API is running", "status": "healthy"}

@app.get("/jobs", response_model=List[JobMatch])
async def get_jobs(limit: int = 20, search: Optional[str] = None, location: Optional[str] = "us"):
    """Get jobs with optional search from multiple sources"""
    try:
        if search:
            # Search jobs from multiple sources
            scraper = JobScraper()
            all_search_jobs = []
            
            # Search RemoteOK
            try:
                remoteok_jobs = await scraper.search_remoteok_jobs(search, limit=limit//2)
                if remoteok_jobs:
                    for job in remoteok_jobs:
                        job['source'] = 'remoteok'
                    all_search_jobs.extend(remoteok_jobs)
            except Exception as e:
                logger.error(f"Error searching RemoteOK: {str(e)}")
            
            # Search Adzuna
            try:
                adzuna_jobs = await scraper.search_adzuna_jobs(search, limit=limit//2, location=location)
                if adzuna_jobs:
                    for job in adzuna_jobs:
                        job['source'] = f'adzuna_{location}'
                    all_search_jobs.extend(adzuna_jobs)
            except Exception as e:
                logger.error(f"Error searching Adzuna: {str(e)}")
            
            # Normalize and return results
            normalized_jobs = []
            seen_ids = set()
            
            for job in all_search_jobs:
                normalized_job = normalize_job_data(job)
                job_id = normalized_job.get('job_id', '')
                
                if job_id and job_id not in seen_ids:
                    seen_ids.add(job_id)
                    normalized_jobs.append(normalized_job)
            
            return normalized_jobs[:limit]
        else:
            # Return cached jobs
            return jobs_data[:limit]
    except Exception as e:
        logger.error(f"Error getting jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-resume", response_model=ResumeAnalysis)
async def analyze_resume_endpoint(file: UploadFile = File(...)):
    """Analyze uploaded resume"""
    try:
        # Read file content
        content = await file.read()
        
        # Extract text based on file type
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(content)
        else:
            text = content.decode('utf-8', errors='ignore')
        
        # Analyze resume
        analysis = analyze_resume(text)
        
        logger.info(f"Resume analyzed: {file.filename}")
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/match-jobs", response_model=List[JobMatch])
async def match_jobs_endpoint(request: MatchRequest):
    """Match resume with jobs"""
    try:
        if not jobs_data:
            await refresh_jobs_data()
        
        if not jobs_data:
            raise HTTPException(status_code=500, detail="No job data available")
    
        # Calculate matches
        matches = []
        resume_text = request.resume_text.lower()
        
        for job in jobs_data:
            job_text = (job.get('description', '') + ' ' + ' '.join(job.get('tags', []))).lower()
            
            # Calculate semantic similarity
            semantic_score = calculate_semantic_similarity(resume_text, job_text)
            
            # Calculate keyword match
            resume_keywords = request.resume_text.split()
            keyword_score = calculate_keyword_match(resume_keywords, job_text)
            
            # Overall match score
            match_score = (semantic_score * 0.7) + (keyword_score * 0.3)
            
            if match_score > 0.1:  # Only include relevant matches
                # Update the scores in the job data
                job_copy = job.copy()
                job_copy['match_score'] = match_score
                job_copy['semantic_score'] = semantic_score
                job_copy['keyword_score'] = keyword_score
                
                job_match = JobMatch(**job_copy)
                matches.append(job_match)
        
        # Sort by match score and return top matches
        matches.sort(key=lambda x: x.match_score, reverse=True)
        return matches[:20]
        
    except Exception as e:
        logger.error(f"Error matching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/refresh-jobs")
async def refresh_jobs_endpoint():
    """Manually refresh job data"""
    try:
        await refresh_jobs_data()
        return {"message": "Job data refreshed successfully"}
    except Exception as e:
        logger.error(f"Error refreshing jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint for deployment platforms"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/job/{job_id}")
async def get_job_details(job_id: str):
    """Get specific job details"""
    try:
        for job in jobs_data:
            if str(job.get('job_id')) == job_id:
                return job
        raise HTTPException(status_code=404, detail="Job not found")
    except Exception as e:
        logger.error(f"Error getting job details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

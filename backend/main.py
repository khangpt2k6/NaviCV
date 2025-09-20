from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import requests
import json
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import asyncio
import aiohttp
from datetime import datetime, timedelta
import re
import PyPDF2
import io
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import spacy
import logging
import os

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

# Initialize AI models
@app.on_event("startup")
async def startup_event():
    global sentence_model, nlp, job_vectorizer, job_index, jobs_data
    
    logger.info("Loading AI models...")
    # Load sentence transformer for semantic similarity
    sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Load spaCy model for NLP processing
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        logger.warning("spaCy model not found, using basic processing")
        nlp = None
    
    # Initialize FAISS index and job data storage
    job_index = None
    jobs_data = []
    job_vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
    
    # Load initial job data
    await refresh_jobs_data()
    
    logger.info("Models loaded successfully!")

# Pydantic models
class JobMatch(BaseModel):
    job_id: str
    title: str
    company: str
    location: str
    description: str
    tags: List[str]
    salary: Optional[str]
    url: str
    match_score: float
    semantic_score: float
    keyword_score: float
    posted_date: Optional[str]

class ATSScore(BaseModel):
    overall_score: float
    keyword_optimization: float
    formatting_score: float
    content_quality: float
    action_verbs: float
    metrics_usage: float
    contact_info: float
    summary_quality: float
    experience_detail: float
    education_relevance: float

class ResumeWeakness(BaseModel):
    category: str
    severity: str  # "low", "medium", "high"
    description: str
    suggestion: str
    impact: str

class ResumeAnalysis(BaseModel):
    skills: List[str]
    experience_years: Optional[int]
    job_titles: List[str]
    education: List[str]
    keywords: List[str]
    summary: str
    ats_score: Optional[ATSScore] = None
    weaknesses: List[ResumeWeakness] = []

class JobSearchRequest(BaseModel):
    query: str
    location: Optional[str] = None
    job_type: Optional[str] = None
    limit: int = 20

class MatchRequest(BaseModel):
    resume_text: str
    job_preferences: Optional[Dict[str, Any]] = {}

# Job scraping functionality
class JobScraper:
    def __init__(self):
        self.session = None
        # Adzuna API credentials (you'll need to add these to your env variables)
        self.adzuna_app_id = os.getenv('ADZUNA_ID', 'b378129d')
        self.adzuna_api_key = os.getenv('ADZUNA_KEY', '5ef0ccf9f33b02439a214464c4a8b9f3')
        self.adzuna_base_url = "https://api.adzuna.com/v1/api/jobs"
    
    async def get_session(self):
        if self.session is None:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def fetch_remoteok_jobs(self, limit: int = 50) -> List[Dict]:
        """Fetch jobs from RemoteOK API"""
        try:
            session = await self.get_session()
            
            # Try multiple endpoints and headers
            endpoints = [
                "https://remoteok.io/api/jobs",
                "https://remoteok.io/api"
            ]
        
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
            
            for endpoint in endpoints:
                try:
                    async with session.get(endpoint, headers=headers, timeout=30) as response:
                        if response.status == 200:
                            jobs = await response.json()
                            # Filter out None values and limit results
                            valid_jobs = [job for job in jobs if job is not None and isinstance(job, dict)][:limit]
                            logger.info(f"Fetched {len(valid_jobs)} jobs from RemoteOK")
                            return valid_jobs
                        else:
                            logger.warning(f"RemoteOK endpoint {endpoint} returned {response.status}")
                except Exception as e:
                    logger.warning(f"Error with RemoteOK endpoint {endpoint}: {str(e)}")
                    continue
            
            logger.warning("All RemoteOK endpoints failed")
            return []
            
        except Exception as e:
            logger.error(f"Error fetching RemoteOK jobs: {str(e)}")
            return []

    async def fetch_adzuna_jobs(self, limit: int = 50, location: str = "us") -> List[Dict]:
        """Fetch jobs from Adzuna API"""
        if not self.adzuna_app_id or not self.adzuna_api_key:
            logger.warning("Adzuna API credentials not configured")
            return []
        
        try:
            session = await self.get_session()
            
            # Adzuna API endpoints for different countries
            country_endpoints = {
                "us": "https://api.adzuna.com/v1/api/jobs/us/search/1",
                "gb": "https://api.adzuna.com/v1/api/jobs/gb/search/1",
                "au": "https://api.adzuna.com/v1/api/jobs/au/search/1",
                "ca": "https://api.adzuna.com/v1/api/jobs/ca/search/1"
            }
            
            endpoint = country_endpoints.get(location, country_endpoints["us"])
            
            params = {
                "app_id": self.adzuna_app_id,
                "app_key": self.adzuna_api_key,
                "results_per_page": min(limit, 50),  # Adzuna max is 50 per page
                "content-type": "application/json"
            }
            
            async with session.get(endpoint, params=params, timeout=30) as response:
                if response.status == 200:
                    data = await response.json()
                    jobs = data.get("results", [])
                    logger.info(f"Fetched {len(jobs)} jobs from Adzuna")
                    return jobs
                else:
                    logger.error(f"Adzuna API returned {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error fetching Adzuna jobs: {str(e)}")
            return []
    
    async def search_remoteok_jobs(self, query: str, limit: int = 25) -> List[Dict]:
        """Search jobs by query on RemoteOK"""
        try:
            session = await self.get_session()
            params = {"search": query, "limit": limit}
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            }
            
            async with session.get("https://remoteok.io/api/jobs", params=params, headers=headers, timeout=30) as response:
                if response.status == 200:
                    jobs = await response.json()
                    valid_jobs = [job for job in jobs if job is not None]
                    logger.info(f"Found {len(valid_jobs)} RemoteOK jobs for query: {query}")
                    return valid_jobs
                else:
                    logger.error(f"Failed to search RemoteOK jobs: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error searching RemoteOK jobs: {str(e)}")
            return []

    async def search_adzuna_jobs(self, query: str, limit: int = 25, location: str = "us") -> List[Dict]:
        """Search jobs by query on Adzuna"""
        if not self.adzuna_app_id or not self.adzuna_api_key:
            return []
        
        try:
            session = await self.get_session()
            
            country_endpoints = {
                "us": "https://api.adzuna.com/v1/api/jobs/us/search/1",
                "gb": "https://api.adzuna.com/v1/api/jobs/gb/search/1",
                "au": "https://api.adzuna.com/v1/api/jobs/au/search/1",
                "ca": "https://api.adzuna.com/v1/api/jobs/ca/search/1"
            }
            
            endpoint = country_endpoints.get(location, country_endpoints["us"])
            
            params = {
                "app_id": self.adzuna_app_id,
                "app_key": self.adzuna_api_key,
                "what": query,
                "results_per_page": min(limit, 50),
                "content-type": "application/json"
            }
            
            async with session.get(endpoint, params=params, timeout=30) as response:
                if response.status == 200:
                    data = await response.json()
                    jobs = data.get("results", [])
                    logger.info(f"Found {len(jobs)} Adzuna jobs for query: {query}")
                    return jobs
                else:
                    logger.error(f"Adzuna search returned {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error searching Adzuna jobs: {str(e)}")
            return []

    def get_sample_jobs(self, limit: int) -> List[Dict]:
        """Return sample job data when APIs are unavailable"""
        sample_jobs = [
            {
                "id": "1",
                "position": "Senior Software Engineer",
                "company": "TechCorp",
                "location": "Remote",
                "description": "We are looking for a Senior Software Engineer to join our team. Experience with Python, React, and cloud technologies required.",
                "tags": ["python", "react", "aws", "docker"],
                "salary_min": 80000,
                "salary_max": 120000,
                "url": "https://example.com/job1",
                "date": "2024-01-15",
                "source": "sample"
            },
            {
                "id": "2",
                "position": "Data Scientist",
                "company": "DataTech",
                "location": "San Francisco, CA",
                "description": "Join our data science team to build machine learning models and analyze large datasets.",
                "tags": ["python", "machine learning", "sql", "pandas"],
                "salary_min": 90000,
                "salary_max": 140000,
                "url": "https://example.com/job2",
                "date": "2024-01-14",
                "source": "sample"
            },
            {
                "id": "3",
                "position": "Frontend Developer",
                "company": "WebSolutions",
                "location": "Remote",
                "description": "Build beautiful and responsive web applications using modern JavaScript frameworks.",
                "tags": ["javascript", "react", "vue", "css"],
                "salary_min": 70000,
                "salary_max": 110000,
                "url": "https://example.com/job3",
                "date": "2024-01-13",
                "source": "sample"
            },
            {
                "id": "4",
                "position": "DevOps Engineer",
                "company": "CloudTech",
                "location": "Austin, TX",
                "description": "Manage our cloud infrastructure and implement CI/CD pipelines for automated deployments.",
                "tags": ["aws", "docker", "kubernetes", "jenkins"],
                "salary_min": 85000,
                "salary_max": 130000,
                "url": "https://example.com/job4",
                "date": "2024-01-12",
                "source": "sample"
            },
            {
                "id": "5",
                "position": "Product Manager",
                "company": "InnovateCorp",
                "location": "New York, NY",
                "description": "Lead product development and work with cross-functional teams to deliver amazing user experiences.",
                "tags": ["product management", "agile", "user research", "analytics"],
                "salary_min": 95000,
                "salary_max": 150000,
                "url": "https://example.com/job5",
                "date": "2024-01-11",
                "source": "sample"
            },
            {
                "id": "6",
                "position": "Backend Developer",
                "company": "API Solutions",
                "location": "Seattle, WA",
                "description": "Build scalable backend services using Node.js, Python, and cloud technologies.",
                "tags": ["nodejs", "python", "postgresql", "redis"],
                "salary_min": 75000,
                "salary_max": 115000,
                "url": "https://example.com/job6",
                "date": "2024-01-10",
                "source": "sample"
            },
            {
                "id": "7",
                "position": "UX/UI Designer",
                "company": "Design Studio",
                "location": "Remote",
                "description": "Create beautiful and intuitive user interfaces for web and mobile applications.",
                "tags": ["figma", "sketch", "adobe", "prototyping"],
                "salary_min": 65000,
                "salary_max": 100000,
                "url": "https://example.com/job7",
                "date": "2024-01-09",
                "source": "sample"
            },
            {
                "id": "8",
                "position": "Machine Learning Engineer",
                "company": "AI Labs",
                "location": "Boston, MA",
                "description": "Develop and deploy machine learning models for production systems.",
                "tags": ["tensorflow", "pytorch", "mlops", "python"],
                "salary_min": 100000,
                "salary_max": 160000,
                "url": "https://example.com/job8",
                "date": "2024-01-08",
                "source": "sample"
            }
        ]
        return sample_jobs[:limit]

# Resume processing functions
def extract_text_from_pdf(pdf_file: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting PDF text: {str(e)}")
        return ""

def analyze_resume(text: str) -> ResumeAnalysis:
    """Analyze resume text and extract key information"""
    try:
        # Basic text preprocessing
        text = text.lower()
        lines = text.split('\n')
        
        # Extract skills (common technical skills)
        skills_keywords = [
            'python', 'javascript', 'java', 'react', 'node.js', 'sql', 'mongodb',
            'aws', 'docker', 'kubernetes', 'git', 'html', 'css', 'typescript',
            'angular', 'vue.js', 'django', 'flask', 'fastapi', 'spring',
            'machine learning', 'ai', 'data science', 'devops', 'agile',
            'scrum', 'jira', 'figma', 'photoshop', 'illustrator', 'excel',
            'powerpoint', 'word', 'salesforce', 'tableau', 'power bi'
        ]
        
        skills = []
        for skill in skills_keywords:
            if skill in text:
                skills.append(skill.title())
        
        # Extract job titles (common patterns)
        job_titles = []
        job_patterns = [
            r'senior\s+\w+', r'junior\s+\w+', r'lead\s+\w+', r'principal\s+\w+',
            r'developer', r'engineer', r'manager', r'director', r'analyst',
            r'designer', r'architect', r'consultant', r'specialist'
        ]
        
        for pattern in job_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            job_titles.extend([match.title() for match in matches])
        
        # Extract education
        education = []
        edu_keywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college']
        for line in lines:
            if any(keyword in line.lower() for keyword in edu_keywords):
                education.append(line.strip())
        
        # Extract experience years
        experience_years = None
        exp_patterns = [
            r'(\d+)\s+years?\s+of\s+experience',
            r'experience:\s*(\d+)\s+years?',
            r'(\d+)\s+years?\s+in\s+\w+'
        ]
        
        for pattern in exp_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                experience_years = int(match.group(1))
                break
    
        # Generate summary
        summary = f"Professional with {experience_years or 'relevant'} years of experience in {', '.join(skills[:5]) if skills else 'technology'}. Skilled in {', '.join(job_titles[:3]) if job_titles else 'various roles'}."
        
        # Extract keywords
        keywords = list(set(skills + job_titles[:5]))
        
        # Calculate ATS score
        ats_score = calculate_ats_score(text)
        
        # Detect weaknesses
        weaknesses = detect_resume_weaknesses(text)
    
        return ResumeAnalysis(
            skills=skills[:20],
            experience_years=experience_years,
            job_titles=list(set(job_titles))[:10],
            education=education[:5],
            keywords=keywords[:15],
            summary=summary,
            ats_score=ats_score,
            weaknesses=weaknesses
        )
        
    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}")
        return ResumeAnalysis(
            skills=[],
            job_titles=[],
            education=[],
            keywords=[],
            summary="Error analyzing resume"
        )

def calculate_ats_score(text: str) -> ATSScore:
    """Calculate ATS compatibility score"""
    try:
        # Keyword optimization (25%)
        keyword_score = min(1.0, len(re.findall(r'\b\w{4,}\b', text)) / 100)
        
        # Content quality (20%)
        content_score = min(1.0, len(text) / 2000)
        
        # Formatting score (15%)
        formatting_score = 0.8 if '\n' in text and len(text) > 500 else 0.5
        
        # Action verbs (10%)
        action_verbs = ['developed', 'implemented', 'managed', 'created', 'designed', 'built', 'maintained', 'improved']
        action_verb_count = sum(1 for verb in action_verbs if verb in text.lower())
        action_verbs_score = min(1.0, action_verb_count / 5)
        
        # Metrics usage (10%)
        metrics_patterns = [r'\d+%', r'\$\d+', r'\d+\s+users?', r'\d+\s+projects?']
        metrics_count = sum(len(re.findall(pattern, text)) for pattern in metrics_patterns)
        metrics_score = min(1.0, metrics_count / 3)
        
        # Summary quality (10%)
        summary_score = 0.9 if 'summary' in text.lower() or 'objective' in text.lower() else 0.6
        
        # Contact info (5%)
        contact_score = 1.0 if re.search(r'@\w+\.\w+', text) else 0.5
        
        # Experience detail (5%)
        experience_score = 0.9 if re.search(r'\d{4}', text) else 0.6
        
        # Overall score
        overall_score = (
            keyword_score * 0.25 +
            content_score * 0.20 +
            formatting_score * 0.15 +
            action_verbs_score * 0.10 +
            metrics_score * 0.10 +
            summary_score * 0.10 +
            contact_score * 0.05 +
            experience_score * 0.05
        )
    
        return ATSScore(
            overall_score=overall_score,
            keyword_optimization=keyword_score,
            content_quality=content_score,
            formatting_score=formatting_score,
            action_verbs=action_verbs_score,
            metrics_usage=metrics_score,
            summary_quality=summary_score,
            contact_info=contact_score,
            experience_detail=experience_score,
            education_relevance=0.8
        )
        
    except Exception as e:
        logger.error(f"Error calculating ATS score: {str(e)}")
        return ATSScore(
            overall_score=0.5,
            keyword_optimization=0.5,
            content_quality=0.5,
            formatting_score=0.5,
            action_verbs=0.5,
            metrics_usage=0.5,
            summary_quality=0.5,
            contact_info=0.5,
            experience_detail=0.5,
            education_relevance=0.5
        )

def detect_resume_weaknesses(text: str) -> List[ResumeWeakness]:
    """Detect potential weaknesses in resume"""
    try:
        weaknesses = []
        
        # Check for missing summary
        if not re.search(r'summary|objective|profile', text, re.IGNORECASE):
            weaknesses.append(ResumeWeakness(
                category="Missing Summary",
                severity="medium",
                description="No professional summary or objective found",
                suggestion="Add a compelling summary at the top of your resume",
                impact="Reduces initial impact and clarity of career goals"
            ))
        
        # Check for generic language
        generic_phrases = ['responsible for', 'duties include', 'helped with']
        generic_count = sum(1 for phrase in generic_phrases if phrase in text.lower())
        if generic_count > 2:
            weaknesses.append(ResumeWeakness(
                category="Generic Language",
                severity="high",
                description=f"Found {generic_count} generic phrases that weaken impact",
                suggestion="Replace with specific achievements and action verbs",
                impact="Makes resume less compelling and memorable"
            ))
        
        # Check for missing metrics
        if not re.search(r'\d+%|\$\d+|\d+\s+users?|\d+\s+projects?', text):
            weaknesses.append(ResumeWeakness(
                category="Missing Quantifiable Results",
                severity="high",
                description="No specific metrics or quantifiable achievements found",
                suggestion="Add specific numbers, percentages, and measurable outcomes",
                impact="Reduces credibility and impact of achievements"
            ))
        
        # Check for passive voice
        passive_patterns = [r'was\s+\w+ed', r'were\s+\w+ed', r'been\s+\w+ed']
        passive_count = sum(len(re.findall(pattern, text, re.IGNORECASE)) for pattern in passive_patterns)
        if passive_count > 3:
            weaknesses.append(ResumeWeakness(
                category="Passive Voice",
                severity="medium",
                description=f"Found {passive_count} instances of passive voice",
                suggestion="Use active voice and strong action verbs",
                impact="Makes achievements sound less impactful"
            ))
        
        # Check for spelling/grammar issues (basic check)
        common_typos = ['teh', 'recieve', 'seperate', 'occured']
        typo_count = sum(1 for typo in common_typos if typo in text.lower())
        if typo_count > 0:
            weaknesses.append(ResumeWeakness(
                category="Potential Typos",
                severity="low",
                description=f"Found {typo_count} potential spelling issues",
                suggestion="Proofread carefully and use spell check",
                impact="Creates negative first impression"
            ))
        
        return weaknesses
        
    except Exception as e:
        logger.error(f"Error detecting weaknesses: {str(e)}")
        return []

# Job matching functions
def calculate_semantic_similarity(text1: str, text2: str) -> float:
    """Calculate semantic similarity between two texts"""
    try:
        if sentence_model is None:
            return 0.5
        
        embeddings1 = sentence_model.encode([text1])
        embeddings2 = sentence_model.encode([text2])
        
        similarity = cosine_similarity(embeddings1, embeddings2)[0][0]
        return float(similarity)
    except Exception as e:
        logger.error(f"Error calculating semantic similarity: {str(e)}")
        return 0.5

def calculate_keyword_match(resume_keywords: List[str], job_text: str) -> float:
    """Calculate keyword match score"""
    try:
        if not resume_keywords:
            return 0.0
        
        job_text_lower = job_text.lower()
        matched_keywords = sum(1 for keyword in resume_keywords if keyword.lower() in job_text_lower)
        return min(1.0, matched_keywords / len(resume_keywords))
    except Exception as e:
        logger.error(f"Error calculating keyword match: {str(e)}")
        return 0.0

def normalize_job_data(job: Dict) -> Dict:
    """Normalize job data structure from different sources"""
    try:
        # Handle different job formats from different sources
        source = job.get('source', 'unknown')
        
        if source.startswith('adzuna'):
            # Adzuna format
            return {
                'job_id': str(job.get('id', '')),
                'title': job.get('title', job.get('display_name', 'Unknown Position')),
                'company': job.get('company', {}).get('display_name', 'Unknown Company'),
                'location': job.get('location', {}).get('display_name', 'Remote'),
                'description': job.get('description', ''),
                'tags': job.get('category', {}).get('label', '').split(', ') if job.get('category', {}).get('label') else [],
                'salary': f"{job.get('salary_min', '')} - {job.get('salary_max', '')}" if job.get('salary_min') or job.get('salary_max') else 'Not specified',
                'url': job.get('redirect_url', ''),
                'posted_date': job.get('created', ''),
                'source': source,
                'match_score': 0.0,
                'semantic_score': 0.0,
                'keyword_score': 0.0
            }
        else:
            # RemoteOK or sample format
            return {
                'job_id': str(job.get('id', '')),
                'title': job.get('position', job.get('title', 'Unknown Position')),
                'company': job.get('company', 'Unknown Company'),
                'location': job.get('location', 'Remote'),
                'description': job.get('description', ''),
                'tags': job.get('tags', []),
                'salary': job.get('salary', 'Not specified'),
                'url': job.get('url', ''),
                'posted_date': job.get('date', ''),
                'source': source,
                'match_score': 0.0,
                'semantic_score': 0.0,
                'keyword_score': 0.0
            }
    except Exception as e:
        logger.error(f"Error normalizing job data: {str(e)}")
        return {}

async def refresh_jobs_data():
    """Refresh job data from multiple sources (RemoteOK and Adzuna)"""
    global jobs_data, job_index, job_vectorizer
    
    try:
        logger.info("Refreshing job data from multiple sources...")
        scraper = JobScraper()
        all_jobs = []
        
        # Fetch from RemoteOK
        try:
            remoteok_jobs = await scraper.fetch_remoteok_jobs(limit=100)
            if remoteok_jobs:
                for job in remoteok_jobs:
                    job['source'] = 'remoteok'
                all_jobs.extend(remoteok_jobs)
                logger.info(f"Fetched {len(remoteok_jobs)} jobs from RemoteOK")
        except Exception as e:
            logger.error(f"Error fetching from RemoteOK: {str(e)}")
        
        # Fetch from Adzuna (multiple countries)
        countries = ["us", "gb", "au", "ca"]
        for country in countries:
            try:
                adzuna_jobs = await scraper.fetch_adzuna_jobs(limit=50, location=country)
                if adzuna_jobs:
                    for job in adzuna_jobs:
                        job['source'] = f'adzuna_{country}'
                    all_jobs.extend(adzuna_jobs)
                    logger.info(f"Fetched {len(adzuna_jobs)} jobs from Adzuna {country}")
            except Exception as e:
                logger.error(f"Error fetching from Adzuna {country}: {str(e)}")
        
        if all_jobs:
            # Normalize and deduplicate jobs
            normalized_jobs = []
            seen_ids = set()
            
            for job in all_jobs:
                normalized_job = normalize_job_data(job)
                job_id = normalized_job.get('job_id', '')
                
                if job_id and job_id not in seen_ids:
                    seen_ids.add(job_id)
                    normalized_jobs.append(normalized_job)
            
            jobs_data = normalized_jobs
            
            # Create TF-IDF vectors for job matching
            job_descriptions = [job.get('description', '') + ' ' + ' '.join(job.get('tags', [])) for job in jobs_data]
            
            if job_descriptions:
                tfidf_matrix = job_vectorizer.fit_transform(job_descriptions)
                
                # Create FAISS index for fast similarity search
                vectors = tfidf_matrix.toarray().astype('float32')
                dimension = vectors.shape[1]
                
                job_index = faiss.IndexFlatIP(dimension)
                job_index.add(vectors)
                
                logger.info(f"Updated job data: {len(jobs_data)} jobs from multiple sources, FAISS index created")
            else:
                logger.warning("No job descriptions available for indexing")
        else:
            logger.warning("No jobs fetched from any source, using sample data")
            # Use sample data as fallback
            sample_jobs = scraper.get_sample_jobs(20)
            jobs_data = [normalize_job_data(job) for job in sample_jobs]
            
    except Exception as e:
        logger.error(f"Error refreshing job data: {str(e)}")
        # Use sample data as fallback
        scraper = JobScraper()
        sample_jobs = scraper.get_sample_jobs(20)
        jobs_data = [normalize_job_data(job) for job in sample_jobs]

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

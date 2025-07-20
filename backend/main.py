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

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="JobsDreamer API", description="AI Career Assistant")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
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

class ResumeAnalysis(BaseModel):
    skills: List[str]
    experience_years: Optional[int]
    job_titles: List[str]
    education: List[str]
    keywords: List[str]
    summary: str

class JobSearchRequest(BaseModel):
    query: str
    location: Optional[str] = None
    job_type: Optional[str] = None
    limit: int = 20

class MatchRequest(BaseModel):
    resume_text: str
    job_preferences: Optional[Dict[str, Any]] = {}

# RemoteOK API integration
class RemoteOKScraper:
    def __init__(self):
        self.base_url = "https://remoteok.io/api"
        self.session = None
    
    async def get_session(self):
        if self.session is None:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def fetch_jobs(self, limit: int = 100) -> List[Dict]:
        """Fetch jobs from RemoteOK API"""
        session = await self.get_session()
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
        }
        
        try:
            async with session.get(self.base_url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    # RemoteOK returns array where first item might be metadata
                    jobs = [job for job in data if isinstance(job, dict) and 'id' in job]
                    return jobs[:limit]
                else:
                    logger.error(f"Failed to fetch jobs: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching jobs: {str(e)}")
            return []
    
    async def search_jobs(self, query: str, limit: int = 50) -> List[Dict]:
        """Search for specific jobs"""
        all_jobs = await self.fetch_jobs(limit * 2)
        
        # Filter jobs based on query
        query_lower = query.lower()
        filtered_jobs = []
        
        for job in all_jobs:
            title = job.get('position', '').lower()
            description = job.get('description', '').lower()
            tags = ' '.join(job.get('tags', [])).lower()
            
            if (query_lower in title or 
                query_lower in description or 
                query_lower in tags or
                any(word in title or word in description for word in query_lower.split())):
                filtered_jobs.append(job)
        
        return filtered_jobs[:limit]

# Initialize scraper
scraper = RemoteOKScraper()

# Resume processing functions
def extract_text_from_pdf(pdf_file: bytes) -> str:
    """Extract text from PDF resume"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        logger.error(f"Error extracting PDF text: {str(e)}")
        return ""

def analyze_resume(text: str) -> ResumeAnalysis:
    """Analyze resume text and extract key information"""
    
    # Extract skills using improved patterns
    skills_patterns = [
        r'(?:skills?|technologies?|tools?|technical\s+skills?):?\s*([^\n]+)',
        r'(?:proficient|experienced?)\s+(?:in|with):?\s*([^\n]+)',
        r'(?:languages?|frameworks?|platforms?):?\s*([^\n]+)',
        r'(?:programming|software)\s+(?:languages?|skills?):?\s*([^\n]+)'
    ]
    
    skills = set()
    for pattern in skills_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            # Split by common separators and clean
            skill_items = re.split(r'[,;•·\-\|\n\r\t/]', match)
            for skill in skill_items:
                skill = skill.strip()
                # Filter reasonable skills - remove common words and improve validation
                if (len(skill) > 1 and len(skill) < 30 and 
                    not skill.lower() in ['and', 'or', 'with', 'in', 'of', 'the', 'a', 'an', 'to', 'for', 'on', 'at', 'by', 'from']):
                    skills.add(skill)
    
    # Add technology-specific pattern matching
    tech_patterns = [
        r'\b(Python|Java|JavaScript|TypeScript|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|React|Angular|Vue|Node\.js|Django|Flask|Spring|Express|Laravel|Rails|AWS|Azure|GCP|Docker|Kubernetes|Git|SQL|MongoDB|PostgreSQL|MySQL|Redis|Elasticsearch|Spark|Hadoop|TensorFlow|PyTorch|Pandas|NumPy|Scikit-learn|HTML|CSS|Bootstrap|Tailwind|jQuery|Webpack|Jest|Cypress|Jenkins|Terraform|Ansible|Linux|Windows|macOS|Bash|PowerShell|REST|GraphQL|Microservices|API|JSON|XML|YAML|Agile|Scrum|Kanban|CI/CD|DevOps|Machine Learning|Deep Learning|Data Science|Analytics|Tableau|Power BI|Excel|Photoshop|Illustrator|Figma|Sketch)\b',
    ]
    
    for pattern in tech_patterns:
        tech_matches = re.findall(pattern, text, re.IGNORECASE)
        for tech in tech_matches:
            skills.add(tech)
    
    # Extract experience years with improved patterns
    exp_patterns = [
        r'(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)',
        r'(\d+)\+?\s*years?\s*(?:in|with|as)',
        r'experience:?\s*(\d+)\+?\s*years?',
        r'(\d+)\+?\s*yrs?\s*(?:of\s*)?(?:experience|exp)',
        r'over\s+(\d+)\s+years?',
        r'more\s+than\s+(\d+)\s+years?'
    ]
    
    experience_years = None
    for pattern in exp_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            years = int(match.group(1))
            if 0 <= years <= 50:  # Reasonable range
                experience_years = years
                break
    
    # Extract job titles with improved patterns
    job_title_patterns = [
        r'(?:position|title|role|job\s+title):?\s*([^\n]+)',
        r'(?:worked\s+as|serving\s+as|employed\s+as):?\s*([^\n]+)',
        r'\b([A-Z][a-z]*\s+(?:Engineer|Developer|Manager|Analyst|Designer|Architect|Lead|Senior|Junior|Principal|Staff|Director|VP|Vice\s+President|CTO|CEO|Programmer|Specialist|Consultant|Coordinator|Administrator|Supervisor|Associate|Assistant|Intern))\b',
        r'\b(Software\s+Engineer|Data\s+Scientist|Product\s+Manager|Project\s+Manager|DevOps\s+Engineer|Full\s+Stack\s+Developer|Frontend\s+Developer|Backend\s+Developer|Mobile\s+Developer|UI/UX\s+Designer|Quality\s+Assurance|Business\s+Analyst|System\s+Administrator|Technical\s+Writer|Scrum\s+Master|Solutions\s+Architect)\b'
    ]
    
    job_titles = set()
    for pattern in job_title_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            title = match.strip()
            # Clean up common prefixes/suffixes
            title = re.sub(r'^(at|in|as)\s+', '', title, flags=re.IGNORECASE)
            title = re.sub(r'\s+(at|in|with)\s+.*$', '', title, flags=re.IGNORECASE)
            
            if len(title) > 3 and len(title) < 60:
                job_titles.add(title.title())
    
    # Extract education with significantly improved patterns
    education_patterns = [
        # Direct degree mentions
        r'(?:bachelor|bachelor\'s|bs|b\.s\.|ba|b\.a\.)\s+(?:of\s+)?(?:science\s+)?(?:in\s+)?([^,\n\.]+)',
        r'(?:master|master\'s|ms|m\.s\.|ma|m\.a\.)\s+(?:of\s+)?(?:science\s+)?(?:in\s+)?([^,\n\.]+)',
        r'(?:phd|ph\.d\.|doctorate|doctoral)\s+(?:in\s+)?([^,\n\.]+)',
        r'(?:mba|m\.b\.a\.)\s*(?:in\s+)?([^,\n\.]*)',
        
        # Education section headers
        r'education:?\s*\n([^\n]+)',
        r'academic\s+background:?\s*\n([^\n]+)',
        r'qualifications?:?\s*\n([^\n]+)',
        
        # University/College patterns
        r'(?:university|college|institute|school)\s+of\s+([^,\n\.]+)',
        r'([^,\n\.]+)\s+(?:university|college|institute)',
        
        # Graduation patterns
        r'graduated\s+(?:from\s+)?(?:with\s+)?(?:a\s+)?([^,\n\.]+)',
        r'degree\s+in\s+([^,\n\.]+)',
        r'studied\s+([^,\n\.]+)',
        
        # Certificate patterns
        r'certificate\s+(?:in\s+)?([^,\n\.]+)',
        r'certification\s+(?:in\s+)?([^,\n\.]+)',
        r'certified\s+(?:in\s+)?([^,\n\.]+)'
    ]
    
    education = set()
    for pattern in education_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            edu = match.strip()
            # Clean up the education string
            edu = re.sub(r'^\W+|\W+$', '', edu)  # Remove leading/trailing non-word chars
            edu = re.sub(r'\s+', ' ', edu)  # Normalize whitespace
            
            # Filter out very short or very long matches, and common false positives
            if (3 < len(edu) < 100 and 
                not edu.lower() in ['and', 'or', 'with', 'in', 'of', 'the', 'a', 'an', 'to', 'for'] and
                not re.match(r'^\d+$', edu)):  # Not just numbers
                education.add(edu.title())
    
    # If no education found with patterns, try a more general approach
    if not education:
        # Look for lines that might contain education info
        lines = text.split('\n')
        in_education_section = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if this line indicates start of education section
            if re.search(r'\b(education|academic|qualification|degree|university|college)\b', line, re.IGNORECASE):
                in_education_section = True
                # If the line contains more than just the header, extract it
                if len(line) > 20:
                    education.add(line)
                continue
            
            # If we're in education section and find a line with education keywords
            if in_education_section:
                if re.search(r'\b(bachelor|master|phd|university|college|degree|certificate|gpa)\b', line, re.IGNORECASE):
                    education.add(line)
                # Stop if we hit another section
                elif re.search(r'\b(experience|work|employment|skills|projects)\b', line, re.IGNORECASE):
                    in_education_section = False
    
    # Extract keywords using improved TF-IDF approach
    try:
        # Preprocess text for better keyword extraction
        processed_text = re.sub(r'[^\w\s]', ' ', text.lower())
        words = re.findall(r'\b[a-zA-Z]{3,}\b', processed_text)
        
        # Extended stop words list
        stop_words = {
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 
            'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 
            'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 
            'did', 'let', 'put', 'say', 'she', 'too', 'use', 'will', 'with', 'have',
            'this', 'that', 'they', 'been', 'their', 'said', 'each', 'which', 'what',
            'were', 'would', 'there', 'could', 'other', 'after', 'first', 'well',
            'work', 'years', 'year', 'experience', 'including', 'using', 'also'
        }
        
        word_freq = {}
        for word in words:
            if word not in stop_words and len(word) > 2:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Get top keywords with frequency > 1
        keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:25]
        keywords = [word for word, freq in keywords if freq > 1]
    except:
        keywords = list(skills)[:10]  # Fallback to skills
    
    # Generate improved summary
    summary = f"Resume contains {len(skills)} identified skills"
    if experience_years:
        summary += f" with {experience_years} years of experience"
    if job_titles:
        summary += f". Previous roles include: {', '.join(list(job_titles)[:3])}"
    if education:
        summary += f". Education: {len(education)} qualification(s) found"
    
    return ResumeAnalysis(
        skills=list(skills)[:30],  # Increased limit
        experience_years=experience_years,
        job_titles=list(job_titles)[:15],  # Increased limit
        education=list(education)[:10],  # Increased limit
        keywords=keywords[:20],  # Increased limit
        summary=summary
    )

# Job matching functions
def calculate_semantic_similarity(text1: str, text2: str) -> float:
    """Calculate semantic similarity between two texts"""
    try:
        embeddings = sentence_model.encode([text1, text2])
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return float(similarity)
    except Exception as e:
        logger.error(f"Error calculating semantic similarity: {str(e)}")
        return 0.0

def calculate_keyword_match(resume_keywords: List[str], job_text: str) -> float:
    """Calculate keyword matching score"""
    if not resume_keywords:
        return 0.0
    
    job_text_lower = job_text.lower()
    matches = sum(1 for keyword in resume_keywords if keyword.lower() in job_text_lower)
    return matches / len(resume_keywords)

def normalize_job_data(job: Dict) -> Dict:
    """Normalize job data from RemoteOK format"""
    return {
        'id': str(job.get('id', '')),
        'title': job.get('position', 'Unknown Position'),
        'company': job.get('company', 'Unknown Company'),
        'location': job.get('location', 'Remote'),
        'description': job.get('description', ''),
        'tags': job.get('tags', []),
        'salary': f"${job.get('salary_min', 0)}-${job.get('salary_max', 0)}" if job.get('salary_min') else None,
        'url': job.get('url', ''),
        'posted_date': job.get('date', ''),
        'logo': job.get('logo', ''),
        'original': job
    }

async def refresh_jobs_data():
    """Refresh the global jobs data and rebuild FAISS index"""
    global job_index, jobs_data
    
    logger.info("Refreshing jobs data...")
    
    try:
        # Fetch fresh jobs from RemoteOK
        raw_jobs = await scraper.fetch_jobs(200)
        
        if not raw_jobs:
            logger.warning("No jobs fetched from RemoteOK")
            return
        
        # Normalize job data
        jobs_data = [normalize_job_data(job) for job in raw_jobs]
        
        # Create embeddings for semantic search
        job_texts = []
        for job in jobs_data:
            job_text = f"{job['title']} {job['company']} {job['description']} {' '.join(job['tags'])}"
            job_texts.append(job_text)
        
        # Create FAISS index
        embeddings = sentence_model.encode(job_texts)
        
        # Build FAISS index
        dimension = embeddings.shape[1]
        job_index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        job_index.add(embeddings.astype('float32'))
        
        logger.info(f"Successfully loaded {len(jobs_data)} jobs and built FAISS index")
        
    except Exception as e:
        logger.error(f"Error refreshing jobs data: {str(e)}")

# API Endpoints

@app.get("/")
async def root():
    return {"message": "JobsDreamer API is running!", "jobs_count": len(jobs_data)}

@app.get("/jobs", response_model=List[JobMatch])
async def get_jobs(limit: int = 20, search: Optional[str] = None):
    """Get all jobs or search jobs"""
    
    if not jobs_data:
        await refresh_jobs_data()
    
    if search:
        # Use semantic search
        try:
            query_embedding = sentence_model.encode([search])
            faiss.normalize_L2(query_embedding)
            
            scores, indices = job_index.search(query_embedding.astype('float32'), min(limit, len(jobs_data)))
            
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < len(jobs_data):
                    job = jobs_data[idx]
                    job_match = JobMatch(
                        job_id=job['id'],
                        title=job['title'],
                        company=job['company'],
                        location=job['location'],
                        description=job['description'][:500] + "..." if len(job['description']) > 500 else job['description'],
                        tags=job['tags'],
                        salary=job['salary'],
                        url=job['url'],
                        match_score=float(score),
                        semantic_score=float(score),
                        keyword_score=0.0,
                        posted_date=job['posted_date']
                    )
                    results.append(job_match)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in semantic search: {str(e)}")
            # Fallback to keyword search
            filtered_jobs = [job for job in jobs_data if search.lower() in job['title'].lower() or search.lower() in job['description'].lower()]
            
    else:
        filtered_jobs = jobs_data[:limit]
    
    # Convert to JobMatch format
    results = []
    for job in filtered_jobs[:limit]:
        job_match = JobMatch(
            job_id=job['id'],
            title=job['title'],
            company=job['company'],
            location=job['location'],
            description=job['description'][:500] + "..." if len(job['description']) > 500 else job['description'],
            tags=job['tags'],
            salary=job['salary'],
            url=job['url'],
            match_score=1.0,
            semantic_score=1.0,
            keyword_score=1.0,
            posted_date=job['posted_date']
        )
        results.append(job_match)
    
    return results

@app.post("/analyze-resume", response_model=ResumeAnalysis)
async def analyze_resume_endpoint(file: UploadFile = File(...)):
    """Analyze uploaded resume"""
    
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    try:
        content = await file.read()
        
        # Extract text based on file type
        if file.filename.endswith('.pdf'):
            text = extract_text_from_pdf(content)
        else:
            # Assume text file
            text = content.decode('utf-8')
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        
        # Analyze resume
        analysis = analyze_resume(text)
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing resume: {str(e)}")

@app.post("/match-jobs", response_model=List[JobMatch])
async def match_jobs_endpoint(request: MatchRequest):
    """Find matching jobs based on resume"""
    
    if not jobs_data:
        await refresh_jobs_data()
    
    try:
        # Analyze resume
        resume_analysis = analyze_resume(request.resume_text)
        
        # Create resume profile for matching
        resume_profile = f"{' '.join(resume_analysis.skills)} {' '.join(resume_analysis.job_titles)} {' '.join(resume_analysis.keywords)}"
        
        # Use semantic search to find similar jobs
        query_embedding = sentence_model.encode([resume_profile])
        faiss.normalize_L2(query_embedding)
        
        # Search for top matches
        scores, indices = job_index.search(query_embedding.astype('float32'), min(50, len(jobs_data)))
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(jobs_data):
                job = jobs_data[idx]
                
                # Calculate additional scores
                job_text = f"{job['title']} {job['description']} {' '.join(job['tags'])}"
                keyword_score = calculate_keyword_match(resume_analysis.keywords, job_text)
                
                # Combined score
                combined_score = (float(score) * 0.6) + (keyword_score * 0.4)
                
                job_match = JobMatch(
                    job_id=job['id'],
                    title=job['title'],
                    company=job['company'],
                    location=job['location'],
                    description=job['description'][:500] + "..." if len(job['description']) > 500 else job['description'],
                    tags=job['tags'],
                    salary=job['salary'],
                    url=job['url'],
                    match_score=combined_score,
                    semantic_score=float(score),
                    keyword_score=keyword_score,
                    posted_date=job['posted_date']
                )
                results.append(job_match)
        
        # Sort by combined match score
        results.sort(key=lambda x: x.match_score, reverse=True)
        
        return results[:20]  # Return top 20 matches
        
    except Exception as e:
        logger.error(f"Error matching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error matching jobs: {str(e)}")

@app.post("/refresh-jobs")
async def refresh_jobs_endpoint():
    """Manually refresh jobs data"""
    await refresh_jobs_data()
    return {"message": f"Jobs data refreshed successfully. Total jobs: {len(jobs_data)}"}

@app.get("/job/{job_id}")
async def get_job_details(job_id: str):
    """Get detailed job information"""
    
    for job in jobs_data:
        if job['id'] == job_id:
            return job
    
    raise HTTPException(status_code=404, detail="Job not found")

if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 8000))  # default to 8000 if PORT is not set
    uvicorn.run("main:app", host="0.0.0.0", port=port)

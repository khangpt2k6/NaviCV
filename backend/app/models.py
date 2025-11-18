from pydantic import BaseModel
from typing import List, Optional, Dict, Any


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

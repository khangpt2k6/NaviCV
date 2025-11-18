import logging
from typing import Dict, List

import faiss
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .models import JobMatch


logger = logging.getLogger(__name__)


def calculate_semantic_similarity(sentence_model, text1: str, text2: str) -> float:
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
    try:
        if not resume_keywords:
            return 0.0
        
        stop_words = {
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 
            'the', 'to', 'was', 'will', 'with', 'you', 'your', 'i', 'we', 'this',
            'role', 'this', 'team', 'our', 'we', 'have', 'all', 'you', 'their'
        }
        
        job_text_lower = job_text.lower()
        meaningful_keywords = [
            k for k in resume_keywords 
            if k.lower() not in stop_words and len(k) > 2
        ]
        
        if not meaningful_keywords:
            return 0.0
            
        matched_keywords = sum(
            1 for keyword in meaningful_keywords 
            if keyword.lower() in job_text_lower
        )
        return matched_keywords / len(meaningful_keywords)
    except Exception as e:
        logger.error(f"Error calculating keyword match: {str(e)}")
        return 0.0


def normalize_job_data(job: Dict) -> Dict:
    try:
        source = job.get("source", "unknown")
        if source.startswith("adzuna"):
            return {
                "job_id": str(job.get("id", "")),
                "title": job.get("title", job.get("display_name", "Unknown Position")),
                "company": job.get("company", {}).get("display_name", "Unknown Company"),
                "location": job.get("location", {}).get("display_name", "Remote"),
                "description": job.get("description", ""),
                "tags": job.get("category", {}).get("label", "").split(", ") if job.get("category", {}).get("label") else [],
                "salary": f"{job.get('salary_min', '')} - {job.get('salary_max', '')}" if job.get("salary_min") or job.get("salary_max") else "Not specified",
                "url": job.get("redirect_url", ""),
                "posted_date": job.get("created", ""),
                "source": source,
                "match_score": 0.0,
                "semantic_score": 0.0,
                "keyword_score": 0.0,
            }
        else:
            return {
                "job_id": str(job.get("id", "")),
                "title": job.get("position", job.get("title", "Unknown Position")),
                "company": job.get("company", "Unknown Company"),
                "location": job.get("location", "Remote"),
                "description": job.get("description", ""),
                "tags": job.get("tags", []),
                "salary": job.get("salary", "Not specified"),
                "url": job.get("url", ""),
                "posted_date": job.get("date", ""),
                "source": source,
                "match_score": 0.0,
                "semantic_score": 0.0,
                "keyword_score": 0.0,
            }
    except Exception as e:
        logger.error(f"Error normalizing job data: {str(e)}")
        return {}


def build_vectorizer_and_index(job_texts: List[str]):
    vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(job_texts)
    vectors = tfidf_matrix.toarray().astype("float32")
    dimension = vectors.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(vectors)
    return vectorizer, index



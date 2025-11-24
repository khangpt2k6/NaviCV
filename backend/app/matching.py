import logging
import re
from typing import Dict, List

import faiss
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .models import JobMatch


logger = logging.getLogger(__name__)


def clean_text_encoding(text: str) -> str:
    if not text:
        return ""
    
    cleaned = text.replace('Â ', ' ').replace('Â', '')
    
    # Fix common UTF-8 encoding issues - apostrophes and quotes
    cleaned = cleaned.replace('â€™', "'").replace('â€œ', '"').replace('â€', '"')
    cleaned = cleaned.replace('â€"', '—').replace('â€"', '–').replace('â€¦', '…')
    cleaned = cleaned.replace('â€"', '™').replace('â€"', '"').replace('â€"', '"')
    
    # Fix apostrophe variations (including when word starts with it)
    cleaned = cleaned.replace('â€™s', "'s").replace('â€™t', "'t")
    cleaned = cleaned.replace('â€™ll', "'ll").replace('â€™ve', "'ve")
    cleaned = cleaned.replace('â€™re', "'re").replace('â€™m', "'m")
    cleaned = cleaned.replace('â€™d', "'d")
    
    # Fix common Latin character encoding issues
    cleaned = cleaned.replace('Ã¡', 'á').replace('Ã©', 'é').replace('Ã­', 'í')
    cleaned = cleaned.replace('Ã³', 'ó').replace('Ãº', 'ú').replace('Ã±', 'ñ')
    cleaned = cleaned.replace('Ã¡', 'Á').replace('Ã‰', 'É').replace('Ã', 'Í')
    cleaned = cleaned.replace('Ã"', 'Ó').replace('Ãš', 'Ú').replace('Ã\'', 'Ñ')
    
    # Fix HTML entities
    cleaned = cleaned.replace('&lt;', '<').replace('&gt;', '>')
    cleaned = cleaned.replace('&amp;', '&').replace('&quot;', '"')
    cleaned = cleaned.replace('&#x27;', "'").replace('&#39;', "'")
    cleaned = cleaned.replace('&nbsp;', ' ').replace('&mdash;', '—')
    cleaned = cleaned.replace('&ndash;', '–')
    
    cleaned = re.sub(r'([a-z])orldâ€™s', r'\1orld\'s', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\borldâ€™s\b', "world's", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.replace('orldâ€™s', "world's")
    
    return cleaned


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
            title = clean_text_encoding(job.get("title", job.get("display_name", "Unknown Position")))
            company = clean_text_encoding(job.get("company", {}).get("display_name", "Unknown Company"))
            location = clean_text_encoding(job.get("location", {}).get("display_name", "Remote"))
            description = clean_text_encoding(job.get("description", ""))
            category_label = clean_text_encoding(job.get("category", {}).get("label", ""))
            tags = category_label.split(", ") if category_label else []
            
            return {
                "job_id": str(job.get("id", "")),
                "title": title,
                "company": company,
                "location": location,
                "description": description,
                "tags": tags,
                "salary": f"{job.get('salary_min', '')} - {job.get('salary_max', '')}" if job.get("salary_min") or job.get("salary_max") else "Not specified",
                "url": job.get("redirect_url", ""),
                "posted_date": job.get("created", ""),
                "source": source,
                "match_score": 0.0,
                "semantic_score": 0.0,
                "keyword_score": 0.0,
            }
        else:
            title = clean_text_encoding(job.get("position", job.get("title", "Unknown Position")))
            company = clean_text_encoding(job.get("company", "Unknown Company"))
            location = clean_text_encoding(job.get("location", "Remote"))
            description = clean_text_encoding(job.get("description", ""))
            tags = [clean_text_encoding(tag) for tag in job.get("tags", [])]
            
            return {
                "job_id": str(job.get("id", "")),
                "title": title,
                "company": company,
                "location": location,
                "description": description,
                "tags": tags,
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



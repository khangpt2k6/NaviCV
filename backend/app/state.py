import logging
from typing import List, Optional

import faiss
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer

from .matching import build_vectorizer_and_index, normalize_job_data
from .scraping import JobScraper


logger = logging.getLogger(__name__)


sentence_model: Optional[SentenceTransformer] = None
nlp = None
job_vectorizer: Optional[TfidfVectorizer] = None
job_index: Optional[faiss.Index] = None
jobs_data: List[dict] = []


async def initialize_models(load_spacy=True):
    global sentence_model, nlp, job_vectorizer, job_index, jobs_data
    logger.info("Loading AI models...")

    sentence_model = SentenceTransformer("all-MiniLM-L6-v2")

    if load_spacy:
        try:
            import spacy  # local import to avoid mandatory dependency at import time

            globals()["nlp"] = spacy.load("en_core_web_sm")
        except Exception:
            logger.warning("spaCy model not found, using basic processing")
            globals()["nlp"] = None

    job_vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
    job_index = None
    jobs_data = []

    await refresh_jobs_data()
    logger.info("Models loaded successfully!")


async def refresh_jobs_data():
    global jobs_data, job_index, job_vectorizer
    try:
        logger.info("Refreshing job data from multiple sources...")
        scraper = JobScraper()
        all_jobs = []

        try:
            remoteok_jobs = await scraper.fetch_remoteok_jobs(limit=100)
            if remoteok_jobs:
                for job in remoteok_jobs:
                    job["source"] = "remoteok"
                all_jobs.extend(remoteok_jobs)
                logger.info(f"Fetched {len(remoteok_jobs)} jobs from RemoteOK")
        except Exception as e:
            logger.error(f"Error fetching from RemoteOK: {str(e)}")

        countries = ["us", "gb", "au", "ca"]
        for country in countries:
            try:
                adzuna_jobs = await scraper.fetch_adzuna_jobs(limit=50, location=country)
                if adzuna_jobs:
                    for job in adzuna_jobs:
                        job["source"] = f"adzuna_{country}"
                    all_jobs.extend(adzuna_jobs)
                    logger.info(f"Fetched {len(adzuna_jobs)} jobs from Adzuna {country}")
            except Exception as e:
                logger.error(f"Error fetching from Adzuna {country}: {str(e)}")

        if all_jobs:
            normalized_jobs = []
            seen_ids = set()
            for job in all_jobs:
                normalized_job = normalize_job_data(job)
                job_id = normalized_job.get("job_id", "")
                if job_id and job_id not in seen_ids:
                    seen_ids.add(job_id)
                    normalized_jobs.append(normalized_job)

            jobs_data = normalized_jobs

            job_descriptions = [job.get("description", "") + " " + " ".join(job.get("tags", [])) for job in jobs_data]
            if job_descriptions:
                vectorizer, index = build_vectorizer_and_index(job_descriptions)
                job_vectorizer = vectorizer
                job_index = index
                logger.info(
                    f"Updated job data: {len(jobs_data)} jobs from multiple sources, FAISS index created"
                )
            else:
                logger.warning("No job descriptions available for indexing")
        else:
            logger.warning("No jobs fetched from any source, using sample data")
            sample_jobs = JobScraper().get_sample_jobs(20)
            jobs_data = [normalize_job_data(job) for job in sample_jobs]
    except Exception as e:
        logger.error(f"Error refreshing job data: {str(e)}")
        sample_jobs = JobScraper().get_sample_jobs(20)
        jobs_data = [normalize_job_data(job) for job in sample_jobs]



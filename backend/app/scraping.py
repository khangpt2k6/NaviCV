import logging
import os
from typing import List, Dict, Optional

import aiohttp


logger = logging.getLogger(__name__)


class JobScraper:
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.adzuna_app_id = os.getenv("ADZUNA_ID", "b378129d")
        self.adzuna_api_key = os.getenv("ADZUNA_KEY", "5ef0ccf9f33b02439a214464c4a8b9f3")
        self.adzuna_base_url = "https://api.adzuna.com/v1/api/jobs"

    async def get_session(self) -> aiohttp.ClientSession:
        if self.session is None:
            self.session = aiohttp.ClientSession()
        return self.session

    async def close(self) -> None:
        try:
            if self.session is not None and not self.session.closed:
                await self.session.close()
        finally:
            self.session = None

    async def fetch_remoteok_jobs(self, limit: int = 50) -> List[Dict]:
        try:
            session = await self.get_session()
            endpoints = [
                "https://remoteok.io/api/jobs",
                "https://remoteok.io/api",
            ]
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            }

            for endpoint in endpoints:
                try:
                    async with session.get(endpoint, headers=headers, timeout=30) as response:
                        if response.status == 200:
                            jobs = await response.json()
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
        if not self.adzuna_app_id or not self.adzuna_api_key:
            logger.warning("Adzuna API credentials not configured")
            return []

        try:
            session = await self.get_session()
            country_endpoints = {
                "us": "https://api.adzuna.com/v1/api/jobs/us/search/1",
                "gb": "https://api.adzuna.com/v1/api/jobs/gb/search/1",
                "au": "https://api.adzuna.com/v1/api/jobs/au/search/1",
                "ca": "https://api.adzuna.com/v1/api/jobs/ca/search/1",
            }
            endpoint = country_endpoints.get(location, country_endpoints["us"])
            params = {
                "app_id": self.adzuna_app_id,
                "app_key": self.adzuna_api_key,
                "results_per_page": min(limit, 50),
                "content-type": "application/json",
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
        try:
            session = await self.get_session()
            params = {"search": query, "limit": limit}
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
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
        if not self.adzuna_app_id or not self.adzuna_api_key:
            return []

        try:
            session = await self.get_session()
            country_endpoints = {
                "us": "https://api.adzuna.com/v1/api/jobs/us/search/1",
                "gb": "https://api.adzuna.com/v1/api/jobs/gb/search/1",
                "au": "https://api.adzuna.com/v1/api/jobs/au/search/1",
                "ca": "https://api.adzuna.com/v1/api/jobs/ca/search/1",
            }
            endpoint = country_endpoints.get(location, country_endpoints["us"])
            params = {
                "app_id": self.adzuna_app_id,
                "app_key": self.adzuna_api_key,
                "what": query,
                "results_per_page": min(limit, 50),
                "content-type": "application/json",
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
        sample_jobs = [
            {"id": "1", "position": "Senior Software Engineer", "company": "TechCorp", "location": "Remote", "description": "We are looking for a Senior Software Engineer to join our team. Experience with Python, React, and cloud technologies required.", "tags": ["python", "react", "aws", "docker"], "salary_min": 80000, "salary_max": 120000, "url": "https://example.com/job1", "date": "2024-01-15", "source": "sample"},
            {"id": "2", "position": "Data Scientist", "company": "DataTech", "location": "San Francisco, CA", "description": "Join our data science team to build machine learning models and analyze large datasets.", "tags": ["python", "machine learning", "sql", "pandas"], "salary_min": 90000, "salary_max": 140000, "url": "https://example.com/job2", "date": "2024-01-14", "source": "sample"},
            {"id": "3", "position": "Frontend Developer", "company": "WebSolutions", "location": "Remote", "description": "Build beautiful and responsive web applications using modern JavaScript frameworks.", "tags": ["javascript", "react", "vue", "css"], "salary_min": 70000, "salary_max": 110000, "url": "https://example.com/job3", "date": "2024-01-13", "source": "sample"},
            {"id": "4", "position": "DevOps Engineer", "company": "CloudTech", "location": "Austin, TX", "description": "Manage our cloud infrastructure and implement CI/CD pipelines for automated deployments.", "tags": ["aws", "docker", "kubernetes", "jenkins"], "salary_min": 85000, "salary_max": 130000, "url": "https://example.com/job4", "date": "2024-01-12", "source": "sample"},
            {"id": "5", "position": "Product Manager", "company": "InnovateCorp", "location": "New York, NY", "description": "Lead product development and work with cross-functional teams to deliver amazing user experiences.", "tags": ["product management", "agile", "user research", "analytics"], "salary_min": 95000, "salary_max": 150000, "url": "https://example.com/job5", "date": "2024-01-11", "source": "sample"},
            {"id": "6", "position": "Backend Developer", "company": "API Solutions", "location": "Seattle, WA", "description": "Build scalable backend services using Node.js, Python, and cloud technologies.", "tags": ["nodejs", "python", "postgresql", "redis"], "salary_min": 75000, "salary_max": 115000, "url": "https://example.com/job6", "date": "2024-01-10", "source": "sample"},
            {"id": "7", "position": "UX/UI Designer", "company": "Design Studio", "location": "Remote", "description": "Create beautiful and intuitive user interfaces for web and mobile applications.", "tags": ["figma", "sketch", "adobe", "prototyping"], "salary_min": 65000, "salary_max": 100000, "url": "https://example.com/job7", "date": "2024-01-09", "source": "sample"},
            {"id": "8", "position": "Machine Learning Engineer", "company": "AI Labs", "location": "Boston, MA", "description": "Develop and deploy machine learning models for production systems.", "tags": ["tensorflow", "pytorch", "mlops", "python"], "salary_min": 100000, "salary_max": 160000, "url": "https://example.com/job8", "date": "2024-01-08", "source": "sample"},
        ]
        return sample_jobs[:limit]



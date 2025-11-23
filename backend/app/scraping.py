import logging
import os
import re
from typing import List, Dict, Optional
from urllib.parse import urljoin, urlparse

import aiohttp
from bs4 import BeautifulSoup


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

    async def scrape_jobs_from_html(self, url: str, limit: int = 50) -> List[Dict]:
        """Scrape jobs from HTML pages using BeautifulSoup"""
        try:
            session = await self.get_session()
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate",
            }
            
            async with session.get(url, headers=headers, timeout=30) as response:
                if response.status != 200:
                    logger.warning(f"Failed to fetch {url}: {response.status}")
                    return []
                
                # Get content and handle encoding properly
                content = await response.read()
                text = content.decode('utf-8', errors='ignore')
                
                # Fix common encoding issues (double-encoded UTF-8)
                text = text.replace('Â ', ' ').replace('Â', '')
                text = text.replace('â€™', "'").replace('â€œ', '"').replace('â€', '"')
                text = text.replace('â€"', '—').replace('â€"', '–').replace('â€¦', '…')
                text = text.replace('Ã¡', 'á').replace('Ã©', 'é').replace('Ã­', 'í')
                text = text.replace('Ã³', 'ó').replace('Ãº', 'ú').replace('Ã±', 'ñ')
                
                soup = BeautifulSoup(text, 'html.parser')
                jobs = []
                
                # Try to find job listings (common patterns)
                # Look for common job listing containers
                job_elements = soup.find_all(['article', 'div', 'li'], class_=re.compile(r'job|listing|post|card', re.I))
                
                if not job_elements:
                    # Try alternative selectors
                    job_elements = soup.find_all(['div', 'article'], attrs={'data-job-id': True}) or \
                                  soup.find_all(['div', 'article'], attrs={'id': re.compile(r'job', re.I)})
                
                for element in job_elements[:limit]:
                    try:
                        job = {}
                        
                        # Extract title
                        title_elem = element.find(['h1', 'h2', 'h3', 'h4'], class_=re.compile(r'title|heading|name', re.I))
                        if not title_elem:
                            title_elem = element.find('a', class_=re.compile(r'title|job', re.I))
                        job['title'] = title_elem.get_text(strip=True) if title_elem else 'Untitled Position'
                        
                        # Extract company
                        company_elem = element.find(['span', 'div', 'a'], class_=re.compile(r'company|employer|organization', re.I))
                        if not company_elem:
                            company_elem = element.find('strong', class_=re.compile(r'company', re.I))
                        job['company'] = company_elem.get_text(strip=True) if company_elem else 'Unknown Company'
                        
                        # Extract location
                        location_elem = element.find(['span', 'div'], class_=re.compile(r'location|place|city', re.I))
                        if not location_elem:
                            location_elem = element.find(string=re.compile(r'[A-Z][a-z]+,?\s+[A-Z]{2}|Remote|Remote work', re.I))
                        if location_elem:
                            job['location'] = location_elem.get_text(strip=True) if hasattr(location_elem, 'get_text') else str(location_elem).strip()
                        else:
                            job['location'] = 'Location not specified'
                        
                        # Extract description
                        desc_elem = element.find(['div', 'p', 'span'], class_=re.compile(r'description|summary|details|content', re.I))
                        if not desc_elem:
                            desc_elem = element.find('p')
                        job['description'] = desc_elem.get_text(strip=True, separator=' ') if desc_elem else ''
                        
                        # Extract URL
                        link_elem = element.find('a', href=True)
                        if link_elem:
                            href = link_elem.get('href')
                            job['url'] = urljoin(url, href) if href else url
                        else:
                            job['url'] = url
                        
                        # Extract tags/skills
                        tags = []
                        tag_elements = element.find_all(['span', 'div'], class_=re.compile(r'tag|skill|badge|keyword', re.I))
                        for tag_elem in tag_elements:
                            tag_text = tag_elem.get_text(strip=True)
                            if tag_text and len(tag_text) < 30:  # Reasonable tag length
                                tags.append(tag_text)
                        job['tags'] = tags[:10]  # Limit to 10 tags
                        
                        # Generate job ID
                        job['id'] = f"scraped_{hash(job.get('url', ''))}"
                        
                        if job['title'] and job['title'] != 'Untitled Position':
                            jobs.append(job)
                    except Exception as e:
                        logger.debug(f"Error parsing job element: {str(e)}")
                        continue
                
                logger.info(f"Scraped {len(jobs)} jobs from {url}")
                return jobs
        except Exception as e:
            logger.error(f"Error scraping jobs from {url}: {str(e)}")
            return []

    async def fetch_jobs_from_rss(self, rss_url: str, limit: int = 50) -> List[Dict]:
        """Fetch jobs from RSS feeds"""
        try:
            session = await self.get_session()
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/rss+xml, application/xml, text/xml",
            }
            
            async with session.get(rss_url, headers=headers, timeout=30) as response:
                if response.status != 200:
                    return []
                
                content = await response.text()
                content = content.replace('Â', '').replace('â€™', "'")
                soup = BeautifulSoup(content, 'xml')
                
                jobs = []
                items = soup.find_all('item')[:limit]
                
                for item in items:
                    try:
                        job = {
                            'title': item.find('title').get_text(strip=True) if item.find('title') else 'Untitled',
                            'company': item.find('company').get_text(strip=True) if item.find('company') else 'Unknown',
                            'location': item.find('location').get_text(strip=True) if item.find('location') else 'Not specified',
                            'description': item.find('description').get_text(strip=True) if item.find('description') else '',
                            'url': item.find('link').get_text(strip=True) if item.find('link') else '',
                            'tags': [],
                            'id': f"rss_{hash(item.find('link').get_text(strip=True) if item.find('link') else '')}"
                        }
                        if job['title'] and job['title'] != 'Untitled':
                            jobs.append(job)
                    except Exception as e:
                        logger.debug(f"Error parsing RSS item: {str(e)}")
                        continue
                
                logger.info(f"Fetched {len(jobs)} jobs from RSS feed")
                return jobs
        except Exception as e:
            logger.error(f"Error fetching RSS feed {rss_url}: {str(e)}")
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



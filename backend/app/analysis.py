import io
import logging
import re
from typing import List

import PyPDF2

from .models import ResumeAnalysis, ATSScore, ResumeWeakness


logger = logging.getLogger(__name__)


def extract_text_from_pdf(pdf_file: bytes) -> str:
    """Extract text from PDF file."""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting PDF text: {str(e)}")
        return ""


def calculate_ats_score(text: str) -> ATSScore:
    """Calculate ATS compatibility score using simple heuristics."""
    try:
        keyword_score = min(1.0, len(re.findall(r"\b\w{4,}\b", text)) / 100)
        content_score = min(1.0, len(text) / 2000)
        formatting_score = 0.8 if "\n" in text and len(text) > 500 else 0.5

        action_verbs = [
            "developed",
            "implemented",
            "managed",
            "created",
            "designed",
            "built",
            "maintained",
            "improved",
        ]
        action_verb_count = sum(1 for verb in action_verbs if verb in text.lower())
        action_verbs_score = min(1.0, action_verb_count / 5)

        metrics_patterns = [r"\d+%", r"\$\d+", r"\d+\s+users?", r"\d+\s+projects?"]
        metrics_count = sum(len(re.findall(pattern, text)) for pattern in metrics_patterns)
        metrics_score = min(1.0, metrics_count / 3)

        summary_score = 0.9 if "summary" in text.lower() or "objective" in text.lower() else 0.6
        contact_score = 1.0 if re.search(r"@\w+\.\w+", text) else 0.5
        experience_score = 0.9 if re.search(r"\d{4}", text) else 0.6

        overall_score = (
            keyword_score * 0.25
            + content_score * 0.20
            + formatting_score * 0.15
            + action_verbs_score * 0.10
            + metrics_score * 0.10
            + summary_score * 0.10
            + contact_score * 0.05
            + experience_score * 0.05
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
            education_relevance=0.8,
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
            education_relevance=0.5,
        )


def detect_resume_weaknesses(text: str) -> List[ResumeWeakness]:
    """Detect potential weaknesses in resume using simple rules."""
    try:
        weaknesses: List[ResumeWeakness] = []

        if not re.search(r"summary|objective|profile", text, re.IGNORECASE):
            weaknesses.append(
                ResumeWeakness(
                    category="Missing Summary",
                    severity="medium",
                    description="No professional summary or objective found",
                    suggestion="Add a compelling summary at the top of your resume",
                    impact="Reduces initial impact and clarity of career goals",
                )
            )

        generic_phrases = ["responsible for", "duties include", "helped with"]
        generic_count = sum(1 for phrase in generic_phrases if phrase in text.lower())
        if generic_count > 2:
            weaknesses.append(
                ResumeWeakness(
                    category="Generic Language",
                    severity="high",
                    description=f"Found {generic_count} generic phrases that weaken impact",
                    suggestion="Replace with specific achievements and action verbs",
                    impact="Makes resume less compelling and memorable",
                )
            )

        if not re.search(r"\d+%|\$\d+|\d+\s+users?|\d+\s+projects?", text):
            weaknesses.append(
                ResumeWeakness(
                    category="Missing Quantifiable Results",
                    severity="high",
                    description="No specific metrics or quantifiable achievements found",
                    suggestion="Add specific numbers, percentages, and measurable outcomes",
                    impact="Reduces credibility and impact of achievements",
                )
            )

        passive_patterns = [r"was\s+\w+ed", r"were\s+\w+ed", r"been\s+\w+ed"]
        passive_count = sum(len(re.findall(pattern, text, re.IGNORECASE)) for pattern in passive_patterns)
        if passive_count > 3:
            weaknesses.append(
                ResumeWeakness(
                    category="Passive Voice",
                    severity="medium",
                    description=f"Found {passive_count} instances of passive voice",
                    suggestion="Use active voice and strong action verbs",
                    impact="Makes achievements sound less impactful",
                )
            )

        common_typos = ["teh", "recieve", "seperate", "occured"]
        typo_count = sum(1 for typo in common_typos if typo in text.lower())
        if typo_count > 0:
            weaknesses.append(
                ResumeWeakness(
                    category="Potential Typos",
                    severity="low",
                    description=f"Found {typo_count} potential spelling issues",
                    suggestion="Proofread carefully and use spell check",
                    impact="Creates negative first impression",
                )
            )

        return weaknesses
    except Exception as e:
        logger.error(f"Error detecting weaknesses: {str(e)}")
        return []


def analyze_resume(text: str) -> ResumeAnalysis:
    """Analyze resume text and extract key information."""
    try:
        text = text.lower()
        lines = text.split("\n")

        skills_keywords = [
            "python",
            "javascript",
            "java",
            "react",
            "node.js",
            "sql",
            "mongodb",
            "aws",
            "docker",
            "kubernetes",
            "git",
            "html",
            "css",
            "typescript",
            "angular",
            "vue.js",
            "django",
            "flask",
            "fastapi",
            "spring",
            "machine learning",
            "ai",
            "data science",
            "devops",
            "agile",
            "scrum",
            "jira",
            "figma",
            "photoshop",
            "illustrator",
            "excel",
            "powerpoint",
            "word",
            "salesforce",
            "tableau",
            "power bi",
        ]

        skills: List[str] = []
        for skill in skills_keywords:
            if skill in text:
                skills.append(skill.title())

        job_titles: List[str] = []
        job_patterns = [
            r"senior\s+\w+",
            r"junior\s+\w+",
            r"lead\s+\w+",
            r"principal\s+\w+",
            r"developer",
            r"engineer",
            r"manager",
            r"director",
            r"analyst",
            r"designer",
            r"architect",
            r"consultant",
            r"specialist",
        ]
        for pattern in job_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            job_titles.extend([match.title() for match in matches])

        education: List[str] = []
        edu_keywords = ["bachelor", "master", "phd", "degree", "university", "college"]
        for line in lines:
            if any(keyword in line.lower() for keyword in edu_keywords):
                education.append(line.strip())

        experience_years = None
        exp_patterns = [
            r"(\d+)\s+years?\s+of\s+experience",
            r"experience:\s*(\d+)\s+years?",
            r"(\d+)\s+years?\s+in\s+\w+",
        ]
        for pattern in exp_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                experience_years = int(match.group(1))
                break

        summary = (
            f"Professional with {experience_years or 'relevant'} years of experience in "
            f"{', '.join(skills[:5]) if skills else 'technology'}. "
            f"Skilled in {', '.join(job_titles[:3]) if job_titles else 'various roles'}."
        )

        keywords = list(set(skills + job_titles[:5]))
        ats_score = calculate_ats_score(text)
        weaknesses = detect_resume_weaknesses(text)

        return ResumeAnalysis(
            skills=skills[:20],
            experience_years=experience_years,
            job_titles=list(set(job_titles))[:10],
            education=education[:5],
            keywords=keywords[:15],
            summary=summary,
            ats_score=ats_score,
            weaknesses=weaknesses,
        )
    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}")
        return ResumeAnalysis(
            skills=[],
            job_titles=[],
            education=[],
            keywords=[],
            summary="Error analyzing resume",
        )



# NaviCV 

NaviCV is an all-in-one AI-powered career assistant that offers advanced resume analysis, ATS optimization, and smart job matching from multiple sources. Built with React and FastAPI, it leverages machine learning, semantic search, and vector embeddings to deliver highly relevant career opportunities.

---

#### Dashboard

<p align="center">
  <img width="900" height="909" alt="image" src="https://github.com/user-attachments/assets/5c51f727-fbfc-4878-a55a-199d47942894" />

</p>


## Features

- **AI Resume Analysis**: Extract skills, experience, and insights from resumes
- **ATS Score Calculation**: Optimize resumes for Applicant Tracking Systems
- **Multi-Source Job Fetching**: Get jobs from RemoteOK and Adzuna APIs
- **Job Matching**: AI-powered job matching based on resume content
- **Simple Authentication**: Local storage-based user authentication
- **Resume Weakness Detection**: Identify areas for improvement
- **Modern UI**: Beautiful, responsive interface

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/NaviCV.git
cd NaviCV
```

### 2. Set Up Environment Variables

Copy the example environment file and configure your settings:

Edit `.env` and add your configuration:

```env

# Optional: Adzuna API (Get free keys from https://developer.adzuna.com/)
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_API_KEY=your_adzuna_api_key
```

### 3. Install Dependencies

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd backend
pip install -r requirements.txt
```

### 4. Run the Application

#### Development Mode
```bash
# Frontend (in one terminal)
cd frontend
npm run dev

# Backend (in another terminal)
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
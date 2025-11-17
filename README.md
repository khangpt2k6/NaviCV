# NaviCV 

NaviCV is an all-in-one AI-powered career assistant that offers advanced resume analysis, ATS optimization, and smart job matching from multiple sources. Built with React and FastAPI, it leverages machine learning, semantic search, and vector embeddings to deliver highly relevant career opportunities.

---

#### Dashboard

<p align="center">
  <img width="900" style="border-radius: 12px;" alt="Dashboard" src="https://github.com/user-attachments/assets/d43457e4-ecc1-4a4d-b1bc-fa18d873b544" />
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

## Tech Stack

- **Frontend**: React.js, Vite, CSS3
- **Backend**: FastAPI, Python
- **AI/ML**: Sentence Transformers, FAISS, spaCy, scikit-learn
- **Authentication**: Local storage-based authentication
- **Job APIs**: RemoteOK, Adzuna


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
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Optional: Adzuna API (Get free keys from https://developer.adzuna.com/)
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_API_KEY=your_adzuna_api_key
```

### 3. No External Setup Required

This version uses simple localStorage-based authentication, so no external services need to be configured!

### 4. Install Dependencies

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

### 5. Run the Application

#### Development Mode
```bash
# Frontend (in one terminal)
cd frontend
npm run dev

# Backend (in another terminal)
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Production Deployment
```bash
# Build the frontend
cd frontend
npm run build

# Deploy to your preferred hosting platform (Vercel, Netlify, etc.)
```

## 🚀 Deployment

This project can be deployed to various platforms:

- **Frontend**: Can be deployed to Vercel, Netlify, or any static hosting platform
- **Backend**: Can be deployed to Railway, Render, or any Python hosting service
- **Authentication**: Uses localStorage, no external auth service required

### Manual Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

#### Backend
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 5. Run the Application


<div align="center">
<img width="200" height="200" alt="image" src="https://github.com/user-attachments/assets/8bf8c64b-637c-4125-966f-539d6c6cb318" />
</div>

### Run with Docker:

```bash
docker compose up --build
```

#### Start Backend
```bash
cd backend
# Activate virtual environment if not already activated
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Start Frontend
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Configuration

### Adzuna API (Optional)

For additional job data, get free API keys from [Adzuna Developer Portal](https://developer.adzuna.com/):

1. Sign up for a free account
2. Create an application
3. Get your App ID and API Key
4. Add them to your `.env` file

## API Endpoints

### Jobs
- `GET /jobs` - Get all jobs
- `GET /jobs?search=python&location=us` - Search jobs
- `POST /refresh-jobs` - Refresh job data from APIs

### Resume Analysis
- `POST /analyze-resume` - Analyze uploaded resume
- `POST /match-jobs` - Match resume with jobs


This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This project uses multiple job APIs to provide comprehensive job data. The Adzuna API requires free registration for additional job sources.

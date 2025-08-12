# NaviCV 

NaviCV is an all-in-one AI-powered career assistant that offers advanced resume analysis, ATS optimization, and smart job matching from multiple sources. Built with React, FastAPI, and Firebase, it leverages machine learning, semantic search, and vector embeddings to deliver highly relevant career opportunities.


## Architecture
<img width="1024" height="1024" alt="unnamed (1)" src="https://github.com/user-attachments/assets/f8b0a376-600b-4cd1-a56b-ae40d7fce493" />

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
- **Firebase Integration**: Authentication, storage, and database
- **Resume Weakness Detection**: Identify areas for improvement
- **Modern UI**: Beautiful, responsive interface

## Tech Stack

- **Frontend**: React.js, Vite, CSS3
- **Backend**: FastAPI, Python
- **AI/ML**: Sentence Transformers, FAISS, spaCy, scikit-learn
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **Job APIs**: RemoteOK, Adzuna


## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/NaviCV.git
cd NaviCV
```

### 2. Set Up Environment Variables

Copy the example environment file and configure your Firebase credentials:

```bash
cp env.example .env
```

Edit `.env` and add your Firebase configuration:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Frontend Environment Variables
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Adzuna API (Get free keys from https://developer.adzuna.com/)
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_API_KEY=your_adzuna_api_key
```

### 3. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication (Email/Password)
4. Enable Firestore Database (Start in test mode)
5. Enable Storage
6. Get your configuration from Project Settings

### 4. Install Dependencies

#### Frontend
```bash
cd frontend
npm install
```

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

### Firebase Setup

1. **Authentication**: Enable Email/Password sign-in method
2. **Firestore**: Create database in test mode
3. **Storage**: Enable storage with default rules

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

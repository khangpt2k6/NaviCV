# NaviCV - AI-Powered Career Assistant

NaviCV is a comprehensive career assistant that combines AI-powered resume analysis, ATS optimization, and job matching from multiple sources. Built with React, FastAPI, and Firebase.

## 🚀 Features

- **AI Resume Analysis**: Extract skills, experience, and insights from resumes
- **ATS Score Calculation**: Optimize resumes for Applicant Tracking Systems
- **Multi-Source Job Fetching**: Get jobs from RemoteOK and Adzuna APIs
- **Job Matching**: AI-powered job matching based on resume content
- **Firebase Integration**: Authentication, storage, and database
- **Resume Weakness Detection**: Identify areas for improvement
- **Modern UI**: Beautiful, responsive interface

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, CSS3
- **Backend**: FastAPI, Python
- **AI/ML**: Sentence Transformers, FAISS, spaCy, scikit-learn
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **Job APIs**: RemoteOK, Adzuna

## 📋 Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- Firebase account
- Adzuna API account (optional, for additional job data)

## 🚀 Quick Start

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

## 🔧 Configuration

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

## 📁 Project Structure

```
NaviCV/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── firebase.js      # Firebase configuration
│   │   └── App.jsx          # Main app component
│   ├── package.json
│   └── vite.config.js
├── backend/                  # FastAPI backend
│   ├── main.py              # Main API server
│   ├── firebase_config.py   # Firebase backend config
│   └── requirements.txt     # Python dependencies
├── .gitignore               # Git ignore rules
├── env.example              # Environment variables template
└── README.md               # This file
```

## 🔌 API Endpoints

### Jobs
- `GET /jobs` - Get all jobs
- `GET /jobs?search=python&location=us` - Search jobs
- `POST /refresh-jobs` - Refresh job data from APIs

### Resume Analysis
- `POST /analyze-resume` - Analyze uploaded resume
- `POST /match-jobs` - Match resume with jobs

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Deploy to Vercel:
```bash
npm install -g vercel
vercel
```

### Backend Deployment (Heroku/Railway)

1. Create a `Procfile` in the backend directory:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

2. Deploy to your preferred platform

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 🤝 Support

If you encounter any issues:

1. Check the Firebase Console to ensure all services are enabled
2. Verify your environment variables are correctly set
3. Check the browser console and backend logs for errors
4. Open an issue on GitHub

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Firebase](https://firebase.google.com/) for backend services
- [Adzuna](https://developer.adzuna.com/) for job data API
- [RemoteOK](https://remoteok.io/) for remote job listings
- [Sentence Transformers](https://www.sbert.net/) for semantic similarity
- [FAISS](https://github.com/facebookresearch/faiss) for similarity search

---

**Note**: This project uses multiple job APIs to provide comprehensive job data. The Adzuna API requires free registration for additional job sources.

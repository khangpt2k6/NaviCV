# NaviCV 

NaviCV is an all-in-one AI-powered career assistant that offers advanced resume analysis, ATS optimization, and smart job matching from multiple sources. Built with React and FastAPI, it leverages machine learning, semantic search, and vector embeddings to deliver highly relevant career opportunities.

---
<table>
  <tr>
    <td>
      <img src="https://github.com/user-attachments/assets/6c53f354-7231-46d0-8388-d848ecdf87c0" width="100%" />
    </td>
    <td>
      <img src="https://github.com/user-attachments/assets/1ad383b1-9aff-46f9-9784-5489d6a36ed5" width="100%" />
    </td>
  </tr>
</table>



## Features

- **AI Resume Analysis**: Extract skills, experience, and insights from resumes
- **ATS Score Calculation**: Optimize resumes for Applicant Tracking Systems
- **Multi-Source Job Fetching**: Get jobs from RemoteOK and Adzuna APIs
- **Job Matching**: AI-powered job matching based on resume content
- **Resume Weakness Detection**: Identify areas for improvement
- **Modern UI**: Beautiful, responsive interface

## Quick Start

### Installation

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### Running the Application

#### Development Mode

**Frontend:**
```bash
cd frontend
npm run dev
```

**Backend:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Docker Compose (Recommended)
```bash
docker-compose up --build
```

The application will be available at:
- Frontend: `http://localhost:5173` (dev) or `http://localhost:3000` (production)
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

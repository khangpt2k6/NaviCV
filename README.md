# NaviCV 🧭

**An AI-powered career assistant that intelligently matches your resume with the perfect remote job opportunities.**

## 🌟 What Does NaviCV Do?

**NaviCV** is an **AI-powered career assistant** that helps users:

1. 🔍 **Explore job listings** — Fetches real-time remote jobs from RemoteOK
2. 📄 **Analyze resumes** — Parses uploaded PDF or text resumes using NLP and ML to extract:
   * Skills and competencies
   * Job titles and experience levels
   * Education background
   * Relevant keywords
3. 🎯 **Match resumes with jobs** — Uses **semantic similarity (via sentence-transformers + FAISS)** and **keyword analysis** to:
   * Rank the best job matches
   * Provide detailed match scores for each opportunity
4. 💡 **Visualize insights** — Displays:
   * Comprehensive resume analysis breakdown
   * Match scores (semantic + keyword)
   * AI-curated job recommendations
5. 🧭 **Navigate career paths easily** with a clean, modern React frontend

## 🏗️ Development Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser (React Frontend)            │
│                                                            │
│  ┌─────────────────┐    ┌─────────────────────────────────┐│
│  │  Resume Upload  │    │     Job Search & Results        ││
│  │   (PDF/Text)    │    │      Visualization             ││
│  └─────────────────┘    └─────────────────────────────────┘│
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API calls
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                FastAPI Backend (Python)                     │
│                                                            │
│ ┌─────────────────────────────────────────────────────────┐│
│ │                Resume Upload (PDF/Text)                  ││
│ │                                                         ││
│ │  ┌───────────────────────────────────────────────────┐  ││
│ │  │        PyPDF2 / NLP / Regex Extraction            │  ││
│ │  │                        │                          │  ││
│ │  │                        ▼                          │  ││
│ │  │             ResumeAnalysis Output                 │  ││
│ │  └───────────────────────────────────────────────────┘  ││
│ └─────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌─────────────────────────────────────────────────────────┐│
│ │                   Job Fetcher                            ││
│ │                                                         ││
│ │  ┌───────────────────────────────────────────────────┐  ││
│ │  │       RemoteOK API (Async Fetch)                  │  ││
│ │  │                        │                          │  ││
│ │  │                        ▼                          │  ││
│ │  │          Job Normalization & Storage              │  ││
│ │  └───────────────────────────────────────────────────┘  ││
│ └─────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌─────────────────────────────────────────────────────────┐│
│ │                AI Matching Engine                        ││
│ │                                                         ││
│ │  • Sentence-Transformers (MiniLM)                      ││
│ │  • FAISS Index (Semantic Search)                       ││
│ │  • TF-IDF + Keyword Matcher                           ││
│ │  • Match Score (Semantic + Keyword)                    ││
│ └─────────────────────────────────────────────────────────┘│
│                                                            │
│                        │                                   │
│                        ▼                                   │
│            JSON Response to Frontend                       │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Features

### Resume Analysis
- **Multi-format Support**: Upload PDF or plain text resumes
- **Intelligent Parsing**: Extracts skills, experience, education, and keywords using NLP
- **Structured Output**: Provides clean, organized resume insights

### Job Matching
- **Semantic Understanding**: Uses sentence-transformers for deep meaning analysis
- **Keyword Optimization**: TF-IDF based keyword matching for precise relevance
- **Hybrid Scoring**: Combines semantic similarity with keyword matching for optimal results
- **Real-time Data**: Fresh job listings from RemoteOK API

### AI-Powered Insights
- **Match Scoring**: Detailed breakdown of how well each job fits your profile
- **Career Recommendations**: AI-curated suggestions based on your background
- **Visual Analytics**: Clean, intuitive interface for exploring opportunities

## 🛠️ Tech Stack

### Frontend
- **React** - Modern, responsive user interface
- **JavaScript/TypeScript** - Type-safe development
- **CSS/Styled Components** - Clean, professional styling

### Backend
- **FastAPI** - High-performance Python web framework
- **Python 3.8+** - Core backend language
- **AsyncIO** - Asynchronous job fetching

### AI & Machine Learning
- **Sentence-Transformers** - Semantic text similarity (MiniLM model)
- **FAISS** - Fast approximate nearest neighbor search
- **scikit-learn** - TF-IDF vectorization and keyword analysis
- **PyPDF2** - PDF text extraction
- **NLTK/spaCy** - Natural language processing

### Data & APIs
- **RemoteOK API** - Real-time remote job listings
- **JSON** - Data exchange format
- **RESTful APIs** - Clean, predictable API design

## 🔧 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/navicv.git
cd navicv

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

## 📚 API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation powered by FastAPI's automatic OpenAPI generation.

### Key Endpoints
- `POST /upload-resume` - Upload and analyze resume
- `GET /jobs` - Fetch remote job listings
- `POST /match-jobs` - Get AI-powered job matches
- `GET /resume-insights` - Retrieve parsed resume data

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] LinkedIn integration
- [ ] Advanced resume templates
- [ ] Job application tracking
- [ ] Interview preparation tools
- [ ] Salary insights and negotiation tips
- [ ] Mobile app development

## 💬 Support

For questions, suggestions, or issues:
- 📧 Email: support@navicv.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/navicv/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/navicv/discussions)

---

**Made with ❤️ by the NaviCV team - Helping you navigate your career journey with AI.**

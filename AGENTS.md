# Agent Guidelines for ACM_ResumeHack (NaviCV)

## Build, Lint, Test Commands

**Frontend** (React + Vite + TailwindCSS):
- `cd frontend && npm run dev` - Run dev server (localhost:5173)
- `cd frontend && npm run build` - Production build
- `cd frontend && npm run lint` - ESLint check
- `cd frontend && npm test` - Run all tests (Vitest)
- `cd frontend && npm run test:coverage` - Test with coverage
- Test files: `*.test.jsx` or `*.spec.jsx` in src/ directory

**Backend** (FastAPI + Python 3.11):
- `cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload` - Run dev server
- `cd backend && pytest` - Run all tests
- `cd backend && pytest tests/integration/` - Run integration tests only
- `cd backend && pytest -v path/to/test_file.py::test_function_name` - Run single test
- `cd backend && flake8 . --max-line-length=127` - Lint check
- `cd backend && black .` - Auto-format code (optional, not enforced in CI)

## Code Style Guidelines

**Python Backend**:
- Use type hints for function parameters and return values
- Import order: standard library, third-party, local modules (see main.py:1-5, analysis.py:1-8)
- Use `from .models import ...` for local imports
- Max line length: 127 characters (flake8 config)
- Format with Black
- Use logging instead of print: `logger = logging.getLogger(__name__)`
- Error handling: Try-except with logger.error() and descriptive messages
- Pydantic models for data validation (see models.py)
- Docstrings for functions using triple quotes
- For global variables that are reassigned, use `# noqa: F824` to suppress flake8 warnings (see state.py:23)

**JavaScript/React Frontend**:
- Use functional components with hooks
- Import Lucide icons at top (see App.jsx:4-27)
- ESLint 8.x with traditional .eslintrc.cjs config
- ESLint rules disabled: prop-types validation, unescaped entities
- ESLint rule: no-unused-vars with varsIgnorePattern for constants
- Use const for all declarations unless reassignment needed
- TailwindCSS for styling - use utility classes
- API calls with fetch, handle errors with try-catch
- Use camelCase for variables, PascalCase for components

**General**:
- Keep main.py slim - business logic in app/* modules
- Test files in tests/ directory for backend, *.test.jsx for frontend
- Use async/await for API endpoints in FastAPI
- CI/CD runs on main and develop branches
- No Cursor or Copilot rules defined

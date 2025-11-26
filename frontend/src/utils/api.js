// Use window.ENV if available (runtime), otherwise fall back to build-time env var or localhost
const API_BASE = (typeof window !== 'undefined' && window.ENV?.API_BASE_URL) 
  || import.meta.env.VITE_API_BASE_URL 
  || "http://localhost:8000";

export const fetchJobs = async (search = "", limit = 100) => {
  const url = search
    ? `${API_BASE}/jobs?search=${encodeURIComponent(search)}&limit=${limit}`
    : `${API_BASE}/jobs?limit=${limit}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch jobs");
  return await response.json();
};

export const analyzeResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/analyze-resume`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Failed to analyze resume");
  return await response.json();
};

export const matchJobs = async (resumeText) => {
  const response = await fetch(`${API_BASE}/match-jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resume_text: resumeText }),
  });

  if (!response.ok) throw new Error("Failed to match jobs");
  return await response.json();
};

export const refreshJobs = async () => {
  const response = await fetch(`${API_BASE}/refresh-jobs`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to refresh jobs");
  return response;
};



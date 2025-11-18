import React, { useState, useEffect } from "react";
import Login from "./components/Login";

import {
  Search,
  Upload,
  User,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Star,
  Loader2,
  RefreshCw,
  FileText,
  TrendingUp,
  Award,
  BookOpen,
  Navigation,
  Compass,
  Target,
  Filter,
  ArrowRight,
  CheckCircle,
  Clock,
  LogOut,

} from "lucide-react";

const API_BASE = "http://localhost:8000";

const NaviCVApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("search");
  const [jobs, setJobs] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if user is stored in localStorage (simple authentication)
      const storedUser = localStorage.getItem('navicv_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    // Store user in localStorage for persistence
    localStorage.setItem('navicv_user', JSON.stringify(userData));
    setActiveTab("search");
  };

  const handleLogout = async () => {
    try {
      // Clear user from localStorage and state
      localStorage.removeItem('navicv_user');
      setUser(null);
      setActiveTab("search");
      setResumeAnalysis(null);
      setMatchedJobs([]);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Fetch jobs on component mount
  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async (search = "") => {
    setLoading(true);
    setError("");
    try {
      const url = search
        ? `${API_BASE}/jobs?search=${encodeURIComponent(search)}&limit=20`
        : `${API_BASE}/jobs?limit=20`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch jobs");

      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError("Failed to fetch jobs. Please try again.");
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchJobs(searchQuery);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Analyze resume
      const analyzeResponse = await fetch(`${API_BASE}/analyze-resume`, {
        method: "POST",
        body: formData,
      });

      if (!analyzeResponse.ok) throw new Error("Failed to analyze resume");

      const analysis = await analyzeResponse.json();
      setResumeAnalysis(analysis);

      // Get matching jobs
      const matchResponse = await fetch(`${API_BASE}/match-jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume_text:
            analysis.summary +
            " " +
            analysis.skills.join(" ") +
            " " +
            analysis.keywords.join(" "),
        }),
      });

      if (!matchResponse.ok) throw new Error("Failed to match jobs");

      const matches = await matchResponse.json();
      setMatchedJobs(matches);
      setSuccess("Resume analyzed successfully! Found matching jobs.");
      setActiveTab("matches");
    } catch (err) {
      setError("Failed to process resume. Please try again.");
      console.error("Error processing resume:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshJobs = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/refresh-jobs`, { method: "POST" });
      await fetchJobs();
      setSuccess("Jobs data refreshed successfully!");
    } catch (err) {
      setError("Failed to refresh jobs data.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to clean and format HTML description
  const formatJobDescription = (description) => {
    if (!description) return "";

    let formatted = description;

    // Convert common HTML entities
    formatted = formatted
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");

    // Convert <br> tags to actual line breaks
    formatted = formatted.replace(/<br\s*\/?>/gi, "\n");

    // Convert <p> tags to paragraphs with line breaks
    formatted = formatted.replace(/<\/p>\s*<p[^>]*>/gi, "\n\n");
    formatted = formatted.replace(/<\/?p[^>]*>/gi, "");

    // Handle other common tags but keep their content
    formatted = formatted.replace(/<\/?div[^>]*>/gi, "\n");
    formatted = formatted.replace(/<\/?ul[^>]*>/gi, "\n");
    formatted = formatted.replace(/<\/?ol[^>]*>/gi, "\n");
    formatted = formatted.replace(/<li[^>]*>/gi, "• ");
    formatted = formatted.replace(/<\/li>/gi, "\n");

    // Clean up multiple line breaks
    formatted = formatted.replace(/\n{3,}/g, "\n\n");
    formatted = formatted.trim();

    return formatted;
  };

  // Helper function to create safe HTML with preserved formatting
  const createFormattedHTML = (text) => {
    if (!text) return "";

    let html = text;

    // Convert line breaks to <br> tags
    html = html.replace(/\n/g, "<br>");

    // Convert bold text patterns
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/<b>(.*?)<\/b>/gi, "<strong>$1</strong>");

    // Convert italic text patterns
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/<i>(.*?)<\/i>/gi, "<em>$1</em>");

    // Convert bullet points
    html = html.replace(
      /^• /gm,
      '<span class="inline-block w-2 h-2 bg-slate-400 rounded-full mr-2 mt-2"></span>'
    );

    return html;
  };

  const JobCard = ({ job, showMatchScore = false }) => {
    const [showFullDescription, setShowFullDescription] = useState(false);

    const formattedDescription = formatJobDescription(job.description);
    const truncatedDescription =
      formattedDescription.length > 300
        ? formattedDescription.substring(0, 300) + "..."
        : formattedDescription;

    const descriptionToShow = showFullDescription
      ? formattedDescription
      : truncatedDescription;
    const shouldShowReadMore = formattedDescription.length > 300;

    return (
      <div className="group bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                  {job.title}
                </h3>
                <p className="text-slate-600 font-medium">{job.company}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-slate-500">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{job.location}</span>
              </div>
              {job.salary && job.salary !== "$0-$0" && (
                <div className="flex items-center text-emerald-600">
                  <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm font-semibold">{job.salary}</span>
                </div>
              )}
              {job.posted_date && (
                <div className="flex items-center text-slate-400">
                  <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs">
                    {new Date(job.posted_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {showMatchScore && (
            <div className="ml-6 text-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center mb-2 mx-auto">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs text-slate-600 mb-1">Match Score</div>
              <div className="text-2xl font-bold text-slate-700">
                {(job.match_score * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>

        <div className="text-slate-700 mb-6">
          <div
            className="prose prose-sm max-w-none prose-slate"
            style={{
              lineHeight: "1.7",
              whiteSpace: "pre-line",
            }}
            dangerouslySetInnerHTML={{
              __html: createFormattedHTML(descriptionToShow),
            }}
          />
          {shouldShowReadMore && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-slate-600 hover:text-slate-800 text-sm font-medium mt-3 inline-flex items-center group"
            >
              {showFullDescription ? "Show Less" : "Read More"}
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {job.tags?.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium hover:bg-slate-200 transition-colors"
            >
              {tag}
            </span>
          ))}
          {job.tags?.length > 4 && (
            <span className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-full text-xs">
              +{job.tags.length - 4} more
            </span>
          )}
        </div>

        {showMatchScore && (
          <div className="flex gap-4 mb-6 p-3 bg-slate-50 rounded-lg">
            <div className="text-center flex-1">
              <div className="text-xs text-slate-500 mb-1">Semantic</div>
              <div className="text-sm font-bold text-slate-700">
                {(job.semantic_score * 100).toFixed(0)}%
              </div>
            </div>
            <div className="w-px bg-slate-200"></div>
            <div className="text-center flex-1">
              <div className="text-xs text-slate-500 mb-1">Keywords</div>
              <div className="text-sm font-bold text-slate-700">
                {(job.keyword_score * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => window.open(job.url, "_blank")}
            className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-2.5 rounded-lg hover:from-slate-800 hover:to-slate-900 transition-all duration-200 font-medium text-sm inline-flex items-center group"
          >
            View Position
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <span className="text-xs text-slate-400 font-mono">
            #{job.job_id}
          </span>
        </div>
      </div>
    );
  };

  const ResumeAnalysisCard = ({ analysis }) => {
    const [showAllSkills, setShowAllSkills] = useState(false);
    const [showAllJobTitles, setShowAllJobTitles] = useState(false);
    const [showAllEducation, setShowAllEducation] = useState(false);

    const skillsToShow = showAllSkills
      ? analysis.skills
      : analysis.skills.slice(0, 10);
    const jobTitlesToShow = showAllJobTitles
      ? analysis.job_titles
      : analysis.job_titles.slice(0, 5);
    const educationToShow = showAllEducation
      ? analysis.education
      : analysis.education.slice(0, 3);

    // ATS Score Component
    const ATSScoreCard = ({ atsScore }) => {
      const getScoreLabel = (score) => {
        if (score >= 0.8) return "Excellent";
        if (score >= 0.65) return "Good";
        if (score >= 0.5) return "Fair";
        return "Needs Work";
      };

      return (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">ATS Compatibility Score</h3>
              <p className="text-sm text-slate-600">How well your resume performs with Applicant Tracking Systems</p>
            </div>
          </div>

          {/* Overall Score */}
          <div className="text-center mb-8">
            <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 border-2 border-slate-300">
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-900">
                  {(atsScore.overall_score * 100).toFixed(0)}%
                </div>
                <div className="text-sm font-medium text-slate-600 mt-1">{getScoreLabel(atsScore.overall_score)}</div>
              </div>
            </div>
          </div>

          {/* Detailed Scores */}
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { label: "Keyword Optimization", score: atsScore.keyword_optimization, weight: "25%" },
              { label: "Content Quality", score: atsScore.content_quality, weight: "20%" },
              { label: "Formatting", score: atsScore.formatting_score, weight: "15%" },
              { label: "Action Verbs", score: atsScore.action_verbs, weight: "10%" },
              { label: "Metrics Usage", score: atsScore.metrics_usage, weight: "10%" },
              { label: "Summary Quality", score: atsScore.summary_quality, weight: "10%" },
              { label: "Contact Info", score: atsScore.contact_info, weight: "5%" },
              { label: "Experience Detail", score: atsScore.experience_detail, weight: "5%" }
            ].map((item, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-slate-700">{item.label}</span>
                  <span className="text-xs text-slate-500">{item.weight}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-2 rounded-full bg-slate-700 transition-all duration-500"
                    style={{ width: `${item.score * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-slate-600 mt-1.5 font-medium">
                  {(item.score * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    // Weaknesses Component
    const WeaknessesCard = ({ weaknesses }) => {
      const getSeverityStyle = (severity) => {
        switch (severity) {
          case "high": return "bg-slate-100 border-slate-300";
          case "medium": return "bg-slate-50 border-slate-200";
          case "low": return "bg-slate-50 border-slate-200";
          default: return "bg-slate-50 border-slate-200";
        }
      };

      const getSeverityLabel = (severity) => {
        switch (severity) {
          case "high": return "High";
          case "medium": return "Medium";
          case "low": return "Low";
          default: return "Info";
        }
      };

      if (!weaknesses || weaknesses.length === 0) {
        return (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Resume Quality Check</h3>
                <p className="text-sm text-slate-600">No major issues detected</p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-slate-700 text-sm">
                Your resume is well-structured and ATS-friendly. Continue refining based on specific job requirements.
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 text-white text-lg">⚠</div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Areas for Improvement</h3>
              <p className="text-sm text-slate-600">{weaknesses.length} suggestion{weaknesses.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="space-y-3">
            {weaknesses.map((weakness, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getSeverityStyle(weakness.severity)}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-slate-900">{weakness.category}</h4>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700">
                        {getSeverityLabel(weakness.severity)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{weakness.description}</p>
                    <div className="text-sm text-slate-700 space-y-1">
                      <div><span className="font-medium">Suggestion:</span> {weakness.suggestion}</div>
                      <div><span className="font-medium">Impact:</span> {weakness.impact}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* ATS Score Card */}
        {analysis.ats_score && <ATSScoreCard atsScore={analysis.ats_score} />}
        
        {/* Weaknesses Card */}
        {analysis.weaknesses && <WeaknessesCard weaknesses={analysis.weaknesses} />}

        {/* Original Analysis Card */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Resume Analysis</h3>
              <p className="text-slate-600">AI-powered career insights</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                    <Award className="w-4 h-4 text-emerald-600" />
                  </div>
                  Skills ({analysis.skills.length})
                </h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {skillsToShow.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                {analysis.skills.length > 10 && (
                  <button
                    onClick={() => setShowAllSkills(!showAllSkills)}
                    className="text-slate-600 hover:text-slate-800 text-sm font-medium inline-flex items-center group"
                  >
                    {showAllSkills
                      ? "Show Less"
                      : `+${analysis.skills.length - 10} more skills`}
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  Experience Level
                </h4>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-800">
                    {analysis.experience_years
                      ? `${analysis.experience_years} years`
                      : "Entry Level"}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    Professional experience
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  Career History ({analysis.job_titles.length})
                </h4>
                <div className="space-y-2 mb-3">
                  {jobTitlesToShow.map((title, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-700 text-sm">{title}</span>
                    </div>
                  ))}
                </div>
                {analysis.job_titles.length > 5 && (
                  <button
                    onClick={() => setShowAllJobTitles(!showAllJobTitles)}
                    className="text-slate-600 hover:text-slate-800 text-sm font-medium inline-flex items-center group"
                  >
                    {showAllJobTitles
                      ? "Show Less"
                      : `+${analysis.job_titles.length - 5} more positions`}
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                  </div>
                  Education ({analysis.education.length})
                </h4>
                <div className="space-y-2 mb-3">
                  {analysis.education.length > 0 ? (
                    <>
                      {educationToShow.map((edu, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-slate-700 text-sm">{edu}</span>
                        </div>
                      ))}
                      {analysis.education.length > 3 && (
                        <button
                          onClick={() => setShowAllEducation(!showAllEducation)}
                          className="text-slate-600 hover:text-slate-800 text-sm font-medium inline-flex items-center group"
                        >
                          {showAllEducation
                            ? "Show Less"
                            : `+${analysis.education.length - 3} more`}
                          <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-slate-500 text-sm italic p-2">
                      No education information detected
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Keywords Section */}
          {analysis.keywords && analysis.keywords.length > 0 && (
            <div className="mt-8 p-6 bg-slate-50 rounded-xl">
              <h4 className="font-bold text-slate-900 mb-4">Top Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.slice(0, 15).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 p-6 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl text-white">
            <h4 className="font-bold mb-3 flex items-center">
              <Compass className="w-5 h-5 mr-2" />
              Career Summary
            </h4>
            <p className="leading-relaxed opacity-90">{analysis.summary}</p>
          </div>
        </div>
      </div>
    );
  };

  const FileUploadZone = () => (
    <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 group">
      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform">
        <Upload className="w-8 h-8 text-slate-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">
        Upload Your Resume
      </h3>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">
        Drop your PDF, DOCX, or text file here to get AI-powered career insights and job matches
      </p>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            setSelectedFile(file);
            handleFileUpload(file);
          }
        }}
        accept=".pdf,.txt,.docx"
        className="hidden"
        id="resume-upload"
      />
      <label
        htmlFor="resume-upload"
        className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-8 py-3 rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all duration-200 cursor-pointer inline-flex items-center font-medium group"
      >
        <Upload className="w-4 h-4 mr-2" />
        Choose File
        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
      </label>
      {selectedFile && (
        <div className="mt-4 p-3 bg-slate-100 rounded-lg inline-block">
          <p className="text-sm text-slate-700 font-medium">
            📄 {selectedFile.name}
          </p>
        </div>
      )}
    </div>
  );

  // Show login screen if not authenticated
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Loading NaviCV
          </h3>
          <p className="text-slate-600">
            Preparing your career navigation experience...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center">
                <Navigation className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  NaviCV
                </h1>
                <p className="text-sm text-slate-600">
                  AI-Powered Career Navigation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <button
                onClick={refreshJobs}
                disabled={loading}
                className="flex items-center px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh Data
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex gap-2 bg-white rounded-xl p-2 shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "search"
                ? "bg-slate-700 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Search className="w-4 h-4 mr-2" />
            Explore Jobs
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "upload"
                ? "bg-slate-700 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Resume Analysis
          </button>

          {matchedJobs.length > 0 && (
            <button
              onClick={() => setActiveTab("matches")}
              className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === "matches"
                  ? "bg-slate-700 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Target className="w-4 h-4 mr-2" />
              Career Matches
              <span className="ml-2 px-2 py-0.5 bg-slate-600 text-white text-xs rounded-full">
                {matchedJobs.length}
              </span>
            </button>
          )}
        </nav>
      </div>

      {/* Notifications */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl flex items-start gap-3">
            <div className="w-5 h-5 text-red-500 mt-0.5">⚠️</div>
            <div>
              <h4 className="font-medium mb-1">Error</h4>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Success</h4>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Search Tab */}
        {activeTab === "search" && (
          <div>
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <Compass className="w-6 h-6 mr-3 text-slate-600" />
                Discover Your Next Opportunity
              </h2>
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for positions (e.g., Python Developer, Data Scientist, UX Designer)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-8 py-4 rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium inline-flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Search Jobs
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Jobs Grid */}
            {loading && jobs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Discovering Opportunities
                </h3>
                <p className="text-slate-600">
                  Searching through thousands of positions...
                </p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Ready to Explore
                </h3>
                <p className="text-slate-600">
                  Use the search above to find your perfect career match
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {jobs.length} Positions Found
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Filter className="w-4 h-4" />
                    Showing latest results
                  </div>
                </div>
                <div className="grid gap-6">
                  {jobs.map((job) => (
                    <JobCard key={job.job_id} job={job} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div className="space-y-8">
            {!resumeAnalysis && !loading && <FileUploadZone />}

            {loading && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Analyzing Your Resume
                </h3>
                <p className="text-slate-600">
                  Our AI is extracting key insights from your career history...
                </p>
                <div className="mt-4 w-64 h-2 bg-slate-200 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-slate-600 to-slate-700 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}

            {resumeAnalysis && <ResumeAnalysisCard analysis={resumeAnalysis} />}
            
            {resumeAnalysis && (
              <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Ready for Your Next Step?</h3>
                    <p className="opacity-90">
                      We've found {matchedJobs.length} positions that match your profile
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("matches")}
                    className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium inline-flex items-center gap-2 backdrop-blur-sm"
                  >
                    View Matches
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === "matches" && matchedJobs.length > 0 && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Your Career Matches</h2>
                  <p className="opacity-90">
                    AI-curated opportunities based on your resume analysis
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{matchedJobs.length}</div>
                  <div className="text-sm opacity-75">Total Matches</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">
                    {matchedJobs.filter(job => job.match_score > 0.7).length}
                  </div>
                  <div className="text-sm opacity-75">High Matches (70%+)</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">
                    {Math.round(matchedJobs.reduce((acc, job) => acc + job.match_score, 0) / matchedJobs.length * 100)}%
                  </div>
                  <div className="text-sm opacity-75">Avg Match Score</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {matchedJobs.map((job) => (
                <JobCard key={job.job_id} job={job} showMatchScore={true} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "matches" && matchedJobs.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Target className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No Career Matches Yet
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Upload your resume to discover personalized job opportunities that align with your skills and experience
            </p>
            <button
              onClick={() => setActiveTab("upload")}
              className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-8 py-3 rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all duration-200 font-medium inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}


      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center">
                <Navigation className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-slate-900">NaviCV</div>
                <div className="text-xs text-slate-500">Navigate Your Career Journey</div>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              Powered by AI • Built for Success
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NaviCVApp;
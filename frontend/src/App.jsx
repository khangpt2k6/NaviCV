import React, { useState, useEffect, useMemo } from "react";

import {
  Search,
  Upload,
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
} from "lucide-react";

const API_BASE = "http://localhost:8000";

const NaviCVApp = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("search");
  const [jobs, setJobs] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sortBy, setSortBy] = useState("latest"); // latest, relevance, salary
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Fetch jobs on component mount
  useEffect(() => {
    setLoading(false);
    fetchJobs();
  }, []);

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortMenu && !event.target.closest('.relative')) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortMenu]);

  // Sort jobs based on selected option
  const sortedJobs = useMemo(() => {
    const jobsCopy = [...jobs];
    switch (sortBy) {
      case "latest":
        // Sort by posted_date if available, otherwise keep original order
        return jobsCopy.sort((a, b) => {
          const dateA = a.posted_date ? new Date(a.posted_date) : new Date(0);
          const dateB = b.posted_date ? new Date(b.posted_date) : new Date(0);
          return dateB - dateA; // Newest first
        });
      case "relevance":
        // Sort by match_score if available, otherwise keep original order
        return jobsCopy.sort((a, b) => {
          const scoreA = a.match_score || 0;
          const scoreB = b.match_score || 0;
          return scoreB - scoreA; // Highest score first
        });
      case "salary":
        // Sort by salary (extract numeric value)
        return jobsCopy.sort((a, b) => {
          const salaryA = a.salary_min || a.salary_max || 0;
          const salaryB = b.salary_min || b.salary_max || 0;
          return salaryB - salaryA; // Highest salary first
        });
      default:
        return jobsCopy;
    }
  }, [jobs, sortBy]);

  const fetchJobs = async (search = "", limit = 100) => {
    setLoading(true);
    setError("");
    try {
      const url = search
        ? `${API_BASE}/jobs?search=${encodeURIComponent(search)}&limit=${limit}`
        : `${API_BASE}/jobs?limit=${limit}`;

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

    // Fix encoding issues (common UTF-8 encoding problems)
    // Handle double-encoded UTF-8 characters (like Â appearing before special chars)
    formatted = formatted
      // Remove Â characters that appear before special characters (common encoding issue)
      .replace(/Â /g, ' ')
      .replace(/Â/g, '')
      // Fix common UTF-8 encoding issues
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/â€"/g, '—')
      .replace(/â€"/g, '–')
      .replace(/â€¦/g, '…')
      .replace(/â€"/g, '™')
      .replace(/â€™/g, "'")
      .replace(/â€"/g, '"')
      .replace(/â€"/g, '"')
      // Fix common Latin character encoding issues
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã±/g, 'ñ')
      .replace(/Ã¡/g, 'Á')
      .replace(/Ã‰/g, 'É')
      .replace(/Ã/g, 'Í')
      .replace(/Ã"/g, 'Ó')
      .replace(/Ãš/g, 'Ú')
      .replace(/Ã'/g, 'Ñ');

    // Convert common HTML entities
    formatted = formatted
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–");

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

    const matchPercentage = showMatchScore ? (job.match_score * 100).toFixed(0) : null;
    const matchColor = matchPercentage >= 70 ? "from-emerald-500 to-teal-600" : matchPercentage >= 50 ? "from-slate-500 to-slate-600" : "from-amber-500 to-orange-600";

    return (
      <div className="group bg-white rounded-2xl shadow-lg border border-slate-200 p-8 hover:shadow-2xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors mb-1">
                    {job.title}
                  </h3>
                  <p className="text-lg font-semibold text-slate-700 mb-3">{job.company}</p>
                  
                  {/* Tags below company name */}
                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.tags.slice(0, 6).map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-full text-xs font-semibold border border-slate-300"
                        >
                          {tag && tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}
                        </span>
                      ))}
                      {job.tags.length > 6 && (
                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-xs font-medium border border-slate-200">
                          +{job.tags.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span className="font-medium">{job.location}</span>
                    </div>
                    {job.posted_date && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{new Date(job.posted_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {job.salary && job.salary !== "$0-$0" && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-emerald-700">{job.salary}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {showMatchScore && (
              <div className="ml-6 text-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border-2 border-slate-200 shadow-md">
                <div className={`w-16 h-16 bg-gradient-to-br ${matchColor} rounded-full flex items-center justify-center mb-3 mx-auto shadow-lg`}>
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Match Score</div>
                <div className={`text-3xl font-bold bg-gradient-to-r ${matchColor} bg-clip-text text-transparent`}>
                  {matchPercentage}%
                </div>
              </div>
            )}
          </div>

          <div className="text-slate-700 mb-6 leading-relaxed">
            <div
              className="prose prose-sm max-w-none prose-slate"
              style={{
                lineHeight: "1.8",
                whiteSpace: "pre-line",
              }}
              dangerouslySetInnerHTML={{
                __html: createFormattedHTML(descriptionToShow),
              }}
            />
            {shouldShowReadMore && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-slate-600 hover:text-slate-800 font-semibold text-sm mt-4 inline-flex items-center group"
              >
                {showFullDescription ? "Show Less" : "Read More"}
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {showMatchScore && (
            <div className="flex gap-6 mb-6 p-4 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 rounded-xl border border-slate-200">
              <div className="text-center flex-1">
                <div className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Semantic</div>
                <div className="text-lg font-bold text-slate-700">
                  {(job.semantic_score * 100).toFixed(0)}%
                </div>
              </div>
              <div className="w-px bg-slate-300"></div>
              <div className="text-center flex-1">
                <div className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Keywords</div>
                <div className="text-lg font-bold text-slate-700">
                  {(job.keyword_score * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-slate-200">
            <button
              onClick={() => window.open(job.url, "_blank")}
              className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white px-8 py-3 rounded-xl hover:from-slate-800 hover:via-slate-900 hover:to-slate-950 transition-all duration-200 font-semibold text-base inline-flex items-center group shadow-lg hover:shadow-xl hover:scale-105"
            >
              View Position
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-xs text-slate-400 font-mono bg-slate-50 px-3 py-1 rounded-lg">
              #{job.job_id}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const ResumeAnalysisCard = ({ analysis }) => {
    const [showAllSkills, setShowAllSkills] = useState(false);
    const [showAllJobTitles, setShowAllJobTitles] = useState(false);
    const [showAllEducation, setShowAllEducation] = useState(false);
    const [showATSDetails, setShowATSDetails] = useState(false);

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
    const ATSScoreCard = ({ atsScore, showDetails, onToggleDetails }) => {
      const getScoreLabel = (score) => {
        if (score >= 0.8) return "Excellent";
        if (score >= 0.65) return "Good";
        if (score >= 0.5) return "Fair";
        return "Needs Work";
      };

      const getScoreColor = (score) => {
        if (score >= 0.8) return "from-slate-700 to-slate-800";
        if (score >= 0.65) return "from-slate-600 to-slate-700";
        if (score >= 0.5) return "from-slate-500 to-slate-600";
        return "from-slate-400 to-slate-500";
      };

      return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-md">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">ATS Compatibility Score</h3>
                <p className="text-xs text-slate-600 mt-0.5">How well your resume performs with Applicant Tracking Systems</p>
              </div>
            </div>
            <button
              onClick={onToggleDetails}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 border border-slate-300"
            >
              {showDetails ? "Hide Details" : "Show Details"}
            </button>
          </div>

          {/* Overall Score - Always Visible */}
          <div className="text-center mb-4">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getScoreColor(atsScore.overall_score)} flex items-center justify-center mx-auto shadow-lg`}>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {(atsScore.overall_score * 100).toFixed(0)}%
                </div>
                <div className="text-xs font-semibold text-white/90 mt-1">{getScoreLabel(atsScore.overall_score)}</div>
              </div>
            </div>
          </div>

          {/* Detailed Scores - Only show when expanded */}
          {showDetails && (
            <div className="grid md:grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-200">
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
                <div key={index} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                    <span className="text-xs text-slate-500 font-medium">{item.weight}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1.5">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${getScoreColor(item.score)} transition-all duration-500`}
                      style={{ width: `${item.score * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs font-bold text-slate-700">
                    {(item.score * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
              <p className="text-slate-700 text-base leading-relaxed">
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
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-semibold text-base text-slate-900">{weakness.category}</h4>
                      <span className="px-2.5 py-1 rounded text-xs font-medium bg-slate-200 text-slate-700">
                        {getSeverityLabel(weakness.severity)}
                      </span>
                    </div>
                    <p className="text-base text-slate-700 mb-3 leading-relaxed">{weakness.description}</p>
                    <div className="text-base text-slate-700 space-y-2 leading-relaxed">
                      <div><span className="font-semibold">Suggestion:</span> {weakness.suggestion}</div>
                      <div><span className="font-semibold">Impact:</span> {weakness.impact}</div>
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
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: ATS Score & Quality Check */}
        <div className="space-y-6">
          {/* ATS Score Card */}
          {analysis.ats_score && (
            <ATSScoreCard 
              atsScore={analysis.ats_score} 
              showDetails={showATSDetails}
              onToggleDetails={() => setShowATSDetails(!showATSDetails)}
            />
          )}
          
          {/* Weaknesses Card */}
          {analysis.weaknesses && <WeaknessesCard weaknesses={analysis.weaknesses} />}
        </div>

        {/* Right Column: Resume Analysis */}
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
                    {skill && skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase()}
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
                    <span className="text-slate-700 text-sm">{title && title.charAt(0).toUpperCase() + title.slice(1)}</span>
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
                        <span className="text-slate-700 text-sm">{edu && edu.charAt(0).toUpperCase() + edu.slice(1)}</span>
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
                    {keyword && keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase()}
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

  // Show loading screen
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg shadow-lg border-b-2 border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
                <Navigation className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  NaviCV
                </h1>
                <p className="text-sm font-medium text-slate-600">
                  AI-Powered Career Navigation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={refreshJobs}
                disabled={loading}
                className="flex items-center px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 border border-slate-300 hover:border-slate-400 hover:shadow-md"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex gap-3 bg-white rounded-2xl p-2 shadow-xl border-2 border-slate-200">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex items-center px-8 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === "search"
                ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg scale-105"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Search className="w-5 h-5 mr-2" />
            Explore Jobs
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center px-8 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === "upload"
                ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg scale-105"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Upload className="w-5 h-5 mr-2" />
            Resume Analysis
          </button>

          {matchedJobs.length > 0 && (
            <button
              onClick={() => setActiveTab("matches")}
              className={`flex items-center px-8 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === "matches"
                  ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg scale-105"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Target className="w-5 h-5 mr-2" />
              Career Matches
              <span className="ml-2 px-2.5 py-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-xs font-bold rounded-full shadow-md">
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
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-10 mb-8 relative overflow-hidden">
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full blur-3xl opacity-50"></div>
              <div className="relative">
                <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center">
                  <Compass className="w-7 h-7 mr-3 text-slate-600" />
                  Discover Your Next Opportunity
                </h2>
                <p className="text-slate-600 mb-6 ml-10">Find your dream job with AI-powered matching</p>
                <form onSubmit={handleSearch} className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-500 w-6 h-6" />
                    <input
                      type="text"
                      placeholder="Search for positions (e.g., Python Developer, Data Scientist, UX Designer)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-14 pr-5 py-5 border-2 border-slate-300 rounded-2xl focus:ring-4 focus:ring-slate-200 focus:border-slate-500 transition-all duration-200 text-slate-900 placeholder-slate-400 text-base font-medium shadow-sm hover:shadow-md"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white px-10 py-5 rounded-2xl hover:from-slate-800 hover:via-slate-900 hover:to-slate-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base inline-flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-6 h-6" />
                        Search Jobs
                      </>
                    )}
                  </button>
                </form>
              </div>
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
                  <h3 className="text-2xl font-bold text-slate-900">
                    {jobs.length} Positions Found
                  </h3>
                  <div className="relative">
                    <button
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-5 py-2.5 rounded-xl transition-all duration-200 border-2 border-slate-300 hover:border-slate-400 shadow-sm hover:shadow-md"
                    >
                      <Filter className="w-5 h-5" />
                      {sortBy === "latest" && "Showing latest results"}
                      {sortBy === "relevance" && "Sorted by relevance"}
                      {sortBy === "salary" && "Sorted by salary"}
                    </button>
                    {showSortMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border-2 border-slate-200 z-10 overflow-hidden">
                        <button
                          onClick={() => {
                            setSortBy("latest");
                            setShowSortMenu(false);
                          }}
                          className={`w-full text-left px-5 py-3 text-sm font-medium hover:bg-slate-50 transition-colors ${
                            sortBy === "latest" ? "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-900 font-semibold" : "text-slate-700"
                          }`}
                        >
                          Latest Results
                        </button>
                        <button
                          onClick={() => {
                            setSortBy("relevance");
                            setShowSortMenu(false);
                          }}
                          className={`w-full text-left px-5 py-3 text-sm font-medium hover:bg-slate-50 transition-colors ${
                            sortBy === "relevance" ? "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-900 font-semibold" : "text-slate-700"
                          }`}
                        >
                          Sort by Relevance
                        </button>
                        <button
                          onClick={() => {
                            setSortBy("salary");
                            setShowSortMenu(false);
                          }}
                          className={`w-full text-left px-5 py-3 text-sm font-medium hover:bg-slate-50 transition-colors ${
                            sortBy === "salary" ? "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-900 font-semibold" : "text-slate-700"
                          }`}
                        >
                          Sort by Salary
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-6">
                  {sortedJobs.map((job) => (
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
      <footer className="bg-gradient-to-br from-slate-50 to-slate-100 border-t-2 border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-lg">
                  <Navigation className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900">NaviCV</div>
                  <div className="text-xs text-slate-600">Navigate Your Career Journey</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                AI-powered career assistant helping you find the perfect job match and optimize your resume for success.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab("search")}
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Explore Jobs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Resume Analysis
                  </button>
                </li>
                {matchedJobs.length > 0 && (
                  <li>
                    <button
                      onClick={() => setActiveTab("matches")}
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Career Matches
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4">About</h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                NaviCV uses advanced AI and machine learning to analyze resumes, match candidates with jobs, and provide career insights.
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Powered by AI</span>
                <span>•</span>
                <span>Built for Success</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-slate-500">
                © {new Date().getFullYear()} NaviCV. All rights reserved.
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
                <span>Contact</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NaviCVApp;
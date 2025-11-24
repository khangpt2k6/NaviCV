import { useState } from "react";
import {
  FileText,
  Upload,
  Award,
  TrendingUp,
  Briefcase,
  BookOpen,
  Compass,
  Target,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

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

export const ResumeAnalysisCard = ({ analysis, onReset }) => {
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showAllJobTitles, setShowAllJobTitles] = useState(false);
  const [showAllEducation, setShowAllEducation] = useState(false);
  const [showATSDetails, setShowATSDetails] = useState(false);

  const skillsToShow = showAllSkills ? analysis.skills : analysis.skills.slice(0, 10);
  const jobTitlesToShow = showAllJobTitles ? analysis.job_titles : analysis.job_titles.slice(0, 5);
  const educationToShow = showAllEducation ? analysis.education : analysis.education.slice(0, 3);

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6 flex flex-col">
        {analysis.ats_score && (
          <div className="flex-shrink-0">
            <ATSScoreCard
              atsScore={analysis.ats_score}
              showDetails={showATSDetails}
              onToggleDetails={() => setShowATSDetails(!showATSDetails)}
            />
          </div>
        )}

        {analysis.weaknesses && (
          <div className="flex-shrink-0">
            <WeaknessesCard weaknesses={analysis.weaknesses} />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-md">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Resume Analysis</h3>
              <p className="text-slate-600 text-sm">AI-powered career insights</p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all duration-200 font-semibold text-sm border border-slate-300 shadow-sm hover:shadow-md"
          >
            <Upload className="w-4 h-4" />
            Upload New
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="font-bold text-lg text-slate-900 mb-5 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                <Award className="w-5 h-5 text-white" />
              </div>
              Skills
              <span className="ml-2 text-base font-normal text-slate-500">({analysis.skills.length})</span>
            </h4>
            <div className="flex flex-wrap gap-2.5 mb-4">
              {skillsToShow.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-default"
                >
                  {skill && skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase()}
                </span>
              ))}
            </div>
            {analysis.skills.length > 10 && (
              <button
                onClick={() => setShowAllSkills(!showAllSkills)}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium inline-flex items-center group"
              >
                {showAllSkills ? "Show Less" : `Show ${analysis.skills.length - 10} more skills`}
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="font-bold text-lg text-slate-900 mb-4 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              Experience Level
            </h4>
            <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {analysis.experience_years ? `${analysis.experience_years} years` : "Entry Level"}
              </div>
              <div className="text-sm text-slate-600">Professional experience</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="font-bold text-lg text-slate-900 mb-5 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              Career History
              <span className="ml-2 text-base font-normal text-slate-500">({analysis.job_titles.length})</span>
            </h4>
            <div className="space-y-4">
              {jobTitlesToShow.map((title, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="w-1 h-1 bg-slate-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <h5 className="text-base font-semibold text-slate-900 mb-1">
                      {title && title.charAt(0).toUpperCase() + title.slice(1)}
                    </h5>
                  </div>
                </div>
              ))}
            </div>
            {analysis.job_titles.length > 5 && (
              <button
                onClick={() => setShowAllJobTitles(!showAllJobTitles)}
                className="mt-4 text-slate-600 hover:text-slate-900 text-sm font-medium inline-flex items-center group"
              >
                {showAllJobTitles ? "Show Less" : `Show ${analysis.job_titles.length - 5} more positions`}
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="font-bold text-lg text-slate-900 mb-5 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              Education
              <span className="ml-2 text-base font-normal text-slate-500">({analysis.education.length})</span>
            </h4>
            <div className="space-y-4">
              {analysis.education.length > 0 ? (
                <>
                  {educationToShow.map((edu, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="w-1 h-1 bg-slate-400 rounded-full mt-2.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {edu && edu.charAt(0).toUpperCase() + edu.slice(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {analysis.education.length > 3 && (
                    <button
                      onClick={() => setShowAllEducation(!showAllEducation)}
                      className="mt-4 text-slate-600 hover:text-slate-900 text-sm font-medium inline-flex items-center group"
                    >
                      {showAllEducation ? "Show Less" : `Show ${analysis.education.length - 3} more`}
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </>
              ) : (
                <div className="text-slate-500 text-sm italic p-4 bg-slate-50 rounded-lg border border-slate-100">
                  No education information detected
                </div>
              )}
            </div>
          </div>
        </div>

        {analysis.keywords && analysis.keywords.length > 0 && (
          <div className="mt-6 p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-4">Top Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.slice(0, 15).map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-white/70 backdrop-blur-sm text-slate-700 rounded-lg text-xs font-medium border border-slate-200/50 shadow-sm"
                >
                  {keyword && keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-6 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl text-white shadow-lg">
          <h4 className="font-bold mb-3 flex items-center">
            <Compass className="w-5 h-5 mr-2" />
            Career Summary
          </h4>
          <p className="leading-relaxed opacity-95 text-sm">{analysis.summary}</p>
        </div>
      </div>
    </div>
  );
};



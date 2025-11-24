import { useState } from "react";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  ArrowRight,
  Target,
} from "lucide-react";
import { formatJobDescription, createFormattedHTML } from "../utils/textFormatter";

export const JobCard = ({ job, showMatchScore = false }) => {
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
  const matchColor =
    matchPercentage >= 70
      ? "from-emerald-500 to-teal-600"
      : matchPercentage >= 50
      ? "from-slate-500 to-slate-600"
      : "from-amber-500 to-orange-600";

  return (
    <div className="group bg-white rounded-2xl shadow-lg border border-slate-200 p-8 hover:shadow-2xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
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
              <div
                className={`w-16 h-16 bg-gradient-to-br ${matchColor} rounded-full flex items-center justify-center mb-3 mx-auto shadow-lg`}
              >
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                Match Score
              </div>
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
              <div className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                Semantic
              </div>
              <div className="text-lg font-bold text-slate-700">
                {(job.semantic_score * 100).toFixed(0)}%
              </div>
            </div>
            <div className="w-px bg-slate-300"></div>
            <div className="text-center flex-1">
              <div className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                Keywords
              </div>
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



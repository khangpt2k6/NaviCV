import { Target, Upload, ArrowRight } from "lucide-react";
import { JobCard } from "../components/JobCard";

export const MatchesPage = ({ matchedJobs, onTabChange }) => {
  if (matchedJobs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Target className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Career Matches Yet</h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Upload your resume to discover personalized job opportunities that align with your skills and experience
        </p>
        <button
          onClick={() => onTabChange("upload")}
          className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-8 py-3 rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all duration-200 font-medium inline-flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Get Started
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Your Career Matches</h2>
            <p className="opacity-90">AI-curated opportunities based on your resume analysis</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{matchedJobs.length}</div>
            <div className="text-sm opacity-75">Total Matches</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">
              {matchedJobs.filter((job) => job.match_score > 0.7).length}
            </div>
            <div className="text-sm opacity-75">High Matches (70%+)</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">
              {Math.round(
                (matchedJobs.reduce((acc, job) => acc + job.match_score, 0) / matchedJobs.length) * 100
              )}
              %
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
  );
};



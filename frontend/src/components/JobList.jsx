import { Search, Filter, Loader2 } from "lucide-react";
import { JobCard } from "./JobCard";

export const JobList = ({ jobs, sortedJobs, sortBy, onSortChange, showSortMenu, onToggleSortMenu, loading }) => {
  if (loading && jobs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Discovering Opportunities</h3>
        <p className="text-slate-600">Searching through thousands of positions...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Explore</h3>
        <p className="text-slate-600">Use the search above to find your perfect career match</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-900">{jobs.length} Positions Found</h3>
        <div className="relative">
          <button
            onClick={onToggleSortMenu}
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
                  onSortChange("latest");
                  onToggleSortMenu();
                }}
                className={`w-full text-left px-5 py-3 text-sm font-medium hover:bg-slate-50 transition-colors ${
                  sortBy === "latest" ? "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-900 font-semibold" : "text-slate-700"
                }`}
              >
                Latest Results
              </button>
              <button
                onClick={() => {
                  onSortChange("relevance");
                  onToggleSortMenu();
                }}
                className={`w-full text-left px-5 py-3 text-sm font-medium hover:bg-slate-50 transition-colors ${
                  sortBy === "relevance" ? "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-900 font-semibold" : "text-slate-700"
                }`}
              >
                Sort by Relevance
              </button>
              <button
                onClick={() => {
                  onSortChange("salary");
                  onToggleSortMenu();
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
  );
};



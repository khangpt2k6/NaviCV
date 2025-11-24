import { Search, Upload, Target } from "lucide-react";

export const NavigationTabs = ({ activeTab, onTabChange, matchCount }) => {
  return (
    <nav className="flex gap-3 bg-white rounded-2xl p-2 shadow-xl border-2 border-slate-200">
      <button
        onClick={() => onTabChange("search")}
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
        onClick={() => onTabChange("upload")}
        className={`flex items-center px-8 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
          activeTab === "upload"
            ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg scale-105"
            : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
        }`}
      >
        <Upload className="w-5 h-5 mr-2" />
        Resume Analysis
      </button>

      {matchCount > 0 && (
        <button
          onClick={() => onTabChange("matches")}
          className={`flex items-center px-8 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
            activeTab === "matches"
              ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg scale-105"
              : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Target className="w-5 h-5 mr-2" />
          Career Matches
          <span className="ml-2 px-2.5 py-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-xs font-bold rounded-full shadow-md">
            {matchCount}
          </span>
        </button>
      )}
    </nav>
  );
};



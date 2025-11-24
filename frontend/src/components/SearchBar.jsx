import { Search, Compass, Loader2 } from "lucide-react";

export const SearchBar = ({ searchQuery, onSearchChange, onSearch, loading }) => {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-10 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full blur-3xl opacity-50"></div>
      <div className="relative">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center">
          <Compass className="w-7 h-7 mr-3 text-slate-600" />
          Discover Your Next Opportunity
        </h2>
        <p className="text-slate-600 mb-6 ml-10">Find your dream job with AI-powered matching</p>
        <form onSubmit={onSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-500 w-6 h-6" />
            <input
              type="text"
              placeholder="Search for positions (e.g., Python Developer, Data Scientist, UX Designer)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
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
  );
};



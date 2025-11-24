import { Navigation, RefreshCw } from "lucide-react";

export const Header = ({ onRefresh, loading }) => {
  return (
    <header className="bg-white/95 backdrop-blur-lg shadow-lg border-b-2 border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
              <Navigation className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">NaviCV</h1>
              <p className="text-sm font-medium text-slate-600">
                AI-Powered Career Navigation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 border border-slate-300 hover:border-slate-400 hover:shadow-md"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};



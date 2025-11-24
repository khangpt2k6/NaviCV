import { Navigation } from "lucide-react";

export const Footer = ({ onTabChange, hasMatches }) => {
  return (
    <footer className="bg-gradient-to-br from-slate-50 to-slate-100 border-t-2 border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
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

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onTabChange("search")}
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Explore Jobs
                </button>
              </li>
              <li>
                <button
                  onClick={() => onTabChange("upload")}
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Resume Analysis
                </button>
              </li>
              {hasMatches && (
                <li>
                  <button
                    onClick={() => onTabChange("matches")}
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Career Matches
                  </button>
                </li>
              )}
            </ul>
          </div>

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
  );
};



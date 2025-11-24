import { Loader2 } from "lucide-react";

export const LoadingScreen = ({ message = "Loading NaviCV", subtitle = "Preparing your career navigation experience..." }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{message}</h3>
        <p className="text-slate-600">{subtitle}</p>
      </div>
    </div>
  );
};



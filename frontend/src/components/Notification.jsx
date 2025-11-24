import { CheckCircle } from "lucide-react";

export const Notification = ({ error, success, onClose }) => {
  if (!error && !success) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
      <div
        className={`${
          error
            ? "bg-red-50 border border-red-200 text-red-800"
            : "bg-emerald-50 border border-emerald-200 text-emerald-800"
        } px-6 py-4 rounded-xl flex items-start gap-3`}
      >
        <div className={`w-5 h-5 ${error ? "text-red-500" : "text-emerald-500"} mt-0.5`}>
          {error ? "⚠️" : <CheckCircle className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <h4 className="font-medium mb-1">{error ? "Error" : "Success"}</h4>
          <p className="text-sm">{error || success}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};



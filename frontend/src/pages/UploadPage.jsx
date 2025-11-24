import { useState } from "react";
import { Upload, ArrowRight, Loader2 } from "lucide-react";
import { FileUploadZone } from "../components/FileUploadZone";
import { ResumeAnalysisCard } from "../components/ResumeAnalysisCard";
import { analyzeResume, matchJobs } from "../utils/api";

export const UploadPage = ({
  resumeAnalysis,
  onResumeAnalysis,
  onMatchedJobs,
  onTabChange,
  matchedJobsCount,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileUpload = async (file) => {
    if (!file) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setSelectedFile(file);

    try {
      const analysis = await analyzeResume(file);
      onResumeAnalysis(analysis);

      const resumeText =
        analysis.summary + " " + analysis.skills.join(" ") + " " + analysis.keywords.join(" ");
      const matches = await matchJobs(resumeText);
      onMatchedJobs(matches);

      setSuccess("Resume analyzed successfully! Found matching jobs.");
      onTabChange("matches");
    } catch (err) {
      setError("Failed to process resume. Please try again.");
      console.error("Error processing resume:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    onResumeAnalysis(null);
    onMatchedJobs([]);
    setSelectedFile(null);
    setError("");
    setSuccess("");
  };

  return (
    <div className="space-y-8">
      {resumeAnalysis && !loading && (
        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            <Upload className="w-5 h-5" />
            Upload New Resume
          </button>
        </div>
      )}

      {!resumeAnalysis && !loading && (
        <FileUploadZone onFileSelect={handleFileUpload} selectedFile={selectedFile} />
      )}

      {loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Analyzing Your Resume</h3>
          <p className="text-slate-600">Our AI is extracting key insights from your career history...</p>
          <div className="mt-4 w-64 h-2 bg-slate-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-slate-600 to-slate-700 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {resumeAnalysis && <ResumeAnalysisCard analysis={resumeAnalysis} onReset={handleReset} />}

      {resumeAnalysis && (
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Ready for Your Next Step?</h3>
              <p className="opacity-90">We've found {matchedJobsCount} positions that match your profile</p>
            </div>
            <button
              onClick={() => onTabChange("matches")}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium inline-flex items-center gap-2 backdrop-blur-sm"
            >
              View Matches
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};



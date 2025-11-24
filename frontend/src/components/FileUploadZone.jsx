import { Upload, ArrowRight } from "lucide-react";

export const FileUploadZone = ({ onFileSelect, selectedFile }) => {
  return (
    <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 group">
      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform">
        <Upload className="w-8 h-8 text-slate-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Your Resume</h3>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">
        Drop your PDF, DOCX, or text file here to get AI-powered career insights and job matches
      </p>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) onFileSelect(file);
        }}
        accept=".pdf,.txt,.docx"
        className="hidden"
        id="resume-upload"
      />
      <label
        htmlFor="resume-upload"
        className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-8 py-3 rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all duration-200 cursor-pointer inline-flex items-center font-medium group"
      >
        <Upload className="w-4 h-4 mr-2" />
        Choose File
        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
      </label>
      {selectedFile && (
        <div className="mt-4 p-3 bg-slate-100 rounded-lg inline-block">
          <p className="text-sm text-slate-700 font-medium">📄 {selectedFile.name}</p>
        </div>
      )}
    </div>
  );
};



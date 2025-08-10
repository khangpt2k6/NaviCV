import React, { useState, useEffect } from 'react';
import { uploadResumeFile, deleteResumeFile, getUserProfile, updateUserProfile } from '../firebase';

const StorageManager = ({ userId }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Debug log for userId
  useEffect(() => {
    console.log('StorageManager: userId received:', userId);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      loadUserFiles().finally(() => setLoading(false));
    } else {
      console.log('StorageManager: No userId provided');
      setError('User not authenticated. Please log in again.');
      setLoading(false);
    }
  }, [userId]);

  const loadUserFiles = async () => {
    if (!userId) {
      console.log('No userId provided, skipping file load');
      return;
    }
    
    try {
      const profileResult = await getUserProfile(userId);
      if (profileResult.success && profileResult.data.files) {
        setFiles(profileResult.data.files);
      }
    } catch (err) {
      console.error('Error loading files:', err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate userId
    if (!userId) {
      setError('User not authenticated. Please log in again.');
      return;
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('doc') && !file.type.includes('docx')) {
      setError('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const uploadResult = await uploadResumeFile(userId, file);
      
      if (uploadResult.success) {
        const newFile = {
          name: file.name,
          url: uploadResult.url,
          size: file.size,
          uploadedAt: new Date()
        };

        const updatedFiles = [...files, newFile];
        setFiles(updatedFiles);

        // Update user profile with new file list
        await updateUserProfile(userId, { files: updatedFiles });
        
        setSuccess(`File "${file.name}" uploaded successfully!`);
        event.target.value = ''; // Clear input
      } else {
        setError(uploadResult.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('An unexpected error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileName) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    // Validate userId
    if (!userId) {
      setError('User not authenticated. Please log in again.');
      return;
    }

    setDeleting(fileName);
    setError('');
    setSuccess('');

    try {
      const deleteResult = await deleteResumeFile(userId, fileName);
      
      if (deleteResult.success) {
        const updatedFiles = files.filter(file => file.name !== fileName);
        setFiles(updatedFiles);

        // Update user profile with new file list
        await updateUserProfile(userId, { files: updatedFiles });
        
        setSuccess(`File "${fileName}" deleted successfully!`);
      } else {
        setError(deleteResult.error || 'Delete failed');
      }
    } catch (err) {
      setError('An unexpected error occurred during deletion');
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="max-w-4xl mx-auto p-5 font-sans">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-slate-700 text-3xl font-bold mb-3 bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
          Resume Storage
        </h2>
        <p className="text-slate-600 text-base">Upload and manage your resume files</p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200 mb-5 animate-in slide-in-from-top-2 duration-300">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm border border-green-200 mb-5 animate-in slide-in-from-top-2 duration-300">
          {success}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-2 border-slate-600/30 border-t-slate-600 rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Loading Your Files
          </h3>
          <p className="text-slate-600">
            Please wait while we load your resume files...
          </p>
        </div>
      )}

      {/* Upload Section */}
      {!loading && (
        <div className="mb-10">
          <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 transition-all duration-300 hover:border-slate-600 hover:bg-slate-100">
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <label htmlFor="file-upload" className="inline-flex items-center gap-3 bg-gradient-to-r from-slate-600 to-slate-800 text-white px-6 py-4 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-600/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none">
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Upload Resume</span>
                </>
              )}
            </label>
            <p className="mt-4 text-slate-600 text-sm">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
          </div>
        </div>
      )}

      {/* Files Section */}
      {!loading && (
        <div>
          <h3 className="text-slate-700 text-2xl font-semibold mb-5">
            Your Files ({files.length})
          </h3>
          
          {files.length === 0 ? (
            <div className="text-center py-16 px-5 text-slate-600">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-400 mb-4 mx-auto">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            <p className="mb-2 font-semibold text-slate-700">No files uploaded yet</p>
            <p>Upload your first resume to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {files.map((file, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg hover:border-slate-600 shadow-sm">
                <div className="flex-shrink-0 text-slate-600">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-slate-700 text-base font-semibold mb-1 truncate">
                    {file.name}
                  </h4>
                  <p className="text-slate-600 text-sm">
                    {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                  </p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-9 h-9 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 hover:scale-105 transition-all duration-300"
                    title="View file"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </a>
                  
                  <button
                    onClick={() => handleFileDelete(file.name)}
                    disabled={deleting === file.name}
                    className="flex items-center justify-center w-9 h-9 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    title="Delete file"
                  >
                    {deleting === file.name ? (
                      <div className="w-4 h-4 border border-red-600/30 border-t-red-600 rounded-full animate-spin"></div>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}
    </div>
  );
};

export default StorageManager;
"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Org Verification Component
const OrgVerification = ({ user, onVerificationSuccess, isDark }) => {
  const [step, setStep] = useState('email'); // 'email', 'otp', 'details'
  const [formData, setFormData] = useState({
    org_mail: '',
    otp: '',
    org_name: '',
    class_sec: '',
    branch: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Use org-specific functions for OTP verification
  const verifyOrgOTP = useMutation(api.org.verifyOrgOTP);
  const createOrUpdateOrg = useMutation(api.org.createOrUpdateOrg);

  const handleSendOTP = async () => {
    if (!formData.org_mail.endsWith('@reva.edu.in')) {
      setError('Only @reva.edu.in domain is allowed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use the new org email API route
      const response = await fetch('/api/org/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          org_mail: formData.org_mail,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOtpSent(true);
        setStep('otp');
        // Show success message instead of OTP for security
        console.log('OTP sent to:', formData.org_mail);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use org-specific OTP verification function
      const result = await verifyOrgOTP({
        org_mail: formData.org_mail,
        otp: formData.otp
      });

      if (result.success) {
        setStep('details');
      } else {
        setError(result.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDetails = async () => {
    if (!formData.org_name || !formData.class_sec || !formData.branch) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await createOrUpdateOrg({
        org_name: formData.org_name,
        org_user: user.username,
        org_mail: formData.org_mail,
        class_sec: formData.class_sec,
        branch: formData.branch
      });

      if (result.success) {
        onVerificationSuccess();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to save organization details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'} ${isDark ? 'dark' : ''}`}>
      <div className="max-w-md w-full">
        <div className="glass-card rounded-3xl p-8 shadow-xl" style={{ 
          background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(40px) saturate(200%)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.3)'}`,
          boxShadow: `0 8px 32px ${isDark ? 'rgba(0, 0, 0, 0.37)' : 'rgba(31, 38, 135, 0.37)'}, inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.1)`
        }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full mb-4">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Knowledge Nest Verification
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Verify your organization email to access institutional resources
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {step === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Organization Email
                </label>
                <input
                  type="email"
                  value={formData.org_mail}
                  onChange={(e) => handleInputChange('org_mail', e.target.value)}
                  placeholder="your.email@reva.edu.in"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Only @reva.edu.in domain is allowed
                </p>
              </div>
              <button
                onClick={handleSendOTP}
                disabled={loading || !formData.org_mail}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium py-3 px-6 rounded-xl hover:from-indigo-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending OTP...' : 'Send Verification Code'}
              </button>
              {otpSent && !loading && (
                <div className="mt-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                  ✅ Verification code sent to {formData.org_mail}. Please check your email inbox.
                </div>
              )}
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={formData.otp}
                  onChange={(e) => handleInputChange('otp', e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg tracking-widest"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  We've sent a 6-digit verification code to {formData.org_mail}
                </p>
              </div>
              <button
                onClick={handleVerifyOTP}
                disabled={loading || formData.otp.length !== 6}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium py-3 px-6 rounded-xl hover:from-indigo-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('email')}
                  className="flex-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium py-2"
                >
                  Back to Email
                </button>
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, otp: '' }));
                    setError('');
                    handleSendOTP();
                  }}
                  disabled={loading}
                  className="flex-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium py-2 disabled:opacity-50"
                >
                  Resend Code
                </button>
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={formData.org_name}
                  onChange={(e) => handleInputChange('org_name', e.target.value)}
                  placeholder="e.g., Reva University"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class/Section
                </label>
                <input
                  type="text"
                  value={formData.class_sec}
                  onChange={(e) => handleInputChange('class_sec', e.target.value)}
                  placeholder="e.g., 4th Year, Section A"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch
                </label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                  placeholder="e.g., Computer Science Engineering"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleSubmitDetails}
                disabled={loading || !formData.org_name || !formData.class_sec || !formData.branch}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium py-3 px-6 rounded-xl hover:from-indigo-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Complete Verification'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Knowledge Nest Component
const KnowledgeNestContent = ({ user, isDark }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const handleFileUpload = (files) => {
    // TODO: Implement file upload functionality
    console.log('Files to upload:', files);
    
    // For now, just add to the local state for demo
    const newFiles = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.username
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`min-h-screen pt-16 transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'} ${isDark ? 'dark' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Knowledge Nest
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Collaborative learning hub for institutional resources and materials
          </p>
        </div>

        {/* Upload and Search Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Upload Section */}
          <div className="glass-card rounded-3xl p-6 shadow-md" style={{ 
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(40px) saturate(200%)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.3)'}`,
            boxShadow: `0 8px 32px ${isDark ? 'rgba(0, 0, 0, 0.37)' : 'rgba(31, 38, 135, 0.37)'}, inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.1)`
          }}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Upload Resources
            </h2>
            
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Drag and drop files here, or
              </p>
              <label className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg hover:from-indigo-600 hover:to-blue-600 cursor-pointer transition-all">
                <span>Browse Files</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Support for PDF, DOC, PPT, images and more
              </p>
            </div>
          </div>

          {/* Search Section */}
          <div className="glass-card rounded-3xl p-6 shadow-md" style={{ 
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(40px) saturate(200%)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.3)'}`,
            boxShadow: `0 8px 32px ${isDark ? 'rgba(0, 0, 0, 0.37)' : 'rgba(31, 38, 135, 0.37)'}, inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.1)`
          }}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Search Resources
            </h2>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by subject, topic, or keywords..."
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium py-3 px-6 rounded-xl hover:from-indigo-600 hover:to-blue-600 transition-all"
              >
                Search Resources
              </button>
            </form>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Filters:</p>
              <div className="flex flex-wrap gap-2">
                {['Notes', 'Assignments', 'Previous Papers', 'Projects', 'Lab Reports'].map((filter) => (
                  <button
                    key={filter}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded Files Display */}
        <div className="glass-card rounded-3xl p-6 shadow-md" style={{ 
          background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(40px) saturate(200%)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.3)'}`,
          boxShadow: `0 8px 32px ${isDark ? 'rgba(0, 0, 0, 0.37)' : 'rgba(31, 38, 135, 0.37)'}, inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.1)`
        }}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Recent Uploads
          </h2>
          
          {uploadedFiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No files uploaded yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload your first file to get started with collaborative learning
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {file.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                        New
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <p>Uploaded by: {file.uploadedBy}</p>
                    <p>Date: {new Date(file.uploadedAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
                      View
                    </button>
                    <button className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.5)'};
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.3)'};
          box-shadow: 
            0 8px 32px ${isDark ? 'rgba(0, 0, 0, 0.37)' : 'rgba(31, 38, 135, 0.37)'},
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

// Main Page Component
export default function KnowledgeNestPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // Theme and User Initialization
  useEffect(() => {
    // Initialize user data
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Initialize theme based on localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme ? savedTheme === "dark" : systemDarkMode;
    setIsDark(initialDarkMode);
    document.documentElement.classList.toggle('dark', initialDarkMode);

    // Listen for theme changes
    const handleThemeChange = (e) => {
      const newDarkMode = e.detail.isDark;
      setIsDark(newDarkMode);
      document.documentElement.classList.toggle('dark', newDarkMode);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    setLoading(false);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  // Get user data and check verification status
  const isOrgVerified = useQuery(
    api.org.isOrgVerified,
    user ? { org_user: user.username } : "skip"
  );

  const handleVerificationSuccess = () => {
    // Refresh the verification status
    window.location.reload();
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Please log in to access Knowledge Nest
          </h2>
        </div>
      </div>
    );
  }

  // Show verification form if not verified
  if (isOrgVerified === false) {
    return (
      <ProtectedRoute>
        <OrgVerification user={user} onVerificationSuccess={handleVerificationSuccess} isDark={isDark} />
      </ProtectedRoute>
    );
  }

  // Show loading while checking verification status
  if (isOrgVerified === undefined) {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show main Knowledge Nest content if verified
  return (
    <ProtectedRoute>
      <KnowledgeNestContent user={user} isDark={isDark} />
    </ProtectedRoute>
  );
}

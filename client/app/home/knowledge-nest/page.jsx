"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import FileUploadModal from "@/components/FileUploadModal";
import FileDisplayComponent from "@/components/FileDisplayComponent";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Upload, BookOpen, Users, FileText, Settings, Moon, Sun } from "lucide-react";

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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get user's organization details
  const userOrgDetails = useQuery(api.knowledgeNest.getUserOrgDetails, {
    username: user.username,
  });

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!userOrgDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userOrgDetails.success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600">{userOrgDetails.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-16 transition-colors duration-300 ${
      isDark ? 'bg-gray-950' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-4">
                📚 Knowledge Nest
              </h1>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-lg`}>
                Collaborative learning hub for {userOrgDetails.data.org_name}
              </p>
            </div>
            
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload File
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-xl border ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          } shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Organization</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  {userOrgDetails.data.org_name}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          } shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Class</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  {userOrgDetails.data.class_sec}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          } shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Branch</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  {userOrgDetails.data.branch}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Files Section */}
        <div className={`rounded-xl border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } shadow-lg p-6`}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Shared Resources</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Files shared within your organization and class
            </p>
          </div>

          <FileDisplayComponent 
            username={user.username}
            isDark={isDark}
            key={refreshTrigger} // Force refresh after upload
          />
        </div>
      </div>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        userOrgDetails={userOrgDetails.data}
        onUploadSuccess={handleUploadSuccess}
        isDark={isDark}
      />
    </div>
  );
};

// Main Page Component
export default function KnowledgeNestPage() {
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState(null);
  const [isOrgVerified, setIsOrgVerified] = useState(undefined);

  // Get current user data from register table
  const userQuery = useQuery(api.auth.getCurrentUser);
  const orgQuery = useQuery(
    api.org.getOrgByUser, 
    user ? { org_user: user.username } : "skip"
  );

  useEffect(() => {
    // Get theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    setIsDark(savedTheme === 'dark');

    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (orgQuery !== undefined) {
      if (orgQuery && orgQuery.success && orgQuery.org && orgQuery.org.org_verified) {
        setIsOrgVerified(true);
      } else {
        setIsOrgVerified(false);
      }
    }
  }, [orgQuery]);

  const handleVerificationSuccess = () => {
    // Force a page reload to refresh the verification status
    window.location.reload();
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // Theme toggle button (top-right)
  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className={`fixed top-4 right-4 z-50 p-3 rounded-full transition-all duration-300 ${
        isDark 
          ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
          : 'bg-white hover:bg-gray-100 text-gray-600'
      } shadow-lg hover:shadow-xl transform hover:scale-110`}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ThemeToggle />
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
        <ThemeToggle />
        <OrgVerification user={user} onVerificationSuccess={handleVerificationSuccess} isDark={isDark} />
      </ProtectedRoute>
    );
  }

  // Show loading while checking verification status
  if (isOrgVerified === undefined) {
    return (
      <ProtectedRoute>
        <ThemeToggle />
        <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show main Knowledge Nest content if verified
  return (
    <ProtectedRoute>
      <ThemeToggle />
      <KnowledgeNestContent user={user} isDark={isDark} />
    </ProtectedRoute>
  );
}

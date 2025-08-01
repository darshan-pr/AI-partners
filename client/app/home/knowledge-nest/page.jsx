"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import FileUploadModal from "@/components/FileUploadModal";
import FileDisplayComponent from "@/components/FileDisplayComponent";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Upload, 
  BookOpen, 
  Users, 
  FileText, 
  Settings, 
  Moon, 
  Sun,
  Building2,
  GraduationCap,
  Calendar,
  TrendingUp,
  Archive,
  Share2,
  Shield,
  Sparkles,
  AlertTriangle,
  Send,
  CheckCircle
} from "lucide-react";

// Org Verification Component
const OrgVerification = ({ user, onVerificationSuccess, isDark }) => {
  const [step, setStep] = useState('email'); // 'email', 'otp', 'details'
  const [formData, setFormData] = useState({
    org_mail: '',
    otp: '',
    org_name: '',
    semester: '',
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
    if (!formData.org_name || !formData.semester || !formData.branch) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate semester
    const semesterNum = parseInt(formData.semester);
    if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
      setError('Semester must be between 1 and 8');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await createOrUpdateOrg({
        org_name: formData.org_name,
        org_user: user.username,
        org_mail: formData.org_mail,
        semester: formData.semester,
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
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Enhanced Dynamic background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Main gradient orbs */}
        <div className={`absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl animate-pulse opacity-70 ${
          isDark 
            ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' 
            : 'bg-gradient-to-br from-blue-300/30 to-purple-300/30'
        }`}></div>
        <div className={`absolute top-40 right-20 w-80 h-80 rounded-full blur-3xl animate-pulse animation-delay-2000 opacity-60 ${
          isDark 
            ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' 
            : 'bg-gradient-to-br from-purple-300/30 to-pink-300/30'
        }`}></div>
        <div className={`absolute bottom-20 left-32 w-72 h-72 rounded-full blur-3xl animate-pulse animation-delay-4000 opacity-50 ${
          isDark 
            ? 'bg-gradient-to-br from-pink-500/20 to-indigo-500/20' 
            : 'bg-gradient-to-br from-pink-300/30 to-indigo-300/30'
        }`}></div>
        
        {/* Grid pattern overlay */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`}>
          <div className="grid-pattern"></div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full animate-bounce ${
                isDark ? 'bg-blue-400/30' : 'bg-blue-500/40'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="max-w-lg w-full relative z-10">
        <div 
          className={`glass-card rounded-3xl p-8 shadow-2xl border transition-all duration-300 ${
            isDark 
              ? 'bg-gray-900/80 border-gray-700/50 shadow-black/50' 
              : 'bg-white/80 border-white/50 shadow-blue-900/20'
          }`} 
          style={{ 
            backdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: isDark 
              ? '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
              : '0 20px 40px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          }}
        >
          {/* Header with icon */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
              <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 animate-pulse`}></div>
              <div className={`relative flex items-center justify-center w-16 h-16 rounded-full ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}>
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <h2 className={`text-3xl font-bold mb-3 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              🔐 Knowledge Nest Access
            </h2>
            <p className={`text-lg leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Verify your institutional email to access shared academic resources within your organization
            </p>
          </div>

          {/* Status indicator */}
          <div className={`mb-6 p-4 rounded-2xl border ${
            isDark 
              ? 'bg-blue-900/30 border-blue-700/50 text-blue-300' 
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">
                Secure verification process with @reva.edu.in domain
              </span>
            </div>
          </div>

          {error && (
            <div className={`mb-6 p-4 rounded-2xl border border-red-300 ${
              isDark 
                ? 'bg-red-900/30 text-red-300' 
                : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {step === 'email' && (
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  🏫 Organization Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.org_mail}
                    onChange={(e) => handleInputChange('org_mail', e.target.value)}
                    placeholder="your.email@reva.edu.in"
                    className={`w-full px-5 py-4 rounded-2xl border-2 transition-all duration-200 text-lg ${
                      isDark 
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-700' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-blue-50/50'
                    } focus:outline-none focus:ring-0`}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Building2 className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                  </div>
                </div>
                <p className={`text-xs mt-2 flex items-center gap-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Shield className="w-3 h-3" />
                  Only verified @reva.edu.in domain emails are accepted
                </p>
              </div>
              
              <button
                onClick={handleSendOTP}
                disabled={loading || !formData.org_mail}
                className={`w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-200 transform ${
                  loading || !formData.org_mail
                    ? 'bg-gray-400 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending Verification Code...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Send className="w-5 h-5" />
                    Send Verification Code
                  </div>
                )}
              </button>
              
              {otpSent && !loading && (
                <div className={`p-4 rounded-2xl border ${
                  isDark 
                    ? 'bg-green-900/30 border-green-700/50 text-green-300' 
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Verification code sent!</p>
                      <p className="text-xs mt-1 opacity-90">
                        Please check your email inbox at {formData.org_mail}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  🔢 Enter Verification Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.otp}
                    onChange={(e) => handleInputChange('otp', e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className={`w-full px-5 py-4 rounded-2xl border-2 transition-all duration-200 text-center text-2xl tracking-widest font-mono ${
                      isDark 
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-700' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-blue-50/50'
                    } focus:outline-none focus:ring-0`}
                  />
                </div>
                <p className={`text-xs mt-2 flex items-center gap-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Calendar className="w-3 h-3" />
                  We've sent a 6-digit verification code to {formData.org_mail}
                </p>
              </div>
              
              <button
                onClick={handleVerifyOTP}
                disabled={loading || formData.otp.length !== 6}
                className={`w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-200 transform ${
                  loading || formData.otp.length !== 6
                    ? 'bg-gray-400 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying Code...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    Verify & Continue
                  </div>
                )}
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStep('email')}
                  className={`py-3 px-4 rounded-2xl font-medium transition-all duration-200 ${
                    isDark 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  ← Back to Email
                </button>
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, otp: '' }));
                    setError('');
                    handleSendOTP();
                  }}
                  disabled={loading}
                  className={`py-3 px-4 rounded-2xl font-medium transition-all duration-200 ${
                    loading 
                      ? 'opacity-50 cursor-not-allowed' 
                      : isDark 
                        ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900 border border-blue-700' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                  }`}
                >
                  Resend Code
                </button>
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border ${
                isDark 
                  ? 'bg-blue-900/30 border-blue-700/50 text-blue-300' 
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Email verified successfully! Complete your profile below.
                  </span>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  👤 Username (Read-only)
                </label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all duration-200 ${
                    isDark 
                      ? 'border-gray-600 bg-gray-700 text-gray-300 cursor-not-allowed' 
                      : 'border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  🏫 Organization Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.org_name}
                    onChange={(e) => handleInputChange('org_name', e.target.value)}
                    placeholder="e.g., Reva University"
                    className={`w-full px-5 py-4 rounded-2xl border-2 transition-all duration-200 ${
                      isDark 
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-700' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-blue-50/50'
                    } focus:outline-none focus:ring-0`}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Building2 className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  📚 Semester (1-8)
                </label>
                <div className="relative">
                  <select
                    value={formData.semester}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                    className={`w-full px-5 py-4 rounded-2xl border-2 transition-all duration-200 appearance-none ${
                      isDark 
                        ? 'border-gray-600 bg-gray-800 text-white focus:border-blue-500 focus:bg-gray-700' 
                        : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:bg-blue-50/50'
                    } focus:outline-none focus:ring-0`}
                  >
                    <option value="">Select Your Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem.toString()}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <GraduationCap className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  🎓 Branch/Department
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                    placeholder="e.g., Computer Science Engineering"
                    className={`w-full px-5 py-4 rounded-2xl border-2 transition-all duration-200 ${
                      isDark 
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-700' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-blue-50/50'
                    } focus:outline-none focus:ring-0`}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Archive className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmitDetails}
                disabled={loading || !formData.org_name || !formData.semester || !formData.branch}
                className={`w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-200 transform ${
                  loading || !formData.org_name || !formData.semester || !formData.branch
                    ? 'bg-gray-400 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Completing Setup...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className="w-5 h-5" />
                    Complete Verification
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Knowledge Nest Dashboard Component
const KnowledgeNestDashboard = ({ user, isDark }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch organization details for current user
  const userOrgDetails = useQuery(api.org.getOrgByUser, {
    org_user: user.username,
  });

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  if (!userOrgDetails || !userOrgDetails.success || !userOrgDetails.org) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className={`glass-card p-8 rounded-3xl ${
          isDark ? 'bg-gray-900/80' : 'bg-white/80'
        }`}>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className={`text-center font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>Loading organization details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300`}>
      {/* Mobile-optimized container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20 lg:pt-24 relative z-10">
        {/* Enhanced Header Section */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 animate-pulse"></div>
            <div className={`relative flex items-center justify-center w-16 h-16 rounded-full ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}>
              <Archive className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            📚 Knowledge Nest
          </h1>
          
          <p className={`text-lg sm:text-xl mb-6 max-w-2xl mx-auto leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Share and discover academic resources within your organization
          </p>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="group relative px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 group-hover:rotate-6 transition-transform" />
              <span>Upload Resource</span>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </button>
        </div>

        {/* Enhanced Organization Stats - Mobile Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-12">
          {/* Organization Card */}
          <div className={`glass-card rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
            isDark ? 'bg-gray-800/50' : 'bg-white/50'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                isDark ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}>
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-lg ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Organization</h3>
                <p className={`text-sm truncate ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`} title={userOrgDetails?.org?.org_name}>
                  {userOrgDetails?.org?.org_name || 'Loading...'}
                </p>
              </div>
            </div>
          </div>

          {/* Semester Card */}
          <div className={`glass-card rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
            isDark ? 'bg-gray-800/50' : 'bg-white/50'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                isDark ? 'bg-green-900/30' : 'bg-green-100'
              }`}>
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-lg ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Semester</h3>
                <p className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {userOrgDetails?.org?.semester ? `Semester ${userOrgDetails.org.semester}` : 'Loading...'}
                </p>
              </div>
            </div>
          </div>

          {/* Branch Card */}
          <div className={`glass-card rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 sm:col-span-2 lg:col-span-1 ${
            isDark ? 'bg-gray-800/50' : 'bg-white/50'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                isDark ? 'bg-purple-900/30' : 'bg-purple-100'
              }`}>
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-lg ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Branch</h3>
                <p className={`text-sm truncate ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`} title={userOrgDetails?.org?.branch}>
                  {userOrgDetails?.org?.branch || 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Files Section */}
        <div className={`glass-card rounded-2xl shadow-xl transition-all duration-300 ${
          isDark ? 'bg-gray-800/50' : 'bg-white/50'
        }`}>
          <div className="p-6 lg:p-8">
            <div className="mb-6 lg:mb-8">
              <div className="flex items-center gap-3 mb-3">
                <Share2 className="w-6 h-6 text-indigo-500" />
                <h2 className={`text-2xl lg:text-3xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Shared Resources</h2>
              </div>
              <p className={`text-base lg:text-lg ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
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
      </div>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        userOrgDetails={userOrgDetails?.org ? {...userOrgDetails.org, org_user: user.username} : null}
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const particlesContainer = useRef(null);

  // Get current user data from register table
  const userQuery = useQuery(api.auth.getCurrentUser);
  const orgQuery = useQuery(
    api.org.getOrgByUser, 
    user ? { org_user: user.username } : "skip"
  );

  useEffect(() => {
    // Initialize user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
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

    // Handle mouse movement for dynamic background
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    // Create floating particles animation
    const createParticles = () => {
      let cleanup = () => {};

      if (particlesContainer.current) {
        const particles = [];
        const particleCount = 40;
        
        for (let i = 0; i < particleCount; i++) {
          const particle = document.createElement('div');
          particle.className = 'floating-particle';
          const colors = isDark 
            ? ['59, 130, 246', '168, 85, 247', '236, 72, 153']
            : ['37, 99, 235', '147, 51, 234', '219, 39, 119'];
          
          const size = Math.random() * 6 + 2;
          particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(${colors[Math.floor(Math.random() * colors.length)]}, ${Math.random() * 0.5 + 0.3});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            filter: blur(1px);
            animation: floatParticle ${Math.random() * 25 + 15}s linear infinite;
            animation-delay: -${Math.random() * 20}s;
          `;
          particlesContainer.current.appendChild(particle);
          particles.push(particle);
        }
        
        cleanup = () => {
          particles.forEach(particle => {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          });
        };
      }

      return cleanup;
    };

    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener("mousemove", handleMouseMove);

    const cleanupParticles = createParticles();

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener("mousemove", handleMouseMove);
      cleanupParticles();
    };
  }, [isDark]);

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
    document.documentElement.classList.toggle('dark', newTheme);
    
    // Dispatch custom event for theme change
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark: newTheme } }));
  };

  

  if (!user) {
    return (
      <div className={`min-h-screen transition-colors duration-500 ${
        isDark 
          ? 'bg-black' 
          : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
      }`}>
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div ref={particlesContainer} className="absolute inset-0"></div>
          <div 
            className="absolute inset-0 opacity-30 transition-all duration-1000"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
            }}
          />
          {/* Geometric Background Elements */}
          <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse ${
            isDark 
              ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10' 
              : 'bg-gradient-to-br from-blue-300/20 to-purple-300/20'
          }`}></div>
          <div className={`absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse animation-delay-2000 ${
            isDark 
              ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10' 
              : 'bg-gradient-to-br from-purple-300/20 to-pink-300/20'
          }`}></div>
          <div className={`absolute bottom-20 left-20 w-80 h-80 rounded-full blur-3xl animate-pulse animation-delay-4000 ${
            isDark 
              ? 'bg-gradient-to-br from-pink-500/10 to-blue-500/10' 
              : 'bg-gradient-to-br from-pink-300/20 to-blue-300/20'
          }`}></div>
          
          {/* Grid pattern overlay */}
          <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`}>
            <div className="grid-pattern"></div>
          </div>
        </div>


        <div className="min-h-screen flex items-center justify-center relative z-10 pt-24">
          <div className="text-center glass-card p-8 rounded-3xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Please log in to access Knowledge Nest
            </h2>
          </div>
        </div>
      </div>
    );
  }

  // Show verification form if not verified
  if (isOrgVerified === false) {
    return (
      <ProtectedRoute>
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div ref={particlesContainer} className="absolute inset-0"></div>
          <div 
            className="absolute inset-0 opacity-30 transition-all duration-1000"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
            }}
          />
        </div>
        

        <OrgVerification user={user} onVerificationSuccess={handleVerificationSuccess} isDark={isDark} />
      </ProtectedRoute>
    );
  }

  // Show loading while checking verification status
  if (isOrgVerified === undefined) {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen transition-colors duration-500 ${
          isDark 
            ? 'bg-black' 
            : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
        }`}>
          {/* Background Elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div ref={particlesContainer} className="absolute inset-0"></div>
            <div 
              className="absolute inset-0 opacity-30 transition-all duration-1000"
              style={{
                background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
              }}
            />
            {/* Geometric Background Elements */}
            <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse ${
              isDark 
                ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10' 
                : 'bg-gradient-to-br from-blue-300/20 to-purple-300/20'
            }`}></div>
            <div className={`absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse animation-delay-2000 ${
              isDark 
                ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10' 
                : 'bg-gradient-to-br from-purple-300/20 to-pink-300/20'
            }`}></div>
            <div className={`absolute bottom-20 left-20 w-80 h-80 rounded-full blur-3xl animate-pulse animation-delay-4000 ${
              isDark 
                ? 'bg-gradient-to-br from-pink-500/10 to-blue-500/10' 
                : 'bg-gradient-to-br from-pink-300/20 to-blue-300/20'
            }`}></div>
            
            {/* Grid pattern overlay */}
            <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`}>
              <div className="grid-pattern"></div>
            </div>
          </div>


          <div className="min-h-screen flex items-center justify-center relative z-10 pt-24">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Main Knowledge Nest Interface - Show Dashboard
  return (
    <ProtectedRoute>
      <div className={`min-h-screen transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950' 
          : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
      }`}>
        {/* Enhanced Dynamic Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Animated particles */}
          <div ref={particlesContainer} className="absolute inset-0"></div>
          
          {/* Dynamic gradient following mouse */}
          <div 
            className="absolute inset-0 opacity-20 transition-all duration-1000"
            style={{
              background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, ${
                isDark 
                  ? 'rgba(59, 130, 246, 0.2)' 
                  : 'rgba(59, 130, 246, 0.1)'
              }, transparent 50%)`
            }}
          />
          
          {/* Geometric Background Elements */}
          <div className={`absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl animate-pulse opacity-60 ${
            isDark 
              ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' 
              : 'bg-gradient-to-br from-blue-300/30 to-purple-300/30'
          }`}></div>
          <div className={`absolute top-40 right-20 w-80 h-80 rounded-full blur-3xl animate-pulse animation-delay-2000 opacity-50 ${
            isDark 
              ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' 
              : 'bg-gradient-to-br from-purple-300/30 to-pink-300/30'
          }`}></div>
          <div className={`absolute bottom-20 left-32 w-72 h-72 rounded-full blur-3xl animate-pulse animation-delay-4000 opacity-40 ${
            isDark 
              ? 'bg-gradient-to-br from-pink-500/20 to-indigo-500/20' 
              : 'bg-gradient-to-br from-pink-300/30 to-indigo-300/30'
          }`}></div>
          
          {/* Grid pattern overlay */}
          <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`}>
            <div className="grid-pattern"></div>
          </div>
          
          {/* Gradient overlays for depth */}
          <div className={`absolute inset-0 ${
            isDark 
              ? 'bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-indigo-900/10' 
              : 'bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-indigo-100/20'
          }`}></div>
        </div>

        <KnowledgeNestDashboard user={user} isDark={isDark} />

        {/* Enhanced Custom Styles */}
        <style jsx>{`
          @keyframes floatParticle {
            0% {
              transform: translateY(100vh) translateX(-10px);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(-10vh) translateX(10px);
              opacity: 0;
            }
          }

          @keyframes pulseGlow {
            0%, 100% {
              opacity: 0.4;
              transform: scale(1);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.05);
            }
          }

          .animation-delay-2000 {
            animation-delay: 2s;
          }

          .animation-delay-4000 {
            animation-delay: 4s;
          }

          .grid-pattern {
            width: 100%;
            height: 100%;
            background-image: 
              linear-gradient(${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px),
              linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px);
            background-size: 40px 40px;
          }

          .glass-card {
            background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)'};
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.4)'};
            box-shadow: 
              0 8px 32px ${isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(31, 38, 135, 0.2)'},
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.05);
          }

          @media (max-width: 768px) {
            .glass-card {
              backdrop-filter: blur(15px) saturate(150%);
              -webkit-backdrop-filter: blur(15px) saturate(150%);
            }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}

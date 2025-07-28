"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import FileUploadModal from "@/components/FileUploadModal";
import FileDisplayComponent from "@/components/FileDisplayComponent";
import { useState, useEffect, useRef } from "react";
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
    semester: '', // Add semester field
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
    if (!formData.org_name || !formData.class_sec || !formData.semester || !formData.branch) {
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
        semester: formData.semester, // Include semester
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
    <div className={`min-h-screen flex items-center justify-center px-4 pt-24 transition-colors duration-500 ${
      isDark 
        ? 'bg-black' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Dynamic background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
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
        
        {/* Grid pattern */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`}>
          <div className="grid-pattern"></div>
        </div>
      </div>

      <div className="max-w-md w-full relative z-10">
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
        <div className="glass-card p-8 rounded-3xl">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-700 dark:text-gray-300">Loading organization details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 pt-24 relative z-10`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            📚 Knowledge Nest
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Share and discover academic resources within your organization
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-medium py-3 px-8 rounded-2xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Upload className="w-5 h-5 inline-block mr-2" />
            Upload Resource
          </button>
        </div>

        {/* Organization Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Organization</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {userOrgDetails?.org?.org_name || 'Loading...'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Class</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {userOrgDetails?.org?.class_sec || 'Loading...'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Branch</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {userOrgDetails?.org?.branch || 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Files Section */}
        <div className="glass-card rounded-2xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Shared Resources</h2>
            <p className="text-gray-600 dark:text-gray-400">
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
        userOrgDetails={userOrgDetails?.org}
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
      <div className={`min-h-screen transition-colors duration-500 ${
        isDark 
          ? 'bg-black' 
          : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
      }`}>
        {/* Dynamic Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Animated particles */}
          <div ref={particlesContainer} className="absolute inset-0"></div>
          
          {/* Dynamic gradient following mouse */}
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
          
          {/* Gradient overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-indigo-600/10 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-indigo-900/20"></div>
        </div>

    
        <KnowledgeNestDashboard user={user} isDark={isDark} />

        {/* Custom Styles */}
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
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
            background-size: 40px 40px;
          }

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
    </ProtectedRoute>
  );
}

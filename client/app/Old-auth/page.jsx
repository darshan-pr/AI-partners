"use client";
import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import { motion } from "framer-motion";

// Loading spinner component with theme support
const LoadingSpinner = ({ size = "h-4 w-4", className = "" }) => (
  <svg className={`animate-spin ${size} ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Icon components with theme support
const icons = {
  Email: ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  User: ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Phone: ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  OTP: ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  ArrowRight: ({ className = "w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7" />
    </svg>
  )
};

// Input field component
const InputField = ({ 
  id, 
  label, 
  type, 
  value, 
  onChange, 
  placeholder, 
  icon: Icon, 
  disabled = false,
  maxLength = undefined,
  className = "",
  required = true,
  onlyNumbers = false
}) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="relative rounded-lg shadow-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
        <Icon className="h-5 w-5" />
      </div>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => {
          if (onlyNumbers) {
            onChange(e.target.value.replace(/\D/g, ''));
          } else {
            onChange(e.target.value);
          }
        }}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`${className} block w-full pl-10 pr-3 py-2.5 border-0 rounded-lg 
                   bg-white/10 dark:bg-white/5 text-gray-900 dark:text-gray-100
                   backdrop-blur-md border border-white/20 dark:border-white/10
                   focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-600/50 focus:border-blue-500/50 dark:focus:border-blue-600/50
                   disabled:bg-gray-100/50 dark:disabled:bg-gray-800/30 disabled:cursor-not-allowed
                   transition duration-200 placeholder-gray-400 dark:placeholder-gray-500
                   ${disabled ? 'opacity-70' : ''}`}
      />
    </div>
  </div>
);

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [userExists, setUserExists] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const riveContainer = useRef(null);
  const particlesContainer = useRef(null);

  const register = useMutation(api.auth.register);
  const router = useRouter();

  useEffect(() => {
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

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    // Initialize Rive animation
    const initRiveAnimation = async () => {
      try {
        const rive = await import('@rive-app/canvas');
        
        if (riveContainer.current) {
          const riveInstance = new rive.Rive({
            src: 'https://public.rive.app/community/runtime-files/2063-4080-peaceful-rhythms.riv',
            canvas: riveContainer.current,
            autoplay: true,
            stateMachines: 'State Machine 1',
            onLoad: () => {
              riveInstance.resizeDrawingSurfaceToCanvas();
            },
          });
        }
      } catch (error) {
        console.log('Rive animation not available, using fallback');
      }
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

    initRiveAnimation();
    const cleanupParticles = createParticles();

    return () => {
      if (riveContainer.current) {
        riveContainer.current.innerHTML = '';
      }
      cleanupParticles();
    };
  }, [isDark]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phone);
  };

  const validateUsername = (username) => {
    // Username should be 3-20 characters, alphanumeric with underscores
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    // Input validation
    if (!email || email.trim() === "") {
      toast.error("Email address is required");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setLoadingStatus("Checking your account...");
    
    try {
      // Check if user exists
      const response = await fetch('/api/auth/get-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!response.ok) {
        if (response.status === 500) {
          toast.error("Server is temporarily unavailable. Please try again later.");
        } else if (response.status === 400) {
          toast.error("Invalid request. Please check your email format.");
        } else {
          toast.error("Network error. Please check your connection.");
        }
        return;
      }

      const result = await response.json();
      
      if (result.exists) {
        setUserExists(true);
        if (result.isVerified) {
          // User exists and is verified, send OTP for login
          toast.info("Account found! Sending OTP for login...");
          setLoadingStatus("Sending OTP to your email...");
          await sendOTP();
          setShowOtpField(true);
        } else {
          toast.warning("Account exists but email not verified. Please complete registration.");
          setIsLogin(false);
        }
      } else {
        // User doesn't exist, go to registration
        setUserExists(false);
        setIsLogin(false);
        toast.info("New email! Please fill in your details to register.");
      }
    } catch (error) {
      console.error("Email check error:", error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error("Unable to connect to server. Please check your internet connection.");
      } else {
        toast.error("Failed to verify email. Please try again.");
      }
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Input validation
    if (!email || email.trim() === "") {
      toast.error("Email address is required");
      return;
    }

    if (!username || username.trim() === "") {
      toast.error("Username is required");
      return;
    }

    if (!phoneNumber || phoneNumber.trim() === "") {
      toast.error("Phone number is required");
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate username
    if (!validateUsername(username.trim())) {
      toast.error("Username must be 3-20 characters long and contain only letters, numbers, and underscores");
      return;
    }

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber.trim())) {
      toast.error("Please enter a valid phone number (10-15 digits)");
      return;
    }

    setLoading(true);
    setLoadingStatus("Creating your account...");
    
    try {
      await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
      });
      
      toast.success("Registration successful! Check your email for OTP verification.");
      setLoadingStatus("Sending verification OTP...");
      await sendOTP();
      setShowOtpField(true);
    } catch (error) {
      console.error("Registration error:", error);
      
      // Handle specific Convex errors
      if (error.message === "DUPLICATE_EMAIL") {
        toast.error("This email is already registered. Please use a different email or try logging in.");
        setIsLogin(true);
      } else if (error.message === "DUPLICATE_USERNAME") {
        toast.error("This username is already taken. Please choose a different username.");
      } else if (error.message === "DUPLICATE_PHONE") {
        toast.error("This phone number is already registered. Please use a different phone number.");
      } else if (error.message.includes("ConvexError")) {
        toast.error("Database connection error. Please try again in a moment.");
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        toast.error("Network error. Please check your internet connection and try again.");
      } else if (error.message.includes("timeout")) {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error(error.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const sendOTP = async (isResend = false) => {
    if (!email || !validateEmail(email)) {
      toast.error("Valid email address is required to send OTP");
      return;
    }

    // Check cooldown for resend attempts
    if (isResend && resendCooldown > 0) {
      toast.warning(`Please wait ${resendCooldown} seconds before requesting another OTP`);
      return;
    }

    // Limit OTP attempts
    if (otpAttempts >= 5) {
      toast.error("Too many OTP requests. Please try again after 30 minutes.");
      return;
    }

    setLoading(true);
    setLoadingStatus(isResend ? "Sending new OTP..." : "Sending OTP to your email...");
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          toast.error("Invalid email format. Please check your email address.");
        } else if (response.status === 429) {
          toast.error("Too many OTP requests. Please wait before requesting another OTP.");
          setResendCooldown(60); // Set 60 second cooldown
        } else if (response.status === 500) {
          toast.error("Email service is temporarily unavailable. Please try again later.");
        } else {
          toast.error("Failed to send OTP. Please try again.");
        }
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        if (isResend) {
          toast.success("New OTP sent to your email! Check your inbox and spam folder.");
          setResendCooldown(60); // Set 60 second cooldown for resend
        } else {
          toast.success("OTP sent to your email! Check your inbox and spam folder.");
        }
        setOtpAttempts(prev => prev + 1);
        setOtp(""); // Clear previous OTP
      } else {
        if (result.message.includes("rate limit")) {
          toast.error("Too many OTP requests. Please wait 1 minute before requesting another.");
          setResendCooldown(60);
        } else if (result.message.includes("invalid email")) {
          toast.error("Invalid email address. Please check and try again.");
        } else if (result.message.includes("email service")) {
          toast.error("Email service is temporarily down. Please try again later.");
        } else {
          toast.error(result.message || "Failed to send OTP. Please try again.");
        }
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error("Unable to connect to email service. Please check your internet connection.");
      } else if (error.message.includes("timeout")) {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    
    // Input validation
    if (!otp || otp.trim() === "") {
      toast.error("OTP is required");
      return;
    }

    if (otp.length !== 6) {
      toast.error("OTP must be exactly 6 digits");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      toast.error("OTP must contain only numbers");
      return;
    }

    if (!email || !validateEmail(email)) {
      toast.error("Valid email is required for verification");
      return;
    }

    setLoading(true);
    setLoadingStatus("Verifying your OTP...");
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          otp: otp.trim() 
        }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          toast.error("Invalid OTP format. Please check and try again.");
        } else if (response.status === 500) {
          toast.error("Verification service is temporarily unavailable. Please try again later.");
        } else {
          toast.error("Verification failed. Please try again.");
        }
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        setLoadingStatus("Authentication successful! Redirecting...");
        toast.success("Authentication successful! Welcome back!");
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Small delay for toast to show before redirect
        setTimeout(() => {
          router.push('/home');
        }, 1000);
      } else {
        // Handle specific OTP errors
        if (result.message === "Invalid OTP") {
          toast.error("Incorrect OTP. Please check the 6-digit code in your email.");
        } else if (result.message === "OTP has expired") {
          toast.error("OTP has expired. Please request a new one.");
          setOtp("");
        } else if (result.message === "User not found") {
          toast.error("Account not found. Please register first.");
          setIsLogin(false);
          setShowOtpField(false);
        } else if (result.message.includes("already used")) {
          toast.error("This OTP has already been used. Please request a new one.");
          setOtp("");
        } else {
          toast.error(result.message || "Invalid OTP. Please try again.");
        }
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error("Unable to connect to verification service. Please check your internet connection.");
      } else if (error.message.includes("timeout")) {
        toast.error("Verification request timed out. Please try again.");
      } else if (error.message.includes("ConvexError")) {
        toast.error("Database connection error. Please try again in a moment.");
      } else {
        toast.error("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const resetForm = () => {
    setEmail("");
    setUsername("");
    setPhoneNumber("");
    setOtp("");
    setIsLogin(true);
    setUserExists(false);
    setShowOtpField(false);
    setLoading(false);
    setLoadingStatus("");
    setResendCooldown(0);
    setOtpAttempts(0);
    // Clear any existing toasts
    toast.dismiss();
  };

  const toggleMode = () => {
    resetForm();
    setIsLogin(!isLogin);
    if (isLogin) {
      toast.info("Switched to registration mode");
    } else {
      toast.info("Switched to login mode");
    }
  };

  // Add network status checking
  const checkNetworkStatus = () => {
    if (!navigator.onLine) {
      toast.error("No internet connection. Please check your network and try again.");
      return false;
    }
    return true;
  };

  // Enhanced form submission wrapper
  const handleFormSubmission = async (formHandler) => {
    if (!checkNetworkStatus()) return;
    
    try {
      await formHandler();
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className={`min-h-screen w-full relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-black' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    } ${isDark ? 'dark' : ''}`}>
      
      {/* Rive Animation Background */}
      <div className="absolute inset-0 opacity-30">
        <canvas 
          ref={riveContainer}
          className="w-full h-full"
          style={{ filter: 'blur(1px)' }}
        />
      </div>

      {/* Floating Particles */}
      <div 
        ref={particlesContainer}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Geometric Background Elements */}
      <div className="absolute inset-0">
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
        <div className={`absolute bottom-20 left-10 w-64 h-64 rounded-full blur-3xl animate-pulse animation-delay-4000 ${
          isDark 
            ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10' 
            : 'bg-gradient-to-br from-green-300/20 to-emerald-300/20'
        }`}></div>
        
        {/* Grid Pattern */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`}>
          <div className="grid-pattern"></div>
        </div>
      </div>

      {/* Dynamic Background with Mouse Interaction */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
          }}
        />
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8 relative z-10">
        <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="mt-2 text-center text-sm text-gray-400">
              {isLogin 
                ? "Sign in to continue your learning journey" 
                : "Join us to start your personalized learning experience"}
            </p>
          </motion.div>
        </div>

        <motion.div 
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="glass-card relative p-8 rounded-2xl shadow-xl backdrop-blur-xl transform transition-all duration-300"
          style={{ borderRadius: '26px' }}>
            {/* ...existing form content... */}
          {/* Login Form */}
          {isLogin && (
            <form onSubmit={(e) => handleFormSubmission(() => showOtpField ? handleOTPVerification(e) : handleEmailSubmit(e))} className="space-y-6">
              <InputField
                id="email"
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter your email"
                icon={icons.Email}
                disabled={showOtpField}
              />
              
              {showOtpField && (
                <div className="space-y-6 animate-fade-in">
                  <InputField
                    id="otp"
                    label="One-Time Password"
                    type="text"
                    value={otp}
                    onChange={setOtp}
                    placeholder="Enter Your OTP"
                    icon={icons.OTP}
                    maxLength={6}
                    className="text-center tracking-widest text-lg"
                    onlyNumbers={true}
                  />
                  <div className="space-y-2">
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                      Enter OTP sent to {email}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-4 py-3 flex justify-center items-center 
                            rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 
                            hover:from-blue-700 hover:to-indigo-700
                            text-white font-medium transition-all duration-300
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                            disabled:opacity-60 disabled:cursor-not-allowed
                            transform hover:scale-[1.02] active:scale-[0.98]
                            group`}
                >
                  {loading 
                    ? <span className="flex items-center">
                        <LoadingSpinner className="text-white -ml-1 mr-2" />
                        <span className="text-sm">{loadingStatus || (showOtpField ? "Verifying OTP..." : "Checking account...")}</span>
                      </span>
                    : <span className="flex items-center">
                        {showOtpField ? (
                          <>
                            <svg className="w-4 h-4 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Verify OTP
                          </>
                        ) : (
                          <>
                          
                            Continue  
                          </>
                        )}
                         <svg className="w-4 h-4 ml-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                      </span>
                  }
                </button>
              </div>

              {showOtpField && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => sendOTP(true)}
                    disabled={loading || resendCooldown > 0}
                    className={`text-sm font-medium focus:outline-none transition-colors duration-200 ${
                      resendCooldown > 0 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline'
                    }`}
                  >
                    {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Register Form */}
          {!isLogin && (
            <form onSubmit={(e) => handleFormSubmission(() => showOtpField ? handleOTPVerification(e) : handleRegister(e))} className="space-y-6">
              <InputField
                id="email"
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter your email"
                icon={icons.Email}
                disabled={true}
              />
              
              {!showOtpField ? (
                <>
                  <InputField
                    id="username"
                    label="Username"
                    type="text"
                    value={username}
                    onChange={setUsername}
                    placeholder="Choose a username"
                    icon={icons.User}
                  />
                  
                  <InputField
                    id="phoneNumber"
                    label="Phone Number"
                    type="tel"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    placeholder="Enter your phone number"
                    icon={icons.Phone}
                  />
                </>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <InputField
                    id="otp"
                    label="One-Time Password"
                    type="text"
                    value={otp}
                    onChange={setOtp}
                    placeholder="Enter Your OTP"
                    icon={icons.OTP}
                    maxLength={6}
                    className="text-center tracking-widest text-lg"
                    onlyNumbers={true}
                  />
                  <div className="space-y-2">
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                      Enter OTP sent to {email}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-4 py-3 flex justify-center items-center 
                            rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 
                            hover:from-purple-700 hover:to-pink-700
                            text-white font-medium transition-all duration-300
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                            disabled:opacity-60 disabled:cursor-not-allowed
                            transform hover:scale-[1.02] active:scale-[0.98]
                            group`}
                >
                  {loading 
                    ? <span className="flex items-center">
                        <LoadingSpinner className="text-white -ml-1 mr-2" />
                        <span className="text-sm">{loadingStatus || (showOtpField ? "Verifying OTP..." : "Creating account...")}</span>
                      </span> 
                    : <span className="flex items-center">
                        {showOtpField ? (
                          <>
                            <svg className="w-4 h-4 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Verify OTP
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Register
                          </>
                        )}
                        <icons.ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform text-white" />
                      </span>
                  }
                </button>
              </div>

              {showOtpField && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => sendOTP(true)}
                    disabled={loading || resendCooldown > 0}
                    className={`text-sm font-medium focus:outline-none transition-colors duration-200 ${
                      resendCooldown > 0 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline'
                    }`}
                  >
                    {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                  </button>
                </div>
              )}
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${isDark ? 'bg-gray-800/40' : 'bg-white/80'}`}>
                  Or
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={toggleMode}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus:outline-none focus:underline transition-colors duration-200"
              >
                {isLogin ? "Create a new account" : "Sign in to existing account"}
              </button>
            </div>

            {(isLogin && showOtpField) || (!isLogin && showOtpField) ? (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:underline transition-colors duration-200"
                >
                  Use a different email
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
      </div>

      <style jsx>{`
        @keyframes floatParticle {
          0% {
            transform: translateY(110vh) translateX(-10px);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-10vh) translateX(10px);
            opacity: 0;
          }
        }

        .grid-pattern {
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
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

        .floating-particle {
          position: absolute;
          pointer-events: none;
        }

        /* For OTP Input */
        input[type="text"].tracking-widest {
          letter-spacing: 0.5em;
        }

        /* Ensure smooth transitions */
        * {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
      `}</style>
    </div>
  );
}

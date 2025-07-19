"use client";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from 'sonner';
import { motion } from "framer-motion";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState('password'); // 'password' or 'otp'
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [isAutoSwitching, setIsAutoSwitching] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
    otp: ""
  });
  
  // Form errors
  const [errors, setErrors] = useState({});
  
  const riveContainer = useRef(null);
  const particlesContainer = useRef(null);

  // Validation helper functions (moved before mutations to avoid hoisting issues)
  const isValidEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone) => {
    if (!phone) return false;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, '')) && phone.replace(/[\s\-\(\)]/g, '').length >= 10;
  };

  const isValidPassword = (password) => {
    if (!password) return false;
    return password.length >= 8;
  };

  // Mutations
  const register = useMutation(api.auth.register);
  const login = useMutation(api.auth.login);
  const verifyOTP = useMutation(api.auth.verifyOTP);
  const storeOTP = useMutation(api.auth.storeOTP);
  const verifyEmail = useMutation(api.auth.verifyEmail);
  
  // Real-time validation queries for registration
  const checkUserExists = useQuery(api.auth.checkUserExists, 
    (authMethod === 'otp' && formData.email) || (authMethod === 'password' && formData.email && formData.email.includes('@')) 
      ? { email: formData.email } 
      : "skip"
  );
  
  const checkUsernameExists = useQuery(api.auth.checkUsernameExists,
    (!isLogin && formData.username && formData.username.length >= 3)
      ? { username: formData.username }
      : "skip"
  );
  
  const checkEmailExists = useQuery(api.auth.checkEmailExists,
    (!isLogin && formData.email && isValidEmail(formData.email))
      ? { email: formData.email }
      : "skip"
  );
  
  const checkPhoneExists = useQuery(api.auth.checkPhoneExists,
    (!isLogin && formData.phoneNumber && isValidPhone(formData.phoneNumber))
      ? { phoneNumber: formData.phoneNumber }
      : "skip"
  );
  
  const router = useRouter();

  const isRegistrationFormValid = () => {
    return (
      formData.username &&
      formData.username.length >= 3 &&
      !checkUsernameExists?.exists &&
      formData.email &&
      isValidEmail(formData.email) &&
      !checkEmailExists?.exists &&
      formData.phoneNumber &&
      isValidPhone(formData.phoneNumber) &&
      !checkPhoneExists?.exists &&
      formData.password &&
      isValidPassword(formData.password)
    );
  };

  const isLoginFormValid = () => {
    if (authMethod === 'password') {
      // For password login, check if user exists and has basic fields filled
      const identifier = formData.email || formData.username;
      if (!identifier || !formData.password) return false;
      
      // If email is provided and we've checked, user must exist
      if (formData.email && checkUserExists !== undefined) {
        return checkUserExists.exists;
      }
      
      // For username login that looks like email, check if exists
      if (formData.username && formData.username.includes('@') && checkUserExists !== undefined) {
        return checkUserExists.exists;
      }
      
      // For regular username login, allow if basic validation passes
      return true;
    } else {
      // For OTP login
      if (!otpSent) {
        return formData.email && checkUserExists?.exists;
      } else {
        return formData.email && formData.otp && checkUserExists?.exists;
      }
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme ? savedTheme === "dark" : systemDarkMode;
    setIsDark(initialDarkMode);
    document.documentElement.classList.toggle('dark', initialDarkMode);

    const handleThemeChange = (event) => {
      const newDarkMode = event.detail.isDark;
      setIsDark(newDarkMode);
      document.documentElement.classList.toggle('dark', newDarkMode);
    };

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("themeChanged", handleThemeChange);
    window.addEventListener("mousemove", handleMouseMove);

    // Initialize Rive animation with better error handling
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
              try {
                riveInstance.resizeDrawingSurfaceToCanvas();
              } catch (error) {
                console.log('Rive resize failed, continuing without animation');
              }
            },
            onLoadError: () => {
              console.log('Rive animation failed to load, using fallback');
              // Hide the canvas if animation fails
              if (riveContainer.current) {
                riveContainer.current.style.display = 'none';
              }
            }
          });
        }
      } catch (error) {
        console.log('Rive animation not available, using fallback');
        // Hide the canvas if Rive is not available
        if (riveContainer.current) {
          riveContainer.current.style.display = 'none';
        }
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
      window.removeEventListener("themeChanged", handleThemeChange);
      window.removeEventListener("mousemove", handleMouseMove);
      if (riveContainer.current) {
        riveContainer.current.innerHTML = '';
      }
      cleanupParticles();
    };
  }, [isDark]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // For password login, if user is typing in the username field but it looks like an email,
    // also update the email field for validation
    if (field === 'username' && authMethod === 'password' && value.includes('@')) {
      setFormData(prev => ({ ...prev, email: value }));
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (isLogin) {
      if (!formData.email && !formData.username) {
        newErrors.identifier = "Please enter your email or username";
      }
      
      if (authMethod === 'password' && !formData.password) {
        newErrors.password = "Please enter your password";
      }
      
      if (authMethod === 'otp' && otpSent && !formData.otp) {
        newErrors.otp = "Please enter the OTP";
      }
    } else {
      // Registration validation with enhanced checks
      if (!formData.username) {
        newErrors.username = "Username is required";
      } else if (formData.username.length < 3) {
        newErrors.username = "Username must be at least 3 characters";
      } else if (checkUsernameExists?.exists) {
        newErrors.username = "Username already taken";
      }
      
      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!isValidEmail(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      } else if (checkEmailExists?.exists) {
        newErrors.email = "Email already registered";
      }
      
      if (!formData.phoneNumber) {
        newErrors.phoneNumber = "Phone number is required";
      } else if (!isValidPhone(formData.phoneNumber)) {
        newErrors.phoneNumber = "Please enter a valid phone number";
      } else if (checkPhoneExists?.exists) {
        newErrors.phoneNumber = "Phone number already registered";
      }
      
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (!isValidPassword(formData.password)) {
        newErrors.password = "Password must be at least 8 characters";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendOTP = async () => {
    if (!formData.email) {
      setErrors({ email: "Please enter your email" });
      toast.error("Please enter your email");
      return;
    }

    // Check if email is registered before sending OTP
    if (!checkUserExists?.exists) {
      setErrors({ email: "Email not registered. Please register first." });
      toast.error("Email not registered. Please register first.");
      return;
    }
    
    setLoading(true);
    try {
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in database
      await storeOTP({ email: formData.email, otp });
      
      // Send OTP via email
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      });
      
      if (response.ok) {
        setOtpSent(true);
        toast.success('OTP sent to your email');
      } else {
        throw new Error('Failed to send OTP');
      }
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };
  

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (authMethod === 'password') {
        const identifier = formData.email || formData.username;
        const response = await login({ identifier, password: formData.password });
        
        if (response.success) {
          localStorage.setItem("user", JSON.stringify(response.user));
          toast.success('Login successful!');
          router.push("/home");
        }
      } else {
        // OTP login
        const response = await verifyOTP({ email: formData.email, otp: formData.otp });
        
        if (response.success) {
          localStorage.setItem("user", JSON.stringify(response.user));
          toast.success('Login successful!');
          router.push("/home");
        }
      }
    } catch (error) {
      // Handle specific error messages with proper toast notifications
      const errorMessage = error.message || 'Login failed';
      
      if (errorMessage === 'USER_NOT_FOUND') {
        toast.error('Account not found. Switching to registration form...');
        setErrors({ identifier: 'Account not found' });
        setIsAutoSwitching(true);
        
        // Auto-switch to register form after a short delay
        setTimeout(() => {
          setIsLogin(false);
          setErrors({});
          setIsAutoSwitching(false);
          // If the identifier was an email, pre-fill it in the registration form
          if (formData.email || (formData.username && formData.username.includes('@'))) {
            const emailValue = formData.email || formData.username;
            setFormData(prev => ({ 
              ...prev, 
              email: emailValue,
              username: '',
              password: '',
              phoneNumber: '',
              otp: ''
            }));
          } else {
            // If it was a username, pre-fill that instead
            setFormData(prev => ({ 
              ...prev, 
              username: formData.username || '',
              email: '',
              password: '',
              phoneNumber: '',
              otp: ''
            }));
          }
          toast.success('Please complete your registration below');
        }, 1500);
      } else if (errorMessage === 'INVALID_PASSWORD') {
        toast.error('Incorrect password. Please try again.');
        setErrors({ password: 'Incorrect password' });
      } else if (errorMessage === 'PASSWORD_NOT_SET') {
        toast.error('No password set for this account. Please use OTP login.');
        setErrors({ password: 'Use OTP login instead' });
      } else if (errorMessage === 'USER_NOT_FOUND_FOR_OTP') {
        toast.error('Email not registered. Switching to registration form...');
        setErrors({ email: 'Email not registered' });
        setIsAutoSwitching(true);
        
        // Auto-switch to register form after a short delay
        setTimeout(() => {
          setIsLogin(false);
          setErrors({});
          setOtpSent(false);
          setIsAutoSwitching(false);
          // Pre-fill the email in the registration form
          setFormData(prev => ({ 
            ...prev, 
            email: formData.email,
            username: '',
            password: '',
            phoneNumber: '',
            otp: ''
          }));
          toast.success('Please complete your registration below');
        }, 1500);
      } else if (errorMessage === 'INVALID_OTP') {
        toast.error('Invalid OTP. Please check and try again.');
        setErrors({ otp: 'Invalid OTP' });
      } else if (errorMessage === 'OTP_EXPIRED') {
        toast.error('OTP has expired. Please request a new one.');
        setErrors({ otp: 'OTP expired' });
        setOtpSent(false);
      } else {
        // Fallback for any other errors
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await register({
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password
      });
      
      if (response.success) {
        toast.success('Account created successfully!');
        setShowEmailVerification(true);
      }
    } catch (error) {
      // Handle specific registration errors with proper toast notifications
      const errorMessage = error.message || 'Registration failed';
      
      if (errorMessage === 'EMAIL_ALREADY_EXISTS') {
        toast.error('Email already registered. Please use a different email or try logging in.');
        setErrors({ email: 'Email already registered' });
      } else if (errorMessage === 'USERNAME_ALREADY_EXISTS') {
        toast.error('Username already taken. Please choose a different username.');
        setErrors({ username: 'Username already taken' });
      } else if (errorMessage === 'PHONE_ALREADY_EXISTS') {
        toast.error('Phone number already registered. Please use a different phone number.');
        setErrors({ phoneNumber: 'Phone number already registered' });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    try {
      const response = await verifyEmail({ email: formData.email });
      if (response.success) {
        toast.success('Email verified successfully!');
        setShowEmailVerification(false);
        setIsLogin(true);
      }
    } catch (error) {
      toast.error('Email verification failed');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden ${
      isDark 
        ? 'bg-black' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      
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

      {/* Background Elements */}
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

      <motion.div 
        className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8 mt-10">
          <p className={`text-lg font-light ${
            isDark ? 'text-white/60' : 'text-black/60'
          }`}>
            {isLogin ? 'Sign in to continue' : 'Join us today'}
          </p>
        </div>

        <motion.div 
          className="glass-card backdrop-blur-xl rounded-3xl p-8 shadow-2xl border relative z-10"
          style={{borderRadius: '25px'}}
          animate={{ 
            scale: isAutoSwitching ? 0.95 : 1,
            opacity: isAutoSwitching ? 0.7 : 1
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Auto-switching indicator */}
          {isAutoSwitching && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-3xl z-50">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Switching to registration...
                </p>
              </div>
            </div>
          )}
          {/* Tab Selection */}
          <div className="flex mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrors({});
                setOtpSent(false);
                setAuthMethod('password');
              }}
              className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300 ${
                isLogin
                  ? isDark 
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                    : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                  : isDark
                    ? 'text-white/60 hover:text-white/80'
                    : 'text-black/60 hover:text-black/80'
              } border`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setErrors({});
                setOtpSent(false);
                setAuthMethod('password');
              }}
              className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300 ml-2 ${
                !isLogin
                  ? isDark 
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                    : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                  : isDark
                    ? 'text-white/60 hover:text-white/80'
                    : 'text-black/60 hover:text-black/80'
              } border`}
            >
              Register
            </button>
          </div>

          {showEmailVerification ? (
            <div className="text-center">
              <div className="mb-6">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  isDark ? 'bg-green-500/20' : 'bg-green-500/10'
                }`}>
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className={`text-xl font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                  Account Created!
                </h3>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  Would you like to verify your email address?
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleEmailVerification}
                  className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300 ${
                    isDark 
                      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                      : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                  }`}
                >
                  ✓ Verify Email
                </button>
                <button
                  onClick={() => {
                    setShowEmailVerification(false);
                    setIsLogin(true);
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30' 
                      : 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20'
                  }`}
                >
                  Skip for now
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-6">
              {/* Login Form */}
              {isLogin && (
                <>
                  {/* Authentication Method Selection */}
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('password');
                        setOtpSent(false);
                        setErrors({});
                        setFormData(prev => ({ ...prev, otp: '' }));
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all duration-300 ${
                        authMethod === 'password'
                          ? isDark 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-blue-500/10 text-blue-600'
                          : isDark
                            ? 'text-white/60 hover:text-white/80'
                            : 'text-black/60 hover:text-black/80'
                      }`}
                    >
                      Login with Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('otp');
                        setErrors({});
                        setFormData(prev => ({ ...prev, password: '' }));
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all duration-300 ${
                        authMethod === 'otp'
                          ? isDark 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-blue-500/10 text-blue-600'
                          : isDark
                            ? 'text-white/60 hover:text-white/80'
                            : 'text-black/60 hover:text-black/80'
                      }`}
                    >
                      Get OTP
                    </button>
                  </div>

                  {/* Email/Username Input */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-white/80' : 'text-black/70'
                    }`}>
                      {authMethod === 'otp' ? 'Email' : 'Email or Username'}
                    </label>
                    <div className="relative">
                      <input
                        type={authMethod === 'otp' ? 'email' : 'text'}
                        value={authMethod === 'otp' ? formData.email : (formData.email || formData.username)}
                        onChange={(e) => handleInputChange(authMethod === 'otp' ? 'email' : 'username', e.target.value)}
                        className={`w-full px-4 py-3 ${authMethod === 'password' && formData.email && checkUserExists !== undefined ? 'pr-12' : ''} rounded-xl transition-all duration-300 ${
                          isDark 
                            ? 'bg-white/5 border-white/10 text-white placeholder-white/40' 
                            : 'bg-white/50 border-gray-200 text-black placeholder-black/40'
                        } border focus:ring-2 focus:ring-blue-500/50 focus:border-transparent ${
                          errors.identifier || errors.email ? 'border-red-500' : ''
                        }`}
                        placeholder={authMethod === 'otp' ? 'Enter your email' : 'Enter email or username'}
                      />
                      
                      {/* Email validation icon for password login */}
                      {authMethod === 'password' && formData.email && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {checkUserExists === undefined ? (
                            <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : checkUserExists.exists ? (
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg 
                              className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-400" 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                              onClick={() => toast.error('Email not found in our records. Please register first or check your email.')}
                              title="Click to see why this is invalid"
                            >
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Show email validation message for password login */}
                    {authMethod === 'password' && formData.email && (
                      <div className={`mt-2 p-2 rounded-lg text-xs ${
                        checkUserExists === undefined
                          ? isDark 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                          : checkUserExists.exists 
                            ? isDark 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-green-50 text-green-700 border border-green-200'
                            : isDark 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span>
                            {checkUserExists === undefined
                              ? '🔍 Checking email...'
                              : checkUserExists.exists 
                                ? '✓ Email found in our records' 
                                : '✗ Email not registered'}
                          </span>
                          {checkUserExists !== undefined && !checkUserExists.exists && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsLogin(false);
                                setErrors({});
                                setFormData(prev => ({ 
                                  ...prev, 
                                  email: formData.email,
                                  username: '',
                                  password: '',
                                  phoneNumber: '',
                                  otp: ''
                                }));
                                toast.success('Switched to registration. Please complete your details.');
                              }}
                              className={`ml-2 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                isDark 
                                  ? 'bg-blue-500/30 text-blue-300 hover:bg-blue-500/40' 
                                  : 'bg-blue-500/20 text-blue-700 hover:bg-blue-500/30'
                              }`}
                            >
                              Register
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {(errors.identifier || errors.email) && (
                      <p className="text-red-500 text-sm mt-1">{errors.identifier || errors.email}</p>
                    )}
                  </div>

                  {/* Password Input (for password method) */}
                  {authMethod === 'password' && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-white/80' : 'text-black/70'
                      }`}>
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className={`w-full px-4 py-3 pr-12 rounded-xl transition-all duration-300 ${
                            isDark 
                              ? 'bg-white/5 border-white/10 text-white placeholder-white/40' 
                              : 'bg-white/50 border-gray-200 text-black placeholder-black/40'
                          } border focus:ring-2 focus:ring-blue-500/50 focus:border-transparent ${
                            errors.password ? 'border-red-500' : ''
                          }`}
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPassword ? '👁️' : '🙈'}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                      )}
                    </div>
                  )}

                  {/* OTP Section */}
                  {authMethod === 'otp' && (
                    <>
                      {!otpSent ? (
                        <div>
                          {formData.email && checkUserExists !== undefined && (
                            <div className={`mb-3 p-3 rounded-lg text-sm ${
                              checkUserExists.exists 
                                ? isDark 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-green-50 text-green-700 border border-green-200'
                                : isDark 
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                  : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span>
                                  {checkUserExists.exists 
                                    ? '✓ Email is registered. You can request OTP.' 
                                    : '✗ Email not found'}
                                </span>
                                {!checkUserExists.exists && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsLogin(false);
                                      setErrors({});
                                      setOtpSent(false);
                                      setFormData(prev => ({ 
                                        ...prev, 
                                        email: formData.email,
                                        username: '',
                                        password: '',
                                        phoneNumber: '',
                                        otp: ''
                                      }));
                                      toast.success('Switched to registration. Please complete your details.');
                                    }}
                                    className={`ml-2 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                      isDark 
                                        ? 'bg-blue-500/30 text-blue-300 hover:bg-blue-500/40' 
                                        : 'bg-blue-500/20 text-blue-700 hover:bg-blue-500/30'
                                    }`}
                                  >
                                    Register
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={sendOTP}
                            disabled={loading || !formData.email || !checkUserExists?.exists}
                            className={`w-full py-3 px-4 rounded-xl transition-all duration-300 ${
                              isDark 
                                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:bg-gray-500/10 disabled:text-gray-600' 
                                : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 disabled:bg-gray-100 disabled:text-gray-400'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {loading ? 'Checking & Sending...' : 'Verify OTP'}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDark ? 'text-white/80' : 'text-black/70'
                          }`}>
                            Enter OTP
                          </label>
                          <input
                            type="text"
                            value={formData.otp}
                            onChange={(e) => handleInputChange('otp', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl transition-all duration-300 ${
                              isDark 
                                ? 'bg-white/5 border-white/10 text-white placeholder-white/40' 
                                : 'bg-white/50 border-gray-200 text-black placeholder-black/40'
                            } border focus:ring-2 focus:ring-blue-500/50 focus:border-transparent ${
                              errors.otp ? 'border-red-500' : ''
                            }`}
                            placeholder="Enter 6-digit OTP"
                            maxLength="6"
                          />
                          {errors.otp && (
                            <p className="text-red-500 text-sm mt-1">{errors.otp}</p>
                          )}
                          
                          <div className="flex justify-between items-center mt-3">
                            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                              OTP sent to {formData.email}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setOtpSent(false);
                                setFormData(prev => ({ ...prev, otp: '' }));
                              }}
                              className={`text-sm font-medium ${
                                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                              } transition-colors`}
                            >
                              Resend OTP
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Register Form */}
              {!isLogin && (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-white/80' : 'text-black/70'
                    }`}>
                      Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className={`w-full px-4 py-3 ${formData.username ? 'pr-12' : ''} rounded-xl transition-all duration-300 ${
                          isDark 
                            ? 'bg-white/5 border-white/10 text-white placeholder-white/40' 
                            : 'bg-white/50 border-gray-200 text-black placeholder-black/40'
                        } border focus:ring-2 focus:ring-blue-500/50 focus:border-transparent ${
                          errors.username ? 'border-red-500' : ''
                        }`}
                        placeholder="Choose a username (min 3 characters)"
                      />
                      
                      {/* Username validation icon */}
                      {formData.username && formData.username.length >= 3 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {checkUsernameExists === undefined ? (
                            <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : !checkUsernameExists.exists ? (
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg 
                              className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-400" 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                              onClick={() => toast.error('Username already taken. Please choose a different username.')}
                              title="Click to see why this is invalid"
                            >
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {errors.username && (
                      <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-white/80' : 'text-black/70'
                      }`}>
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`w-full px-4 py-3 ${formData.email ? 'pr-12' : ''} rounded-xl transition-all duration-300 ${
                            isDark 
                              ? 'bg-white/5 border-white/10 text-white placeholder-white/40' 
                              : 'bg-white/50 border-gray-200 text-black placeholder-black/40'
                          } border focus:ring-2 focus:ring-blue-500/50 focus:border-transparent ${
                            errors.email ? 'border-red-500' : ''
                          }`}
                          placeholder="Enter your email"
                        />
                        
                        {/* Email validation icon */}
                        {formData.email && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {!isValidEmail(formData.email) ? (
                              <svg 
                                className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-400" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                                onClick={() => toast.error('Please enter a valid email address with @ and domain (e.g., user@example.com)')}
                                title="Click to see why this is invalid"
                              >
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            ) : checkEmailExists === undefined ? (
                              <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : !checkEmailExists.exists ? (
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg 
                                className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-400" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                                onClick={() => toast.error('Email already registered. Please use a different email or try logging in.')}
                                title="Click to see why this is invalid"
                              >
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-white/80' : 'text-black/70'
                    }`}>
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className={`w-full px-4 py-3 ${formData.phoneNumber ? 'pr-12' : ''} rounded-xl transition-all duration-300 ${
                          isDark 
                            ? 'bg-white/5 border-white/10 text-white placeholder-white/40' 
                            : 'bg-white/50 border-gray-200 text-black placeholder-black/40'
                        } border focus:ring-2 focus:ring-blue-500/50 focus:border-transparent ${
                          errors.phoneNumber ? 'border-red-500' : ''
                        }`}
                        placeholder="Enter your phone number (min 10 digits)"
                      />
                      
                      {/* Phone validation icon */}
                      {formData.phoneNumber && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {!isValidPhone(formData.phoneNumber) ? (
                            <svg 
                              className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-400" 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                              onClick={() => toast.error('Please enter a valid phone number with at least 10 digits (e.g., +1234567890)')}
                              title="Click to see why this is invalid"
                            >
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          ) : checkPhoneExists === undefined ? (
                            <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : !checkPhoneExists.exists ? (
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg 
                              className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-400" 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                              onClick={() => toast.error('Phone number already registered. Please use a different phone number.')}
                              title="Click to see why this is invalid"
                            >
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {errors.phoneNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-white/80' : 'text-black/70'
                    }`}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full px-4 py-3 pr-20 rounded-xl transition-all duration-300 ${
                          isDark 
                            ? 'bg-white/5 border-white/10 text-white placeholder-white/40' 
                            : 'bg-white/50 border-gray-200 text-black placeholder-black/40'
                        } border focus:ring-2 focus:ring-blue-500/50 focus:border-transparent ${
                          errors.password ? 'border-red-500' : ''
                        }`}
                        placeholder="Create a password (min 8 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-13 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? '👁️' : '🙈'}
                      </button>
                      
                      {/* Password validation icon */}
                      {formData.password && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {isValidPassword(formData.password) ? (
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg 
                              className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-400" 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                              onClick={() => toast.error('Password must be at least 8 characters long')}
                              title="Click to see why this is invalid"
                            >
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                      
                      
                    </div>
                    
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                  </div>
                </>
              )}

              {/* Submit Button */}
              {(authMethod === 'password' || (authMethod === 'otp' && otpSent)) && (
                <button
                  type="submit"
                  disabled={loading || isAutoSwitching || (isLogin ? !isLoginFormValid() : !isRegistrationFormValid())}
                  className={`w-full py-3 px-4 rounded-xl transition-all duration-300 ${
                    isDark 
                      ? 'bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-500 hover:to-purple-500 text-white' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed ${
                    (isLogin ? !isLoginFormValid() : !isRegistrationFormValid()) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading 
                    ? 'Processing...' 
                    : isAutoSwitching
                      ? 'Switching forms...'
                      : isLogin 
                        ? 'Sign In' 
                        : 'Create Account'
                  }
                </button>
              )}
            </form>
          )}
        </motion.div>
      </motion.div>

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
      `}</style>
    </div>
  );
}

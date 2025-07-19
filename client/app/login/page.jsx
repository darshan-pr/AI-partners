"use client";
import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from 'sonner';
import { motion } from "framer-motion";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [authMethod, setAuthMethod] = useState('password'); // 'password' or 'otp'
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [otpError, setOtpError] = useState("");
  const riveContainer = useRef(null);
  const particlesContainer = useRef(null);

  const login = useMutation(api.auth.login);
  const verifyOTP = useMutation(api.auth.verifyOTP);
  const storeOTP = useMutation(api.auth.storeOTP);
  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    }

    const handleThemeChange = (event) => {
      setIsDark(event.detail.isDark);
    };

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("themeChanged", handleThemeChange);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("themeChanged", handleThemeChange);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

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
      if (!particlesContainer.current) return;
      
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
      
      return () => {
        particles.forEach(particle => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        });
      };
    };

    initRiveAnimation();
    const cleanup = createParticles();
    
    return cleanup;
  }, [isDark]);

  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setIdentifierError("");
    setPasswordError("");
    setOtpError("");
    
    // Validate identifier (email, username, or phone)
    if (!identifier) {
      if (authMethod === 'otp') {
        setIdentifierError("Please enter your email");
      } else {
        setIdentifierError("Please enter your username, email, or phone");
      }
      isValid = false;
    }
    
    // Validate based on auth method
    if (authMethod === 'password') {
      if (!password) {
        setPasswordError("Please enter your password");
        isValid = false;
      } else if (password.length < 6) {
        setPasswordError("Password must be at least 6 characters");
        isValid = false;
      }
    } else if (authMethod === 'otp' && otpSent) {
      if (!otp) {
        setOtpError("Please enter the OTP");
        isValid = false;
      } else if (otp.length !== 6) {
        setOtpError("OTP must be 6 digits");
        isValid = false;
      }
    }
    
    return isValid;
  };

  const sendOTP = async () => {
    if (!identifier) {
      setIdentifierError("Please enter your email");
      return;
    }
    
    setLoading(true);
    try {
      // Generate OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in database
      await storeOTP({ email: identifier, otp: otpCode });
      
      // Send OTP via email
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, otp: otpCode })
      });
      
      if (response.ok) {
        setOtpSent(true);
        toast.success('OTP sent to your email');
      } else {
        throw new Error('Failed to send OTP');
      }
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.');
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      if (authMethod === 'password') {
        const response = await login({
          identifier: identifier,
          password: password,
        });

        if (response.success) {
          localStorage.setItem("user", JSON.stringify(response.user));
          
          const event = new CustomEvent("userLoggedIn", {
            detail: response.user
          });
          window.dispatchEvent(event);
          
          toast.success('Successfully logged in!');
          router.push("/home");
        }
      } else {
        // OTP login
        const response = await verifyOTP({
          email: identifier,
          otp: otp,
        });

        if (response.success) {
          localStorage.setItem("user", JSON.stringify(response.user));
          
          const event = new CustomEvent("userLoggedIn", {
            detail: response.user
          });
          window.dispatchEvent(event);
          
          toast.success('Successfully logged in!');
          router.push("/home");
        }
      }
    } catch (error) {
      const errorMessage = error.message || "Login failed. Please check your credentials and try again.";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
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
        <div className={`absolute bottom-20 left-20 w-80 h-80 rounded-full blur-3xl animate-pulse animation-delay-4000 ${
          isDark 
            ? 'bg-gradient-to-br from-pink-500/10 to-blue-500/10' 
            : 'bg-gradient-to-br from-pink-300/20 to-blue-300/20'
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

      {/* Form Section */}
      <motion.div 
        className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-extralight mb-3 ${
            isDark ? 'text-white/95' : 'text-black/90'
          }`}>
            Welcome back
          </h2>
          <p className={`text-lg font-light ${
            isDark ? 'text-white/60' : 'text-black/60'
          }`}>
            Sign in to continue
          </p>
        </div>

        <motion.div 
          className="ios-glass-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Authentication Method Selection */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('password');
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                  authMethod === 'password'
                    ? isDark 
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                      : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                    : isDark
                      ? 'text-white/60 hover:text-white/80 border-white/10'
                      : 'text-black/60 hover:text-black/80 border-gray-200'
                } border`}
              >
                Login with Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('otp');
                  setPassword("");
                  setError("");
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                  authMethod === 'otp'
                    ? isDark 
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                      : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                    : isDark
                      ? 'text-white/60 hover:text-white/80 border-white/10'
                      : 'text-black/60 hover:text-black/80 border-gray-200'
                } border`}
              >
                Get OTP
              </button>
            </div>

            {/* Username/Email Input */}
            <div className="input-group">
              <label className={`input-label ${
                isDark ? 'text-white/80' : 'text-black/70'
              }`}>
                {authMethod === 'otp' ? 'Email' : 'Username, Email, or Phone'}
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  name="identifier"
                  type={authMethod === 'otp' ? 'email' : 'text'}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (identifierError) setIdentifierError("");
                  }}
                  className={`ios-input ${identifierError ? 'border-red-500' : ''}`}
                  placeholder={authMethod === 'otp' ? 'Enter your email' : 'Enter your credentials'}
                />
                <div className="input-glow" />
                {identifierError && (
                  <p className="text-sm text-red-500 mt-1">{identifierError}</p>
                )}
              </div>
            </div>

            {/* Password Input (for password method) */}
            {authMethod === 'password' && (
              <div className="input-group">
                <label className={`input-label ${
                  isDark ? 'text-white/80' : 'text-black/70'
                }`}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    className={`ios-input pr-14 ${passwordError ? 'border-red-500' : ''}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-300 ${
                      isDark ? 'text-white/50 hover:text-white/80 hover:bg-white/10' : 'text-black/50 hover:text-black/80 hover:bg-black/5'
                    }`}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656l1.414 1.414m-1.414-1.414l1.414 1.414M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                  <div className="input-glow" />
                  {passwordError && (
                    <p className="text-sm text-red-500 mt-1">{passwordError}</p>
                  )}
                </div>
              </div>
            )}

            {/* OTP Section */}
            {authMethod === 'otp' && (
              <>
                {!otpSent ? (
                  <motion.button
                    type="button"
                    onClick={sendOTP}
                    disabled={loading}
                    className="ios-button"
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="button-content">
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="loading-spinner" />
                          <span className="ml-2">Sending OTP...</span>
                        </div>
                      ) : (
                        "Send OTP"
                      )}
                    </div>
                    <div className="button-glow" />
                  </motion.button>
                ) : (
                  <div className="input-group">
                    <label className={`input-label ${
                      isDark ? 'text-white/80' : 'text-black/70'
                    }`}>
                      Enter OTP
                    </label>
                    <div className="relative">
                      <input
                        id="otp"
                        name="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value);
                          if (otpError) setOtpError("");
                        }}
                        className={`ios-input ${otpError ? 'border-red-500' : ''}`}
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                      />
                      <div className="input-glow" />
                      {otpError && (
                        <p className="text-sm text-red-500 mt-1">{otpError}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={sendOTP}
                      disabled={loading}
                      className={`mt-2 text-sm ${
                        isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                      } transition-colors`}
                    >
                      Resend OTP
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Error Message */}
            {error && (
              <motion.div 
                className="error-card"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center">
                  <div className="error-icon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="ml-3 text-sm font-medium">{error}</span>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            {(authMethod === 'password' || (authMethod === 'otp' && otpSent)) && (
              <motion.button
                type="submit"
                disabled={loading}
                className="ios-button"
                whileTap={{ scale: 0.97 }}
              >
                <div className="button-content">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner" />
                      <span className="ml-2">Signing in...</span>
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </div>
                <div className="button-glow" />
              </motion.button>
            )}
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <span className={`text-base font-light ${
              isDark ? 'text-white/60' : 'text-black/60'
            }`}>
              Don't have an account?{" "}
              <Link 
                href="/register" 
                className={`font-medium transition-all duration-300 ${
                  isDark 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-500'
                }`}
              >
                Sign up
              </Link>
            </span>
          </div>
        </motion.div>
      </motion.div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap');

        * {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
        }

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

        .ios-glass-card {
          background: ${isDark 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(255, 255, 255, 0.5)'
          };
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
          border: 1px solid ${isDark 
            ? 'rgba(255, 255, 255, 0.18)' 
            : 'rgba(255, 255, 255, 0.3)'
          };
          border-radius: 24px;
          padding: 32px;
          box-shadow: 
            0 8px 32px ${isDark ? 'rgba(0, 0, 0, 0.37)' : 'rgba(31, 38, 135, 0.37)'},
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);
          max-width: 480px;
          margin: 0 auto;
          transition: all 0.3s ease;
        }

        .ios-glass-card:hover {
          box-shadow: 
            0 12px 40px ${isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(31, 38, 135, 0.47)'};
        }

        .input-group {
          position: relative;
        }

        .input-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          letter-spacing: 0.025em;
        }

        .ios-input {
          width: 100%;
          padding: 16px 20px;
          background: ${isDark 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'rgba(255, 255, 255, 0.4)'
          };
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid ${isDark 
            ? 'rgba(255, 255, 255, 0.2)' 
            : 'rgba(255, 255, 255, 0.4)'
          };
          border-radius: 16px;
          font-size: 16px;
          font-weight: 400;
          letter-spacing: 0.025em;
          color: ${isDark ? '#ffffff' : '#000000'};
          position: relative;
          z-index: 2;
          transition: all 0.3s ease;
        }

        .ios-input::placeholder {
          color: ${isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};
          font-weight: 300;
        }

        .ios-input:focus {
          outline: none;
          background: ${isDark 
            ? 'rgba(255, 255, 255, 0.12)' 
            : 'rgba(255, 255, 255, 0.6)'
          };
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 
            0 8px 32px rgba(59, 130, 246, 0.15),
            0 0 0 1px rgba(59, 130, 246, 0.3);
          transform: translateY(-2px);
        }

        .input-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
          border-radius: 16px;
          opacity: 0;
          z-index: 1;
          transition: opacity 0.3s ease;
        }

        .ios-input:focus + .input-glow {
          opacity: 1;
        }

        .ios-button {
          width: 100%;
          position: relative;
          overflow: hidden;
          border: none;
          border-radius: 16px;
          padding: 0;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .ios-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-content {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: 0.025em;
          padding: 18px 24px;
          border-radius: 16px;
          position: relative;
          z-index: 2;
          transition: background 0.3s ease;
        }

        .ios-button:hover:not(:disabled) .button-content {
          background: linear-gradient(135deg, #2563eb, #1e40af);
        }

        .button-glow {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6, #3b82f6);
          border-radius: 18px;
          opacity: 0;
          z-index: 1;
          transition: opacity 0.3s ease;
        }

        .ios-button:hover:not(:disabled) .button-glow {
          opacity: 0.7;
          animation: glow-rotate 2s linear infinite;
        }

        @keyframes glow-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #ffffff;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-card {
          background: ${isDark 
            ? 'rgba(239, 68, 68, 0.1)' 
            : 'rgba(239, 68, 68, 0.05)'
          };
          backdrop-filter: blur(20px);
          border: 1px solid ${isDark 
            ? 'rgba(239, 68, 68, 0.3)' 
            : 'rgba(239, 68, 68, 0.2)'
          };
          border-radius: 12px;
          padding: 16px;
          color: ${isDark ? '#fca5a5' : '#dc2626'};
          animation: error-slide-in 0.3s ease-out;
        }

        .error-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
        }

        @keyframes error-slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .ios-glass-card {
            padding: 24px;
            max-width: 100%;
          }

          .ios-input {
            padding: 14px 16px;
            font-size: 14px;
          }

          .button-content {
            padding: 16px 20px;
            font-size: 14px;
          }

          h2 {
            font-size: 2rem;
          }

          p {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
}
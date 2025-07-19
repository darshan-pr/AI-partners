"use client";
import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from 'sonner';
import { motion } from "framer-motion"; // Add this import

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    address: "",
    region: "",
    age: "",
    phoneNumber: "",
  });
  const [formErrors, setFormErrors] = useState({
    username: "",
    email: "",
    password: "",
    address: "",
    region: "",
    age: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const riveContainer = useRef(null);
  const particlesContainer = useRef(null);

  const register = useMutation(api.auth.register);
  const verifyEmail = useMutation(api.auth.verifyEmail);
  const router = useRouter();

  const handleEmailVerification = async () => {
    try {
      const response = await verifyEmail({ email: formData.email });
      if (response.success) {
        toast.success('Email verified successfully!');
        setShowEmailVerification(false);
        router.push("/login");
      }
    } catch (error) {
      toast.error('Email verification failed');
    }
  };

  const skipVerification = () => {
    setShowEmailVerification(false);
    router.push("/login");
  };

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
    const errors = {};
    let isValid = true;
    
    // Username validation
    if (!formData.username) {
      errors.username = "Username is required";
      isValid = false;
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
      isValid = false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }
    
    // Age validation
    if (!formData.age) {
      errors.age = "Age is required";
      isValid = false;
    } else {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        errors.age = "Please enter a valid age (13-120)";
        isValid = false;
      }
    }
    
    // Address validation
    if (!formData.address) {
      errors.address = "Address is required";
      isValid = false;
    } else if (formData.address.length < 5) {
      errors.address = "Please enter a valid address";
      isValid = false;
    }
    
    // Region validation
    if (!formData.region) {
      errors.region = "Region is required";
      isValid = false;
    }
    
    // Phone validation (optional)
    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid 10-digit phone number";
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear the error for this field when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ""
      });
    }

    // Special handling for age (only allow numbers)
    if (name === "age") {
      const onlyNumbers = value.replace(/\D/g, '');
      setFormData({
        ...formData,
        [name]: onlyNumbers
      });
      return;
    }

    // Special handling for phone number (only allow 10 digits)
    if (name === "phoneNumber") {
      const onlyNumbers = value.replace(/\D/g, '').slice(0, 10);
      setFormData({
        ...formData,
        [name]: onlyNumbers
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstError = Object.keys(formErrors).find(key => formErrors[key]);
      if (firstError) {
        const errorElement = document.getElementById(firstError);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        }
      }
      return;
    }
    
    setLoading(true);

    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber || "",
        password: formData.password,
      });
      
      if (result && result.success) {
        toast.success('Account created successfully!');
        setShowEmailVerification(true);
      }
    } catch (err) {
      console.log("Error caught:", err);
      
      const errorMessage = err.message || err.toString();
      
      switch (errorMessage) {
        case "DUPLICATE_EMAIL":
          setFormErrors(prev => ({
            ...prev,
            email: "This email is already registered"
          }));
          toast.error("This email is already registered. Please use a different email.");
          break;
        case "DUPLICATE_USERNAME":
          setFormErrors(prev => ({
            ...prev,
            username: "This username is already taken"
          }));
          toast.error("This username is already taken. Please choose a different username.");
          break;
        default:
          if (errorMessage.includes("DUPLICATE_EMAIL")) {
            setFormErrors(prev => ({
              ...prev,
              email: "This email is already registered"
            }));
            toast.error("This email is already registered. Please use a different email.");
          } else if (errorMessage.includes("DUPLICATE_USERNAME")) {
            setFormErrors(prev => ({
              ...prev,
              username: "This username is already taken"
            }));
            toast.error("This username is already taken. Please choose a different username.");
          } else {
            toast.error("Registration failed. Please check your information and try again.");
            console.error("Registration error:", err);
          }
      }
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
        <div className="text-center mb-4">
          <h2 className={`text-2xl font-bold font-light mb-3 mt-12 ${
            isDark ? 'text-white/95' : 'text-black/90'
          }`}>
            Create your account
          </h2>
          <p className={`text-base font-light ${
            isDark ? 'text-white/70' : 'text-black/70'
          }`}>
            Join us and start your journey with AI Partner
          </p>
        </div>

        <motion.div 
          className="ios-glass-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {showEmailVerification ? (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  isDark ? 'bg-green-500/20' : 'bg-green-500/10'
                }`}>
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className={`text-xl font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                  Account Created Successfully!
                </h3>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  Would you like to verify your email address now?
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleEmailVerification}
                  className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
                    isDark 
                      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30' 
                      : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20'
                  }`}
                >
                  ✓ Verify Email
                </button>
                <button
                  onClick={skipVerification}
                  className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
                    isDark 
                      ? 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border border-gray-500/30' 
                      : 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border border-gray-500/20'
                  }`}
                >
                  Skip for now
                </button>
              </div>
            </div>
          ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/70'}`}>
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className={`ios-input ${formErrors.username ? 'border-red-500 animate-shake' : ''}`}
                  placeholder="Choose a username"
                />
                <div className="input-glow" />
                {formErrors.username && (
                  <p className={`mt-1 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.username}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/70'}`}>
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`ios-input ${formErrors.email ? 'border-red-500 animate-shake' : ''}`}
                  placeholder="Enter your email"
                />
                <div className="input-glow" />
                {formErrors.email && (
                  <p className={`mt-1 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/70'}`}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`ios-input pr-12 ${formErrors.password ? 'border-red-500 animate-shake' : ''}`}
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
                {formErrors.password && (
                  <p className={`mt-1 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.password}</p>
                )}
                
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center">
                      <div className="h-1 flex-1 bg-gray-300 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            formData.password.length < 6 ? 'bg-red-500 w-1/4' : 
                            formData.password.length < 8 ? 'bg-yellow-500 w-2/4' : 
                            formData.password.length < 10 ? 'bg-blue-500 w-3/4' : 
                            'bg-green-500 w-full'
                          }`} 
                        />
                      </div>
                      <span className={`ml-2 text-xs ${
                        formData.password.length < 6 ? 'text-red-500' : 
                        formData.password.length < 8 ? 'text-yellow-500' : 
                        formData.password.length < 10 ? 'text-blue-500' : 
                        'text-green-500'
                      }`}>
                        {
                          formData.password.length < 6 ? 'Weak' : 
                          formData.password.length < 8 ? 'Fair' : 
                          formData.password.length < 10 ? 'Good' : 
                          'Strong'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="age" className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/70'}`}>
                Age
              </label>
              <div className="relative">
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="13"
                  max="120"
                  value={formData.age}
                  onChange={handleChange}
                  className={`ios-input ${formErrors.age ? 'border-red-500 animate-shake' : ''}`}
                  placeholder="Enter your age"
                />
                <div className="input-glow" />
                {formErrors.age && (
                  <p className={`mt-1 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.age}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="address" className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/70'}`}>
                Address
              </label>
              <div className="relative">
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className={`ios-input ${formErrors.address ? 'border-red-500 animate-shake' : ''}`}
                  placeholder="Enter your address"
                />
                <div className="input-glow" />
                {formErrors.address && (
                  <p className={`mt-1 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.address}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="region" className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/70'}`}>
                Region
              </label>
              <div className="relative">
                <select
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className={`ios-input ${formErrors.region ? 'border-red-500 animate-shake' : ''}`}
                >
                  <option value="" disabled>Select your region</option>
                  <option value="North America">North America</option>
                  <option value="South America">South America</option>
                  <option value="Europe">Europe</option>
                  <option value="Asia">Asia</option>
                  <option value="Africa">Africa</option>
                  <option value="Oceania">Oceania</option>
                  <option value="Antarctica">Antarctica</option>
                </select>
                <div className="input-glow" />
                {formErrors.region && (
                  <p className={`mt-1 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.region}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/70'}`}>
                Phone Number (Optional)
              </label>
              <div className="relative">
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`ios-input ${formErrors.phoneNumber ? 'border-red-500 animate-shake' : ''}`}
                  placeholder="Enter 10-digit phone number"
                />
                <div className="input-glow" />
                {formErrors.phoneNumber && (
                  <p className={`mt-1 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.phoneNumber}</p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <motion.button
                type="submit"
                disabled={loading}
                className="ios-button w-full"
                whileTap={{ scale: 0.97 }}
              >
                <div className="button-content">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner" />
                      <span className="ml-2">Creating account...</span>
                    </div>
                  ) : (
                    "Create account"
                  )}
                </div>
                <div className="button-glow" />
              </motion.button>
            </div>
          </form>
          )}

          <div className="mt-6 text-center">
            <span className={`text-base font-light ${
              isDark ? 'text-white/60' : 'text-black/60'
            }`}>
              Already have an account?{" "}
              <Link 
                href="/login" 
                className={`font-medium transition-all duration-300 ${
                  isDark 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-500'
                }`}
              >
                Sign in
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

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
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
            : 'rgba(255, 255, 255, 0.7)'
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
          max-height: 70vh;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
          transition: all 0.3s ease;
        }
        
        .ios-glass-card:hover {
          box-shadow: 
            0 12px 40px ${isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(31, 38, 135, 0.47)'};
        }

        .ios-glass-card::-webkit-scrollbar {
          width: 6px;
        }

        .ios-glass-card::-webkit-scrollbar-track {
          background: transparent;
        }

        .ios-glass-card::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }

        .ios-glass-card::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }

        .ios-input {
          width: 100%;
          padding: 16px 20px;
          background: ${isDark 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'rgba(255, 255, 255, 0.6)'
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
            : 'rgba(255, 255, 255, 0.8)'
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
            font-size: 1.75rem;
          }

          p {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
}
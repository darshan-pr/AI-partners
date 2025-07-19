"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from 'sonner';
import OrgVerifyModal from './OrgVerifyModal';

// SVG Icon Components
const HomeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7m-9 5v6h4v-6m-4-2h4" />
  </svg>
);

const PhoneIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const CakeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
  </svg>
);

const GlobeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s1.343-9 3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const UserIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EmailIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const OrgIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ClassIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const BranchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2M7 7h10" />
  </svg>
);

// Validation Icon Components
const ValidationIcon = ({ state, onClick, field }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(field, state);
    }
  };

  if (state === 'loading') {
    return (
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" onClick={handleClick}>
        <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
        </svg>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" onClick={handleClick}>
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" onClick={handleClick}>
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  return null;
};

// ProfileDetail Component
const ProfileDetail = ({ icon: Icon, label, value, isDark, textStyle, onEditClick, editState }) => (
  <div className="flex items-center space-x-2 p-2 rounded-lg">
    <Icon className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
    <div className="flex-1">
      <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
      <div className="flex items-center justify-between">
        <p className={`text-sm ${textStyle}`}>{value}</p>
        {onEditClick && (
          <div className="relative">
            <button
              onClick={onEditClick}
              className={`absolute right-0 -top-1.5 p-1 rounded-full transition-all duration-300
                ${editState === 'editing' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              aria-label={`Edit ${label}`}
            >
              {editState === 'editing' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )}
            </button>
            <ValidationIcon state={editState} onClick={onEditClick} field={label} />
          </div>
        )}
      </div>
    </div>
  </div>
);

// Validation helper functions (must be declared before component to avoid hoisting issues)
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

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    class_sec: "",
    branch: ""
  });

  // All Convex hooks must be called before any conditional returns
  const logout = useMutation(api.auth.logout);
  const userData = useQuery(api.auth.getCurrentUser, { 
    email: user?.email || undefined 
  });
  
  // Real-time validation queries for profile editing
  // Username is disabled, so we skip its validation
  const checkUsernameExists = useQuery(api.auth.checkUsernameExists, "skip");
  
  const checkEmailExists = useQuery(api.auth.checkEmailExists,
    (isEditing && formData.email && isValidEmail(formData.email) && formData.email !== user?.email)
      ? { email: formData.email }
      : "skip"
  );
  
  const checkPhoneExists = useQuery(api.auth.checkPhoneExists,
    (isEditing && formData.phoneNumber && isValidPhone(formData.phoneNumber) && formData.phoneNumber !== userData?.phoneNumber)
      ? { phoneNumber: formData.phoneNumber }
      : "skip"
  );

  // Additional hooks for profile functionality
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isOrgVerifyModalOpen, setIsOrgVerifyModalOpen] = useState(false);
  const updateProfile = useMutation(api.auth.updateProfile);
  const updateOrgDetails = useMutation(api.orgVerification.updateOrgDetails);
  
  // Query for organization details
  const orgDetails = useQuery(api.orgVerification.getUserOrgDetails, 
    user?.id ? { userId: user.id } : "skip"
  );
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // All useEffect hooks must be before conditional return
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsNavVisible(false);
        setIsProfileOpen(false);
        setIsProfileDropdownOpen(false);
        setIsMenuOpen(false);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
        setIsNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    const handleLogin = (event) => {
      const userData = event.detail || JSON.parse(localStorage.getItem("user"));
      setUser(userData);
    };

    const handleStorage = () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    };

    window.addEventListener("userLoggedIn", handleLogin);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("userLoggedIn", handleLogin);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  useEffect(() => {
    if (userData && user) {
      setFormData({
        username: userData.username || user.username || "",
        email: userData.email || user.email || "",
        phoneNumber: userData.phoneNumber || "",
        class_sec: orgDetails?.class_sec || "",
        branch: orgDetails?.branch || ""
      });
    }
  }, [userData, user, orgDetails]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle profile dropdown click outside
      if (isProfileDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      // Handle mobile menu click outside
      if (isMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen, isMenuOpen]);
  
  // Hide navbar on StudyBuddy pages - MOVED AFTER ALL HOOKS
  if (pathname && pathname.includes('/studybuddy')) {
    return null;
  }
  
  // Validation state functions
  const getUsernameValidationState = () => {
    if (!isEditing || !formData.username) return null;
    if (formData.username.length < 3) return 'error';
    if (checkUsernameExists === undefined) return 'loading';
    return checkUsernameExists?.exists ? 'error' : 'success';
  };

  const getEmailValidationState = () => {
    if (!isEditing || !formData.email) return null;
    if (!isValidEmail(formData.email)) return 'error';
    if (checkEmailExists === undefined) return 'loading';
    return checkEmailExists?.exists ? 'error' : 'success';
  };

  const getPhoneValidationState = () => {
    if (!isEditing || !formData.phoneNumber) return null;
    if (!isValidPhone(formData.phoneNumber)) return 'error';
    if (checkPhoneExists === undefined) return 'loading';
    return checkPhoneExists?.exists ? 'error' : 'success';
  };
  
  // Helper function to check if we can save changes
  const canSaveChanges = () => {
    if (loading) return false;
    
    // Check if phone number is changed and valid
    const isPhoneChanged = formData.phoneNumber !== (userData?.phoneNumber || '');
    const isPhoneValid = !isPhoneChanged || (formData.phoneNumber && isValidPhone(formData.phoneNumber) && !checkPhoneExists?.exists);
    
    // Check if organization details are changed
    const isOrgChanged = orgDetails && (
      formData.class_sec !== orgDetails.class_sec || 
      formData.branch !== orgDetails.branch
    );
    
    // Must have valid phone (if changed) and at least one change
    return isPhoneValid && (isPhoneChanged || isOrgChanged);
  };
  
  // Helper function to check if we're waiting for validation
  const isWaitingForValidation = () => {
    const phoneState = getPhoneValidationState();
    const isPhoneChanged = formData.phoneNumber !== (userData?.phoneNumber || '');
    return isPhoneChanged && phoneState === 'loading';
  };
  
  // Validation click handler to explain errors
  const handleValidationClick = (field, state) => {
    if (state === 'error') {
      switch (field) {
        case 'username':
          if (formData.username.length < 3) {
            toast.error('Username must be at least 3 characters long');
          } else if (checkUsernameExists?.exists) {
            toast.error('This username is already taken. Please choose another one.');
          }
          break;
        case 'email':
          if (!isValidEmail(formData.email)) {
            toast.error('Please enter a valid email address with @ and . symbols');
          } else if (checkEmailExists?.exists) {
            toast.error('This email is already registered. Please use another email.');
          }
          break;
        case 'phoneNumber':
          if (!isValidPhone(formData.phoneNumber)) {
            toast.error('Please enter a valid phone number (minimum 10 digits)');
          } else if (checkPhoneExists?.exists) {
            toast.error('This phone number is already registered. Please use another number.');
          }
          break;
      }
    } else if (state === 'success') {
      toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} is valid and available!`);
    } else if (state === 'loading') {
      toast.info(`Checking ${field} availability...`);
    }
  };
  
  const handleLogout = async () => {
    if (user) {
      const response = await logout({ email: user.email });
      if (response.success) {
        localStorage.removeItem("user");
        setUser(null);
        router.push("/");
      } else {
        console.error("Logout failed:", response.message);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    window.dispatchEvent(new CustomEvent("themeChanged", { 
      detail: { isDark: newTheme } 
    }));
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsProfileDropdownOpen(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    // Check if phone number is changed and valid
    const isPhoneChanged = formData.phoneNumber !== (userData?.phoneNumber || '');
    const isPhoneValid = !isPhoneChanged || (formData.phoneNumber && isValidPhone(formData.phoneNumber) && !checkPhoneExists?.exists);
    
    // Check if organization details are changed
    const isOrgChanged = orgDetails && (
      formData.class_sec !== orgDetails.class_sec || 
      formData.branch !== orgDetails.branch
    );
    
    // Validate phone number only if it's changed
    if (isPhoneChanged && !isPhoneValid) {
      toast.error('Please enter a valid and unique phone number');
      return;
    }
    
    // Check if there are any changes to save
    if (!isPhoneChanged && !isOrgChanged) {
      toast.info('No changes to save');
      return;
    }
    
    try {
      setLoading(true);
      
      // Update personal profile only if phone number changed
      if (isPhoneChanged) {
        const profileResponse = await updateProfile({
          currentEmail: user.email,
          username: formData.username,
          phoneNumber: formData.phoneNumber
          // Email is excluded since it's not editable
        });
        
        if (!profileResponse.success) {
          toast.error(profileResponse.message || 'Failed to update profile');
          return;
        }
      }

      // Update organization details if they exist and have been modified
      if (isOrgChanged) {
        const orgResponse = await updateOrgDetails({
          userId: user.email,
          classSec: formData.class_sec,
          branch: formData.branch
        });
        
        if (!orgResponse.success) {
          toast.error(orgResponse.message || 'Failed to update organization details');
          return;
        }
      }
      
      // Update local storage with new user data
      const updatedUser = {
        ...user,
        username: formData.username
        // Email remains the same since it's not editable
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
    setIsMenuOpen(false);
  };

  const getNavbarStyles = () => {
    if (isDark) {
      return isScrolled 
        ? 'bg-black/95 backdrop-blur-xl shadow-xl' 
        : 'bg-black/90 backdrop-blur-md';
    } else {
      return isScrolled 
        ? 'bg-white/95 backdrop-blur-xl shadow-xl' 
        : 'bg-white/90 backdrop-blur-md';
    }
  };

  const getLogoStyles = () => {
    const baseGradient = 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent bg-size-200 animate-gradient transition-all duration-300';
    return `${baseGradient} ${isScrolled ? 'opacity-100' : 'drop-shadow-sm'}`;
  };

  const getTextStyles = () => {
    return isDark 
      ? (isScrolled ? 'text-gray-200' : 'text-white/90')
      : (isScrolled ? 'text-gray-700' : 'text-gray-800/90');
  };

  const getLinkStyles = () => {
    return isDark 
      ? (isScrolled 
        ? 'text-gray-200 hover:text-blue-400 hover:bg-gray-800/50' 
        : 'text-white/90 hover:text-white hover:bg-white/10')
      : (isScrolled 
        ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
        : 'text-gray-800/90 hover:text-gray-900 hover:bg-black/10');
  };

  const getThemeButtonStyles = () => {
    return isDark 
      ? (isScrolled 
        ? 'text-gray-200' 
        : 'text-white')
      : (isScrolled 
        ? 'text-gray-700' 
        : 'text-gray-800');
  };

  return (
    <>
    <AnimatePresence>
      {isNavVisible && (
        <motion.nav 
          className="fixed -translate-x-1/2 left-1/2 top-4 z-50"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
          ref={mobileMenuRef}
        >
          <div 
            className={`max-w-6xl w-[90vw] sm:w-[76.5vw] mx-auto rounded-2xl duration-500 shadow-lg ${getNavbarStyles()}
              border ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} 
              before:content-[''] before:absolute before:inset-0 before:rounded-2xl 
              ${isDark 
                ? 'before:bg-gradient-to-r before:from-gray-800/20 before:via-gray-700/20 before:to-gray-800/20'
                : 'before:bg-gradient-to-r before:from-blue-500/20 before:via-purple-500/20 before:to-blue-500/20'
              }
              before:blur-md before:opacity-50 before:transition-opacity before:duration-300
              hover:before:opacity-75
              after:content-[''] after:absolute after:inset-0 after:rounded-2xl 
              ${isDark 
                ? 'after:bg-gradient-to-r after:from-gray-800/5 after:to-gray-800/5'
                : 'after:bg-gradient-to-r after:from-white/5 after:to-white/5'
              }
              after:opacity-0 after:transition-opacity after:duration-300`}
            style={{ borderRadius: '27px' }}
          >
            <div className="px-2 sm:px-6 lg:px-8 relative z-10">
              <div className="flex items-center justify-between h-16">
                <Link href="/" className="flex-shrink-0 text-2xl font-bold relative group">
                  <span className={getLogoStyles()}>
                    AI Partner
                  </span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 
                    transition-all duration-300 group-hover:w-full"></span>
                </Link>

                <div className="sm:hidden">
                  <button
                    onClick={toggleMenu}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white focus:outline-none"
                    style={{backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}}
                    aria-controls="mobile-menu"
                    aria-expanded={isMenuOpen}
                  >
                    <span className="sr-only">Open main menu</span>
                    {isMenuOpen ? (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-end sm:space-x-4">
                  {user ? (
                    <div className="relative flex items-center space-x-4">
                      <span className={`font-medium px-4 py-2 rounded-full
                        transition-all duration-300 flex items-center gap-2 ${getTextStyles()}`}>
                        Welcome, 
                        <span className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          {user.username}
                        </span>
                        {orgDetails && (
                          <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                            isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                          }`}>
                            {orgDetails.org_name}
                          </span>
                        )}
                      </span>
                      {!orgDetails && (
                        <button
                          onClick={() => setIsOrgVerifyModalOpen(true)}
                          className={`px-4 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
                            isDark 
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                          }`}
                        >
                          Verify Org
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <Link 
                        href="/auth" 
                        className={`relative overflow-hidden px-6 py-2 rounded-full transition-all duration-300
                          hover:scale-105 group font-medium ${getLinkStyles()}`}
                      >
                        <span className="relative z-10">Sign In</span>
                      </Link>
                    </>
                  )}
                </div>

                <div className="hidden sm:flex sm:items-center sm:space-x-4">
                  <button
                    onClick={toggleTheme}
                    className="group relative p-1 focus:outline-none"
                    aria-label="Toggle theme"
                  >
                    <div className={`relative w-12 h-12 rounded-xl transition-all duration-700 hover:scale-105 ${getThemeButtonStyles()}`}>
                      <div className="absolute inset-0 rounded-xl overflow-hidden">
                        <div className={`absolute top-2 right-3 w-2 h-2 rounded-full transition-all duration-1000 ${
                          isDark 
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-400 animate-pulse' 
                            : 'bg-gradient-to-r from-amber-300 to-orange-400 animate-bounce'
                        }`} style={{ animationDelay: '0.5s' }}></div>
                        <div className={`absolute bottom-3 left-2 w-1.5 h-1.5 rounded-full transition-all duration-1000 ${
                          isDark 
                            ? 'bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse' 
                            : 'bg-gradient-to-r from-blue-300 to-cyan-400 animate-bounce'
                        }`} style={{ animationDelay: '1s' }}></div>
                        <div className={`absolute top-4 left-4 w-1 h-1 rounded-full transition-all duration-1000 ${isDark ? 'bg-gradient-to-r from-emerald-400 to-teal-400 animate-pulse' : 'bg-gradient-to-r from-violet-300 to-purple-400 animate-bounce'}`} style={{ animationDelay: '1.5s' }}></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`relative w-6 h-6 transition-all duration-700 ${isDark ? 'rotate-180 scale-110' : 'rotate-0 scale-100'}`}>
                          {isDark ? (
                            <div className="relative w-full h-full">
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 opacity-90"></div>
                              <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 shadow-inner"></div>
                              <div className="absolute top-0.5 right-1 w-1 h-1 rounded-full bg-cyan-300 animate-twinkle"></div>
                              <div className="absolute bottom-1 left-2 w-0.5 h-0.5 rounded-full bg-purple-200 animate-twinkle" style={{ animationDelay: '0.7s' }}></div>
                            </div>
                          ) : (
                            <div className="relative w-full h-full">
                              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-yellow-400 animate-spin-slow"></div>
                              <div className="absolute inset-0 rounded-full border-2 border-orange-300/40"></div>
                              <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-gradient-to-t from-transparent to-orange-400 -translate-x-1/2 -translate-y-1"></div>
                              <div className="absolute bottom-0 left-1/2 w-0.5 h-2 bg-gradient-to-b from-transparent to-orange-400 -translate-x-1/2 translate-y-1"></div>
                              <div className="absolute left-0 top-1/2 w-2 h-0.5 bg-gradient-to-l from-transparent to-orange-400 -translate-y-1/2 -translate-x-1"></div>
                              <div className="absolute right-0 top-1/2 w-2 h-0.5 bg-gradient-to-r from-transparent to-orange-400 -translate-y-1/2 translate-x-1"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className={`absolute inset-0 rounded-xl ${isDark ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10' : 'bg-gradient-to-r from-blue-400/10 to-orange-400/10'} animate-pulse`}></div>
                      </div>
                    </div>
                  </button>

                  {user && (
                    <div className="relative profile-dropdown-container" ref={dropdownRef}>
                      <button
                        onClick={toggleProfileDropdown}
                        className="group relative p-1 focus:outline-none"
                        aria-label="Toggle profile"
                      >
                        <div className={`relative w-12 h-12 rounded-xl transition-all duration-700 hover:scale-105 ${getThemeButtonStyles()}`}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                              <span className="text-lg font-bold">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Profile Dropdown Extension */}
              {user && isProfileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="hidden sm:block overflow-hidden"
                  ref={dropdownRef}
                >
                  <div className={`mx-2 mb-4 rounded-xl overflow-hidden
                    ${isDark ? 'bg-black/95 backdrop-blur-xl' : 'bg-white/35 backdrop-blur-xl'}
                    border ${isDark ? 'border-gray-800' : 'border-gray-200'}
                    shadow-lg`}
                    style={{
                      borderRadius: '30px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)',
                      backdropFilter: 'blur(1px)',
                    }}
                  >
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <span className="text-xl font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h3 className={`text-lg font-semibold ${getTextStyles()}`}>
                                {user.username}
                              </h3>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {userData?.email || 'Not set'}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              
                            </div>
                          </div>
                        </div>
                      </div>

                      {!isEditing ? (
                        <>
                         
                          <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex flex-wrap gap-4 flex-grow">
                              <ProfileDetail 
                                icon={UserIcon} 
                                label="Username" 
                                value={userData?.username || user?.username || 'Not set'} 
                                isDark={isDark}
                                textStyle={getTextStyles()} 
                              />
                              <ProfileDetail 
                                icon={EmailIcon} 
                                label="Email" 
                                value={userData?.email || user?.email || 'Not set'} 
                                isDark={isDark}
                                textStyle={getTextStyles()} 
                              />
                              <ProfileDetail 
                                icon={PhoneIcon} 
                                label="Phone" 
                                value={userData?.phoneNumber || 'Not set'} 
                                isDark={isDark}
                                textStyle={getTextStyles()} 
                              />
                              
                              {/* Organization Details */}
                              {orgDetails && (
                                <>
                                  <ProfileDetail 
                                    icon={OrgIcon} 
                                    label="Organization" 
                                    value={orgDetails.org_name || 'Not verified'} 
                                    isDark={isDark}
                                    textStyle={getTextStyles()} 
                                  />
                                  <ProfileDetail 
                                    icon={EmailIcon} 
                                    label="Org Email" 
                                    value={orgDetails.user_org_mailid || 'Not set'} 
                                    isDark={isDark}
                                    textStyle={getTextStyles()} 
                                  />
                                  <ProfileDetail 
                                    icon={ClassIcon} 
                                    label="Class/Section" 
                                    value={orgDetails.class_sec || 'Not set'} 
                                    isDark={isDark}
                                    textStyle={getTextStyles()} 
                                  />
                                  <ProfileDetail 
                                    icon={BranchIcon} 
                                    label="Branch" 
                                    value={orgDetails.branch || 'Not set'} 
                                    isDark={isDark}
                                    textStyle={getTextStyles()} 
                                  />
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-auto">
                              <button
                                onClick={() => setIsEditing(true)}
                                className="px-5 py-1 text-md font-medium rounded-lg
                                  bg-blue-500/10 text-blue-500 hover:bg-blue-500/20
                                  transition-colors duration-300 flex items-center justify-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-xs font-medium rounded-lg
                                  bg-red-500/10 text-red-500 hover:bg-red-500/20
                                  transition-colors duration-300 flex items-center justify-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                              </button>
                            </div>
                          </div>

                        </>
                      ) : (
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                          <div className="grid grid-cols-2 gap-6">
                            {/* Personal Information Column */}
                            <div className="space-y-4">
                              <h3 className={`text-lg font-semibold border-b pb-2 ${isDark ? 'text-gray-200 border-gray-700' : 'text-gray-800 border-gray-300'}`}>
                                Personal Information
                              </h3>
                              
                              <div>
                                <label className={`block text-sm font-medium mb-2 
                                  ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Username
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={formData.username}
                                    disabled={true}
                                    className={`w-full p-3 pr-12 text-sm rounded-xl border transition-colors cursor-not-allowed opacity-60
                                      ${isDark 
                                        ? 'bg-gray-800/30 border-gray-700 text-gray-400' 
                                        : 'bg-gray-100/50 border-gray-300 text-gray-500'}`}
                                    placeholder="Username cannot be changed"
                                  />
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <label className={`block text-sm font-medium mb-2 
                                  ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Email
                                </label>
                                <div className="relative">
                                  <input
                                    type="email"
                                    value={formData.email}
                                    disabled={true}
                                    className={`w-full p-3 pr-12 text-sm rounded-xl border transition-colors cursor-not-allowed opacity-60
                                      ${isDark 
                                        ? 'bg-gray-800/30 border-gray-700 text-gray-400' 
                                        : 'bg-gray-100/50 border-gray-300 text-gray-500'}`}
                                    placeholder="Email cannot be changed"
                                  />
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <label className={`block text-sm font-medium mb-2 
                                  ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Phone Number
                                </label>
                                <div className="relative">
                                  <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      phoneNumber: e.target.value
                                    })}
                                    className={`w-full p-3 pr-12 text-sm rounded-xl border transition-colors
                                      ${isDark 
                                        ? 'bg-gray-800/50 border-gray-700 focus:border-blue-500 text-gray-200' 
                                        : 'bg-white/50 border-gray-300 focus:border-blue-500 text-gray-800'}`}
                                    placeholder="Enter phone number"
                                  />
                                  <ValidationIcon 
                                    state={getPhoneValidationState()} 
                                    onClick={handleValidationClick}
                                    field="phoneNumber"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Organization Information Column */}
                            <div className="space-y-4">
                              <h3 className={`text-lg font-semibold border-b pb-2 ${isDark ? 'text-gray-200 border-gray-700' : 'text-gray-800 border-gray-300'}`}>
                                Organization Information
                              </h3>
                              
                              {orgDetails ? (
                                <>
                                  <div>
                                    <label className={`block text-sm font-medium mb-2 
                                      ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Organization
                                    </label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={orgDetails.org_name}
                                        disabled={true}
                                        className={`w-full p-3 pr-12 text-sm rounded-xl border transition-colors cursor-not-allowed opacity-60
                                          ${isDark 
                                            ? 'bg-gray-800/30 border-gray-700 text-gray-400' 
                                            : 'bg-gray-100/50 border-gray-300 text-gray-500'}`}
                                        placeholder="Organization verified"
                                      />
                                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className={`block text-sm font-medium mb-2 
                                      ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Organization Email
                                    </label>
                                    <div className="relative">
                                      <input
                                        type="email"
                                        value={orgDetails.user_org_mailid}
                                        disabled={true}
                                        className={`w-full p-3 pr-12 text-sm rounded-xl border transition-colors cursor-not-allowed opacity-60
                                          ${isDark 
                                            ? 'bg-gray-800/30 border-gray-700 text-gray-400' 
                                            : 'bg-gray-100/50 border-gray-300 text-gray-500'}`}
                                        placeholder="Organization email verified"
                                      />
                                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className={`block text-sm font-medium mb-2 
                                      ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Class/Section
                                    </label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={formData.class_sec || orgDetails.class_sec}
                                        onChange={(e) => setFormData({
                                          ...formData,
                                          class_sec: e.target.value
                                        })}
                                        className={`w-full p-3 pr-12 text-sm rounded-xl border transition-colors
                                          ${isDark 
                                            ? 'bg-gray-800/50 border-gray-700 focus:border-blue-500 text-gray-200' 
                                            : 'bg-white/50 border-gray-300 focus:border-blue-500 text-gray-800'}`}
                                        placeholder="Enter class/section"
                                      />
                                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className={`block text-sm font-medium mb-2 
                                      ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Branch
                                    </label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={formData.branch || orgDetails.branch}
                                        onChange={(e) => setFormData({
                                          ...formData,
                                          branch: e.target.value
                                        })}
                                        className={`w-full p-3 pr-12 text-sm rounded-xl border transition-colors
                                          ${isDark 
                                            ? 'bg-gray-800/50 border-gray-700 focus:border-blue-500 text-gray-200' 
                                            : 'bg-white/50 border-gray-300 focus:border-blue-500 text-gray-800'}`}
                                        placeholder="Enter branch"
                                      />
                                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className={`p-4 rounded-xl border-2 border-dashed text-center
                                  ${isDark ? 'border-gray-600 bg-gray-800/30' : 'border-gray-300 bg-gray-50/50'}`}>
                                  <OrgIcon className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                                  <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Organization Not Verified
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setIsOrgVerifyModalOpen(true)}
                                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors
                                      ${isDark 
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                                  >
                                    Verify Organization
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                              type="submit"
                              disabled={!canSaveChanges() || isWaitingForValidation()}
                              className={`flex-1 px-6 py-3 text-sm font-medium rounded-xl transition-colors duration-300
                                flex items-center justify-center gap-2
                                ${!canSaveChanges() || isWaitingForValidation()
                                  ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed' 
                                  : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                            >
                              {loading ? (
                                <>
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                  Save Changes
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditing(false)}
                              disabled={loading}
                              className="flex-1 px-6 py-3 text-sm font-medium rounded-xl transition-colors duration-300
                                bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Mobile Menu */}
              {isMenuOpen && (
                <div className="sm:hidden" id="mobile-menu">
                  <div className={`mx-2 mt-2 mb-4 rounded-xl overflow-hidden
                    ${isDark ? 'bg-black/95 backdrop-blur-xl' : 'bg-white/35 backdrop-blur-xl'}
                    border ${isDark ? 'border-gray-800' : 'border-gray-200'}
                    shadow-lg`}
                    style={{
                      borderRadius: '30px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)',
                      backdropFilter: 'blur(1px)',
                    }}
                  >
                    <div className="rounded-2xl p-4">
                      {user ? (
                        <>
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                              ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                              <span className="text-lg font-bold">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className={`font-semibold ${getTextStyles()}`}>
                                {user.username}
                              </h3>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {userData?.email || 'Not set'}
                              </p>
                            </div>
                          </div>

                          {!isEditing ? (
                            <>
                              <div className="grid grid-cols-1 gap-2">
                                <ProfileDetail 
                                  icon={UserIcon} 
                                  label="Username" 
                                  value={userData?.username || user?.username || 'Not set'} 
                                  isDark={isDark}
                                  textStyle={getTextStyles()} 
                                />
                                <ProfileDetail 
                                  icon={EmailIcon} 
                                  label="Email" 
                                  value={userData?.email || user?.email || 'Not set'} 
                                  isDark={isDark}
                                  textStyle={getTextStyles()} 
                                />
                                <ProfileDetail 
                                  icon={PhoneIcon} 
                                  label="Phone" 
                                  value={userData?.phoneNumber || 'Not set'} 
                                  isDark={isDark}
                                  textStyle={getTextStyles()} 
                                />
                                
                                {/* Organization Details */}
                                {orgDetails && (
                                  <>
                                    <ProfileDetail 
                                      icon={OrgIcon} 
                                      label="Organization" 
                                      value={orgDetails.org_name || 'Not verified'} 
                                      isDark={isDark}
                                      textStyle={getTextStyles()} 
                                    />
                                    <ProfileDetail 
                                      icon={EmailIcon} 
                                      label="Org Email" 
                                      value={orgDetails.user_org_mailid || 'Not set'} 
                                      isDark={isDark}
                                      textStyle={getTextStyles()} 
                                    />
                                    <ProfileDetail 
                                      icon={ClassIcon} 
                                      label="Class/Section" 
                                      value={orgDetails.class_sec || 'Not set'} 
                                      isDark={isDark}
                                      textStyle={getTextStyles()} 
                                    />
                                    <ProfileDetail 
                                      icon={BranchIcon} 
                                      label="Branch" 
                                      value={orgDetails.branch || 'Not set'} 
                                      isDark={isDark}
                                      textStyle={getTextStyles()} 
                                    />
                                  </>
                                )}
                              </div>

                              <div className="flex space-x-2 pt-2">
                                <button
                                  onClick={() => setIsEditing(true)}
                                  className="flex-1 px-4 py-2 text-sm font-medium rounded-lg
                                    bg-blue-500/10 text-blue-500 hover:bg-blue-500/20
                                    transition-colors"
                                >
                                  Edit Profile
                                </button>
                                <button
                                  onClick={handleLogout}
                                  className="flex-1 px-4 py-2 text-sm font-medium rounded-lg
                                    bg-red-500/10 text-red-500 hover:bg-red-500/20
                                    transition-colors"
                                >
                                  Logout
                                </button>
                              </div>

                              {!orgDetails && (
                                <div className="pt-2">
                                  <button
                                    onClick={() => {
                                      setIsOrgVerifyModalOpen(true);
                                      setIsMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-sm font-medium rounded-lg
                                      bg-gradient-to-r from-purple-500/10 to-blue-500/10 
                                      text-purple-600 dark:text-purple-400
                                      hover:from-purple-500/20 hover:to-blue-500/20
                                      transition-colors"
                                  >
                                    Verify Organization
                                  </button>
                                </div>
                              )}

                              {orgDetails && (
                                <div className="pt-2">
                                  <div className={`w-full px-4 py-2 text-xs rounded-lg text-center
                                    ${isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'}`}>
                                    {orgDetails.org_name} - {orgDetails.class_sec}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <form onSubmit={handleProfileUpdate} className="space-y-3">
                              <div>
                                <label className={`block text-xs font-medium mb-1 
                                  ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Username
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={formData.username}
                                    disabled={true}
                                    className={`w-full p-2 pr-10 text-sm rounded-lg border transition-colors cursor-not-allowed opacity-60
                                      ${isDark 
                                        ? 'bg-gray-800/30 border-gray-700 text-gray-400' 
                                        : 'bg-gray-100/50 border-gray-300 text-gray-500'}`}
                                    placeholder="Username cannot be changed"
                                  />
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <label className={`block text-xs font-medium mb-1 
                                  ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Email
                                </label>
                                <div className="relative">
                                  <input
                                    type="email"
                                    value={formData.email}
                                    disabled={true}
                                    className={`w-full p-2 pr-10 text-sm rounded-lg border transition-colors cursor-not-allowed opacity-60
                                      ${isDark 
                                        ? 'bg-gray-800/30 border-gray-700 text-gray-400' 
                                        : 'bg-gray-100/50 border-gray-300 text-gray-500'}`}
                                    placeholder="Email cannot be changed"
                                  />
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <label className={`block text-xs font-medium mb-1 
                                  ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Phone Number
                                </label>
                                <div className="relative">
                                  <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      phoneNumber: e.target.value
                                    })}
                                    className={`w-full p-2 pr-10 text-sm rounded-lg border transition-colors
                                      ${isDark 
                                        ? 'bg-gray-800/50 border-gray-700 focus:border-blue-500' 
                                        : 'bg-white/50 border-gray-300 focus:border-blue-500'}`}
                                    placeholder="Enter phone number"
                                  />
                                  <ValidationIcon 
                                    state={getPhoneValidationState()} 
                                    onClick={handleValidationClick}
                                    field="phoneNumber"
                                  />
                                </div>
                              </div>
                              
                              <div className="flex space-x-3 pt-2">
                                <button
                                  type="submit"
                                  disabled={!canSaveChanges() || isWaitingForValidation()}
                                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                                    ${!canSaveChanges() || isWaitingForValidation()
                                      ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed' 
                                      : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                                >
                                  {loading ? 'Updating...' : 'Save Changes'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsEditing(false)}
                                  disabled={loading}
                                  className="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                                    bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}

                          <div className="pt-2">
                            <button
                              onClick={toggleTheme}
                              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg
                                ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}
                                transition-colors`}
                            >
                              <span>{isDark ? '🌙' : '☀️'}</span>
                              <span className="text-sm font-medium">
                                {isDark ? 'Dark Mode' : 'Light Mode'}
                              </span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col space-y-2">
                          <Link 
                            href="/auth" 
                            className="w-full px-4 py-2 text-sm font-medium rounded-lg
                              bg-blue-500 text-white hover:bg-blue-600
                              transition-colors text-center"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Sign In
                          </Link>
                          <button
                            onClick={toggleTheme}
                            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg
                              ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}
                              transition-colors`}
                          >
                            <span>{isDark ? '🌙' : '☀️'}</span>
                            <span className="text-sm font-medium">
                              {isDark ? 'Dark Mode' : 'Light Mode'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>

    {/* Organization Verification Modal */}
    <OrgVerifyModal 
      isOpen={isOrgVerifyModalOpen}
      onClose={() => setIsOrgVerifyModalOpen(false)}
      user={user}
    />
    </>
  );
}
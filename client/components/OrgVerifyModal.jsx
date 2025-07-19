"use client";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from 'sonner';

const OrgVerifyModal = ({ isOpen, onClose, user }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    orgEmail: "",
    otp: "",
    classSec: "",
    branch: "",
  });
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Convex mutations and queries
  const saveOrgDetails = useMutation(api.orgVerification.saveOrgDetails);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        orgEmail: "",
        otp: "",
        classSec: "",
        branch: "",
      });
      setOtpSent(false);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orgEmail) {
      toast.error("Please enter your organization email");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-org-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgEmail: formData.orgEmail
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOtpSent(true);
        setStep(2);
        toast.success("OTP sent to your organization email!");
      } else {
        toast.error(result.message || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-org-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgEmail: formData.orgEmail,
          otp: formData.otp
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStep(3);
        toast.success("Email verified successfully");
      } else {
        toast.error(result.message || "Invalid OTP");
      }
    } catch (error) {
      toast.error("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classSec || !formData.branch) {
      toast.error("Please fill in all organization details");
      return;
    }

    setLoading(true);
    try {
      const result = await saveOrgDetails({
        userId: user.id, // Using the correct user ID
        orgEmail: formData.orgEmail,
        classSec: formData.classSec,
        branch: formData.branch
      });

      if (result.success) {
        toast.success("Organization details saved successfully!");
        onClose();
        // Trigger a page refresh to update navbar
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.message || "Failed to save organization details");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-org-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgEmail: formData.orgEmail
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("OTP resent to your organization email!");
      } else {
        toast.error(result.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Verify Organization
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step >= stepNumber 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`w-8 h-0.5 mx-1
                      ${step > stepNumber 
                        ? 'bg-blue-600' 
                        : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Organization Email */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organization Email
              </label>
              <input
                type="email"
                name="orgEmail"
                value={formData.orgEmail}
                onChange={handleInputChange}
                placeholder="yourname@reva.edu.in"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Only @reva.edu.in emails are allowed
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleOTPSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleInputChange}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  dark:bg-gray-700 dark:text-white text-center text-lg tracking-widest"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                OTP sent to {formData.orgEmail}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={resendOTP}
                disabled={loading}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400
                  text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Resend OTP
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                  text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Organization Details */}
        {step === 3 && (
          <form onSubmit={handleDetailsSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class/Section
                </label>
                <input
                  type="text"
                  name="classSec"
                  value={formData.classSec}
                  onChange={handleInputChange}
                  placeholder="e.g., CSE-A, IT-B"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select Branch</option>
                  <option value="Computer Science Engineering">Computer Science Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics and Communication">Electronics and Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400
                text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? "Saving..." : "Complete Verification"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrgVerifyModal;

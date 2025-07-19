"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export default function UserProfileModal({ user, isOpen, onClose, isDark }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: ""
  });
  
  const userData = useQuery(api.auth.getCurrentUser, { email: user?.email });
  const updateProfile = null; // Temporarily disabled in simplified auth system

  useEffect(() => {
    if (userData) {
      setFormData({
        username: userData.username || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || ""
      });
    }
  }, [userData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Profile editing temporarily disabled in simplified auth system
    console.log("Profile editing not available in simplified auth system");
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative w-full max-w-md p-6 rounded-2xl shadow-xl ${
        isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-4">User Profile</h2>
        
        {userData && (
          <div className="space-y-4">
            {!isEditing ? (
              <>
                <div className="space-y-2">
                  <p><span className="font-semibold">Username:</span> {userData.username}</p>
                  <p><span className="font-semibold">Email:</span> {userData.email}</p>
                  <p><span className="font-semibold">Phone:</span> {userData.phoneNumber || 'N/A'}</p>
                  <p><span className="font-semibold">Verified:</span> 
                    <span className={userData.isVerified ? 'text-green-500' : 'text-red-500'}>
                      {userData.isVerified ? ' Yes' : ' No'}
                    </span>
                  </p>
                  <p><span className="font-semibold">Status:</span> 
                    <span className={userData.status ? 'text-green-500' : 'text-red-500'}>
                      {userData.status ? ' Online' : ' Offline'}
                    </span>
                  </p>
                  <p><span className="font-semibold">Last Login:</span> 
                    {userData.lastLoggedIn ? new Date(userData.lastLoggedIn).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Edit Profile
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {Object.entries(formData).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    <input
                      type={key === 'age' ? 'number' : 'text'}
                      value={value}
                      onChange={(e) => setFormData({
                        ...formData,
                        [key]: e.target.value
                      })}
                      className={`w-full p-2 rounded-lg ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                      } border`}
                    />
                  </div>
                ))}
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
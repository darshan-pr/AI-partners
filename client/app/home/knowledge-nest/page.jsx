"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import OrgVerifyModal from "@/components/OrgVerifyModal";

// Icon Components
const icons = {
  Upload: () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  Search: () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  File: () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Folder: () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 21l4-4 4 4"/>
    </svg>
  ),
  Delete: () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Organization: () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
};

// File Preview Component
const FilePreview = ({ file, onDelete }) => {
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileType.includes('pdf')) {
      return (
        <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else {
      return <icons.File />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0">
            {getFileIcon(file.file_type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {file.file_name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
            </p>
            {file.description && (
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                {file.description}
              </p>
            )}
            {file.tags && file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {file.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(file._id)}
          className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <icons.Delete />
        </button>
      </div>
    </div>
  );
};

// File Upload Component
const FileUpload = ({ onFileUpload, user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (files) => {
    if (files && files.length > 0) {
      for (let file of files) {
        onFileUpload(file);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setIsDropdownOpen(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-blue-600 transition-all"
      >
        <icons.Upload />
        <span>Upload</span>
      </button>

      {isDropdownOpen && (
        <div 
          className={`absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 ${
            isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Upload Files
            </h3>
            
            {/* File Input */}
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <icons.File />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Choose files or drag and drop
                </span>
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
              />
              
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Supports: PDF, DOC, TXT, Images, Videos
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function KnowledgeNestPage() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // Check organization verification - EXACT same approach as navbar
  const orgDetails = useQuery(api.orgVerification.getUserOrgDetails, 
    user?.id ? { userId: user.id } : "skip"
  );

  // Get user files
  const userFiles = useQuery(api.knowledgeNest.getUserFiles, 
    user?.id ? { userId: user.id } : "skip"
  );

  // Mutations
  const addFile = useMutation(api.knowledgeNest.addFile);
  const deleteFile = useMutation(api.knowledgeNest.deleteFile);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleFileUpload = async (file) => {
    if (!user) return;

    setUploading(true);
    try {
      // Create a mock file URL (in real implementation, you'd upload to a storage service)
      const fileUrl = URL.createObjectURL(file);
      
      await addFile({
        userId: user.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: fileUrl,
        description: "",
        tags: [],
      });

      console.log("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!user) return;

    try {
      await deleteFile({
        fileId,
        userId: user.id,
      });
      console.log("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const filteredFiles = userFiles?.filter(file =>
    file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.tags && file.tags.some(tag => 
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  ) || [];

  // Show organization verification if not verified
  if (orgDetails === undefined) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Checking organization verification...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // EXACT same check as navbar: if orgDetails is null/undefined, user is not verified
  if (!orgDetails) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-16">
          <div className="max-w-6xl mx-auto px-5 py-8">
            {/* Navigation space for navbar */}
            <div className="h-16"></div>
            
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full mb-6">
                  <icons.Organization className="h-10 w-10 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Organization Verification Required
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
                  Access to Knowledge Nest requires organization verification. Please verify your organization email to continue.
                </p>
                <button
                  onClick={() => setIsVerifyModalOpen(true)}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105"
                >
                  Verify Organization
                </button>
              </div>
            </div>
          </div>
          
          {isVerifyModalOpen && (
            <OrgVerifyModal 
              isOpen={isVerifyModalOpen}
              onClose={() => setIsVerifyModalOpen(false)}
              user={user}
            />
          )}
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-16">
        <div className="max-w-6xl mx-auto px-5 py-8">
          {/* Navigation space */}
          <div className="h-16"></div>
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg flex items-center justify-center">
                <icons.Folder className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Knowledge Nest
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Upload, organize, and access your study materials
            </p>
          </div>

          {/* Search and Upload Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <icons.Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Upload Button */}
              <FileUpload onFileUpload={handleFileUpload} user={user} />
            </div>
          </div>

          {/* File Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploading && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            )}
            
            {filteredFiles.map((file) => (
              <FilePreview
                key={file._id}
                file={file}
                onDelete={handleDeleteFile}
              />
            ))}
          </div>

          {filteredFiles.length === 0 && !uploading && (
            <div className="text-center py-12">
              <icons.Folder className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No files found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? "Try a different search term" : "Upload your first file to get started"}
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

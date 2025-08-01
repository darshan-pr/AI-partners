'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { 
  Upload, 
  X, 
  File, 
  FileText, 
  Image, 
  FileVideo, 
  Archive,
  Music,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const FileUploadModal = ({ 
  isOpen, 
  onClose, 
  userOrgDetails, 
  onUploadSuccess,
  isDark = false 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const uploadFileMetadata = useMutation(api.knowledgeNest.uploadFileMetadata);
  const generateUploadUrl = useMutation(api.knowledgeNest.generateUploadUrl);

  // Handle ESC key to close modal and prevent body scroll
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen && !uploading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, uploading]);

  // Common subjects for computer science
  const commonSubjects = [
    'Data Structures and Algorithms',
    'Database Management Systems',
    'Computer Networks',
    'Operating Systems',
    'Software Engineering',
    'Web Development',
    'Machine Learning',
    'Artificial Intelligence',
    'Cybersecurity',
    'Mobile App Development',
    'Cloud Computing',
    'Blockchain',
    'Mathematics',
    'Physics',
    'Chemistry',
    'English',
    'Other'
  ];

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="w-6 h-6 text-blue-500" />;
    if (fileType.startsWith('video/')) return <FileVideo className="w-6 h-6 text-purple-500" />;
    if (fileType.startsWith('audio/')) return <Music className="w-6 h-6 text-green-500" />;
    if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('sheet') || fileType.includes('presentation')) return <FileText className="w-6 h-6 text-red-500" />;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return <Archive className="w-6 h-6 text-yellow-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const validateFile = (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/webm',
      'audio/mp3',
      'audio/wav',
      'audio/mpeg',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed'
    ];

    if (file.size > maxSize) {
      return `File size must be less than 50MB (current: ${formatFileSize(file.size)})`;
    }

    if (!allowedTypes.includes(file.type)) {
      return 'File type not allowed. Please upload PDF, Word, Excel, PowerPoint, text files, images, videos, audio, or archive files.';
    }

    return null;
  };

  const handleUpload = async () => {
    if (!selectedFile || !subject.trim()) {
      setError('Please select a file and enter a subject');
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError('');
    setUploadStatus(null);

    try {
      // Step 1: Generate upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Step 2: Upload file to Convex storage
      const fileUploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!fileUploadResult.ok) {
        throw new Error('Failed to upload file to storage');
      }

      const { storageId } = await fileUploadResult.json();

      // Step 3: Save metadata to database
      const result = await uploadFileMetadata({
        file_id: storageId,
        subject: subject.trim(),
        filename: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        description: description.trim(),
        username: userOrgDetails.org_user,
      });

      if (result.success) {
        setUploadStatus('success');
        // Clear the form immediately to show success
        setSelectedFile(null);
        setSubject('');
        setDescription('');
        setError('');
        
        setTimeout(() => {
          onUploadSuccess();
          handleClose();
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to save file metadata');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload file');
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setSubject('');
    setDescription('');
    setError('');
    setUploadStatus(null);
    setUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  // Create portal content for perfect centering with mobile optimization
  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) {
          handleClose();
        }
      }}
    >
      <div 
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
        }`}
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r from-indigo-500 to-blue-600`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Upload to Knowledge Nest
                </h2>
                <p className="text-blue-100 text-sm">Share your study materials with your organization</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
              disabled={uploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Organization Details - Enhanced Mobile Layout */}
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              Upload Details (Auto-filled)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>🏫 Organization:</span>
                <p className="font-medium">{userOrgDetails.org_name}</p>
              </div>
              <div>
                <span className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>📚 Semester:</span>
                <p className="font-medium">Semester {userOrgDetails.semester}</p>
              </div>
              <div>
                <span className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>🎓 Branch:</span>
                <p className="font-medium">{userOrgDetails.branch}</p>
              </div>
              <div>
                <span className={`block ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>👤 Uploaded by:</span>
                <p className="font-medium">{userOrgDetails.username}</p>
              </div>
            </div>
          </div>

          {/* File Upload Area */}
                    {/* Enhanced File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-6 lg:p-8 text-center transition-all duration-300 ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                : selectedFile
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : isDark
                ? 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(selectedFile.type)}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                        : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className={`text-sm flex items-center justify-center gap-2 ${
                  isDark ? 'text-green-300' : 'text-green-600'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                  File ready for upload
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <Upload className={`w-8 h-8 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
                <div>
                  <p className={`text-lg font-medium mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Drag and drop your file here
                  </p>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    or click to browse from your device
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all transform hover:scale-105"
                >
                  Choose File
                </button>
                <div className={`text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Support for PDF, Word, Excel, PowerPoint, images, videos, audio files (Max: 50MB)
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.webm,.mp3,.wav,.zip,.rar,.7z"
            />
          </div>

          {/* Enhanced Form Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Field */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                📚 Subject *
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`w-full p-3 rounded-xl border transition-all duration-200 ${
                  isDark 
                    ? 'border-gray-600 bg-gray-800 text-white focus:border-blue-500 focus:bg-gray-700' 
                    : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:bg-blue-50/50'
                } focus:outline-none focus:ring-0`}
                required
              >
                <option value="">Select a subject</option>
                {commonSubjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            {/* File Type Display */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                📁 File Type
              </label>
              <div className={`w-full p-3 rounded-xl border ${
                isDark 
                  ? 'border-gray-600 bg-gray-800 text-gray-400' 
                  : 'border-gray-300 bg-gray-100 text-gray-600'
              }`}>
                {selectedFile ? selectedFile.type || 'Unknown' : 'No file selected'}
              </div>
            </div>
          </div>

          {/* Description Field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              📝 Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a brief description of this file (e.g., 'Chapter 5 notes', 'Assignment solutions', etc.)"
              rows={3}
              className={`w-full p-3 rounded-xl border transition-all duration-200 resize-none ${
                isDark 
                  ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-700' 
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-blue-50/50'
              } focus:outline-none focus:ring-0`}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
              isDark 
                ? 'bg-red-900/30 border-red-700/50 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <XCircle className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {uploadStatus === 'success' && (
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
              isDark 
                ? 'bg-green-900/30 border-green-700/50 text-green-300' 
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              <CheckCircle className="w-5 h-5" />
              <p className="font-medium">File uploaded successfully! 🎉</p>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button
              onClick={handleClose}
              className={`flex-1 px-6 py-3 rounded-2xl font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !subject.trim() || uploading}
              className={`flex-1 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 transform ${
                !selectedFile || !subject.trim() || uploading
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading File...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload to Knowledge Nest
                </>
              )}
            </button>
          </div>

          {/* File Guidelines */}
          <div className={`text-xs text-center p-3 rounded-xl ${
            isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-50 text-gray-500'
          }`}>
            📋 <strong>Guidelines:</strong> Max 50MB • PDF, Word, Excel, PowerPoint, Images, Videos, Audio, Archives supported
          </div>
        </div>
      </div>
    </div>
  );

  // Use React Portal for proper modal rendering
  return typeof window !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};

export default FileUploadModal;

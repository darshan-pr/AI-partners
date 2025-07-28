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
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-6 h-6 text-red-500" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-6 h-6 text-yellow-500" />;
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
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/avi',
      'video/mov',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (file.size > maxSize) {
      return 'File size must be less than 50MB';
    }

    if (!allowedTypes.includes(file.type)) {
      return 'File type not allowed. Please upload PDF, Word, PowerPoint, images, videos, or archive files.';
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
        username: userOrgDetails.username,
      });

      if (result.success) {
        setUploadStatus('success');
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

  // Create portal content for perfect centering
  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-[9999]"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        margin: 0,
        zIndex: 9999
      }}
      onClick={(e) => {
        // Close modal when clicking backdrop (only if not uploading)
        if (e.target === e.currentTarget && !uploading) {
          handleClose();
        }
      }}
    >
      <div 
        className={`w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden ${
          isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
        }`}
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📚 Upload to Knowledge Nest
            </h2>
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              disabled={uploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Organization Details (Read-only) */}
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              Upload Details (Auto-filled)
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Organization:</span>
                <p className="font-medium">{userOrgDetails.org_name}</p>
              </div>
              <div>
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Semester:</span>
                <p className="font-medium">{userOrgDetails.semester}</p>
              </div>
              <div>
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Branch:</span>
                <p className="font-medium">{userOrgDetails.branch}</p>
              </div>
              <div>
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Uploaded by:</span>
                <p className="font-medium">{userOrgDetails.username}</p>
              </div>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : selectedFile
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : isDark
                ? 'border-gray-600 hover:border-gray-500'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  {getFileIcon(selectedFile.type)}
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-500 hover:text-red-700 text-sm"
                  disabled={uploading}
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className={`w-12 h-12 mx-auto ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                <div>
                  <p className="text-lg font-medium">Drop your file here</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    or click to browse
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  disabled={uploading}
                >
                  Choose File
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.zip,.rar"
          />

          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Subject *
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={`w-full p-3 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-gray-800 border-gray-600 focus:border-blue-500'
                  : 'bg-white border-gray-300 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              disabled={uploading}
            >
              <option value="">Select a subject</option>
              {commonSubjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a brief description of the file..."
              rows={3}
              className={`w-full p-3 rounded-lg border transition-colors resize-none ${
                isDark
                  ? 'bg-gray-800 border-gray-600 focus:border-blue-500'
                  : 'bg-white border-gray-300 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              disabled={uploading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {uploadStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700 dark:text-green-400">File uploaded successfully!</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                isDark
                  ? 'border-gray-600 hover:bg-gray-800'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !subject.trim() || uploading}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                !selectedFile || !subject.trim() || uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload File
                </>
              )}
            </button>
          </div>

          {/* File Info */}
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center`}>
            Maximum file size: 50MB • Supported formats: PDF, Word, PowerPoint, Images, Videos, Archives
          </div>
        </div>
      </div>
    </div>
  );

  // Use React Portal to render modal at document root level for perfect centering
  return typeof window !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};

export default FileUploadModal;

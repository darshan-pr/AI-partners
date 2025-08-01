'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { 
  X, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  FileVideo, 
  File,
  Eye,
  Loader2,
  AlertCircle,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2
} from 'lucide-react';

const FilePreviewModal = ({ 
  isOpen, 
  onClose, 
  file, 
  username,
  isDark = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageZoom, setImageZoom] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get file URL for preview
  const fileUrlData = useQuery(
    api.knowledgeNest.getFileUrl,
    file ? { file_id: file.file_id, username } : "skip"
  );

  useEffect(() => {
    if (fileUrlData?.success && fileUrlData.url) {
      setPreviewUrl(fileUrlData.url);
    } else if (fileUrlData?.success === false) {
      setError(fileUrlData.message || 'Failed to load file');
    }
  }, [fileUrlData]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
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
  }, [isOpen, onClose]);

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('text/')) return 'text';
    if (mimeType.includes('application/msword') || mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) return 'document';
    if (mimeType.includes('application/vnd.ms-powerpoint') || mimeType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')) return 'presentation';
    return 'other';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImageZoom = (direction) => {
    if (direction === 'in') {
      setImageZoom(prev => Math.min(prev + 25, 300));
    } else {
      setImageZoom(prev => Math.max(prev - 25, 25));
    }
  };

  const handleImageRotate = () => {
    setImageRotation(prev => (prev + 90) % 360);
  };

  const resetImageTransform = () => {
    setImageZoom(100);
    setImageRotation(0);
  };

  const renderPreviewContent = () => {
    if (!file || !previewUrl) return null;

    const fileType = getFileType(file.file_type);

    switch (fileType) {
      case 'image':
        return (
          <div className={`relative flex-1 flex items-center justify-center overflow-hidden ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            {/* Enhanced Image Controls */}
            <div className="absolute top-2 lg:top-4 right-2 lg:right-4 z-10 flex flex-col lg:flex-row gap-1 lg:gap-2">
              <div className="flex gap-1 lg:gap-2">
                <button
                  onClick={() => handleImageZoom('out')}
                  className={`p-2 lg:p-2.5 rounded-xl backdrop-blur-sm transition-all transform hover:scale-105 shadow-lg ${
                    isDark ? 'bg-gray-700/80 hover:bg-gray-600/80 text-white' : 'bg-white/80 hover:bg-gray-100/80 text-gray-700'
                  }`}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3 h-3 lg:w-4 lg:h-4" />
                </button>
                <button
                  onClick={() => handleImageZoom('in')}
                  className={`p-2 lg:p-2.5 rounded-xl backdrop-blur-sm transition-all transform hover:scale-105 shadow-lg ${
                    isDark ? 'bg-gray-700/80 hover:bg-gray-600/80 text-white' : 'bg-white/80 hover:bg-gray-100/80 text-gray-700'
                  }`}
                  title="Zoom In"
                >
                  <ZoomIn className="w-3 h-3 lg:w-4 lg:h-4" />
                </button>
              </div>
              <div className="flex gap-1 lg:gap-2">
                <button
                  onClick={handleImageRotate}
                  className={`p-2 lg:p-2.5 rounded-xl backdrop-blur-sm transition-all transform hover:scale-105 shadow-lg ${
                    isDark ? 'bg-gray-700/80 hover:bg-gray-600/80 text-white' : 'bg-white/80 hover:bg-gray-100/80 text-gray-700'
                  }`}
                  title="Rotate"
                >
                  <RotateCw className="w-3 h-3 lg:w-4 lg:h-4" />
                </button>
                <button
                  onClick={resetImageTransform}
                  className={`px-2 lg:px-3 py-2 rounded-xl text-xs backdrop-blur-sm transition-all transform hover:scale-105 shadow-lg ${
                    isDark ? 'bg-gray-700/80 hover:bg-gray-600/80 text-white' : 'bg-white/80 hover:bg-gray-100/80 text-gray-700'
                  }`}
                  title="Reset View"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Enhanced Zoom indicator */}
            <div className="absolute bottom-2 lg:bottom-4 left-2 lg:left-4 z-10">
              <span className={`px-2 py-1 rounded-lg text-xs backdrop-blur-sm shadow-lg ${
                isDark ? 'bg-gray-700/80 text-gray-300' : 'bg-white/80 text-gray-700'
              }`}>
                {imageZoom}%
              </span>
            </div>

            {/* Mobile gesture hint */}
            <div className="absolute bottom-2 right-2 lg:hidden">
              <div className={`px-2 py-1 rounded-lg text-xs backdrop-blur-sm ${
                isDark ? 'bg-gray-700/80 text-gray-400' : 'bg-white/80 text-gray-500'
              }`}>
                Pinch to zoom
              </div>
            </div>

            <img
              src={previewUrl}
              alt={file.filename}
              className="max-w-none transition-transform duration-300 rounded-lg shadow-lg"
              style={{
                transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                maxHeight: '75vh',
                maxWidth: '95%'
              }}
              onError={() => setError('Failed to load image')}
            />
          </div>
        );

      case 'video':
        return (
          <div className={`flex-1 flex items-center justify-center p-4 ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="w-full max-w-4xl">
              <video
                src={previewUrl}
                controls
                className="w-full h-auto max-h-[70vh] rounded-lg shadow-lg"
                style={{ maxHeight: 'calc(70vh - 2rem)' }}
                onError={() => setError('Failed to load video')}
                poster={file.thumbnail_url}
              >
                Your browser does not support video playback.
              </video>
            </div>
          </div>
        );

      case 'pdf':
        return (
          <div className={`flex-1 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <iframe
              src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1&page=1&view=FitH`}
              className="w-full h-full min-h-[400px] lg:min-h-[600px] rounded-lg"
              title={file.filename}
              onError={() => setError('Failed to load PDF')}
              style={{ border: 'none' }}
            />
          </div>
        );

      case 'text':
        return (
          <div className={`flex-1 p-4 lg:p-6 overflow-auto ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <iframe
              src={previewUrl}
              className={`w-full h-full min-h-[300px] lg:min-h-[500px] rounded-lg shadow-lg ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
              title={file.filename}
              onError={() => setError('Failed to load text file')}
            />
          </div>
        );

      case 'document':
      case 'presentation':
        return (
          <div className={`flex-1 flex flex-col items-center justify-center p-6 lg:p-8 ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="text-center max-w-md">
              <div className={`w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isDark ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}>
                <FileText className="w-8 h-8 lg:w-10 lg:h-10 text-blue-500" />
              </div>
              <h3 className={`text-lg lg:text-xl font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {fileType === 'document' ? 'Document Preview' : 'Presentation Preview'}
              </h3>
              <p className={`text-sm lg:text-base mb-4 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Preview not available for this file type
              </p>
              <p className={`text-xs lg:text-sm mb-6 ${
                isDark ? 'text-gray-500' : 'text-gray-500'
              }`}>
                You can download the file to view it in the appropriate application
              </p>
              <button
                onClick={handleDownload}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
              >
                <Download className="w-4 h-4" />
                Download File
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className={`flex-1 flex flex-col items-center justify-center p-6 lg:p-8 ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="text-center max-w-md">
              <div className={`w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <File className="w-8 h-8 lg:w-10 lg:h-10 text-gray-500" />
              </div>
              <h3 className={`text-lg lg:text-xl font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Preview Not Available
              </h3>
              <p className={`text-sm lg:text-base mb-4 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                This file type cannot be previewed
              </p>
              <p className={`text-xs lg:text-sm mb-6 ${
                isDark ? 'text-gray-500' : 'text-gray-500'
              }`}>
                File Type: {file.file_type}
              </p>
              <button
                onClick={handleDownload}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
              >
                <Download className="w-4 h-4" />
                Download File
              </button>
            </div>
          </div>
        );
    }
  };

  if (!isOpen || !file) return null;

  // Enhanced modal content with mobile optimization
  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className={`w-full max-w-7xl rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
        }`}
        style={{
          height: 'auto',
          minHeight: '60vh',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div className={`px-4 lg:px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${
              isDark ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              {getFileType(file.file_type) === 'image' && <ImageIcon className="w-5 h-5 text-blue-600" />}
              {getFileType(file.file_type) === 'video' && <FileVideo className="w-5 h-5 text-purple-600" />}
              {getFileType(file.file_type) === 'pdf' && <FileText className="w-5 h-5 text-red-600" />}
              {!['image', 'video', 'pdf'].includes(getFileType(file.file_type)) && <File className="w-5 h-5 text-gray-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg lg:text-xl font-semibold truncate" title={file.filename}>
                {file.filename}
              </h2>
              <div className={`flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <span className="flex items-center gap-1">
                  <Archive className="w-3 h-3" />
                  {formatFileSize(file.file_size)}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {file.subject}
                </span>
                <span className="hidden lg:inline">•</span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {file.uploaded_username}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button
              onClick={handleDownload}
              className={`p-2 lg:p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                isDark 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              title="Download File"
            >
              <Download className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
            <button
              onClick={onClose}
              className={`p-2 lg:p-3 rounded-xl transition-all duration-200 ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
              title="Close Preview"
            >
              <X className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {error ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-red-900/30' : 'bg-red-100'
                }`}>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Error Loading File
                </h3>
                <p className={`mb-6 ${
                  isDark ? 'text-red-300' : 'text-red-600'
                }`}>
                  {error}
                </p>
                <button
                  onClick={handleDownload}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                >
                  <Download className="w-4 h-4" />
                  Download Instead
                </button>
              </div>
            </div>
          ) : loading || !previewUrl ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
                <p className={`font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Loading preview...
                </p>
                <p className={`text-sm mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Please wait while we prepare your file
                </p>
              </div>
            </div>
          ) : (
            renderPreviewContent()
          )}
        </div>

        {/* Enhanced Footer */}
        <div className={`px-4 lg:px-6 py-3 border-t ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4 text-sm">
            <div className={`flex flex-wrap items-center gap-2 lg:gap-4 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(file.upload_date)}
              </span>
              {file.description && (
                <>
                  <span className="hidden lg:inline">•</span>
                  <span className="truncate max-w-xs lg:max-w-md" title={file.description}>
                    📝 {file.description}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center justify-between lg:justify-end gap-2 text-xs">
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                Press ESC to close
              </span>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>Preview Mode</span>
              </div>
            </div>
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

export default FilePreviewModal;

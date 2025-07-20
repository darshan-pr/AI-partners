'use client';

import React, { useState, useEffect } from 'react';
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
          <div className="relative flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 overflow-hidden">
            {/* Image Controls */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={() => handleImageZoom('out')}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} shadow-lg`}
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleImageZoom('in')}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} shadow-lg`}
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleImageRotate}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} shadow-lg`}
                title="Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={resetImageTransform}
                className={`px-3 py-2 rounded-lg text-xs ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} shadow-lg`}
                title="Reset"
              >
                Reset
              </button>
            </div>

            {/* Zoom indicator */}
            <div className="absolute bottom-4 left-4 z-10">
              <span className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'} shadow-lg`}>
                {imageZoom}%
              </span>
            </div>

            <img
              src={previewUrl}
              alt={file.filename}
              className="max-w-none transition-transform duration-300"
              style={{
                transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                maxHeight: '80vh'
              }}
              onError={() => setError('Failed to load image')}
            />
          </div>
        );

      case 'video':
        return (
          <div className="flex-1 flex items-center justify-center bg-black">
            <video
              src={previewUrl}
              controls
              className="max-w-full max-h-[80vh]"
              onError={() => setError('Failed to load video')}
            >
              Your browser does not support video playback.
            </video>
          </div>
        );

      case 'pdf':
        return (
          <div className="flex-1 bg-gray-100 dark:bg-gray-800">
            <iframe
              src={`${previewUrl}#toolbar=0`}
              className="w-full h-full min-h-[600px]"
              title={file.filename}
              onError={() => setError('Failed to load PDF')}
            />
          </div>
        );

      case 'text':
        return (
          <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-800 overflow-auto">
            <iframe
              src={previewUrl}
              className="w-full h-full min-h-[500px] bg-white dark:bg-gray-900 rounded-lg"
              title={file.filename}
              onError={() => setError('Failed to load text file')}
            />
          </div>
        );

      case 'document':
      case 'presentation':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-100 dark:bg-gray-800">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">
                {fileType === 'document' ? 'Document Preview' : 'Presentation Preview'}
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Preview not available for this file type
              </p>
              <p className={`text-xs mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                You can download the file to view it in the appropriate application
              </p>
              <button
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <Download className="w-4 h-4" />
                Download File
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-100 dark:bg-gray-800">
            <div className="text-center">
              <File className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                This file type cannot be previewed
              </p>
              <p className={`text-xs mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                File Type: {file.file_type}
              </p>
              <button
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className={`w-full h-full max-w-7xl max-h-[95vh] m-4 rounded-xl shadow-2xl overflow-hidden flex flex-col ${
        isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              {getFileType(file.file_type) === 'image' && <ImageIcon className="w-5 h-5 text-blue-600" />}
              {getFileType(file.file_type) === 'video' && <FileVideo className="w-5 h-5 text-purple-600" />}
              {getFileType(file.file_type) === 'pdf' && <FileText className="w-5 h-5 text-red-600" />}
              {!['image', 'video', 'pdf'].includes(getFileType(file.file_type)) && <File className="w-5 h-5 text-gray-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate" title={file.filename}>
                {file.filename}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{formatFileSize(file.file_size)}</span>
                <span>•</span>
                <span>{file.subject}</span>
                <span>•</span>
                <span>by {file.uploaded_username}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleDownload}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold mb-2">Error Loading File</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                >
                  <Download className="w-4 h-4" />
                  Download Instead
                </button>
              </div>
            </div>
          ) : loading || !previewUrl ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-500">Loading preview...</p>
              </div>
            </div>
          ) : (
            renderPreviewContent()
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
              <span>Uploaded: {formatDate(file.upload_date)}</span>
              {file.description && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-md" title={file.description}>
                    {file.description}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                Press ESC to close
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;

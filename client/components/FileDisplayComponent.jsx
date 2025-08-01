'use client';

import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import FilePreviewModal from './FilePreviewModal';
import { 
  File, 
  FileText, 
  Image, 
  FileVideo, 
  Archive,
  Download,
  Trash2,
  Eye,
  Calendar,
  User,
  BookOpen,
  Filter,
  Search,
  Grid,
  List,
  Loader2,
  AlertCircle,
  Upload,
  GraduationCap
} from 'lucide-react';

const FileDisplayComponent = ({ 
  username, 
  isDark = false,
  onFileSelect = null // For selection mode
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterSubject, setFilterSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch files
  const filesData = useQuery(api.knowledgeNest.getKnowledgeNestFiles, {
    username,
    subject: filterSubject || undefined,
  });

  // Fetch subjects for filter
  const subjectsData = useQuery(api.knowledgeNest.getSubjects, { username });

  // Delete file mutation
  const deleteFile = useMutation(api.knowledgeNest.deleteFile);

  // Download file query - we'll use it on demand
  const [downloadingFile, setDownloadingFile] = useState(null);

  const getFileIcon = (fileType, size = 'w-6 h-6') => {
    if (fileType.startsWith('image/')) return <Image className={`${size} text-blue-500`} />;
    if (fileType.startsWith('video/')) return <FileVideo className={`${size} text-purple-500`} />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className={`${size} text-red-500`} />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className={`${size} text-yellow-500`} />;
    return <File className={`${size} text-gray-500`} />;
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async (fileId, filename) => {
    try {
      setDownloadingFile(fileId);
      
      // Use the Convex download function
      const downloadData = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: fileId,
          username: username,
        }),
      });

      if (downloadData.ok) {
        const result = await downloadData.json();
        
        if (result.success) {
          // Create download link
          const link = document.createElement('a');
          link.href = result.downloadUrl;
          link.download = result.filename;
          
          // Handle different types of URLs
          if (result.downloadUrl.startsWith('data:')) {
            // Data URL can be downloaded directly
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            // External URL - open in new tab for download
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
          
          if (result.isDemo) {
            alert(result.message || 'Demo file download simulated');
          }
        } else {
          alert(result.message || 'Failed to download file');
        }
      } else {
        // Fallback to the existing download method
        const response = await fetch(`/api/download?fileId=${fileId}&filename=${encodeURIComponent(filename)}`, {
          method: 'GET',
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          alert(`Download functionality is being implemented.\nFile: ${filename}`);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(`Download functionality is being implemented.\nFile: ${filename}`);
    } finally {
      setDownloadingFile(null);
    }
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewFile(null);
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        const result = await deleteFile({
          file_id: fileId,
          username,
        });
        
        if (!result.success) {
          alert(result.message || 'Failed to delete file');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete file');
      }
    }
  };

  // Filter files based on search term
  const filteredFiles = filesData?.files?.filter(file => 
    file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.uploaded_username.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!filesData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading files...</span>
      </div>
    );
  }

  if (!filesData.success) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <span className="ml-2">{filesData.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Info - Enhanced Mobile Design */}
      {filesData?.orgInfo && (
        <div className={`glass-card rounded-2xl p-4 lg:p-6 ${
          isDark ? 'bg-gray-800/30' : 'bg-white/30'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${
              isDark ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <Archive className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className={`font-semibold text-lg ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              📚 {filesData.orgInfo?.org_name || 'Organization'}
            </h3>
          </div>
          <div className={`text-sm ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4" />
                Semester: {filesData.orgInfo?.semester || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                Branch: {filesData.orgInfo?.branch || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Controls - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Search files, subjects, or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-2xl border-0 transition-all duration-200 ${
              isDark 
                ? 'bg-gray-800/50 text-white placeholder-gray-400 focus:bg-gray-700/50' 
                : 'bg-white/50 text-gray-900 placeholder-gray-500 focus:bg-white/70'
            } backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-3">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-2xl transition-all duration-200 backdrop-blur-sm ${
              showFilters
                ? isDark 
                  ? 'bg-blue-900/50 text-blue-300 ring-2 ring-blue-500/50' 
                  : 'bg-blue-100/80 text-blue-700 ring-2 ring-blue-500/50'
                : isDark 
                  ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200' 
                  : 'bg-white/50 text-gray-600 hover:bg-white/70 hover:text-gray-800'
            }`}
            title="Toggle Filters"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* View Mode Toggle */}
          <div className={`flex rounded-2xl overflow-hidden backdrop-blur-sm ${
            isDark ? 'bg-gray-800/50' : 'bg-white/50'
          }`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 transition-all duration-200 ${
                viewMode === 'grid'
                  ? isDark 
                    ? 'bg-blue-900/50 text-blue-300' 
                    : 'bg-blue-100/80 text-blue-700'
                  : isDark 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/30'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 transition-all duration-200 ${
                viewMode === 'list'
                  ? isDark 
                    ? 'bg-blue-900/50 text-blue-300' 
                    : 'bg-blue-100/80 text-blue-700'
                  : isDark 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/30'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Filters Panel */}
      {showFilters && (
        <div className={`glass-card rounded-2xl p-4 lg:p-6 transition-all duration-300 ${
          isDark ? 'bg-gray-800/30' : 'bg-white/30'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                📚 Filter by Subject
              </label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className={`w-full p-3 rounded-xl border-0 transition-all duration-200 ${
                  isDark 
                    ? 'bg-gray-800/50 text-white focus:bg-gray-700/50' 
                    : 'bg-white/50 text-gray-900 focus:bg-white/70'
                } backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              >
                <option value="">All Subjects</option>
                {subjectsData?.subjects?.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            {/* Add more filter options here in future */}
          </div>
        </div>
      )}

      {/* Files Count with better mobile styling */}
      <div className={`flex items-center gap-2 text-sm ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>
        <FileText className="w-4 h-4" />
        <span>
          {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Enhanced Empty State */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12 lg:py-16">
          <div className={`glass-card rounded-3xl p-8 lg:p-12 max-w-md mx-auto ${
            isDark ? 'bg-gray-800/30' : 'bg-white/30'
          }`}>
            <div className="relative mb-6">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-100/80'
              }`}>
                <File className={`w-10 h-10 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
              <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${
                isDark ? 'bg-blue-900/50' : 'bg-blue-100'
              }`}>
                <Search className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            
            <h3 className={`text-xl font-semibold mb-3 ${
              isDark ? 'text-gray-200' : 'text-gray-800'
            }`}>
              No files found
            </h3>
            
            <p className={`mb-6 leading-relaxed ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {searchTerm || filterSubject 
                ? 'Try adjusting your search terms or filters to find more files'
                : 'Be the first to share knowledge! Upload your study materials to get started'
              }
            </p>
            
            {!searchTerm && !filterSubject && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                isDark 
                  ? 'bg-blue-900/50 text-blue-300' 
                  : 'bg-blue-100/80 text-blue-700'
              }`}>
                <Upload className="w-4 h-4" />
                Click "Upload Resource" to add files
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Enhanced Grid View - Mobile Responsive */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {filteredFiles.map((file) => (
            <div
              key={file._id}
              className={`glass-card rounded-2xl p-4 lg:p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] group ${
                onFileSelect 
                  ? 'cursor-pointer hover:ring-2 hover:ring-blue-500/50' 
                  : ''
              } ${isDark ? 'bg-gray-800/30' : 'bg-white/30'}`}
              onClick={() => onFileSelect && onFileSelect(file)}
            >
              {/* File Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0">
                  {getFileIcon(file.file_type, 'w-7 h-7')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate text-sm lg:text-base group-hover:text-blue-600 transition-colors ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`} title={file.filename}>
                    {file.filename}
                  </p>
                  <p className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formatFileSize(file.file_size)}
                  </p>
                </div>
              </div>

              {/* File Metadata */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className={`truncate ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`} title={file.subject}>
                    {file.subject}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className={`truncate ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`} title={file.uploaded_username}>
                    {file.uploaded_username}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formatDate(file.upload_date)}
                  </span>
                </div>
              </div>

              {/* File Description */}
              {file.description && (
                <div className={`text-xs p-3 rounded-lg mb-4 ${
                  isDark ? 'bg-gray-700/30 text-gray-400' : 'bg-gray-100/60 text-gray-600'
                }`}>
                  <p className="line-clamp-2" title={file.description}>
                    {file.description}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {!onFileSelect && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(file);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${
                      isDark 
                        ? 'bg-green-900/40 hover:bg-green-900/60 text-green-300' 
                        : 'bg-green-100/80 hover:bg-green-200/80 text-green-700'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file.file_id, file.filename);
                    }}
                    disabled={downloadingFile === file.file_id}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark 
                        ? 'bg-blue-900/40 hover:bg-blue-900/60 text-blue-300' 
                        : 'bg-blue-100/80 hover:bg-blue-200/80 text-blue-700'
                    }`}
                  >
                    {downloadingFile === file.file_id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    {downloadingFile === file.file_id ? 'Downloading...' : 'Download'}
                  </button>
                  {file.uploaded_username === username && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file.file_id);
                      }}
                      className={`p-2 rounded-xl transition-all hover:scale-105 ${
                        isDark 
                          ? 'bg-red-900/40 hover:bg-red-900/60 text-red-300' 
                          : 'bg-red-100/80 hover:bg-red-200/80 text-red-700'
                      }`}
                      title="Delete file"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Enhanced List View - Mobile Responsive */
        <div className="space-y-3">
          {filteredFiles.map((file) => (
            <div
              key={file._id}
              className={`glass-card rounded-2xl p-4 lg:p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group ${
                onFileSelect 
                  ? 'cursor-pointer hover:ring-2 hover:ring-blue-500/50' 
                  : ''
              } ${isDark ? 'bg-gray-800/30' : 'bg-white/30'}`}
              onClick={() => onFileSelect && onFileSelect(file)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getFileIcon(file.file_type, 'w-6 h-6 lg:w-8 lg:h-8')}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 mb-2">
                    <h3 className={`font-medium text-sm lg:text-base truncate group-hover:text-blue-600 transition-colors ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`} title={file.filename}>
                      {file.filename}
                    </h3>
                    <span className={`text-xs px-3 py-1 rounded-full flex-shrink-0 ${
                      isDark 
                        ? 'bg-blue-900/40 text-blue-300' 
                        : 'bg-blue-100/80 text-blue-700'
                    }`}>
                      {file.subject}
                    </span>
                  </div>
                  
                  <div className={`flex flex-wrap items-center gap-3 lg:gap-4 text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <span className="flex items-center gap-1">
                      <Archive className="w-3 h-3" />
                      {formatFileSize(file.file_size)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {file.uploaded_username}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(file.upload_date)}
                    </span>
                  </div>
                  
                  {file.description && (
                    <p className={`text-sm mt-2 line-clamp-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`} title={file.description}>
                      {file.description}
                    </p>
                  )}
                </div>

                {/* List View Actions */}
                {!onFileSelect && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(file);
                      }}
                      className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 ${
                        isDark 
                          ? 'bg-green-900/40 hover:bg-green-900/60 text-green-300' 
                          : 'bg-green-100/80 hover:bg-green-200/80 text-green-700'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Preview</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file.file_id, file.filename);
                      }}
                      disabled={downloadingFile === file.file_id}
                      className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDark 
                          ? 'bg-blue-900/40 hover:bg-blue-900/60 text-blue-300' 
                          : 'bg-blue-100/80 hover:bg-blue-200/80 text-blue-700'
                      }`}
                    >
                      {downloadingFile === file.file_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">
                        {downloadingFile === file.file_id ? 'Downloading...' : 'Download'}
                      </span>
                    </button>
                    {file.uploaded_username === username && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.file_id);
                        }}
                        className={`p-2 rounded-xl transition-all hover:scale-105 ${
                          isDark 
                            ? 'bg-red-900/40 hover:bg-red-900/60 text-red-300' 
                            : 'bg-red-100/80 hover:bg-red-200/80 text-red-700'
                        }`}
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={showPreview}
        onClose={handleClosePreview}
        file={previewFile}
        username={username}
        isDark={isDark}
      />
    </div>
  );
};

export default FileDisplayComponent;

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
  AlertCircle
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
      // Use the same getFileUrl query to get the download URL
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
        // For now, show a more user-friendly message
        alert(`Download will be available once file storage is fully implemented.\nFile: ${filename}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(`Download will be available once file storage is fully implemented.\nFile: ${filename}`);
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
      {/* Organization Info */}
      {filesData.orgInfo && (
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <h3 className="font-semibold mb-2">📚 Knowledge Nest - {filesData.orgInfo.org_name}</h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Class: {filesData.orgInfo.class_sec} • Branch: {filesData.orgInfo.branch}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
              isDark
                ? 'bg-gray-800 border-gray-600 focus:border-blue-500'
                : 'bg-white border-gray-300 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters
                ? 'bg-blue-500 text-white'
                : isDark
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* View Mode */}
          <div className={`flex rounded-lg overflow-hidden border ${
            isDark ? 'border-gray-600' : 'border-gray-300'
          }`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : isDark
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : isDark
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Subject</label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className={`w-full p-2 rounded-lg border transition-colors ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500'
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <option value="">All Subjects</option>
                {subjectsData?.subjects?.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Files Count */}
      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} found
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <File className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className="text-lg font-medium mb-2">No files found</h3>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {searchTerm || filterSubject 
              ? 'Try adjusting your search or filters'
              : 'Upload your first file to get started'
            }
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file._id}
              className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              } ${onFileSelect ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''}`}
              onClick={() => onFileSelect && onFileSelect(file)}
            >
              <div className="flex items-center gap-3 mb-3">
                {getFileIcon(file.file_type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatFileSize(file.file_size)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="truncate">{file.subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-500" />
                  <span className="truncate">{file.uploaded_username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-xs">{formatDate(file.upload_date)}</span>
                </div>
              </div>

              {file.description && (
                <p className={`text-xs mt-2 p-2 rounded ${
                  isDark ? 'bg-gray-700' : 'bg-gray-50'
                } line-clamp-2`}>
                  {file.description}
                </p>
              )}

              {!onFileSelect && (
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => handlePreview(file)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                      isDark
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleDownload(file.file_id, file.filename)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                      isDark
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                  {file.uploaded_username === username && (
                    <button
                      onClick={() => handleDelete(file.file_id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
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
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <div
              key={file._id}
              className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              } ${onFileSelect ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''}`}
              onClick={() => onFileSelect && onFileSelect(file)}
            >
              <div className="flex items-center gap-4">
                {getFileIcon(file.file_type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-1">
                    <h3 className="font-medium truncate">{file.filename}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {file.subject}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      {formatFileSize(file.file_size)}
                    </span>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      by {file.uploaded_username}
                    </span>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      {formatDate(file.upload_date)}
                    </span>
                  </div>
                  
                  {file.description && (
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {file.description}
                    </p>
                  )}
                </div>

                {!onFileSelect && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePreview(file)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isDark
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleDownload(file.file_id, file.filename)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isDark
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    {file.uploaded_username === username && (
                      <button
                        onClick={() => handleDelete(file.file_id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
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

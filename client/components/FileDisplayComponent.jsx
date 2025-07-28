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
  Upload
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
      {/* Organization Info */}
      {filesData?.orgInfo && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">📚 Knowledge Nest - {filesData.orgInfo?.org_name || 'Organization'}</h3>
          <p className="text-gray-600 dark:text-gray-400">
                                  Semester: {filesData.orgInfo?.semester || 'N/A'} • Branch: {filesData.orgInfo?.branch || 'N/A'}
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
            className="w-full pl-10 pr-4 py-3 rounded-2xl glass-card border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-2xl transition-all glass-card ${
              showFilters
                ? 'ring-2 ring-blue-500/50 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* View Mode */}
          <div className="flex rounded-2xl overflow-hidden glass-card">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="glass-card rounded-2xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Subject</label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full p-3 rounded-xl glass-card border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-gray-100"
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
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} found
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-16">
          <div className="glass-card rounded-3xl p-12 max-w-md mx-auto">
            <File className="w-20 h-20 mx-auto mb-6 text-gray-400 dark:text-gray-500" />
            <h3 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-300">No files found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || filterSubject 
                ? 'Try adjusting your search or filters'
                : 'Upload your first file to get started'
              }
            </p>
            {!searchTerm && !filterSubject && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-400 text-sm">
                <Upload className="w-4 h-4" />
                Click "Upload Resource" to add files
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file._id}
              className={`glass-card rounded-2xl p-4 transition-all hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] ${
                onFileSelect ? 'cursor-pointer hover:ring-2 hover:ring-blue-500/50' : ''
              }`}
              onClick={() => onFileSelect && onFileSelect(file)}
            >
              <div className="flex items-center gap-3 mb-3">
                {getFileIcon(file.file_type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-gray-900 dark:text-gray-100" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.file_size)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="truncate text-gray-700 dark:text-gray-300">{file.subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-500" />
                  <span className="truncate text-gray-700 dark:text-gray-300">{file.uploaded_username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(file.upload_date)}</span>
                </div>
              </div>

              {file.description && (
                <p className="text-xs mt-2 p-2 rounded-lg glass-card text-gray-600 dark:text-gray-400 line-clamp-2">
                  {file.description}
                </p>
              )}

              {!onFileSelect && (
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => handlePreview(file)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs transition-all bg-green-500/20 hover:bg-green-500/30 text-green-700 dark:text-green-400 hover:scale-105"
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleDownload(file.file_id, file.filename)}
                    disabled={downloadingFile === file.file_id}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs transition-all bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 dark:text-blue-400 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      onClick={() => handleDelete(file.file_id)}
                      className="p-2 rounded-xl transition-all bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-400 hover:scale-105"
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
        <div className="space-y-3">
          {filteredFiles.map((file) => (
            <div
              key={file._id}
              className={`glass-card rounded-2xl p-4 transition-all hover:shadow-lg hover:-translate-y-1 ${
                onFileSelect ? 'cursor-pointer hover:ring-2 hover:ring-blue-500/50' : ''
              }`}
              onClick={() => onFileSelect && onFileSelect(file)}
            >
              <div className="flex items-center gap-4">
                {getFileIcon(file.file_type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-1">
                    <h3 className="font-medium truncate text-gray-900 dark:text-gray-100">{file.filename}</h3>
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400">
                      {file.subject}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.file_size)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      by {file.uploaded_username}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatDate(file.upload_date)}
                    </span>
                  </div>
                  
                  {file.description && (
                    <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                      {file.description}
                    </p>
                  )}
                </div>

                {!onFileSelect && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePreview(file)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all bg-green-500/20 hover:bg-green-500/30 text-green-700 dark:text-green-400 hover:scale-105"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleDownload(file.file_id, file.filename)}
                      disabled={downloadingFile === file.file_id}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 dark:text-blue-400 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingFile === file.file_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {downloadingFile === file.file_id ? 'Downloading...' : 'Download'}
                    </button>
                    {file.uploaded_username === username && (
                      <button
                        onClick={() => handleDelete(file.file_id)}
                        className="p-2 rounded-xl transition-all bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-400 hover:scale-105"
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

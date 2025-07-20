'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { 
  X, 
  Search, 
  Filter, 
  Grid, 
  List,
  File, 
  FileText, 
  Image, 
  FileVideo, 
  Archive,
  Calendar,
  User,
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus
} from 'lucide-react';

const KnowledgeNestFileSelector = ({
  isOpen,
  onClose,
  onSelectFile,
  username,
  isDark = false,
  allowMultiple = false
}) => {
  const [viewMode, setViewMode] = useState('grid');
  const [filterSubject, setFilterSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Reset selections when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([]);
      setSearchTerm('');
      setFilterSubject('');
      setShowFilters(false);
    }
  }, [isOpen]);

  // Fetch files from Knowledge Nest
  const filesData = useQuery(
    api.knowledgeNest.getKnowledgeNestFiles,
    isOpen && username ? {
      username,
      subject: filterSubject || undefined,
    } : "skip"
  );

  // Fetch subjects for filter
  const subjectsData = useQuery(
    api.knowledgeNest.getSubjects,
    isOpen && username ? { username } : "skip"
  );

  const getFileIcon = (fileType, size = 'w-6 h-6') => {
    // Handle undefined, null, or empty fileType
    if (!fileType || typeof fileType !== 'string') {
      return <File className={`${size} text-gray-500`} />;
    }
    
    if (fileType.startsWith('image/')) return <Image className={`${size} text-blue-500`} />;
    if (fileType.startsWith('video/')) return <FileVideo className={`${size} text-purple-500`} />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className={`${size} text-red-500`} />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className={`${size} text-yellow-500`} />;
    return <File className={`${size} text-gray-500`} />;
  };

  const formatFileSize = (bytes) => {
    // Handle undefined, null, or invalid bytes
    if (bytes === undefined || bytes === null || isNaN(bytes)) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    // Handle undefined, null, or invalid timestamp
    if (!timestamp) return 'Unknown date';
    
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Filter files based on search term
  const filteredFiles = filesData?.files?.filter(file => {
    if (!file) return false;
    
    const filename = (file.filename || '').toLowerCase();
    const subject = (file.subject || '').toLowerCase();
    const username = (file.uploaded_username || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return filename.includes(searchLower) ||
           subject.includes(searchLower) ||
           username.includes(searchLower);
  }) || [];

  const handleFileSelect = (file) => {
    if (allowMultiple) {
      setSelectedFiles(prev => {
        const isSelected = prev.some(f => f._id === file._id);
        if (isSelected) {
          return prev.filter(f => f._id !== file._id);
        } else {
          return [...prev, file];
        }
      });
    } else {
      onSelectFile(file);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    if (allowMultiple && selectedFiles.length > 0) {
      onSelectFile(selectedFiles);
      onClose();
    }
  };

  const isFileSelected = (file) => {
    return selectedFiles.some(f => f._id === file._id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto animate-in zoom-in-95 duration-200">
        <div className={`glass-card rounded-2xl sm:rounded-3xl shadow-2xl ${
          isDark ? 'bg-gray-900/95' : 'bg-white/95'
        } backdrop-blur-xl border ${
          isDark ? 'border-gray-700/50' : 'border-gray-200/50'
        } max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden`}>
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/20">
              <div>
                <h3 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  📚 Select from Knowledge Nest
                </h3>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  Choose files to analyze with StudyBuddy
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all ${
                  isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Organization Info */}
            {filesData?.orgInfo && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200/20">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  <div>
                    <h4 className={`font-medium text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {filesData.orgInfo?.org_name || 'Organization'}
                    </h4>
                    <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Class: {filesData.orgInfo?.class_sec || 'N/A'} • Branch: {filesData.orgInfo?.branch || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200/20">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      isDark 
                        ? 'bg-gray-800/50 text-white placeholder-gray-400' 
                        : 'bg-gray-100/50 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  {/* Subject Filter */}
                  {subjectsData?.subjects && subjectsData.subjects.length > 0 && (
                    <select
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                      className={`px-4 py-3 rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        isDark 
                          ? 'bg-gray-800/50 text-white' 
                          : 'bg-gray-100/50 text-gray-900'
                      }`}
                    >
                      <option value="">All Subjects</option>
                      {subjectsData.subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* View Mode */}
                  <div className="flex rounded-2xl overflow-hidden bg-gray-100/50 dark:bg-gray-800/50">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 transition-all ${
                        viewMode === 'grid'
                          ? 'bg-blue-500 text-white'
                          : isDark 
                            ? 'text-gray-400 hover:text-white' 
                            : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 transition-all ${
                        viewMode === 'list'
                          ? 'bg-blue-500 text-white'
                          : isDark 
                            ? 'text-gray-400 hover:text-white' 
                            : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Files Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
              {!filesData ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-2">Loading files...</span>
                </div>
              ) : !filesData.success ? (
                <div className="flex items-center justify-center p-8">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                  <span className="ml-2">{filesData.message}</span>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-12">
                  <File className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                    No files found
                  </h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {searchTerm ? 'Try adjusting your search criteria' : 'No files have been shared yet'}
                  </p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
                  {filteredFiles.map((file) => {
                    // Safety check: ensure file object exists and has required properties
                    if (!file || !file._id) {
                      return null;
                    }
                    
                    return (
                    <div
                      key={file._id}
                      onClick={() => handleFileSelect(file)}
                      className={`relative group cursor-pointer transition-all duration-200 ${
                        viewMode === 'grid'
                          ? 'glass-card rounded-2xl p-4 hover:shadow-lg hover:-translate-y-1'
                          : 'glass-card rounded-xl p-4 hover:shadow-md'
                      } ${
                        allowMultiple && isFileSelected(file)
                          ? 'ring-2 ring-blue-500 shadow-lg'
                          : ''
                      }`}
                    >
                      {/* Selection indicator for multiple selection */}
                      {allowMultiple && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                            isFileSelected(file)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                          } flex items-center justify-center`}>
                            {isFileSelected(file) && (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                      )}

                      {viewMode === 'grid' ? (
                        <div className="text-center">
                          <div className="flex justify-center mb-3">
                            {getFileIcon(file.mimetype, 'w-12 h-12')}
                          </div>
                          <h3 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'} mb-2 line-clamp-2`}>
                            {file.filename || 'Unnamed file'}
                          </h3>
                          <div className="space-y-1 text-xs">
                            <div className={`flex items-center justify-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              <User className="w-3 h-3" />
                              <span>{file.uploaded_username || 'Unknown user'}</span>
                            </div>
                            <div className={`flex items-center justify-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              <BookOpen className="w-3 h-3" />
                              <span>{file.subject || 'No subject'}</span>
                            </div>
                            <div className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              {formatFileSize(file.size)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {getFileIcon(file.mimetype, 'w-8 h-8')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                              {file.filename || 'Unnamed file'}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {file.uploaded_username || 'Unknown user'}
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {file.subject || 'No subject'}
                              </span>
                              <span>{formatFileSize(file.size)}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(file.upload_timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with selection info and actions */}
            {allowMultiple && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200/20">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={onClose}
                      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl transition-all text-sm ${
                        isDark 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmSelection}
                      disabled={selectedFiles.length === 0}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-xl sm:rounded-2xl hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      Add {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default KnowledgeNestFileSelector;

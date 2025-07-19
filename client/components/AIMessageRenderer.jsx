'use client';

import React from 'react';
import { Copy } from 'lucide-react';

const AIMessageRenderer = ({ content, isDark }) => {
  // Split content into blocks (paragraphs, code blocks, etc.)
  const parseContent = (text) => {
    const blocks = [];
    const lines = text.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Handle code blocks (```)
      if (line.trim().startsWith('```')) {
        const language = line.trim().slice(3).trim() || 'text';
        const codeLines = [];
        i++;
        
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        
        blocks.push({
          type: 'code',
          language,
          content: codeLines.join('\n')
        });
        i++; // Skip closing ```
        continue;
      }

      // Handle tables (lines with |)
      if (line.includes('|') && line.trim().length > 0) {
        const tableLines = [];
        let j = i;
        
        while (j < lines.length && lines[j].includes('|') && lines[j].trim().length > 0) {
          tableLines.push(lines[j]);
          j++;
        }
        
        if (tableLines.length >= 2) { // At least header and separator
          blocks.push({
            type: 'table',
            content: tableLines
          });
          i = j;
          continue;
        }
      }

      // Handle lists (-, *, +, or numbered)
      if (line.match(/^\s*[-*+]\s/) || line.match(/^\s*\d+\.\s/)) {
        const listItems = [];
        let j = i;
        const isOrdered = line.match(/^\s*\d+\.\s/);
        
        while (j < lines.length) {
          const currentLine = lines[j];
          if (currentLine.match(/^\s*[-*+]\s/) || currentLine.match(/^\s*\d+\.\s/)) {
            listItems.push(currentLine.replace(/^\s*[-*+]\s/, '').replace(/^\s*\d+\.\s/, ''));
            j++;
          } else if (currentLine.trim() === '') {
            j++;
            if (j < lines.length && (lines[j].match(/^\s*[-*+]\s/) || lines[j].match(/^\s*\d+\.\s/))) {
              continue; // Empty line between list items
            } else {
              break; // End of list
            }
          } else {
            break; // End of list
          }
        }
        
        blocks.push({
          type: 'list',
          ordered: isOrdered,
          items: listItems
        });
        i = j;
        continue;
      }

      // Handle headings (#)
      if (line.match(/^#{1,6}\s/)) {
        const level = line.match(/^#+/)[0].length;
        const text = line.replace(/^#+\s/, '');
        blocks.push({
          type: 'heading',
          level,
          content: text
        });
        i++;
        continue;
      }

      // Handle regular paragraphs
      const paragraphLines = [];
      while (i < lines.length && 
             !lines[i].trim().startsWith('```') &&
             !lines[i].includes('|') &&
             !lines[i].match(/^\s*[-*+]\s/) &&
             !lines[i].match(/^\s*\d+\.\s/) &&
             !lines[i].match(/^#{1,6}\s/)) {
        
        if (lines[i].trim() === '') {
          if (paragraphLines.length > 0) break; // End of paragraph
          i++;
          continue;
        }
        
        paragraphLines.push(lines[i]);
        i++;
      }

      if (paragraphLines.length > 0) {
        blocks.push({
          type: 'paragraph',
          content: paragraphLines.join('\n')
        });
      }
    }

    return blocks;
  };

  // Format inline text (bold, italic, inline code, links)
  const formatInlineText = (text) => {
    if (!text) return text;

    // Split by various patterns while preserving them (including URLs)
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|__[^_]+__|_[^_]+_|https?:\/\/[^\s]+)/g);
    
    return parts.map((part, index) => {
      // Bold (**text** or __text__)
      if (part.match(/^\*\*.*\*\*$/) || part.match(/^__.*__$/)) {
        const text = part.slice(2, -2);
        return (
          <strong key={index} className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {text}
          </strong>
        );
      }
      
      // Italic (*text* or _text_)
      if (part.match(/^\*[^*]+\*$/) || part.match(/^_[^_]+_$/)) {
        const text = part.slice(1, -1);
        return (
          <em key={index} className={`italic font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
            {text}
          </em>
        );
      }
      
      // Inline code (`text`)
      if (part.match(/^`[^`]+`$/)) {
        const code = part.slice(1, -1);
        return (
          <code 
            key={index} 
            className={`px-2 py-1 mx-0.5 rounded-md text-sm font-mono font-medium border ${
              isDark 
                ? 'bg-gray-800 text-orange-300 border-gray-700' 
                : 'bg-gray-100 text-orange-600 border-gray-200'
            }`}
          >
            {code}
          </code>
        );
      }
      
      // Links ([text](url))
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const isExternalLink = linkMatch[2].startsWith('http');
        const domain = isExternalLink ? new URL(linkMatch[2]).hostname : null;
        
        return (
          <a 
            key={index} 
            href={linkMatch[2]} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`group inline-flex items-center gap-1.5 font-medium transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'text-blue-400 hover:text-blue-300' 
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            <span className={`relative px-2 py-1 rounded-lg transition-all duration-300 ${
              isDark 
                ? 'bg-blue-500/10 group-hover:bg-blue-500/20 border border-blue-500/20 group-hover:border-blue-500/40' 
                : 'bg-blue-50 group-hover:bg-blue-100 border border-blue-200 group-hover:border-blue-300'
            }`}>
              <span className="relative z-10">{linkMatch[1]}</span>
              <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                isDark ? 'bg-gradient-to-r from-blue-500/5 to-indigo-500/5' : 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50'
              }`}></div>
            </span>
            <svg 
              className={`w-3.5 h-3.5 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                isDark ? 'text-blue-400' : 'text-blue-500'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {domain && (
              <span className={`text-xs opacity-60 group-hover:opacity-80 transition-opacity ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {domain}
              </span>
            )}
          </a>
        );
      }

      // Detect plain URLs (http/https)
      const urlMatch = part.match(/^(https?:\/\/[^\s]+)$/);
      if (urlMatch) {
        const url = urlMatch[1];
        let domain = '';
        try {
          domain = new URL(url).hostname;
        } catch (e) {
          domain = url;
        }
        
        return (
          <a 
            key={index} 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`group inline-flex items-center gap-2 font-medium transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'text-emerald-400 hover:text-emerald-300' 
                : 'text-emerald-600 hover:text-emerald-700'
            }`}
          >
            <span className={`relative px-3 py-1.5 rounded-lg transition-all duration-300 ${
              isDark 
                ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20 border border-emerald-500/20 group-hover:border-emerald-500/40' 
                : 'bg-emerald-50 group-hover:bg-emerald-100 border border-emerald-200 group-hover:border-emerald-300'
            }`}>
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1m0 0l4-4a4 4 0 105.656-5.656l-1.1 1.102m-3.56 3.56l-4 4" />
                </svg>
                <span className="font-mono text-sm">{domain}</span>
              </span>
              <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                isDark ? 'bg-gradient-to-r from-emerald-500/5 to-teal-500/5' : 'bg-gradient-to-r from-emerald-50/50 to-teal-50/50'
              }`}></div>
            </span>
            <svg 
              className={`w-3.5 h-3.5 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                isDark ? 'text-emerald-400' : 'text-emerald-500'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        );
      }

      // Detect inline URLs (when URLs are captured by the regex)
      if (part.match(/^https?:\/\/[^\s]+$/)) {
        const url = part;
        let domain = '';
        try {
          domain = new URL(url).hostname;
        } catch (e) {
          domain = url;
        }
        
        return (
          <a 
            key={index} 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`group inline-flex items-center gap-1 font-medium transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'text-cyan-400 hover:text-cyan-300' 
                : 'text-cyan-600 hover:text-cyan-700'
            }`}
          >
            <span className={`relative px-2 py-0.5 rounded transition-all duration-300 ${
              isDark 
                ? 'bg-cyan-500/10 group-hover:bg-cyan-500/20 border border-cyan-500/20 group-hover:border-cyan-500/40' 
                : 'bg-cyan-50 group-hover:bg-cyan-100 border border-cyan-200 group-hover:border-cyan-300'
            }`}>
              <span className="relative z-10 flex items-center gap-1 text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1m0 0l4-4a4 4 0 105.656-5.656l-1.1 1.102m-3.56 3.56l-4 4" />
                </svg>
                <span className="font-mono">{domain}</span>
              </span>
              <div className={`absolute inset-0 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                isDark ? 'bg-gradient-to-r from-cyan-500/5 to-blue-500/5' : 'bg-gradient-to-r from-cyan-50/50 to-blue-50/50'
              }`}></div>
            </span>
            <svg 
              className={`w-3 h-3 transition-all duration-300 group-hover:translate-x-0.5 ${
                isDark ? 'text-cyan-400' : 'text-cyan-500'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        );
      }
      
      return part;
    });
  };

  // Simple syntax highlighting for common languages
  const highlightCode = (code, language, isDark) => {
    if (!code) return code;
    
    const keywords = {
      javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'async', 'await'],
      python: ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'with', 'as'],
      java: ['public', 'private', 'class', 'interface', 'extends', 'implements', 'return', 'if', 'else', 'for', 'while', 'try', 'catch'],
      html: ['<!DOCTYPE', '<html>', '<head>', '<body>', '<div>', '<span>', '<p>', '<a>', '<img>'],
      css: ['color:', 'background:', 'margin:', 'padding:', 'font-size:', 'display:', 'position:', 'width:', 'height:']
    };

    const colors = {
      keyword: isDark ? '#ec4899' : '#f472b6',
      string: isDark ? '#10b981' : '#059669', 
      comment: isDark ? '#6b7280' : '#9ca3af',
      number: isDark ? '#f59e0b' : '#d97706'
    };

    const strings = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
    const comments = /\/\*[\s\S]*?\*\/|\/\/.*$/gm;
    const numbers = /\b\d+\.?\d*\b/g;
    
    let highlightedCode = code;
    
    // Highlight strings
    highlightedCode = highlightedCode.replace(strings, 
      `<span style="color: ${colors.string}; font-weight: 500;">$&</span>`
    );
    
    // Highlight comments
    highlightedCode = highlightedCode.replace(comments, 
      `<span style="color: ${colors.comment}; font-style: italic;">$&</span>`
    );
    
    // Highlight numbers
    highlightedCode = highlightedCode.replace(numbers, 
      `<span style="color: ${colors.number}; font-weight: 600;">$&</span>`
    );
    
    // Highlight keywords for specific language
    if (keywords[language?.toLowerCase()]) {
      keywords[language.toLowerCase()].forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        highlightedCode = highlightedCode.replace(regex, 
          `<span style="color: ${colors.keyword}; font-weight: 700;">${keyword}</span>`
        );
      });
    }
    
    return highlightedCode;
  };

  // Copy code to clipboard
  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  // Render different block types
  const renderBlock = (block, index) => {
    switch (block.type) {
      case 'code':
        return (
          <div key={index} className="my-4">
            <div className={`rounded-xl overflow-hidden border shadow-sm ${
              isDark 
                ? 'border-gray-600 bg-gray-900/95 shadow-black/30' 
                : 'border-gray-200 bg-gray-50 shadow-gray-100'
            }`}>
              {/* Code header */}
              <div className={`flex items-center justify-between px-4 py-3 border-b ${
                isDark 
                  ? 'bg-gray-800/90 border-gray-600' 
                  : 'bg-gray-100 border-gray-200'
              }`}>
                <div className={`text-xs font-semibold tracking-wide uppercase ${
                  isDark ? 'text-gray-200' : 'text-gray-600'
                }`}>
                  {block.language}
                </div>
                <button
                  onClick={() => copyCode(block.content)}
                  className={`text-xs font-medium transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:scale-105 ${
                    isDark 
                      ? 'text-gray-200 hover:text-white hover:bg-gray-700/80 border border-gray-600' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              {/* Code content */}
              <pre className="p-4 overflow-x-auto text-sm leading-relaxed bg-transparent">
                <code 
                  className={`font-mono font-medium block ${isDark ? 'text-gray-100' : 'text-gray-800'}`}
                  dangerouslySetInnerHTML={{ 
                    __html: highlightCode(block.content, block.language, isDark) 
                  }}
                />
              </pre>
            </div>
          </div>
        );

      case 'table':
        const [header, separator, ...rows] = block.content;
        const headerCells = header.split('|').map(cell => cell.trim()).filter(cell => cell);
        const dataRows = rows.map(row => 
          row.split('|').map(cell => cell.trim()).filter(cell => cell)
        );

        return (
          <div key={index} className="my-4 overflow-x-auto">
            <div className={`rounded-xl border shadow-sm ${
              isDark ? 'border-gray-600 shadow-black/30' : 'border-gray-200 shadow-gray-100'
            }`}>
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className={isDark ? 'bg-gray-800/90' : 'bg-gray-50'}>
                    {headerCells.map((cell, i) => (
                      <th 
                        key={i} 
                        className={`px-4 py-3 text-left text-sm font-semibold border-b ${
                          isDark 
                            ? 'border-gray-600 text-gray-100' 
                            : 'border-gray-200 text-gray-900'
                        } ${i > 0 ? (isDark ? 'border-l border-gray-600' : 'border-l border-gray-200') : ''}`}
                      >
                        {formatInlineText(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className={`transition-colors ${
                      rowIndex % 2 === 0 
                        ? (isDark ? 'bg-gray-900/80' : 'bg-white')
                        : (isDark ? 'bg-gray-800/60' : 'bg-gray-50/50')
                    } hover:${isDark ? 'bg-gray-700/50' : 'bg-gray-100/70'}`}>
                      {row.map((cell, cellIndex) => (
                        <td 
                          key={cellIndex} 
                          className={`px-4 py-3 text-sm font-medium ${
                            isDark 
                              ? 'text-gray-100' 
                              : 'text-gray-700'
                          } ${cellIndex > 0 ? (isDark ? 'border-l border-gray-600' : 'border-l border-gray-200') : ''}`}
                        >
                          {formatInlineText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'list':
        const ListTag = block.ordered ? 'ol' : 'ul';
        return (
          <div key={index} className="my-3">
            <ListTag className={`${
              block.ordered ? 'list-decimal' : 'list-disc'
            } list-inside space-y-2 pl-1 ${
              isDark ? 'text-gray-200' : 'text-gray-800'
            }`}>
              {block.items.map((item, i) => (
                <li key={i} className="text-sm sm:text-base leading-relaxed font-medium">
                  <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>
                    {formatInlineText(item)}
                  </span>
                </li>
              ))}
            </ListTag>
          </div>
        );

      case 'heading':
        const HeadingTag = `h${Math.min(block.level, 6)}`;
        const headingClasses = {
          1: 'text-xl sm:text-2xl font-bold mb-4 mt-6',
          2: 'text-lg sm:text-xl font-bold mb-3 mt-5',
          3: 'text-base sm:text-lg font-semibold mb-3 mt-4',
          4: 'text-sm sm:text-base font-semibold mb-2 mt-3',
          5: 'text-sm font-semibold mb-2 mt-3',
          6: 'text-xs sm:text-sm font-semibold mb-2 mt-2'
        };

        return React.createElement(
          HeadingTag,
          {
            key: index,
            className: `${headingClasses[block.level]} ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            } tracking-tight`
          },
          formatInlineText(block.content)
        );

      case 'paragraph':
        if (!block.content.trim()) return null;
        
        return (
          <div key={index} className="my-3">
            <p className={`text-sm sm:text-base leading-relaxed font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-800'
            }`}>
              {formatInlineText(block.content)}
            </p>
          </div>
        );

      default:
        return (
          <div key={index} className="my-3">
            <p className={`text-sm sm:text-base leading-relaxed font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-800'
            }`}>
              {formatInlineText(block.content)}
            </p>
          </div>
        );
    }
  };

  const blocks = parseContent(content);

  return (
    <div className="ai-message-content">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
};

export default AIMessageRenderer;

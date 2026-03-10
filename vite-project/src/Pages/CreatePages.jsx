import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "./lib/axios";

const CreatePages = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const navigate = useNavigate();

  // Auto-focus on title when page loads
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Markdown shortcuts handler
  const handleContentChange = (e) => {
    let value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Check for markdown patterns at the start of a new line
    const lines = value.split('\n');
    const currentLineIndex = value.substring(0, cursorPosition).split('\n').length - 1;
    const currentLine = lines[currentLineIndex];
    
    // Auto-format markdown shortcuts
    if (currentLine.startsWith('# ')) {
      // Header 1
      lines[currentLineIndex] = currentLine.replace('# ', '');
      e.target.style.fontSize = '2em';
      e.target.style.fontWeight = '700';
    } else if (currentLine.startsWith('## ')) {
      // Header 2
      lines[currentLineIndex] = currentLine.replace('## ', '');
      e.target.style.fontSize = '1.5em';
      e.target.style.fontWeight = '600';
    } else if (currentLine.startsWith('- ') || currentLine.startsWith('* ')) {
      // Bullet list (keep as is, just visual feedback)
    }
    
    setContent(value);
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast.error("Please add a title");
      titleRef.current?.focus();
      return;
    }
    
    if (!content.trim()) {
      toast.error("Please add some content");
      contentRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      await api.post("/notes", {
        title: title.trim(),
        content: content.trim()
      });
      
      toast.success("Note created successfully! ✨");
      navigate("/");
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = (e) => {
    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSubmit();
    }
    // Cmd/Ctrl + Escape to close
    if ((e.metaKey || e.ctrlKey) && e.key === 'Escape') {
      e.preventDefault();
      navigate("/");
    }
  };

  return (
    <div 
      className="min-h-screen bg-white"
      onKeyDown={handleKeyDown}
    >
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="text-sm font-medium">Close</span>
          </button>

          {/* Right */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {title || content ? "Unsaved changes" : "Start writing..."}
            </span>
            <button
              onClick={handleSubmit}
              disabled={loading || !title.trim() || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Note
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="pt-14">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Title Input */}
          <input
            ref={titleRef}
            type="text"
            placeholder="Untitled"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-5xl font-bold text-gray-900 placeholder-gray-300 outline-none border-none bg-transparent mb-4"
            style={{ caretColor: '#6366f1' }}
          />

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />

          {/* Content Textarea */}
          <textarea
            ref={contentRef}
            placeholder="Start writing... (Try typing '# ' for a heading or '- ' for a list)"
            value={content}
            onChange={handleContentChange}
            className="w-full min-h-[60vh] text-lg text-gray-700 placeholder-gray-400 outline-none border-none bg-transparent resize-none leading-relaxed"
            style={{ 
              caretColor: '#6366f1',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}
          />

          {/* Helper Text */}
          {!title && !content && (
            <div className="mt-8 text-sm text-gray-400 space-y-2">
              <p>✨ <strong>Tip:</strong> Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Cmd/Ctrl + S</kbd> to save</p>
              <p>📝 <strong>Markdown shortcuts:</strong></p>
              <ul className="ml-6 space-y-1">
                <li>• Type <code className="px-1 bg-gray-100 rounded"># </code> for a large heading</li>
                <li>• Type <code className="px-1 bg-gray-100 rounded">## </code> for a medium heading</li>
                <li>• Type <code className="px-1 bg-gray-100 rounded">- </code> or <code className="px-1 bg-gray-100 rounded">* </code> for a bullet list</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePages;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from './lib/axios';
import toast from 'react-hot-toast';
import { X, Trash2, Loader2, Clock, Check } from 'lucide-react';

const NoteDetailPage = () => {
  const [note, setNote] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams();
  const saveTimeoutRef = useRef(null);
  const titleRef = useRef(null);

  // Fetch note
  useEffect(() => {
    const fetchNote = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/notes/${id}`);
        const payload = res.data?.data || res.data;
        setNote(payload && typeof payload === 'object' ? payload : { title: "", content: "" });
        setLastSaved(new Date());
      } catch (error) {
        console.error("Error fetching note:", error);
        toast.error("Failed to load note");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id, navigate]);

  // Auto-save function
  const autoSave = React.useCallback(async (updatedNote) => {
    if (!updatedNote.title.trim() || !updatedNote.content.trim()) {
      return;
    }

    setSaving(true);
    try {
      await api.put(`/notes/${id}`, updatedNote);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Auto-save failed:", error);
      toast.error("Auto-save failed");
    } finally {
      setSaving(false);
    }
  }, [id]);

  // Debounced auto-save
  useEffect(() => {
    if (!loading && hasUnsavedChanges) {
      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save (2 seconds after user stops typing)
      saveTimeoutRef.current = setTimeout(() => {
        autoSave(note);
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [autoSave, note, hasUnsavedChanges, loading]);

  // Handle title change
  const handleTitleChange = (e) => {
    setNote({ ...note, title: e.target.value });
    setHasUnsavedChanges(true);
  };

  // Handle content change
  const handleContentChange = (e) => {
    setNote({ ...note, content: e.target.value });
    setHasUnsavedChanges(true);
  };

  // Delete note
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this note? This action cannot be undone.")) return;

    try {
      await api.delete(`/notes/${id}`);
      toast.success("Note deleted successfully");
      navigate("/");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  // Manual save
  const handleManualSave = async () => {
    await autoSave(note);
    toast.success("Saved! ✨");
  };

  // Keyboard shortcuts
  const handleKeyDown = (e) => {
    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleManualSave();
    }
  };

  // Format last saved time
  const getLastSavedText = () => {
    if (!lastSaved) return "Not saved";
    
    const seconds = Math.floor((new Date() - lastSaved) / 1000);
    
    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading your note...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" onKeyDown={handleKeyDown}>
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

          {/* Center - Save Status */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {saving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <Clock className="w-3 h-3" />
                <span>Unsaved changes</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-green-500" />
                <span>Saved {getLastSavedText()}</span>
              </>
            )}
          </div>

          {/* Right */}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
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
            value={note.title}
            onChange={handleTitleChange}
            className="w-full text-5xl font-bold text-gray-900 placeholder-gray-300 outline-none border-none bg-transparent mb-4"
            style={{ caretColor: '#6366f1' }}
          />

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />

          {/* Content Textarea */}
          <textarea
            placeholder="Start writing..."
            value={note.content}
            onChange={handleContentChange}
            className="w-full min-h-[60vh] text-lg text-gray-700 placeholder-gray-400 outline-none border-none bg-transparent resize-none leading-relaxed"
            style={{
              caretColor: '#6366f1',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default NoteDetailPage;

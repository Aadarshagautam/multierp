import React, { useState, useEffect, useContext } from "react";
import { Plus, Search, Grid3x3, List, SortAsc } from "lucide-react";
import { toast } from "react-hot-toast";
import NoteCard from "./NoteCard";
import api from "./lib/axios";
import NotesNotFound from "./NotesNotFound";
import AppContext from "../context/app-context.js";
import { Link } from "react-router-dom";

const HomePages = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const { isLoggedin } = useContext(AppContext);

  useEffect(() => {
    if (isLoggedin) {
      fetchNotes();
    }
  }, [isLoggedin]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notes");
      const payload = res.data?.data;
      setNotes(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const safeNotes = Array.isArray(notes) ? notes : [];
  const filteredNotes = safeNotes
    .filter(note =>
      (note?.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note?.content || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });

  if (!isLoggedin) {
    return (
      <div className="lg:ml-64 min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your notes</h2>
          <Link to="/login" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:ml-64 min-h-screen bg-gray-50">
      {/* Simple Clean Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                My Notes
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {safeNotes.length} total notes
              </p>
            </div>
            <Link
              to="/create"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              New Note
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
            </select>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2.5 ${viewMode === "grid" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2.5 border-l ${viewMode === "list" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Content */}
      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          searchTerm ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try searching with different keywords</p>
            </div>
          ) : (
            <NotesNotFound />
          )
        ) : (
          <div className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          }>
            {filteredNotes.map((note) => (
              <NoteCard key={note._id} note={note} setNotes={setNotes} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePages;

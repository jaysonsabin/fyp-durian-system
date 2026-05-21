"use client";

import { useState, useEffect } from "react";
import { BookOpen, FileText, Video, ExternalLink, Search, X } from "lucide-react";
import { useAuth } from "../context/auth_context";

import {
  fetchLibraryContents,
  logLibraryInteraction,
} from "./services";

export default function Library() {
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await fetchLibraryContents();
        if (mounted) setContents(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const handleResourceClick = async (content) => {
    if (!content.media_url) {
      alert("No file linked to this resource.");
      return;
    }

    // UX first
    window.open(content.media_url, "_blank");

    const farmerId = user?.id || "guest";

    logLibraryInteraction({
      content_id: content.content_id,
      farmer_id: farmerId,
      interaction_type: "Viewed",
    }).catch((err) => {
      console.error("Interaction log failed:", err);
    });
  };

  const categories = ["All", ...new Set(contents.map((item) => item.category).filter(Boolean))];

  const filteredContents = contents.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.published_by?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Container */}
      <div className="flex items-center justify-between h-14 relative">
        {!isSearchOpen ? (
          <div className="animate-in fade-in duration-200">
            <h3 className="text-xl font-extrabold text-gray-800">eLibrary</h3>
            <p className="text-xs text-gray-500">Official guidelines and resources</p>
          </div>
        ) : (
          <div className="flex-1 mr-2 animate-in slide-in-from-right-4 duration-200">
            <input
              type="text"
              autoFocus
              placeholder="Search guides, videos, titles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white px-4 py-2 text-sm text-gray-800 rounded-full border border-gray-200 shadow-sm outline-none focus:border-green-500 transition-all"
            />
          </div>
        )}

        {/* Toggle Search Button */}
        <button
          onClick={() => {
            setIsSearchOpen(!isSearchOpen);
            if (isSearchOpen) setSearchTerm(""); // Clear search when closing
          }}
          className={`w-10 h-10 rounded-full shadow-sm flex items-center justify-center flex-shrink-0 transition-all ${
            isSearchOpen 
              ? "bg-gray-100 text-gray-500 hover:bg-gray-200" 
              : "bg-white text-gray-400 hover:text-green-600"
          }`}
        >
          {isSearchOpen ? <X size={18} /> : <Search size={20} />}
        </button>
      </div>

      {/* Category Pills (Hidden while loading or if data array is empty) */}
      {!isLoading && contents.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 no-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-all whitespace-nowrap shadow-sm ${
                selectedCategory === category
                  ? "bg-green-600 border-green-600 text-white"
                  : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Resources Content Feed */}
      <div className="space-y-4 pb-20">
        {isLoading ? (
          <div className="text-center text-gray-400 py-10 font-bold animate-pulse">
            Loading resources...
          </div>
        ) : filteredContents.length === 0 ? (
          <EmptyState isFiltering={searchTerm !== "" || selectedCategory !== "All"} />
        ) : (
          filteredContents.map((item) => (
            <LibraryCard
              key={item.content_id}
              item={item}
              onClick={handleResourceClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState({ isFiltering }) {
  return (
    <div className="text-center text-gray-400 py-12 bg-white rounded-3xl border border-dashed border-gray-200 px-4">
      <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
      <p className="font-bold text-gray-700">
        {isFiltering ? "No matching results found" : "No resources available"}
      </p>
      <p className="text-xs mt-1 max-w-xs mx-auto">
        {isFiltering 
          ? "Try adjusting your keywords or clearing your category filters." 
          : "Check back later for newly published guides and media links!"}
      </p>
    </div>
  );
}

function LibraryCard({ item, onClick }) {
  const isVideo = item.type?.toLowerCase() === "video";

  // Safeguard date parsing to ensure any invalid payload values don't crash rendering
  const renderDate = (dateString) => {
    if (!dateString) return "Recent";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Recent"
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div
      className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex gap-4 transition-all hover:shadow-md cursor-pointer"
      onClick={() => onClick(item)}
    >
      {/* Dynamic Type Icon Container */}
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          isVideo ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
        }`}
      >
        {isVideo ? <Video size={24} /> : <FileText size={24} />}
      </div>

      {/* Item Meta & Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[10px] font-extrabold text-green-600 uppercase tracking-wider truncate">
            {item.category || "General"}
          </span>

          <span className="text-[10px] text-gray-400 flex-shrink-0">
            {renderDate(item.date_published)}
          </span>
        </div>

        <h4 className="font-bold text-gray-800 leading-tight mt-1 break-words">
          {item.title}
        </h4>

        {item.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 break-words">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-md max-w-[150px] truncate">
            By {item.published_by || "System"}
          </span>

          <span className="text-[10px] font-semibold text-blue-500 bg-blue-50 px-2 py-1 rounded-md">
            {item.interactions?.length || 0} Views
          </span>
        </div>
      </div>

      {/* External Action Indicator */}
      <div className="flex items-center text-gray-300 self-center pl-1">
        <ExternalLink size={18} />
      </div>
    </div>
  );
}
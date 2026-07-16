"use client";

import { useState, useEffect } from "react";
import { BookOpen, FileText, Video, ExternalLink, Search, X, Heart, Bookmark, Download, Edit2, Trash2, Plus } from "lucide-react";
import { useAuth } from "@/app/context/auth_context";
import CustomSelect from "@/app/components/custom-select";
import { useLanguage } from "@/app/context/language_context";

const resourceTypeOptions = [
  { value: "PDF", label: "PDF Guide"},
  { value: "Video", label: "Video Tutorial"}
];

import {
  fetchLibraryContents,
  logLibraryInteraction,
  deleteLibraryInteraction,
  uploadLibraryContent,
  updateLibraryContent,
  deleteLibraryContent,
} from "@/services/library";

export default function Library() {
  const { t } = useLanguage();
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { user } = useAuth();
  const isAdmin = user?.role === "Pentadbir";

  // Admin Resource Manager modal & form states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("PDF");
  const [formCategory, setFormCategory] = useState("General");
  const [formDescription, setFormDescription] = useState("");
  const [formMediaUrl, setFormMediaUrl] = useState("");
  const [formPublishedBy, setFormPublishedBy] = useState("");

  const resetForm = () => {
    setFormTitle("");
    setFormType("PDF");
    setFormCategory("General");
    setFormDescription("");
    setFormMediaUrl("");
    setFormPublishedBy("");
  };

  const handleOpenUpload = () => {
    resetForm();
    setShowUploadModal(true);
  };

  const handleOpenEdit = (content, e) => {
    e.stopPropagation();
    setEditingResource(content);
    setFormTitle(content.title || "");
    setFormType(content.type || "PDF");
    setFormCategory(content.category || "General");
    setFormDescription(content.description || "");
    setFormMediaUrl(content.media_url || "");
    setFormPublishedBy(content.published_by || "");
  };

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
      alert(t('no_file_linked'));
      return;
    }

    // UX first
    window.open(content.media_url, "_blank");

    if (!user || user.role === "Pentadbir") return;

    logLibraryInteraction({
      content_id: content.content_id,
      farmer_id: user.id,
      interaction_type: "Viewed",
    }).then((newInteraction) => {
      setContents(prev => prev.map(item => {
        if (item.content_id === content.content_id) {
          return {
            ...item,
            interactions: [...(item.interactions || []), newInteraction]
          };
        }
        return item;
      }));
    }).catch((err) => {
      console.error("Interaction log failed:", err);
    });
  };

  const handleToggleLike = async (content, e) => {
    e.stopPropagation();
    if (!user) return;
    if (user.role === "Pentadbir") {
      alert(t('admin_like_alert'));
      return;
    }

    const isLiked = content.interactions?.some(
      (i) => i.interaction_type === "Liked" && i.farmer_id === user.id
    );

    try {
      if (isLiked) {
        await deleteLibraryInteraction({
          content_id: content.content_id,
          farmer_id: user.id,
          interaction_type: "Liked"
        });
        setContents(prev => prev.map(item => {
          if (item.content_id === content.content_id) {
            return {
              ...item,
              interactions: (item.interactions || []).filter(
                i => !(i.interaction_type === "Liked" && i.farmer_id === user.id)
              )
            };
          }
          return item;
        }));
      } else {
        const newInteraction = await logLibraryInteraction({
          content_id: content.content_id,
          farmer_id: user.id,
          interaction_type: "Liked"
        });
        setContents(prev => prev.map(item => {
          if (item.content_id === content.content_id) {
            return {
              ...item,
              interactions: [...(item.interactions || []), newInteraction]
            };
          }
          return item;
        }));
      }
    } catch (err) {
      console.error("Like toggle failed:", err);
    }
  };

  const handleToggleBookmark = async (content, e) => {
    e.stopPropagation();
    if (!user) return;
    if (user.role === "Pentadbir") {
      alert(t('admin_bookmark_alert'));
      return;
    }

    const isBookmarked = content.interactions?.some(
      (i) => i.interaction_type === "Bookmarked" && i.farmer_id === user.id
    );

    try {
      if (isBookmarked) {
        await deleteLibraryInteraction({
          content_id: content.content_id,
          farmer_id: user.id,
          interaction_type: "Bookmarked"
        });
        setContents(prev => prev.map(item => {
          if (item.content_id === content.content_id) {
            return {
              ...item,
              interactions: (item.interactions || []).filter(
                i => !(i.interaction_type === "Bookmarked" && i.farmer_id === user.id)
              )
            };
          }
          return item;
        }));
      } else {
        const newInteraction = await logLibraryInteraction({
          content_id: content.content_id,
          farmer_id: user.id,
          interaction_type: "Bookmarked"
        });
        setContents(prev => prev.map(item => {
          if (item.content_id === content.content_id) {
            return {
              ...item,
              interactions: [...(item.interactions || []), newInteraction]
            };
          }
          return item;
        }));
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    }
  };

  const handleDownload = async (content, e) => {
    e.stopPropagation();
    if (!content.media_url) {
      alert(t('no_file_linked'));
      return;
    }

    // Trigger download using link download attribute
    const link = document.createElement("a");
    link.href = content.media_url;
    link.setAttribute("download", content.title || "resource");
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (!user || user.role === "Pentadbir") return;

    try {
      const newInteraction = await logLibraryInteraction({
        content_id: content.content_id,
        farmer_id: user.id,
        interaction_type: "Downloaded"
      });
      setContents(prev => prev.map(item => {
        if (item.content_id === content.content_id) {
          return {
            ...item,
            interactions: [...(item.interactions || []), newInteraction]
          };
        }
        return item;
      }));
    } catch (err) {
      console.error("Download log failed:", err);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await uploadLibraryContent({
        title: formTitle,
        type: formType,
        category: formCategory,
        description: formDescription,
        media_url: formMediaUrl,
        published_by: formPublishedBy || "DurianFlow Admin",
      });
      
      setShowUploadModal(false);
      resetForm();
      const data = await fetchLibraryContents();
      setContents(data);
      alert(t('resource_uploaded'));
    } catch (err) {
      console.error(err);
      alert(t('resource_upload_failed'));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!user || !editingResource) return;
    try {
      await updateLibraryContent(editingResource.content_id, {
        title: formTitle,
        type: formType,
        category: formCategory,
        description: formDescription,
        media_url: formMediaUrl,
        published_by: formPublishedBy || "DurianFlow Admin",
      });
      
      setEditingResource(null);
      resetForm();
      const data = await fetchLibraryContents();
      setContents(data);
      alert(t('resource_updated'));
    } catch (err) {
      console.error(err);
      alert(t('resource_update_failed'));
    }
  };

  const handleDeleteResource = async (contentId, e) => {
    e.stopPropagation();
    if (!user) return;
    if (window.confirm(t('confirm_delete_resource'))) {
      try {
        await deleteLibraryContent(contentId);
        const data = await fetchLibraryContents();
        setContents(data);
        alert(t('resource_deleted'));
      } catch (err) {
        console.error(err);
        alert(t('resource_delete_failed'));
      }
    }
  };

  const translateCategory = (cat) => {
    if (cat === "All") return t('tag_all');
    if (cat === "General") return t('tag_general');
    if (cat === "Fertilizer") return t('tag_fertilizer');
    if (cat === "Soil") return t('tag_soil');
    return cat;
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

  const translatedResourceTypeOptions = resourceTypeOptions.map(opt => {
    let label = opt.label;
    if (opt.value === "PDF") label = t('pdf_guide');
    else if (opt.value === "Video") label = t('video_tutorial');
    return { ...opt, label };
  });

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Container */}
      <div className="flex items-center justify-between h-14 relative">
        {!isSearchOpen ? (
          <div className="animate-in fade-in duration-200">
            <h3 className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">{t('elibrary_title')}</h3>
            <p className="text-xs text-gray-500 mt-1">{t('elibrary_subtitle')}</p>
          </div>
        ) : (
          <div className="flex-1 mr-2 animate-in slide-in-from-right-4 duration-200">
            <input
              type="text"
              autoFocus
              placeholder={t('search_resources')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white px-4 py-2.5 text-sm text-gray-800 rounded-lg border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 transition-all"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Upload Resource Button */}
          {isAdmin && !isSearchOpen && (
            <button
              onClick={handleOpenUpload}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-green-600/10 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>{t('upload')}</span>
            </button>
          )}

          {/* Toggle Search Button */}
          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setSearchTerm(""); // Clear search when closing
            }}
            aria-label={isSearchOpen ? t('close') : t('search_resources')}
            className={`w-10 h-10 rounded-full shadow-sm flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
              isSearchOpen
                ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                : "bg-white text-gray-500 hover:text-green-600"
            }`}
          >
            {isSearchOpen ? <X size={18} /> : <Search size={20} />}
          </button>
        </div>
      </div>

      {/* Category Pills (Hidden while loading or if data array is empty) */}
      {!isLoading && contents.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 no-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === category
                  ? "bg-green-600 border-green-600 text-white shadow-sm shadow-green-600/10"
                  : "bg-white border-gray-100 text-gray-500 hover:text-green-600 hover:bg-green-50/30"
              }`}
            >
              {translateCategory(category)}
            </button>
          ))}
        </div>
      )}

      {/* Resources Content Feed */}
      <div className="space-y-4 pb-20">
        {isLoading ? (
          <div className="text-center text-gray-500 py-10 font-bold animate-pulse">
            {t('loading_resources')}
          </div>
        ) : filteredContents.length === 0 ? (
          <EmptyState isFiltering={searchTerm !== "" || selectedCategory !== "All"} />
        ) : (
          filteredContents.map((item) => (
            <LibraryCard
              key={item.content_id}
              item={item}
              userId={user?.id}
              onLike={(e) => handleToggleLike(item, e)}
              onBookmark={(e) => handleToggleBookmark(item, e)}
              onDownload={(e) => handleDownload(item, e)}
              onClick={handleResourceClick}
              isAdmin={isAdmin}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteResource}
            />
          ))
        )}
      </div>

      {/* Upload/Edit Modal */}
      {(showUploadModal || editingResource) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">
                {showUploadModal ? t('upload_resource') : t('edit_resource')}
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setEditingResource(null);
                }}
                aria-label={t('close')}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={showUploadModal ? handleUploadSubmit : handleEditSubmit} className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">{t('discussion_title') || "Title"}</label>
                <input
                  type="text"
                  placeholder={t('title_placeholder')}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">{t('type_label')}</label>
                  <CustomSelect 
                    name="form_type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    options={translatedResourceTypeOptions}
                    buttonClassName="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white cursor-pointer flex items-center justify-between text-left"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">{t('category_label')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Soil, Fertilizer..."
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">{t('description_label')}</label>
                <textarea 
                  placeholder={t('description_label') + "..."}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows="3"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">{t('media_url_label')}</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formMediaUrl}
                  onChange={(e) => setFormMediaUrl(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">{t('publisher_label')}</label>
                <input
                  type="text"
                  placeholder="e.g. MARDI, Department of Agriculture..."
                  value={formPublishedBy}
                  onChange={(e) => setFormPublishedBy(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setEditingResource(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 py-2.5 text-xs font-bold shadow-md shadow-green-600/10 active:scale-95 transition-all cursor-pointer"
                >
                  {showUploadModal ? t('upload_resource_btn') : t('save_changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ isFiltering }) {
  const { t } = useLanguage();
  return (
    <div className="text-center text-gray-500 py-12 bg-white rounded-lg border border-dashed border-gray-200 px-4">
      <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
      <p className="font-bold text-gray-700">
        {isFiltering ? t('no_matching_results') : t('no_resources_available')}
      </p>
      <p className="text-xs mt-1 max-w-xs mx-auto">
        {isFiltering 
          ? t('empty_filtering_desc') 
          : t('empty_no_resources_desc')}
      </p>
    </div>
  );
}

function LibraryCard({ item, userId, onLike, onBookmark, onDownload, onClick, isAdmin, onEdit, onDelete }) {
  const { t } = useLanguage();
  const isVideo = item.type?.toLowerCase() === "video";

  // Safeguard date parsing to ensure any invalid payload values don't crash rendering
  const renderDate = (dateString) => {
    if (!dateString) return "Recent";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Recent"
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const translateCategory = (cat) => {
    if (cat === "General") return t('tag_general');
    if (cat === "Fertilizer") return t('tag_fertilizer');
    if (cat === "Soil") return t('tag_soil');
    return cat;
  };

  const interactions = item.interactions || [];
  const likes = interactions.filter((i) => i.interaction_type === "Liked");
  const bookmarks = interactions.filter((i) => i.interaction_type === "Bookmarked");
  const downloads = interactions.filter((i) => i.interaction_type === "Downloaded");
  const views = interactions.filter((i) => i.interaction_type === "Viewed");

  const isLiked = likes.some((i) => i.farmer_id === userId);
  const isBookmarked = bookmarks.some((i) => i.farmer_id === userId);

  return (
    <div
      className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex gap-4 transition-all hover:shadow-md cursor-pointer"
      onClick={() => onClick(item)}
    >
      {/* Dynamic Type Icon Container */}
      <div
        className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isVideo ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
        }`}
      >
        {isVideo ? <Video size={24} /> : <FileText size={24} />}
      </div>

      {/* Item Meta & Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider truncate">
            {translateCategory(item.category || "General")}
          </span>

          <span className="text-[10px] text-gray-500 flex-shrink-0">
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

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-md max-w-[120px] truncate">
              {t('by_label')} {item.published_by || "System"}
            </span>

            <span className="text-[10px] font-semibold text-blue-500 bg-blue-50 px-2 py-1 rounded-md">
              {views.length} {t('views_count')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Like button */}
            <button
              onClick={onLike}
              aria-label="Like"
              className={`flex items-center gap-1 p-2 rounded-lg transition-all transform active:scale-95 cursor-pointer ${
                isLiked 
                  ? "text-red-500 bg-red-50" 
                  : "text-gray-500 hover:text-red-500 hover:bg-red-50"
              }`}
            >
              <Heart size={16} className={isLiked ? "fill-red-500 text-red-500" : ""} />
              <span className="text-xs font-bold">{likes.length}</span>
            </button>

            {/* Bookmark button */}
            <button
              onClick={onBookmark}
              aria-label="Bookmark"
              className={`flex items-center p-2 rounded-lg transition-all transform active:scale-95 cursor-pointer ${
                isBookmarked 
                  ? "text-green-600 bg-green-50" 
                  : "text-gray-500 hover:text-green-600 hover:bg-green-50"
              }`}
            >
              <Bookmark size={16} className={isBookmarked ? "fill-green-600 text-green-600" : ""} />
            </button>

            {/* Download button */}
            <button
              onClick={onDownload}
              aria-label="Download"
              className="flex items-center gap-1 p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all transform active:scale-95 cursor-pointer"
            >
              <Download size={16} />
              <span className="text-xs font-bold">{downloads.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* External Action / Admin Moderation Indicator */}
      <div className="flex items-center gap-2 self-center pl-1" onClick={(e) => e.stopPropagation()}>
        {isAdmin ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => onEdit(item, e)}
              className="p-2 bg-gray-50 text-blue-500 border border-blue-100 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
              aria-label="Edit Resource"
              title="Edit Resource"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => onDelete(item.content_id, e)}
              className="p-2 bg-gray-50 text-red-500 border border-red-100 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              aria-label="Delete Resource"
              title="Delete Resource"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <div className="text-gray-300">
            <ExternalLink size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
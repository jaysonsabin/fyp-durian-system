"use client";

import { useState, useEffect } from 'react';
import { 
  MessageSquare, Search, Heart, Send, Sparkles, PlusCircle, 
  AlertTriangle, Edit2, Trash2, Check, X, Image, Lock, Unlock, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '@/app/context/auth_context';
import { useLanguage } from '@/app/context/language_context';
import CustomSelect from '@/app/components/custom-select';
import { uploadForumImage } from '@/services/storage';

const forumTagOptions = [
  { value: "General", label: "General"},
  { value: "Fertilizer", label: "Fertilizer"},
  { value: "Pest Alert", label: "Pest Alert"},
  { value: "Market Price", label: "Market Price"}
];

import {
  fetchForumPosts,
  createForumPost,
  updateForumPost,
  deleteForumPost,
  toggleForumReaction,
  createForumReply,
  updateForumReply,
  deleteForumReply,
  lockForumPost,
  hideForumPost
} from '@/services/forum';

export default function Forum() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Pentadbir';
  const { t } = useLanguage();

  const translatedTagOptions = forumTagOptions.map(opt => {
    let label = opt.label;
    if (opt.value === "General") label = t('tag_general');
    else if (opt.value === "Fertilizer") label = t('tag_fertilizer');
    else if (opt.value === "Pest Alert") label = t('tag_pest_alert');
    else if (opt.value === "Market Price") label = t('tag_market_price');
    return { ...opt, label };
  });

  // Feed states
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  // New Post form states
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTag, setNewPostTag] = useState("General");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Edit Post modal states
  const [editingPost, setEditingPost] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTag, setEditTag] = useState("General");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editSelectedFile, setEditSelectedFile] = useState(null);
  const [isSavingPost, setIsSavingPost] = useState(false);

  // Replies states
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [replyText, setReplyText] = useState({}); // postId -> text string
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyText, setEditReplyText] = useState("");

  // Load posts from API
  const loadPosts = async () => {
    try {
      const data = await fetchForumPosts(searchTerm, selectedTag, user?.token);
      setPosts(data);
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [searchTerm, selectedTag, user]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() || !newPostTitle.trim()) return;
    if (!user) return;

    setIsPosting(true);
    let finalImageUrl = null;
    if (selectedFile) {
      setIsUploadingImage(true);
      try {
        finalImageUrl = await uploadForumImage(selectedFile);
      } catch (err) {
        console.error("Image upload failed:", err);
        alert(t('alert_failed_upload_image') + err.message);
        setIsPosting(false);
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    try {
      await createForumPost({
        title: newPostTitle,
        content: newPostContent,
        tag: newPostTag,
        image_url: finalImageUrl
      }, user.token);
      setNewPostTitle("");
      setNewPostContent("");
      setSelectedFile(null);
      setNewPostTag("General");
      loadPosts();
    } catch (err) {
      console.error("Create post failed:", err);
      alert(t('alert_failed_publish'));
    } finally {
      setIsPosting(false);
    }
  };

  const handleStartEditPost = (post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditTag(post.tag);
    setEditImageUrl(post.image_url || "");
    setEditSelectedFile(null);
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditSelectedFile(null);
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;
    if (!user) return;

    setIsSavingPost(true);
    try {
      let finalImageUrl = editImageUrl.trim() || null;
      if (editSelectedFile) {
        finalImageUrl = await uploadForumImage(editSelectedFile);
      }
      await updateForumPost(editingPost.post_id, {
        title: editTitle,
        content: editContent,
        tag: editTag,
        image_url: finalImageUrl
      }, user.token);
      setEditingPost(null);
      setEditSelectedFile(null);
      loadPosts();
    } catch (err) {
      console.error("Failed to update post:", err);
      alert(t('alert_failed_update_post') + err.message);
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!user) return;
    const confirmDelete = window.confirm(t('confirm_delete_post'));
    if (confirmDelete) {
      try {
        await deleteForumPost(postId, user.token);
        loadPosts();
      } catch (err) {
        console.error("Failed to delete post:", err);
        alert(t('alert_failed_delete_post'));
      }
    }
  };

  const handleLike = async (postId, e) => {
    e.stopPropagation();
    if (!user) {
      alert(t('alert_login_to_react'));
      return;
    }

    // Keep a copy of the previous state in case we need to roll back
    const previousPosts = [...posts];

    // Optimistically update local state immediately (0ms latency)
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.post_id === postId) {
        const reactions = p.reactions || [];
        const userLikeIndex = reactions.findIndex(r => r.user_id === user.id && r.reaction_type === "Like");
        
        let updatedReactions;
        if (userLikeIndex !== -1) {
          // Unlike: Remove the reaction locally
          updatedReactions = reactions.filter((_, idx) => idx !== userLikeIndex);
        } else {
          // Like: Add a temporary reaction object locally
          updatedReactions = [...reactions, { reaction_id: Date.now(), post_id: postId, user_id: user.id, reaction_type: "Like" }];
        }
        return { ...p, reactions: updatedReactions };
      }
      return p;
    }));

    try {
      // Call API in background
      const result = await toggleForumReaction(postId, "Like", user.token);
      
      // Update the temporary ID with the real ID from the server response
      if (result && result.reaction_id) {
        setPosts(prevPosts => prevPosts.map(p => {
          if (p.post_id === postId) {
            const reactions = p.reactions || [];
            const updatedReactions = reactions.map(r => 
              (r.user_id === user.id && r.reaction_type === "Like" && r.reaction_id > 1000000000000)
                ? { ...r, reaction_id: result.reaction_id }
                : r
            );
            return { ...p, reactions: updatedReactions };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error("Like action failed:", err);
      // Rollback to original state on error
      setPosts(previousPosts);
      alert(t('alert_failed_to_react') || "Failed to submit reaction.");
    }
  };

  const handleCreateReply = async (postId) => {
    const text = replyText[postId] || "";
    if (!text.trim() || !user) return;

    try {
      await createForumReply(postId, { reply_content: text }, user.token);
      setReplyText(prev => ({ ...prev, [postId]: "" }));
      loadPosts();
    } catch (err) {
      console.error("Create reply failed:", err);
      alert(t('alert_failed_post_reply'));
    }
  };

  const handleSaveReply = async (replyId) => {
    if (!editReplyText.trim() || !user) return;

    try {
      await updateForumReply(replyId, { reply_content: editReplyText }, user.token);
      setEditingReplyId(null);
      setEditReplyText("");
      loadPosts();
    } catch (err) {
      console.error("Failed to update reply:", err);
      alert(t('alert_failed_update_reply'));
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!user) return;
    if (window.confirm(t('confirm_delete_reply'))) {
      try {
        await deleteForumReply(replyId, user.token);
        loadPosts();
      } catch (err) {
        console.error("Failed to delete reply:", err);
        alert(t('alert_failed_delete_reply'));
      }
    }
  };

  const handleLockPost = async (postId) => {
    if (!user) return;
    try {
      await lockForumPost(postId, user.token);
      loadPosts();
    } catch (err) {
      console.error("Lock/unlock action failed:", err);
      alert(t('alert_failed_lock_post'));
    }
  };

  const handleHidePost = async (postId) => {
    if (!user) return;
    try {
      await hideForumPost(postId, user.token);
      loadPosts();
    } catch (err) {
      console.error("Hide/unhide action failed:", err);
      alert(t('alert_failed_hide_post'));
    }
  };

  const formatRole = (userObj) => {
    if (!userObj) return t('grower');
    return userObj.role === "Pentadbir" ? t('admin_status') : t('grower');
  };

  const roleBadgeStyle = (userObj) => {
    if (!userObj) return "bg-gray-100 text-gray-500 border border-gray-200";
    if (userObj.role === "Pentadbir") {
      return "bg-red-50 text-red-600 border border-red-100";
    }
    return "bg-green-50 text-green-700 border border-green-100";
  };

  const renderDate = (dateString) => {
    if (!dateString) return "Recent";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Recent"
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const tags = ["All", "Fertilizer", "Pest Alert", "Market Price", "General"];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      
      {/* Forum Header Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 rounded-[32px] text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-8 -translate-y-8 blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg leading-tight">{t('forum')}</h3>
            <p className="text-[11px] text-green-100 font-semibold uppercase tracking-wider">{t('community_hub')}</p>
          </div>
        </div>
      </div>

      {/* Write New Post Form (Only show to authenticated users) */}
      {user ? (
        <form onSubmit={handleCreatePost} className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 space-y-3.5">
          <div className="space-y-2">
            <input
              type="text"
              placeholder={t('title_placeholder')}
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
            />
            <textarea 
              placeholder={t('content_placeholder')}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows="3"
              required
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all resize-none"
            ></textarea>
            {selectedFile && (
              <div className="relative inline-block mt-2 rounded-2xl overflow-hidden border border-gray-200 shadow-sm max-w-xs animate-in fade-in duration-200">
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Selected preview" 
                  className="h-32 w-auto object-cover rounded-2xl" 
                />
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors cursor-pointer"
                  title={t('remove_image')}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full text-xs text-gray-500 border border-gray-200">
                <span className="font-bold">{t('tag_label')}</span>
                <CustomSelect 
                  name="new_post_tag"
                  value={newPostTag}
                  onChange={(e) => setNewPostTag(e.target.value)}
                  options={translatedTagOptions}
                  buttonClassName="bg-transparent outline-none font-bold text-green-700 cursor-pointer flex items-center gap-1 text-xs"
                  chevronSize={12}
                  containerClassName="inline-block"
                  menuClassName="absolute left-0 mt-2 w-40 bg-white border border-gray-100 rounded-2xl shadow-xl z-[150] py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 thin-scrollbar"
                />
              </div>

              <label 
                htmlFor="new-post-image-upload" 
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold border border-gray-200 cursor-pointer transition-colors active:scale-95 duration-150"
              >
                <Image size={12} className="text-gray-500" />
                <span>{t('attach_image')}</span>
              </label>
              <input
                id="new-post-image-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isPosting || isUploadingImage || !newPostContent.trim() || !newPostTitle.trim()}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white rounded-2xl px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-green-600/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPosting || isUploadingImage ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>{isUploadingImage ? t('uploading') : t('posting')}</span>
                </>
              ) : (
                <>
                  <Send size={12} />
                  <span>{t('post_button')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-green-50 p-6 rounded-[28px] text-center border border-green-100 space-y-2">
          <Sparkles size={28} className="text-green-600 mx-auto" />
          <h4 className="font-bold text-green-800">{t('join_community')}</h4>
          <p className="text-xs text-green-600 max-w-sm mx-auto">{t('login_to_post')}</p>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="space-y-3">
        <div className="relative">
          <input 
            type="text" 
            placeholder={t('search_discussions')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white px-5 py-3.5 pl-11 text-sm text-gray-800 rounded-2xl border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-green-500/25 transition-all"
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Categories tag pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-2 px-2">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-1.5 text-xs font-black rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                selectedTag === tag 
                  ? "bg-green-600 border-green-600 text-white shadow-sm shadow-green-600/10" 
                  : "bg-white border-gray-100 text-gray-400 hover:text-green-600 hover:bg-green-50/30"
              }`}
            >
              {tag === "All" ? t('tag_all') :
               tag === "General" ? t('tag_general') :
               tag === "Fertilizer" ? t('tag_fertilizer') :
               tag === "Pest Alert" ? t('tag_pest_alert') :
               tag === "Market Price" ? t('tag_market_price') : tag}
            </button>
          ))}
        </div>
      </div>

      {/* Post Feeds */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400 font-bold animate-pulse">
            {t('loading_discussions')}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 px-4">
            <AlertTriangle size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="font-bold text-gray-700">{t('no_discussions')}</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              {t('no_discussions_desc')}
            </p>
          </div>
        ) : (
          posts.map(post => {
            const likes = post.reactions?.filter(r => r.reaction_type === "Like") || [];
            const hasLiked = user && likes.some(r => Number(r.user_id) === Number(user.id));
            const isOwner = user && Number(post.user_id) === Number(user.id);
            const isPostExpanded = expandedPostId === post.post_id;
            const isHidden = post.status === "Hidden";
            const isLocked = post.status === "Locked";

            return (
              <div 
                key={post.post_id} 
                className={`bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 space-y-3.5 hover:shadow-md transition-shadow ${
                  isHidden ? "opacity-60 border-purple-100 bg-purple-50/5" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 text-white font-black text-sm flex items-center justify-center uppercase shadow-inner flex-shrink-0">
                      {(post.user?.full_name || post.user?.username || "G").charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-xs leading-none">{post.user?.full_name || post.user?.username}</h4>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${roleBadgeStyle(post.user)}`}>
                        {formatRole(post.user)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-medium">{renderDate(post.created_at)}</span>
                    
                    {/* Admin Moderation Buttons */}
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 pl-2">
                        <button
                          onClick={() => handleLockPost(post.post_id)}
                          className={`transition-colors p-1 cursor-pointer ${isLocked ? "text-amber-500 hover:text-amber-600" : "text-gray-400 hover:text-amber-500"}`}
                          title={isLocked ? t('unlock_post') : t('lock_post')}
                        >
                          {isLocked ? <Unlock size={13} /> : <Lock size={13} />}
                        </button>
                        <button
                          onClick={() => handleHidePost(post.post_id)}
                          className={`transition-colors p-1 cursor-pointer ${isHidden ? "text-purple-500 hover:text-purple-600" : "text-gray-400 hover:text-purple-500"}`}
                          title={isHidden ? t('unhide_post') : t('hide_post')}
                        >
                          {isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.post_id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                          title={t('delete_post_moderator')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}

                    {/* Standard Owner Buttons */}
                    {isOwner && !isAdmin && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          onClick={() => handleStartEditPost(post)}
                          className="text-gray-400 hover:text-blue-500 transition-colors p-1 cursor-pointer"
                          title={t('edit_post')}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.post_id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                          title={t('delete_post')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                    {isOwner && isAdmin && (
                      <div className="flex items-center gap-1.5 ml-1">
                        <button
                          onClick={() => handleStartEditPost(post)}
                          className="text-gray-400 hover:text-blue-500 transition-colors p-1 cursor-pointer"
                          title={t('edit_post')}
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold text-gray-800 text-sm">{post.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed font-normal whitespace-pre-wrap">{post.content}</p>
                  
                  {post.image_url && (
                    <div className="relative rounded-2xl overflow-hidden max-h-[400px] mt-2 border border-gray-100 bg-gray-50/50 flex items-center justify-center shadow-inner">
                      <img src={post.image_url} alt={post.title} className="max-h-[400px] w-full object-contain rounded-2xl" />
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center border-t border-gray-50 pt-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                      post.tag === "Pest Alert" ? "bg-red-50 text-red-600" :
                      post.tag === "Fertilizer" ? "bg-blue-50 text-blue-600" :
                      post.tag === "Market Price" ? "bg-amber-50 text-amber-600" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {post.tag === "General" ? t('tag_general') :
                       post.tag === "Fertilizer" ? t('tag_fertilizer') :
                       post.tag === "Pest Alert" ? t('tag_pest_alert') :
                       post.tag === "Market Price" ? t('tag_market_price') : post.tag}
                    </span>

                    {isLocked && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-md animate-pulse">
                        <Lock size={10} /> {t('locked')}
                      </span>
                    )}

                    {isHidden && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase bg-purple-50 text-purple-600 px-2.5 py-0.5 rounded-md">
                        <EyeOff size={10} /> {t('hidden_content')}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-4">
                    {/* Like button */}
                    <button 
                      onClick={(e) => handleLike(post.post_id, e)}
                      className={`flex items-center gap-1 text-[11px] font-bold transition-all transform active:scale-95 cursor-pointer ${
                        hasLiked ? 'text-red-500 font-extrabold' : 'text-gray-400 hover:text-red-400'
                      }`}
                    >
                      <Heart size={14} className={hasLiked ? 'fill-red-500 text-red-500' : ''} />
                      <span>{likes.length}</span>
                    </button>
                    
                    {/* Replies count button */}
                    <button
                      onClick={() => setExpandedPostId(isPostExpanded ? null : post.post_id)}
                      className={`flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors ${
                        isPostExpanded ? 'text-green-600' : 'text-gray-400 hover:text-green-600'
                      }`}
                    >
                      <MessageSquare size={14} />
                      <span>{post.replies?.length || 0}</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Replies Section */}
                {isPostExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h5 className="text-xs font-extrabold text-gray-700">{t('replies_count')} ({post.replies?.length || 0})</h5>
                    
                    {/* Replies List */}
                    <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar pr-1">
                      {(!post.replies || post.replies.length === 0) ? (
                        <p className="text-xs text-gray-400 italic">{t('no_replies')}</p>
                      ) : (
                        post.replies.map(reply => {
                          const isEditingReply = editingReplyId === reply.reply_id;
                          const isReplyOwner = user && Number(reply.user_id) === Number(user.id);
                          return (
                            <div key={reply.reply_id} className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50 flex gap-3 items-start">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 text-white font-black text-xs flex items-center justify-center uppercase flex-shrink-0">
                                {(reply.user?.full_name || reply.user?.username || "U").charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <span className="font-bold text-gray-800 text-[11px]">{reply.user?.full_name || reply.user?.username}</span>
                                    <span className="text-[9px] text-gray-400 ml-2 font-semibold">({formatRole(reply.user)})</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-gray-400">{renderDate(reply.replied_at)}</span>
                                    {isReplyOwner && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => {
                                            setEditingReplyId(reply.reply_id);
                                            setEditReplyText(reply.reply_content);
                                          }}
                                          className="text-gray-400 hover:text-blue-500 p-0.5 cursor-pointer"
                                          title="Edit Reply"
                                        >
                                          <Edit2 size={10} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteReply(reply.reply_id)}
                                          className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer"
                                          title="Delete Reply"
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {isEditingReply ? (
                                  <div className="mt-2 flex gap-2">
                                    <input
                                      type="text"
                                      value={editReplyText}
                                      onChange={(e) => setEditReplyText(e.target.value)}
                                      className="flex-1 p-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-xs font-semibold text-gray-700"
                                    />
                                    <button
                                      onClick={() => handleSaveReply(reply.reply_id)}
                                      className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors cursor-pointer"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      onClick={() => setEditingReplyId(null)}
                                      className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-600 mt-1 break-words leading-relaxed">{reply.reply_content}</p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Add Reply Input */}
                    {isLocked && !isAdmin ? (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 p-3 rounded-2xl text-[10px] font-bold text-amber-700">
                        <Lock size={12} className="text-amber-500 flex-shrink-0" />
                        <span>{t('locked_post')}</span>
                      </div>
                    ) : user ? (
                      <div className="flex gap-2 items-center pt-2">
                        <input
                          type="text"
                          placeholder={t('write_reply')}
                          value={replyText[post.post_id] || ""}
                          onChange={(e) => setReplyText({ ...replyText, [post.post_id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateReply(post.post_id);
                          }}
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                        />
                        <button
                          onClick={() => handleCreateReply(post.post_id)}
                          disabled={!(replyText[post.post_id] || "").trim()}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-2 rounded-xl active:scale-95 transition-all shadow-md shadow-green-600/10 cursor-pointer"
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 italic">{t('login_to_reply')}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit Post Modal Overlay */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-lg text-gray-800">{t('edit_discussion')}</h3>
              <button 
                onClick={handleCancelEdit}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSavePost} className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">{t('discussion_title')}</label>
                <input
                  type="text"
                  placeholder={t('title_placeholder')}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">{t('discussion_body')}</label>
                <textarea 
                  placeholder={t('content_placeholder')}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows="4"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">{t('discussion_image')}</label>
                
                {editSelectedFile ? (
                  <div className="relative inline-block mt-1 rounded-2xl overflow-hidden border border-gray-200 shadow-sm max-w-xs animate-in fade-in duration-200">
                    <img 
                      src={URL.createObjectURL(editSelectedFile)} 
                      alt="New selected preview" 
                      className="h-32 w-auto object-cover rounded-2xl" 
                    />
                    <button
                      type="button"
                      onClick={() => setEditSelectedFile(null)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors cursor-pointer"
                      title={t('remove_image')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : editImageUrl ? (
                  <div className="relative inline-block mt-1 rounded-2xl overflow-hidden border border-gray-200 shadow-sm max-w-xs">
                    <img 
                      src={editImageUrl} 
                      alt="Existing discussion image" 
                      className="h-32 w-auto object-cover rounded-2xl" 
                    />
                    <button
                      type="button"
                      onClick={() => setEditImageUrl("")}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors cursor-pointer shadow-md"
                      title={t('remove_image')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label 
                      htmlFor="edit-post-image-upload" 
                      className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-200 cursor-pointer transition-colors active:scale-95 duration-150"
                    >
                      <Image size={14} className="text-gray-500" />
                      <span>{t('choose_library_image')}</span>
                    </label>
                    <input
                      id="edit-post-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setEditSelectedFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full text-xs text-gray-500 border border-gray-200">
                  <span className="font-bold">{t('tag_label')}</span>
                  <CustomSelect 
                    name="edit_tag"
                    value={editTag}
                    onChange={(e) => setEditTag(e.target.value)}
                    options={translatedTagOptions}
                    buttonClassName="bg-transparent outline-none font-bold text-green-700 cursor-pointer flex items-center gap-1 text-xs"
                    chevronSize={12}
                    containerClassName="inline-block"
                    menuClassName="absolute left-0 mt-2 w-40 bg-white border border-gray-100 rounded-2xl shadow-xl z-[150] py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 thin-scrollbar"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSavingPost || !editTitle.trim() || !editContent.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow-md shadow-green-600/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                  >
                    {isSavingPost ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>{t('saving')}</span>
                      </>
                    ) : (
                      <span>{t('save_changes')}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

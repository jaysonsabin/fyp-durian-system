"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  MessageSquare, Search, Heart, Send, Sparkles, PlusCircle,
  AlertTriangle, Edit2, Trash2, Check, X, Image, Lock, Unlock, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '@/app/context/auth_context';
import { useLanguage } from '@/app/context/language_context';
import CustomSelect from '@/app/components/custom-select';
import { uploadForumImage } from '@/services/storage';
import { useToasts, ToastStack } from '@/app/components/toast';
import ConfirmDialog from '@/app/components/confirm-dialog';
import { compressImage, MAX_IMAGE_SIZE_MB } from '@/utils/image_utils';

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

const SEARCH_DEBOUNCE_MS = 350;
const POSTS_PER_PAGE = 10;
const CONTENT_CLAMP_THRESHOLD = 300;

function PostSkeleton() {
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-gray-200 rounded-full" />
          <div className="h-2.5 w-16 bg-gray-100 rounded-full" />
        </div>
      </div>
      <div className="h-3.5 w-2/3 bg-gray-200 rounded-full" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-100 rounded-full" />
        <div className="h-3 w-5/6 bg-gray-100 rounded-full" />
      </div>
      <div className="flex justify-between pt-3 border-t border-gray-50">
        <div className="h-4 w-16 bg-gray-100 rounded-md" />
        <div className="h-4 w-20 bg-gray-100 rounded-md" />
      </div>
    </div>
  );
}

export default function Forum() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Pentadbir';
  const { t, language } = useLanguage();
  const locale = language === 'ms' ? 'ms' : 'en';

  const translatedTagOptions = forumTagOptions.map(opt => {
    let label = opt.label;
    if (opt.value === "General") label = t('tag_general');
    else if (opt.value === "Fertilizer") label = t('tag_fertilizer');
    else if (opt.value === "Pest Alert") label = t('tag_pest_alert');
    else if (opt.value === "Market Price") label = t('tag_market_price');
    return { ...opt, label };
  });

  const tagLabel = (tag) =>
    tag === "All" ? t('tag_all') :
    tag === "General" ? t('tag_general') :
    tag === "Fertilizer" ? t('tag_fertilizer') :
    tag === "Pest Alert" ? t('tag_pest_alert') :
    tag === "Market Price" ? t('tag_market_price') : tag;

  // Feed states
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);      // first load -> skeletons
  const [isFetching, setIsFetching] = useState(false);   // any in-flight fetch -> search spinner
  const [loadError, setLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [expandedContentIds, setExpandedContentIds] = useState(new Set());

  // New Post form states
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTag, setNewPostTag] = useState("General");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const composerTitleRef = useRef(null);

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
  const [replyingPostId, setReplyingPostId] = useState(null);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyText, setEditReplyText] = useState("");

  // UI feedback states
  const { toasts, showToast, dismissToast } = useToasts();
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm }
  const [isConfirmBusy, setIsConfirmBusy] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Object URLs for image previews (revoked on change/unmount to avoid leaks)
  const newPostPreviewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile]
  );
  useEffect(() => () => { if (newPostPreviewUrl) URL.revokeObjectURL(newPostPreviewUrl); }, [newPostPreviewUrl]);

  const editPreviewUrl = useMemo(
    () => (editSelectedFile ? URL.createObjectURL(editSelectedFile) : null),
    [editSelectedFile]
  );
  useEffect(() => () => { if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl); }, [editPreviewUrl]);

  // Debounce search input so we don't fire an API call per keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadPosts = useCallback(async () => {
    setIsFetching(true);
    try {
      const data = await fetchForumPosts(debouncedSearch, selectedTag, user?.token);
      setPosts(data);
      setLoadError(false);
    } catch (err) {
      console.error("Error loading posts:", err);
      setLoadError(true);
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedTag, user]);

  useEffect(() => {
    setVisibleCount(POSTS_PER_PAGE);
    loadPosts();
  }, [loadPosts]);

  const isSearching = searchTerm !== debouncedSearch || (isFetching && !isLoading);

  // Helpers to update a single post/reply in local state (no full feed reloads)
  const replacePost = (updatedPost) => {
    setPosts(prev => prev.map(p => (p.post_id === updatedPost.post_id ? { ...p, ...updatedPost } : p)));
  };

  const updatePostReplies = (postId, updater) => {
    setPosts(prev => prev.map(p =>
      p.post_id === postId ? { ...p, replies: updater(p.replies || []) } : p
    ));
  };

  const handleSelectImage = async (file, setFile) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      showToast(t('image_too_large'), "error");
      return;
    }
    setFile(await compressImage(file));
  };

  const handleOpenComposer = () => {
    setIsComposerOpen(true);
    setTimeout(() => composerTitleRef.current?.focus(), 50);
  };

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
        showToast(t('alert_failed_upload_image') + err.message, "error");
        setIsPosting(false);
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    try {
      const created = await createForumPost({
        title: newPostTitle,
        content: newPostContent,
        tag: newPostTag,
        image_url: finalImageUrl
      }, user.token);
      setNewPostTitle("");
      setNewPostContent("");
      setSelectedFile(null);
      setNewPostTag("General");
      setIsComposerOpen(false);
      // API returns the full post (incl. user) — prepend it locally
      if (created?.post_id) {
        setPosts(prev => [{ replies: [], reactions: [], ...created }, ...prev]);
      } else {
        loadPosts();
      }
      showToast(t('toast_post_published'));
    } catch (err) {
      console.error("Create post failed:", err);
      showToast(t('alert_failed_publish'), "error");
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
      const updated = await updateForumPost(editingPost.post_id, {
        title: editTitle,
        content: editContent,
        tag: editTag,
        image_url: finalImageUrl
      }, user.token);
      setEditingPost(null);
      setEditSelectedFile(null);
      if (updated?.post_id) replacePost(updated);
      else loadPosts();
      showToast(t('toast_post_updated'));
    } catch (err) {
      console.error("Failed to update post:", err);
      showToast(t('alert_failed_update_post') + err.message, "error");
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeletePost = (postId) => {
    if (!user) return;
    setConfirmDialog({
      title: t('delete_post'),
      message: t('confirm_delete_post'),
      onConfirm: async () => {
        setIsConfirmBusy(true);
        try {
          await deleteForumPost(postId, user.token);
          setPosts(prev => prev.filter(p => p.post_id !== postId));
          showToast(t('toast_post_deleted'));
        } catch (err) {
          console.error("Failed to delete post:", err);
          showToast(t('alert_failed_delete_post'), "error");
        } finally {
          setIsConfirmBusy(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleLike = async (postId, e) => {
    e.stopPropagation();
    if (!user) {
      showToast(t('alert_login_to_react'), "error");
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
      showToast(t('alert_failed_to_react'), "error");
    }
  };

  const handleCreateReply = async (postId) => {
    const text = replyText[postId] || "";
    if (!text.trim() || !user || replyingPostId === postId) return;

    setReplyingPostId(postId);
    try {
      const created = await createForumReply(postId, { reply_content: text }, user.token);
      setReplyText(prev => ({ ...prev, [postId]: "" }));
      // API returns the full reply (incl. user) — append it locally
      if (created?.reply_id) {
        updatePostReplies(postId, replies => [...replies, created]);
      } else {
        loadPosts();
      }
      showToast(t('toast_reply_posted'));
    } catch (err) {
      console.error("Create reply failed:", err);
      showToast(t('alert_failed_post_reply'), "error");
    } finally {
      setReplyingPostId(null);
    }
  };

  const handleSaveReply = async (postId, replyId) => {
    if (!editReplyText.trim() || !user) return;

    try {
      const updated = await updateForumReply(replyId, { reply_content: editReplyText }, user.token);
      setEditingReplyId(null);
      setEditReplyText("");
      if (updated?.reply_id) {
        updatePostReplies(postId, replies => replies.map(r => (r.reply_id === replyId ? { ...r, ...updated } : r)));
      } else {
        loadPosts();
      }
      showToast(t('toast_reply_updated'));
    } catch (err) {
      console.error("Failed to update reply:", err);
      showToast(t('alert_failed_update_reply'), "error");
    }
  };

  const handleDeleteReply = (postId, replyId) => {
    if (!user) return;
    setConfirmDialog({
      title: t('delete_reply'),
      message: t('confirm_delete_reply'),
      onConfirm: async () => {
        setIsConfirmBusy(true);
        try {
          await deleteForumReply(replyId, user.token);
          updatePostReplies(postId, replies => replies.filter(r => r.reply_id !== replyId));
          showToast(t('toast_reply_deleted'));
        } catch (err) {
          console.error("Failed to delete reply:", err);
          showToast(t('alert_failed_delete_reply'), "error");
        } finally {
          setIsConfirmBusy(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleLockPost = async (postId) => {
    if (!user) return;
    try {
      const updated = await lockForumPost(postId, user.token);
      if (updated?.post_id) {
        replacePost(updated);
        showToast(updated.status === "Locked" ? t('toast_post_locked') : t('toast_post_unlocked'));
      } else {
        loadPosts();
      }
    } catch (err) {
      console.error("Lock/unlock action failed:", err);
      showToast(t('alert_failed_lock_post'), "error");
    }
  };

  const handleHidePost = async (postId) => {
    if (!user) return;
    try {
      const updated = await hideForumPost(postId, user.token);
      if (updated?.post_id) {
        replacePost(updated);
        showToast(updated.status === "Hidden" ? t('toast_post_hidden') : t('toast_post_unhidden'));
      } else {
        loadPosts();
      }
    } catch (err) {
      console.error("Hide/unhide action failed:", err);
      showToast(t('alert_failed_hide_post'), "error");
    }
  };

  const toggleContentExpanded = (postId) => {
    setExpandedContentIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
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

  // Relative, locale-aware timestamps ("5 min ago" / "5 min lalu")
  const renderDate = (dateString) => {
    if (!dateString) return t('just_now');
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return t('just_now');

    const diffSeconds = Math.max(0, (Date.now() - date.getTime()) / 1000);
    try {
      if (diffSeconds < 60) return t('just_now');
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
      if (diffSeconds < 3600) return rtf.format(-Math.floor(diffSeconds / 60), "minute");
      if (diffSeconds < 86400) return rtf.format(-Math.floor(diffSeconds / 3600), "hour");
      if (diffSeconds < 604800) return rtf.format(-Math.floor(diffSeconds / 86400), "day");
    } catch {
      // Intl.RelativeTimeFormat unavailable — fall through to absolute date
    }
    return date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
  };

  const tags = ["All", "Fertilizer", "Pest Alert", "Market Price", "General"];
  const visiblePosts = posts.slice(0, visibleCount);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">

      {/* Forum Header Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 rounded-lg text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-8 -translate-y-8 blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">{t('forum')}</h3>
            <p className="text-[11px] text-green-100 font-semibold uppercase tracking-wider">{t('community_hub')}</p>
          </div>
        </div>
      </div>

      {/* Write New Post (collapsed trigger / expanded form) */}
      {user ? (
        !isComposerOpen ? (
          <button
            onClick={handleOpenComposer}
            className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3 text-left hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 text-white font-bold text-sm flex items-center justify-center uppercase flex-shrink-0">
              {(user.username || "G").charAt(0)}
            </div>
            <span className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm text-gray-500">
              {t('start_discussion')}
            </span>
            <PlusCircle size={22} className="text-green-600 flex-shrink-0" />
          </button>
        ) : (
          <form onSubmit={handleCreatePost} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  ref={composerTitleRef}
                  type="text"
                  placeholder={t('title_placeholder')}
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  required
                  maxLength={150}
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm font-bold text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  aria-label={t('close')}
                  className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer flex-shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
              <textarea
                placeholder={t('content_placeholder')}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows="3"
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all resize-none"
              ></textarea>
              {selectedFile && newPostPreviewUrl && (
                <div className="relative inline-block mt-2 rounded-lg overflow-hidden border border-gray-200 shadow-sm max-w-xs animate-in fade-in duration-200">
                  <img
                    src={newPostPreviewUrl}
                    alt="Selected preview"
                    className="h-32 w-auto object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors cursor-pointer"
                    aria-label={t('remove_image')}
                    title={t('remove_image')}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200">
                  <span className="font-bold">{t('tag_label')}</span>
                  <CustomSelect
                    name="new_post_tag"
                    value={newPostTag}
                    onChange={(e) => setNewPostTag(e.target.value)}
                    options={translatedTagOptions}
                    buttonClassName="bg-transparent outline-none font-bold text-green-700 cursor-pointer flex items-center gap-1 text-xs"
                    chevronSize={12}
                    containerClassName="inline-block"
                    menuClassName="absolute left-0 mt-2 w-40 bg-white border border-gray-100 rounded-lg shadow-xl z-[150] py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 thin-scrollbar"
                  />
                </div>

                <label
                  htmlFor="new-post-image-upload"
                  className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 cursor-pointer transition-colors active:scale-95 duration-150"
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
                      handleSelectImage(e.target.files[0], setSelectedFile);
                      e.target.value = "";
                    }
                  }}
                  className="hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isPosting || isUploadingImage || !newPostContent.trim() || !newPostTitle.trim()}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-green-600/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
        )
      ) : (
        <div className="bg-green-50 p-6 rounded-lg text-center border border-green-100 space-y-2">
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
            className="w-full bg-white px-5 py-3.5 pl-11 pr-11 text-sm text-gray-800 rounded-lg border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-green-500/25 transition-all"
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          {isSearching ? (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-green-200 border-t-green-600 rounded-full animate-spin"></span>
          ) : searchTerm ? (
            <button
              onClick={() => setSearchTerm("")}
              aria-label={t('clear_search')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        {/* Categories tag pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar px-2">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                selectedTag === tag
                  ? "bg-green-600 border-green-600 text-white shadow-sm shadow-green-600/10"
                  : "bg-white border-gray-100 text-gray-500 hover:text-green-600 hover:bg-green-50/30"
              }`}
            >
              {tagLabel(tag)}
            </button>
          ))}
        </div>
      </div>

      {/* Post Feeds */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : loadError ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-red-200 px-4">
            <AlertTriangle size={36} className="mx-auto text-red-300 mb-2" />
            <p className="font-bold text-gray-700">{t('forum_load_error')}</p>
            <button
              onClick={loadPosts}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 py-2.5 text-xs font-bold active:scale-95 transition-all cursor-pointer"
            >
              {t('retry')}
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-200 px-4">
            <MessageSquare size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="font-bold text-gray-700">{t('no_discussions')}</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              {t('no_discussions_desc')}
            </p>
            {user && !debouncedSearch && selectedTag === "All" && (
              <button
                onClick={() => {
                  handleOpenComposer();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="mt-4 inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 py-2.5 text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                <PlusCircle size={14} />
                {t('start_discussion')}
              </button>
            )}
          </div>
        ) : (
          visiblePosts.map(post => {
            const likes = post.reactions?.filter(r => r.reaction_type === "Like") || [];
            const hasLiked = user && likes.some(r => Number(r.user_id) === Number(user.id));
            const isOwner = user && Number(post.user_id) === Number(user.id);
            const isPostExpanded = expandedPostId === post.post_id;
            const isHidden = post.status === "Hidden";
            const isLocked = post.status === "Locked";
            const isLongContent = post.content.length > CONTENT_CLAMP_THRESHOLD || post.content.split("\n").length > 5;
            const isContentExpanded = expandedContentIds.has(post.post_id);

            return (
              <div
                key={post.post_id}
                className={`bg-white p-5 rounded-lg shadow-sm border border-gray-100 space-y-3.5 hover:shadow-md transition-shadow ${
                  isHidden ? "opacity-60 border-purple-100 bg-purple-50/5" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 text-white font-bold text-sm flex items-center justify-center uppercase shadow-inner flex-shrink-0">
                      {(post.user?.full_name || post.user?.username || "G").charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-xs leading-none">{post.user?.full_name || post.user?.username}</h4>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${roleBadgeStyle(post.user)}`}>
                        {formatRole(post.user)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 font-medium">{renderDate(post.created_at)}</span>

                    {/* Admin Moderation Buttons */}
                    {isAdmin && (
                      <div className="flex items-center gap-0.5 ml-1 border-l border-gray-200 pl-1.5">
                        <button
                          onClick={() => handleLockPost(post.post_id)}
                          className={`transition-colors p-2 cursor-pointer ${isLocked ? "text-amber-500 hover:text-amber-600" : "text-gray-500 hover:text-amber-500"}`}
                          aria-label={isLocked ? t('unlock_post') : t('lock_post')}
                          title={isLocked ? t('unlock_post') : t('lock_post')}
                        >
                          {isLocked ? <Unlock size={15} /> : <Lock size={15} />}
                        </button>
                        <button
                          onClick={() => handleHidePost(post.post_id)}
                          className={`transition-colors p-2 cursor-pointer ${isHidden ? "text-purple-500 hover:text-purple-600" : "text-gray-500 hover:text-purple-500"}`}
                          aria-label={isHidden ? t('unhide_post') : t('hide_post')}
                          title={isHidden ? t('unhide_post') : t('hide_post')}
                        >
                          {isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.post_id)}
                          className="text-gray-500 hover:text-red-500 transition-colors p-2 cursor-pointer"
                          aria-label={t('delete_post_moderator')}
                          title={t('delete_post_moderator')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}

                    {/* Standard Owner Buttons */}
                    {isOwner && !isAdmin && (
                      <div className="flex items-center gap-0.5 ml-1">
                        <button
                          onClick={() => handleStartEditPost(post)}
                          className="text-gray-500 hover:text-blue-500 transition-colors p-2 cursor-pointer"
                          aria-label={t('edit_post')}
                          title={t('edit_post')}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.post_id)}
                          className="text-gray-500 hover:text-red-500 transition-colors p-2 cursor-pointer"
                          aria-label={t('delete_post')}
                          title={t('delete_post')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                    {isOwner && isAdmin && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleStartEditPost(post)}
                          className="text-gray-500 hover:text-blue-500 transition-colors p-2 cursor-pointer"
                          aria-label={t('edit_post')}
                          title={t('edit_post')}
                        >
                          <Edit2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-gray-800 text-sm">{post.title}</h4>
                  <p
                    className="text-sm text-gray-600 leading-relaxed font-normal whitespace-pre-wrap"
                    style={isLongContent && !isContentExpanded ? {
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    } : undefined}
                  >
                    {post.content}
                  </p>
                  {isLongContent && (
                    <button
                      onClick={() => toggleContentExpanded(post.post_id)}
                      className="text-xs font-bold text-green-600 hover:text-green-700 cursor-pointer"
                    >
                      {isContentExpanded ? t('show_less') : t('read_more')}
                    </button>
                  )}

                  {post.image_url && (
                    <button
                      onClick={() => setLightboxUrl(post.image_url)}
                      aria-label={t('view_image')}
                      className="relative rounded-lg overflow-hidden max-h-[400px] mt-2 border border-gray-100 bg-gray-50/50 flex items-center justify-center shadow-inner w-full cursor-zoom-in"
                    >
                      <img src={post.image_url} alt={post.title} loading="lazy" className="max-h-[400px] w-full object-contain rounded-lg" />
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-center border-t border-gray-50 pt-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md ${
                      post.tag === "Pest Alert" ? "bg-red-50 text-red-600" :
                      post.tag === "Fertilizer" ? "bg-blue-50 text-blue-600" :
                      post.tag === "Market Price" ? "bg-amber-50 text-amber-600" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {tagLabel(post.tag)}
                    </span>

                    {isLocked && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-md animate-pulse">
                        <Lock size={10} /> {t('locked')}
                      </span>
                    )}

                    {isHidden && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-purple-50 text-purple-600 px-2.5 py-0.5 rounded-md">
                        <EyeOff size={10} /> {t('hidden_content')}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {/* Like button */}
                    <button
                      onClick={(e) => handleLike(post.post_id, e)}
                      aria-label="Like"
                      className={`flex items-center gap-1.5 text-xs font-bold transition-all transform active:scale-95 cursor-pointer px-2 py-1.5 rounded-lg ${
                        hasLiked ? 'text-red-500 font-bold' : 'text-gray-500 hover:text-red-400'
                      }`}
                    >
                      <Heart size={16} className={hasLiked ? 'fill-red-500 text-red-500' : ''} />
                      <span>{likes.length}</span>
                    </button>

                    {/* Replies count button */}
                    <button
                      onClick={() => setExpandedPostId(isPostExpanded ? null : post.post_id)}
                      aria-label={t('replies_count')}
                      className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors px-2 py-1.5 rounded-lg ${
                        isPostExpanded ? 'text-green-600' : 'text-gray-500 hover:text-green-600'
                      }`}
                    >
                      <MessageSquare size={16} />
                      <span>{post.replies?.length || 0}</span>
                      {isLocked && <Lock size={11} className="text-amber-500" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Replies Section */}
                {isPostExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h5 className="text-xs font-bold text-gray-700">{t('replies_count')} ({post.replies?.length || 0})</h5>

                    {/* Replies List */}
                    <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar pr-1">
                      {(!post.replies || post.replies.length === 0) ? (
                        <p className="text-xs text-gray-500 italic">{t('no_replies')}</p>
                      ) : (
                        post.replies.map(reply => {
                          const isEditingReply = editingReplyId === reply.reply_id;
                          const isReplyOwner = user && Number(reply.user_id) === Number(user.id);
                          return (
                            <div key={reply.reply_id} className="bg-gray-50/50 p-3 rounded-lg border border-gray-100/50 flex gap-3 items-start">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 text-white font-bold text-xs flex items-center justify-center uppercase flex-shrink-0">
                                {(reply.user?.full_name || reply.user?.username || "U").charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <span className="font-bold text-gray-800 text-[11px]">{reply.user?.full_name || reply.user?.username}</span>
                                    <span className="text-[10px] text-gray-500 ml-2 font-semibold">({formatRole(reply.user)})</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-gray-500">{renderDate(reply.replied_at)}</span>
                                    {isReplyOwner && (
                                      <div className="flex items-center">
                                        <button
                                          onClick={() => {
                                            setEditingReplyId(reply.reply_id);
                                            setEditReplyText(reply.reply_content);
                                          }}
                                          className="text-gray-500 hover:text-blue-500 p-1.5 cursor-pointer"
                                          aria-label={t('edit_reply')}
                                          title={t('edit_reply')}
                                        >
                                          <Edit2 size={12} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteReply(post.post_id, reply.reply_id)}
                                          className="text-gray-500 hover:text-red-500 p-1.5 cursor-pointer"
                                          aria-label={t('delete_reply')}
                                          title={t('delete_reply')}
                                        >
                                          <Trash2 size={12} />
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
                                      className="flex-1 p-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-xs font-semibold text-gray-700"
                                    />
                                    <button
                                      onClick={() => handleSaveReply(post.post_id, reply.reply_id)}
                                      aria-label={t('save_changes')}
                                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      onClick={() => setEditingReplyId(null)}
                                      aria-label={t('cancel')}
                                      className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-600 mt-1 break-words leading-relaxed whitespace-pre-wrap">{reply.reply_content}</p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Add Reply Input */}
                    {isLocked && !isAdmin ? (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 p-3 rounded-lg text-[11px] font-bold text-amber-700">
                        <Lock size={12} className="text-amber-500 flex-shrink-0" />
                        <span>{t('locked_post')}</span>
                      </div>
                    ) : user ? (
                      <div className="flex gap-2 items-end pt-2">
                        <textarea
                          rows={1}
                          placeholder={t('write_reply')}
                          value={replyText[post.post_id] || ""}
                          onChange={(e) => setReplyText({ ...replyText, [post.post_id]: e.target.value })}
                          onInput={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                              e.preventDefault();
                              handleCreateReply(post.post_id);
                            }
                          }}
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all resize-none overflow-y-auto no-scrollbar"
                        />
                        <button
                          onClick={() => handleCreateReply(post.post_id)}
                          disabled={!(replyText[post.post_id] || "").trim() || replyingPostId === post.post_id}
                          aria-label={t('write_reply')}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-2.5 rounded-lg active:scale-95 transition-all shadow-md shadow-green-600/10 cursor-pointer flex-shrink-0"
                        >
                          {replyingPostId === post.post_id ? (
                            <span className="block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          ) : (
                            <Send size={12} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-500 italic">{t('login_to_reply')}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Load More */}
        {!isLoading && !loadError && posts.length > visibleCount && (
          <button
            onClick={() => setVisibleCount(c => c + POSTS_PER_PAGE)}
            className="w-full bg-white border border-gray-100 text-green-700 rounded-lg py-3 text-xs font-bold shadow-sm hover:shadow-md hover:bg-green-50/30 active:scale-[0.99] transition-all cursor-pointer"
          >
            {t('load_more')} ({posts.length - visibleCount})
          </button>
        )}
      </div>

      {/* Edit Post Modal Overlay */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">{t('edit_discussion')}</h3>
              <button
                onClick={handleCancelEdit}
                aria-label={t('close')}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">{t('discussion_title')}</label>
                <input
                  type="text"
                  placeholder={t('title_placeholder')}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  maxLength={150}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">{t('discussion_body')}</label>
                <textarea
                  placeholder={t('content_placeholder')}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows="4"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">{t('discussion_image')}</label>

                {editSelectedFile && editPreviewUrl ? (
                  <div className="relative inline-block mt-1 rounded-lg overflow-hidden border border-gray-200 shadow-sm max-w-xs animate-in fade-in duration-200">
                    <img
                      src={editPreviewUrl}
                      alt="New selected preview"
                      className="h-32 w-auto object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setEditSelectedFile(null)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors cursor-pointer"
                      aria-label={t('remove_image')}
                      title={t('remove_image')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : editImageUrl ? (
                  <div className="relative inline-block mt-1 rounded-lg overflow-hidden border border-gray-200 shadow-sm max-w-xs">
                    <img
                      src={editImageUrl}
                      alt="Existing discussion image"
                      className="h-32 w-auto object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setEditImageUrl("")}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 transition-colors cursor-pointer shadow-md"
                      aria-label={t('remove_image')}
                      title={t('remove_image')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="edit-post-image-upload"
                      className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-xs font-bold border border-gray-200 cursor-pointer transition-colors active:scale-95 duration-150"
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
                          handleSelectImage(e.target.files[0], setEditSelectedFile);
                          e.target.value = "";
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200">
                  <span className="font-bold">{t('tag_label')}</span>
                  <CustomSelect
                    name="edit_tag"
                    value={editTag}
                    onChange={(e) => setEditTag(e.target.value)}
                    options={translatedTagOptions}
                    buttonClassName="bg-transparent outline-none font-bold text-green-700 cursor-pointer flex items-center gap-1 text-xs"
                    chevronSize={12}
                    containerClassName="inline-block"
                    menuClassName="absolute left-0 mt-2 w-40 bg-white border border-gray-100 rounded-lg shadow-xl z-[150] py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 thin-scrollbar"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPost || !editTitle.trim() || !editContent.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 py-2.5 text-xs font-bold shadow-md shadow-green-600/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
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

      {/* Image Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            aria-label={t('close')}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-h-[90vh] max-w-full object-contain rounded-lg animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
        isBusy={isConfirmBusy}
      />

      {/* Toast notifications */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

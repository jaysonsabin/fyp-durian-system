import { useState } from 'react';
import { MessageSquare, Search, Heart, Send, Sparkles, Filter, PlusCircle, AlertTriangle } from 'lucide-react';

const INITIAL_POSTS = [
  {
    id: 1,
    author: "Ahmad Abdullah",
    role: "Pengusaha (Raub)",
    content: "Musang King farmgate price in Raub is trending around RM42 - RM46 per kg today. Anyone getting better offers for grade A fruits?",
    tag: "Market Price",
    likes: 8,
    hasLiked: false,
    replies: 3,
    date: "2 hours ago"
  },
  {
    id: 2,
    author: "Siti Aminah",
    role: "Pengusaha (Bentong)",
    content: "Seeing early signs of stem canker (Phytophthora) on my older trees after last week's heavy rains. Recommend spraying metalaxyl or fosetyl-aluminium immediately if you notice resin bleeding.",
    tag: "Pest Alert",
    likes: 12,
    hasLiked: false,
    replies: 5,
    date: "5 hours ago"
  },
  {
    id: 3,
    author: "John Wong",
    role: "Pengusaha (Johor)",
    content: "Just tested a 1:1 ratio of organic compost with NPK 15-15-15 on my 3-year-old trees. The leaf greenness and shoot elongation have improved significantly compared to chemical fertilizer alone.",
    tag: "Fertilizer",
    likes: 5,
    hasLiked: false,
    replies: 2,
    date: "1 day ago"
  }
];

export default function Forum({ currentUser }) {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTag, setNewPostTag] = useState("General");
  const [isPosting, setIsPosting] = useState(false);

  const handleLike = (id) => {
    setPosts(prev => prev.map(post => {
      if (post.id === id) {
        return {
          ...post,
          likes: post.hasLiked ? post.likes - 1 : post.likes + 1,
          hasLiked: !post.hasLiked
        };
      }
      return post;
    }));
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsPosting(true);
    
    // Simulate API delay
    setTimeout(() => {
      const newPost = {
        id: Date.now(),
        author: currentUser?.username || "You",
        role: "Grower (Verified)",
        content: newPostContent,
        tag: newPostTag,
        likes: 0,
        hasLiked: false,
        replies: 0,
        date: "Just now"
      };

      setPosts([newPost, ...posts]);
      setNewPostContent("");
      setNewPostTag("General");
      setIsPosting(false);
    }, 600);
  };

  const tags = ["All", "Fertilizer", "Pest Alert", "Market Price", "General"];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === "All" || post.tag === selectedTag;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Forum Header Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 rounded-[32px] text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-8 -translate-y-8 blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg leading-tight">Growers Forum</h3>
            <p className="text-[11px] text-green-100 font-semibold uppercase tracking-wider">DurianFlow Community Hub</p>
          </div>
        </div>
      </div>

      {/* Write New Post Form */}
      <form onSubmit={handleCreatePost} className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 space-y-3">
        <textarea 
          placeholder="Share your durian observations, ask about soil conditions, or check prices..."
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          rows="2"
          required
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all resize-none"
        ></textarea>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full text-xs text-gray-500 border border-gray-200">
            <span className="font-bold">Tag:</span>
            <select 
              value={newPostTag}
              onChange={(e) => setNewPostTag(e.target.value)}
              className="bg-transparent outline-none font-bold text-green-700 cursor-pointer"
            >
              <option value="General">General</option>
              <option value="Fertilizer">Fertilizer</option>
              <option value="Pest Alert">Pest Alert</option>
              <option value="Market Price">Market Price</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            disabled={isPosting || !newPostContent.trim()}
            className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-green-600/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPosting ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Send size={12} />
            )}
            <span>POST</span>
          </button>
        </div>
      </form>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search discussions or users..."
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
              className={`px-4 py-1.5 text-xs font-black rounded-full border transition-all whitespace-nowrap ${
                selectedTag === tag 
                  ? "bg-green-600 border-green-600 text-white shadow-sm shadow-green-600/10" 
                  : "bg-white border-gray-100 text-gray-400 hover:text-green-600 hover:bg-green-50/30"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Post Feeds */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 px-4">
            <AlertTriangle size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="font-bold text-gray-700">No discussions found</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              We couldn't find anything matching your query. Be the first to start a conversation!
            </p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <div key={post.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 space-y-3.5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 text-white font-black text-sm flex items-center justify-center uppercase shadow-inner">
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs leading-none">{post.author}</h4>
                    <span className="text-[10px] text-gray-400 font-semibold">{post.role}</span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{post.date}</span>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed font-normal whitespace-pre-wrap">{post.content}</p>

              <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                  post.tag === "Pest Alert" ? "bg-red-50 text-red-600" :
                  post.tag === "Fertilizer" ? "bg-blue-50 text-blue-600" :
                  post.tag === "Market Price" ? "bg-amber-50 text-amber-600" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {post.tag}
                </span>

                <div className="flex gap-4">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1 text-[11px] font-bold transition-all ${
                      post.hasLiked ? 'text-red-500 scale-105' : 'text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <Heart size={14} className={post.hasLiked ? 'fill-red-500' : ''} />
                    <span>{post.likes}</span>
                  </button>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400">
                    <MessageSquare size={14} />
                    <span>{post.replies}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from 'react';
import { BookOpen, FileText, Video, ExternalLink, Search } from 'lucide-react';

export default function Library() {
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // FYP NOTE: For now, we hardcode farmer ID 1. 
  // Later, you will get this from your Login/Auth state!
  const currentFarmerId = 5; 

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const response = await fetch("http://localhost:8001/library");
        if (response.ok) {
          const data = await response.json();
          setContents(data);
        } else {
          console.error("Failed to fetch library contents");
        }
      } catch (error) {
        console.error("Network error fetching library:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLibrary();
  }, []);

  const handleResourceClick = async (content) => {
    // 1. Open the file immediately for a fast User Experience
    if (content.media_url) {
      window.open(content.media_url, "_blank");
    } else {
      alert("No file linked to this resource.");
      return;
    }

    // 2. Silently record the interaction to PostgreSQL in the background
    try {
      await fetch("http://localhost:8001/library/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: content.content_id,
          farmer_id: currentFarmerId,
          interaction_type: "Viewed" 
        })
      });
      console.log(`Interaction logged for content ${content.content_id}`);
    } catch (error) {
      console.error("Failed to log interaction:", error);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Search */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-gray-800">eLibrary</h3>
          <p className="text-xs text-gray-500">Official guidelines and resources</p>
        </div>
        <button className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors">
          <Search size={20} />
        </button>
      </div>

      {/* Content List */}
      <div className="space-y-4 pb-20">
        {isLoading ? (
          <div className="text-center text-gray-400 py-10 font-bold animate-pulse">Loading resources...</div>
        ) : contents.length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-white rounded-3xl border border-dashed border-gray-200">
            <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold">No resources available.</p>
            <p className="text-xs mt-1">Check back later for new guides!</p>
          </div>
        ) : (
          contents.map((item) => (
            <div key={item.content_id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex gap-4 transition-all hover:shadow-md cursor-pointer" onClick={() => handleResourceClick(item)}>
              
              {/* Icon based on Type */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.type.toLowerCase() === 'video' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                {item.type.toLowerCase() === 'video' ? <Video size={24} /> : <FileText size={24} />}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">{item.category}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(item.date_published).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                
                <h4 className="font-bold text-gray-800 leading-tight mt-1">{item.title}</h4>
                {item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                
                {/* Meta details */}
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">By {item.published_by}</span>
                  {/* FYP Bonus: Show view count from your backend relationships! */}
                  <span className="text-[10px] font-medium text-blue-500 bg-blue-50 px-2 py-1 rounded-md">
                    {item.interactions?.length || 0} Views
                  </span>
                </div>
              </div>
              
              <div className="flex items-center text-gray-300">
                <ExternalLink size={18} />
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
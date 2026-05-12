import { ClipboardList, Plus, ChartLine, BookOpen, MessageSquare } from 'lucide-react';

export default function BottomNav({ activeModule, setActiveModule, setShowRecordModal }) {
  return (
    <nav className="fixed bottom-0 w-full h-[85px] bg-white flex justify-around items-center px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] z-50">
      
      {/* Records Button */}
      <button onClick={() => setActiveModule('records')} className={`flex flex-col items-center ${activeModule === 'records' ? 'text-green-600' : 'text-gray-300'}`}>
        <ClipboardList size={24} className="mb-1" />
        <span className="text-[10px] font-bold uppercase">Records</span>
      </button>

      {/* Yield AI Button */}
      <button onClick={() => setActiveModule('yield')} className={`flex flex-col items-center ${activeModule === 'yield' ? 'text-green-600' : 'text-gray-300'}`}>
        <ChartLine size={24} className="mb-1" />
        <span className="text-[10px] font-bold uppercase">Yield AI</span>
      </button>

      {/* Floating Action Button (Center) */}
      <div className="relative -top-7">
        <button 
          onClick={() => setShowRecordModal(true)} 
          className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white active:scale-90 transition-transform"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>

      {/* NEW: eForum Button */}
      <button onClick={() => setActiveModule('forum')} className={`flex flex-col items-center ${activeModule === 'forum' ? 'text-green-600' : 'text-gray-300'}`}>
        <MessageSquare size={24} className="mb-1" />
        <span className="text-[10px] font-bold uppercase">Forum</span>
      </button>

      {/* NEW: eLibrary Button */}
      <button onClick={() => setActiveModule('library')} className={`flex flex-col items-center ${activeModule === 'library' ? 'text-green-600' : 'text-gray-300'}`}>
        <BookOpen size={24} className="mb-1" />
        <span className="text-[10px] font-bold uppercase">Library</span>
      </button>

    </nav>
  );
}
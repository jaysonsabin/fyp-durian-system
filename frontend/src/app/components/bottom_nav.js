import { ClipboardList, Plus, ChartLine, BookOpen, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/app/context/language_context';

export default function BottomNav({ activeModule, setActiveModule, setShowRecordModal, userRole }) {
  const isAdmin = userRole === 'Pentadbir';
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 w-full h-[85px] bg-white flex justify-around items-center px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] z-50">
      
      {/* Records Button */}
      {!isAdmin && (
        <button onClick={() => setActiveModule('records')} className={`w-20 text-center flex flex-col items-center cursor-pointer ${activeModule === 'records' ? 'text-green-600' : 'text-gray-500'}`}>
          <ClipboardList size={24} className="mb-1" />
          <span className="text-[11px] font-bold uppercase">{t('records')}</span>
        </button>
      )}

      {/* Yield AI Button */}
      {!isAdmin && (
        <button onClick={() => setActiveModule('yield')} className={`w-20 text-center flex flex-col items-center cursor-pointer ${activeModule === 'yield' ? 'text-green-600' : 'text-gray-500'}`}>
          <ChartLine size={24} className="mb-1" />
          <span className="text-[11px] font-bold uppercase">{t('yield_ai')}</span>
        </button>
      )}

      {/* Floating Action Button (Center) */}
      {!isAdmin && (
        <div className="relative -top-7">
          <button
            onClick={() => setShowRecordModal(true)}
            aria-label={t('records')}
            className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white active:scale-90 transition-transform cursor-pointer"
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* NEW: eForum Button */}
      <button onClick={() => setActiveModule('forum')} className={`w-20 text-center flex flex-col items-center cursor-pointer ${activeModule === 'forum' ? 'text-green-600' : 'text-gray-500'}`}>
        <MessageSquare size={24} className="mb-1" />
        <span className="text-[11px] font-bold uppercase">{t('forum')}</span>
      </button>

      {/* NEW: eLibrary Button */}
      <button onClick={() => setActiveModule('library')} className={`w-20 text-center flex flex-col items-center cursor-pointer ${activeModule === 'library' ? 'text-green-600' : 'text-gray-500'}`}>
        <BookOpen size={24} className="mb-1" />
        <span className="text-[11px] font-bold uppercase">{t('library')}</span>
      </button>

    </nav>
  );
}
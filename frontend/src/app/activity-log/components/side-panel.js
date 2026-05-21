import { X, Settings, ChevronRight, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePanel({ isOpen, onClose, onLogout }) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] flex justify-end animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="w-[80%] max-w-sm bg-white h-full shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-right duration-300">
        
        {/* Panel Header */}
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-800">Account</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Panel Links */}
        <div className="p-4 flex-1 flex flex-col gap-2">
          <button 
            onClick={() => {
              onClose();
              router.push('/profile');
            }}
            className="flex items-center justify-between w-full p-4 rounded-2xl hover:bg-gray-50 text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 text-blue-500 p-2.5 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Settings size={18} />
              </div>
              <span className="font-semibold text-gray-700">Edit Profile & Farms</span>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
          </button>
        </div>

        {/* Logout Button */}
        <div className="p-6 border-t border-gray-100">
          <button 
            onClick={onLogout} 
            className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-red-50 text-red-500 font-bold hover:bg-red-100 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
        
      </div>
    </div>
  );
}

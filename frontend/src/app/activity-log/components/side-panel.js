import { useEffect, useState } from 'react';
import { X, Settings, ChevronRight, LogOut, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/context/language_context';

export default function ProfilePanel({ isOpen, onClose, onLogout }) {
  const router = useRouter();
  const { language, changeLanguage, t } = useLanguage();
  
  return (
    <div className={`fixed inset-0 z-[300] flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      
      {/* Backdrop */}
      <div 
      className={`absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
      onClick={onClose}
      ></div>

      {/* Main Drawer Panel */}
      <div 
      className={`w-[60%] max-w-sm bg-white h-full shadow-2xl flex flex-col relative z-10 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        
        {/* Panel Header */}
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-800">{t('account')}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-600 bg-gray-100 p-2.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Panel Links */}
        <div className="p-4 flex-1 flex flex-col gap-4">
          <button 
            onClick={() => {
              onClose();
              router.push('/profile');
            }}
            className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-50 text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-50 text-green-600 p-1.5 rounded-lg group-hover:bg-green-100 transition-colors">
                <Settings size={16} />
              </div>
              <span className="text-xs font-semibold text-gray-700">{t('edit_profile_farms')}</span>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-green-600 transition-colors" />
          </button>

          {/* Language Selector Block */}
          <div className="border-t border-gray-100 pt-4 px-4 space-y-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={14} className="text-gray-400" />
              <span>{t('language')}</span>
            </span>
            <div className="flex items-center bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => changeLanguage('ms')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  language === 'ms' 
                    ? 'bg-green-600 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                BM
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  language === 'en' 
                    ? 'bg-green-600 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-6 border-t border-gray-100">
          <button 
            onClick={onLogout} 
            className="flex items-center justify-center gap-2 w-full p-4 rounded-lg bg-red-50 text-red-500 font-bold hover:bg-red-100 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            {t('sign_out')}
          </button>
        </div>
        
      </div>
    </div>
  );
}
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/auth_context';
import { useLanguage } from '@/app/context/language_context';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8001";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); 
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        login(data); 
      } else {
        setError(t('alert_invalid_login'));
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(t('alert_cannot_connect'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex justify-center items-center h-screen relative overflow-hidden bg-gray-900">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.7)), url('/images/bg.jpg')" }}
      ></div>
      
      <div className="relative bg-white pt-16 pb-12 px-10 rounded-[40px] w-[90%] max-w-[400px] text-center shadow-2xl">
        <h1 className="text-5xl font-bold text-green-600 mb-3">{t('login_title')}</h1>
        <p className="text-gray-500 font-light tracking-wide mb-8">{t('login_subtitle')}</p>
        
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-500 text-sm rounded-xl font-medium border border-red-100">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="text-left flex flex-col gap-6">
          <input 
            type="text" 
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" 
            placeholder={t('username')} 
            required 
          />
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" 
            placeholder={t('password')} 
            required 
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isLoading ? t('authenticating') : t('login_button')}
          </button>
        </form>
        <div className="mt-8 text-center text-sm text-gray-500">
          {t('no_account')}{' '}
          <Link href="/register" className="text-green-600 font-bold hover:underline">
            {t('sign_up')}
          </Link>
        </div>
      </div>
    </section>
  );
}
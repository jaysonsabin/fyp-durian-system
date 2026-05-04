"use client";
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    router.push('/dashboard'); // Navigates to the dashboard folder
  };

  return (
    <section className="flex justify-center items-center h-screen relative overflow-hidden bg-gray-900">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.7)), url('/images/bg.jpg')" }}
      ></div>
      
      <div className="relative bg-white pt-16 pb-12 px-10 rounded-[40px] w-[90%] max-w-[400px] text-center shadow-2xl">
        <h1 className="text-5xl font-bold text-green-600 mb-3">DurianFlow</h1>
        <p className="text-gray-500 font-light tracking-wide mb-12">Farm Management System</p>
        
        <form onSubmit={handleLogin} className="text-left flex flex-col gap-6">
          <input type="text" className="w-full p-4 bg-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" placeholder="Username" required />
          <input type="password" className="w-full p-4 bg-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" placeholder="Password" required />
          <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-green-700 transition-all active:scale-95">
            LOG IN
          </button>
        </form>
      </div>
    </section>
  );
}
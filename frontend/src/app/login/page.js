"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  
  // 1. Add state to hold the form data and UI status
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2. Handle typing in the inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user starts typing again
  };

  // 3. The real authentication function
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch("http://localhost:8001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        
        // BOOM! Save the secure token to the browser's local storage
        localStorage.setItem("durian_token", data.access_token);
        
        // Now we actually go to the dashboard
        router.push('/dashboard'); 
      } else {
        // If password/username is wrong, backend returns 401 Unauthorized
        setError("Invalid username or password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Cannot connect to the server.");
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
        <h1 className="text-5xl font-bold text-green-600 mb-3">DurianFlow</h1>
        <p className="text-gray-500 font-light tracking-wide mb-8">Farm Management System</p>
        
        {/* NEW: Error Message Display */}
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
            placeholder="Username" 
            required 
          />
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" 
            placeholder="Password" 
            required 
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isLoading ? "AUTHENTICATING..." : "LOG IN"}
          </button>
        </form>
        <div className="mt-8 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link href="/register" className="text-green-600 font-bold hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </section>
  );
}
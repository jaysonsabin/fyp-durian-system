"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8001";

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    confirm_password: '',
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatus({ type: '', message: '' }); 
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    if (formData.password !== formData.confirm_password) {
      setStatus({type: 'error', message: "Passwords do not match."});
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/register/farmer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Notice we are automatically assigning the "Pengusaha" (Farmer) role here!
        body: JSON.stringify({ full_name: formData.full_name, username: formData.username, password: formData.password, role: "Pengusaha" }), 
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Registration successful! Redirecting to login...' });
        // Give them a second to read the success message before sending them to login
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        const errorData = await response.json();
        setStatus({ type: 'error', message: errorData.detail || "Registration failed." });
      }
    } catch (err) {
      console.error("Registration error:", err);
      setStatus({ type: 'error', message: "Cannot connect to the server." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex justify-center items-center min-h-screen relative overflow-hidden bg-gray-900 py-10">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 fixed"
        style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.7)), url('/images/bg.jpg')" }}
      ></div>
      
      <div className="relative bg-white pt-12 pb-10 px-10 rounded-[40px] w-[90%] max-w-[450px] shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-600 mb-2">Create Account</h1>
          <p className="text-gray-500 font-light text-sm">Join DurianFlow today</p>
        </div>
        
        {/* Status Message Display */}
        {status.message && (
          <div className={`mb-6 p-3 text-sm rounded-xl font-medium border ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-500 border-red-100'}`}>
            {status.message}
          </div>
        )}
        
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input 
            type="text" 
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 text-sm" 
            placeholder="Full Name" 
            required 
          />
          <input 
            type="text" 
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 text-sm" 
            placeholder="Username" 
            required 
          />
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 text-sm" 
            placeholder="Password" 
            required 
          />
          <input
            type = "password"
            name = "confirm_password"
            value = {formData.confirm_password}
            onChange = {handleChange}
            className = "w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 text-sm"
            placeholder = "Confirm Password"
            required
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white py-4 mt-2 rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isLoading ? "CREATING ACCOUNT..." : "SIGN UP"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/" className="text-green-600 font-bold hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </section>
  );
}
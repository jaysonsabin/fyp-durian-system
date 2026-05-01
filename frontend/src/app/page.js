"use client";
import { useState } from 'react';

export default function DurianFlow() {
  // --- AUTH & NAVIGATION STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeModule, setActiveModule] = useState('records');
  const [showRecordModal, setShowRecordModal] = useState(false);

  // --- FORM DATA STATE ---
  const [formData, setFormData] = useState({
    farm_id: 4, // Default test ID; update based on your pgAdmin records
    fertilizer_type: "NPK 15-15-15",
    fertilizer_amount: 0,
    pest_control: "",
    temperature: 0,
    rainfall: 0,
    soil_ph: 0,
    remarks: ""
  });

  // --- API HANDLERS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8001/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Activity Logged Successfully!");
        setShowRecordModal(false);
        // Reset form to defaults
        setFormData({ ...formData, fertilizer_amount: 0, remarks: "" });
      } else {
        const errorData = await response.json();
        console.error("Validation Error:", errorData.detail);
        alert("Failed to save. Check terminal for validation errors.");
      }
    } catch (error) {
      console.error("Connection Error:", error);
      alert("Cannot reach backend. Is FastAPI running on port 8001?");
    }
  };

  // --- VIEW 1: LOGIN ---
  if (!isLoggedIn) {
    return (
      <section className="flex justify-center items-center h-screen relative overflow-hidden bg-gray-900">
        {/* Background Image with Dark Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ 
            backgroundImage: "linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.7)), url('/images/bg.jpg')" 
          }}
        ></div>
        
        <div className="relative bg-white p-10 rounded-[40px] w-[90%] max-w-[400px] text-center shadow-2xl">
          <h1 className="text-4xl font-bold text-green-700 mb-2">Durian</h1>
          <p className="text-gray-500 mb-8 font-light">Farm Management System</p>
          
          <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }} className="text-left space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Username</label>
              <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="username" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Password</label>
              <input type="password" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="password" required />
            </div>
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-200 transition-all transform active:scale-95">
              LOG IN
            </button>
          </form>
        </div>
      </section>
    );
  }

  // --- VIEW 2: MAIN DASHBOARD ---
  return (
    <div className="bg-[#F4F7F6] h-screen flex flex-col overflow-hidden font-sans">
      
      {/* Header Section */}
      <header className="bg-white px-6 py-4 flex justify-between items-center shadow-sm z-10 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 capitalize">{activeModule}</h2>
        <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs">Active Farmer</span>
          <button onClick={() => setIsLoggedIn(false)} className="text-red-400 text-xl hover:text-red-600 transition-colors">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </header>

      {/* Dynamic Content Area */}
      <main className="flex-1 overflow-y-auto p-5 pb-32">
        
        {/* Module: Activity Records */}
        {activeModule === 'records' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
               <h3 className="text-lg font-bold text-gray-700">Farm Activity History</h3>
               <span className="text-xs text-gray-400">Total: 1 entry</span>
            </div>
            
            {/* Sample Record Card */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border-l-[6px] border-green-500 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">April 30, 2026</span>
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold">LATEST</span>
              </div>
              <p className="font-extrabold text-green-800 text-lg">Fertilization</p>
              <p className="text-sm text-gray-600 leading-relaxed">Applied 5.5kg of NPK 15-15-15. Soil pH recorded at 6.8.</p>
            </div>
          </div>
        )}

        {/* Module: AI Yield Prediction */}
        {activeModule === 'yield' && (
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-green-50 space-y-6 animate-in zoom-in-95 duration-300">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                   <i className="fas fa-robot text-xl"></i>
                </div>
                <h3 className="font-bold text-gray-800">AI Yield Predictor</h3>
             </div>

             <div className="bg-blue-50 p-4 rounded-2xl border-l-4 border-blue-400">
                <p className="text-xs font-bold text-blue-800 mb-1">PREDICTION PARAMETERS:</p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc ml-4">
                   <li>Latest Tree Count</li>
                   <li>Fertilizer Trends (Last 30 days)</li>
                   <li>Ambient Temperature & Rainfall</li>
                </ul>
             </div>

             <button className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-all">
                Run Random Forest Analysis
             </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation with the "Bump" design */}
      <nav className="fixed bottom-0 w-full h-[85px] bg-white flex justify-around items-center px-4 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] z-50">
        
        <button 
          onClick={() => setActiveModule('records')} 
          className={`flex flex-col items-center transition-all ${activeModule === 'records' ? 'text-green-600 scale-110' : 'text-gray-300'}`}
        >
          <i className="fas fa-clipboard-list text-xl mb-1"></i>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Records</span>
        </button>

        {/* FAB "Bump" Button */}
        <div className="relative -top-7">
           <button 
             onClick={() => setShowRecordModal(true)}
             className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-green-500/40 text-2xl border-4 border-white transition-transform active:scale-90"
           >
             <i className="fas fa-plus"></i>
           </button>
        </div>

        <button 
          onClick={() => setActiveModule('yield')} 
          className={`flex flex-col items-center transition-all ${activeModule === 'yield' ? 'text-green-600 scale-110' : 'text-gray-300'}`}
        >
          <i className="fas fa-chart-line text-xl mb-1"></i>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Yield AI</span>
        </button>
      </nav>

      {/* --- ACTIVITY LOG MODAL --- */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
             
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-green-900">New Activity</h3>
                  <p className="text-xs text-gray-400">Recording data for farm_id: {formData.farm_id}</p>
                </div>
                <button onClick={() => setShowRecordModal(false)} className="w-10 h-10 bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                  <i className="fas fa-times"></i>
                </button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[70vh] pb-6 pr-2">
                {/* Fertilizer Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fertilizer Brand</label>
                  <select 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.fertilizer_type}
                    onChange={(e) => setFormData({...formData, fertilizer_type: e.target.value})}
                  >
                    <option value="NPK 15-15-15">NPK 15-15-15</option>
                    <option value="NPK 12-12-17">NPK 12-12-17</option>
                    <option value="Organic">Organic</option>
                    <option value="None">None</option>
                  </select>
                </div>

                {/* Numeric Grid: Amount & pH */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Amount (kg)</label>
                    <input type="number" step="0.1" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none" placeholder="0.0"
                      onChange={(e) => setFormData({...formData, fertilizer_amount: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Soil pH</label>
                    <input type="number" step="0.1" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none" placeholder="7.0"
                      onChange={(e) => setFormData({...formData, soil_ph: parseFloat(e.target.value)})} />
                  </div>
                </div>

                {/* Environmental Grid: Temp & Rain */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Temp (°C)</label>
                    <input type="number" step="0.1" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none" placeholder="28.0"
                      onChange={(e) => setFormData({...formData, temperature: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Rainfall (mm)</label>
                    <input type="number" step="0.1" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none" placeholder="10.0"
                      onChange={(e) => setFormData({...formData, rainfall: parseFloat(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Remarks</label>
                  <textarea className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none" rows="2" placeholder="Notes about today's activity..."
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})} />
                </div>

                <button type="submit" className="w-full bg-green-600 text-white py-5 rounded-[24px] font-extrabold shadow-xl shadow-green-100 hover:bg-green-700 transition-all mt-4">
                  SAVE ACTIVITY LOG
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
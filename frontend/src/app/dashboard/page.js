"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LogOut, ClipboardList, Plus, ChartLine, Bot, 
  X, Beaker, Thermometer, Droplets, Save, Info 
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [activeModule, setActiveModule] = useState('records');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Added loading state

  // Initialize form state
  const [formData, setFormData] = useState({
    farm_id: 4, 
    fertilizer_type: "NPK 15-15-15", 
    fertilizer_amount: "",
    temperature: "", 
    rainfall: "", 
    soil_ph: "", 
    remarks: ""
  });

  // Handle generic input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // NEW: Function to send data to FastAPI
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    setIsSubmitting(true);

    try {
      // Make sure this URL matches your FastAPI endpoint!
      const response = await fetch("http://localhost:8001/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Convert strings to numbers where necessary before sending
        body: JSON.stringify({
          ...formData,
          fertilizer_amount: parseFloat(formData.fertilizer_amount),
          temperature: parseFloat(formData.temperature),
          rainfall: parseFloat(formData.rainfall),
          soil_ph: parseFloat(formData.soil_ph)
        }),
      });

      if (response.ok) {
        const savedData = await response.json();
        console.log("Successfully saved:", savedData);
        
        // Close modal and reset form
        setShowRecordModal(false);
        setFormData({ ...formData, fertilizer_amount: "", temperature: "", rainfall: "", soil_ph: "" });
        
        // Optional: You could trigger a re-fetch of the records here
        alert("Activity saved successfully!"); 
      } else {
        console.error("Failed to save. Backend returned:", await response.text());
        alert("Failed to save activity. Check console for details.");
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Cannot connect to server. Is FastAPI running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center shadow-sm border-b">
        <h2 className="text-xl font-bold text-gray-800 capitalize">{activeModule}</h2>
        <button onClick={() => router.push('/')} className="text-red-400 hover:text-red-600">
          <LogOut size={22} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-5 pb-32">
        {activeModule === 'records' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-bold text-gray-700">Farm Activity History</h3>
            <div className="bg-white p-5 rounded-3xl shadow-sm border-l-[6px] border-green-500">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-gray-400">MAY 4, 2026</span>
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold">LATEST</span>
              </div>
              <p className="font-extrabold text-green-800 text-lg">Fertilization</p>
              <p className="text-sm text-gray-600">Applied 5.5kg of NPK 15-15-15. Soil pH recorded at 6.8.</p>
            </div>
          </div>
        )}

        {activeModule === 'yield' && (
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-green-50 space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                   <Bot size={24} />
                </div>
                <h3 className="font-bold text-gray-800">AI Yield Predictor</h3>
             </div>
             <button className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-green-700 transition-all">
                Run Random Forest Analysis
             </button>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 w-full h-[85px] bg-white flex justify-around items-center px-4 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] z-50">
        <button onClick={() => setActiveModule('records')} className={`flex flex-col items-center ${activeModule === 'records' ? 'text-green-600' : 'text-gray-300'}`}>
          <ClipboardList size={24} className="mb-1" />
          <span className="text-[10px] font-bold uppercase">Records</span>
        </button>

        <div className="relative -top-7">
           <button onClick={() => setShowRecordModal(true)} className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white active:scale-90 transition-transform">
             <Plus size={32} strokeWidth={3} />
           </button>
        </div>

        <button onClick={() => setActiveModule('yield')} className={`flex flex-col items-center ${activeModule === 'yield' ? 'text-green-600' : 'text-gray-300'}`}>
          <ChartLine size={24} className="mb-1" />
          <span className="text-[10px] font-bold uppercase">Yield AI</span>
        </button>
      </nav>

      {/* Activity Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex justify-center items-end sm:items-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-green-900">New Activity</h3>
                  <div className="flex items-center gap-1.5 text-gray-400 mt-0.5">
                    <Info size={12} className="text-green-500" />
                    <p className="text-[10px] font-bold uppercase">Farm ID: {formData.farm_id}</p>
                  </div>
                </div>
                <button onClick={() => setShowRecordModal(false)} className="w-10 h-10 bg-gray-100 rounded-full text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500">
                  <X size={20} />
                </button>
              </div>

              {/* CONNECTED FORM */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="relative">
                  <select 
                    name="fertilizer_type"
                    value={formData.fertilizer_type}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 border border-gray-300 rounded-2xl appearance-none outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="NPK 15-15-15">NPK 15-15-15</option>
                    <option value="Organic">Organic</option>
                  </select>
                  <Beaker size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    name="fertilizer_amount"
                    value={formData.fertilizer_amount}
                    onChange={handleChange}
                    step="0.01"
                    required
                    className="w-full p-4 bg-gray-50 border border-gray-300 rounded-2xl outline-none" 
                    placeholder="Amt (kg)" 
                  />
                  <input 
                    type="number" 
                    name="soil_ph"
                    value={formData.soil_ph}
                    onChange={handleChange}
                    step="0.1"
                    required
                    className="w-full p-4 bg-gray-50 border border-gray-300 rounded-2xl outline-none" 
                    placeholder="Soil pH" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-300">
                    <Thermometer size={18} className="text-orange-400" />
                    <input 
                      type="number" 
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      step="0.1"
                      required
                      className="bg-transparent outline-none w-full" 
                      placeholder="Temp °C" 
                    />
                  </div>
                  <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-300">
                    <Droplets size={18} className="text-blue-400" />
                    <input 
                      type="number" 
                      name="rainfall"
                      value={formData.rainfall}
                      onChange={handleChange}
                      step="0.1"
                      required
                      className="bg-transparent outline-none w-full" 
                      placeholder="Rain mm" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`flex items-center justify-center gap-2 w-full text-white py-5 rounded-[24px] font-extrabold shadow-xl transition-all ${isSubmitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  <Save size={20} /> 
                  {isSubmitting ? "SAVING..." : "SAVE ACTIVITY"}
                </button>
              </form>
          </div>
        </div>
      )}
    </div>
  );
}
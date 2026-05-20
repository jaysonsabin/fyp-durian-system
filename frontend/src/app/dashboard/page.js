"use client";
import BottomNav from '../components/bottom_nav';
import Library from '../library/page';
import { useAuth } from '../context/auth_context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // <-- 1. IMPORT DETECTED
import { 
  LogOut, ClipboardList, Plus, ChartLine, Bot, 
  X, Beaker, Thermometer, Droplets, Save, Info,
  User, Settings, ChevronRight, MapPin
} from 'lucide-react';  

export default function DashboardPage() {
  const router = useRouter(); // <-- 2. ROUTER DEFINED FOR USE
  const { user, logout, loading } = useAuth();
  
  const [activeModule, setActiveModule] = useState('records');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [userFarms, setUserFarms] = useState([]);
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [newFarmData, setNewFarmData] = useState({ farm_name: '', farm_location: '' });

  const [formData, setFormData] = useState({
    farm_id: "", // Initialized empty so it can dynamic-bind to database row IDs
    fertilizer_type: "NPK 15-15-15", 
    fertilizer_amount: "",
    temperature: "", 
    rainfall: "", 
    soil_ph: "", 
    remarks: "",
    pest_control: "None",
  });

  // 1. Fetch all farms belonging to this user
  const fetchFarms = async () => {
    if (!user) return;
    try {
      setIsLoadingFarms(true);
      const response = await fetch(`http://localhost:8001/farms/${user.id}`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      
      if (response.ok) {
        const farms = await response.json();
        setUserFarms(farms);
        
        if (farms.length > 0) {
          const activeFarmId = farms[0].farm_id;
          setFormData(prev => ({ ...prev, farm_id: activeFarmId }));
          fetchLogs(activeFarmId);
        }
      }
    } catch (error) {
      console.error("Error fetching farms:", error);
    } finally {
      setIsLoadingFarms(false);
    }
  };

  // 2. Fetch logs for a specific farm_id
  const fetchLogs = async (farmId) => {
    try {
      setIsLoadingLogs(true);
      const response = await fetch(`http://localhost:8001/farms/${farmId}/logs`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      }); 
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.reverse()); 
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // 3. ALL EFFECT HOOKS RUN NEXT
  useEffect(() => {
    if (!loading && !user) {
      router.push('/'); 
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchFarms();
    }
  }, [user]);

  // ==========================================
  // 4. EVENT HANDLERS
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // FIXED: Extracted cleanly from inside handleSubmit so it scope-resolves properly
  const handleCreateFarmLockScreen = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:8001/farms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          farm_name: newFarmData.farm_name,
          farm_location: newFarmData.farm_location,
          farmer_id: parseInt(user.id)
        }),
      });

      if (response.ok) {
        setNewFarmData({ farm_name: '', farm_location: '' });
        fetchFarms(); 
      } else {
        alert("Failed to create farm partition.");
      }
    } catch (error) {
      console.error("Network error creating farm:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8001/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}` 
        },
        body: JSON.stringify({
          ...formData,
          farm_id: parseInt(formData.farm_id), // FIXED: Uses actual farm relational key instead of user context key!
          fertilizer_amount: parseFloat(formData.fertilizer_amount),
          temperature: parseFloat(formData.temperature),
          rainfall: parseFloat(formData.rainfall),
          soil_ph: parseFloat(formData.soil_ph)
        }),
      });

      if (response.ok) {
        setShowRecordModal(false);
        setFormData({ ...formData, fertilizer_amount: "", temperature: "", rainfall: "", soil_ph: "" });
        fetchLogs(formData.farm_id); // Refresh active lists
        alert("Activity saved successfully!"); 
      } else {
        alert("Failed to save activity. Check console for details.");
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Cannot connect to server. Is FastAPI running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. THE EARLY RETURN SAFEGUARD
  if (loading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-green-500 font-bold">
        Loading DurianFlow Secure Environment...
      </div>
    );
  }

  // Mandatory Farm Creation Lock Screen Interceptor (Triggers if loading finishes and user owns 0 properties)
  if (!isLoadingFarms && userFarms.length === 0) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-gray-900 p-6 relative overflow-hidden">
        <div className="bg-white p-8 rounded-[32px] w-full max-w-md shadow-2xl relative z-10 text-center">
          <MapPin size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Welcome to DurianFlow!</h2>
          <p className="text-gray-500 text-sm mb-8">Before you can track activities or predict yields, you need to register your first plantation location.</p>
          
          <form onSubmit={handleCreateFarmLockScreen} className="flex flex-col gap-4 text-left">
            <input 
              type="text" 
              placeholder="Plantation Name (e.g., Raub Orchard)"
              required
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
              value={newFarmData.farm_name}
              onChange={(e) => setNewFarmData({ ...newFarmData, farm_name: e.target.value })}
            />
            <input 
              type="text" 
              placeholder="Location (e.g., Pahang, Malaysia)"
              required
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
              value={newFarmData.farm_location}
              onChange={(e) => setNewFarmData({ ...newFarmData, farm_location: e.target.value })}
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full text-white py-4 mt-2 rounded-2xl font-bold shadow-lg transition-all ${isSubmitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isSubmitting ? "INITIALIZING..." : "CREATE MY FIRST FARM"}
            </button>
          </form>
          <button onClick={logout} className="mt-6 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors">
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // 6. FINAL RENDERING OF THE SECURE UI
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800 capitalize">{activeModule}</h2>
          {userFarms.length > 0 && (
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">{userFarms[0].farm_name}</p>
          )}
        </div>
        <button 
          onClick={() => setIsProfilePanelOpen(true)} 
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 transition-colors"
        >
          <User size={20} />
        </button>
      </header>

      {isProfilePanelOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] flex justify-end animate-in fade-in duration-200">
          <div className="w-[80%] max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Panel Header */}
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-800">Account</h3>
              <button onClick={() => setIsProfilePanelOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full">
                <X size={18} />
              </button>
            </div>
            
            {/* Panel Links */}
            <div className="p-4 flex-1 flex flex-col gap-2">
              <button 
                onClick={() => {
                  setIsProfilePanelOpen(false);
                  router.push('/profile');
                }}
                className="flex items-center justify-between w-full p-4 rounded-2xl hover:bg-gray-50 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 text-blue-500 p-2 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <Settings size={18} />
                  </div>
                  <span className="font-semibold text-gray-700">Edit Profile & Farms</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
              </button>
            </div>

            {/* Logout Button */}
            <div className="p-6 border-t border-gray-100">
              <button onClick={logout} className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-red-50 text-red-500 font-bold hover:bg-red-100 transition-colors">
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-5 pb-32 bg-gray-100">
        {activeModule === 'records' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-bold text-gray-700">Farm Activity History</h3>
            
            {isLoadingLogs ? (
               <div className="text-center text-gray-400 py-10 font-bold animate-pulse">Loading records...</div>
            ) : logs.length === 0 ? (
               <div className="text-center text-gray-400 py-10 font-bold bg-gray-50 rounded-3xl border border-dashed border-gray-200">No activities recorded yet.</div>
            ) : (
               logs.map((log, index) => (
                 <div key={log.log_id || index} className="bg-white p-5 rounded-3xl shadow-sm border-l-[6px] border-green-500 mb-4 transition-all hover:shadow-md">
                   <div className="flex justify-between items-center mb-1">
                     <span className="text-[10px] font-bold text-gray-400 uppercase">
                       {new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                     </span>
                     {index === 0 && (
                       <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold">LATEST</span>
                     )}
                   </div>
                   <p className="font-extrabold text-green-800 text-lg">{log.fertilizer_type || "Activity"}</p>
                   
                   <div className="text-sm text-gray-600 mt-2 space-y-1">
                     <p>Applied {log.fertilizer_amount}kg. Soil pH recorded at {log.soil_ph}.</p>
                     {log.pest_control && log.pest_control !== "None" && (
                       <p className="text-red-500 font-medium text-xs">Pest Treatment: {log.pest_control}</p>
                     )}
                     {log.remarks && (
                       <p className="text-gray-500 italic border-l-2 border-gray-200 pl-2 mt-2 text-xs">"{log.remarks}"</p>
                     )}
                   </div>
                 </div>
               ))
            )}
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

        {activeModule === 'library' && <Library />}
      </main>

      <BottomNav 
         activeModule={activeModule} 
         setActiveModule={setActiveModule} 
         setShowRecordModal={setShowRecordModal} 
      />

      {/* Activity Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex justify-center items-end sm:items-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-green-900">New Activity</h3>
                  <div className="flex items-center gap-1.5 text-gray-400 mt-0.5">
                    <Info size={12} className="text-green-500" />
                    <p className="text-[10px] font-bold uppercase">Farm Target: {userFarms[0]?.farm_name}</p>
                  </div>
                </div>
                <button onClick={() => setShowRecordModal(false)} className="w-10 h-10 bg-gray-100 rounded-full text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500">
                  <X size={20} />
                </button>
              </div>

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

                <div className="relative">
                  <select 
                    name="pest_control"
                    value={formData.pest_control}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 border border-gray-300 rounded-2xl appearance-none outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="None">No Pest Treatment</option>
                    <option value="Fungicide (Canker)">Fungicide (Stem Canker)</option>
                    <option value="Insecticide (Borers)">Insecticide (Seed Borers)</option>
                    <option value="Organic (Neem)">Organic (Neem Oil)</option>
                  </select>
                  <Bot size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                <div>
                  <textarea 
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Additional observations (e.g., yellowing leaves, heavy winds)..."
                    className="w-full p-4 bg-gray-50 border border-gray-300 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  ></textarea>
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
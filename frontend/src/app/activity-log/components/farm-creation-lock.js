import { useState, useRef } from 'react';
import { MapPin } from 'lucide-react';

export default function FarmCreationLock({ onAddFarm, onLogout }) {
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onAddFarm(farmName, farmLocation);
    } catch (error) {
      console.error(error);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center bg-gray-900 p-6 relative overflow-hidden">
      {/* Decorative gradient blur background */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-green-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-emerald-500/10 rounded-full blur-[120px]"></div>

      <div className="bg-white p-8 rounded-[32px] w-full max-w-md shadow-2xl relative z-10 text-center border border-gray-100/50">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
          <MapPin size={36} />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Welcome to DurianFlow!</h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Before you can track activities or predict yields, you need to register your first plantation location.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase ml-2 mb-1.5">Plantation Name</label>
            <input 
              type="text" 
              placeholder="e.g., Raub Orchard"
              required
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 font-medium transition-all"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase ml-2 mb-1.5">Location</label>
            <input 
              type="text" 
              placeholder="e.g., Pahang, Malaysia"
              required
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 font-medium transition-all"
              value={farmLocation}
              onChange={(e) => setFarmLocation(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full text-white py-4.5 mt-4 rounded-2xl font-bold shadow-lg shadow-green-600/10 transition-all duration-300 ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 hover:shadow-xl hover:shadow-green-600/20 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? "INITIALIZING..." : "CREATE MY FIRST FARM"}
          </button>
        </form>
        
        <button 
          onClick={onLogout} 
          className="mt-6 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider text-[11px]"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

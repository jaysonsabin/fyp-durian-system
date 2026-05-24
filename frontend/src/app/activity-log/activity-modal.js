import { useState, useEffect, useRef } from 'react';
import { X, Info, Beaker, Thermometer, Droplets, Bot, Save } from 'lucide-react';
import { fetchCurrentWeather } from '@/services/dashboard';
import CustomSelect from '@/app/components/custom-select';

const activityTypeOptions = [
  { value: "Fertilization", label: "Fertilization (Pembajaan)"},
  { value: "Pruning", label: "Pruning (Pemangkasan)"},
  { value: "Irrigation", label: "Irrigation (Penyiraman)"},
  { value: "Weeding", label: "Weeding (Merumpai)"},
  { value: "Pest/Disease Spraying", label: "Pest Spraying (Kawalan Perosak)"},
  { value: "Fruit Tying & Thinning", label: "Fruit Tying & Thinning (Mengikat/Menjarang)"},
  { value: "Harvesting", label: "Harvesting (Penuaian)"}
];

const fertilizerTypeOptions = [
  { value: "NPK 15-15-15", label: "NPK 15-15-15"},
  { value: "NPK 12-12-17", label: "NPK 12-12-17"},
  { value: "Organic", label: "Organic"}
];

const pestControlOptions = [
  { value: "None", label: "No Pest Treatment"},
  { value: "Fungicide (Canker)", label: "Fungicide (Stem Canker)"},
  { value: "Insecticide (Borers)", label: "Insecticide (Seed Borers)"},
  { value: "Organic (Neem)", label: "Organic (Neem Oil)"}
];

export default function ActivityModal({ isOpen, onClose, activeFarm, onSubmit, editingLog, logs }) {
  const [formData, setFormData] = useState({
    activity_type: "Fertilization",
    fertilizer_type: "NPK 15-15-15", 
    fertilizer_amount: "",
    temperature: "", 
    rainfall: "", 
    soil_ph: "", 
    remarks: "",
    pest_control: "None",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (editingLog) {
      setFormData({
        activity_type: editingLog.activity_type || "Fertilization",
        fertilizer_type: editingLog.fertilizer_type || "NPK 15-15-15",
        fertilizer_amount: editingLog.fertilizer_amount !== undefined && editingLog.fertilizer_amount !== null ? editingLog.fertilizer_amount : "",
        temperature: editingLog.temperature || "",
        rainfall: editingLog.rainfall || "",
        soil_ph: editingLog.soil_ph || "",
        remarks: editingLog.remarks || "",
        pest_control: editingLog.pest_control || "None",
      });
    } else {
      const latestLog = logs && logs.length > 0 ? logs[0] : null;
      const isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;

      setFormData({
        activity_type: "Fertilization",
        fertilizer_type: latestLog ? latestLog.fertilizer_type : "NPK 15-15-15",
        fertilizer_amount: "",
        temperature: !isOnline && latestLog ? latestLog.temperature : "",
        rainfall: !isOnline && latestLog ? latestLog.rainfall : "",
        soil_ph: latestLog ? latestLog.soil_ph : "6.2",
        remarks: "",
        pest_control: "None",
      });

      if (isOnline && activeFarm?.farm_id) {
        setIsFetchingWeather(true);
        fetchCurrentWeather(activeFarm.farm_id)
          .then((weather) => {
            setFormData(prev => ({
              ...prev,
              temperature: weather.temperature !== undefined ? weather.temperature : "",
              rainfall: weather.rainfall !== undefined ? weather.rainfall : "",
            }));
          })
          .catch((err) => {
            console.error("Failed to fetch current weather:", err);
          })
          .finally(() => {
            setIsFetchingWeather(false);
          });
      }
    }
  }, [editingLog, isOpen, logs, activeFarm?.farm_id]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const payload = {
        activity_type: formData.activity_type,
        fertilizer_type: formData.activity_type === "Fertilization" ? formData.fertilizer_type : "None",
        fertilizer_amount: formData.activity_type === "Fertilization" ? (parseFloat(formData.fertilizer_amount) || 0.0) : 0.0,
        pest_control: formData.activity_type === "Pest/Disease Spraying" ? formData.pest_control : "None",
        temperature: parseFloat(formData.temperature) || 0.0,
        rainfall: parseFloat(formData.rainfall) || 0.0,
        soil_ph: parseFloat(formData.soil_ph) || 0.0,
        remarks: formData.remarks,
        farm_id: activeFarm?.farm_id
      };

      // Check if online or offline
      const isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;
      if (!isOnline) {
        try {
          const { saveOfflineLog } = await import('@/utils/offline-db');
          const offlinePayload = {
            ...payload,
            log_date: new Date().toISOString() // Pre-fill log_date so the UI renders it nicely
          };
          await saveOfflineLog(offlinePayload);
          alert("Saved Offline: Connection offline. Your activity has been saved locally and will auto-sync when connection is restored.");
          
          // Reset form fields
          setFormData({
            activity_type: "Fertilization",
            fertilizer_type: "NPK 15-15-15", 
            fertilizer_amount: "",
            temperature: "", 
            rainfall: "", 
            soil_ph: "", 
            remarks: "",
            pest_control: "None",
          });

          if (onSubmit) {
            onSubmit(payload, true);
          }
        } catch (dbErr) {
          console.error("Failed to save log offline:", dbErr);
          alert("Failed to save activity offline: " + dbErr.message);
        } finally {
          submittingRef.current = false;
          setIsSubmitting(false);
        }
        return;
      }

      await onSubmit(payload);
      // Reset form fields
      setFormData({
        activity_type: "Fertilization",
        fertilizer_type: "NPK 15-15-15", 
        fertilizer_amount: "",
        temperature: "", 
        rainfall: "", 
        soil_ph: "", 
        remarks: "",
        pest_control: "None",
      });
    } catch (error) {
      console.error(error);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex justify-center items-end sm:items-center p-0 sm:p-4">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-white w-full sm:max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl relative z-10 animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto thin-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-extrabold text-green-900">
              {editingLog ? "Edit Activity Record" : "New Activity"}
            </h3>
            <div className="flex items-center gap-1.5 text-gray-400 mt-1">
              <Info size={12} className="text-green-500" />
              <p className="text-[10px] font-black uppercase tracking-wider">
                Farm Target: {activeFarm?.farm_name || "Unknown Farm"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-gray-100 rounded-full text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Activity Type Selector */}
          <div className="relative">
            <label className="block text-xs font-bold text-gray-400 uppercase ml-2 mb-1.5">Activity Type</label>
            <CustomSelect 
              name="activity_type"
              value={formData.activity_type}
              onChange={handleChange}
              options={activityTypeOptions}
            />
          </div>

          {/* Fertilizer Type (Conditionally rendered) */}
          {formData.activity_type === "Fertilization" && (
            <div className="relative">
              <label className="block text-xs font-bold text-gray-400 uppercase ml-2 mb-1.5">Fertilizer Type</label>
              <CustomSelect 
                name="fertilizer_type"
                value={formData.fertilizer_type}
                onChange={handleChange}
                options={fertilizerTypeOptions}
                icon={Beaker}
              />
            </div>
          )}

          {/* Amount & pH Layout */}
          {formData.activity_type === "Fertilization" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase ml-2 mb-1.5 truncate">Total Amount (kg)</label>
                <input 
                  type="number" 
                  name="fertilizer_amount"
                  value={formData.fertilizer_amount}
                  onChange={handleChange}
                  step="0.01"
                  required={formData.activity_type === "Fertilization"}
                  placeholder="e.g., 150.00"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 text-sm font-semibold text-gray-700 transition-all" 
                />
                <span className="text-[9px] text-gray-400 mt-1 block ml-2 leading-tight">
                  Total weight.
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 ml-2 mb-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase">Soil pH</label>
                  <div className="group relative cursor-pointer">
                    <Info size={13} className="text-gray-400 hover:text-green-600 transition-colors" />
                    <div className="absolute right-0 bottom-full mb-2 w-48 p-3 bg-gray-900 text-white text-[10px] font-semibold leading-relaxed rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 shadow-xl z-50 text-center">
                      Use composite soil sample average. Test and update every 2-3 months.
                      <div className="absolute top-full right-2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <input 
                  type="number" 
                  name="soil_ph"
                  value={formData.soil_ph}
                  onChange={handleChange}
                  step="0.1"
                  required
                  placeholder="e.g., 6.2"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 text-sm font-semibold text-gray-700 transition-all" 
                />
                <span className="text-[9px] text-gray-400 mt-1 block ml-2 leading-tight">
                  Soil property.
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 ml-2 mb-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase">Soil pH</label>
                <div className="group relative cursor-pointer">
                  <Info size={13} className="text-gray-400 hover:text-green-600 transition-colors" />
                  <div className="absolute right-0 bottom-full mb-2 w-48 p-3 bg-gray-900 text-white text-[10px] font-semibold leading-relaxed rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 shadow-xl z-50 text-center">
                    Use composite soil sample average. Test and update every 2-3 months.
                    <div className="absolute top-full right-2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              <input 
                type="number" 
                name="soil_ph"
                value={formData.soil_ph}
                onChange={handleChange}
                step="0.1"
                required
                placeholder="e.g., 6.2"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 text-sm font-semibold text-gray-700 transition-all" 
              />
              <span className="text-[9px] text-gray-400 mt-1 block ml-2 leading-tight">
                Soil property.
              </span>
            </div>
          )}

          {/* Temp & Rain (Always display as weather stats are universal) */}
          <div className="relative">
            <div className="flex justify-between items-center ml-2 mb-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Weather Conditions</span>
              {isFetchingWeather ? (
                <span className="text-[9px] text-green-600 font-extrabold animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                  Detecting local forecast...
                </span>
              ) : (
                !editingLog && (
                  typeof window !== 'undefined' && !window.navigator.onLine ? (
                    <span className="text-[9px] text-amber-600 font-black tracking-wider bg-amber-50 px-2 py-0.5 rounded-full uppercase">
                      Latest Known Values (Offline)
                    </span>
                  ) : (
                    <span className="text-[9px] text-emerald-600 font-black tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                      Auto-filled by Open-Meteo
                    </span>
                  )
                )
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Temp (°C)</label>
                <div className={`flex items-center gap-2 p-4 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-green-500/30 focus-within:border-green-600 transition-all ${isFetchingWeather ? 'bg-gray-100/50 animate-pulse' : 'bg-gray-50'}`}>
                  <Thermometer size={18} className="text-orange-400 flex-shrink-0" />
                  <input 
                    type="number" 
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    step="0.1"
                    required
                    disabled={isFetchingWeather}
                    placeholder={isFetchingWeather ? "..." : "28.5"}
                    className="bg-transparent outline-none w-full text-sm font-semibold text-gray-700 disabled:opacity-50" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Rainfall (mm)</label>
                <div className={`flex items-center gap-2 p-4 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-green-500/30 focus-within:border-green-600 transition-all ${isFetchingWeather ? 'bg-gray-100/50 animate-pulse' : 'bg-gray-50'}`}>
                  <Droplets size={18} className="text-blue-400 flex-shrink-0" />
                  <input 
                    type="number" 
                    name="rainfall"
                    value={formData.rainfall}
                    onChange={handleChange}
                    step="0.1"
                    required
                    disabled={isFetchingWeather}
                    placeholder={isFetchingWeather ? "..." : "120.0"}
                    className="bg-transparent outline-none w-full text-sm font-semibold text-gray-700 disabled:opacity-50" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pest Control (Conditionally rendered) */}
          {formData.activity_type === "Pest/Disease Spraying" && (
            <div className="relative">
              <label className="block text-xs font-bold text-gray-400 uppercase ml-2 mb-1.5">Pest Control Treatment</label>
              <CustomSelect 
                name="pest_control"
                value={formData.pest_control}
                onChange={handleChange}
                options={pestControlOptions}
                icon={Bot}
              />
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase ml-2 mb-1.5">Remarks / Observations</label>
            <textarea 
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="2"
              placeholder="e.g., Yellow leaves on plot 3, high wind gusts..."
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 text-sm font-semibold text-gray-700 resize-none transition-all"
            ></textarea>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`flex items-center justify-center gap-2 w-full text-white py-4.5 mt-2 rounded-[24px] font-black shadow-xl shadow-green-600/10 transition-all duration-300 ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 hover:shadow-xl hover:shadow-green-600/20 active:scale-[0.98]'
            }`}
          >
            <Save size={18} /> 
            {isSubmitting ? "SAVING..." : editingLog ? "SAVE CHANGES" : "SAVE ACTIVITY"}
          </button>
        </form>
      </div>
    </div>
  );
}

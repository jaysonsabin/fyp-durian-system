import { useState, useEffect, useRef } from 'react';
import { X, Info, Beaker, Thermometer, Droplets, Bot, Save } from 'lucide-react';
import { fetchCurrentWeather } from '@/services/dashboard';
import CustomSelect from '@/app/components/custom-select';
import { useLanguage } from '@/app/context/language_context';

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
  const { t } = useLanguage();

  const translatedActivityTypeOptions = activityTypeOptions.map(opt => {
    let label = opt.label;
    if (opt.value === "Fertilization") label = t('fertilization');
    else if (opt.value === "Pruning") label = t('pruning');
    else if (opt.value === "Irrigation") label = t('irrigation');
    else if (opt.value === "Weeding") label = t('weeding');
    else if (opt.value === "Pest/Disease Spraying") label = t('pest_spraying');
    else if (opt.value === "Fruit Tying & Thinning") label = t('fruit_tying');
    else if (opt.value === "Harvesting") label = t('harvesting');
    return { ...opt, label };
  });

  const translatedFertilizerTypeOptions = fertilizerTypeOptions.map(opt => {
    let label = opt.label;
    if (opt.value === "Organic") label = t('organic_fertilizer');
    return { ...opt, label };
  });

  const translatedPestControlOptions = pestControlOptions.map(opt => {
    let label = opt.label;
    if (opt.value === "None") label = t('no_pest_treatment');
    else if (opt.value === "Fungicide (Canker)") label = t('fungicide');
    else if (opt.value === "Insecticide (Borers)") label = t('insecticide');
    else if (opt.value === "Organic (Neem)") label = t('organic_neem');
    return { ...opt, label };
  });

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
          alert(t('saved_offline_msg'));
          
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
          alert(t('failed_offline_save') + dbErr.message);
        } finally {
          setTimeout(() => {
            submittingRef.current = false;
            setIsSubmitting(false);
          }, 1000);
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
      setTimeout(() => {
        submittingRef.current = false;
        setIsSubmitting(false);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex justify-center items-end sm:items-center p-0 sm:p-4">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-white w-full sm:max-w-md rounded-t-lg sm:rounded-lg p-8 shadow-2xl relative z-10 animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto thin-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-green-900">
              {editingLog ? t('edit_activity_record') : t('new_activity')}
            </h3>
            <div className="flex items-center gap-1.5 text-gray-500 mt-1">
              <Info size={12} className="text-green-500" />
              <p className="text-[14px] font-semibold tracking-wider">
                {activeFarm?.farm_name || "Unknown Farm"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 bg-gray-100 rounded-full text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Activity Type Selector */}
          <div className="relative">
            <label className="block text-[12px] font-bold text-gray-500 uppercase ml-2 mb-1.5">{t('activity_type')}</label>
            <CustomSelect 
              name="activity_type"
              value={formData.activity_type}
              onChange={handleChange}
              options={translatedActivityTypeOptions}
            />
          </div>

          {/* Fertilizer Type (Conditionally rendered) */}
          {formData.activity_type === "Fertilization" && (
            <div className="relative">
              <label className="block text-[12px] font-bold text-gray-500 uppercase ml-2 mb-1.5">{t('fertilizer_type')}</label>
              <CustomSelect 
                name="fertilizer_type"
                value={formData.fertilizer_type}
                onChange={handleChange}
                options={translatedFertilizerTypeOptions}
                icon={Beaker}
              />
            </div>
          )}

          {/* Amount & pH Layout */}
          {formData.activity_type === "Fertilization" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] sm:text-xs font-bold text-gray-500 uppercase ml-2 mb-1.5 truncate">{t('total_amount')}</label>
                <input 
                  type="number" 
                  name="fertilizer_amount"
                  value={formData.fertilizer_amount}
                  onChange={handleChange}
                  step="0.01"
                  required={formData.activity_type === "Fertilization"}
                  placeholder="e.g., 150.00"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 text-sm font-semibold text-gray-700 transition-all" 
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 ml-2 mb-1.5">
                  <label className="text-[12px] sm:text-xs font-bold text-gray-500 uppercase">{t('soil_ph')}</label>
                  <div className="group relative cursor-pointer">
                    <Info size={13} className="text-gray-500 hover:text-green-600 transition-colors" />
                    <div className="absolute right-0 bottom-full mb-2 w-48 p-3 bg-gray-900 text-white text-[10px] font-semibold leading-relaxed rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 shadow-xl z-50 text-center">
                      {t('composite_soil_info')}
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
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 text-sm font-semibold text-gray-700 transition-all" 
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 ml-2 mb-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('soil_ph')}</label>
                <div className="group relative cursor-pointer">
                  <Info size={13} className="text-gray-500 hover:text-green-600 transition-colors" />
                  <div className="absolute right-0 bottom-full mb-2 w-48 p-3 bg-gray-900 text-white text-[10px] font-semibold leading-relaxed rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 shadow-xl z-50 text-center">
                    {t('composite_soil_info')}
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
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 text-sm font-semibold text-gray-700 transition-all" 
              />
              <span className="text-[10px] text-gray-500 mt-1 block ml-2 leading-tight">
                {t('soil_ph')}.
              </span>
            </div>
          )}

          {/* Temp & Rain (Always display as weather stats are universal) */}
          <div className="relative">
            <div className="flex justify-between items-center ml-2 mb-1.5">
              <span className="text-[12px] font-bold text-gray-500 uppercase">{t('weather_conditions')}</span>
              {isFetchingWeather ? (
                <span className="text-[11px] text-green-600 font-extrabold animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                  {t('detecting_weather')}
                </span>
              ) : (
                !editingLog && (
                  typeof window !== 'undefined' && !window.navigator.onLine ? (
                    <span className="text-[10px] text-amber-600 font-black tracking-wider bg-amber-50 px-2 py-0.5 rounded-full uppercase">
                      {t('latest_known_offline')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-black tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">
                      {t('autofilled_weather')}
                    </span>
                  )
                )
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className={`flex items-center gap-2 p-4 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-green-500/30 focus-within:border-green-600 transition-all ${isFetchingWeather ? 'bg-gray-100/50 animate-pulse' : 'bg-gray-50'}`}>
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
                <label className="text-[12px] text-gray-500 mt-1 block ml-2 leading-tight">{t('temperature_c')}</label>
              </div>
              <div>
                <div className={`flex items-center gap-2 p-4 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-green-500/30 focus-within:border-green-600 transition-all ${isFetchingWeather ? 'bg-gray-100/50 animate-pulse' : 'bg-gray-50'}`}>
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
                <label className="text-[12px] text-gray-500 mt-1 block ml-2 leading-tight">{t('rainfall_mm')}</label>
              </div>
            </div>
          </div>

          {/* Pest Control (Conditionally rendered) */}
          {formData.activity_type === "Pest/Disease Spraying" && (
            <div className="relative">
              <label className="block text-[12px] font-bold text-gray-500 uppercase ml-2 mb-1.5">{t('pest_treatment')}</label>
              <CustomSelect 
                name="pest_control"
                value={formData.pest_control}
                onChange={handleChange}
                options={translatedPestControlOptions}
                icon={Bot}
              />
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-[12px] font-bold text-gray-500 uppercase ml-2 mb-1.5">{t('remarks')}</label>
            <textarea 
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="2"
              placeholder={t('remarks_placeholder')}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 text-sm font-semibold text-gray-700 resize-none transition-all"
            ></textarea>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`flex items-center justify-center gap-2 w-full text-white py-4.5 mt-2 rounded-lg font-bold shadow-xl shadow-green-600/10 transition-all duration-300 ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 hover:shadow-xl hover:shadow-green-600/20 active:scale-[0.98]'
            }`}
          >
            <Save size={18} /> 
            {isSubmitting ? t('saving') : editingLog ? t('save_changes') : t('add_record')}
          </button>
        </form>
      </div>
    </div>
  );
}

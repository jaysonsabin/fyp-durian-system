import { useState, useEffect } from 'react';
import { X, Info, Beaker, Thermometer, Droplets, Bot, Save } from 'lucide-react';

export default function ActivityModal({ isOpen, onClose, activeFarm, onSubmit, editingLog }) {
  const [formData, setFormData] = useState({
    fertilizer_type: "NPK 15-15-15", 
    fertilizer_amount: "",
    temperature: "", 
    rainfall: "", 
    soil_ph: "", 
    remarks: "",
    pest_control: "None",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingLog) {
      setFormData({
        fertilizer_type: editingLog.fertilizer_type || "NPK 15-15-15",
        fertilizer_amount: editingLog.fertilizer_amount || "",
        temperature: editingLog.temperature || "",
        rainfall: editingLog.rainfall || "",
        soil_ph: editingLog.soil_ph || "",
        remarks: editingLog.remarks || "",
        pest_control: editingLog.pest_control || "None",
      });
    } else {
      setFormData({
        fertilizer_type: "NPK 15-15-15",
        fertilizer_amount: "",
        temperature: "",
        rainfall: "",
        soil_ph: "",
        remarks: "",
        pest_control: "None",
      });
    }
  }, [editingLog, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        farm_id: activeFarm?.farm_id
      });
      // Reset form fields
      setFormData({
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex justify-center items-end sm:items-center p-0 sm:p-4">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-white w-full sm:max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl relative z-10 animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
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
          {/* Fertilizer Type */}
          <div className="relative">
            <label className="block text-xs font-bold text-gray-400 uppercase ml-2 mb-1.5">Fertilizer Type</label>
            <div className="relative">
              <select 
                name="fertilizer_type"
                value={formData.fertilizer_type}
                onChange={handleChange}
                className="w-full p-4 pr-11 bg-gray-50 border border-gray-200 rounded-2xl appearance-none outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 text-sm font-semibold text-gray-700 transition-all"
              >
                <option value="NPK 15-15-15">NPK 15-15-15</option>
                <option value="Organic">Organic</option>
              </select>
              <Beaker size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Amount & pH */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase ml-2 mb-1.5">Amount (kg)</label>
              <input 
                type="number" 
                name="fertilizer_amount"
                value={formData.fertilizer_amount}
                onChange={handleChange}
                step="0.01"
                required
                placeholder="e.g., 2.50"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 text-sm font-semibold text-gray-700 transition-all" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase ml-2 mb-1.5">Soil pH</label>
              <input 
                type="number" 
                name="soil_ph"
                value={formData.soil_ph}
                onChange={handleChange}
                step="0.1"
                required
                placeholder="e.g., 6.5"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 text-sm font-semibold text-gray-700 transition-all" 
              />
            </div>
          </div>

          {/* Temp & Rain */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase ml-2 mb-1.5">Temp (°C)</label>
              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-green-500/30 focus-within:border-green-600 transition-all">
                <Thermometer size={18} className="text-orange-400 flex-shrink-0" />
                <input 
                  type="number" 
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  step="0.1"
                  required
                  placeholder="28.5"
                  className="bg-transparent outline-none w-full text-sm font-semibold text-gray-700" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase ml-2 mb-1.5">Rainfall (mm)</label>
              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-green-500/30 focus-within:border-green-600 transition-all">
                <Droplets size={18} className="text-blue-400 flex-shrink-0" />
                <input 
                  type="number" 
                  name="rainfall"
                  value={formData.rainfall}
                  onChange={handleChange}
                  step="0.1"
                  required
                  placeholder="120.0"
                  className="bg-transparent outline-none w-full text-sm font-semibold text-gray-700" 
                />
              </div>
            </div>
          </div>

          {/* Pest Control */}
          <div className="relative">
            <label className="block text-xs font-bold text-gray-400 uppercase ml-2 mb-1.5">Pest Control Treatment</label>
            <div className="relative">
              <select 
                name="pest_control"
                value={formData.pest_control}
                onChange={handleChange}
                className="w-full p-4 pr-11 bg-gray-50 border border-gray-200 rounded-2xl appearance-none outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 text-sm font-semibold text-gray-700 transition-all"
              >
                <option value="None">No Pest Treatment</option>
                <option value="Fungicide (Canker)">Fungicide (Stem Canker)</option>
                <option value="Insecticide (Borers)">Insecticide (Seed Borers)</option>
                <option value="Organic (Neem)">Organic (Neem Oil)</option>
              </select>
              <Bot size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

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

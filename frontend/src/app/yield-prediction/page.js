import { useState } from 'react';
import { Bot, Sparkles, Thermometer, Droplets, Beaker, Sprout, ArrowRight } from 'lucide-react';

export default function YieldPredictor({ activeFarm }) {
  const [params, setParams] = useState({
    temperature: 28,
    rainfall: 150,
    soilPh: 6.2,
    fertilizer: 120
  });

  const [prediction, setPrediction] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      // Basic mockup calculations to yield reasonable results
      const baseYield = 450; // kg
      const tempFactor = Math.max(0.5, 1 - Math.abs(params.temperature - 27) * 0.1);
      const rainFactor = Math.max(0.6, 1 - Math.abs(params.rainfall - 180) * 0.002);
      const phFactor = Math.max(0.4, 1 - Math.abs(params.soilPh - 6.5) * 0.3);
      const fertFactor = Math.max(0.7, 1 - Math.abs(params.fertilizer - 100) * 0.003);

      const predictedKg = Math.round(baseYield * tempFactor * rainFactor * phFactor * fertFactor);
      const gradeA = Math.round(predictedKg * 0.65);
      const gradeB = Math.round(predictedKg * 0.25);
      const gradeC = predictedKg - gradeA - gradeB;

      setPrediction({
        total: predictedKg,
        breakdown: { A: gradeA, B: gradeB, C: gradeC },
        accuracy: 94.2,
        recommendation: params.soilPh < 6.0 
          ? "Apply ground agricultural lime to raise soil pH toward the optimal 6.5 range for enhanced nutrient uptake."
          : "Your parameters are in the optimal growth window! Maintain regular fertilizer cycles and irrigation."
      });
      setIsAnalyzing(false);
    }, 1200);
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Overview Card */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex gap-4 items-start">
        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Bot size={24} />
        </div>
        <div>
          <h3 className="font-extrabold text-gray-800 text-lg">AI Yield Predictor</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Estimate seasonal harvest yields for <span className="font-bold text-green-700">{activeFarm?.farm_name || "your plantation"}</span> using Random Forest machine learning models trained on regional crop records.
          </p>
        </div>
      </div>

      {/* Simulator Inputs */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-5">
        <h4 className="font-black text-gray-700 text-sm uppercase tracking-wider">Environmental Variables</h4>
        
        <div className="space-y-4">
          {/* Temperature Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-gray-500">
              <span className="flex items-center gap-1"><Thermometer size={14} className="text-orange-400" /> Temperature</span>
              <span className="text-gray-800">{params.temperature} °C</span>
            </div>
            <input 
              type="range" min="20" max="38" step="1"
              value={params.temperature}
              onChange={(e) => setParams({ ...params, temperature: parseInt(e.target.value) })}
              className="w-full accent-green-600 bg-gray-100 rounded-lg appearance-none h-1.5 cursor-pointer"
            />
          </div>

          {/* Rainfall Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-gray-500">
              <span className="flex items-center gap-1"><Droplets size={14} className="text-blue-400" /> Monthly Rainfall</span>
              <span className="text-gray-800">{params.rainfall} mm</span>
            </div>
            <input 
              type="range" min="50" max="350" step="10"
              value={params.rainfall}
              onChange={(e) => setParams({ ...params, rainfall: parseInt(e.target.value) })}
              className="w-full accent-green-600 bg-gray-100 rounded-lg appearance-none h-1.5 cursor-pointer"
            />
          </div>

          {/* pH Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-gray-500">
              <span className="flex items-center gap-1"><Beaker size={14} className="text-violet-400" /> Soil pH</span>
              <span className="text-gray-800">{params.soilPh}</span>
            </div>
            <input 
              type="range" min="4.5" max="8.0" step="0.1"
              value={params.soilPh}
              onChange={(e) => setParams({ ...params, soilPh: parseFloat(e.target.value) })}
              className="w-full accent-green-600 bg-gray-100 rounded-lg appearance-none h-1.5 cursor-pointer"
            />
          </div>

          {/* Fertilizer Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-gray-500">
              <span className="flex items-center gap-1"><Sprout size={14} className="text-emerald-500" /> Fertilizer Volume</span>
              <span className="text-gray-800">{params.fertilizer} kg/hectare</span>
            </div>
            <input 
              type="range" min="20" max="250" step="5"
              value={params.fertilizer}
              onChange={(e) => setParams({ ...params, fertilizer: parseInt(e.target.value) })}
              className="w-full accent-green-600 bg-gray-100 rounded-lg appearance-none h-1.5 cursor-pointer"
            />
          </div>
        </div>

        <button 
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className={`w-full py-4.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-600/10 transition-all duration-300 ${
            isAnalyzing 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-xl hover:shadow-green-600/20 active:scale-[0.98]'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
              <span>RUNNING FOREST DYNAMICS...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>RUN RANDOM FOREST ANALYSIS</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Results Display */}
      {prediction && !isAnalyzing && (
        <div className="bg-white p-6 rounded-[32px] shadow-md border border-green-50 space-y-5 animate-in slide-in-from-bottom-6 duration-300">
          <div className="flex justify-between items-center border-b border-gray-50 pb-3">
            <h4 className="font-extrabold text-green-900 text-md flex items-center gap-1.5">
              <Sparkles size={16} className="text-green-600" />
              Predicted Output
            </h4>
            <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
              ACCURACY: {prediction.accuracy}%
            </span>
          </div>

          <div className="flex items-baseline justify-center gap-1.5 py-4">
            <span className="text-4xl font-black text-green-800">{prediction.total}</span>
            <span className="text-sm font-bold text-gray-500">kg / hectare</span>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="text-center">
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Grade A</span>
              <p className="font-black text-gray-800 mt-2 text-md">{prediction.breakdown.A} kg</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Grade B</span>
              <p className="font-black text-gray-800 mt-2 text-md">{prediction.breakdown.B} kg</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Grade C</span>
              <p className="font-black text-gray-800 mt-2 text-md">{prediction.breakdown.C} kg</p>
            </div>
          </div>

          <div className="bg-green-50/50 p-4.5 rounded-2xl border border-green-100/30 flex gap-3">
            <Bot size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-green-800 leading-relaxed font-semibold">
              <p className="font-black uppercase text-[10px] text-green-700 tracking-wider mb-0.5">Recommendation</p>
              {prediction.recommendation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

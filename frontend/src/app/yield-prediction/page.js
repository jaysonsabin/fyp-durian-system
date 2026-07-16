"use client";

import { useState, useEffect } from 'react';
import { Bot, Sparkles, Thermometer, Droplets, Beaker, Sprout, Brain, AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/context/auth_context';
import { useLanguage } from '@/app/context/language_context';
import { fetchYieldPrediction } from '@/services/dashboard';

export default function YieldPredictor({ activeFarm }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [prediction, setPrediction] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch initial predictions & baseline averages when activeFarm changes
  useEffect(() => {
    const loadPrediction = async () => {
      if (!activeFarm || !user) return;
      try {
        setIsAnalyzing(true);
        setError(null);
        setPrediction(null);
        // Call backend without params to run prediction on farm's actual log averages
        const res = await fetchYieldPrediction(activeFarm.farm_id, user.token);
        if (res && res.error) {
          setError(res.error);
        } else {
          setPrediction(res);
        }
      } catch (err) {
        console.error("Failed to load prediction:", err);
        setError(err.message || "Unable to retrieve farm activity statistics.");
      } finally {
        setIsAnalyzing(false);
      }
    };

    loadPrediction();
  }, [activeFarm, user]);

  const hasNoLogs = error && error.includes("No activity logs");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Overview / Banner Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex gap-4 items-start">
        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Brain size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-600 text-[12px] tracking-wider uppercase">{t('yield_ai')}</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {t('yield_desc')} ({activeFarm?.farm_name || t('my_plantations')})
          </p>
        </div>
      </div>

      {isAnalyzing && (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">{t('training_models')}</span>
        </div>
      )}

      {error && !hasNoLogs && !isAnalyzing && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-100 flex items-center gap-3 text-xs font-semibold">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {hasNoLogs && !isAnalyzing && (
        <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/20 p-8 rounded-lg border border-green-100/50 shadow-sm text-center space-y-4 animate-in fade-in zoom-in-95 duration-400">
          <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Sprout size={32} />
          </div>
          <div className="max-w-xs mx-auto">
            <h4 className="font-bold text-gray-800 text-base">{t('calibration_required')}</h4>
            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
              {t('calibration_desc')}
            </p>
          </div>
          <div className="text-[11px] text-green-800 bg-green-50/80 px-4 py-3 rounded-lg border border-green-100/30 inline-block max-w-sm font-semibold leading-relaxed">
            {t('navigate_records_desc')}
          </div>
        </div>
      )}

      {/* Model Predictions and Baseline display */}
      {prediction && !isAnalyzing && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-6 duration-400">
          
          {/* Read-Only Baselines Panel */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
            <h4 className="font-bold text-gray-600 text-xs uppercase tracking-wider">{t('environmental_baseline')}</h4>
            <div className="grid grid-cols-2 gap-3.5">
              
              {/* Temp Metric */}
              <div className="bg-orange-50/40 p-4 rounded-lg border border-orange-100/30 flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-100/80 text-orange-600 rounded-lg flex items-center justify-center">
                  <Thermometer size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{t('temperature')}</span>
                  <p className="font-bold text-gray-800 text-sm mt-0.5">{prediction.derived_inputs.temperature} °C</p>
                </div>
              </div>

              {/* Rain Metric */}
              <div className="bg-blue-50/40 p-4 rounded-lg border border-blue-100/30 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100/80 text-blue-600 rounded-lg flex items-center justify-center">
                  <Droplets size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{t('rainfall')}</span>
                  <p className="font-bold text-gray-800 text-sm mt-0.5">{prediction.derived_inputs.rainfall} mm</p>
                </div>
              </div>

              {/* pH Metric */}
              <div className="bg-violet-50/40 p-4 rounded-lg border border-violet-100/30 flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-100/80 text-violet-600 rounded-lg flex items-center justify-center">
                  <Beaker size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{t('soil_ph')}</span>
                  <p className="font-bold text-gray-800 text-sm mt-0.5">{prediction.derived_inputs.soil_ph}</p>
                </div>
              </div>

              {/* Fertilizer Metric */}
              <div className="bg-emerald-50/40 p-4 rounded-lg border border-emerald-100/30 flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100/80 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Sprout size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{t('fertilizer')}</span>
                  <p className="font-bold text-gray-800 text-sm mt-0.5">{prediction.derived_inputs.fertilizer} kg/ha</p>
                </div>
              </div>

            </div>
            <p className="text-[10px] text-gray-500 leading-normal italic text-center">
              {t('baseline_desc')}
            </p>
          </div>

          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <h4 className="text-[12px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={16} className="text-green-600" />
              {t('predicted_yield')}
            </h4>
          </div>

          <p className="text-[11px] text-gray-500 italic leading-relaxed -mt-2 px-1">
            {t('yield_disclaimer')}
          </p>

          <div className="grid grid-cols-1 gap-4">
            
            {/* Random Forest Regressor Model Card */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('random_forest')}</span>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">
                  {t('model_fit')}: {prediction.random_forest.accuracy}%
                </span>
              </div>
              <div className="flex items-baseline justify-start gap-1 py-1">
                <span className="text-3xl font-bold text-green-800">{prediction.random_forest.yield_predicted}</span>
                <span className="text-xs font-bold text-gray-500">{t('kg_ha')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                <div className="text-center">
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">{t('grade_a')}</span>
                  <p className="font-bold text-gray-700 mt-1.5 text-xs">{prediction.random_forest.grade_a} kg</p>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">{t('grade_b')}</span>
                  <p className="font-bold text-gray-700 mt-1.5 text-xs">{prediction.random_forest.grade_b} kg</p>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">{t('grade_c')}</span>
                  <p className="font-bold text-gray-700 mt-1.5 text-xs">{prediction.random_forest.grade_c} kg</p>
                </div>
              </div>
            </div>

            {/* Linear Regression Model Card */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('linear_regression')}</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                  {t('model_fit')}: {prediction.linear_regression.accuracy}%
                </span>
              </div>
              <div className="flex items-baseline justify-start gap-1 py-1">
                <span className="text-3xl font-bold text-blue-800">{prediction.linear_regression.yield_predicted}</span>
                <span className="text-xs font-bold text-gray-500">{t('kg_ha')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                <div className="text-center">
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">{t('grade_a')}</span>
                  <p className="font-bold text-gray-700 mt-1.5 text-xs">{prediction.linear_regression.grade_a} kg</p>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">{t('grade_b')}</span>
                  <p className="font-bold text-gray-700 mt-1.5 text-xs">{prediction.linear_regression.grade_b} kg</p>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">{t('grade_c')}</span>
                  <p className="font-bold text-gray-700 mt-1.5 text-xs">{prediction.linear_regression.grade_c} kg</p>
                </div>
              </div>
            </div>

          </div>

          {/* AI Recommendation Context Box */}
          {/*<div className="bg-green-50/50 p-5 rounded-lg border border-green-100/40 flex gap-3.5">
            <Bot size={22} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-green-800 leading-relaxed font-semibold">
              <p className="font-bold uppercase text-[10px] text-green-700 tracking-wider mb-1">{t('ai_reco_title')}</p>
              {prediction.recommendation}
            </div>
          </div> */}

        </div>
      )}

    </div>
  );
}

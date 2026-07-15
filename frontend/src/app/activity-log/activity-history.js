"use client";

import { useState } from 'react';
import { Calendar, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/app/context/language_context';

export default function ActivityHistory({ logs, isLoading, onEditLog, onDeleteLog }) {
  const { t, language } = useLanguage();

  const [activeFilter, setActiveFilter] = useState("All");
  const [expandedMonths, setExpandedMonths] = useState({});
  const [expandedLogId, setExpandedLogId] = useState(null);

  const getActivityName = (type) => {
    switch (type) {
      case "Fertilization": return t('fertilization');
      case "Pruning": return t('pruning');
      case "Irrigation": return t('irrigation');
      case "Weeding": return t('weeding');
      case "Pest/Disease Spraying": return t('pest_spraying');
      case "Fruit Tying & Thinning": return t('fruit_tying');
      case "Harvesting": return t('harvesting');
      default: return type;
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === 'ms' ? 'ms-MY' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return t('recent_activity');
    }
  };

  const getMonthKey = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === 'ms' ? 'ms-MY' : 'en-US', { month: 'long', year: 'numeric' });
    } catch (e) {
      return "Archive";
    }
  };

  const toggleMonth = (monthKey) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-green-500/20 border-t-green-600 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-gray-400 animate-pulse">{t('retrieving_records')}</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 px-6">
        <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="font-bold text-gray-700">{t('no_activities')}</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
          {t('no_activities_desc')}
        </p>
      </div>
    );
  }

  // 1. Calculate stats for the current calendar month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthLogs = logs.filter(log => {
    const date = new Date(log.log_date || log.createdAt);
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  });

  const totalFertilizer = currentMonthLogs
    .filter(l => l.activity_type === "Fertilization")
    .reduce((sum, l) => sum + (parseFloat(l.fertilizer_amount) || 0.0), 0.0);

  const totalIrrigation = currentMonthLogs
    .filter(l => l.activity_type === "Irrigation")
    .length;

  const totalSpraying = currentMonthLogs
    .filter(l => l.activity_type === "Pest/Disease Spraying")
    .length;

  // Get localized name for current month
  const currentMonthName = now.toLocaleDateString(language === 'ms' ? 'ms-MY' : 'en-US', { month: 'long' });

  // 2. Filter logs client-side
  const filteredLogs = logs.filter(log => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Others") {
      return !["Fertilization", "Irrigation", "Pest/Disease Spraying"].includes(log.activity_type);
    }
    return log.activity_type === activeFilter;
  });

  // 3. Group filtered logs by Month
  const monthlyLogs = filteredLogs.reduce((groups, log) => {
    const key = getMonthKey(log.log_date || log.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
    return groups;
  }, {});

  const months = Object.keys(monthlyLogs);

  const filterOptions = [
    { value: "All", label: t('tag_all') },
    { value: "Fertilization", label: t('fertilization') },
    { value: "Irrigation", label: t('irrigation') },
    { value: "Pest/Disease Spraying", label: t('pest_spraying') },
    { value: "Others", label: t('others') }
  ];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Dynamic Summary Dashboard Panel */}
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest block mb-3">
          {t('ops_summary')} ({currentMonthName} {currentYear})
        </span>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 text-center">
            <span className="text-[10px] font-bold text-gray-400 tracking-widest block mb-0.5">{t('fertilizer_applied')}</span>
            <span className="text-base font-bold text-green-800">{totalFertilizer.toFixed(1)} kg</span>
          </div>
          <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 text-center">
            <span className="text-[10px] font-bold text-gray-400 tracking-widest block mb-0.5">{t('watering_frequency')}</span>
            <span className="text-base font-bold text-green-800">{totalIrrigation}</span>
          </div>
          <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 text-center">
            <span className="text-[10px] font-bold text-gray-400 tracking-widest block mb-0.5">{t('pest_sprays')}</span>
            <span className="text-base font-bold text-green-800">{totalSpraying}</span>
          </div>
        </div>
      </div>

      {/* Minimalist Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setActiveFilter(opt.value);
              setExpandedLogId(null); // Reset detail expand when filter changes
            }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === opt.value
                ? "bg-green-600 border-green-600 text-white shadow-sm shadow-green-600/10" 
                : "bg-white border-gray-100 text-gray-400 hover:text-green-600 hover:bg-green-50/30"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Accordion List Header */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('activity_history_title')}</h3>
        <span className="text-[10px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
          {filteredLogs.length} {filteredLogs.length === 1 ? t('record') : t('records_label')}
        </span>
      </div>

      {/* Grouped Month Accordions */}
      <div className="space-y-3">
        {months.map((monthKey, idx) => {
          const isMonthOpen = expandedMonths[monthKey] !== undefined
            ? expandedMonths[monthKey]
            : idx === 0; // First month expanded by default
          
          const monthLogs = monthlyLogs[monthKey];

          return (
            <div key={monthKey} className="space-y-2">
              {/* Collapsible Divider */}
              <button
                onClick={() => toggleMonth(monthKey)}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-zinc-100/90 border border-gray-100 rounded-lg shadow-xs transition-colors text-xs font-bold text-gray-700 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {isMonthOpen ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-400" />}
                  <span>{monthKey}</span>
                </div>
                <span className="text-[10px] bg-gray-200/80 text-gray-600 px-2 py-0.5 rounded-full font-bold font-mono">
                  {monthLogs.length}
                </span>
              </button>

              {/* Log Cards within the Month */}
              {isMonthOpen && (
                <div className="pl-2 border-l border-gray-200/60 ml-2 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  {monthLogs.map((log, logIdx) => {
                    const isExpanded = expandedLogId === log.log_id;
                    const isOffline = log.pendingSync;

                    return (
                      <div
                        key={log.log_id || `log-${logIdx}`}
                        className={`bg-white rounded-lg border border-gray-100 transition-all shadow-sm ${
                          isExpanded ? "shadow-md border-gray-200" : "hover:shadow-md hover:border-gray-200/50 hover:-translate-y-0.5"
                        }`}
                      >
                        {/* Summary Header Row (Click to expand) */}
                        <div
                          onClick={() => setExpandedLogId(isExpanded ? null : log.log_id)}
                          className="p-4 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <h4 className="font-extrabold text-green-600 text-xs truncate">
                              {log.activity_type === "Fertilization"
                                ? `${t('fertilization')}: ${log.fertilizer_type === 'Organic' ? t('organic_fertilizer') : log.fertilizer_type}`
                                : getActivityName(log.activity_type)}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Calendar size={10} className="text-gray-300" />
                                {formatDate(log.log_date || log.createdAt)}
                              </span>
                              {isOffline && (
                                <span className="text-[8px] bg-amber-50 text-amber-600 px-1 py-0.5 rounded font-black uppercase tracking-wider animate-pulse">
                                  {t('pending_sync')}
                                </span>
                              )}
                              {!isOffline && logIdx === 0 && idx === 0 && (
                                <span className="text-[9px] bg-green-50 text-green-700 px-1 py-0.5 rounded font-bold tracking-wider">
                                  {t('latest')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-green-800">
                              {log.activity_type === "Fertilization" ? `${log.fertilizer_amount} kg` : ""}
                            </span>
                            {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                          </div>
                        </div>

                        {/* Collapsible Details Body */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-gray-50 bg-gray-50/10 text-xs text-gray-600 space-y-3 animate-in slide-in-from-top-1 duration-100">
                            
                            {/* Environmental Parameters Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100 text-[10px]">
                              {log.activity_type === "Fertilization" && (
                                <div>
                                  <span className="text-gray-450 font-bold uppercase text-[9px] block tracking-wide">{t('amount_label')}</span>
                                  <span className="font-extrabold text-green-800 mt-0.5 block">{log.fertilizer_amount} kg</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-450 font-bold uppercase text-[9px] block tracking-wide">{t('soil_ph')}</span>
                                <span className="font-extrabold text-green-800 mt-0.5 block">{log.soil_ph}</span>
                              </div>
                              <div>
                                <span className="text-gray-450 font-bold uppercase text-[9px] block tracking-wide">{t('temp_label')}</span>
                                <span className="font-extrabold text-green-800 mt-0.5 block">{log.temperature} °C</span>
                              </div>
                              <div>
                                <span className="text-gray-450 font-bold uppercase text-[9px] block tracking-wide">{t('rainfall_label')}</span>
                                <span className="font-extrabold text-green-800 mt-0.5 block">{log.rainfall} mm</span>
                              </div>
                            </div>

                            {/* Pest spraying details */}
                            {log.pest_control && log.pest_control !== "None" && (
                              <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200 text-[9px] font-bold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                {t('pest_control_label')}: {log.pest_control === "Fungicide (Canker)" ? t('fungicide') : (log.pest_control === "Insecticide (Borers)" ? t('insecticide') : (log.pest_control === "Organic (Neem)" ? t('organic_neem') : log.pest_control))}
                              </div>
                            )}

                            {/* Remarks */}
                            {log.remarks && (
                              <p className="text-gray-500 italic border-l border-gray-300 pl-3 leading-relaxed">
                                "{log.remarks}"
                              </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-1 pt-2 border-t border-gray-100/50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isOffline && onEditLog) onEditLog(log);
                                }}
                                disabled={isOffline}
                                className={`px-2 py-1 text-[9px] font-bold rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                                  isOffline
                                    ? "text-gray-300 bg-transparent"
                                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                }`}
                                title={isOffline ? t('cannot_edit_offline') : t('edit_activity')}
                              >
                                <Edit2 size={10} />
                                <span>{t('edit_label')}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isOffline && onDeleteLog) onDeleteLog(log.log_id);
                                }}
                                disabled={isOffline}
                                className={`px-2 py-1 text-[9px] font-bold rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                                  isOffline
                                    ? "text-gray-300 bg-transparent"
                                    : "text-gray-600 hover:text-red-650 hover:bg-red-50"
                                }`}
                                title={isOffline ? t('cannot_delete_offline') : t('delete_activity')}
                              >
                                <Trash2 size={10} />
                                <span>{t('delete_label')}</span>
                              </button>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

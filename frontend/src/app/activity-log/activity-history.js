import { Calendar, Trash2, Edit2 } from 'lucide-react';
import { useLanguage } from '@/app/context/language_context';

export default function ActivityHistory({ logs, isLoading, onEditLog, onDeleteLog }) {
  const { t } = useLanguage();

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
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return t('recent_activity');
    }
  };

  const getActivityBadge = (type) => {
    switch (type) {
      case "Fertilization":
        return { label: t('fertilization'), color: "bg-emerald-50 text-emerald-700 border-emerald-100" };
      case "Pruning":
        return { label: t('pruning'), color: "bg-blue-50 text-blue-700 border-blue-100" };
      case "Irrigation":
        return { label: t('irrigation'), color: "bg-cyan-50 text-cyan-700 border-cyan-100" };
      case "Weeding":
        return { label: t('weeding'), color: "bg-amber-50 text-amber-700 border-amber-100" };
      case "Pest/Disease Spraying":
        return { label: t('pest_spraying'), color: "bg-purple-50 text-purple-700 border-purple-100" };
      case "Fruit Tying & Thinning":
        return { label: t('fruit_tying'), color: "bg-rose-50 text-rose-700 border-rose-100" };
      case "Harvesting":
        return { label: t('harvesting'), color: "bg-orange-50 text-orange-700 border-orange-100" };
      default:
        return { label: type || t('activity_type'), color: "bg-gray-50 text-gray-700 border-gray-100" };
    }
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

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-lg font-bold text-gray-700">{t('activity_history_title')}</h3>
        <span className="text-[11px] bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
          {logs.length} {logs.length === 1 ? t('record') : t('records_label')}
        </span>
      </div>

      <div className="space-y-4">
        {logs.map((log, index) => {
          const badge = getActivityBadge(log.activity_type);

          // Force yellow border for offline records
          const borderClass = log.pendingSync
            ? "border-l-amber-500 bg-amber-50/5"
            : ("border-l-gray-400");

          return (
            <div
              key={log.log_id || `offline-${index}`}
              className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group`}
            >

              <div className="flex items-start justify-between mb-1">
                <h4 className="font-bold text-green-600 text-base leading-tight">
                  {log.activity_type === "Fertilization" ? `${t('fertilization')}: ${log.fertilizer_type === 'Organic' ? t('organic_fertilizer') : log.fertilizer_type}` : getActivityName(log.activity_type)}
                </h4>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => !log.pendingSync && onEditLog && onEditLog(log)}
                    disabled={log.pendingSync}
                    className={`p-1 rounded-lg transition-colors ${log.pendingSync
                      ? 'text-gray-200 cursor-not-allowed opacity-50'
                      : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                      }`}
                    title={log.pendingSync ? t('cannot_edit_offline') : t('edit_activity')}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => !log.pendingSync && onDeleteLog && onDeleteLog(log.log_id)}
                    disabled={log.pendingSync}
                    className={`p-1 rounded-lg transition-colors ${log.pendingSync
                      ? 'text-gray-200 cursor-not-allowed opacity-50'
                      : 'text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                      }`}
                    title={log.pendingSync ? t('cannot_delete_offline') : t('delete_activity')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-semibold text-gray-500 tracking-wider flex items-center gap-1">
                    <Calendar size={12} className="text-gray-400" />
                    {formatDate(log.log_date || log.createdAt)}
                  </span>
                  {index === 0 && !log.pendingSync && (
                    <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-sm font-bold tracking-wider">
                      {t('latest')}
                    </span>
                  )}
                  {log.pendingSync && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-bold bg-amber-100 text-amber-600 border border-amber-100 animate-pulse tracking-wider">
                      {t('pending_sync')}
                    </span>
                  )}
                </div>
              </div>

              <div className={`grid ${log.activity_type === "Fertilization" ? "grid-cols-2 md:grid-cols-4" : "grid-cols-3"} gap-3 bg-gray-50/50 p-3 rounded-md border border-gray-200 text-xs mb-3`}>
                {log.activity_type === "Fertilization" && (
                  <div>
                    <p className="text-gray-500 font-bold text-[9px] tracking-wider mb-0.5">{t('amount_label')}</p>
                    <p className="font-extrabold text-gray-600">{log.fertilizer_amount} kg</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 font-bold text-[9px] tracking-wider mb-0.5">{t('soil_ph')}</p>
                  <p className="font-extrabold text-gray-600">{log.soil_ph}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-bold text-[9px] tracking-wider mb-0.5">{t('temp_label')}</p>
                  <p className="font-extrabold text-gray-600">{log.temperature} °C</p>
                </div>
                <div>
                  <p className="text-gray-500 font-bold text-[9px] tracking-wider mb-0.5">{t('rainfall_label')}</p>
                  <p className="font-extrabold text-gray-600">{log.rainfall} mm</p>
                </div>
              </div>

              {log.pest_control && log.pest_control !== "None" && (
                <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-xl text-xs font-semibold mb-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  {t('pest_control_label')}: {log.pest_control === "Fungicide (Canker)" ? t('fungicide') : (log.pest_control === "Insecticide (Borers)" ? t('insecticide') : (log.pest_control === "Organic (Neem)" ? t('organic_neem') : log.pest_control))}
                </div>
              )}

              {log.remarks && (
                <p className="text-gray-500 italic border-l-2 border-green-200 pl-3 mt-2 text-xs leading-relaxed">
                  "{log.remarks}"
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

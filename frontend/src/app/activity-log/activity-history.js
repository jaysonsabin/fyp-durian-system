import { Calendar, Trash2, Edit2 } from 'lucide-react';

export default function ActivityHistory({ logs, isLoading, onEditLog, onDeleteLog }) {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (e) {
      return "Recent Activity";
    }
  };

  const getActivityBadge = (type) => {
    switch (type) {
      case "Fertilization": 
        return { label: "Fertilization", color: "bg-emerald-50 text-emerald-700 border-emerald-100" };
      case "Pruning": 
        return { label: "Pruning", color: "bg-blue-50 text-blue-700 border-blue-100" };
      case "Irrigation": 
        return { label: "Irrigation", color: "bg-cyan-50 text-cyan-700 border-cyan-100" };
      case "Weeding": 
        return { label: "Weeding", color: "bg-amber-50 text-amber-700 border-amber-100" };
      case "Pest/Disease Spraying": 
        return { label: "Pest Spraying", color: "bg-purple-50 text-purple-700 border-purple-100" };
      case "Fruit Tying & Thinning": 
        return { label: "Thinning/Tying", color: "bg-rose-50 text-rose-700 border-rose-100" };
      case "Harvesting": 
        return { label: "Harvesting", color: "bg-orange-50 text-orange-700 border-orange-100" };
      default: 
        return { label: type || "Activity", color: "bg-gray-50 text-gray-700 border-gray-100" };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-green-500/20 border-t-green-600 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-gray-400 animate-pulse">Retrieving records...</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 px-6">
        <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="font-bold text-gray-700">No activities recorded yet.</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
          Tap the "+" button below to log your first farm activity record.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-lg font-bold text-gray-700">Farm Activity History</h3>
        <span className="text-[11px] bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
          {logs.length} {logs.length === 1 ? 'Record' : 'Records'}
        </span>
      </div>
      
      <div className="space-y-4">
        {logs.map((log, index) => {
          const badge = getActivityBadge(log.activity_type);
          const borderColors = {
            "Fertilization": "border-l-emerald-500",
            "Pruning": "border-l-blue-500",
            "Irrigation": "border-l-cyan-500",
            "Weeding": "border-l-amber-500",
            "Pest/Disease Spraying": "border-l-purple-500",
            "Fruit Tying & Thinning": "border-l-rose-500",
            "Harvesting": "border-l-orange-500"
          };
          
          // Force yellow border for offline records
          const borderClass = log.pendingSync 
            ? "border-l-amber-500 bg-amber-50/5" 
            : (borderColors[log.activity_type] || "border-l-gray-400");

          return (
            <div 
              key={log.log_id || `offline-${index}`} 
              className={`bg-white p-5 rounded-3xl shadow-sm border border-l-4 ${borderClass} border-y-gray-100/85 border-r-gray-100/85 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                    <span>{badge.emoji}</span>
                    <span>{badge.label}</span>
                  </span>
                  
                  {log.pendingSync && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-200 animate-pulse uppercase tracking-wider">
                    Pending Sync
                    </span>
                  )}

                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={12} className="text-gray-300" />
                    {formatDate(log.log_date || log.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {index === 0 && !log.pendingSync && (
                    <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                      Latest
                    </span>
                  )}
                  <button
                    onClick={() => !log.pendingSync && onEditLog && onEditLog(log)}
                    disabled={log.pendingSync}
                    className={`p-1 rounded-lg transition-colors ${
                      log.pendingSync 
                        ? 'text-gray-200 cursor-not-allowed opacity-50' 
                        : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                    }`}
                    title={log.pendingSync ? "Cannot edit unsynced offline log" : "Edit activity"}
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => !log.pendingSync && onDeleteLog && onDeleteLog(log.log_id)}
                    disabled={log.pendingSync}
                    className={`p-1 rounded-lg transition-colors ${
                      log.pendingSync 
                        ? 'text-gray-200 cursor-not-allowed opacity-50' 
                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                    }`}
                    title={log.pendingSync ? "Cannot delete unsynced offline log" : "Delete activity"}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              
              <h4 className="font-black text-green-800 text-lg leading-tight mb-2">
                {log.activity_type === "Fertilization" ? `Fertilization: ${log.fertilizer_type}` : log.activity_type}
              </h4>
              
              <div className={`grid ${log.activity_type === "Fertilization" ? "grid-cols-2 md:grid-cols-4" : "grid-cols-3"} gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 text-xs mb-3`}>
                {log.activity_type === "Fertilization" && (
                  <div>
                    <p className="text-gray-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">Amount</p>
                    <p className="font-extrabold text-gray-700">{log.fertilizer_amount} kg</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">Soil pH</p>
                  <p className="font-extrabold text-gray-700">{log.soil_ph}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">Temp</p>
                  <p className="font-extrabold text-gray-700">{log.temperature} °C</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">Rainfall</p>
                  <p className="font-extrabold text-gray-700">{log.rainfall} mm</p>
                </div>
              </div>

              {log.pest_control && log.pest_control !== "None" && (
                <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-xl text-xs font-semibold mb-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  Pest Control: {log.pest_control}
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

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
          Tap the "+" button below to log your first fertilizer or pest control application.
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
        {logs.map((log, index) => (
          <div 
            key={log.log_id || index} 
            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100/80 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} className="text-gray-300" />
                {formatDate(log.log_date)}
              </span>
              <div className="flex items-center gap-1.5">
                {index === 0 && (
                  <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    Latest
                  </span>
                )}
                <button
                  onClick={() => onEditLog && onEditLog(log)}
                  className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-lg transition-colors cursor-pointer"
                  title="Edit activity"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => onDeleteLog && onDeleteLog(log.log_id)}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer"
                  title="Delete activity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            
            <h4 className="font-black text-green-800 text-lg leading-tight mb-2">
              {log.fertilizer_type || "General Treatment"}
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 text-xs mb-3">
              <div>
                <p className="text-gray-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">Amount</p>
                <p className="font-extrabold text-gray-700">{log.fertilizer_amount} kg</p>
              </div>
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
        ))}
      </div>
    </div>
  );
}

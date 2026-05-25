"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import CustomSelect from '@/app/components/custom-select';


// Shared Layout Components
import BottomNav from '@/app/components/bottom_nav';
import Library from '@/app/e-library/page';
import { useAuth } from '@/app/context/auth_context';
import { useLanguage } from '@/app/context/language_context';

// Dashboard Modular Subcomponents
import FarmCreationLock from '@/app/activity-log/components/farm-creation-lock';
import ProfilePanel from '@/app/activity-log/components/side-panel';
import ActivityHistory from '@/app/activity-log/activity-history';
import YieldPredictor from '@/app/yield-prediction/page';
import Forum from '@/app/forum/page';
import ActivityModal from '@/app/activity-log/activity-modal';

// Dedicated Centralized API Services
import { fetchFarms, fetchLogs, createFarm, createActivityLog, updateActivityLog, deleteActivityLog } from '@/services/dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const { t } = useLanguage();
  
  // Navigation and Modal Visibility States
  const [activeModule, setActiveModule] = useState('records');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);

  // If Admin, force activeModule to forum/library and bypass farm creation check!
  useEffect(() => {
    if (user?.role === 'Pentadbir') {
      if (activeModule === 'records' || activeModule === 'yield') {
        setActiveModule('forum');
      }
    }
  }, [user, activeModule]);
  
  // Data States
  const [userFarms, setUserFarms] = useState([]);
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);
  const [activeFarm, setActiveFarm] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const isSyncingRef = useRef(false);

  // 1. Fetch user farms
  const fetchFarmsData = async () => {
    if (!user) return;
    if (user.role === 'Pentadbir') {
      setIsLoadingFarms(false);
      return;
    }
    try {
      setIsLoadingFarms(true);
      const farms = await fetchFarms(user.id, user.token);
      setUserFarms(farms);
      
      if (farms.length > 0) {
        // If activeFarm is already set and exists in the loaded list, keep it; otherwise set to farms[0]
        setActiveFarm((prev) => {
          const exists = prev && farms.some(f => f.farm_id === prev.farm_id);
          const nextActive = exists ? farms.find(f => f.farm_id === prev.farm_id) : farms[0];
          fetchLogsData(nextActive.farm_id);
          return nextActive;
        });
      }
    } catch (error) {
      console.error("Error fetching farms:", error);
    } finally {
      setIsLoadingFarms(false);
    }
  };

  // 2. Fetch activity logs for a farm (merging API logs + local offline logs)
  const fetchLogsData = async (farmId) => {
    if (!user) return;
    try {
      setIsLoadingLogs(true);
      
      let apiLogs = [];
      try {
        apiLogs = await fetchLogs(farmId, user.token);
      } catch (err) {
        console.warn("Failed to fetch logs from API (offline?):", err);
      }

      // Query local IndexedDB for pending logs
      let pendingLogs = [];
      try {
        const { getOfflineLogs } = await import('@/utils/offline-db');
        const allPending = await getOfflineLogs();
        pendingLogs = allPending.filter(log => log.farm_id === farmId);
        console.log(`[IndexedDB] Loaded ${pendingLogs.length} pending logs for farm ${farmId}:`, pendingLogs);
      } catch (dbErr) {
        console.error("Failed to read offline logs from IndexedDB:", dbErr);
      }

      const formattedApiLogs = [...apiLogs].reverse();
      setLogs([...pendingLogs, ...formattedApiLogs]);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Background synchronization listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncOfflineQueue = async () => {
      if (isSyncingRef.current) return;
      if (!activeFarm || !user) return;
      
      isSyncingRef.current = true;
      try {
        const performSync = async () => {
          const { getOfflineLogs, deleteOfflineLog } = await import('@/utils/offline-db');
          const allPending = await getOfflineLogs();
          
          if (allPending.length === 0) {
            return;
          }

          console.log(`Auto-sync triggered! Syncing ${allPending.length} pending logs...`);
          
          for (const log of allPending) {
            try {
              // Strip client-side temp id, pendingSync, and createdAt before sending to API
              const { id, pendingSync, createdAt, ...apiPayload } = log;
              await createActivityLog(apiPayload, user.token);
              // Delete from IndexedDB upon successful upload
              await deleteOfflineLog(id);
            } catch (err) {
              console.error(`Failed to sync offline log with ID ${log.id}:`, err);
            }
          }

          // Refresh lists
          if (activeFarm) {
            fetchLogsData(activeFarm.farm_id);
          }
        };

        if (typeof navigator !== 'undefined' && navigator.locks) {
          await navigator.locks.request('sync_offline_logs_lock', { ifAvailable: true }, async (lock) => {
            if (!lock) {
              console.log("[Sync] Another instance or tab is already syncing. Aborting sync.");
              return;
            }
            await performSync();
          });
        } else {
          await performSync();
        }
      } catch (err) {
        console.error("Sync error:", err);
      } finally {
        isSyncingRef.current = false;
      }
    };

    window.addEventListener('online', syncOfflineQueue);
    
    // Trigger sync immediately if online
    if (navigator.onLine) {
      syncOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', syncOfflineQueue);
    };
  }, [activeFarm?.farm_id, user]);

  // 3. Auth Check Route Protection
  useEffect(() => {
    if (!loading && !user) {
      router.push('/'); 
    }
  }, [user, loading, router]);

  // 4. Initial Fetch Effect
  useEffect(() => {
    if (user) {
      if (user.role === 'Pentadbir') {
        setIsLoadingFarms(false);
      } else {
        fetchFarmsData();
      }
    }
  }, [user]);

  // 5. Operations handlers passed to components
  const handleCreateFirstFarm = async (farmName, farmLocation) => {
    try {
      await createFarm(farmName, farmLocation, user.id, user.token);
      await fetchFarmsData();
    } catch (error) {
      console.error("Error creating first farm:", error);
      alert(t('alert_farm_create_failed'));
      throw error;
    }
  };

  const handleFarmChange = (farmId) => {
    const selected = userFarms.find(f => f.farm_id === parseInt(farmId, 10));
    if (selected) {
      setActiveFarm(selected);
      fetchLogsData(selected.farm_id);
    }
  };

  const handleSubmitActivity = async (formData, isOffline = false) => {
    if (isOffline) {
      setShowRecordModal(false);
      setEditingLog(null);
      if (activeFarm) {
        fetchLogsData(activeFarm.farm_id);
      }
      return;
    }

    try {
      if (editingLog) {
        await updateActivityLog(editingLog.log_id, formData, user.token);
        setEditingLog(null);
        alert(t('alert_log_updated'));
      } else {
        await createActivityLog(formData, user.token);
        alert(t('alert_log_saved'));
      }
      setShowRecordModal(false);
      if (activeFarm) {
        fetchLogsData(activeFarm.farm_id);
      }
    } catch (error) {
      console.error("Error saving activity:", error);
      alert(t('alert_log_save_failed'));
      throw error;
    }
  };

  const handleEditLog = (log) => {
    setEditingLog(log);
    setShowRecordModal(true);
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm(t('confirm_delete_log'))) {
      try {
        await deleteActivityLog(logId, user.token);
        if (activeFarm) {
          fetchLogsData(activeFarm.farm_id);
        }
        alert(t('alert_log_deleted'));
      } catch (error) {
        console.error("Error deleting log:", error);
        alert(t('alert_log_delete_failed'));
      }
    }
  };

  // Loading Screen while session is validating
  if (loading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-green-500 font-bold text-sm tracking-wide">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
          <span>{t('loading_environment')}</span>
        </div>
      </div>
    );
  }

  // Interceptor: Force farm creation if zero exist
  if (user?.role !== 'Pentadbir' && !isLoadingFarms && userFarms.length === 0) {
    return (
      <FarmCreationLock 
        onAddFarm={handleCreateFirstFarm} 
        onLogout={logout} 
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-emerald-500/10 bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-gray-800 capitalize tracking-tight">{activeModule === 'yield' ? t('yield_ai') : t(activeModule)}</h2>
          {user?.role !== 'Pentadbir' && activeFarm && userFarms.length > 0 && (
            <div className="relative mt-1">
              <CustomSelect 
                name="active_farm_id"
                value={activeFarm.farm_id}
                onChange={(e) => handleFarmChange(e.target.value)}
                options={userFarms.map((farm) => ({
                  value: farm.farm_id,
                  label: farm.farm_name
                }))}
                buttonClassName="appearance-none bg-green-50/80 hover:bg-green-100/80 text-green-700 font-extrabold text-[10px] uppercase tracking-wider pl-3 pr-8 py-1.5 rounded-xl border border-green-100 outline-none cursor-pointer transition-all duration-300 flex items-center justify-between gap-1"
                chevronSize={10}
                containerClassName="inline-block"
                menuClassName="absolute left-0 mt-1.5 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-[150] py-1 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200 thin-scrollbar"
              />
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsProfilePanelOpen(true)} 
          className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-100 transition-all duration-300"
        >
          <User size={18} />
        </button>
      </header>


      {/* Profile Sidebar Panel */}
      <ProfilePanel 
        isOpen={isProfilePanelOpen} 
        onClose={() => setIsProfilePanelOpen(false)} 
        onLogout={logout} 
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-5 pb-32">
        <div className="w-full max-w-5xl mx-auto">
          {activeModule === 'records' && (
            <ActivityHistory 
              logs={logs} 
              isLoading={isLoadingLogs} 
              onEditLog={handleEditLog}
              onDeleteLog={handleDeleteLog}
            />
          )}

          {activeModule === 'yield' && (
            <YieldPredictor 
              activeFarm={activeFarm} 
            />
          )}

          {activeModule === 'forum' && (
            <Forum 
              currentUser={user} 
            />
          )}

          {activeModule === 'library' && (
            <Library />
          )}
        </div>
      </main>

      {/* Bottom Sticky Navigation */}
      <BottomNav 
        activeModule={activeModule} 
        setActiveModule={setActiveModule} 
        setShowRecordModal={setShowRecordModal} 
        userRole={user?.role}
      />

      {/* Add/Edit Activity Modal Form */}
      <ActivityModal 
        isOpen={showRecordModal} 
        onClose={() => {
          setShowRecordModal(false);
          setEditingLog(null);
        }} 
        activeFarm={activeFarm} 
        onSubmit={handleSubmitActivity} 
        editingLog={editingLog}
        logs={logs}
      />
    </div>
  );
}

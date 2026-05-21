"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';

// Shared Layout Components
import BottomNav from '@/app/components/bottom_nav';
import Library from '@/app/e-library/page';
import { useAuth } from '@/app/context/auth_context';

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
  
  // Navigation and Modal Visibility States
  const [activeModule, setActiveModule] = useState('records');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  
  // Data States
  const [userFarms, setUserFarms] = useState([]);
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // 1. Fetch user farms
  const fetchFarmsData = async () => {
    if (!user) return;
    try {
      setIsLoadingFarms(true);
      const farms = await fetchFarms(user.id, user.token);
      setUserFarms(farms);
      
      if (farms.length > 0) {
        fetchLogsData(farms[0].farm_id);
      }
    } catch (error) {
      console.error("Error fetching farms:", error);
    } finally {
      setIsLoadingFarms(false);
    }
  };

  // 2. Fetch activity logs for a farm
  const fetchLogsData = async (farmId) => {
    if (!user) return;
    try {
      setIsLoadingLogs(true);
      const data = await fetchLogs(farmId, user.token);
      setLogs([...data].reverse()); 
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // 3. Auth Check Route Protection
  useEffect(() => {
    if (!loading && !user) {
      router.push('/'); 
    }
  }, [user, loading, router]);

  // 4. Initial Fetch Effect
  useEffect(() => {
    if (user) {
      fetchFarmsData();
    }
  }, [user]);

  // 5. Operations handlers passed to components
  const handleCreateFirstFarm = async (farmName, farmLocation) => {
    try {
      await createFarm(farmName, farmLocation, user.id, user.token);
      await fetchFarmsData();
    } catch (error) {
      console.error("Error creating first farm:", error);
      alert("Failed to create farm partition.");
      throw error;
    }
  };

  const handleSubmitActivity = async (formData) => {
    try {
      if (editingLog) {
        await updateActivityLog(editingLog.log_id, formData, user.token);
        setEditingLog(null);
        alert("Activity updated successfully!");
      } else {
        await createActivityLog(formData, user.token);
        alert("Activity saved successfully!");
      }
      setShowRecordModal(false);
      if (userFarms.length > 0) {
        fetchLogsData(userFarms[0].farm_id);
      }
    } catch (error) {
      console.error("Error saving activity:", error);
      alert("Failed to save activity. Check console for details.");
      throw error;
    }
  };

  const handleEditLog = (log) => {
    setEditingLog(log);
    setShowRecordModal(true);
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm("Are you sure you want to permanently delete this activity log record?")) {
      try {
        await deleteActivityLog(logId, user.token);
        if (userFarms.length > 0) {
          fetchLogsData(userFarms[0].farm_id);
        }
        alert("Activity log deleted successfully.");
      } catch (error) {
        console.error("Error deleting log:", error);
        alert("Failed to delete activity log.");
      }
    }
  };

  // Loading Screen while session is validating
  if (loading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-green-500 font-bold text-sm tracking-wide">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
          <span>Loading DurianFlow Secure Environment...</span>
        </div>
      </div>
    );
  }

  // Interceptor: Force farm creation if zero exist
  if (!isLoadingFarms && userFarms.length === 0) {
    return (
      <FarmCreationLock 
        onAddFarm={handleCreateFirstFarm} 
        onLogout={logout} 
      />
    );
  }

  const activeFarm = userFarms[0];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 min-h-screen">
      {/* Top Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800 capitalize tracking-tight">{activeModule}</h2>
          {activeFarm && (
            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-0.5">
              {activeFarm.farm_name}
            </p>
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
        <div className="max-w-md mx-auto">
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
      />
    </div>
  );
}

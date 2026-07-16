"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth_context';
import { useLanguage } from '@/app/context/language_context';
import { useToast } from '@/app/context/toast_context';
import { useConfirm } from '@/app/context/confirm_context';
import { 
  ArrowLeft, User, MapPin, Save, Plus, 
  Home, Sprout, ShieldCheck, Edit2, Trash2, Check, X 
} from 'lucide-react';
import { updateFarm, deleteFarm } from '@/services/dashboard';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8001";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // -- UI States --
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAddingFarm, setIsAddingFarm] = useState(false);

  // -- Data States --
  const [farms, setFarms] = useState([]);
  
  // Profile Form State
  const [profileData, setProfileData] = useState({
    full_name: "",
    address: ""
  });

  // New Farm Form State
  const [newFarmData, setNewFarmData] = useState({
    farm_name: "",
    farm_location: ""
  });

  // Editing Farm State
  const [editingFarmId, setEditingFarmId] = useState(null);
  const [editFarmData, setEditFarmData] = useState({ farm_name: "", farm_location: "" });
  const [isUpdatingFarm, setIsUpdatingFarm] = useState(false);

  const handleStartEditFarm = (farm) => {
    setEditingFarmId(farm.farm_id);
    setEditFarmData({
      farm_name: farm.farm_name,
      farm_location: farm.farm_location
    });
  };

  const handleCancelEditFarm = () => {
    setEditingFarmId(null);
    setEditFarmData({ farm_name: "", farm_location: "" });
  };

  const handleEditFarmChange = (e) => {
    setEditFarmData({ ...editFarmData, [e.target.name]: e.target.value });
  };

  const handleSaveFarm = async (farmId) => {
    if (!editFarmData.farm_name.trim() || !editFarmData.farm_location.trim()) {
      showToast(t('alert_farm_fields_empty'), "error");
      return;
    }
    setIsUpdatingFarm(true);
    try {
      await updateFarm(farmId, editFarmData, user.token);
      setEditingFarmId(null);
      fetchFarms();
      showToast(t('alert_farm_updated'));
    } catch (error) {
      console.error("Error updating farm:", error);
      showToast(t('alert_farm_update_failed'), "error");
    } finally {
      setIsUpdatingFarm(false);
    }
  };

  const handleDeleteFarm = async (farmId) => {
    const ok = await confirm({
      title: t('delete_plantation'),
      message: t('confirm_delete_farm'),
      confirmLabel: t('delete'),
      cancelLabel: t('cancel')
    });
    if (!ok) return;
    try {
      await deleteFarm(farmId, user.token);
      fetchFarms();
      showToast(t('alert_farm_deleted'));
    } catch (error) {
      console.error("Error deleting farm:", error);
      showToast(t('alert_farm_delete_failed'), "error");
    }
  };

  // 1. Fetch Existing Farms
  const fetchFarms = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE}/farms/${user.id}`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setFarms(data);
      }
    } catch (error) {
      console.error("Error fetching farms:", error);
    }
  };

  // 2. Fetch User Profile Data
  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE}/users/${user.id}/profile`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setProfileData({
          full_name: data.full_name || "",
          address: data.address || ""
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // 3. COMBINED LIFECYCLE HOOK (Replaced your two conflicting ones)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/'); 
    } else if (user) {
      fetchFarms();
      fetchUserProfile(); 
    }
  }, [user, loading, router]);

  // 4. Handlers
  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleFarmChange = (e) => {
    setNewFarmData({ ...newFarmData, [e.target.name]: e.target.value });
  };

  // 5. LIVE ACTION: Save Updated Profile back to FastAPI
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    
    try {
      const response = await fetch(`${API_BASE}/users/${user.id}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          full_name: profileData.full_name,
          address: profileData.address
        })
      });

      if (response.ok) {
        showToast(t('alert_profile_synced'));
      } else {
        showToast(t('alert_profile_sync_failed'), "error");
      }
    } catch (error) {
      console.error("Network error saving profile:", error);
      showToast(t('alert_cannot_connect'), "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 6. Add New Farm
  const handleAddFarm = async (e) => {
    e.preventDefault();
    setIsAddingFarm(true);

    try {
      const response = await fetch(`${API_BASE}/farms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          farm_name: newFarmData.farm_name,
          farm_location: newFarmData.farm_location,
          farmer_id: parseInt(user.id)
        }),
      });

      if (response.ok) {
        setNewFarmData({ farm_name: '', farm_location: '' });
        fetchFarms();
        showToast(t('alert_farm_added'));
      } else {
        showToast(t('alert_farm_add_failed'), "error");
      }
    } catch (error) {
      console.error("Network error:", error);
      showToast(t('alert_cannot_connect'), "error");
    } finally {
      setIsAddingFarm(false);
    }
  };

  if (loading || !user) return <div className="h-screen w-screen bg-gray-900"></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center gap-4 shadow-sm sticky top-0 z-20">
        <button
          onClick={() => router.push('/activity-log')}
          aria-label={t('cancel')}
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">{t('account_settings')}</h2>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-50 text-green-600 border border-green-100 rounded-lg flex items-center justify-center">
              <Sprout size={22} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('my_plantations')}</span>
              <span className="text-lg font-bold text-gray-800">{farms.length} {t('active')}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('account')}</span>
              <span className="text-lg font-bold text-gray-800">{user?.role === 'Pentadbir' ? t('admin_status') : t('verified_grower')}</span>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <section className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-50 text-green-600 border border-green-100 rounded-lg flex items-center justify-center">
              <User size={22} />
            </div>
            <div>
              <h3 className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">{t('personal_details')}</h3>
              <p className="text-xs text-gray-500 mt-1">{t('update_profile')}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase ml-2 mb-2">{t('fullname_label')}</label>
              <input 
                type="text" 
                name="full_name"
                value={profileData.full_name}
                onChange={handleProfileChange}
                placeholder="e.g., Ahmad Bin Abdullah"
                required
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white transition-all text-sm font-semibold text-gray-800 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase ml-2 mb-2">{t('address_label')}</label>
              <textarea 
                name="address"
                value={profileData.address}
                onChange={handleProfileChange}
                rows="2"
                placeholder="Your residential address..."
                required
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white transition-all text-sm font-semibold text-gray-800 placeholder-gray-400 resize-none"
              ></textarea>
            </div>
            <button 
              type="submit" 
              disabled={isSavingProfile}
              className={`w-full text-white py-4 rounded-lg font-bold shadow-lg shadow-green-600/10 transition-all active:scale-95 cursor-pointer ${
                isSavingProfile
                  ? 'bg-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSavingProfile ? t('saving') : t('save_changes')}
            </button>
          </form>
        </section>

        {/* Farm Management Section */}
        <section className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-50 text-green-600 border border-green-100 rounded-lg flex items-center justify-center">
                <Sprout size={22} />
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">{t('my_plantations')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('manage_locations')}</p>
              </div>
            </div>
            <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg font-bold text-sm">
              {farms.length} {t('registered')}
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {farms.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-gray-500 text-sm font-medium">
                {t('no_plantations')}
              </div>
            ) : (
              farms.map((farm) => {
                const isEditing = editingFarmId === farm.farm_id;
                return (
                  <div 
                    key={farm.farm_id} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg transition-all ${
                      isEditing 
                        ? 'border-green-500 bg-green-50/20' 
                        : 'border-gray-100 hover:border-green-200 hover:bg-green-50/50'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex-1 flex flex-col sm:flex-row gap-3 mr-4">
                        <input
                          type="text"
                          name="farm_name"
                          value={editFarmData.farm_name}
                          onChange={handleEditFarmChange}
                          placeholder={t('plantation_name')}
                          className="flex-1 p-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm font-semibold text-gray-700"
                        />
                        <input
                          type="text"
                          name="farm_location"
                          value={editFarmData.farm_location}
                          onChange={handleEditFarmChange}
                          placeholder={t('location_region')}
                          className="flex-1 p-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm font-semibold text-gray-700"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-50 border border-gray-100 text-gray-500 rounded-full flex items-center justify-center transition-colors">
                          <Home size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{farm.farm_name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 flex-wrap">
                            <MapPin size={10} className="text-green-600" />
                            <span>{farm.farm_location}</span>
                            {farm.latitude !== null && farm.longitude !== null && (
                              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                                GPS: {Number(farm.latitude).toFixed(4)}, {Number(farm.longitude).toFixed(4)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-3 sm:mt-0 justify-end">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveFarm(farm.farm_id)}
                            disabled={isUpdatingFarm}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
                            aria-label={t('save_changes')}
                            title={t('save_changes')}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={handleCancelEditFarm}
                            className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                            aria-label={t('cancel')}
                            title={t('cancel')}
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEditFarm(farm)}
                            className="p-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-green-50 hover:text-green-600 transition-colors cursor-pointer"
                            aria-label={t('edit_plantation')}
                            title={t('edit_plantation')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteFarm(farm.farm_id)}
                            className="p-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                            aria-label={t('delete_plantation')}
                            title={t('delete_plantation')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-green-500" />
              {t('register_new_farm')}
            </h4>
            <form onSubmit={handleAddFarm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  name="farm_name"
                  value={newFarmData.farm_name}
                  onChange={handleFarmChange}
                  placeholder={t('plantation_name')}
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />
                <input 
                  type="text" 
                  name="farm_location"
                  value={newFarmData.farm_location}
                  onChange={handleFarmChange}
                  placeholder={t('location_region')}
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button 
                type="submit" 
                disabled={isAddingFarm}
                className={`w-full text-white py-4 rounded-lg font-bold shadow-md transition-all ${isAddingFarm ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isAddingFarm ? t('adding') : t('add_plantation')}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
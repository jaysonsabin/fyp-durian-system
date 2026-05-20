"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth_context';
import { 
  ArrowLeft, User, MapPin, Save, Plus, 
  Home, Sprout, ShieldCheck 
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

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

  // 1. Fetch Existing Farms
  const fetchFarms = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:8001/farms/${user.id}`, {
        headers: { "Authorization": `Bearer ${user.token}` }
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
      const response = await fetch(`http://localhost:8001/users/${user.id}/profile`, {
        headers: { "Authorization": `Bearer ${user.token}` }
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
      const response = await fetch(`http://localhost:8001/users/${user.id}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          full_name: profileData.full_name,
          address: profileData.address
        })
      });

      if (response.ok) {
        alert("Profile details synchronized successfully!");
      } else {
        alert("Failed to update profile records on backend.");
      }
    } catch (error) {
      console.error("Network error saving profile:", error);
      alert("Cannot connect to server.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 6. Add New Farm
  const handleAddFarm = async (e) => {
    e.preventDefault();
    setIsAddingFarm(true);

    try {
      const response = await fetch("http://localhost:8001/farms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          farm_name: newFarmData.farm_name,
          farm_location: newFarmData.farm_location,
          farmer_id: parseInt(user.id)
        }),
      });

      if (response.ok) {
        setNewFarmData({ farm_name: '', farm_location: '' });
        fetchFarms(); 
        alert("New plantation added successfully!");
      } else {
        alert("Failed to add farm.");
      }
    } catch (error) {
      console.error("Network error:", error);
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
          onClick={() => router.push('/dashboard')}
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Account Settings</h2>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Profile Section */}
        <section className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Personal Details</h3>
              <p className="text-sm text-gray-500">Update your farmer profile</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase ml-2 mb-2">Full Name</label>
              <input 
                type="text" 
                name="full_name"
                value={profileData.full_name}
                onChange={handleProfileChange}
                placeholder="e.g., Ahmad Bin Abdullah"
                required
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase ml-2 mb-2">Home Address</label>
              <textarea 
                name="address"
                value={profileData.address}
                onChange={handleProfileChange}
                rows="2"
                placeholder="Your residential address..."
                required
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              ></textarea>
            </div>
            <button 
              type="submit" 
              disabled={isSavingProfile}
              className={`w-full text-white py-4 rounded-2xl font-bold shadow-md transition-all ${isSavingProfile ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isSavingProfile ? "SAVING..." : "SAVE CHANGES"}
            </button>
          </form>
        </section>

        {/* Farm Management Section */}
        <section className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                <Sprout size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">My Plantations</h3>
                <p className="text-sm text-gray-500">Manage your farm locations</p>
              </div>
            </div>
            <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg font-bold text-sm">
              {farms.length} Registered
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {farms.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-medium">
                No plantations found. Add one below.
              </div>
            ) : (
              farms.map((farm) => (
                <div key={farm.farm_id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:border-green-200 hover:bg-green-50/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                      <Home size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{farm.farm_name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {farm.farm_location}
                      </p>
                    </div>
                  </div>
                  <ShieldCheck size={20} className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            )}
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-green-500" />
              Register New Farm
            </h4>
            <form onSubmit={handleAddFarm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  name="farm_name"
                  value={newFarmData.farm_name}
                  onChange={handleFarmChange}
                  placeholder="Farm Name"
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500"
                />
                <input 
                  type="text" 
                  name="farm_location"
                  value={newFarmData.farm_location}
                  onChange={handleFarmChange}
                  placeholder="City / Region"
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button 
                type="submit" 
                disabled={isAddingFarm}
                className={`w-full text-white py-4 rounded-2xl font-bold shadow-md transition-all ${isAddingFarm ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isAddingFarm ? "ADDING..." : "ADD PLANTATION"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
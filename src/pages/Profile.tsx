import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Bell, 
  CreditCard, 
  ChevronRight, 
  Camera,
  Award,
  History,
  Lock,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  Edit2,
  Save,
  X,
  Flame,
  Sparkles,
  Utensils,
  Stethoscope
} from 'lucide-react';
import { Card, Button, LoadingSpinner } from '@/src/components/ui/Base';
import { cn } from '@/src/lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase';

const healthApps = [
  { name: 'Google Health', icon: 'https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png', connected: true },
  { name: 'Fitbit', icon: 'https://www.fitbit.com/favicon.ico', connected: false },
  { name: 'Apple Health', icon: 'https://www.apple.com/favicon.ico', connected: false },
  { name: 'MyFitnessPal', icon: 'https://www.myfitnesspal.com/favicon.ico', connected: true },
];

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const isRounak = user?.name?.toLowerCase().includes('rounak');

  const [userInfo, setUserInfo] = useState({
    name: user?.name || 'User',
    email: user?.email || '',
    phone: user?.phone || (isRounak ? '+1 (555) 000-0000' : ''),
    location: user?.location || (isRounak ? 'Greater Noida, UP' : ''),
    age: user?.age || (isRounak ? '21' : ''),
    gender: user?.gender || (isRounak ? 'Male' : ''),
    dietType: user?.dietType || (isRounak ? 'Vegetarian' : ''),
    occupation: user?.occupation || (isRounak ? 'Software Engineer' : ''),
    address: user?.address || (isRounak ? 'Knowledge Park III, Greater Noida' : ''),
    healthConditions: user?.healthConditions || (isRounak ? 'None' : ''),
    allergies: user?.allergies || (isRounak ? 'Peanuts, Dust' : ''),
    emergencyContacts: user?.emergencyContacts || (isRounak ? [
      { name: 'Suresh Modi', relation: 'Father', phone: '+91 98765 43210' }
    ] : []),
    insuranceDetails: user?.insuranceDetails || (isRounak ? [
      { provider: 'LIC Health plus', plan: 'Elite Care', coverage: '₹10 Lakhs per annum', policyNumber: 'LIC-8829-1029' }
    ] : []),
    specialty: user?.specialty || '',
    avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'User'}`
  });

  useEffect(() => {
    if (user) {
      setUserInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        age: user.age || '',
        gender: user.gender || '',
        dietType: user.dietType || '',
        occupation: user.occupation || '',
        address: user.address || '',
        healthConditions: user.healthConditions || '',
        allergies: user.allergies || '',
        specialty: user.specialty || '',
        emergencyContacts: user.emergencyContacts || [],
        insuranceDetails: user.insuranceDetails || [],
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid || 'User'}`
      });
    }
  }, [user]);

  const [tempAvatar, setTempAvatar] = useState(userInfo.avatar);
  const [avatarPage, setAvatarPage] = useState(0);

  const avatarStyles = [
    { style: 'avataaars', seeds: ['Rounak', 'Felix', 'Aneka', 'Milo', 'Luna', 'Oliver', 'Zoe', 'Leo', 'Jack', 'Jasper', 'Sasha', 'Toby', 'Willow', 'Bear', 'Coco', 'Daisy', 'Gracie', 'Lola', 'Molly', 'Penny'] },
    { style: 'bottts', seeds: ['Robot1', 'Robot2', 'Robot3', 'Robot4', 'Robot5', 'Shark', 'Sword', 'Shield', 'Fire', 'Water', 'Earth', 'Air', 'Sun', 'Moon', 'Star', 'Heart', 'Cloud', 'Lightning', 'Snow', 'Wind'] }
  ];

  const allAvatars = avatarStyles.flatMap(s => 
    s.seeds.map(seed => `https://api.dicebear.com/7.x/${s.style}/svg?seed=${seed}`)
  );

  const pages = [
    allAvatars.slice(0, 20),
    allAvatars.slice(20, 40)
  ];

  const handleAddEmergencyContact = () => {
    setUserInfo({
      ...userInfo,
      emergencyContacts: [
        ...userInfo.emergencyContacts,
        { name: '', relation: '', phone: '' }
      ]
    });
  };

  const handleUpdateEmergencyContact = (index: number, field: string, value: string) => {
    const updatedContacts = [...userInfo.emergencyContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setUserInfo({ ...userInfo, emergencyContacts: updatedContacts });
  };

  const handleRemoveEmergencyContact = (index: number) => {
    const updatedContacts = userInfo.emergencyContacts.filter((_, i) => i !== index);
    setUserInfo({ ...userInfo, emergencyContacts: updatedContacts });
  };

  const handleAddInsurance = () => {
    setUserInfo({
      ...userInfo,
      insuranceDetails: [
        ...userInfo.insuranceDetails,
        { provider: '', plan: '', coverage: '', policyNumber: '' }
      ]
    });
  };

  const handleUpdateInsurance = (index: number, field: string, value: string) => {
    const updatedInsurance = [...userInfo.insuranceDetails];
    updatedInsurance[index] = { ...updatedInsurance[index], [field]: value };
    setUserInfo({ ...userInfo, insuranceDetails: updatedInsurance });
  };

  const handleRemoveInsurance = (index: number) => {
    const updatedInsurance = userInfo.insuranceDetails.filter((_, i) => i !== index);
    setUserInfo({ ...userInfo, insuranceDetails: updatedInsurance });
  };

  const handleSave = async () => {
    if (!user || isSaving) return;
    
    if (user.role === 'doctor' && !userInfo.specialty) {
      alert('Specialty is required for doctors');
      return;
    }
    
    try {
      setIsSaving(true);
      const userRef = doc(db, 'users', user.uid);
      const { email, ...updateData } = userInfo; // Exclude email from update
      await updateDoc(userRef, updateData);
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // <div className="relative mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
    <Card className="relative mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 overflow-visible bg-[linear-gradient(180deg,#f8fbff_0%,#f5f8fb_38%,#eef4f3_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_58%)]" />
      <div className="pointer-events-none absolute right-8 top-52 hidden h-64 w-64 rounded-full bg-brand-100/55 blur-3xl lg:block" />
      <div className="pointer-events-none absolute left-1/3 top-96 hidden h-48 w-48 rounded-full bg-sky-100/35 blur-3xl lg:block" />
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">User Profile</h1>
          <p className="text-slate-500 font-medium">Manage your personal information and preferences.</p>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X size={18} />
                <span>Cancel</span>
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <LoadingSpinner size={18} /> : <Save size={18} />}
                <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              <Edit2 size={18} />
              <span>Edit Profile</span>
            </Button>
          )}
        </div>
      </header>

      <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-8 text-center relative overflow-visible">
            <div className="absolute top-0 left-0 right-0 h-24 bg-brand-600 rounded-t-2xl"></div>
            <div className="relative z-10 pt-4">
              <div className="relative inline-block mb-6">
                <img 
                  src={userInfo.avatar} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-3xl bg-white border-4 border-white shadow-xl"
                />
                <button 
                  onClick={() => {
                    setTempAvatar(userInfo.avatar);
                    setShowAvatarPicker(!showAvatarPicker);
                  }}
                  className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"
                >
                  <Edit2 size={18} />
                </button>

                <AnimatePresence>
                  {showAvatarPicker && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-4 p-4 md:p-6 bg-white rounded-[32px] shadow-2xl border border-slate-100 z-99 w-[90vw] max-w-[350px] max-h-[300px] overflow-y-auto"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-slate-900">Choose Your Character</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scroll Right →</span>
                      </div>
                      
                      <div className="relative">
                        <div className="grid grid-rows-4 grid-flow-col gap-3 overflow-x-auto pb-6 snap-x snap-mandatory custom-scrollbar p-1">
                          {allAvatars.map((av, i) => (
                            <button 
                              key={i}
                              onClick={() => setTempAvatar(av)}
                              className={cn(
                                "w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all hover:scale-110 shrink-0 snap-start",
                                tempAvatar === av ? "border-brand-600 bg-brand-50 shadow-md scale-110" : "border-slate-50 bg-slate-50"
                              )}
                            >
                              <img src={av} alt="Avatar Option" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 space-y-3 pt-4 border-t border-slate-100 ">
                        <Button 
                          variant="primary" 
                          className="w-full py-4 rounded-2xl shadow-lg shadow-brand-200"
                          disabled={tempAvatar === userInfo.avatar}
                          onClick={async () => {
                            setUserInfo({ ...userInfo, avatar: tempAvatar });
                            setShowAvatarPicker(false);
                            
                            // Immediately update database if not in full edit mode
                            if (!isEditing && user) {
                              try {
                                const userRef = doc(db, 'users', user.uid);
                                await updateDoc(userRef, { avatar: tempAvatar });
                              } catch (error) {
                                handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
                              }
                            }
                          }}
                        >
                          <Save size={18} />
                          <span className="text-base">Save Selection</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full py-3 border-none text-slate-400 hover:text-slate-600"
                          onClick={() => setShowAvatarPicker(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-900">{userInfo.name}</h2>
              <p className="text-slate-500 font-medium mb-6">Elite Health Member</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex flex-col items-center p-3 bg-brand-50 text-brand-700 rounded-2xl border border-brand-100">
                  <Award size={18} className="mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Role</span>
                  <span className="text-sm font-bold">Elite</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-orange-50 text-orange-700 rounded-2xl border border-orange-100">
                  <Flame size={18} className="mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Streak</span>
                  <span className="text-sm font-bold">15 Days</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">
                <Sparkles size={18} className="text-brand-400" />
                <span>98 Health Score</span>
              </div>
            </div>
          </Card>
          {/* Removed overflow-visible from this card as it was causing issues with the avatar picker */}
          <Card className="p-6">
            <h3 className="text-lg font-display font-bold text-slate-900 mb-6">Connect Health Apps</h3>
            <div className="space-y-4">
              {healthApps.map((app, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <img src={app.icon} alt={app.name} className="w-8 h-8 rounded-lg bg-white p-1 shadow-sm" />
                    <span className="text-sm font-bold text-slate-700">{app.name}</span>
                  </div>
                  {app.connected ? (
                    <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                      <CheckCircle2 size={12} />
                      <span>Connected</span>
                    </div>
                  ) : (
                    <button className="text-[10px] font-bold text-brand-600 uppercase tracking-wider hover:underline">
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Settings & Details */}
        <div className="relative space-y-6 lg:col-span-2">
          <div className="pointer-events-none absolute inset-x-4 top-8 hidden h-[26rem] rounded-[40px] bg-[linear-gradient(180deg,rgba(240,253,244,0.85),rgba(255,255,255,0.1))] blur-2xl lg:block" />
          <Card className="relative p-8 rounded-3xl border border-slate-200 bg-white shadow-md overflow-hidden">
              

            <h3 className="text-xl font-display font-bold text-slate-900 mb-8">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <AnimatePresence>
                  {isSaving && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700"
                    >
                      <LoadingSpinner size={16} />
                      <span>Saving your profile updates...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 transition-all"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-slate-700 font-medium">
                    <User size={18} className="text-slate-400" />
                    <span>{userInfo.name}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-slate-700 font-medium opacity-60">
                  <Mail size={18} className="text-slate-400" />
                  <span>{userInfo.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 transition-all"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-slate-700 font-medium">
                    <Phone size={18} className="text-slate-400" />
                    <span>{userInfo.phone}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Age</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 transition-all"
                    value={userInfo.age}
                    onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-slate-700 font-medium">
                    <History size={18} className="text-slate-400" />
                    <span>{userInfo.age} Years</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gender</label>
                {isEditing ? (
                  <select 
                    className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 transition-all"
                    value={userInfo.gender}
                    onChange={(e) => setUserInfo({ ...userInfo, gender: e.target.value })}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-slate-700 font-medium">
                    <User size={18} className="text-slate-400" />
                    <span>{userInfo.gender}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Diet Type</label>
                {isEditing ? (
                  <select 
                    className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 transition-all"
                    value={userInfo.dietType}
                    onChange={(e) => setUserInfo({ ...userInfo, dietType: e.target.value })}
                  >
                    <option value="">Select Diet Type</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-slate-700 font-medium">
                    <Utensils size={18} className="text-slate-400" />
                    <span>{userInfo.dietType}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Occupation</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 transition-all"
                    value={userInfo.occupation}
                    onChange={(e) => setUserInfo({ ...userInfo, occupation: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-slate-700 font-medium">
                    <Smartphone size={18} className="text-slate-400" />
                    <span>{userInfo.occupation}</span>
                  </div>
                )}
              </div>

              {user?.role === 'doctor' && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Specialty <span className="text-rose-500">*</span></label>
                  {isEditing ? (
                    <select 
                      className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 transition-all"
                      value={userInfo.specialty}
                      onChange={(e) => setUserInfo({ ...userInfo, specialty: e.target.value })}
                      required
                    >
                      <option value="">Select Specialty</option>
                      <option value="Physician">Physician</option>
                      <option value="Dermatologist">Dermatologist</option>
                      <option value="Dentist">Dentist</option>
                      <option value="Cardiologist">Cardiologist</option>
                      <option value="Neurologist">Neurologist</option>
                      <option value="Pediatrician">Pediatrician</option>
                      <option value="Psychiatrist">Psychiatrist</option>
                      <option value="Orthopedic">Orthopedic</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl text-brand-700 font-bold border border-brand-100">
                      <Stethoscope size={18} className="text-brand-400" />
                      <span>{userInfo.specialty || 'Not specified'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-display font-bold text-slate-900 mb-8">Medical Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Health Conditions</label>
                {isEditing ? (
                  <textarea 
                    className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 transition-all resize-none"
                    value={userInfo.healthConditions}
                    onChange={(e) => setUserInfo({ ...userInfo, healthConditions: e.target.value })}
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-700 font-medium">
                    {userInfo.healthConditions}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Allergies</label>
                {isEditing ? (
                  <textarea 
                    className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 transition-all resize-none"
                    value={userInfo.allergies}
                    onChange={(e) => setUserInfo({ ...userInfo, allergies: e.target.value })}
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-700 font-medium">
                    {userInfo.allergies}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-brand-50 border-brand-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-600 text-white rounded-lg">
                  <CreditCard size={20} />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900">Insurance Details</h3>
              </div>
              {isEditing && (
                <Button 
                  variant="outline" 
                  className="py-2 text-xs border-brand-200 text-brand-600 hover:bg-brand-100"
                  onClick={handleAddInsurance}
                >
                  Add Insurance
                </Button>
              )}
            </div>
            
            <div className="space-y-6">
              {userInfo.insuranceDetails.map((insurance, index) => (
                <div key={index} className="relative group">
                  {isEditing && userInfo.insuranceDetails.length > 1 && (
                    <button 
                      onClick={() => handleRemoveInsurance(index)}
                      className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X size={12} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl border border-brand-100">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Provider</p>
                      {isEditing ? (
                        <input 
                          type="text"
                          className="w-full p-2 bg-white border border-brand-100 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                          value={insurance.provider}
                          onChange={(e) => handleUpdateInsurance(index, 'provider', e.target.value)}
                        />
                      ) : (
                        <p className="font-bold text-slate-900">{insurance.provider || 'Not set'}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Plan Name</p>
                      {isEditing ? (
                        <input 
                          type="text"
                          className="w-full p-2 bg-white border border-brand-100 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                          value={insurance.plan}
                          onChange={(e) => handleUpdateInsurance(index, 'plan', e.target.value)}
                        />
                      ) : (
                        <p className="font-bold text-slate-900">{insurance.plan || 'Not set'}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Coverage Amount</p>
                      {isEditing ? (
                        <input 
                          type="text"
                          className="w-full p-2 bg-white border border-brand-100 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                          value={insurance.coverage}
                          onChange={(e) => handleUpdateInsurance(index, 'coverage', e.target.value)}
                        />
                      ) : (
                        <p className="font-bold text-slate-900">{insurance.coverage || 'Not set'}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Policy Number</p>
                      {isEditing ? (
                        <input 
                          type="text"
                          className="w-full p-2 bg-white border border-brand-100 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                          value={insurance.policyNumber}
                          onChange={(e) => handleUpdateInsurance(index, 'policyNumber', e.target.value)}
                        />
                      ) : (
                        <p className="font-bold text-slate-900">{insurance.policyNumber || 'Not set'}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8 bg-rose-50 border-rose-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-600 text-white rounded-lg">
                  <Shield size={20} />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900">Emergency Contacts</h3>
              </div>
              {isEditing && (
                <Button 
                  variant="outline" 
                  className="py-2 text-xs border-rose-200 text-rose-600 hover:bg-rose-100"
                  onClick={handleAddEmergencyContact}
                >
                  Add More
                </Button>
              )}
            </div>
            
            <div className="space-y-6">
              {userInfo.emergencyContacts.map((contact, index) => (
                <div key={index} className="relative group">
                  {isEditing && userInfo.emergencyContacts.length > 1 && (
                    <button 
                      onClick={() => handleRemoveEmergencyContact(index)}
                      className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X size={12} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-white/50 rounded-2xl border border-rose-100">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Name</p>
                      {isEditing ? (
                        <input 
                          type="text"
                          className="w-full p-2 bg-white border border-rose-100 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
                          value={contact.name}
                          onChange={(e) => handleUpdateEmergencyContact(index, 'name', e.target.value)}
                        />
                      ) : (
                        <p className="font-bold text-slate-900">{contact.name || 'Not set'}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Relation</p>
                      {isEditing ? (
                        <input 
                          type="text"
                          className="w-full p-2 bg-white border border-rose-100 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
                          value={contact.relation}
                          onChange={(e) => handleUpdateEmergencyContact(index, 'relation', e.target.value)}
                        />
                      ) : (
                        <p className="font-bold text-slate-900">{contact.relation || 'Not set'}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Phone</p>
                      {isEditing ? (
                        <input 
                          type="text"
                          className="w-full p-2 bg-white border border-rose-100 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
                          value={contact.phone}
                          onChange={(e) => handleUpdateEmergencyContact(index, 'phone', e.target.value)}
                        />
                      ) : (
                        <p className="font-bold text-slate-900">{contact.phone || 'Not set'}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-display font-bold text-slate-900 mb-8">Account Settings</h3>
            <div className="space-y-2">
              {[
                { icon: Bell, label: 'Notifications', desc: 'Manage your alerts and reminders', color: 'text-brand-600 bg-brand-50' },
                { icon: Lock, label: 'Security & Privacy', desc: 'Password and data protection', color: 'text-indigo-600 bg-indigo-50' },
                { icon: CreditCard, label: 'Billing & Subscription', desc: 'Manage your elite membership', color: 'text-amber-600 bg-amber-50' },
              ].map((item, i) => (
                <button key={i} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group text-left">
                  <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", item.color)}>
                    <item.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-600 transition-colors" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
}

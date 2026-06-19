import { motion } from 'motion/react';
import { Card, Button } from '@/src/components/ui/Base';
import { 
  Trophy, 
  Star, 
  ShieldCheck, 
  Gift, 
  Plane, 
  ChevronRight,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { 
    name: 'Rookie', 
    min: 0, 
    max: 99, 
    img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rookie',
    advantage: 'Appreciation & Welcome Kit',
    details: 'Start your journey with a personalized health welcome kit and community appreciation.'
  },
  { 
    name: 'Trainee', 
    min: 100, 
    max: 299, 
    img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Trainee',
    advantage: '2% Hospital Bill Discount',
    details: 'Get a flat 2% discount on all partner hospital bills and diagnostic tests.'
  },
  { 
    name: 'Fighter', 
    min: 300, 
    max: 699, 
    img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Fighter',
    advantage: '4% Discount & Free Consultation',
    details: 'Increased discount to 4% and one free online doctor consultation per month.'
  },
  { 
    name: 'Warrior', 
    min: 700, 
    max: 1499, 
    img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Warrior',
    advantage: '6% Discount & Priority Support',
    details: 'Enjoy 6% savings and priority appointment scheduling at top clinics.'
  },
  { 
    name: 'Elite', 
    min: 1500, 
    max: 2999, 
    img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Elite',
    advantage: '8% Discount & Wellness Retreat',
    details: '8% discount plus exclusive access to annual wellness retreats and spa sessions.'
  },
  { 
    name: 'Champion', 
    min: 3000, 
    max: 5999, 
    img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Champion',
    advantage: '9% Discount & Health Insurance Perk',
    details: '9% discount and premium health insurance coverage with zero co-pay.'
  },
  { 
    name: 'Legend', 
    min: 6000, 
    max: Infinity, 
    img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Legend',
    advantage: '10% Discount & Disneyland Trip!',
    details: 'The ultimate rank. 10% lifetime discount and a chance to win an all-expenses-paid trip to Disneyland!',
    specialImg: 'https://www.looopings.nl/img/foto/24/0811howvu1.jpg'
  },
];

export default function Role() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Real XP logic
  const xp = user?.xp || 0;
  
  const currentRole = ROLES.find(r => xp >= r.min && xp <= r.max) || ROLES[0];
  const currentRoleIndex = ROLES.indexOf(currentRole);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
            <Trophy className="text-amber-500" size={24} />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current XP</p>
              <p className="text-xl font-display font-bold text-slate-900">{xp} XP</p>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative rounded-[40px] overflow-hidden bg-slate-900 text-white p-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
            <img 
              src={currentRole.img} 
              alt="Role" 
              className="w-full h-full object-contain scale-150 translate-x-1/4"
            />
          </div>
          <div className="relative z-10 max-w-2xl space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600/20 text-brand-400 rounded-full text-sm font-bold border border-brand-600/30"
            >
              <Sparkles size={16} />
              Rank {currentRoleIndex + 1} of 7
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl font-display font-bold leading-tight"
            >
              You are a <span className="text-brand-500">{currentRole.name}</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-400 leading-relaxed"
            >
              {currentRole.details}
            </motion.p>
            <div className="flex items-center gap-4 pt-4">
              <Button variant="primary" className="px-8 py-6 text-lg rounded-2xl">
                Claim Rewards
              </Button>
              <Button variant="outline" className="px-8 py-6 text-lg rounded-2xl border-white/10 text-white hover:bg-white/5">
                View Benefits
              </Button>
            </div>
          </div>
        </div>

        {/* Horizontal Progress Bar */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold text-slate-900">Road to Legend</h2>
            <p className="text-sm text-slate-500 font-medium">Unlock exclusive perks as you level up</p>
          </div>

          <div className="relative py-12">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2" />
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(currentRoleIndex / (ROLES.length - 1)) * 100}%` }}
              className="absolute top-1/2 left-0 h-1 bg-brand-600 -translate-y-1/2 z-10"
            />

            <div className="relative z-20 flex justify-between">
              {ROLES.map((role, idx) => {
                const isUnlocked = idx <= currentRoleIndex;
                const isCurrent = idx === currentRoleIndex;
                
                return (
                  <div key={role.name} className="flex flex-col items-center gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center border-4 transition-all duration-500",
                        isUnlocked 
                          ? "bg-white border-brand-600 shadow-xl shadow-brand-100" 
                          : "bg-slate-100 border-slate-200 grayscale"
                      )}
                    >
                      {isUnlocked ? (
                        <img src={role.img} alt={role.name} className="w-10 h-10" />
                      ) : (
                        <Lock size={24} className="text-slate-400" />
                      )}
                    </motion.div>
                    <div className="text-center">
                      <p className={cn(
                        "text-sm font-bold",
                        isUnlocked ? "text-slate-900" : "text-slate-400"
                      )}>
                        {role.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {role.min} XP
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Advantages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ROLES.filter(r => r.name !== 'Legend').map((role, idx) => (
            <motion.div
              key={role.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Card className={cn(
                "p-8 h-full relative overflow-hidden transition-all duration-500",
                idx <= currentRoleIndex ? "border-brand-200 bg-white" : "opacity-60 bg-slate-50 border-slate-100"
              )}>
                {idx > currentRoleIndex && (
                  <div className="absolute top-4 right-4">
                    <Lock size={20} className="text-slate-300" />
                  </div>
                )}
                <div className="flex items-center gap-4 mb-6">
                  <div className={cn(
                    "p-3 rounded-xl",
                    idx <= currentRoleIndex ? "bg-brand-100 text-brand-600" : "bg-slate-200 text-slate-400"
                  )}>
                    <Gift size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-900">{role.name} Perks</h3>
                    <p className="text-xs text-slate-500 font-medium">{role.min} XP Required</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={18} className={cn("mt-0.5", idx <= currentRoleIndex ? "text-emerald-500" : "text-slate-300")} />
                    <p className="text-sm font-bold text-slate-800">{role.advantage}</p>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {role.details}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Legend Special Card */}
        {ROLES.find(r => r.name === 'Legend') && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {(() => {
              const legend = ROLES.find(r => r.name === 'Legend')!;
              const isUnlocked = xp >= legend.min;
              return (
                <Card className={cn(
                  "relative overflow-hidden border-none shadow-2xl min-h-[400px] flex flex-col md:flex-row",
                  !isUnlocked && "opacity-80"
                )}>
                  <div className="flex-1 p-12 relative z-20 bg-white flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-8">
                      <div className={cn(
                        "p-4 rounded-2xl",
                        isUnlocked ? "bg-brand-600 text-white shadow-lg shadow-brand-200" : "bg-slate-200 text-slate-400"
                      )}>
                        <Plane size={32} />
                      </div>
                      <div>
                        <h3 className="text-3xl font-display font-bold text-slate-900">Legendary Perks</h3>
                        <p className="text-sm text-slate-500 font-medium">{legend.min} XP Required</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6 max-w-md">
                      <div className="flex items-start gap-4">
                        <CheckCircle2 size={24} className={cn("mt-1", isUnlocked ? "text-emerald-500" : "text-slate-300")} />
                        <div>
                          <p className="text-xl font-bold text-slate-900">{legend.advantage}</p>
                          <p className="text-slate-500 mt-2 leading-relaxed">{legend.details}</p>
                        </div>
                      </div>
                      
                      {!isUnlocked && (
                        <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl text-slate-500 font-bold text-sm">
                          <Lock size={18} />
                          <span>Locked until you reach 6,000 XP</span>
                        </div>
                      )}
                      
                      {isUnlocked && (
                        <Button className="w-fit px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-200">
                          Claim Legend Rewards
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Image with Gradient Overlay */}
                  <div className="relative flex-1 min-h-[300px] md:min-h-full">
                    <img 
                      src={legend.specialImg} 
                      alt="Disneyland" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* The smooth gradient between white background at left to image at right */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent hidden md:block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent md:hidden" />
                    
                    <div className="absolute bottom-8 right-8 text-right">
                      <div className="bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded-2xl text-white inline-block">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80">Grand Prize</p>
                        <p className="text-2xl font-display font-bold">Disneyland Trip</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })()}
          </motion.div>
        )}
      </div>
    </div>
  );
}

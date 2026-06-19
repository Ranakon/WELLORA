import { 
  Activity, 
  Heart, 
  Moon, 
  Footprints, 
  Calendar, 
  ArrowUpRight, 
  TrendingUp,
  Bell,
  Droplets,
  Zap,
  Clock,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Circle,
  Trophy,
  Users,
  ChevronDown,
  Flame
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Card, Button } from '@/src/components/ui/Base';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { doc, updateDoc, increment, collection, onSnapshot, query, where } from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';

const data = [
  { name: 'Mon', steps: 4000, sleep: 7, kcal: 1100 },
  { name: 'Tue', steps: 3000, sleep: 6.5, kcal: 1200 },
  { name: 'Wed', steps: 2000, sleep: 8, kcal: 1000 },
  { name: 'Thu', steps: 2780, sleep: 7.2, kcal: 1300 },
  { name: 'Fri', steps: 1890, sleep: 6.8, kcal: 1150 },
  { name: 'Sat', steps: 2390, sleep: 7.5, kcal: 1400 },
  { name: 'Sun', steps: 3490, sleep: 8.2, kcal: 1240 },
];

const ROLES = [
  { name: 'Rookie', min: 0, max: 99, img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rookie' },
  { name: 'Trainee', min: 100, max: 299, img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Trainee' },
  { name: 'Fighter', min: 300, max: 699, img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Fighter' },
  { name: 'Warrior', min: 700, max: 1499, img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Warrior' },
  { name: 'Elite', min: 1500, max: 2999, img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Elite' },
  { name: 'Champion', min: 3000, max: 5999, img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Champion' },
  { name: 'Legend', min: 6000, max: Infinity, img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Legend' },
];

const StatCard = ({ icon: Icon, label, value, unit, trend, color, accent, glow, image }: any) => (
  <Card className="relative overflow-hidden border border-slate-200/80 bg-white p-0 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)]">
    <div className={cn("absolute inset-x-0 top-0 h-1.5 z-20", accent)} />
    <div className="relative h-24 overflow-hidden sm:h-32 lg:h-40">
      <img
        src={image}
        alt={label}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-white/10 to-white" />
      <div className={cn("absolute -right-8 top-2 h-20 w-20 rounded-full blur-3xl opacity-75 sm:h-24 sm:w-24 lg:top-3 lg:h-28 lg:w-28", glow)} />
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-white/0 via-white/80 to-white sm:h-16 lg:h-20" />
    </div>
    <div className="relative -mt-4 px-3 pb-3 sm:-mt-5 sm:px-4 sm:pb-4 lg:-mt-6 lg:px-6 lg:pb-6">
      <div className="relative rounded-[20px] bg-white/95 p-3 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.55)] backdrop-blur-sm sm:rounded-[24px] sm:p-4 lg:rounded-[28px] lg:p-5">
        <div className="relative mb-3 flex items-start justify-between sm:mb-4 lg:mb-5">
          <div className={cn("rounded-xl border p-2 shadow-sm sm:rounded-2xl sm:p-2.5 lg:p-3", color)}>
            <Icon size={18} className="text-slate-900 sm:size-5 lg:size-6" />
          </div>
          <div className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 shadow-sm sm:px-2.5 sm:py-1.5 lg:px-3">
            <div className="flex items-center gap-1 text-[11px] font-semibold sm:text-xs lg:text-sm">
              <TrendingUp size={12} className="sm:size-[14px] lg:size-4" />
              <span>{trend}%</span>
            </div>
          </div>
        </div>
        <div className="relative space-y-2 sm:space-y-2.5 lg:space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:text-[11px] lg:text-sm lg:tracking-[0.18em]">{label}</p>
          <div className="flex flex-wrap items-baseline gap-1 sm:gap-1.5 lg:gap-2">
            <h3 className="text-xl font-display font-bold text-slate-900 sm:text-2xl lg:text-3xl">{value}</h3>
            <span className="text-[10px] font-medium text-slate-400 sm:text-xs lg:text-sm">{unit}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 lg:h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Number(trend) * 3, 100)}%` }}
              className={cn("h-full rounded-full", accent)}
            />
          </div>
        </div>
      </div>
    </div>
  </Card>
);

const getQuestVisual = (task: string) => {
  const lowerTask = task.toLowerCase();

  if (lowerTask.includes('water')) {
    return {
      icon: Droplets,
      iconWrap: 'bg-sky-100 text-sky-600 border-sky-200',
      chip: 'Hydration',
      chipClass: 'bg-sky-50 text-sky-700',
    };
  }

  if (lowerTask.includes('meditation') || lowerTask.includes('yoga')) {
    return {
      icon: Sparkles,
      iconWrap: 'bg-violet-100 text-violet-600 border-violet-200',
      chip: 'Mindfulness',
      chipClass: 'bg-violet-50 text-violet-700',
    };
  }

  if (lowerTask.includes('walk') || lowerTask.includes('exercise') || lowerTask.includes('steps')) {
    return {
      icon: Footprints,
      iconWrap: 'bg-emerald-100 text-emerald-600 border-emerald-200',
      chip: 'Movement',
      chipClass: 'bg-emerald-50 text-emerald-700',
    };
  }

  if (lowerTask.includes('meal')) {
    return {
      icon: Heart,
      iconWrap: 'bg-rose-100 text-rose-600 border-rose-200',
      chip: 'Nutrition',
      chipClass: 'bg-rose-50 text-rose-700',
    };
  }

  return {
    icon: Clock,
    iconWrap: 'bg-amber-100 text-amber-600 border-amber-200',
    chip: 'Habit',
    chipClass: 'bg-amber-50 text-amber-700',
  };
};

type FriendMember = {
  id: string;
  name: string;
  xp: number;
  streak: number;
  avatar: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Loading your health data...</p>
        </div>
      </div>
    );
  }

  // Use data from user object, fallback to defaults
  const xp = user?.xp || 0;
  const streak = user?.streak || 0;
  const streakData = user?.streakData || {};
  const lastDailyQuestCompletionDate = user?.lastDailyQuestCompletionDate || '';
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [friendMembers, setFriendMembers] = useState<FriendMember[]>([]);

  const notifications = [
    { id: 1, text: "Time to get a walk", time: "Just now", icon: Footprints, color: "text-emerald-600 bg-emerald-100" },
    { id: 2, text: `${user?.name || 'User'} consistency is the key!`, time: "2 mins ago", icon: Sparkles, color: "text-brand-600 bg-brand-100" },
    { id: 3, text: "You've reached 80% of your step goal", time: "1 hour ago", icon: Trophy, color: "text-amber-600 bg-amber-100" },
  ];
  const [isXpOpen, setIsXpOpen] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [newStreakValue, setNewStreakValue] = useState(0);
  const displayStreak = showStreakModal ? newStreakValue : streak;
  
  const waterIntake = user?.waterIntake || 0;
  const waterGoalMet = waterIntake >= 3.0;
  
  const todoList = user?.todoList && user.todoList.length > 0 ? user.todoList : [
    { id: '1', task: 'Morning Exercise 10 mins', completed: false },
    { id: '2', task: 'Yoga 10 mins', completed: false },
    { id: '3', task: 'Meditation 5 mins', completed: false },
    { id: '4', task: 'Drink 2L Water', completed: false },
    { id: '5', task: 'Healthy Meal', completed: false },
    { id: '6', task: 'Read for 15 mins', completed: false },
    { id: '7', task: 'Walk 5000 steps', completed: false },
  ];
  const todoGoalMet = todoList.length > 0 && todoList.every((t: any) => t.completed);

  // Trigger streak animation when all quests are completed
  useEffect(() => {
    if (todoGoalMet && user?.todoList && user.todoList.length > 0) {
      const lastCompleted = user.todoList.every((t: any) => t.completed);
      if (lastCompleted) {
        // We check if it was already completed to avoid repeated triggers
        // But for simplicity, we can just show it once per session or use a flag
      }
    }
  }, [todoGoalMet]);

  useEffect(() => {
    const membersQuery = query(collection(db, 'users'), where('role', '==', 'user'));

    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      const members = snapshot.docs
        .map((friendDoc) => ({
          id: friendDoc.id,
          name: friendDoc.data().name || 'Wellora Member',
          xp: friendDoc.data().xp || 0,
          streak: friendDoc.data().streak || 0,
          avatar: friendDoc.data().avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friendDoc.id}`,
        }))
        .filter((member) => member.id !== user.uid)
        .sort((a, b) => {
          if (b.streak !== a.streak) return b.streak - a.streak;
          if (b.xp !== a.xp) return b.xp - a.xp;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 2);

      setFriendMembers(members);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const markTodayActive = async (userRef: any, currentUpdates: any = {}) => {
    if (!user) return currentUpdates;
    const todayStr = getLocalDateString();
    
    const currentDayCount = streakData[todayStr] || 0;
    const updates = { ...currentUpdates };
    updates[`streakData.${todayStr}`] = Math.min(6, currentDayCount + 1);

    if (currentDayCount === 0) {
      updates.xp = increment(5);
    }
    return updates;
  };

  const currentRole = ROLES.find(r => xp >= r.min && xp <= r.max) || ROLES[0];
  const nextRole = ROLES[ROLES.indexOf(currentRole) + 1] || currentRole;
  const progressToNext = nextRole !== currentRole 
    ? ((xp - currentRole.min) / (nextRole.min - currentRole.min)) * 100 
    : 100;

  const handleToggleTodo = async (id: string | number) => {
    if (!user) return;
    const todo = todoList.find((item: any) => item.id === id);
    if (todo?.completed) return; // Prevent unchecking

    const newList = todoList.map((item: any) => 
      item.id === id ? { ...item, completed: true } : item
    );
    
    try {
      const userRef = doc(db, 'users', user.uid);
      let updates: any = {
        todoList: newList
      };

      const allCompleted = newList.every((item: any) => item.completed);
      if (allCompleted && !todoGoalMet) {
        updates.xp = increment(50);
        
        // Daily quest streak logic is tracked separately from the activity heatmap.
        const todayStr = getLocalDateString();
        const alreadyCompletedToday = lastDailyQuestCompletionDate === todayStr;
        
        if (!alreadyCompletedToday) {
          updates.streak = increment(1);
          updates.lastDailyQuestCompletionDate = todayStr;
          setNewStreakValue(streak + 1);
        } else {
          updates.lastDailyQuestCompletionDate = todayStr;
          setNewStreakValue(streak);
        }

        setShowStreakModal(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b']
        });
      }

      updates = await markTodayActive(userRef, updates);
      await updateDoc(userRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAddWater = async () => {
    if (!user) return;
    const currentWater = user.waterIntake || 0;
    if (currentWater < 3.0) {
      const newIntake = Math.min(3.0, currentWater + 0.25);
      
      try {
        const userRef = doc(db, 'users', user.uid);
        let updates: any = {
          waterIntake: newIntake
        };

        if (newIntake >= 3.0 && !waterGoalMet) {
          updates.xp = increment(40);
          confetti({
            particleCount: 100,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#3b82f6', '#60a5fa', '#ffffff']
          });
        }

        updates = await markTodayActive(userRef, updates);
        await updateDoc(userRef, updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const todoProgress = (todoList.filter(t => t.completed).length / todoList.length) * 100;
  const completedQuests = todoList.filter((t: any) => t.completed).length;
  const remainingQuests = Math.max(todoList.length - completedQuests, 0);

  return (
    <div className="relative mx-auto max-w-7xl space-y-5 px-2.5 py-3 sm:px-5 sm:py-6 lg:space-y-8 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_55%)]" />
      {/* Header */}
      <header className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/75 px-4 py-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)] backdrop-blur-sm sm:px-5 sm:py-5 xl:flex xl:items-center xl:justify-between">
        <div className="absolute inset-y-0 right-0 hidden w-40 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent_70%)] sm:block" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
            <Sparkles size={12} />
            Today&apos;s Snapshot
          </div>
          <h1 className="text-[1.9rem] font-display font-bold leading-tight text-slate-900 sm:text-3xl">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
          <p className="text-sm font-medium text-slate-500 sm:text-base">Your health journey is looking great today.</p>
        </div>

        <div className="relative mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:flex sm:flex-wrap sm:items-center sm:gap-4 lg:mt-0 lg:gap-6">
          {/* Streak Count */}
          <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50 px-3 py-2 shadow-sm sm:px-4">
            <Flame size={18} className="shrink-0 text-orange-500 fill-orange-500 sm:size-5" />
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest leading-none">Streak</p>
              <p className="text-xs font-bold text-orange-600 sm:text-sm">{displayStreak} Days</p>
            </div>
          </div>

          {/* XP Progress Bar - Shifted between user detail and notification */}
          <div 
            onClick={() => navigate('/role')}
            className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm transition-all group cursor-pointer hover:bg-slate-50 sm:gap-3"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100">
              <img src={currentRole.img} alt={currentRole.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-bold text-slate-900 sm:text-xs">{currentRole.name}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-600 sm:text-[10px]">{xp} XP</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  className="h-full bg-brand-600"
                />
              </div>
            </div>
          </div>

          <div className="contents sm:relative sm:flex sm:items-center sm:gap-3">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-500 shadow-sm transition-colors hover:text-slate-900 sm:h-auto sm:w-auto sm:p-3 sm:rounded-xl",
                showNotifications && "bg-slate-50 border-brand-200 text-brand-600"
              )}
            >
              <Bell size={18} className="sm:size-5" />
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full border-2 border-white bg-red-500 sm:right-2 sm:top-2"></span>
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-4 w-80 bg-white rounded-[32px] shadow-2xl border border-slate-100 z-50 overflow-hidden"
                >
                  <div className="p-6 border-b border-slate-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-display font-bold text-slate-900">Notifications</h3>
                      <span className="px-2 py-1 bg-brand-50 text-brand-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">3 New</span>
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-none flex gap-4">
                        <div className={cn("p-3 rounded-2xl shrink-0 h-fit", n.color)}>
                          <n.icon size={18} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-900 leading-tight">{n.text}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-slate-50">
                    <Button variant="ghost" className="w-full text-xs font-bold text-slate-500 hover:text-brand-600">
                      Mark all as read
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div 
              onClick={() => navigate('/profile')}
              className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm cursor-pointer group sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:pl-4 sm:border-l sm:border-slate-200"
            >
              <div className="min-w-0 flex-1 text-left sm:text-right">
                <p className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-brand-600">{user?.name || 'User'}</p>
                <p className="truncate text-xs font-medium text-slate-500">{currentRole.name} Member</p>
              </div>
              <img 
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'User'}`} 
                alt="Avatar" 
                className="h-10 w-10 shrink-0 rounded-xl border-2 border-white bg-brand-100 shadow-sm transition-transform group-hover:scale-110"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Streak Success Modal */}
      <AnimatePresence>
        {showStreakModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-brand-500" />
              <div className="mb-6 relative inline-block">
                <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mx-auto">
                  <Flame size={48} className="text-brand-600 animate-bounce" />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-2 -right-2 bg-amber-500 text-white p-2 rounded-full shadow-lg"
                >
                  <Sparkles size={20} />
                </motion.div>
              </div>
              
              <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Daily Quests Complete!</h3>
              <p className="text-slate-500 font-medium mb-8">
                You've crushed all your goals for today. Your consistency is inspiring!
              </p>
              
              <div className="bg-slate-50 rounded-2xl p-4 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                    <Zap size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reward Earned</p>
                    <p className="text-sm font-bold text-slate-900">+50 XP</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Streak</p>
                  <p className="text-sm font-bold text-brand-600">{newStreakValue} Days</p>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowStreakModal(false)}
                className="w-full py-6 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg shadow-brand-200"
              >
                Keep it up!
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <StatCard 
          icon={Heart} 
          label="Heart Rate" 
          value="72" 
          unit="bpm" 
          trend="12" 
          color="border-rose-100 bg-rose-50" 
          accent="bg-rose-500"
          glow="bg-rose-100"
          image="https://www.shutterstock.com/image-vector/continuous-one-line-drawing-heart-260nw-2255225731.jpg"
        />
        <StatCard 
          icon={Moon} 
          label="Sleep Quality" 
          value="7.5" 
          unit="hrs" 
          trend="8" 
          color="border-indigo-100 bg-indigo-50" 
          accent="bg-indigo-500"
          glow="bg-indigo-100"
          image="https://img.freepik.com/free-vector/mountain-landscape-night_1048-8048.jpg?semt=ais_incoming&w=740&q=80"
        />
        <StatCard 
          icon={Footprints} 
          label="Daily Steps" 
          value="8,432" 
          unit="steps" 
          trend="24" 
          color="border-emerald-100 bg-emerald-50" 
          accent="bg-emerald-500"
          glow="bg-emerald-100"
          image="https://media.istockphoto.com/id/1334658317/photo/adult-male-runner-in-park-at-autumn-sunrise.jpg?s=612x612&w=0&k=20&c=wJqpauyinKdypn5kj7uepHq5osjrVVx6b4V8HSWFrW4="
        />
        <StatCard 
          icon={Activity} 
          label="Calories" 
          value="1,240" 
          unit="kcal" 
          trend="5" 
          color="border-amber-100 bg-amber-50" 
          accent="bg-amber-500"
          glow="bg-amber-100"
          image="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80"
        />
      </div>

      {/* Detailed Sections */}
      <Card className="overflow-hidden border border-slate-200/80 bg-white p-0 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
        <div className="p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-2xl font-display font-bold text-slate-900">Activity Overview</h3>
              <p className="text-sm font-medium text-slate-500">Your key health habits, hydration, and daily consistency in one place.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span>Steps</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                <span>Kcal</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,0.95fr)]">
            <Card className="border border-slate-100 bg-white p-6 shadow-none">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-display font-bold text-slate-900">Activity Trend</h4>
                  <p className="text-sm text-slate-500">Weekly health metrics</p>
                </div>
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorKcal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="steps" 
                      stroke="#22c55e" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSteps)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="kcal" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorKcal)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="relative overflow-hidden bg-brand-600 p-6 text-white shadow-none">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Droplets size={80} />
              </div>
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-display font-bold">Water Intake</h4>
                  {waterGoalMet && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="rounded-lg bg-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                    >
                      +40 XP Earned
                    </motion.div>
                  )}
                </div>
                <p className="mb-6 text-sm text-brand-100">Stay hydrated! You&apos;re {Math.round((waterIntake / 3) * 100)}% there.</p>
                <div className="mb-6 flex items-end gap-3">
                  <h4 className="text-4xl font-display font-bold">{waterIntake.toFixed(1)}</h4>
                  <span className="mb-1 text-brand-100">/ 3.0 Liters</span>
                </div>
                <div className="overflow-hidden rounded-full bg-brand-700 h-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(waterIntake / 3) * 100}%` }}
                    className="h-full bg-white"
                  />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-100">Target</p>
                    <p className="mt-1 text-sm font-bold text-white">3.0 Liters</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-100">Remaining</p>
                    <p className="mt-1 text-sm font-bold text-white">{Math.max(0, 3 - waterIntake).toFixed(1)} Liters</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleAddWater}
                  disabled={waterGoalMet}
                  className="mt-6 w-full border-white/20 text-white hover:bg-white/10"
                >
                  {waterGoalMet ? "Goal Reached!" : "Add 250ml"}
                </Button>
              </div>
            </Card>
          </div>

          <div className="mt-6">
            <Card className="relative overflow-hidden border border-slate-200/80 bg-white p-0 shadow-none">
            <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_55%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.16),_transparent_42%),linear-gradient(180deg,_rgba(248,250,252,0.95),_rgba(255,255,255,0))]" />
            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
                    <Trophy size={14} className="text-amber-500" />
                    Daily Quests
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-display font-bold text-slate-900">Build today&apos;s momentum</h3>
                      {todoGoalMet && (
                        <div className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                          +50 XP Earned
                        </div>
                      )}
                    </div>
                    <p className="max-w-md text-sm font-medium leading-relaxed text-slate-500">
                      Finish your small wellness rituals to protect your streak and keep your day moving in the right direction.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 rounded-[28px] border border-brand-100 bg-white/90 px-5 py-4 text-right shadow-sm backdrop-blur-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Today&apos;s Progress</p>
                  <p className="mt-2 text-3xl font-display font-bold text-slate-900">{completedQuests}<span className="text-lg text-slate-300">/{todoList.length}</span></p>
                  <p className="text-xs font-semibold text-brand-600">{remainingQuests} quest{remainingQuests === 1 ? '' : 's'} left</p>
                </div>
              </div>

              <div className="mt-6 rounded-[28px] border border-slate-100 bg-slate-50/80 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Quest Flow</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {todoGoalMet ? 'All rituals completed for today.' : `${remainingQuests} small wins stand between you and a stronger streak.`}
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-2 text-xs font-bold text-brand-700 shadow-sm">
                    {Math.round(todoProgress)}% complete
                  </div>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${todoProgress}%` }}
                    className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e_0%,#14b8a6_55%,#0f766e_100%)]"
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Completed</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{completedQuests}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Remaining</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{remainingQuests}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Reward</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">50 XP</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {todoList.map((todo) => {
                  const questLabel = todo.task || todo.text;
                  const questVisual = getQuestVisual(questLabel);
                  const QuestIcon = questVisual.icon;

                  return (
                    <div
                      key={todo.id}
                      onClick={() => handleToggleTodo(todo.id)}
                      className={cn(
                        "group flex items-center gap-4 rounded-[24px] border p-4 transition-all",
                        todo.completed
                          ? "border-emerald-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(255,255,255,0.98))] shadow-[0_18px_35px_-30px_rgba(16,185,129,0.65)] cursor-default"
                          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_20px_35px_-26px_rgba(15,23,42,0.28)] cursor-pointer"
                      )}
                    >
                      <div className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-transform",
                        questVisual.iconWrap,
                        !todo.completed && "group-hover:scale-105"
                      )}>
                        <QuestIcon size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                            questVisual.chipClass
                          )}>
                            {questVisual.chip}
                          </span>
                          <span className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                            todo.completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                          )}>
                            {todo.completed ? 'Completed' : 'Tap to complete'}
                          </span>
                        </div>
                        <p className={cn(
                          "mt-2 text-sm font-semibold leading-relaxed transition-all",
                          todo.completed ? "text-slate-500" : "text-slate-800"
                        )}>
                          {questLabel}
                        </p>
                      </div>

                      <div className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all",
                        todo.completed
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                          : "border-slate-200 bg-slate-50 text-slate-300 group-hover:border-brand-200 group-hover:text-brand-500"
                      )}>
                        {todo.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[24px] border border-slate-100 bg-[linear-gradient(135deg,rgba(240,253,244,0.9),rgba(255,255,255,1))] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
                    <Flame size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Complete every quest to grow your streak</p>
                    <p className="text-xs font-medium text-slate-500">Small daily consistency compounds faster than one perfect day.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          </div>

          <div className="mt-6">
            <Card className="border border-slate-100 bg-slate-50/50 p-5 shadow-none">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-orange-100 p-2">
                    <Flame size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">2026 Consistency Map</h4>
                    <p className="text-[10px] font-medium text-slate-500">Daily activity levels based on goals completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Intensity</span>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map(v => (
                      <div 
                        key={v} 
                        className={cn(
                          "h-3 w-3 rounded-sm",
                          v === 0 ? "bg-slate-200" : 
                          v === 1 ? "bg-emerald-100" :
                          v === 2 ? "bg-emerald-200" :
                          v === 3 ? "bg-emerald-300" :
                          v === 4 ? "bg-emerald-400" :
                          v === 5 ? "bg-emerald-500" : "bg-emerald-600"
                        )} 
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="relative overflow-x-auto no-scrollbar pb-2">
                <div className="min-w-[800px]">
                  <div className="relative ml-8 mb-2 flex h-4">
                    {(() => {
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const startOf2026 = new Date('2026-01-01');
                      const monthPositions: { month: string, weekIdx: number }[] = [];
                      
                      let currentMonth = -1;
                      for (let w = 0; w < 52; w++) {
                        const d = new Date(startOf2026);
                        d.setDate(d.getDate() + w * 7);
                        if (d.getMonth() !== currentMonth) {
                          currentMonth = d.getMonth();
                          monthPositions.push({ month: months[currentMonth], weekIdx: w });
                        }
                      }
                      
                      return monthPositions.map(({ month, weekIdx }) => {
                        const monthGapsBefore = monthPositions.filter(p => p.weekIdx > 0 && p.weekIdx <= weekIdx).length;
                        const leftPos = weekIdx * 16 + monthGapsBefore * 8;
                        return (
                          <div 
                            key={month} 
                            className="absolute text-[10px] font-bold text-slate-400"
                            style={{ left: `${leftPos}px` }}
                          >
                            {month}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-[104px] w-8 shrink-0 flex-col justify-between py-1 text-[9px] font-bold text-slate-400">
                      <span>Mon</span>
                      <span>Wed</span>
                      <span>Fri</span>
                      <span>Sun</span>
                    </div>

                    <div className="flex gap-1">
                      {Array.from({ length: 52 }).map((_, weekIdx) => {
                        const startOf2026 = new Date('2026-01-01');
                        const date = new Date(startOf2026);
                        date.setDate(date.getDate() + weekIdx * 7);
                        
                        const prevDate = new Date(startOf2026);
                        prevDate.setDate(prevDate.getDate() + (weekIdx - 1) * 7);
                        
                        const isNewMonth = weekIdx > 0 && date.getMonth() !== prevDate.getMonth();
                        
                        return (
                          <div key={weekIdx} className={cn("flex shrink-0 flex-col gap-1", isNewMonth && "ml-2")}>
                            {Array.from({ length: 7 }).map((_, dayIdx) => {
                              const dayDate = new Date(date);
                              dayDate.setDate(dayDate.getDate() + dayIdx);
                              
                              const dateStr = dayDate.toISOString().split('T')[0];
                              const count = streakData[dateStr] || 0;
                              const isFuture = dayDate > new Date();
                              
                              return (
                                <motion.div 
                                  key={dayIdx}
                                  initial={false}
                                  whileHover={{ scale: 1.3, zIndex: 10 }}
                                  className={cn(
                                    "h-3 w-3 cursor-pointer rounded-sm transition-all duration-300",
                                    isFuture ? "bg-slate-100/50 opacity-30" :
                                    count === 0 ? "bg-slate-200" :
                                    count === 1 ? "bg-emerald-100" :
                                    count === 2 ? "bg-emerald-200" :
                                    count === 3 ? "bg-emerald-300" :
                                    count === 4 ? "bg-emerald-400" :
                                    count === 5 ? "bg-emerald-500" : "bg-emerald-600"
                                  )}
                                  title={`${dateStr}: ${count} activities`}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Current Streak: {displayStreak} Days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <span>Best Streak: 42 Days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-brand-500" />
                  <span>Total Active Days: {Object.keys(streakData).length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Card>

      {/* Recent Activity & Nudge Friends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-bold text-slate-900">Recent Activity</h3>
            <Button variant="ghost" className="text-xs">View History</Button>
          </div>
          <div className="space-y-6">
            {[
              { type: 'Workout', label: 'Morning Yoga', time: '8:00 AM', value: '45 min', icon: Zap, color: 'bg-amber-100 text-amber-600' },
              { type: 'Health', label: 'Blood Pressure Check', time: '10:30 AM', value: '120/80', icon: Heart, color: 'bg-rose-100 text-rose-600' },
              { type: 'Nutrition', label: 'Lunch Logged', time: '1:15 PM', value: '650 kcal', icon: Activity, color: 'bg-emerald-100 text-emerald-600' },
            ].map((act, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", act.color)}>
                  <act.icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{act.label}</p>
                  <p className="text-xs text-slate-500">{act.type} • {act.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{act.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Nudge Friends Card */}
        <Card className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Users size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Users size={20} className="text-indigo-600" />
              <h3 className="text-lg font-display font-bold text-slate-900">Friend Activity</h3>
            </div>
            
            <div className="space-y-6">
              {friendMembers.length > 0 ? friendMembers.map((friend, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="relative">
                    <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-xl bg-slate-100" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white">
                      {friend.streak}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{friend.name}</p>
                    <p className="text-xs text-slate-500">{friend.xp.toLocaleString()} XP</p>
                  </div>
                  <Button variant="outline" className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider hover:bg-brand-600 hover:text-white transition-all">
                    Nudge
                  </Button>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                  <p className="text-sm font-bold text-slate-900">No other members yet</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">As new Wellora users join, their profiles will appear here.</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => navigate('/friends')}
                className="w-full text-brand-600 font-bold flex items-center justify-center gap-2"
              >
                <span>More Friends</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden border border-slate-200/80 bg-white p-0 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr]">
          <div className="relative min-h-[220px] overflow-hidden lg:min-h-[240px]">
            <img
              src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80"
              alt="Meditation"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/35 via-slate-900/12 to-white/0 lg:to-white/95" />
            <div className="absolute inset-y-0 right-0 hidden w-32 bg-gradient-to-r from-white/0 via-white/70 to-white lg:block" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/35 to-transparent lg:hidden" />
            <div className="absolute left-6 top-6 rounded-full border border-white/40 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white backdrop-blur-md">
              Daily Reset
            </div>
          </div>

          <div className="relative flex flex-col justify-center p-6 lg:p-8">
            <div className="absolute right-8 top-8 h-28 w-28 rounded-full bg-brand-100 blur-3xl opacity-70" />
            <div className="relative max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
                <Sparkles size={14} />
                Meditation
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-bold text-slate-900 lg:text-[2rem]">Pause, breathe, and let your mind slow down.</h3>
                <p className="text-sm leading-relaxed text-slate-600 lg:text-base">
                  A few minutes of guided meditation can lower stress, improve focus, and bring your energy back into balance.
                  Make this your gentle reset between a busy morning and a calmer afternoon.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Recommended</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">10 Minute Session</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Best Time</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">Morning or Night</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button variant="primary" className="px-6 py-3 rounded-2xl">
                  How to Meditate
                </Button>
                <Button variant="outline" className="px-6 py-3 rounded-2xl">
                  Learn Benefits
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}


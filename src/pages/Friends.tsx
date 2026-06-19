import { useEffect, useMemo, useState } from 'react';
import { Users, Search, Flame, Sparkles, X, CalendarDays, UserRound } from 'lucide-react';
import { Card, Button, LoadingSpinner } from '@/src/components/ui/Base';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

type FriendUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  xp: number;
  streak: number;
  gender: string;
  streakData: Record<string, number>;
};

const ROLES = [
  { name: 'Rookie', min: 0, max: 99, icon: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rookie' },
  { name: 'Trainee', min: 100, max: 299, icon: 'https://api.dicebear.com/7.x/bottts/svg?seed=Trainee' },
  { name: 'Fighter', min: 300, max: 699, icon: 'https://api.dicebear.com/7.x/bottts/svg?seed=Fighter' },
  { name: 'Warrior', min: 700, max: 1499, icon: 'https://api.dicebear.com/7.x/bottts/svg?seed=Warrior' },
  { name: 'Elite', min: 1500, max: 2999, icon: 'https://api.dicebear.com/7.x/bottts/svg?seed=Elite' },
  { name: 'Champion', min: 3000, max: 5999, icon: 'https://api.dicebear.com/7.x/bottts/svg?seed=Champion' },
  { name: 'Legend', min: 6000, max: Infinity, icon: 'https://api.dicebear.com/7.x/bottts/svg?seed=Legend' },
];

const getMemberRoleData = (xp: number) => ROLES.find((role) => xp >= role.min && xp <= role.max) || ROLES[0];

export default function Friends() {
  const { user } = useAuth();
  const [members, setMembers] = useState<FriendUser[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<FriendUser | null>(null);

  useEffect(() => {
    const membersQuery = query(collection(db, 'users'), where('role', '==', 'user'));

    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      const allMembers = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          name: doc.data().name || 'Wellora Member',
          email: doc.data().email || '',
          avatar: doc.data().avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.id}`,
          xp: doc.data().xp || 0,
          streak: doc.data().streak || 0,
          gender: doc.data().gender || 'Not specified',
          streakData: doc.data().streakData || {},
        }))
        .sort((a, b) => {
          if (a.id === user?.uid) return -1;
          if (b.id === user?.uid) return 1;
          return a.name.localeCompare(b.name);
        });

      setMembers(allMembers);
      setIsLoadingMembers(false);
    }, () => {
      setMembers([]);
      setIsLoadingMembers(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const filteredMembers = members.filter((member) => {
    const queryValue = searchQuery.trim().toLowerCase();
    if (!queryValue) return true;

    return (
      member.name.toLowerCase().includes(queryValue)
    );
  });

  const memberCalendar = useMemo(() => {
    if (!selectedMember) return [];

    const today = new Date();
    const calendarDays = Array.from({ length: 21 }).map((_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (20 - index));
      const dateStr = day.toISOString().split('T')[0];
      return {
        label: day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        count: selectedMember.streakData[dateStr] || 0,
      };
    });

    return calendarDays;
  }, [selectedMember]);

  return (
    <div className="relative mx-auto max-w-7xl space-y-5 px-2.5 py-3 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_55%)]" />
      <header className="relative flex flex-col gap-4 overflow-hidden rounded-[28px] border border-white/80 bg-white/78 px-4 py-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)] backdrop-blur-sm sm:px-5 sm:py-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-brand-100/45 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700">
            <Users size={14} />
            Friends
          </div>
          <h1 className="mt-4 text-2xl font-display font-bold text-slate-900 sm:text-3xl">Wellora Members</h1>
          <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">Explore the real community using Wellora and see who is building healthy habits with you.</p>
        </div>
        <div className="relative rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm sm:rounded-[28px] sm:px-5 sm:py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Community Size</p>
          <p className="mt-1 text-2xl font-display font-bold text-slate-900 sm:text-3xl">{members.length}</p>
          <p className="text-xs font-semibold text-brand-600">Active user members</p>
        </div>
      </header>

      <Card className="p-4 md:p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 sm:left-4" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members by name..."
            className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:py-3 sm:pl-11"
          />
        </div>
      </Card>

      {isLoadingMembers ? (
        <Card className="py-20 text-center space-y-5">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <LoadingSpinner size={34} />
          </div>
          <div>
            <p className="text-xl font-display font-bold text-slate-900">Loading members...</p>
            <p className="text-sm font-medium text-slate-500">Fetching real users from the Wellora database.</p>
          </div>
        </Card>
      ) : filteredMembers.length === 0 ? (
        <Card className="py-20 text-center space-y-4 border-dashed border-slate-200">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300">
            <Users size={34} />
          </div>
          <div>
            <p className="text-xl font-display font-bold text-slate-900">No members found</p>
            <p className="text-sm font-medium text-slate-500">Try another search term.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="overflow-hidden border border-slate-200/80 p-0 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.35)]">
              <div className="h-16 bg-[linear-gradient(135deg,rgba(34,197,94,0.16),rgba(59,130,246,0.08),rgba(255,255,255,0.65))] sm:h-20 lg:h-24" />
              <div className="relative px-3 pb-3 sm:px-4 sm:pb-4 lg:px-6 lg:pb-6">
                <div className="-mt-8 flex items-end justify-between gap-3 sm:-mt-9 lg:-mt-10">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="h-14 w-14 rounded-2xl border-4 border-white bg-white shadow-lg sm:h-16 sm:w-16 lg:h-20 lg:w-20 lg:rounded-3xl"
                  />
                  {member.id === user?.uid && (
                    <div className="rounded-full bg-brand-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-700 sm:text-[10px] sm:tracking-[0.18em]">
                      You
                    </div>
                  )}
                </div>

                <div className="mt-3 sm:mt-4">
                  <h3 className="line-clamp-2 text-sm font-display font-bold text-slate-900 sm:text-base lg:text-lg">{member.name}</h3>
                  <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1.5 sm:px-3">
                    <img
                      src={getMemberRoleData(member.xp).icon}
                      alt={getMemberRoleData(member.xp).name}
                      className="h-4 w-4 rounded-full bg-white sm:h-5 sm:w-5"
                    />
                    <p className="truncate text-[11px] font-bold text-slate-600 sm:text-xs">{getMemberRoleData(member.xp).name} Member</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
                  <div className="rounded-2xl bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2 text-brand-600">
                      <Sparkles size={14} />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">XP</p>
                    </div>
                    <p className="mt-1.5 text-base font-bold text-slate-900 sm:mt-2 sm:text-lg">{member.xp}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2 text-orange-500">
                      <Flame size={14} />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Streak</p>
                    </div>
                    <p className="mt-1.5 text-base font-bold text-slate-900 sm:mt-2 sm:text-lg">{member.streak} days</p>
                  </div>
                </div>

                <Button variant="outline" onClick={() => setSelectedMember(member)} className="mt-4 w-full rounded-2xl px-3 py-2 text-xs sm:mt-5 sm:text-sm">
                  View Member
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 p-3 sm:p-4 backdrop-blur-sm"
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full max-h-[90vh] overflow-y-auto no-scrollbar max-w-2xl rounded-[28px] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(34,197,94,0.18),rgba(59,130,246,0.08),rgba(255,255,255,1))] px-6 pb-6 pt-8">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/85 text-slate-500 shadow-sm transition-colors hover:text-slate-900"
                >
                  <X size={18} />
                </button>

                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedMember.avatar}
                      alt={selectedMember.name}
                      className="h-20 w-20 rounded-[24px] border-4 border-white bg-white shadow-lg"
                    />
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700">
                        <img
                          src={getMemberRoleData(selectedMember.xp).icon}
                          alt={getMemberRoleData(selectedMember.xp).name}
                          className="h-4 w-4 rounded-full bg-white"
                        />
                        {getMemberRoleData(selectedMember.xp).name}
                      </div>
                      <h2 className="mt-2 text-2xl font-display font-bold text-slate-900">{selectedMember.name}</h2>
                      <p className="mt-1 text-sm font-medium text-slate-500">A real Wellora member building daily momentum.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:min-w-[220px]">
                    <div className="rounded-2xl bg-white/80 px-4 py-2.5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">XP</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{selectedMember.xp}</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 px-4 py-2.5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Streak</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{selectedMember.streak} days</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <UserRound size={16} />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Gender</p>
                    </div>
                    <p className="mt-2 text-base font-bold text-slate-900">{selectedMember.gender}</p>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-orange-500">
                      <Flame size={16} />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Current Streak</p>
                    </div>
                    <p className="mt-2 text-base font-bold text-slate-900">{selectedMember.streak} day run</p>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-brand-600">
                      <img
                        src={getMemberRoleData(selectedMember.xp).icon}
                        alt={getMemberRoleData(selectedMember.xp).name}
                        className="h-5 w-5 rounded-full bg-white shadow-sm"
                      />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Rank</p>
                    </div>
                    <p className="mt-2 text-base font-bold text-slate-900">{getMemberRoleData(selectedMember.xp).name}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <CalendarDays size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-display font-bold text-slate-900">Consistency Calendar</h3>
                        <p className="text-xs font-medium text-slate-500">Recent daily activity intensity from this member&apos;s profile.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      <span>Low</span>
                      {[0, 1, 2, 3, 4].map((value) => (
                        <div
                          key={value}
                          className={cn(
                            "h-3 w-3 rounded-sm",
                            value === 0 ? "bg-slate-200" :
                            value === 1 ? "bg-emerald-100" :
                            value === 2 ? "bg-emerald-300" :
                            value === 3 ? "bg-emerald-500" : "bg-emerald-700"
                          )}
                        />
                      ))}
                      <span>High</span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-7 gap-2">
                    {memberCalendar.map((day) => (
                      <div key={day.label} className="space-y-1.5 text-center">
                        <div
                          className={cn(
                            "mx-auto h-7 w-7 rounded-lg border transition-all",
                            day.count === 0 ? "border-slate-200 bg-slate-100" :
                            day.count === 1 ? "border-emerald-100 bg-emerald-100" :
                            day.count === 2 ? "border-emerald-200 bg-emerald-200" :
                            day.count === 3 ? "border-emerald-400 bg-emerald-400" :
                            "border-emerald-700 bg-emerald-600"
                          )}
                          title={`${day.label}: ${day.count} activities`}
                        />
                        <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">{day.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

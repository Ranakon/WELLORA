import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { onAuthStateChanged, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';

export type UserRole = 'user' | 'doctor' | 'advisor';

interface User {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
  xp?: number;
  streak?: number;
  streakData?: Record<string, number>;
  lastDailyQuestCompletionDate?: string;
  lastDailyResetDate?: string;
  lastOpenedDate?: string;
  waterIntake?: number;
  todoList?: { id: string | number; task: string; completed: boolean }[];
  phone?: string;
  age?: string;
  gender?: string;
  dietType?: string;
  occupation?: string;
  location?: string;
  address?: string;
  healthConditions?: string;
  allergies?: string;
  emergencyContacts?: { name: string; relation: string; phone: string }[];
  insuranceDetails?: { provider: string; plan: string; coverage: string; policyNumber: string }[];
  procedure?: any;
  currentStepIndex?: number;
  plan?: string;
  healthScore?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole, name: string, specialty?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultTodoList = () => [
  { id: '1', task: 'Morning Exercise 10 mins', completed: false },
  { id: '2', task: 'Yoga 10 mins', completed: false },
  { id: '3', task: 'Meditation 5 mins', completed: false },
  { id: '4', task: 'Drink 2L Water', completed: false },
  { id: '5', task: 'Healthy Meal', completed: false },
  { id: '6', task: 'Read for 15 mins', completed: false },
  { id: '7', task: 'Walk 5000 steps', completed: false },
];

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMillisecondsUntilNextMidnight = () => {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 1, 0);
  return nextMidnight.getTime() - now.getTime();
};

const getDayDifference = (fromDate: string, toDate: string) => {
  if (!fromDate || !toDate) return 0;

  const [fromYear, fromMonth, fromDay] = fromDate.split('-').map(Number);
  const [toYear, toMonth, toDay] = toDate.split('-').map(Number);

  if ([fromYear, fromMonth, fromDay, toYear, toMonth, toDay].some((value) => !Number.isFinite(value))) {
    return 0;
  }

  const fromUtc = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const toUtc = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.floor((toUtc - fromUtc) / 86400000);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;
    let resetInFlightKey = '';

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen to the user document for real-time updates (XP, streak, etc.)
        unsubscribeDoc = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as User;
            const today = getLocalDateString();
            const lastDailyResetDate = data.lastDailyResetDate ?? '';
            const lastOpenedDate = data.lastOpenedDate ?? lastDailyResetDate ?? '';
            const needsDailyReset = lastDailyResetDate !== today;
            const resetKey = `${firebaseUser.uid}:${today}`;
            const missedDayGap = getDayDifference(lastOpenedDate, today);
            let didPersistDailyReset = false;

            if (needsDailyReset && resetInFlightKey !== resetKey) {
              resetInFlightKey = resetKey;
              try {
                const resetPayload: Partial<User> = {
                  waterIntake: 0,
                  todoList: defaultTodoList(),
                  lastDailyResetDate: today,
                  lastOpenedDate: today
                };

                if (missedDayGap > 1) {
                  resetPayload.streak = 0;
                }

                await updateDoc(userRef, resetPayload);
                didPersistDailyReset = true;
              } catch (error) {
                console.error("Error resetting daily health state:", error);
                resetInFlightKey = '';
              }
            } else if (lastOpenedDate !== today) {
              try {
                await updateDoc(userRef, { lastOpenedDate: today });
              } catch (error) {
                console.error("Error updating last opened date:", error);
              }
            }

            // Ensure essential fields exist to prevent UI flickering/resets
            const updatedUser = {
              ...data,
              xp: data.xp ?? 0,
              streak: didPersistDailyReset && missedDayGap > 1 ? 0 : (data.streak ?? 0),
              streakData: data.streakData ?? {},
              lastDailyQuestCompletionDate: data.lastDailyQuestCompletionDate ?? '',
              lastDailyResetDate: didPersistDailyReset ? today : (lastDailyResetDate || ''),
              lastOpenedDate: today,
              waterIntake: didPersistDailyReset ? 0 : (data.waterIntake ?? 0),
              todoList: didPersistDailyReset ? defaultTodoList() : (data.todoList ?? defaultTodoList()),
              phone: data.phone ?? '',
              age: data.age ?? '',
              gender: data.gender ?? '',
              dietType: data.dietType ?? '',
              occupation: data.occupation ?? '',
              location: data.location ?? '',
              address: data.address ?? '',
              healthConditions: data.healthConditions ?? '',
              allergies: data.allergies ?? '',
              emergencyContacts: data.emergencyContacts ?? [],
              insuranceDetails: data.insuranceDetails ?? [],
              procedure: data.procedure ?? null,
              currentStepIndex: data.currentStepIndex ?? 0,
              plan: data.plan ?? 'Free',
              healthScore: data.healthScore ?? 0
            };
            setUser(updatedUser);
          } else {
            // If doc doesn't exist, we might need to create it (handled in login/register)
            // But for safety, if it's missing during a session:
            setUser(null);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error listening to user doc:", error);
          setIsLoading(false);
        });
      } else {
        if (unsubscribeDoc) unsubscribeDoc();
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    const timeoutId = window.setTimeout(async () => {
      const today = getLocalDateString();
      if (user.lastDailyResetDate === today) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          waterIntake: 0,
          todoList: defaultTodoList(),
          lastDailyResetDate: today,
          lastOpenedDate: today
        });

        setUser((currentUser) => {
          if (!currentUser || currentUser.uid !== user.uid) return currentUser;

          return {
            ...currentUser,
            waterIntake: 0,
            todoList: defaultTodoList(),
            lastDailyResetDate: today,
            lastOpenedDate: today
          };
        });
      } catch (error) {
        console.error("Error performing scheduled midnight reset:", error);
      }
    }, getMillisecondsUntilNextMidnight());

    return () => window.clearTimeout(timeoutId);
  }, [user?.uid, user?.lastDailyResetDate]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        setUser(userDoc.data() as User);
      } else {
        // Fallback for demo users: if they exist in Auth but not Firestore, create them
        let role: UserRole = 'user';
        if (email.includes('doctor')) role = 'doctor';
        if (email.includes('advisor')) role = 'advisor';
        
        const isRounak = email.toLowerCase().includes('rounak');
        const today = getLocalDateString();
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          role,
          name: firebaseUser.displayName || email.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
          xp: isRounak ? 1250 : 0,
          streak: isRounak ? 15 : 0,
          streakData: {},
          lastDailyQuestCompletionDate: '',
          lastDailyResetDate: today,
          lastOpenedDate: today,
          waterIntake: isRounak ? 2.1 : 0,
          todoList: defaultTodoList().map((item) => ({ ...item, completed: isRounak }))
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        setUser(newUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, role: UserRole, name: string, specialty?: string) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

    try {
      await updateProfile(firebaseUser, { displayName: name });
      
      const isRounak = email.toLowerCase().includes('rounak');
      const today = getLocalDateString();
      const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        role,
        name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        xp: isRounak ? 1250 : 0,
        streak: isRounak ? 15 : 0,
        streakData: {},
        lastDailyQuestCompletionDate: '',
        lastDailyResetDate: today,
        lastOpenedDate: today,
        waterIntake: isRounak ? 2.1 : 0,
        todoList: defaultTodoList().map((item) => ({ ...item, completed: isRounak })),
        ...(role === 'doctor' && specialty ? { specialty } : {})
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      setUser(newUser);
    } catch (error) {
      await deleteUser(firebaseUser).catch(() => {
        // Ignore cleanup failures; surface the original error instead.
      });
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      const isRounak = firebaseUser.email?.toLowerCase().includes('rounak');
      const today = getLocalDateString();
      const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        role: 'user', // Default role for Google login
        name: firebaseUser.displayName || 'User',
        avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
        xp: isRounak ? 1250 : 0,
        streak: isRounak ? 15 : 0,
        streakData: {},
        lastDailyQuestCompletionDate: '',
        lastDailyResetDate: today,
        lastOpenedDate: today,
        waterIntake: isRounak ? 2.1 : 0,
        todoList: defaultTodoList().map((item) => ({ ...item, completed: isRounak }))
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      setUser(newUser);
    } else {
      setUser(userDoc.data() as User);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

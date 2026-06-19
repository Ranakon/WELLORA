import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase';

interface ProcedureStep {
  title: string;
  description: string;
  instructions: string[];
  videoUrl?: string;
  isHospitalVisit: boolean;
  status: 'pending' | 'current' | 'completed';
}

interface ProcedureData {
  steps: ProcedureStep[];
  doctorSpecialty: string;
  hospitalType: string;
  dietaryAdvice: string[];
  estimatedBill: string;
  isEmergency: boolean;
}

interface HealthContextType {
  procedure: ProcedureData | null;
  setProcedure: (data: ProcedureData | null) => void;
  currentStepIndex: number;
  setCurrentStepIndex: (index: number) => void;
  userInput: string;
  setUserInput: (input: string) => void;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [procedure, setProcedureState] = useState<ProcedureData | null>(null);
  const [currentStepIndex, setCurrentStepIndexState] = useState(0);
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    if (!user) {
      setProcedureState(null);
      setCurrentStepIndexState(0);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.procedure) {
          setProcedureState(data.procedure);
        }
        if (data.currentStepIndex !== undefined) {
          setCurrentStepIndexState(data.currentStepIndex);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  const setProcedure = async (data: ProcedureData | null) => {
    setProcedureState(data);
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { procedure: data });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const setCurrentStepIndex = async (index: number) => {
    setCurrentStepIndexState(index);
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { currentStepIndex: index });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <HealthContext.Provider value={{ 
      procedure, 
      setProcedure, 
      currentStepIndex, 
      setCurrentStepIndex,
      userInput,
      setUserInput
    }}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (context === undefined) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};

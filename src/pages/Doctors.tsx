import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Star, MapPin, Calendar, MessageCircle, X, Send, CheckCircle2, Stethoscope } from 'lucide-react';
import { Card, Button, LoadingSpinner } from '@/src/components/ui/Base';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, limit, or, and } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

const specialties = [
  'All', 'Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'Psychiatry', 'Orthopedics'
];

const specialtyAliases: Record<string, string> = {
  all: 'all',
  cardiology: 'cardiology',
  cardiologist: 'cardiology',
  dermatology: 'dermatology',
  dermatologist: 'dermatology',
  neurology: 'neurology',
  neurologist: 'neurology',
  pediatrics: 'pediatrics',
  pediatrician: 'pediatrics',
  psychiatry: 'psychiatry',
  psychiatrist: 'psychiatry',
  orthopedics: 'orthopedics',
  orthopedic: 'orthopedics',
  orthopaedics: 'orthopedics',
  orthopaedic: 'orthopedics',
};

const normalizeSpecialty = (value: string) => {
  const normalizedValue = value.trim().toLowerCase();
  return specialtyAliases[normalizedValue] || normalizedValue;
};

export default function Doctors() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [realDoctors, setRealDoctors] = useState<any[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChat, setActiveChat] = useState<any>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    const specialtyParam = searchParams.get('specialty');
    const searchParam = searchParams.get('search');

    if (specialtyParam) {
      const matchedSpecialty = specialties.find(
        (specialty) => normalizeSpecialty(specialty) === normalizeSpecialty(specialtyParam)
      );
      setSelectedSpecialty(matchedSpecialty || 'All');
    } else {
      setSelectedSpecialty('All');
    }

    if (searchParam) {
      setSearchQuery(searchParam);
    } else if (!specialtyParam) {
      setSearchQuery('');
    }
  }, [searchParams]);

  useEffect(() => {
    setIsLoadingDoctors(true);
    const doctorsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'doctor')
    );

    const unsubscribe = onSnapshot(doctorsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Dr. Specialist',
        specialty: doc.data().specialty || 'General Physician',
        rating: doc.data().rating || 4.5,
        reviews: doc.data().reviews || 0,
        location: doc.data().location || 'Health Center',
        image: doc.data().avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.id}`,
        availability: 'Available Today'
      }));
      setRealDoctors(docs);
      setIsLoadingDoctors(false);
    }, (error) => {
      setIsLoadingDoctors(false);
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !activeChat) return;

    const chatId = [user.uid, activeChat.id].sort().join('_');
    const chatQuery = query(
      collection(db, 'messages'),
      and(
        where('chatId', '==', chatId),
        or(
          where('senderUid', '==', user.uid),
          where('receiverUid', '==', user.uid)
        )
      ),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data({ serverTimestamps: 'estimate' }));
      setChatHistory(msgs);
    }, (error) => {
      console.log('Chat history error:', error.message);
    });

    return () => unsubscribe();
  }, [user, activeChat]);

  const filteredDoctors = realDoctors.filter(doc => {
    const matchesSpecialty =
      normalizeSpecialty(selectedSpecialty) === 'all' ||
      normalizeSpecialty(doc.specialty) === normalizeSpecialty(selectedSpecialty);
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  const handleBookNow = async (doctor: any) => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'appointments'), {
        patientUid: user.uid,
        doctorUid: doctor.id,
        patient: user.name,
        avatar: user.avatar,
        type: 'Consultation',
        time: '10:30 AM',
        date: 'Today',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setBookingSuccess(doctor.name);
      setTimeout(() => setBookingSuccess(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'appointments');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !activeChat) return;

    const chatId = [user.uid, activeChat.id].sort().join('_');
    try {
      await addDoc(collection(db, 'messages'), {
        chatId,
        senderUid: user.uid,
        receiverUid: activeChat.id,
        content: message,
        timestamp: serverTimestamp(),
        unread: true
      });
      setMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  return (
    <div className="relative mx-auto min-h-screen max-w-7xl space-y-5 px-2.5 py-3 sm:space-y-6 sm:px-4 sm:py-5 lg:space-y-8 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_55%)]" />
      <header className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/78 px-4 py-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)] backdrop-blur-sm sm:px-5 sm:py-5">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700">
          <Stethoscope size={12} />
          Care Network
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 sm:text-3xl">Find Your Specialist</h1>
        <p className="text-sm font-medium text-slate-500 sm:text-base">Book an appointment with top-rated medical professionals.</p>
      </header>

      {/* Booking Success Toast */}
      <AnimatePresence>
        {bookingSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 size={20} />
            <p className="font-bold">Appointment booked with {bookingSuccess}!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 md:flex-row md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 sm:left-4" size={18} />
          <input 
            type="text" 
            placeholder="Search doctors, specialties, or clinics..."
            className="w-full rounded-2xl border border-slate-100 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-brand-500 sm:py-3 sm:pl-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="md:w-auto px-4 py-2.5 text-sm">
          <Filter size={18} />
          <span>Filters</span>
        </Button>
      </div>

      {/* Specialty Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {specialties.map(s => (
          <button
            key={s}
            onClick={() => setSelectedSpecialty(s)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all sm:px-5 sm:text-sm",
              selectedSpecialty === s 
                ? "bg-brand-600 text-white shadow-lg shadow-brand-200" 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Doctor Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
        {isLoadingDoctors ? (
          <div className="col-span-full py-20 text-center space-y-5 bg-slate-50 rounded-[40px] border border-slate-100">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
              <LoadingSpinner size={36} />
            </div>
            <div>
              <p className="text-xl font-display font-bold text-slate-900">Loading doctors...</p>
              <p className="text-sm text-slate-500 font-medium">Fetching the latest specialists from the database.</p>
            </div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto text-slate-300 shadow-sm">
              <Stethoscope size={40} />
            </div>
            <div>
              <p className="text-xl font-display font-bold text-slate-900">No doctors found</p>
              <p className="text-sm text-slate-500 font-medium">Try adjusting your search or filters.</p>
            </div>
          </div>
        ) : (
          filteredDoctors.map(doc => (
            <div key={doc.id}>
              <Card className="group h-full hover:border-brand-200 transition-all">
                <div className="space-y-4 p-3 sm:p-4 lg:space-y-6 lg:p-6">
                  <div className="flex items-start gap-3">
                    <img src={doc.image} alt={doc.name} className="h-14 w-14 rounded-2xl bg-slate-100 object-cover sm:h-16 sm:w-16 lg:h-20 lg:w-20" />
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center gap-1 text-amber-500">
                        <Star size={12} fill="currentColor" className="sm:size-[14px]" />
                        <span className="text-xs font-bold sm:text-sm">{doc.rating}</span>
                        <span className="text-[10px] font-medium text-slate-400 sm:text-xs">({doc.reviews})</span>
                      </div>
                      <h3 className="truncate text-sm font-display font-bold text-slate-900 sm:text-base lg:text-lg">{doc.name}</h3>
                      <p className="line-clamp-2 text-xs font-bold text-brand-600 sm:text-sm">{doc.specialty}</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-50 pt-3 sm:space-y-3 sm:pt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
                      <MapPin size={14} className="shrink-0 sm:size-4" />
                      <span className="line-clamp-2">{doc.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 sm:text-sm">
                      <Calendar size={14} className="shrink-0 sm:size-4" />
                      <span>{doc.availability}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-3">
                    <Button 
                      variant="primary" 
                      className="flex-1 px-3 py-2 text-xs sm:text-sm"
                      onClick={() => handleBookNow(doc)}
                    >
                      Book Now
                    </Button>
                    <Button 
                      variant="outline" 
                      className="px-3 py-2 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all"
                      onClick={() => setActiveChat(doc)}
                    >
                      <MessageCircle size={18} />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))
        )}
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {activeChat && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-8 right-8 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50"
          >
            <div className="p-4 bg-brand-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={activeChat.image} alt={activeChat.name} className="w-8 h-8 rounded-full bg-white/20" />
                <div>
                  <p className="text-sm font-bold">{activeChat.name}</p>
                  <p className="text-[10px] text-brand-100">Online</p>
                </div>
              </div>
              <button onClick={() => setActiveChat(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="h-64 p-4 bg-slate-50 overflow-y-auto space-y-4 no-scrollbar">
              {chatHistory.length === 0 ? (
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
                  <p className="text-xs text-slate-600">Hello! How can I help you today?</p>
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={cn(
                    "p-3 rounded-2xl text-xs font-medium max-w-[80%] shadow-sm",
                    msg.senderUid === user?.uid 
                      ? "bg-brand-600 text-white rounded-tr-none ml-auto" 
                      : "bg-white text-slate-600 rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input 
                type="text" 
                placeholder="Type a message..."
                className="flex-1 text-xs bg-slate-50 border-none rounded-xl px-3 py-2 focus:ring-1 focus:ring-brand-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit" className="p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors">
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

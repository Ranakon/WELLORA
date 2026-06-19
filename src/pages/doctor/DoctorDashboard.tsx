import React, { useState, useEffect, useRef } from 'react';
import { Card, Button } from '@/src/components/ui/Base';
import { 
  MessageSquare, 
  Calendar, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  MoreVertical,
  Send,
  Phone,
  Video,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, OperationType, handleFirestoreError } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, orderBy, or, and } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (!user) return;

    // Listen for appointments
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('doctorUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(apps);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'appointments'));

    // Listen for messages to build chat list
    const messagesQuery = query(
      collection(db, 'messages'),
      or(
        where('receiverUid', '==', user.uid),
        where('senderUid', '==', user.uid)
      ),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data());
      // Group by the other participant's UID to get unique chats
      const uniqueChatsMap = new Map();
      msgs.forEach((m: any) => {
        const otherUid = m.senderUid === user.uid ? m.receiverUid : m.senderUid;
        if (!uniqueChatsMap.has(otherUid)) {
          uniqueChatsMap.set(otherUid, {
            id: otherUid,
            name: 'Patient', // In a real app, fetch user profile
            lastMsg: m.content,
            time: m.timestamp?.toDate().toLocaleTimeString() || 'Just now',
            unread: m.unread && m.receiverUid === user.uid,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUid}`
          });
        }
      });
      setChats(Array.from(uniqueChatsMap.values()));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));

    return () => {
      unsubscribeAppointments();
      unsubscribeMessages();
    };
  }, [user]);

  useEffect(() => {
    if (!selectedChat || !user) return;

    const chatId = [user.uid, selectedChat.id].sort().join('_');
    const chatQuery = query(
      collection(db, 'messages'),
      and(
        where('chatId', '==', chatId),
        or(
          where('senderUid', '==', user.uid),
          where('receiverUid', '==', user.uid)
        )
      ),
      orderBy('timestamp', 'asc')
    );

    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data({ serverTimestamps: 'estimate' }));
      setChatMessages(msgs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));

    return () => unsubscribeChat();
  }, [selectedChat, user]);

  const handleAppointment = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat || !user) return;

    const chatId = [user.uid, selectedChat.id].sort().join('_');
    try {
      await addDoc(collection(db, 'messages'), {
        chatId,
        senderUid: user.uid,
        receiverUid: selectedChat.id,
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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Doctor Dashboard</h1>
          <p className="text-slate-500 font-medium">Welcome back, {user?.name || 'Doctor'}. You have {appointments.length} pending requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl">
            <Calendar size={18} className="mr-2" />
            <span>Schedule</span>
          </Button>
          <Button variant="primary" className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
            <span>Go Online</span>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointment Requests */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-slate-900">Appointment Requests</h2>
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              {appointments.length} New
            </span>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {appointments.map((app) => (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="p-4 hover:border-emerald-200 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={app.avatar} alt={app.patient} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100" />
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-slate-900">{app.patient}</h3>
                        <p className="text-xs text-slate-500 font-medium">{app.type} • {app.time}</p>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleAppointment(app.id, 'accepted')}
                        className="flex-1 py-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2 size={14} className="mr-1" />
                        Accept
                      </Button>
                      <Button 
                        onClick={() => handleAppointment(app.id, 'rejected')}
                        variant="outline" 
                        className="flex-1 py-2 text-xs border-rose-100 text-rose-600 hover:bg-rose-50"
                      >
                        <XCircle size={14} className="mr-1" />
                        Reject
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            {appointments.length === 0 && (
              <div className="py-12 text-center space-y-3 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-sm font-bold text-slate-400">All caught up!</p>
              </div>
            )}
          </div>
        </div>

        {/* Inbox / Chat */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex overflow-hidden border-none shadow-2xl">
            {/* Chat List */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-white">
              <div className="p-6 border-b border-slate-100 space-y-4">
                <h2 className="text-xl font-display font-bold text-slate-900">Inbox</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search chats..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group",
                      selectedChat?.id === chat.id ? "bg-emerald-50 shadow-sm" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="relative">
                      <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-xl bg-slate-100" />
                      {chat.unread && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-bold text-slate-900 truncate">{chat.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{chat.time}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{chat.lastMsg}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-slate-50/30">
              {selectedChat ? (
                <>
                  <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={selectedChat.avatar} alt={selectedChat.name} className="w-10 h-10 rounded-xl bg-slate-50" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{selectedChat.name}</p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          <span>Online</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                        <Phone size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                        <Video size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={cn("flex gap-3 max-w-[80%]", msg.senderUid === user?.uid ? "ml-auto flex-row-reverse" : "")}>
                        <img 
                          src={msg.senderUid === user?.uid ? user.avatar : selectedChat.avatar} 
                          className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" 
                        />
                        <div className={cn(
                          "p-3 rounded-2xl shadow-sm text-xs font-medium leading-relaxed",
                          msg.senderUid === user?.uid 
                            ? "bg-emerald-600 text-white rounded-tr-none" 
                            : "bg-white text-slate-700 rounded-tl-none"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-4 bg-white border-t border-slate-100">
                    <form 
                      onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                      className="flex gap-2"
                    >
                      <input 
                        type="text" 
                        placeholder="Type your medical advice..."
                        className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                      <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 p-3 h-auto rounded-xl">
                        <Send size={20} />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center">
                    <MessageSquare size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-slate-900">Select a Conversation</h3>
                    <p className="text-sm text-slate-500 font-medium">Choose a patient from the left to start chatting.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button } from '@/src/components/ui/Base';
import { 
  MessageSquare, 
  TrendingUp, 
  User, 
  Search, 
  MoreVertical,
  Send,
  Phone,
  Video,
  DollarSign,
  PieChart,
  Target
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, OperationType, handleFirestoreError } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, or, and } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export default function AdvisorDashboard() {
  const { user } = useAuth();
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
      const uniqueChatsMap = new Map();
      msgs.forEach((m: any) => {
        const otherUid = m.senderUid === user.uid ? m.receiverUid : m.senderUid;
        if (!uniqueChatsMap.has(otherUid)) {
          uniqueChatsMap.set(otherUid, {
            id: otherUid,
            name: 'User', // In a real app, fetch user profile
            lastMsg: m.content,
            time: m.timestamp?.toDate().toLocaleTimeString() || 'Just now',
            unread: m.unread && m.receiverUid === user.uid,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUid}`
          });
        }
      });
      setChats(Array.from(uniqueChatsMap.values()));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));

    return () => unsubscribeMessages();
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
          <h1 className="text-3xl font-display font-bold text-slate-900">Financial Advisor Dashboard</h1>
          <p className="text-slate-500 font-medium">Welcome back, {user?.name || 'Advisor'}. You have {chats.filter(c => c.unread).length} unread messages.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl">
            <PieChart size={18} className="mr-2" />
            <span>Reports</span>
          </Button>
          <Button variant="primary" className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
            <Target size={18} className="mr-2" />
            <span>Set Goals</span>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-6 bg-indigo-600 text-white border-none shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total Savings Generated</p>
            </div>
            <h2 className="text-3xl font-display font-bold">₹12.5L</h2>
            <p className="text-[10px] font-bold mt-2 text-indigo-100">+15% from last month</p>
          </Card>
          <Card className="p-6 bg-white border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <User size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Clients</p>
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900">48</h2>
            <p className="text-[10px] font-bold mt-2 text-emerald-600">8 new this week</p>
          </Card>
          <Card className="p-6 bg-white border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <MessageSquare size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Avg. Response Time</p>
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900">12m</h2>
            <p className="text-[10px] font-bold mt-2 text-amber-600">Top 5% of advisors</p>
          </Card>
        </div>

        {/* Inbox / Chat */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex overflow-hidden border-none shadow-2xl">
            {/* Chat List */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-white">
              <div className="p-6 border-b border-slate-100 space-y-4">
                <h2 className="text-xl font-display font-bold text-slate-900">User Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
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
                      selectedChat?.id === chat.id ? "bg-indigo-50 shadow-sm" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="relative">
                      <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-xl bg-slate-100" />
                      {chat.unread && <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full" />}
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
                        <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                          <span>Online</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <Phone size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
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
                            ? "bg-indigo-600 text-white rounded-tr-none" 
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
                        placeholder="Type your financial advice..."
                        className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 p-3 h-auto rounded-xl">
                        <Send size={20} />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center">
                    <TrendingUp size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-slate-900">Select a User</h3>
                    <p className="text-sm text-slate-500 font-medium">Choose a user from the left to start chatting.</p>
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

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import { Card, Button, LoadingSpinner } from '@/src/components/ui/Base';
import { Mail, Lock, User, Stethoscope, TrendingUp, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [specialty, setSpecialty] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) return;
    setError(null);

    if (role === 'doctor' && !specialty) {
      setError('Please select your medical specialty.');
      return;
    }

    try {
      setIsRegistering(true);
      await register(email, password, role, name, specialty);
      navigate('/');
    } catch (err: any) {
      let message = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsRegistering(false);
    }
  };

  const roles: { id: UserRole; label: string; icon: any; desc: string; color: string }[] = [
    { id: 'user', label: 'Patient / User', icon: User, desc: 'Access health dashboard & procedures', color: 'text-brand-600 bg-brand-50 border-brand-100' },
    { id: 'doctor', label: 'Doctor', icon: Stethoscope, desc: 'Manage appointments & patient chats', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { id: 'advisor', label: 'Financial Advisor', icon: TrendingUp, desc: 'Help users optimize medical costs', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="grid w-full max-w-4xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="hidden lg:block space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-600 rounded-xl text-white shadow-lg shadow-brand-200">
              <Sparkles size={24} />
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900">WELLORA</h1>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-display font-bold text-slate-900 leading-tight">
              Join the future of <span className="text-brand-600">Health Management</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Whether you're a patient seeking care, a doctor providing it, or an advisor optimizing it, 
              Wellora connects you all in one seamless ecosystem.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">10k+</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Active Users</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">500+</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Certified Experts</p>
            </div>
          </div>
        </div>

        <Card className="border-none p-5 shadow-2xl sm:p-8 md:p-10">
          <div className="mb-8">
            <h3 className="text-2xl font-display font-bold text-slate-900">Create Account</h3>
            <p className="text-slate-500 font-medium">Choose your role and get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold"
                >
                  <AlertCircle size={18} />
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Your Role</label>
              <div className="grid grid-cols-1 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    disabled={isRegistering}
                    onClick={() => setRole(r.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group disabled:cursor-not-allowed disabled:opacity-70",
                      role === r.id ? r.color : "bg-white border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-xl transition-transform group-hover:scale-110",
                      role === r.id ? "bg-white shadow-sm" : "bg-slate-50"
                    )}>
                      <r.icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{r.label}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{r.desc}</p>
                    </div>
                    {role === r.id && (
                      <div className="ml-auto w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center text-white">
                        <CheckCircle2 size={12} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    disabled={isRegistering}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {role === 'doctor' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Specialty</label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      required
                      disabled={isRegistering}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500 appearance-none"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                    >
                      <option value="">Select Specialty</option>
                      <option value="Physician">Physician</option>
                      <option value="Dermatologist">Dermatologist</option>
                      <option value="Dentist">Dentist</option>
                      <option value="Cardiologist">Cardiologist</option>
                      <option value="Neurologist">Neurologist</option>
                      <option value="Pediatrician">Pediatrician</option>
                      <option value="Psychiatrist">Psychiatrist</option>
                      <option value="Surgeon">Surgeon</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    disabled={isRegistering}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    disabled={isRegistering}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" variant="primary" disabled={isRegistering} className="w-full py-6 rounded-2xl shadow-lg shadow-brand-100">
              {isRegistering ? <LoadingSpinner size={18} /> : <ArrowRight size={18} className="ml-2" />}
              <span>{isRegistering ? 'Creating Account...' : 'Create Account'}</span>
            </Button>

            <p className="text-center text-sm text-slate-500 font-medium">
              Already have an account? <Link to="/login" className="text-brand-600 font-bold hover:underline">Sign In</Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}

function CheckCircle2({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
    </svg>
  );
}

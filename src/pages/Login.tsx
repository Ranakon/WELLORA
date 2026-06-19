import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '@/src/components/ui/Base';
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      let message = 'Invalid email or password. Please try again.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3">
            <div className="p-2 bg-brand-600 rounded-xl text-white shadow-lg shadow-brand-200">
              <Sparkles size={24} />
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900">WELLORA</h1>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 font-medium">Sign in to your account to continue.</p>
          </div>
        </div>

        <Card className="border-none p-5 shadow-2xl sm:p-8">
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

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
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
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold">
              <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-200 text-brand-600 focus:ring-brand-500" />
                <span>Remember Me</span>
              </label>
              <button type="button" className="text-brand-600 hover:underline">Forgot Password?</button>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full py-6 rounded-2xl shadow-lg shadow-brand-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-slate-500 font-medium">
              Don't have an account? <Link to="/register" className="text-brand-600 font-bold hover:underline">Create Account</Link>
            </p>
          </form>
        </Card>

        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-center">
          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1">Demo Credentials</p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-[10px] font-medium text-slate-600">
            <span>doctor@wellora.com</span>
            <span>advisor@wellora.com</span>
            <span>user@wellora.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

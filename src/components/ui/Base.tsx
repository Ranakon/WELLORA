import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export const Card = ({ children, className, hover = true, ...props }: { children: React.ReactNode; className?: string; hover?: boolean; [key: string]: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={hover ? { y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" } : {}}
    className={cn("overflow-hidden rounded-[24px] border border-white/80 bg-white/96 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.28)] ring-1 ring-slate-100/80 backdrop-blur-sm transition-shadow duration-300 sm:rounded-[26px]", className)}
    {...props}
  >
    {children}
  </motion.div>
);

export const Button = ({ 
  children, 
  variant = 'primary', 
  className,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'outline' }) => {
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-200",
    secondary: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-slate-200 text-slate-600 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100"
  };
  
  return (
    <button 
      className={cn(
        "flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 font-medium transition-all active:scale-95 disabled:opacity-50 sm:rounded-xl sm:py-2",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const LoadingSpinner = ({
  className,
  size = 18
}: {
  className?: string;
  size?: number;
}) => (
  <span
    className={cn("inline-block animate-spin rounded-full border-2 border-current border-t-transparent", className)}
    style={{ width: size, height: size }}
    aria-hidden="true"
  />
);

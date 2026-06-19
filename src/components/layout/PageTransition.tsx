import React from 'react';
import { motion } from 'motion/react';

export const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="h-full"
  >
    {children}
  </motion.div>
);

'use client';

import { motion } from 'motion/react';
import { pagePresence } from '@/lib/motion-presets';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={pagePresence} initial="initial" animate="animate">
      {children}
    </motion.div>
  );
}

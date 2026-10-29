'use client';

import { m } from 'motion/react';
import { pagePresence } from '@/lib/motion-presets';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <m.div variants={pagePresence} initial="initial" animate="animate">
      {children}
    </m.div>
  );
}

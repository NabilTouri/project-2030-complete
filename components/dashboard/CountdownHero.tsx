'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { differenceInDays, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Target } from 'lucide-react';

interface CountdownHeroProps {
  targetDate: string;
  currentDate: Date;
  firstLogDate?: string;
}

export default function CountdownHero({ targetDate, currentDate, firstLogDate }: CountdownHeroProps) {
  const target = new Date(targetDate);
  const daysRemaining = Math.max(0, differenceInDays(target, currentDate));

  // Calculate progress percentage
  const startDate = firstLogDate ? new Date(firstLogDate) : new Date();
  const totalDays = differenceInDays(target, startDate);
  const elapsed = differenceInDays(currentDate, startDate);
  const progressPercent = totalDays > 0 ? Math.min(100, Math.max(0, (elapsed / totalDays) * 100)) : 0;

  // Animated count
  const [displayCount, setDisplayCount] = useState(0);
  const springValue = useSpring(0, { stiffness: 50, damping: 20 });
  const rounded = useTransform(springValue, (v) => Math.round(v));

  useEffect(() => {
    springValue.set(daysRemaining);
    const unsubscribe = rounded.on('change', (v) => setDisplayCount(v));
    return () => unsubscribe();
  }, [daysRemaining, springValue, rounded]);

  const formattedDate = format(currentDate, "EEEE d MMMM yyyy", { locale: it });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 md:p-8"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-purple/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />

      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Target size={18} className="text-primary" />
          <span className="text-xs font-medium uppercase tracking-widest text-primary">
            Project 2030
          </span>
        </div>

        {/* Main countdown number */}
        <motion.div className="mb-2">
          <span className="text-6xl md:text-8xl font-bold tracking-tighter text-foreground">
            {displayCount}
          </span>
        </motion.div>

        <p className="text-sm text-muted-foreground mb-6">
          giorni al <span className="font-medium text-foreground">3 Maggio 2030</span>
        </p>

        {/* Progress bar */}
        <div className="max-w-xs mx-auto">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
            <span>Inizio</span>
            <span>{progressPercent.toFixed(1)}% completato</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
              className="h-full bg-gradient-to-r from-primary to-brand-purple rounded-full"
            />
          </div>
        </div>

        {/* Current date */}
        <p className="text-xs text-muted-foreground mt-4 capitalize">
          {formattedDate}
        </p>
      </div>
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Dumbbell, BedDouble, ChevronRight } from 'lucide-react';
import type { WorkoutDayWithExercises } from '@/lib/types';
import { DAY_TYPE_COLORS } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface TodayWorkoutCardProps {
  workoutDay: WorkoutDayWithExercises | null;
  loading: boolean;
}

const DAY_TYPE_LABELS: Record<string, string> = {
  push: 'Petto · Spalle · Tricipiti',
  pull: 'Schiena · Bicipiti · Avambracci',
  legs: 'Quadricipiti · Femorali · Polpacci',
  cardio: 'Cardio · Resistenza',
  custom: 'Allenamento personalizzato',
};

export default function TodayWorkoutCard({ workoutDay, loading }: TodayWorkoutCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-card border border-border p-5 animate-pulse">
        <div className="h-4 bg-muted rounded w-40 mb-3" />
        <div className="h-6 bg-muted rounded w-56 mb-2" />
        <div className="h-4 bg-muted rounded w-48" />
      </div>
    );
  }

  const isRestDay = !workoutDay || workoutDay.day_type === 'rest';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2/*, duration: 0.4*/ }}
      whileHover={{ scale: 1.01 }}
      className="group"
    >
      <Link href={isRestDay ? '#' : '/workout'}>
        <div
          className={`rounded-xl border p-5 transition-all ${
            isRestDay
              ? 'bg-card border-border'
              : 'bg-card border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
          }`}
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Allenamento di oggi
          </p>

          {isRestDay ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <BedDouble size={20} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">🧘 Giorno di riposo</p>
                <p className="text-sm text-muted-foreground">
                  Recupera bene — il riposo è parte dell&apos;allenamento
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${DAY_TYPE_COLORS[workoutDay!.day_type || 'custom']}20` }}
                >
                  <Dumbbell
                    size={20}
                    style={{ color: DAY_TYPE_COLORS[workoutDay!.day_type || 'custom'] }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">💪 {workoutDay!.day_label}</p>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                      style={{
                        backgroundColor: `${DAY_TYPE_COLORS[workoutDay!.day_type || 'custom']}15`,
                        color: DAY_TYPE_COLORS[workoutDay!.day_type || 'custom'],
                      }}
                    >
                      {workoutDay!.day_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {DAY_TYPE_LABELS[workoutDay!.day_type || 'custom'] || workoutDay!.day_type}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

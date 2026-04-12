'use client';

import { motion } from 'framer-motion';
import { Check, Clock, ChevronRight } from 'lucide-react';
import type { DailyRoutineWithLog } from '@/lib/types';
import Link from 'next/link';

interface RoutineSnapshotProps {
  routineBlocks: DailyRoutineWithLog[];
  currentBlockIndex: number;
  loading: boolean;
}

const BLOCK_TYPE_ICONS: Record<string, string> = {
  sleep: '😴',
  commute: '🚗',
  work: '💼',
  gym: '🏋️',
  focus: '🎯',
  free: '🌿',
  uni: '📚',
  short: '☕',
};

export default function RoutineSnapshot({ routineBlocks, currentBlockIndex, loading }: RoutineSnapshotProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-card border border-border p-5 animate-pulse">
        <div className="h-4 bg-muted rounded w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (routineBlocks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl bg-card border border-border p-5"
      >
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Routine di oggi
        </p>
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">Nessuna routine configurata</p>
          <Link href="/routine/edit" className="text-sm text-primary hover:underline">
            Configura la routine →
          </Link>
        </div>
      </motion.div>
    );
  }

  // Show surrounding blocks: previous, current, next
  const startIdx = Math.max(0, currentBlockIndex - 1);
  const endIdx = Math.min(routineBlocks.length, currentBlockIndex + 2);
  const visibleBlocks = routineBlocks.slice(startIdx, endIdx);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Link href="/routine">
        <div className="rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Routine di oggi
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} />
              <span>
                {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            {visibleBlocks.map((block, idx) => {
              const absoluteIdx = startIdx + idx;
              const isCurrent = absoluteIdx === currentBlockIndex;
              const isPast = absoluteIdx < currentBlockIndex;
              const isCompleted = block.log?.completed;

              return (
                <div
                  key={block.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    isCurrent
                      ? 'bg-primary/10 border border-primary/20 pulse-glow'
                      : isPast
                      ? 'opacity-60'
                      : ''
                  }`}
                >
                  <span className="text-sm w-5">
                    {isCompleted ? (
                      <Check size={16} className="text-brand-green" />
                    ) : isCurrent ? (
                      '►'
                    ) : (
                      '○'
                    )}
                  </span>
                  <span className="text-sm">
                    {BLOCK_TYPE_ICONS[block.block_type] || '📌'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm truncate ${isCurrent ? 'font-medium' : ''}`}>
                        {block.label}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded">
                          LIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {block.time_start} — {block.time_end}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mt-2">
            <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

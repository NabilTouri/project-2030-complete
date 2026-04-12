'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRoutineNow } from '@/hooks/useRoutineNow';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Check } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';

const BLOCK_TYPE_COLORS: Record<string, string> = {
  sleep: 'var(--block-sleep)',
  commute: 'var(--block-commute)',
  work: 'var(--block-work)',
  gym: 'var(--block-gym)',
  focus: 'var(--block-focus)',
  free: 'var(--block-free)',
  uni: 'var(--block-uni)',
  short: 'var(--block-short)',
};

const BLOCK_TYPE_ICONS: Record<string, string> = {
  sleep: '😴', commute: '🚗', work: '💼', gym: '🏋️',
  focus: '🎯', free: '🌿', uni: '📚', short: '☕',
};

export default function RoutinePage() {
  const [date] = useState(new Date());
  const { routineBlocks, currentBlockIndex, loading } = useRoutineNow(date);
  const supabase = createClient();

  const toggleComplete = async (blockId: string, completed: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = format(date, 'yyyy-MM-dd');
      await supabase.from('routine_logs').upsert({
        user_id: user.id,
        log_date: dateStr,
        routine_block_id: blockId,
        completed,
      }, { onConflict: 'user_id,log_date,routine_block_id' });

      if (completed) toast.success('Blocco completato! ✅');
    } catch {
      toast.error('Errore nel salvataggio');
    }
  };

  // Calculate day stats
  const stats = routineBlocks.reduce((acc, block) => {
    if (!block.time_start || !block.time_end) return acc;
    const [startH, startM] = block.time_start.split(':').map(Number);
    const [endH, endM] = block.time_end.split(':').map(Number);
    const hours = (endH + endM / 60) - (startH + startM / 60);

    if (block.block_type === 'work') acc.work += hours;
    if (block.block_type === 'focus') acc.focus += hours;
    if (block.block_type === 'gym') acc.gym += hours;
    if (block.block_type === 'sleep') acc.sleep += hours;
    return acc;
  }, { work: 0, focus: 0, gym: 0, sleep: 0 });

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Routine di Oggi</h1>
        <Link href="/routine/edit">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil size={14} />
            Modifica
          </Button>
        </Link>
      </div>

      {routineBlocks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📅</p>
          <h3 className="text-lg font-medium mb-2">Nessuna routine configurata</h3>
          <p className="text-sm text-muted-foreground mb-4">Crea la tua routine per organizzare la giornata</p>
          <Link href="/routine/edit"><Button>Configura routine</Button></Link>
        </div>
      ) : (
        <>
          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[42px] top-0 bottom-0 w-px bg-border" />

            <div className="space-y-1">
              {routineBlocks.map((block, idx) => {
                const isCurrent = idx === currentBlockIndex;
                const isPast = idx < currentBlockIndex;
                const isCompleted = block.log?.completed;

                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex gap-3 py-2 ${isCurrent ? 'pulse-glow rounded-xl p-3 bg-primary/5' : ''}`}
                  >
                    {/* Time column */}
                    <div className="w-[34px] text-right shrink-0">
                      <span className={`text-xs font-mono ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {block.time_start}
                      </span>
                    </div>

                    {/* Dot */}
                    <div className="relative z-10 mt-1">
                      <div
                        className="w-3 h-3 rounded-full border-2"
                        style={{
                          borderColor: BLOCK_TYPE_COLORS[block.block_type],
                          backgroundColor: isCompleted || isCurrent ? BLOCK_TYPE_COLORS[block.block_type] : 'var(--background)',
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className={`flex-1 flex items-center justify-between min-w-0 ${isPast && !isCurrent ? 'opacity-50' : ''}`}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {BLOCK_TYPE_ICONS[block.block_type]}
                          </span>
                          <span className={`text-sm truncate ${isCurrent ? 'font-medium' : ''}`}>
                            {block.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded shrink-0">
                              ORA
                            </span>
                          )}
                        </div>
                        {block.description && (
                          <p className="text-xs text-muted-foreground truncate">{block.description}</p>
                        )}
                      </div>

                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={(c) => toggleComplete(block.id, !!c)}
                        className="shrink-0"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Day stats */}
          <div className="mt-8 p-4 rounded-xl bg-card border border-border">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Statistiche del giorno
            </h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: 'Lavoro', value: stats.work, icon: '💼' },
                { label: 'Focus', value: stats.focus, icon: '🎯' },
                { label: 'Palestra', value: stats.gym, icon: '🏋️' },
                { label: 'Sonno', value: stats.sleep, icon: '😴' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-lg">{s.icon}</p>
                  <p className="text-sm font-medium">{s.value.toFixed(1)}h</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

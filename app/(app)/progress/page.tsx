'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Flame, Trophy, Calendar } from 'lucide-react';
import { format, subDays, subWeeks, startOfWeek, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { WorkoutLog } from '@/lib/types';

const MILESTONES = [
  { key: 'first_week', label: '🏅 Prima settimana completa', threshold: 7 },
  { key: 'one_month', label: '🥇 1 mese di streak', threshold: 30 },
  { key: '50_workouts', label: '💪 50 allenamenti', threshold: 50 },
  { key: '100_workouts', label: '🏆 100 allenamenti', threshold: 100 },
];

export default function ProgressPage() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLogs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false });

      const allLogs = (data || []) as WorkoutLog[];
      setLogs(allLogs);

      // Calculate streak
      let currentStreak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const dateStr = format(subDays(today, i), 'yyyy-MM-dd');
        const log = allLogs.find((l) => l.log_date === dateStr);
        if (log?.completed) {
          currentStreak++;
        } else if (i > 0) {
          break;
        }
      }
      setStreak(currentStreak);
      setTotalCompleted(allLogs.filter((l) => l.completed).length);
      setLoading(false);
    }
    fetchLogs();
  }, [supabase]);

  // Weekly grid (last 7 days)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const log = logs.find((l) => l.log_date === dateStr);
    const isFuture = date > new Date();

    let status: 'completed' | 'skipped' | 'rest' | 'future' | 'none' = 'none';
    if (isFuture) status = 'future';
    else if (log?.completed) status = 'completed';
    else if (log?.skipped) status = 'skipped';

    return { date, dateStr, status, label: format(date, 'EEE', { locale: it }) };
  });

  // Chart data (last 8 weeks)
  const chartData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), 7 - i), { weekStartsOn: 1 });
    let count = 0;
    for (let d = 0; d < 7; d++) {
      const dateStr = format(addDays(weekStart, d), 'yyyy-MM-dd');
      if (logs.find((l) => l.log_date === dateStr && l.completed)) count++;
    }
    return { week: `S${i + 1}`, count };
  });

  const statusColors = {
    completed: 'bg-brand-green',
    skipped: 'bg-brand-red',
    rest: 'bg-muted',
    future: 'bg-muted/30',
    none: 'bg-muted/50',
  };

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-36" />
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Progressi</h1>

      {/* Streak */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-orange/20 to-brand-red/10 border border-brand-orange/20 p-6 text-center mb-6"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-5xl mb-2"
        >
          🔥
        </motion.div>
        <p className="text-4xl font-bold tracking-tighter">{streak}</p>
        <p className="text-sm text-muted-foreground">giorni consecutivi</p>
      </motion.div>

      {/* Weekly grid */}
      <div className="rounded-xl bg-card border border-border p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={14} className="text-muted-foreground" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Panoramica Settimanale
          </h3>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day.dateStr} className="text-center">
              <p className="text-[10px] text-muted-foreground mb-1 capitalize">{day.label}</p>
              <div
                className={`w-full aspect-square rounded-lg ${statusColors[day.status]} flex items-center justify-center`}
              >
                {day.status === 'completed' && <span className="text-xs">✓</span>}
                {day.status === 'skipped' && <span className="text-xs">✗</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-brand-green" /> Completato</span>
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-brand-red" /> Saltato</span>
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-muted" /> Riposo</span>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-card border border-border p-4 mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Frequenza — Ultime 8 settimane
        </h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Milestones */}
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={14} className="text-muted-foreground" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Obiettivi Raggiunti
          </h3>
        </div>
        <div className="space-y-2">
          {MILESTONES.map((m) => {
            const unlocked = totalCompleted >= m.threshold;
            return (
              <div
                key={m.key}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  unlocked ? 'bg-brand-green/5 border-brand-green/20' : 'bg-muted/20 border-border opacity-50'
                }`}
              >
                <span className="text-sm">{m.label}</span>
                {unlocked && <span className="text-brand-green text-sm">✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

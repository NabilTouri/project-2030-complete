'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Pencil, AlertTriangle, Plus } from 'lucide-react';
import Link from 'next/link';
import type { WorkoutPlanWithDays, WorkoutDayWithExercises } from '@/lib/types';
import { DAY_TYPE_COLORS } from '@/lib/types';
import { useProfile } from '@/hooks/useProfile';
import { CONDITION_WARNINGS } from '@/lib/conditions';

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export default function WorkoutPage() {
  const [plan, setPlan] = useState<WorkoutPlanWithDays | null>(null);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();
  const supabase = createClient();

  useEffect(() => {
    async function fetchPlan() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: planData } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!planData) {
        setLoading(false);
        return;
      }

      const { data: days } = await supabase
        .from('workout_days')
        .select('*')
        .eq('plan_id', planData.id)
        .order('sort_order');

      const daysWithExercises: WorkoutDayWithExercises[] = [];
      for (const day of days || []) {
        const { data: exercises } = await supabase
          .from('exercises')
          .select('*')
          .eq('workout_day_id', day.id)
          .order('sort_order');

        daysWithExercises.push({ ...day, exercises: exercises || [] });
      }

      setPlan({ ...planData, workout_days: daysWithExercises });
      setLoading(false);
    }

    fetchPlan();
  }, [supabase]);

  const currentDayPlan = plan?.workout_days.find((d) => d.day_of_week === selectedDay);

  // Get condition warnings
  const warnings = (profile?.physical_conditions || [])
    .filter((c) => c in CONDITION_WARNINGS)
    .map((c) => CONDITION_WARNINGS[c].it);

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="flex gap-2">{[...Array(7)].map((_, i) => <div key={i} className="h-10 w-12 bg-muted rounded-lg" />)}</div>
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Plus size={28} className="text-muted-foreground" />
        </div>
        <h2 className="text-lg font-medium mb-2">Nessun piano di allenamento</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Crea il tuo primo piano per iniziare a tracciare i tuoi allenamenti
        </p>
        <Link href="/workout/edit">
          <Button>Crea piano</Button>
        </Link>
      </div>
    );
  }

  // Group exercises by section
  const exercisesBySection: Record<string, NonNullable<typeof currentDayPlan>['exercises']> = {};
  if (currentDayPlan && currentDayPlan.exercises) {
    for (const ex of currentDayPlan.exercises) {
      const section = ex.section || 'Esercizi';
      if (!exercisesBySection[section]) exercisesBySection[section] = [];
      exercisesBySection[section].push(ex);
    }
  }

  return (
    <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">{plan.name}</h1>
          {plan.phase && <p className="text-sm text-muted-foreground">{plan.phase}</p>}
        </div>
        <Link href="/workout/edit">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil size={14} />
            Modifica
          </Button>
        </Link>
      </div>

      {/* Condition warnings */}
      {warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-brand-orange/10 border border-brand-orange/20">
              <AlertTriangle size={16} className="text-brand-orange mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* Day tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto no-scrollbar">
        {[1, 2, 3, 4, 5, 6, 0].map((day) => {
          const dayPlan = plan.workout_days.find((d) => d.day_of_week === day);
          const isSelected = selectedDay === day;
          const isToday = new Date().getDay() === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`relative flex flex-col items-center min-w-[48px] px-3 py-2 rounded-lg border text-sm transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <span className="text-[10px] uppercase font-medium mb-0.5">
                {WEEKDAY_LABELS[day]}
              </span>
              {dayPlan && dayPlan.day_type !== 'rest' && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: DAY_TYPE_COLORS[(dayPlan.day_type as keyof typeof DAY_TYPE_COLORS)] || '#6b7280' }}
                />
              )}
              {isToday && (
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Day content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {!currentDayPlan || currentDayPlan.day_type === 'rest' ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🧘</p>
              <h3 className="text-lg font-medium">Giorno di riposo</h3>
              <p className="text-sm text-muted-foreground">Recupera bene per la prossima sessione</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-medium">{currentDayPlan.day_label}</h2>
                <Badge
                  style={{
                    backgroundColor: `${DAY_TYPE_COLORS[(currentDayPlan.day_type as keyof typeof DAY_TYPE_COLORS)] || '#6b7280'}20`,
                    color: DAY_TYPE_COLORS[(currentDayPlan.day_type as keyof typeof DAY_TYPE_COLORS)] || '#6b7280',
                  }}
                >
                  {currentDayPlan.day_type}
                </Badge>
              </div>

              {Object.entries(exercisesBySection).map(([section, exercises]) => (
                <div key={section} className="mb-6">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    {section}
                  </h3>
                  <div className="space-y-2">
                    {exercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/20 transition-all"
                      >
                        <div>
                          <p className="text-sm font-medium">{ex.name}</p>
                          {ex.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5">{ex.notes}</p>
                          )}
                        </div>
                        {ex.sets && (
                          <span className="text-sm text-muted-foreground font-mono">{ex.sets}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <Separator className="my-4" />
              <Link
                href={`/workout/${new Date().toISOString().split('T')[0]}`}
                className={buttonVariants({ className: 'w-full justify-center' })}
              >
                Registra allenamento
              </Link>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

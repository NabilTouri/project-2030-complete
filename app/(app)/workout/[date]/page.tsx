'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Exercise, WorkoutDay } from '@/lib/types';
import Link from 'next/link';

export default function WorkoutLogPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);
  const [workoutDay, setWorkoutDay] = useState<WorkoutDay | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [completed, setCompleted] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [effort, setEffort] = useState([5]);
  const [notes, setNotes] = useState('');
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, { sets: string; reps: string; weight: string; notes: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dayOfWeek = new Date(date).getDay();

      const { data: plan } = await supabase
        .from('workout_plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!plan) { setLoading(false); return; }

      const { data: day } = await supabase
        .from('workout_days')
        .select('*')
        .eq('plan_id', plan.id)
        .eq('day_of_week', dayOfWeek)
        .single();

      if (day) {
        setWorkoutDay(day);
        const { data: exs } = await supabase
          .from('exercises')
          .select('*')
          .eq('workout_day_id', day.id)
          .order('sort_order');

        setExercises(exs || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [date, supabase]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: log, error } = await supabase
        .from('workout_logs')
        .upsert({
          user_id: user.id,
          log_date: date,
          workout_day_id: workoutDay?.id,
          completed,
          skipped,
          skip_reason: skipReason || null,
          overall_notes: notes || null,
          perceived_effort: effort[0],
        }, { onConflict: 'user_id,log_date' })
        .select()
        .single();

      if (error) throw error;

      // Save exercise logs
      for (const [exerciseId, logData] of Object.entries(exerciseLogs)) {
        if (logData.sets || logData.reps || logData.weight) {
          await supabase.from('exercise_logs').insert({
            workout_log_id: log.id,
            exercise_id: exerciseId,
            sets_completed: parseInt(logData.sets) || null,
            reps_completed: logData.reps || null,
            weight_kg: logData.weight || null,
            notes: logData.notes || null,
          });
        }
      }

      toast.success('Allenamento salvato! 💪');
      router.push('/workout');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/workout" className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Log Allenamento</h1>
          <p className="text-sm text-muted-foreground">{date}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Status */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={completed} onCheckedChange={(c) => { setCompleted(!!c); if (c) setSkipped(false); }} />
            <span className="text-sm">Completato ✅</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={skipped} onCheckedChange={(c) => { setSkipped(!!c); if (c) setCompleted(false); }} />
            <span className="text-sm">Saltato ❌</span>
          </label>
        </div>

        {skipped && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Label htmlFor="skipReason">Motivo</Label>
            <Input id="skipReason" value={skipReason} onChange={(e) => setSkipReason(e.target.value)} placeholder="Perché hai saltato?" />
          </motion.div>
        )}

        {/* RPE */}
        <div className="space-y-2">
          <Label>Sforzo percepito (RPE): {effort[0]}/10</Label>
          <Slider value={effort} onValueChange={(val) => setEffort(Array.isArray(val) ? [...val] : [val as number])} min={1} max={10} step={1} />
        </div>

        {/* Exercise logs */}
        {exercises.map((ex) => (
          <div key={ex.id} className="p-4 rounded-xl bg-card border border-border space-y-3">
            <p className="font-medium text-sm">{ex.name}</p>
            <p className="text-xs text-muted-foreground">{ex.sets}</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Serie</Label>
                <Input
                  type="number"
                  placeholder="4"
                  className="h-9"
                  value={exerciseLogs[ex.id]?.sets || ''}
                  onChange={(e) =>
                    setExerciseLogs((p) => ({ ...p, [ex.id]: { ...p[ex.id], sets: e.target.value, reps: p[ex.id]?.reps || '', weight: p[ex.id]?.weight || '', notes: p[ex.id]?.notes || '' } }))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Reps</Label>
                <Input
                  placeholder="10,10,8"
                  className="h-9"
                  value={exerciseLogs[ex.id]?.reps || ''}
                  onChange={(e) =>
                    setExerciseLogs((p) => ({ ...p, [ex.id]: { ...p[ex.id], reps: e.target.value, sets: p[ex.id]?.sets || '', weight: p[ex.id]?.weight || '', notes: p[ex.id]?.notes || '' } }))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Kg</Label>
                <Input
                  placeholder="20,22.5"
                  className="h-9"
                  value={exerciseLogs[ex.id]?.weight || ''}
                  onChange={(e) =>
                    setExerciseLogs((p) => ({ ...p, [ex.id]: { ...p[ex.id], weight: e.target.value, sets: p[ex.id]?.sets || '', reps: p[ex.id]?.reps || '', notes: p[ex.id]?.notes || '' } }))
                  }
                />
              </div>
            </div>
          </div>
        ))}

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Note sessione</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Come è andato l'allenamento?" rows={3} />
        </div>

        <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Save size={16} /> Salva</>}
        </Button>
      </div>
    </div>
  );
}

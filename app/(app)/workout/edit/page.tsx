'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { DAY_TYPE_COLORS, type DayType } from '@/lib/types';

const SECTIONS = ['Riscaldamento', 'Esercizi principali', 'Core', 'Stretching'];
const DAY_TYPES: DayType[] = ['push', 'pull', 'legs', 'rest', 'cardio', 'custom'];
const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

interface ExerciseForm {
  id?: string;
  name: string;
  sets: string;
  notes: string;
  section: string;
  requires_condition_check: boolean;
}

interface DayForm {
  id?: string;
  day_of_week: number;
  day_label: string;
  day_type: DayType;
  exercises: ExerciseForm[];
}

export default function WorkoutEditPage() {
  const [planName, setPlanName] = useState('');
  const [phase, setPhase] = useState('');
  const [days, setDays] = useState<DayForm[]>([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPlan() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: plan } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (plan) {
        setPlanName(plan.name);
        setPhase(plan.phase || '');

        const { data: planDays } = await supabase
          .from('workout_days')
          .select('*')
          .eq('plan_id', plan.id)
          .order('sort_order');

        const daysWithExercises: DayForm[] = [];
        for (const day of planDays || []) {
          const { data: exercises } = await supabase
            .from('exercises')
            .select('*')
            .eq('workout_day_id', day.id)
            .order('sort_order');

          daysWithExercises.push({
            id: day.id,
            day_of_week: day.day_of_week,
            day_label: day.day_label || '',
            day_type: (day.day_type as DayType) || 'custom',
            exercises: (exercises || []).map((e) => ({
              id: e.id,
              name: e.name,
              sets: e.sets || '',
              notes: e.notes || '',
              section: e.section || 'Esercizi principali',
              requires_condition_check: e.requires_condition_check,
            })),
          });
        }

        if (daysWithExercises.length > 0) {
          setDays(daysWithExercises);
        } else {
          initEmptyDays();
        }
      } else {
        initEmptyDays();
      }
      setLoading(false);
    }

    function initEmptyDays() {
      setDays([1, 2, 3, 4, 5, 6, 0].map((dow) => ({
        day_of_week: dow,
        day_label: '',
        day_type: 'rest' as DayType,
        exercises: [],
      })));
    }

    fetchPlan();
  }, [supabase]);

  const addExercise = () => {
    const updated = [...days];
    updated[selectedDayIdx].exercises.push({
      name: '',
      sets: '',
      notes: '',
      section: 'Esercizi principali',
      requires_condition_check: false,
    });
    setDays(updated);
  };

  const removeExercise = (exIdx: number) => {
    const updated = [...days];
    updated[selectedDayIdx].exercises.splice(exIdx, 1);
    setDays(updated);
  };

  const updateExercise = (exIdx: number, field: keyof ExerciseForm, value: string | boolean) => {
    const updated = [...days];
    (updated[selectedDayIdx].exercises[exIdx] as unknown as Record<string, string | boolean>)[field] = value;
    setDays(updated);
  };

  const updateDay = (field: keyof DayForm, value: string) => {
    const updated = [...days];
    (updated[selectedDayIdx] as unknown as Record<string, unknown>)[field] = value;
    setDays(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upsert plan
      const { data: plan } = await supabase
        .from('workout_plans')
        .upsert({
          user_id: user.id,
          name: planName || 'Il mio piano',
          phase: phase || null,
          is_active: true,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (!plan) throw new Error('Failed to save plan');

      // Delete old days and exercises
      await supabase.from('workout_days').delete().eq('plan_id', plan.id);

      // Insert new days and exercises
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const { data: savedDay } = await supabase
          .from('workout_days')
          .insert({
            plan_id: plan.id,
            day_of_week: day.day_of_week,
            day_label: day.day_label || null,
            day_type: day.day_type,
            color: DAY_TYPE_COLORS[day.day_type],
            sort_order: i,
          })
          .select()
          .single();

        if (savedDay) {
          for (let j = 0; j < day.exercises.length; j++) {
            const ex = day.exercises[j];
            if (ex.name.trim()) {
              await supabase.from('exercises').insert({
                workout_day_id: savedDay.id,
                section: ex.section,
                name: ex.name,
                sets: ex.sets || null,
                notes: ex.notes || null,
                sort_order: j,
                requires_condition_check: ex.requires_condition_check,
              });
            }
          }
        }
      }

      toast.success('Piano salvato! 🎉');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="px-4 py-4 max-w-2xl mx-auto animate-pulse"><div className="h-8 bg-muted rounded w-48 mb-4" /><div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl" />)}</div></div>;
  }

  const currentDay = days[selectedDayIdx];

  return (
    <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/workout" className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold">Modifica Scheda</h1>
      </div>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nome piano</Label>
            <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Push Pull Legs" />
          </div>
          <div className="space-y-1.5">
            <Label>Fase</Label>
            <Input value={phase} onChange={(e) => setPhase(e.target.value)} placeholder="Fase 1" />
          </div>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
        {days.map((day, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedDayIdx(idx)}
            className={`min-w-[48px] px-3 py-2 rounded-lg border text-xs transition-all ${
              selectedDayIdx === idx ? 'border-primary bg-primary/10 text-primary' : 'border-border'
            }`}
          >
            {WEEKDAY_LABELS[day.day_of_week]}
          </button>
        ))}
      </div>

      {/* Day config */}
      {currentDay && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Etichetta giorno</Label>
              <Input value={currentDay.day_label} onChange={(e) => updateDay('day_label', e.target.value)} placeholder="Giorno A — Push" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <div className="flex flex-wrap gap-1.5">
                {DAY_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => updateDay('day_type', t)}
                    className={`px-2.5 py-1 rounded text-xs border transition-all ${
                      currentDay.day_type === t ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                    }`}
                    style={currentDay.day_type === t ? { borderColor: DAY_TYPE_COLORS[t], color: DAY_TYPE_COLORS[t] } : {}}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Exercises */}
          <div className="space-y-2">
            {currentDay.exercises.map((ex, exIdx) => (
              <div key={exIdx} className="p-3 rounded-lg bg-card border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-muted-foreground cursor-grab" />
                  <Input value={ex.name} onChange={(e) => updateExercise(exIdx, 'name', e.target.value)} placeholder="Nome esercizio" className="h-8 flex-1" />
                  <button onClick={() => removeExercise(exIdx)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input value={ex.sets} onChange={(e) => updateExercise(exIdx, 'sets', e.target.value)} placeholder="4 × 8–10" className="h-8 text-xs" />
                  <select
                    value={ex.section}
                    onChange={(e) => updateExercise(exIdx, 'section', e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <Checkbox checked={ex.requires_condition_check} onCheckedChange={(c) => updateExercise(exIdx, 'requires_condition_check', !!c)} />
                    ⚠️ Check
                  </label>
                </div>
                <Textarea value={ex.notes} onChange={(e) => updateExercise(exIdx, 'notes', e.target.value)} placeholder="Note tecniche..." rows={1} className="text-xs resize-none" />
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={addExercise} className="w-full gap-1.5">
            <Plus size={14} />
            Aggiungi esercizio
          </Button>
        </div>
      )}

      <div className="mt-6">
        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'Salva piano'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface MealForm {
  id?: string;
  meal_time: string;
  meal_name: string;
  description: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  calories: string;
}

export default function NutritionEditPage() {
  const [meals, setMeals] = useState<MealForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMeals() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('nutrition_meals')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order');

      setMeals((data || []).map((m) => ({
        id: m.id,
        meal_time: m.meal_time,
        meal_name: m.meal_name,
        description: m.description || '',
        protein_g: m.protein_g?.toString() || '',
        carbs_g: m.carbs_g?.toString() || '',
        fat_g: m.fat_g?.toString() || '',
        calories: m.calories?.toString() || '',
      })));
      setLoading(false);
    }
    fetchMeals();
  }, [supabase]);

  const addMeal = (preset?: { meal_time: string; meal_name: string; description: string }) => {
    setMeals((prev) => [...prev, {
      meal_time: preset?.meal_time || '',
      meal_name: preset?.meal_name || '',
      description: preset?.description || '',
      protein_g: '', carbs_g: '', fat_g: '', calories: '',
    }]);
  };

  const removeMeal = (idx: number) => setMeals((prev) => prev.filter((_, i) => i !== idx));

  const updateMeal = (idx: number, field: keyof MealForm, value: string) => {
    setMeals((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('nutrition_meals').delete().eq('user_id', user.id);

      for (let i = 0; i < meals.length; i++) {
        const m = meals[i];
        if (m.meal_name.trim()) {
          await supabase.from('nutrition_meals').insert({
            user_id: user.id,
            meal_time: m.meal_time,
            meal_name: m.meal_name,
            description: m.description || null,
            protein_g: parseInt(m.protein_g) || null,
            carbs_g: parseInt(m.carbs_g) || null,
            fat_g: parseInt(m.fat_g) || null,
            calories: parseInt(m.calories) || null,
            sort_order: i,
          });
        }
      }

      toast.success('Pasti salvati! 🥗');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="px-4 py-4 max-w-2xl mx-auto animate-pulse"><div className="h-8 bg-muted rounded w-48" /></div>;

  const presets = [
    { meal_time: '07:30', meal_name: 'Colazione', description: '' },
    { meal_time: '10:30', meal_name: 'Spuntino mattina', description: '' },
    { meal_time: '13:00', meal_name: 'Pranzo', description: '' },
    { meal_time: '16:00', meal_name: 'Spuntino pomeriggio', description: '' },
    { meal_time: '19:30', meal_name: 'Cena', description: '' },
  ];

  return (
    <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/nutrition" className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold">Modifica Pasti</h1>
      </div>

      {/* Presets */}
      <div className="mb-4">
        <Label className="text-xs text-muted-foreground">Preset rapidi:</Label>
        <div className="flex gap-1.5 mt-1 flex-wrap">
          {presets.map((p) => (
            <Button key={p.meal_name} variant="outline" size="sm" className="h-7 text-xs" onClick={() => addMeal(p)}>
              + {p.meal_name}
            </Button>
          ))}
        </div>
      </div>

      {/* Meals */}
      <div className="space-y-3 mb-4">
        {meals.map((meal, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-card border border-border space-y-2">
            <div className="flex items-center gap-2">
              <Input type="time" value={meal.meal_time} onChange={(e) => updateMeal(idx, 'meal_time', e.target.value)} className="h-8 w-24 text-xs" />
              <Input value={meal.meal_name} onChange={(e) => updateMeal(idx, 'meal_name', e.target.value)} placeholder="Nome pasto" className="h-8 flex-1" />
              <button onClick={() => removeMeal(idx)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                <Trash2 size={14} />
              </button>
            </div>
            <Textarea value={meal.description} onChange={(e) => updateMeal(idx, 'description', e.target.value)} placeholder="Descrizione..." rows={1} className="text-xs resize-none" />
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-[10px]">Kcal</Label>
                <Input type="number" value={meal.calories} onChange={(e) => updateMeal(idx, 'calories', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Prot (g)</Label>
                <Input type="number" value={meal.protein_g} onChange={(e) => updateMeal(idx, 'protein_g', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Carbo (g)</Label>
                <Input type="number" value={meal.carbs_g} onChange={(e) => updateMeal(idx, 'carbs_g', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Grassi (g)</Label>
                <Input type="number" value={meal.fat_g} onChange={(e) => updateMeal(idx, 'fat_g', e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={() => addMeal()} className="w-full gap-1.5 mb-6">
        <Plus size={14} /> Aggiungi pasto
      </Button>

      <Button className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'Salva pasti'}
      </Button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNutritionToday } from '@/hooks/useNutritionToday';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Plus, Utensils } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function NutritionPage() {
  const [date] = useState(new Date());
  const { meals, macroTotals, loading } = useNutritionToday(date);
  const { profile } = useProfile();
  const supabase = createClient();

  const targets = profile ? {
    calories: profile.daily_calories || 0,
    protein: profile.daily_protein_g || 0,
    carbs: profile.daily_carbs_g || 0,
    fat: profile.daily_fat_g || 0,
  } : null;

  const toggleEaten = async (mealId: string, eaten: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = format(date, 'yyyy-MM-dd');
      await supabase.from('nutrition_logs').upsert({
        user_id: user.id,
        log_date: dateStr,
        meal_id: mealId,
        eaten,
      }, { onConflict: 'user_id,log_date,meal_id' });

      if (eaten) toast.success('Pasto registrato! 🥗');
    } catch {
      toast.error('Errore nel salvataggio');
    }
  };

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-24 bg-muted rounded-xl" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl" />)}
      </div>
    );
  }

  const macroConfig = [
    { key: 'calories' as const, label: 'Calorie', unit: 'kcal', color: 'var(--primary)' },
    { key: 'protein' as const, label: 'Proteine', unit: 'g', color: 'var(--brand-green)' },
    { key: 'carbs' as const, label: 'Carbo', unit: 'g', color: 'var(--brand-orange)' },
    { key: 'fat' as const, label: 'Grassi', unit: 'g', color: 'var(--brand-purple)' },
  ];

  return (
    <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Piano Alimentare</h1>
        <Link href="/nutrition/edit">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil size={14} />
            Modifica
          </Button>
        </Link>
      </div>

      {/* Macro header */}
      {targets && (
        <div className="rounded-xl bg-card border border-border p-4 mb-6">
          <div className="grid grid-cols-4 gap-3">
            {macroConfig.map((macro) => {
              const consumed = macro.key === 'calories' ? macroTotals.calories : macroTotals[macro.key];
              const target = targets[macro.key];
              const percent = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;

              return (
                <div key={macro.key} className="text-center">
                  <div className="relative w-14 h-14 mx-auto mb-1">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--muted)"
                        strokeWidth="3"
                      />
                      <motion.path
                        d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={macro.color}
                        strokeWidth="3"
                        strokeDasharray={`${percent}, 100`}
                        initial={{ strokeDasharray: '0, 100' }}
                        animate={{ strokeDasharray: `${percent}, 100` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[11px] font-medium">{Math.round(percent)}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{macro.label}</p>
                  <p className="text-xs font-medium tabular-nums">{consumed}/{target}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Meals list */}
      {meals.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Utensils size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Nessun pasto configurato</h3>
          <p className="text-sm text-muted-foreground mb-4">Configura i tuoi pasti per tracciare l&apos;alimentazione</p>
          <Link href="/nutrition/edit"><Button className="gap-1.5"><Plus size={14} /> Aggiungi pasti</Button></Link>
        </div>
      ) : (
        <div className="space-y-2">
          {meals.map((meal, idx) => (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-xl border transition-all ${
                meal.log?.eaten
                  ? 'bg-brand-green/5 border-brand-green/20'
                  : 'bg-card border-border hover:border-primary/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={meal.log?.eaten || false}
                    onCheckedChange={(c) => toggleEaten(meal.id, !!c)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{meal.meal_time}</span>
                      <span className={`text-sm font-medium ${meal.log?.eaten ? 'line-through opacity-60' : ''}`}>
                        {meal.meal_name}
                      </span>
                    </div>
                    {meal.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{meal.description}</p>
                    )}
                  </div>
                </div>

                <div className="text-right text-xs text-muted-foreground">
                  {meal.calories && <span>{meal.calories} kcal</span>}
                </div>
              </div>

              {(meal.protein_g || meal.carbs_g || meal.fat_g) && (
                <div className="flex gap-4 mt-2 ml-9 text-[11px] text-muted-foreground">
                  {meal.protein_g && <span>P: {meal.protein_g}g</span>}
                  {meal.carbs_g && <span>C: {meal.carbs_g}g</span>}
                  {meal.fat_g && <span>G: {meal.fat_g}g</span>}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

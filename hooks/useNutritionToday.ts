'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { NutritionMealWithLog, NutritionLog } from '@/lib/types';
import { format } from 'date-fns';

export function useNutritionToday(date: Date) {
  const [meals, setMeals] = useState<NutritionMealWithLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchNutrition() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const dateStr = format(date, 'yyyy-MM-dd');

        // Get all meals
        const { data: mealData } = await supabase
          .from('nutrition_meals')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order');

        // Get logs for today
        const { data: logs } = await supabase
          .from('nutrition_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('log_date', dateStr);

        const logMap = new Map<string, NutritionLog>();
        (logs || []).forEach((log: NutritionLog) => {
          if (log.meal_id) logMap.set(log.meal_id, log);
        });

        const mealsWithLogs: NutritionMealWithLog[] = (mealData || []).map((meal) => ({
          ...meal,
          log: logMap.get(meal.id),
        }));

        setMeals(mealsWithLogs);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchNutrition();
  }, [date, supabase]);

  // Calculate macro totals from eaten meals
  const macroTotals = meals.reduce(
    (acc, meal) => {
      if (meal.log?.eaten) {
        return {
          calories: acc.calories + (meal.calories || 0),
          protein: acc.protein + (meal.protein_g || 0),
          carbs: acc.carbs + (meal.carbs_g || 0),
          fat: acc.fat + (meal.fat_g || 0),
        };
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return { meals, macroTotals, loading };
}

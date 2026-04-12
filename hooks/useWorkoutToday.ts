'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { WorkoutDay, WorkoutDayWithExercises } from '@/lib/types';

export function useWorkoutToday(date: Date) {
  const [workoutDay, setWorkoutDay] = useState<WorkoutDayWithExercises | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchTodayWorkout() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get active workout plan
        const { data: plan } = await supabase
          .from('workout_plans')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (!plan) {
          setLoading(false);
          return;
        }

        // Get today's day of week (0=Sunday)
        const dayOfWeek = date.getDay();

        // Get workout day
        const { data: day } = await supabase
          .from('workout_days')
          .select('*')
          .eq('plan_id', plan.id)
          .eq('day_of_week', dayOfWeek)
          .single();

        if (!day) {
          setLoading(false);
          return;
        }

        // Get exercises for this day
        const { data: exercises } = await supabase
          .from('exercises')
          .select('*')
          .eq('workout_day_id', day.id)
          .order('sort_order');

        setWorkoutDay({
          ...(day as WorkoutDay),
          exercises: exercises || [],
        });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchTodayWorkout();
  }, [date, supabase]);

  return { workoutDay, loading };
}

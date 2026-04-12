'use client';

import { useAppStore } from '@/stores/useAppStore';
import { useWorkoutToday } from '@/hooks/useWorkoutToday';
import { useRoutineNow } from '@/hooks/useRoutineNow';
import { useNutritionToday } from '@/hooks/useNutritionToday';
import CountdownHero from '@/components/dashboard/CountdownHero';
import TodayWorkoutCard from '@/components/dashboard/TodayWorkoutCard';
import RoutineSnapshot from '@/components/dashboard/RoutineSnapshot';
import MacroProgress from '@/components/dashboard/MacroProgress';

export default function DashboardPage() {
  const { profile, selectedDate } = useAppStore();
  const { workoutDay, loading: workoutLoading } = useWorkoutToday(selectedDate);
  const { routineBlocks, currentBlockIndex, loading: routineLoading } = useRoutineNow(selectedDate);
  const { macroTotals, loading: nutritionLoading } = useNutritionToday(selectedDate);

  const targets = profile
    ? {
        calories: profile.daily_calories || 0,
        protein: profile.daily_protein_g || 0,
        carbs: profile.daily_carbs_g || 0,
        fat: profile.daily_fat_g || 0,
      }
    : null;

  return (
    <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto space-y-4">
      <CountdownHero
        targetDate={profile?.countdown_target || '2030-05-03'}
        currentDate={selectedDate}
        firstLogDate={profile?.created_at}
      />

      <TodayWorkoutCard
        workoutDay={workoutDay}
        loading={workoutLoading}
      />

      <RoutineSnapshot
        routineBlocks={routineBlocks}
        currentBlockIndex={currentBlockIndex}
        loading={routineLoading}
      />

      <MacroProgress
        consumed={macroTotals}
        targets={targets}
        loading={nutritionLoading}
      />
    </div>
  );
}

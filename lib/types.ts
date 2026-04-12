// ═══════════════════════════════════════════
// Project 2030 — TypeScript Types
// Derived from Supabase database schema
// ═══════════════════════════════════════════

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  goal: string | null;
  physical_conditions: string[] | null;
  conditions_notes: string | null;
  avatar_url: string | null;
  language: 'it' | 'en';
  theme: 'light' | 'dark' | 'system';
  daily_calories: number | null;
  daily_protein_g: number | null;
  daily_carbs_g: number | null;
  daily_fat_g: number | null;
  countdown_target: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  phase: string | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutDay {
  id: string;
  plan_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  day_label: string | null;
  day_type: 'push' | 'pull' | 'legs' | 'rest' | 'cardio' | 'custom' | null;
  color: string | null;
  notes: string | null;
  sort_order: number;
}

export interface Exercise {
  id: string;
  workout_day_id: string;
  section: string | null;
  name: string;
  sets: string | null;
  notes: string | null;
  location: string | null;
  sort_order: number;
  requires_condition_check: boolean;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  log_date: string;
  workout_day_id: string | null;
  completed: boolean;
  skipped: boolean;
  skip_reason: string | null;
  overall_notes: string | null;
  perceived_effort: number | null;
  created_at: string;
}

export interface ExerciseLog {
  id: string;
  workout_log_id: string;
  exercise_id: string | null;
  sets_completed: number | null;
  reps_completed: string | null;
  weight_kg: string | null;
  notes: string | null;
}

export interface DailyRoutine {
  id: string;
  user_id: string;
  day_of_week: number;
  sort_order: number;
  time_start: string | null;
  time_end: string | null;
  label: string;
  description: string | null;
  location: string | null;
  block_type: BlockType;
  is_completed_today: boolean;
}

export type BlockType = 'sleep' | 'commute' | 'work' | 'gym' | 'focus' | 'free' | 'uni' | 'short';

export interface RoutineLog {
  id: string;
  user_id: string;
  log_date: string;
  routine_block_id: string | null;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface NutritionMeal {
  id: string;
  user_id: string;
  meal_time: string;
  meal_name: string;
  description: string | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  calories: number | null;
  sort_order: number;
}

export interface NutritionLog {
  id: string;
  user_id: string;
  log_date: string;
  meal_id: string | null;
  eaten: boolean;
  notes: string | null;
}

// ── Composite types for views ──

export interface WorkoutDayWithExercises extends WorkoutDay {
  exercises: Exercise[];
}

export interface WorkoutPlanWithDays extends WorkoutPlan {
  workout_days: WorkoutDayWithExercises[];
}

export interface WorkoutLogWithExercises extends WorkoutLog {
  exercise_logs: ExerciseLog[];
  workout_day?: WorkoutDay;
}

export interface DailyRoutineWithLog extends DailyRoutine {
  log?: RoutineLog;
}

export interface NutritionMealWithLog extends NutritionMeal {
  log?: NutritionLog;
}

// ── Onboarding types ──

export interface OnboardingStep1 {
  first_name: string;
  last_name: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  goal: string;
  physical_conditions: string[];
  conditions_notes?: string;
}

export interface OnboardingStep2 {
  training_days_per_week: number;
  training_time: string;
  has_existing_plan: boolean;
}

export interface OnboardingStep3 {
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
}

// ── Navigation ──

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

// ── Goals ──

export const GOALS = [
  'massa_muscolare',
  'definizione',
  'benessere_generale',
  'performance',
  'altro',
] as const;

export type Goal = typeof GOALS[number];

// ── Physical Conditions ──

export const PHYSICAL_CONDITIONS = [
  'nessuna',
  'scoliosi_operata',
  'scoliosi_non_operata',
  'ernia_disco',
  'problemi_ginocchio',
  'problemi_spalla',
  'lombalgia_cronica',
  'altro',
] as const;

export type PhysicalCondition = typeof PHYSICAL_CONDITIONS[number];

// ── Day Types ──

export const DAY_TYPES = ['push', 'pull', 'legs', 'rest', 'cardio', 'custom'] as const;
export type DayType = typeof DAY_TYPES[number];

export const DAY_TYPE_COLORS: Record<DayType, string> = {
  push: '#3b82f6',
  pull: '#10b981',
  legs: '#f59e0b',
  rest: '#6b7280',
  cardio: '#ef4444',
  custom: '#8b5cf6',
};

export const BLOCK_TYPES = ['sleep', 'commute', 'work', 'gym', 'focus', 'free', 'uni', 'short'] as const;

// ── Week days ──

export const WEEKDAYS_IT = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
export const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAYS_SHORT_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
export const WEEKDAYS_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

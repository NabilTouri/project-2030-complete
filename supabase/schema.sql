-- ═══════════════════════════════════════════
-- Project 2030 — Database Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- ── PROFILES ──
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  goal TEXT,
  physical_conditions TEXT[],
  conditions_notes TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'it',
  theme TEXT DEFAULT 'system',
  daily_calories INTEGER,
  daily_protein_g INTEGER,
  daily_carbs_g INTEGER,
  daily_fat_g INTEGER,
  countdown_target DATE DEFAULT '2030-05-03',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── WORKOUT PLANS ──
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  phase TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── WORKOUT DAYS ──
CREATE TABLE IF NOT EXISTS workout_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  day_label TEXT,
  day_type TEXT,
  color TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

-- ── EXERCISES ──
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_day_id UUID REFERENCES workout_days(id) ON DELETE CASCADE,
  section TEXT,
  name TEXT NOT NULL,
  sets TEXT,
  notes TEXT,
  location TEXT,
  sort_order INTEGER DEFAULT 0,
  requires_condition_check BOOLEAN DEFAULT FALSE
);

-- ── WORKOUT LOGS ──
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  workout_day_id UUID REFERENCES workout_days(id),
  completed BOOLEAN DEFAULT FALSE,
  skipped BOOLEAN DEFAULT FALSE,
  skip_reason TEXT,
  overall_notes TEXT,
  perceived_effort INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- ── EXERCISE LOGS ──
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  sets_completed INTEGER,
  reps_completed TEXT,
  weight_kg TEXT,
  notes TEXT
);

-- ── DAILY ROUTINES ──
CREATE TABLE IF NOT EXISTS daily_routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  time_start TEXT,
  time_end TEXT,
  label TEXT NOT NULL,
  description TEXT,
  location TEXT,
  block_type TEXT DEFAULT 'free',
  is_completed_today BOOLEAN DEFAULT FALSE
);

-- ── ROUTINE LOGS ──
CREATE TABLE IF NOT EXISTS routine_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  routine_block_id UUID REFERENCES daily_routines(id),
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date, routine_block_id)
);

-- ── NUTRITION MEALS ──
CREATE TABLE IF NOT EXISTS nutrition_meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  meal_time TEXT NOT NULL,
  meal_name TEXT NOT NULL,
  description TEXT,
  protein_g INTEGER,
  carbs_g INTEGER,
  fat_g INTEGER,
  calories INTEGER,
  sort_order INTEGER DEFAULT 0
);

-- ── NUTRITION LOGS ──
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  meal_id UUID REFERENCES nutrition_meals(id),
  eaten BOOLEAN DEFAULT FALSE,
  notes TEXT,
  UNIQUE(user_id, log_date, meal_id)
);

-- ── PUSH SUBSCRIPTIONS ──
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own workout plans" ON workout_plans FOR ALL USING (auth.uid() = user_id);

ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own workout days" ON workout_days FOR ALL
  USING (EXISTS (SELECT 1 FROM workout_plans WHERE workout_plans.id = workout_days.plan_id AND workout_plans.user_id = auth.uid()));

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own exercises" ON exercises FOR ALL
  USING (EXISTS (
    SELECT 1 FROM workout_days
    JOIN workout_plans ON workout_plans.id = workout_days.plan_id
    WHERE workout_days.id = exercises.workout_day_id AND workout_plans.user_id = auth.uid()
  ));

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own workout logs" ON workout_logs FOR ALL USING (auth.uid() = user_id);

ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own exercise logs" ON exercise_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM workout_logs WHERE workout_logs.id = exercise_logs.workout_log_id AND workout_logs.user_id = auth.uid()));

ALTER TABLE daily_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own routines" ON daily_routines FOR ALL USING (auth.uid() = user_id);

ALTER TABLE routine_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own routine logs" ON routine_logs FOR ALL USING (auth.uid() = user_id);

ALTER TABLE nutrition_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own meals" ON nutrition_meals FOR ALL USING (auth.uid() = user_id);

ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own nutrition logs" ON nutrition_logs FOR ALL USING (auth.uid() = user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

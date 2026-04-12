'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Target, ChevronRight, ChevronLeft, Sparkles, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { GOALS, PHYSICAL_CONDITIONS } from '@/lib/types';

const GOAL_LABELS: Record<string, string> = {
  massa_muscolare: 'Massa muscolare',
  definizione: 'Definizione',
  benessere_generale: 'Benessere generale',
  performance: 'Performance',
  altro: 'Altro',
};

const CONDITION_LABELS: Record<string, string> = {
  nessuna: 'Nessuna condizione particolare',
  scoliosi_operata: 'Scoliosi operata',
  scoliosi_non_operata: 'Scoliosi non operata',
  ernia_disco: 'Ernia del disco',
  problemi_ginocchio: 'Problemi al ginocchio',
  problemi_spalla: 'Problemi alla spalla',
  lombalgia_cronica: 'Lombalgia cronica',
  altro: 'Altro (specifica nelle note)',
};

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Step 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionsNotes, setConditionsNotes] = useState('');

  // Step 2
  const [trainingDays, setTrainingDays] = useState('4');
  const [trainingTime, setTrainingTime] = useState('16:00');
  const [hasPlan, setHasPlan] = useState(false);

  // Step 3
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const toggleCondition = (condition: string) => {
    if (condition === 'nessuna') {
      setConditions(['nessuna']);
      return;
    }
    setConditions((prev) => {
      const filtered = prev.filter((c) => c !== 'nessuna');
      if (filtered.includes(condition)) {
        return filtered.filter((c) => c !== condition);
      }
      return [...filtered, condition];
    });
  };

  const autoCalculateMacros = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    if (!w || !h || !a) {
      toast.error('Inserisci peso, altezza e età prima di calcolare');
      return;
    }

    // Harris-Benedict BMR
    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    // Activity multiplier (moderate = 1.55)
    const tdee = bmr * 1.55;

    let targetCal = tdee;
    if (goal === 'massa_muscolare') targetCal = tdee + 300;
    else if (goal === 'definizione') targetCal = tdee - 400;

    const proteinG = Math.round(w * 2);
    const fatG = Math.round((targetCal * 0.25) / 9);
    const carbsG = Math.round((targetCal - proteinG * 4 - fatG * 9) / 4);

    setCalories(Math.round(targetCal).toString());
    setProtein(proteinG.toString());
    setCarbs(carbsG.toString());
    setFat(fatG.toString());
    toast.success('Macro calcolati automaticamente!');
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          age: parseInt(age) || null,
          weight_kg: parseFloat(weight) || null,
          height_cm: parseFloat(height) || null,
          goal,
          physical_conditions: conditions.length > 0 ? conditions : null,
          conditions_notes: conditionsNotes || null,
          daily_calories: parseInt(calories) || null,
          daily_protein_g: parseInt(protein) || null,
          daily_carbs_g: parseInt(carbs) || null,
          daily_fat_g: parseInt(fat) || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // If user wants a template PPL plan, create it
      if (!hasPlan) {
        await createTemplatePlan(user.id);
      }

      toast.success('Profilo configurato! Benvenuto in Project 2030 🎯');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const createTemplatePlan = async (userId: string) => {
    // Create a basic PPL plan
    const { data: plan } = await supabase
      .from('workout_plans')
      .insert({ user_id: userId, name: 'Push Pull Legs - Fase 1', phase: 'Fase 1 - Adattamento' })
      .select()
      .single();

    if (!plan) return;

    const days = [
      { day_of_week: 1, day_label: 'Giorno A — Push', day_type: 'push', color: '#3b82f6' },
      { day_of_week: 2, day_label: 'Giorno B — Pull', day_type: 'pull', color: '#10b981' },
      { day_of_week: 3, day_label: 'Giorno C — Legs', day_type: 'legs', color: '#f59e0b' },
      { day_of_week: 4, day_label: 'Riposo', day_type: 'rest', color: '#6b7280' },
      { day_of_week: 5, day_label: 'Giorno A — Push', day_type: 'push', color: '#3b82f6' },
      { day_of_week: 6, day_label: 'Giorno B — Pull', day_type: 'pull', color: '#10b981' },
      { day_of_week: 0, day_label: 'Riposo', day_type: 'rest', color: '#6b7280' },
    ];

    for (let i = 0; i < days.length; i++) {
      await supabase.from('workout_days').insert({
        plan_id: plan.id,
        ...days[i],
        sort_order: i,
      });
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
  };

  const [direction, setDirection] = useState(0);

  const nextStep = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <Target size={24} className="text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Configuriamo il tuo profilo</h1>
          <p className="text-sm text-muted-foreground mt-1">Step {step} di 3</p>
        </div>

        {/* Progress */}
        <Progress value={(step / 3) * 100} className="h-1.5 mb-8" />

        {/* Steps */}
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-medium mb-4">👤 Il tuo profilo</h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ob-first">Nome</Label>
                  <Input id="ob-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nome" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ob-last">Cognome</Label>
                  <Input id="ob-last" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Cognome" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ob-age">Età</Label>
                  <Input id="ob-age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ob-weight">Peso (kg)</Label>
                  <Input id="ob-weight" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="75" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ob-height">Altezza (cm)</Label>
                  <Input id="ob-height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="178" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Obiettivo</Label>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGoal(g)}
                      className={`px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                        goal === g
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {GOAL_LABELS[g]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Condizioni fisiche</Label>
                <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto">
                  {PHYSICAL_CONDITIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleCondition(c)}
                      className={`px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                        conditions.includes(c)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {CONDITION_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>

              {conditions.includes('altro') && (
                <div className="space-y-1.5">
                  <Label htmlFor="ob-notes">Note condizioni</Label>
                  <Input
                    id="ob-notes"
                    value={conditionsNotes}
                    onChange={(e) => setConditionsNotes(e.target.value)}
                    placeholder="Descrivi le tue condizioni..."
                  />
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <h2 className="text-lg font-medium mb-4">💪 Il tuo piano</h2>

              <div className="space-y-1.5">
                <Label>Quanti giorni alla settimana ti alleni?</Label>
                <div className="flex gap-2">
                  {['2', '3', '4', '5'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setTrainingDays(d)}
                      className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${
                        trainingDays === d
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ob-time">A che ora di solito ti alleni?</Label>
                <Input
                  id="ob-time"
                  type="time"
                  value={trainingTime}
                  onChange={(e) => setTrainingTime(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Hai già una scheda di allenamento?</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setHasPlan(true)}
                    className={`px-4 py-3 rounded-lg border text-sm transition-all ${
                      hasPlan
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    Sì, ce l&apos;ho
                  </button>
                  <button
                    onClick={() => setHasPlan(false)}
                    className={`px-4 py-3 rounded-lg border text-sm transition-all ${
                      !hasPlan
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    No, parto da zero
                  </button>
                </div>
              </div>

              {!hasPlan && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-lg bg-primary/5 border border-primary/20 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-primary" />
                    <span className="text-sm font-medium text-primary">Piano suggerito</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ti proponiamo un piano Push/Pull/Legs ideale per {trainingDays} giorni alla settimana.
                    Potrai personalizzarlo in seguito.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <h2 className="text-lg font-medium mb-4">🥗 Alimentazione</h2>

              <div className="flex items-center justify-between">
                <Label>I tuoi obiettivi nutrizionali</Label>
                <Button variant="outline" size="sm" onClick={autoCalculateMacros} className="gap-1.5 h-8">
                  <Calculator size={14} />
                  Auto-calcola
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ob-cal">Calorie giornaliere</Label>
                  <Input id="ob-cal" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="2500" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-prot">Proteine (g)</Label>
                    <Input id="ob-prot" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="150" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-carb">Carbo (g)</Label>
                    <Input id="ob-carb" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="300" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-fat">Grassi (g)</Label>
                    <Input id="ob-fat" type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="70" />
                  </div>
                </div>
              </div>

              {calories && protein && carbs && fat && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-card border border-border p-4"
                >
                  <p className="text-xs text-muted-foreground mb-3">Preview piano macro</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Calorie', value: calories, color: 'bg-primary', unit: 'kcal' },
                      { label: 'Proteine', value: protein, color: 'bg-brand-green', unit: 'g' },
                      { label: 'Carboidrati', value: carbs, color: 'bg-brand-orange', unit: 'g' },
                      { label: 'Grassi', value: fat, color: 'bg-brand-purple', unit: 'g' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.value} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1}
            className="gap-1"
          >
            <ChevronLeft size={16} />
            Indietro
          </Button>

          {step < 3 ? (
            <Button onClick={nextStep} className="gap-1">
              Avanti
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={loading} className="gap-1">
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Inizia il tuo percorso!
                  <Sparkles size={16} />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

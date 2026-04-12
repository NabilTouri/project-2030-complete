'use client';

import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { GOALS, PHYSICAL_CONDITIONS } from '@/lib/types';

const GOAL_LABELS: Record<string, string> = {
  massa_muscolare: 'Massa muscolare', definizione: 'Definizione',
  benessere_generale: 'Benessere generale', performance: 'Performance', altro: 'Altro',
};
const CONDITION_LABELS: Record<string, string> = {
  nessuna: 'Nessuna', scoliosi_operata: 'Scoliosi operata', scoliosi_non_operata: 'Scoliosi non operata',
  ernia_disco: 'Ernia del disco', problemi_ginocchio: 'Problemi ginocchio', problemi_spalla: 'Problemi spalla',
  lombalgia_cronica: 'Lombalgia cronica', altro: 'Altro',
};

export default function ProfileSettingsPage() {
  const { profile, updateProfile } = useProfile();
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [weight, setWeight] = useState(profile?.weight_kg?.toString() || '');
  const [height, setHeight] = useState(profile?.height_cm?.toString() || '');
  const [goal, setGoal] = useState(profile?.goal || '');
  const [conditions, setConditions] = useState<string[]>(profile?.physical_conditions || []);
  const [conditionsNotes, setConditionsNotes] = useState(profile?.conditions_notes || '');
  const [calories, setCalories] = useState(profile?.daily_calories?.toString() || '');
  const [protein, setProtein] = useState(profile?.daily_protein_g?.toString() || '');
  const [carbs, setCarbs] = useState(profile?.daily_carbs_g?.toString() || '');
  const [fat, setFat] = useState(profile?.daily_fat_g?.toString() || '');
  const [countdownTarget, setCountdownTarget] = useState(profile?.countdown_target || '2030-05-03');

  const toggleCondition = (c: string) => {
    if (c === 'nessuna') { setConditions(['nessuna']); return; }
    setConditions((prev) => {
      const filtered = prev.filter((x) => x !== 'nessuna');
      return filtered.includes(c) ? filtered.filter((x) => x !== c) : [...filtered, c];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
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
        countdown_target: countdownTarget,
      });
      toast.success('Profilo aggiornato! ✅');
    } catch {
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold">Profilo</h1>
      </div>

      <div className="space-y-6">
        {/* Personal data */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Dati Personali</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Nome</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Cognome</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Età</Label><Input type="number" value={age} onChange={(e) => setAge(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Peso (kg)</Label><Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Altezza (cm)</Label><Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Obiettivo</Label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button key={g} onClick={() => setGoal(g)} className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${goal === g ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
                    {GOAL_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Conditions */}
        <section id="conditions">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Condizioni Fisiche</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {PHYSICAL_CONDITIONS.map((c) => (
              <button key={c} onClick={() => toggleCondition(c)} className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${conditions.includes(c) ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
                {CONDITION_LABELS[c]}
              </button>
            ))}
          </div>
          <Textarea value={conditionsNotes} onChange={(e) => setConditionsNotes(e.target.value)} placeholder="Note aggiuntive..." rows={2} />
        </section>

        <Separator />

        {/* Macros */}
        <section id="macros">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Obiettivi Macro</h2>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Kcal</Label><Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Prot (g)</Label><Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Carbo (g)</Label><Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Grassi (g)</Label><Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} /></div>
          </div>
        </section>

        <Separator />

        {/* Countdown */}
        <section id="countdown">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Data Obiettivo</h2>
          <Input type="date" value={countdownTarget} onChange={(e) => setCountdownTarget(e.target.value)} />
        </section>

        <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Save size={16} /> Salva modifiche</>}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { BlockType } from '@/lib/types';

const BLOCK_TYPES: BlockType[] = ['sleep', 'commute', 'work', 'gym', 'focus', 'free', 'uni', 'short'];
const BLOCK_LABELS: Record<string, string> = {
  sleep: '😴 Sonno', commute: '🚗 Spostamento', work: '💼 Lavoro', gym: '🏋️ Palestra',
  focus: '🎯 Focus', free: '🌿 Tempo libero', uni: '📚 Università', short: '☕ Pausa breve',
};
const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

interface BlockForm {
  id?: string;
  time_start: string;
  time_end: string;
  label: string;
  description: string;
  location: string;
  block_type: BlockType;
}

export default function RoutineEditPage() {
  const [blocks, setBlocks] = useState<Record<number, BlockForm[]>>({});
  const [selectedDay, setSelectedDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchRoutines() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('daily_routines')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order');

      const grouped: Record<number, BlockForm[]> = {};
      for (let i = 0; i < 7; i++) grouped[i] = [];

      (data || []).forEach((r) => {
        grouped[r.day_of_week].push({
          id: r.id,
          time_start: r.time_start || '',
          time_end: r.time_end || '',
          label: r.label,
          description: r.description || '',
          location: r.location || '',
          block_type: (r.block_type as BlockType) || 'free',
        });
      });

      setBlocks(grouped);
      setLoading(false);
    }
    fetchRoutines();
  }, [supabase]);

  const addBlock = () => {
    setBlocks((prev) => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), {
        time_start: '', time_end: '', label: '', description: '', location: '', block_type: 'free' as BlockType,
      }],
    }));
  };

  const removeBlock = (idx: number) => {
    setBlocks((prev) => ({
      ...prev,
      [selectedDay]: prev[selectedDay].filter((_, i) => i !== idx),
    }));
  };

  const updateBlock = (idx: number, field: keyof BlockForm, value: string) => {
    setBlocks((prev) => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map((b, i) => i === idx ? { ...b, [field]: value } : b),
    }));
  };

  const copyFromDay = (fromDay: number) => {
    setBlocks((prev) => ({
      ...prev,
      [selectedDay]: (prev[fromDay] || []).map((b) => ({ ...b, id: undefined })),
    }));
    toast.success(`Copiato da ${WEEKDAY_LABELS[fromDay]}`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete all existing routines for this user
      await supabase.from('daily_routines').delete().eq('user_id', user.id);

      // Insert all blocks
      for (const [dayStr, dayBlocks] of Object.entries(blocks)) {
        const day = parseInt(dayStr);
        for (let i = 0; i < dayBlocks.length; i++) {
          const block = dayBlocks[i];
          if (block.label.trim()) {
            await supabase.from('daily_routines').insert({
              user_id: user.id,
              day_of_week: day,
              sort_order: i,
              time_start: block.time_start || null,
              time_end: block.time_end || null,
              label: block.label,
              description: block.description || null,
              location: block.location || null,
              block_type: block.block_type,
            });
          }
        }
      }

      toast.success('Routine salvata! 📅');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="px-4 py-4 max-w-2xl mx-auto animate-pulse"><div className="h-8 bg-muted rounded w-48 mb-4" /><div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl" />)}</div></div>;
  }

  return (
    <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/routine" className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold">Modifica Routine</h1>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
        {[1, 2, 3, 4, 5, 6, 0].map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`min-w-[48px] px-3 py-2 rounded-lg border text-xs transition-all ${
              selectedDay === day ? 'border-primary bg-primary/10 text-primary' : 'border-border'
            }`}
          >
            {WEEKDAY_LABELS[day]}
          </button>
        ))}
      </div>

      {/* Copy from dropdown */}
      <div className="flex items-center gap-2 mb-4">
        <Copy size={14} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Copia da:</span>
        {[1, 2, 3, 4, 5, 6, 0].filter((d) => d !== selectedDay).map((d) => (
          <button key={d} onClick={() => copyFromDay(d)} className="text-xs text-primary hover:underline">
            {WEEKDAY_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Blocks */}
      <div className="space-y-2 mb-4">
        {(blocks[selectedDay] || []).map((block, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-card border border-border space-y-2">
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-1.5 flex-1">
                <Input type="time" value={block.time_start} onChange={(e) => updateBlock(idx, 'time_start', e.target.value)} className="h-8 text-xs" />
                <Input type="time" value={block.time_end} onChange={(e) => updateBlock(idx, 'time_end', e.target.value)} className="h-8 text-xs" />
              </div>
              <button onClick={() => removeBlock(idx)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                <Trash2 size={14} />
              </button>
            </div>
            <Input value={block.label} onChange={(e) => updateBlock(idx, 'label', e.target.value)} placeholder="Attività" className="h-8" />
            <div className="flex flex-wrap gap-1">
              {BLOCK_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => updateBlock(idx, 'block_type', t)}
                  className={`text-[11px] px-2 py-0.5 rounded border transition-all ${
                    block.block_type === t ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  {BLOCK_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addBlock} className="w-full gap-1.5 mb-6">
        <Plus size={14} />
        Aggiungi blocco
      </Button>

      <Button className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'Salva routine'}
      </Button>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface MacroProgressProps {
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
  loading: boolean;
}

const macroConfig = [
  { key: 'protein' as const, label: 'Proteine', unit: 'g', color: 'var(--brand-green)' },
  { key: 'carbs' as const, label: 'Carbo', unit: 'g', color: 'var(--brand-orange)' },
  { key: 'fat' as const, label: 'Grassi', unit: 'g', color: 'var(--brand-purple)' },
];

export default function MacroProgress({ consumed, targets, loading }: MacroProgressProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-card border border-border p-5 animate-pulse">
        <div className="h-4 bg-muted rounded w-28 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!targets) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl bg-card border border-border p-5"
      >
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Macro di oggi
        </p>
        <div className="text-center py-3">
          <p className="text-sm text-muted-foreground mb-2">Nessun obiettivo macro configurato</p>
          <Link href="/settings/profile" className="text-sm text-primary hover:underline">
            Configura i macro →
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Link href="/nutrition">
        <div className="rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-all">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Macro di oggi
          </p>

          <div className="space-y-3">
            {macroConfig.map((macro) => {
              const consumed_val = consumed[macro.key];
              const target_val = targets[macro.key];
              const percent = target_val > 0 ? Math.min(100, (consumed_val / target_val) * 100) : 0;

              return (
                <div key={macro.key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{macro.label}</span>
                    <span className="font-medium tabular-nums">
                      {consumed_val}/{target_val}{macro.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: macro.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

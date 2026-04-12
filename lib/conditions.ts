// ═══════════════════════════════════════════
// Physical Condition Warnings
// ═══════════════════════════════════════════

export const CONDITION_WARNINGS: Record<string, { it: string; en: string }> = {
  scoliosi_operata: {
    it: "⚠️ Con scoliosi operata: evita carico assiale pesante sulla colonna (stacchi con bilanciere da terra, squat con bilanciere sulle spalle). Le varianti sicure sono indicate con ✓",
    en: "⚠️ With operated scoliosis: avoid heavy axial load on the spine (barbell deadlifts, barbell back squats). Safe variants are marked with ✓"
  },
  scoliosi_non_operata: {
    it: "⚠️ Con scoliosi: presta attenzione alla simmetria durante gli esercizi bilaterali. Preferisci movimenti unilaterali dove possibile.",
    en: "⚠️ With scoliosis: pay attention to symmetry during bilateral exercises. Prefer unilateral movements where possible."
  },
  ernia_disco: {
    it: "⚠️ Con ernia del disco: evita flessioni brusche sotto carico e movimenti esplosivi. Mantieni la colonna neutra.",
    en: "⚠️ With herniated disc: avoid sudden flexion under load and explosive movements. Keep spine neutral."
  },
  problemi_ginocchio: {
    it: "⚠️ Con problemi al ginocchio: evita squat profondi e movimenti ad alto impatto. Preferisci ROM controllato.",
    en: "⚠️ With knee issues: avoid deep squats and high-impact movements. Prefer controlled ROM."
  },
  problemi_spalla: {
    it: "⚠️ Con problemi alla spalla: evita overhead press pesanti e movimenti dietro la nuca. Riscalda bene la cuffia dei rotatori.",
    en: "⚠️ With shoulder issues: avoid heavy overhead press and behind-the-neck movements. Warm up rotator cuff properly."
  },
  lombalgia_cronica: {
    it: "⚠️ Con lombalgia cronica: evita carico assiale pesante e movimenti di iperestensione. Rinforza il core con esercizi isometrici.",
    en: "⚠️ With chronic lower back pain: avoid heavy axial load and hyperextension. Strengthen core with isometric exercises."
  },
};

export const CONDITION_LABELS: Record<string, { it: string; en: string }> = {
  nessuna: { it: 'Nessuna condizione particolare', en: 'No particular conditions' },
  scoliosi_operata: { it: 'Scoliosi operata', en: 'Operated scoliosis' },
  scoliosi_non_operata: { it: 'Scoliosi non operata', en: 'Non-operated scoliosis' },
  ernia_disco: { it: 'Ernia del disco', en: 'Herniated disc' },
  problemi_ginocchio: { it: 'Problemi al ginocchio', en: 'Knee problems' },
  problemi_spalla: { it: 'Problemi alla spalla', en: 'Shoulder problems' },
  lombalgia_cronica: { it: 'Lombalgia cronica', en: 'Chronic lower back pain' },
  altro: { it: 'Altro (specifica nelle note)', en: 'Other (specify in notes)' },
};

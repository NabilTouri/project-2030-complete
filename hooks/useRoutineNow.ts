'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DailyRoutine, DailyRoutineWithLog, RoutineLog } from '@/lib/types';
import { format } from 'date-fns';

export function useRoutineNow(date: Date) {
  const [routineBlocks, setRoutineBlocks] = useState<DailyRoutineWithLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchRoutine() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const dayOfWeek = date.getDay();
        const dateStr = format(date, 'yyyy-MM-dd');

        // Get routine blocks for today
        const { data: blocks } = await supabase
          .from('daily_routines')
          .select('*')
          .eq('user_id', user.id)
          .eq('day_of_week', dayOfWeek)
          .order('sort_order');

        // Get logs for today
        const { data: logs } = await supabase
          .from('routine_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('log_date', dateStr);

        const logMap = new Map<string, RoutineLog>();
        (logs || []).forEach((log: RoutineLog) => {
          if (log.routine_block_id) logMap.set(log.routine_block_id, log);
        });

        const blocksWithLogs: DailyRoutineWithLog[] = (blocks || []).map((block: DailyRoutine) => ({
          ...block,
          log: logMap.get(block.id),
        }));

        setRoutineBlocks(blocksWithLogs);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchRoutine();
  }, [date, supabase]);

  // Calculate current active block based on time
  const currentBlockIndex = useMemo(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (let i = routineBlocks.length - 1; i >= 0; i--) {
      const block = routineBlocks[i];
      if (block.time_start && currentTime >= block.time_start) {
        if (!block.time_end || currentTime <= block.time_end) {
          return i;
        }
      }
    }
    return -1;
  }, [routineBlocks]);

  return { routineBlocks, currentBlockIndex, loading };
}

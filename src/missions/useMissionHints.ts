import { useRef } from 'react';
import type { MissionId } from '../types';
import { useStore } from '../store';

/** Number of Buddy/hint uses since this mission run started. */
export function useMissionHints(id: MissionId) {
  const { state } = useStore();
  const start = useRef(state.missions[id].hintsUsed);
  return state.missions[id].hintsUsed - start.current;
}

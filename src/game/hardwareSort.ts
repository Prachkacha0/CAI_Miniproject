import type { Category } from '../types';
import { HW } from '../data/hardware.ts';

export function gradeHardwareSort(items: readonly string[], slots: Record<string, Category>) {
  const incorrect = items.filter((id) => !HW[id] || slots[id] !== HW[id].category);
  return {
    incorrect,
    correctCount: items.length - incorrect.length,
    complete: items.every((id) => Boolean(slots[id])),
  };
}

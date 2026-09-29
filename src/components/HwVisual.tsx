import type { HardwareItem } from '../types';
import { CATEGORIES } from '../data/hardware';
import { HardwareArt, hasArt } from './HardwareArt';
import { Ico } from './icons';
import { cx } from './ui';

/** Detailed illustration when one exists, otherwise a category-tinted icon tile. */
export function HwVisual({ hw, className, iconOnly }: { hw: HardwareItem; className?: string; iconOnly?: boolean }) {
  const c = CATEGORIES[hw.category];
  if (!iconOnly && hasArt(hw.art)) {
    return (
      <div className={cx('grid place-items-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100', className)}>
        <HardwareArt art={hw.art!} title={hw.en} className="h-full w-full p-2" />
      </div>
    );
  }
  return (
    <div className={cx('grid place-items-center rounded-2xl', c.soft, className)}>
      <Ico name={hw.icon} className={cx('h-1/2 w-1/2 max-h-16 max-w-16', c.text)} />
    </div>
  );
}

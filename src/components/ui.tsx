import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleCheck, CircleX, Lightbulb, SearchCheck, Trophy, X } from 'lucide-react';
import type { Category } from '../types';
import { CATEGORIES } from '../data/hardware';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}
type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:brightness-110',
  secondary: 'bg-white text-slate-800 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  success: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-500',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
};

export function Btn({ variant = 'primary', className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 font-semibold transition active:scale-[0.97]',
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:active:scale-100',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-3xl bg-white p-5 shadow-[0_8px_30px_-12px_rgba(30,41,99,0.18)] ring-1 ring-slate-100', className)}>{children}</div>;
}

export function CatPill({ cat, className }: { cat: Category; className?: string }) {
  const c = CATEGORIES[cat];
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', c.soft, c.text, className)}>
      <span className={cx('h-2 w-2 rounded-full', c.color)} aria-hidden="true" />
      {c.en}
    </span>
  );
}

export function Bar({ value, className, color = 'bg-gradient-to-r from-indigo-500 to-cyan-400', label }: { value: number; className?: string; color?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cx('h-2.5 w-full overflow-hidden rounded-full bg-slate-100', className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <motion.div className={cx('h-full rounded-full', color)} initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.7, ease: 'easeOut' }} />
    </div>
  );
}

export type FeedbackKind = 'correct' | 'incorrect' | 'investigate' | 'hint' | 'complete';

const FB: Record<FeedbackKind, { title: string; cls: string; Icon: typeof CircleCheck }> = {
  correct: { title: 'ถูกต้อง · Correct', cls: 'bg-emerald-50 text-emerald-900 ring-emerald-200', Icon: CircleCheck },
  incorrect: { title: 'ยังไม่ถูก · Incorrect', cls: 'bg-rose-50 text-rose-900 ring-rose-200', Icon: CircleX },
  investigate: { title: 'ต้องสืบเพิ่ม · Need More Investigation', cls: 'bg-amber-50 text-amber-900 ring-amber-200', Icon: SearchCheck },
  hint: { title: 'มีคำใบ้ · Hint Available', cls: 'bg-sky-50 text-sky-900 ring-sky-200', Icon: Lightbulb },
  complete: { title: 'ภารกิจสำเร็จ · Mission Complete', cls: 'bg-indigo-50 text-indigo-900 ring-indigo-200', Icon: Trophy },
};

export function Feedback({ kind, children, title, className }: { kind: FeedbackKind; children?: ReactNode; title?: string; className?: string }) {
  const f = FB[kind];
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: kind === 'incorrect' ? [0, -6, 6, -3, 3, 0] : 0 }}
      transition={{ duration: 0.35 }}
      className={cx('flex gap-3 rounded-2xl p-4 ring-1', f.cls, className)}
    >
      <f.Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-bold">{title ?? f.title}</p>
        {children && <div className="mt-0.5 text-sm leading-relaxed opacity-90">{children}</div>}
      </div>
    </motion.div>
  );
}

/** Horizontal step indicator used inside missions. */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold sm:text-sm" aria-label="ขั้นตอนภารกิจ">
      {steps.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'now' : 'todo';
        return (
          <li key={s} className="flex items-center gap-1.5">
            <span
              aria-current={state === 'now' ? 'step' : undefined}
              className={cx(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1',
                state === 'done' && 'bg-emerald-100 text-emerald-800',
                state === 'now' && 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30',
                state === 'todo' && 'bg-slate-100 text-slate-500',
              )}
            >
              {state === 'done' ? <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <span className="tabular-nums">{i + 1}</span>}
              {s}
            </span>
            {i < steps.length - 1 && <span className="text-slate-300" aria-hidden="true">›</span>}
          </li>
        );
      })}
    </ol>
  );
}

export function Modal({ open, onClose, children, title, wide }: { open: boolean; onClose: () => void; children: ReactNode; title: string; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cx('max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-slate-50 p-5 shadow-2xl sm:rounded-3xl', wide ? 'sm:max-w-5xl' : 'sm:max-w-lg')}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>
              <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-slate-200 hover:bg-slate-100" aria-label="ปิด">
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toast({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          role="status"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function StatusTag({ status }: { status: 'locked' | 'available' | 'completed' }) {
  const m = {
    locked: { t: 'Locked · ล็อก', c: 'bg-slate-100 text-slate-500', i: '🔒' },
    available: { t: 'Available · พร้อมเล่น', c: 'bg-sky-100 text-sky-800', i: '▶' },
    completed: { t: 'Completed · สำเร็จ', c: 'bg-emerald-100 text-emerald-800', i: '✓' },
  }[status];
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold', m.c)}>
      <span aria-hidden="true">{m.i}</span>
      {m.t}
    </span>
  );
}

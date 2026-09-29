import { AnimatePresence, motion } from 'motion/react';
import { Card, Feedback, cx } from '../components/ui';

/** Single-answer check with per-choice explanatory feedback. */
export function Quiz({
  title,
  choices,
  answer,
  value,
  onPick,
  wrongFb,
  rightFb,
}: {
  title: string;
  choices: string[];
  answer: number;
  value: number | null;
  onPick: (i: number) => void;
  wrongFb: string[];
  rightFb: string;
}) {
  const solved = value === answer;
  return (
    <Card>
      <p className="font-display text-lg font-bold text-slate-900">{title}</p>
      <div className="mt-3 grid gap-2">
        {choices.map((c, i) => (
          <button
            key={c}
            disabled={solved}
            onClick={() => onPick(i)}
            className={cx(
              'min-h-12 rounded-2xl px-4 py-3 text-left ring-2 transition',
              value === i ? (i === answer ? 'bg-emerald-50 ring-emerald-400' : 'bg-rose-50 ring-rose-300') : 'bg-slate-50 ring-transparent hover:ring-slate-200',
              solved && value !== i && 'opacity-50',
            )}
          >
            {value === i && (i === answer ? '✓ ' : '✕ ')}
            {c}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {value !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
            {value === answer ? <Feedback kind="correct">{rightFb}</Feedback> : <Feedback kind="incorrect">{wrongFb[value] || 'ลองพิจารณาหลักฐานอีกครั้ง'}</Feedback>}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

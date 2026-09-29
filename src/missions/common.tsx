import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowRight, BookOpen, Map } from 'lucide-react';
import type { MissionId, MissionScore } from '../types';
import { MISSION, OBJECTIVES } from '../data/missions';
import { avgScore, useStore } from '../store';
import { Bar, Btn, Card, Feedback, Steps } from '../components/ui';
import { Shell } from '../components/Shell';
import { BuddyBot } from '../components/BuddyBot';

export function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Independence drops a little for each Buddy/hint use, but never below 40 — hints are a learning tool, not a penalty. */
export function independence(hints: number) {
  return clamp(Math.max(40, 100 - hints * 12));
}

export function MissionFrame({ id, steps, step, brief, children }: { id: MissionId; steps: string[]; step: number; brief: ReactNode; children: ReactNode }) {
  const m = MISSION[id];
  return (
    <Shell title={`${m.code} · ${m.title}`} subtitle={`${m.gameplay} · LO${m.lo} ${OBJECTIVES[m.lo].en}`} exitTo="map">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Steps steps={steps} current={step} />
      </div>
      <div className="mb-5 flex items-start gap-3 rounded-3xl bg-white/70 p-3 ring-1 ring-slate-100">
        <BuddyBot className="h-10 w-10 shrink-0" />
        <div className="text-sm leading-relaxed text-slate-700">{brief}</div>
      </div>
      {children}
    </Shell>
  );
}

export function MissionComplete({
  id,
  score,
  learned,
  meta,
}: {
  id: MissionId;
  score: MissionScore;
  learned: ReactNode;
  meta?: Record<string, unknown>;
}) {
  const { completeMission, go, state } = useStore();
  const saved = useRef(false);
  const m = MISSION[id];

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    completeMission(id, score, meta);
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.3 }, colors: ['#6366f1', '#22d3ee', '#34d399', '#fbbf24'] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows: { k: keyof MissionScore; th: string; en: string }[] = [
    { k: 'accuracy', th: 'ความแม่นยำ', en: 'Accuracy' },
    { k: 'investigation', th: 'การสืบสวน', en: 'Investigation' },
    { k: 'reasoning', th: 'การให้เหตุผล', en: 'Reasoning' },
    { k: 'independence', th: 'ความเป็นอิสระ', en: 'Independence' },
  ];
  const next = id < 6 ? ((id + 1) as MissionId) : null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-3xl space-y-4">
      <Feedback kind="complete" title={`MISSION COMPLETE · ${m.code} ${m.title}`}>
        ได้รับ: {m.reward}
      </Feedback>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="font-display text-lg font-bold text-slate-900">สิ่งที่ค้นพบ · What I learned</h3>
          <div className="mt-2 text-sm leading-relaxed text-slate-700">{learned}</div>
        </Card>
        <Card>
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg font-bold text-slate-900">ผลการปฏิบัติงาน</h3>
            <span className="font-display text-2xl font-bold text-indigo-600 tabular-nums">{avgScore(score)}%</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {rows.map((r) => (
              <div key={r.k}>
                <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
                  <span>{r.th} · {r.en}</span>
                  <span className="tabular-nums">{score[r.k]}</span>
                </div>
                <Bar value={score[r.k]} label={r.en} />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">คะแนนใช้สะท้อนการเรียนรู้ของคุณเอง ไม่ใช้จัดอันดับ</p>
        </Card>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <Btn variant="secondary" onClick={() => go({ name: 'learn' })}><BookOpen className="h-4 w-4" aria-hidden="true" /> ทบทวน</Btn>
        <Btn variant="secondary" onClick={() => go({ name: 'map' })}><Map className="h-4 w-4" aria-hidden="true" /> Mission Map</Btn>
        {next ? (
          <Btn onClick={() => go({ name: 'mission', id: next })}>Next: {MISSION[next].code} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>
        ) : (
          <Btn onClick={() => go({ name: 'final' })} disabled={!Object.values(state.missions).every((x) => x.completed)}>ไป Final Case <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>
        )}
      </div>
    </motion.div>
  );
}

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowRight, BookOpen, House, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { MissionId, MissionScore } from '../types';
import { MISSION, OBJECTIVES } from '../data/missions';
import { canAccessFinal, missionStatus, useStore, avgScore } from '../store';
import { Bar, Btn, Card, Feedback, Steps } from '../components/ui';
import { Shell } from '../components/Shell';
import { BuddyBot } from '../components/BuddyBot';
import { Ico } from '../components/icons';
import { setSoundEnabled, soundEnabled } from '../game/sound';

export function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Independence drops a little for each Buddy/hint use, but never below 40 — hints are a learning tool, not a penalty. */
export function independence(hints: number) {
  return clamp(Math.max(40, 100 - hints * 12));
}

export function MissionFrame({ id, steps, step, brief, children }: { id: MissionId; steps: string[]; step: number; brief: ReactNode; children: ReactNode }) {
  const m = MISSION[id];
  const pct = Math.round(((step + 1) / steps.length) * 100);
  const [sound, setSound] = useState(() => soundEnabled());
  return (
    <Shell title={`${m.code} · ${m.title}`} subtitle={`${m.gameplay} · LO${m.lo} ${OBJECTIVES[m.lo].en}`} exitTo="home">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative mb-4 overflow-hidden rounded-2xl bg-[#091426] p-3.5 text-white shadow-xl ring-1 ring-cyan-300/15 sm:mb-5 sm:rounded-[1.75rem] sm:p-5">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(#67e8f9_1px,transparent_1px),linear-gradient(90deg,#67e8f9_1px,transparent_1px)] [background-size:28px_28px]" aria-hidden="true" />
        <div className="relative flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${m.accent} shadow-lg sm:h-14 sm:w-14 sm:rounded-2xl`}><Ico name={m.icon} className="h-6 w-6 text-white sm:h-7 sm:w-7" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold tracking-[.18em] text-cyan-300">FIELD OPERATION · {m.code}</p>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-amber-200"><Sparkles className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{m.reward}</span></span>
                <button type="button" onClick={() => { const next = !sound; setSound(next); setSoundEnabled(next); }} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-cyan-100 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-cyan-300" aria-label={sound ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์'} title={sound ? 'Sound on' : 'Sound off'}>
                  {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <h2 className="mt-1 break-words font-display text-base font-bold leading-snug sm:text-xl">{m.title}</h2>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Mission stage progress">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: .5 }} />
              </div>
              <span className="whitespace-nowrap text-xs font-bold tabular-nums text-cyan-100">STAGE {step + 1}/{steps.length}</span>
            </div>
          </div>
        </div>
      </motion.div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Steps steps={steps} current={step} />
      </div>
      <div className="mb-4 flex min-w-0 items-start gap-2.5 rounded-2xl border border-cyan-100 bg-gradient-to-r from-white via-white to-cyan-50 p-3.5 shadow-[0_12px_30px_-24px_rgba(8,145,178,.65)] ring-1 ring-white/80 sm:mb-5 sm:gap-3 sm:p-4">
        <BuddyBot className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
        <div className="min-w-0 text-sm leading-relaxed text-slate-700">{brief}</div>
      </div>
      <div className="min-w-0 w-full">{children}</div>
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
  const nextOpen = next ? missionStatus(state, next) !== 'locked' : false;

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
        <Btn variant="secondary" onClick={() => go({ name: 'home' })}><House className="h-4 w-4" aria-hidden="true" /> หน้าหลัก</Btn>
        {next ? (
          <Btn onClick={() => go({ name: 'mission', id: next })} disabled={!nextOpen}>{nextOpen ? `Next: ${MISSION[next].code}` : 'รอครูเปิดด่านถัดไป'} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>
        ) : id === 6 && state.assemblyOrder ? (
          <Btn onClick={() => go({ name: 'builder' })}><ArrowRight className="h-4 w-4" aria-hidden="true" /> ไปประกอบตามใบสั่งลูกค้า</Btn>
        ) : (
          <Btn onClick={() => go({ name: 'final' })} disabled={!canAccessFinal(state)}>ไป Final Case <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>
        )}
      </div>
    </motion.div>
  );
}

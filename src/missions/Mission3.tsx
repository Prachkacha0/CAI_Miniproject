import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, CircleCheck, CircleX, Cpu, Play, RotateCcw, Sparkles, Zap } from 'lucide-react';
import type { Category } from '../types';
import { useStore } from '../store';
import { CATEGORIES, CATEGORY_ORDER, HW } from '../data/hardware';
import { Btn, cx } from '../components/ui';
import { Ico } from '../components/icons';
import { HardwareArt, hasArt } from '../components/HardwareArt';
import { useBuddyTopic } from '../components/Buddy';
import { MissionComplete, MissionFrame, clamp, independence } from './common';
import { useMissionHints } from './useMissionHints';
import { Quiz } from './Quiz';
import { gradeHardwareSort } from '../game/hardwareSort';

const POOL = ['monitor', 'cpu', 'router', 'keyboard', 'flash', 'printer', 'ssd', 'modem', 'mouse', 'gpu'];
const STEPS = ['แยกประเภท', 'ต่อ Data Core', 'ทดสอบความเข้าใจ'];

type Phase = 'sort' | 'launch' | 'quiz' | 'done';
type RoundFeedback = { correct: boolean; category: Category; message: string } | null;

function shuffled<T,>(values: readonly T[]) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function Mission3() {
  const { addEvidence } = useStore();
  const hints = useMissionHints(3);
  const deck = useMemo(() => shuffled(POOL), []);
  const [phase, setPhase] = useState<Phase>('sort');
  const [round, setRound] = useState(0);
  const [classified, setClassified] = useState<Record<string, Category>>({});
  const [roundFeedback, setRoundFeedback] = useState<RoundFeedback>(null);
  const [attemptsOnCard, setAttemptsOnCard] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [flowIndex, setFlowIndex] = useState(-1);
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [quizTries, setQuizTries] = useState(0);

  const currentId = deck[round];
  const current = currentId ? HW[currentId] : null;
  const stage = phase === 'sort' ? 0 : phase === 'launch' ? 1 : 2;

  useBuddyTopic(
    {
      scope: 3,
      hint: phase === 'sort'
        ? 'จำแนกจากหน้าที่ ไม่ใช่หน้าตาหรือชื่อ: รับข้อมูล, ประมวลผล, เก็บข้อมูล, แสดงผล หรือสื่อสารกับเครือข่าย'
        : 'Router รับ-ส่งข้อมูลระหว่างเครือข่าย ส่วนจอภาพแสดงผลที่ผู้ใช้มองเห็น',
      evidence: [`คัดแยกอุปกรณ์แล้ว ${Object.keys(classified).length}/${POOL.length} ชิ้น`, 'ลองอ่านบรรทัด “หน้าที่” บนการ์ดก่อนเลือกประเภท'],
      lesson: { text: 'ฮาร์ดแวร์จำแนกตามลักษณะการทำงานได้ 5 ประเภท: Input, Processing, Storage, Output และ Communication', hw: ['keyboard', 'cpu', 'ssd', 'monitor', 'router'] },
    },
    [phase, round, Object.keys(classified).length],
  );

  useEffect(() => {
    if (phase !== 'launch' || flowIndex < 0) return;
    if (flowIndex >= CATEGORY_ORDER.length) {
      setPhase('quiz');
      return;
    }
    const timeout = window.setTimeout(() => setFlowIndex((value) => value + 1), 720);
    return () => window.clearTimeout(timeout);
  }, [phase, flowIndex]);

  const answer = (category: Category) => {
    if (!current || roundFeedback?.correct) return;
    const correct = current.category === category;
    setAttemptsOnCard((value) => value + 1);
    if (!correct) {
      setMistakes((value) => value + 1);
      setCombo(0);
      setRoundFeedback({
        correct: false,
        category,
        message: `ลองดูหน้าที่อีกครั้ง: “${current.func}” อุปกรณ์นี้ทำหน้าที่หลักอะไรในระบบ?`,
      });
      return;
    }

    const nextCombo = combo + 1;
    const cleanAnswer = attemptsOnCard === 0;
    const bonus = cleanAnswer ? Math.min(combo, 5) * 25 : 0;
    setClassified((value) => ({ ...value, [current.id]: category }));
    setFirstTryCorrect((value) => value + Number(cleanAnswer));
    setCombo(nextCombo);
    setBestCombo((value) => Math.max(value, nextCombo));
    setScore((value) => value + 100 + bonus);
    setRoundFeedback({
      correct: true,
      category,
      message: cleanAnswer
        ? `ถูกต้อง! ${current.en} อยู่ในกลุ่ม ${CATEGORIES[category].en}${bonus ? ` · คอมโบ +${bonus}` : ''}`
        : `ถูกต้อง! ${current.en} ทำหน้าที่ ${CATEGORIES[category].en}`,
    });
  };

  const continueRound = () => {
    if (!roundFeedback?.correct) return;
    if (round < deck.length - 1) {
      setRound((value) => value + 1);
      setAttemptsOnCard(0);
      setRoundFeedback(null);
      return;
    }

    const grade = gradeHardwareSort(POOL, classified);
    if (!grade.complete || grade.incorrect.length) return;
    CATEGORY_ORDER.forEach((category) => {
      addEvidence({
        id: `m3-${category}`,
        type: 'category',
        title: `${CATEGORIES[category].en} · ${CATEGORIES[category].th}`,
        lines: [CATEGORIES[category].desc, `ตัวอย่าง: ${POOL.filter((id) => HW[id].category === category).map((id) => HW[id].en.split(' (')[0]).join(', ')}`],
        mission: 3,
      });
    });
    setPhase('launch');
    setFlowIndex(0);
    setRoundFeedback(null);
  };

  if (phase === 'done') {
    return (
      <MissionComplete
        id={3}
        score={{
          accuracy: clamp((firstTryCorrect / POOL.length) * 100),
          investigation: 100,
          reasoning: clamp(100 - mistakes * 7 - Math.max(0, quizTries - 1) * 18),
          independence: independence(hints),
        }}
        learned={(
          <>
            <p>ฮาร์ดแวร์แบ่งตามลักษณะการทำงานได้ <b>5 ประเภท</b> และแต่ละอุปกรณ์อาจมีรูปร่างต่างกันแต่ทำหน้าที่ในกลุ่มเดียวกัน</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              {CATEGORY_ORDER.map((category) => <li key={category}><b>{CATEGORIES[category].en}</b> — {CATEGORIES[category].desc}</li>)}
            </ol>
            <p className="mt-3 rounded-xl bg-cyan-50 p-3 text-sm font-semibold text-cyan-950">แต้ม {score.toLocaleString()} · คอมโบสูงสุด {bestCombo} · ตอบผิดแล้วลองใหม่ {mistakes} ครั้ง</p>
          </>
        )}
        meta={{ score, bestCombo, mistakes, firstTryCorrect }}
      />
    );
  }

  return (
    <MissionFrame id={3} steps={STEPS} step={stage} brief={<>สัญญาณในศูนย์ข้อมูลขัดข้อง! อ่านหน้าที่ของอุปกรณ์ที่ส่งเข้ามา แล้วส่งไปยังกลุ่มการทำงานให้ถูกต้อง เพื่อชาร์จพลัง <b>Data Core</b> กลับคืนมา</>}>
      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3" aria-label="สถานะภารกิจ">
        <HudStat label="DATA CORE" value={phase === 'sort' ? `${Object.keys(classified).length}/${POOL.length}` : phase === 'launch' ? 'SYNC' : 'READY'} icon={<Cpu className="h-4 w-4" />} accent="cyan" />
        <HudStat label="คะแนน" value={score.toLocaleString()} icon={<Zap className="h-4 w-4" />} accent="amber" />
        <HudStat label="คอมโบ" value={`${combo}x`} icon={<Sparkles className="h-4 w-4" />} accent="violet" />
      </div>

      {phase === 'sort' && current && (
        <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
          <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-cyan-200/20 bg-[radial-gradient(ellipse_at_20%_0%,_rgba(8,145,178,.28),transparent_45%),linear-gradient(145deg,#071525,#0c1d31_55%,#11122a)] p-4 text-white shadow-[0_24px_70px_-34px_rgba(8,47,73,.75)] sm:p-6" aria-label="Data Core sorting challenge">
            <div className="pointer-events-none absolute inset-0 opacity-[.1] [background-image:linear-gradient(rgba(103,232,249,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.5)_1px,transparent_1px)] [background-size:28px_28px]" aria-hidden="true" />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-[10px] font-black tracking-[.22em] text-cyan-300">DATA CORE DEFENSE · ROUND {String(round + 1).padStart(2, '0')}</p><h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">คัดแยกชิ้นส่วนที่เข้ามา</h2></div>
              <span className="rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5 text-xs font-bold text-slate-200">ไม่จับเวลา · ลองใหม่ได้</span>
            </div>

            <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-slate-950/75" role="progressbar" aria-label="ความคืบหน้าการจำแนกอุปกรณ์" aria-valuenow={round} aria-valuemin={0} aria-valuemax={POOL.length}>
              <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-300" animate={{ width: `${(round / POOL.length) * 100}%` }} transition={{ duration: .3 }} />
            </div>
            <div className="relative mt-2 flex gap-1.5" aria-hidden="true">
              {deck.map((id, index) => <span key={`${id}-${index}`} className={cx('h-1.5 flex-1 rounded-full', index < round ? 'bg-emerald-300' : index === round ? 'bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.9)]' : 'bg-white/15')} />)}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={current.id} initial={{ opacity: 0, y: 12, rotateX: -3 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .2 }} className="relative mt-4 grid min-h-[260px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/90 to-slate-950/90 shadow-inner sm:min-h-[310px] sm:grid-cols-[.9fr_1.1fr]">
                <div className="relative grid min-h-44 place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_rgba(34,211,238,.15),transparent_65%)] p-5 sm:min-h-full">
                  <span className="absolute left-3 top-3 rounded-full border border-cyan-200/15 bg-black/25 px-2.5 py-1 text-[10px] font-black tracking-widest text-cyan-200">EQUIPMENT SCAN</span>
                  <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="grid h-36 w-full max-w-[220px] place-items-center rounded-2xl border border-cyan-100/10 bg-white/[.04] p-4 shadow-[0_0_46px_-20px_rgba(34,211,238,.45)] sm:h-44">
                    {hasArt(current.id) ? <HardwareArt art={current.id} title={current.en} className="h-full w-full drop-shadow-[0_14px_18px_rgba(0,0,0,.45)]" /> : <Ico name={current.icon} className="h-24 w-24 text-cyan-100 drop-shadow-[0_12px_20px_rgba(34,211,238,.3)]" />}
                  </motion.span>
                </div>
                <div className="flex flex-col justify-center p-4 sm:p-6">
                  <p className="text-[10px] font-black tracking-[.2em] text-amber-300">COMPONENT IDENTIFIED</p>
                  <h3 className="mt-1 font-display text-2xl font-black text-white sm:text-3xl">{current.en}</h3>
                  <div className="mt-4 rounded-xl border border-cyan-200/15 bg-cyan-950/35 p-3 sm:p-4">
                    <p className="text-[10px] font-black tracking-widest text-cyan-300">หน้าที่ของอุปกรณ์</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-100 sm:text-base">{current.func}</p>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">เลือกประเภทที่ตรงกับหน้าที่หลักของชิ้นส่วนนี้</p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="relative mt-4 min-h-12" aria-live="polite">
              <AnimatePresence mode="wait">
                {roundFeedback && <motion.div key={`${current.id}-${roundFeedback.correct}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className={cx('flex items-start gap-3 rounded-xl border p-3 text-sm', roundFeedback.correct ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100' : 'border-rose-300/30 bg-rose-400/10 text-rose-100')}>
                  {roundFeedback.correct ? <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" /> : <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" aria-hidden="true" />}
                  <p className="flex-1 leading-relaxed">{roundFeedback.message}</p>
                  {!roundFeedback.correct && <button type="button" onClick={() => setRoundFeedback(null)} className="min-h-10 shrink-0 rounded-lg bg-white/10 px-3 font-bold text-white hover:bg-white/15">ลองใหม่</button>}
                </motion.div>}
              </AnimatePresence>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_48px_-34px_rgba(15,39,68,.6)] backdrop-blur sm:p-5" aria-label="เลือกประเภทการทำงานของอุปกรณ์">
            <div className="mb-3 flex items-end justify-between gap-2"><div><p className="text-[10px] font-black tracking-[.2em] text-cyan-800">CHOOSE THE FUNCTION</p><h3 className="font-display text-lg font-bold text-slate-900">ส่งเข้าแผงประเภท</h3></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">5 หมวด</span></div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {CATEGORY_ORDER.map((category, index) => {
                const c = CATEGORIES[category];
                const pickedWrong = roundFeedback?.category === category && !roundFeedback.correct;
                return <motion.button key={category} whileHover={{ y: -2 }} whileTap={{ scale: .985 }} type="button" onClick={() => answer(category)} disabled={roundFeedback?.correct} aria-label={`${c.en}: ${c.th}. ${c.desc}`} className={cx('group flex min-h-[68px] items-center gap-3 rounded-xl border p-3 text-left transition duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:cursor-default', pickedWrong ? 'border-rose-300 bg-rose-50 ring-2 ring-rose-200' : 'border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:border-cyan-300 hover:shadow-md', roundFeedback?.correct && roundFeedback.category === category && 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200')}>
                  <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-lg font-black text-white shadow-sm', c.color)}>{index + 1}</span>
                  <span className="min-w-0 flex-1"><b className={cx('block text-sm', c.text)}>{c.en}</b><span className="block text-xs leading-snug text-slate-500">{c.desc}</span></span>
                  {roundFeedback?.correct && roundFeedback.category === category ? <Check className="h-5 w-5 text-emerald-600" aria-hidden="true" /> : <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-cyan-700" aria-hidden="true" />}
                </motion.button>;
              })}
            </div>
            {roundFeedback?.correct && <Btn onClick={continueRound} className="mt-4 w-full"><span>{round === deck.length - 1 ? 'ส่งพลังงานเข้า Data Core' : 'ชิ้นต่อไป'}</span><ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2.5 text-xs text-white"><span className="inline-flex items-center gap-2 text-slate-300"><Zap className="h-4 w-4 text-amber-300" aria-hidden="true" /> คอมโบตอบถูกติดกัน</span><b className="font-mono text-amber-200">{combo}x <span className="text-slate-500">· BEST {bestCombo}x</span></b></div>
          </section>
        </div>
      )}

      {phase === 'launch' && (
        <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-cyan-200/25 bg-[radial-gradient(ellipse_at_50%_0%,_rgba(8,145,178,.32),transparent_56%),linear-gradient(145deg,#071525,#101b34)] p-5 text-white shadow-2xl sm:p-8" aria-label="Data Core boot sequence">
          <div className="mx-auto max-w-4xl text-center"><motion.div animate={{ boxShadow: ['0 0 24px rgba(34,211,238,.15)', '0 0 60px rgba(34,211,238,.55)', '0 0 24px rgba(34,211,238,.15)'] }} transition={{ duration: 2, repeat: Infinity }} className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-cyan-200/35 bg-cyan-300/10 text-cyan-200"><Cpu className="h-10 w-10" aria-hidden="true" /></motion.div><p className="mt-4 text-xs font-black tracking-[.25em] text-cyan-300">DATA CORE · BOOT SEQUENCE</p><h2 className="mt-1 font-display text-2xl font-black sm:text-3xl">ทุกหน้าที่เชื่อมต่อกันแล้ว!</h2><p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">ดูเส้นทางงานตัวอย่าง ตั้งแต่รับข้อมูล ประมวลผล บันทึก แสดงผล จนส่งต่อผ่านเครือข่าย</p></div>
          <div className="mx-auto mt-7 grid max-w-5xl gap-2 sm:grid-cols-5">
            {CATEGORY_ORDER.map((category, index) => {
              const c = CATEGORIES[category];
              const active = index <= flowIndex;
              return <motion.div key={category} animate={active ? { y: [0, -3, 0] } : { opacity: .42 }} transition={{ duration: .42 }} className={cx('relative rounded-xl border p-3 text-center transition', active ? 'border-cyan-200/35 bg-cyan-300/10 shadow-[0_0_24px_-10px_rgba(34,211,238,.75)]' : 'border-white/10 bg-white/[.04]')}>
                <span className={cx('mx-auto grid h-9 w-9 place-items-center rounded-xl text-sm font-black text-white', c.color)}>{index + 1}</span><p className="mt-2 text-sm font-bold">{c.en}</p>{active && <CircleCheck className="mx-auto mt-1 h-4 w-4 text-emerald-300" aria-label="เชื่อมต่อแล้ว" />}
                {index < CATEGORY_ORDER.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-cyan-200 sm:block" aria-hidden="true" />}
              </motion.div>;
            })}
          </div>
          <div className="mx-auto mt-5 max-w-xl rounded-xl border border-emerald-200/20 bg-emerald-300/10 px-4 py-3 text-center text-sm font-semibold text-emerald-100" aria-live="polite">{flowIndex >= CATEGORY_ORDER.length ? 'ระบบกลับมาทำงานแล้ว · ตรวจความเข้าใจอีกหนึ่งข้อ' : `เชื่อมต่อ ${Math.min(flowIndex + 1, CATEGORY_ORDER.length)} / ${CATEGORY_ORDER.length} ประเภท`}</div>
        </section>
      )}

      {phase === 'quiz' && (
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="rounded-2xl bg-gradient-to-r from-cyan-950 to-indigo-950 p-5 text-white ring-1 ring-cyan-200/20"><p className="text-xs font-black tracking-[.2em] text-cyan-300">FINAL CHECK · DATA CORE ONLINE</p><p className="mt-1 font-display text-xl font-bold">เยี่ยมเลย ช่างเทคนิค! ยืนยันเหตุผลการจัดหมวดอีกครั้ง</p><p className="mt-1 text-sm text-slate-300">คะแนนสะสม {score.toLocaleString()} · คอมโบสูงสุด {bestCombo}x</p></div>
          <Quiz
            title="ทำไม Router จึงอยู่ในกลุ่ม Communication ไม่ใช่ Output?"
            choices={[
              'เพราะ Router ส่งและรับข้อมูลระหว่างคอมพิวเตอร์กับเครือข่าย ไม่ได้แสดงผลให้ผู้ใช้โดยตรง',
              'เพราะ Router มีไฟแสดงสถานะหลายดวง',
              'เพราะ Router ใช้เก็บไฟล์แทน SSD',
              'เพราะ Router ทำหน้าที่ประมวลผลแทน CPU',
            ]}
            answer={0}
            value={quizPick}
            onPick={(value) => { setQuizPick(value); setQuizTries((count) => count + 1); }}
            wrongFb={['', 'ไฟสถานะเป็นเพียงตัวบอกสถานะ ไม่ใช่หน้าที่หลัก', 'Router ไม่ได้เก็บไฟล์แบบอุปกรณ์ Storage', 'การประมวลผลหลักเป็นหน้าที่ของ CPU/GPU']}
            rightFb="ถูกต้อง! จำแนกจากหน้าที่หลัก: Communication ใช้รับ-ส่งข้อมูลกับเครือข่าย ส่วน Output ส่งผลลัพธ์ให้ผู้ใช้เห็นหรือได้ยิน"
          />
          {quizPick === 0 && <div className="flex justify-end"><Btn variant="success" onClick={() => setPhase('done')}>รับตรา Hardware Sorter <Sparkles className="h-4 w-4" aria-hidden="true" /></Btn></div>}
        </div>
      )}
    </MissionFrame>
  );
}

function HudStat({ label, value, icon, accent }: { label: string; value: string; icon: ReactNode; accent: 'cyan' | 'amber' | 'violet' }) {
  const colors = {
    cyan: 'border-cyan-200/20 bg-cyan-950/80 text-cyan-200',
    amber: 'border-amber-200/20 bg-amber-950/80 text-amber-200',
    violet: 'border-violet-200/20 bg-violet-950/80 text-violet-200',
  };
  return <div className={cx('flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-white shadow-sm sm:gap-3 sm:px-4', colors[accent])}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10">{icon}</span><span className="min-w-0"><span className="block truncate text-[9px] font-black tracking-[.16em] opacity-70 sm:text-[10px]">{label}</span><b className="block truncate font-mono text-sm tabular-nums sm:text-base">{value}</b></span></div>;
}

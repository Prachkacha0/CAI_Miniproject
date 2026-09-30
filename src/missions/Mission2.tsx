import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CircleCheck, CircleX, Power, TriangleAlert } from 'lucide-react';
import type { Category } from '../types';
import { useStore } from '../store';
import { CATEGORIES, CATEGORY_ORDER } from '../data/hardware';
import { Btn, Card, Feedback, cx, type FeedbackKind } from '../components/ui';
import { Ico } from '../components/icons';
import { HardwareArt, hasArt } from '../components/HardwareArt';
import { useBuddyTopic } from '../components/Buddy';
import { MissionComplete, MissionFrame, clamp, independence } from './common';
import { useMissionHints } from './useMissionHints';
import { Quiz } from './Quiz';

interface Part {
  id: string;
  en: string;
  icon: string;
  cat: Category;
  failure: string; // status label when removed
  effect: string; // what the user sees
}

const PARTS: Part[] = [
  { id: 'keyboard', en: 'Keyboard', icon: 'keyboard', cat: 'input', failure: 'INPUT FAILURE', effect: 'พิมพ์ข้อความไม่ได้ ช่องค้นหาว่างเปล่า' },
  { id: 'mouse', en: 'Mouse', icon: 'mouse', cat: 'input', failure: 'POINTER LOST', effect: 'ตัวชี้เมาส์หายไป คลิกเลือกอะไรไม่ได้' },
  { id: 'cpu', en: 'CPU', icon: 'cpu', cat: 'processing', failure: 'NO PROCESSING', effect: 'เครื่องไม่ทำงานเลย ไม่มีการประมวลผลคำสั่ง' },
  { id: 'ram', en: 'RAM', icon: 'memory', cat: 'processing', failure: 'MEMORY ERROR', effect: 'มีเสียงเตือน Beep และเปิดโปรแกรมไม่ได้ — ไม่มีที่พักข้อมูลขณะทำงาน' },
  { id: 'ssd', en: 'SSD (Storage)', icon: 'save', cat: 'storage', failure: 'STORAGE FAILURE', effect: '"No bootable device" — ไม่พบระบบปฏิบัติการและไฟล์' },
  { id: 'monitor', en: 'Monitor', icon: 'monitor', cat: 'output', failure: 'OUTPUT UNAVAILABLE', effect: 'เครื่องทำงาน แต่ผู้ใช้มองไม่เห็นผลลัพธ์ใด ๆ' },
  { id: 'speaker', en: 'Speaker', icon: 'speaker', cat: 'output', failure: 'NO AUDIO', effect: 'วิดีโอเล่นได้ แต่ไม่มีเสียง' },
  { id: 'router', en: 'Router', icon: 'router', cat: 'communication', failure: 'NETWORK DOWN', effect: 'เข้าอินเทอร์เน็ตไม่ได้ ส่งไฟล์ให้เครื่องอื่นไม่ได้' },
];

const CASES = [
  { ticket: 'ผู้ใช้แจ้ง: "เปิดเครื่องแล้วขึ้นข้อความ No bootable device หาไฟล์งานไม่เจอเลย"', answer: 'ssd', fb: 'Storage เก็บระบบปฏิบัติการและไฟล์ — ถ้าไม่มี เครื่องจะหาอะไรมาเริ่มทำงานไม่ได้' },
  { ticket: 'ผู้ใช้แจ้ง: "เครื่องเปิดอยู่ ไฟติด พัดลมหมุน แต่ไม่เห็นอะไรเลย"', answer: 'monitor', fb: 'Monitor เป็นอุปกรณ์ Output ถ้าขาดไป งานทั้งหมดที่ทำก็ไม่มีใครเห็น' },
  { ticket: 'ผู้ใช้แจ้ง: "กรอกคะแนนนักเรียนไม่ได้ กดตัวอักษรแล้วไม่ขึ้น"', answer: 'keyboard', fb: 'Keyboard เป็นอุปกรณ์ Input ระบบจึงรับข้อมูลเข้าไม่ได้' },
];

const STEPS = ['Experiment', 'Observe Impact', 'Diagnose', 'Conclude'];

export function Mission2() {
  const { addEvidence } = useStore();
  const hints = useMissionHints(2);
  const [removed, setRemoved] = useState<string[]>([]);
  const [tested, setTested] = useState<string[]>([]);
  const [last, setLast] = useState<Part | null>(null);
  const [focusedId, setFocusedId] = useState<string>('cpu');
  const [phase, setPhase] = useState<'lab' | 'diagnose' | 'conclude' | 'done'>('lab');
  const [fb, setFb] = useState<{ kind: FeedbackKind; text: string } | null>(null);
  const [caseIdx, setCaseIdx] = useState(0);
  const [casePick, setCasePick] = useState<string | null>(null);
  const [caseFirst, setCaseFirst] = useState<boolean[]>([]);
  const [caseTries, setCaseTries] = useState(0);
  const [q, setQ] = useState<number | null>(null);
  const [qTries, setQTries] = useState(0);

  const down = useMemo(() => new Set(PARTS.filter((p) => removed.includes(p.id)).map((p) => p.cat)), [removed]);
  const systemOk = removed.length === 0;
  const cpuGone = removed.includes('cpu');

  useBuddyTopic(
    phase === 'lab'
      ? {
          scope: 2,
          hint: 'ลองถอดทีละชิ้น แล้วดูว่าไฟสถานะกลุ่มไหนดับ — ระบบเสียความสามารถอะไรไป?',
          evidence: [`ทดลองไปแล้ว ${tested.length}/${PARTS.length} ชิ้น`, 'แผงไฟสถานะ 5 ดวงด้านขวาคือ 5 ประเภทของ Hardware'],
          lesson: { text: 'แต่ละ Hardware รับผิดชอบงานคนละส่วน ขาดชิ้นใดไป ระบบก็เสียความสามารถส่วนนั้น' },
        }
      : phase === 'diagnose'
        ? {
            scope: 2,
            hint: 'อาการที่ลูกค้าเล่า ตรงกับผลการทดลองชิ้นไหนที่คุณเคยเห็น?',
            evidence: ['เปิด Evidence Board ดู Diagnostic Evidence ที่เก็บจากการทดลอง'],
            lesson: { text: 'Input รับข้อมูล · Storage เก็บข้อมูล · Output แสดงผล — อาการเสียจะบอกว่ากลุ่มไหนขาดไป' },
          }
        : {
            scope: 2,
            hint: 'ถ้าซอฟต์แวร์ดีแค่ไหน แต่ไม่มี Hardware รองรับ จะเกิดอะไรขึ้น?',
            evidence: ['ทุกการทดลองของคุณ: ขาด Hardware หนึ่งชิ้น → ระบบเสียความสามารถหนึ่งด้าน'],
            lesson: { text: 'ความสำคัญของ Hardware: เป็นฐานที่ทำให้ซอฟต์แวร์ทำงานได้จริง' },
          },
    [phase, tested.length],
  );

  const toggle = (p: Part) => {
    const isRemoved = removed.includes(p.id);
    setRemoved((r) => (isRemoved ? r.filter((x) => x !== p.id) : [...r, p.id]));
    if (!isRemoved) {
      setLast(p);
      if (!tested.includes(p.id)) {
        setTested((t) => [...t, p.id]);
        addEvidence({ id: `m2-${p.id}`, type: 'diagnostic', title: `Remove ${p.en} → ${p.failure}`, lines: [p.effect, `กลุ่มที่ได้รับผลกระทบ: ${CATEGORIES[p.cat].en}`], mission: 2, hwId: p.id === 'ssd' ? 'ssd' : p.id });
      }
    } else setLast(null);
    setFb(null);
  };

  const pickCase = (id: string) => {
    setCasePick(id);
    const c = CASES[caseIdx];
    const right = id === c.answer;
    if (caseFirst.length === caseIdx) setCaseFirst((f) => [...f, right]);
    setCaseTries((t) => t + 1);
    setFb(right ? { kind: 'correct', text: c.fb } : { kind: 'incorrect', text: `ถ้าขาด ${PARTS.find((p) => p.id === id)?.en} อาการจะเป็น "${PARTS.find((p) => p.id === id)?.effect}" — ยังไม่ตรงกับที่ผู้ใช้เล่า` });
  };

  if (phase === 'done') {
    const firstRight = caseFirst.filter(Boolean).length;
    return (
      <MissionComplete
        id={2}
        score={{
          accuracy: clamp((firstRight / CASES.length) * 75 + (qTries === 1 ? 25 : 10)),
          investigation: clamp((tested.length / PARTS.length) * 100),
          reasoning: clamp(100 - (caseTries - CASES.length) * 12 - (qTries - 1) * 20),
          independence: independence(hints),
        }}
        learned={
          <>
            <p>Hardware <b>สำคัญ</b> เพราะเป็นฐานให้ระบบทำงานได้จริง: ขาดชิ้นใดไป ระบบจะเสียความสามารถด้านนั้นทันที</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>ขาด Input → รับข้อมูลไม่ได้</li>
              <li>ขาด Processing → ประมวลผลไม่ได้</li>
              <li>ขาด Storage → ไม่มีที่เก็บ OS และไฟล์</li>
              <li>ขาด Output → ไม่เห็น/ไม่ได้ยินผลลัพธ์</li>
              <li>ขาด Communication → สื่อสารกับเครือข่ายไม่ได้</li>
            </ul>
          </>
        }
      />
    );
  }

  return (
    <MissionFrame
      id={2}
      steps={STEPS}
      step={phase === 'lab' ? (tested.length ? 1 : 0) : phase === 'diagnose' ? 2 : 3}
      brief={
        phase === 'lab' ? (
          <>นี่คือ <b>เครื่องทดลอง TEST-BENCH</b> 🧪 ลอง <b>ถอด</b> อุปกรณ์ทีละชิ้นแล้วสังเกตผลกระทบ ทดลองอย่างน้อย <b>6 ชิ้น</b> เพื่อเก็บ Diagnostic Evidence</>
        ) : phase === 'diagnose' ? (
          <>มีงานซ่อมเข้ามา {CASES.length} งาน ใช้ผลการทดลองของคุณวินิจฉัยว่า <b>ระบบขาดอะไร?</b></>
        ) : (
          <>สรุปสิ่งที่ค้นพบจากการทดลอง</>
        )
      }
    >
      {phase === 'lab' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            <WorkbenchScene parts={PARTS} removed={removed} tested={tested} focusedId={focusedId} onFocus={setFocusedId} onDrop={toggle} />
          </div>
          <div className="space-y-4">
            {(() => {
              const focused = PARTS.find((p) => p.id === focusedId) ?? PARTS[0];
              const off = removed.includes(focused.id);
              const c = CATEGORIES[focused.cat];
              return <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-200">
                <div className="relative grid min-h-40 place-items-center bg-[radial-gradient(ellipse_at_center,_#27364a,_#101827)] p-4">
                  <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold tracking-widest text-cyan-200">MACRO VIEW · 01×</span>
                  {hasArt(focused.id) ? <HardwareArt art={focused.id} title={focused.en} className="w-full max-w-52 drop-shadow-[0_16px_22px_rgba(0,0,0,.45)]" /> : <Ico name={focused.icon} className="h-20 w-20 text-slate-100 drop-shadow-xl" />}
                  {off && <span className="absolute bottom-3 right-3 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black text-slate-950">ON BENCH</span>}
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-black tracking-[.18em] text-indigo-500">PART INSPECTOR</p>
                  <h3 className="mt-1 font-display text-lg font-bold text-slate-900">{focused.en}</h3>
                  <p className={cx('mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold', c.soft, c.text)}>{c.en} · {off ? 'removed' : 'installed'}</p>
                  <p className="mt-3 min-h-12 text-sm leading-relaxed text-slate-600">{off ? focused.effect : `ทำงานในกลุ่ม ${c.en} — ลองหยิบออกเพื่อดูผลกระทบที่เกิดกับเครื่อง`}</p>
                  <button onClick={() => toggle(focused)} className="mt-3 min-h-11 w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">{off ? 'ใส่ชิ้นส่วนกลับเข้าที่' : 'ถอดชิ้นส่วนออกมาทดสอบ'}</button>
                </div>
              </div>;
            })()}
            <div className="rounded-3xl bg-slate-900 p-4 text-slate-100 shadow-xl">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-cyan-300"><Power className="h-4 w-4" aria-hidden="true" /> SYSTEM STATUS</p>
              <ul className="space-y-1.5">
                {CATEGORY_ORDER.map((cat) => {
                  const bad = down.has(cat) || (cpuGone && cat !== 'processing');
                  return (
                    <li key={cat} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                      <span>{CATEGORIES[cat].en}</span>
                      <motion.span animate={bad ? { opacity: [1, 0.4, 1] } : { opacity: 1 }} transition={{ repeat: bad ? Infinity : 0, duration: 0.9 }} className={cx('inline-flex items-center gap-1 text-xs font-bold', bad ? 'text-rose-400' : 'text-emerald-400')}>
                        {bad ? <CircleX className="h-4 w-4" aria-hidden="true" /> : <CircleCheck className="h-4 w-4" aria-hidden="true" />}
                        {bad ? 'FAIL' : 'OK'}
                      </motion.span>
                    </li>
                  );
                })}
              </ul>
              <div className={cx('mt-3 rounded-xl p-3 font-mono text-xs', systemOk ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300')} aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.p key={last?.id ?? (systemOk ? 'ok' : 'x')} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {systemOk ? '> ALL SYSTEMS NORMAL' : last ? <>&gt; {last.failure}<br />{last.effect}</> : '> SYSTEM DEGRADED'}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
            {fb && <Feedback kind={fb.kind}>{fb.text}</Feedback>}
            <Btn
              className="w-full"
              onClick={() => {
                if (tested.length < 6) {
                  setFb({ kind: 'investigate', text: `ทดลองไปแล้ว ${tested.length} ชิ้น — ลองอีก ${6 - tested.length} ชิ้น เพื่อให้เห็นผลกระทบครบทุกกลุ่ม` });
                  return;
                }
                setRemoved([]);
                setFb(null);
                setPhase('diagnose');
              }}
            >
              ไปรับงานซ่อม <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Btn>
          </div>
        </div>
      )}

      {phase === 'diagnose' && (
        <div className="mx-auto max-w-3xl space-y-4">
          <Card>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600"><TriangleAlert className="h-4 w-4" aria-hidden="true" /> TICKET {caseIdx + 1}/{CASES.length}</div>
            <p className="mt-2 font-display text-lg font-bold text-slate-900">{CASES[caseIdx].ticket}</p>
            <p className="mt-3 text-sm font-semibold text-slate-600">ระบบนี้ขาดอะไร?</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PARTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickCase(p.id)}
                  disabled={casePick === CASES[caseIdx].answer}
                  className={cx(
                    'flex min-h-12 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold ring-2',
                    casePick === p.id ? (p.id === CASES[caseIdx].answer ? 'bg-emerald-50 ring-emerald-400' : 'bg-rose-50 ring-rose-300') : 'bg-slate-50 ring-transparent hover:ring-slate-200',
                  )}
                >
                  <Ico name={p.icon} className="h-4 w-4" /> {p.en}
                </button>
              ))}
            </div>
          </Card>
          {fb && <Feedback kind={fb.kind}>{fb.text}</Feedback>}
          {casePick === CASES[caseIdx].answer && (
            <div className="flex justify-end">
              <Btn
                onClick={() => {
                  setFb(null);
                  setCasePick(null);
                  if (caseIdx < CASES.length - 1) setCaseIdx((i) => i + 1);
                  else setPhase('conclude');
                }}
              >
                {caseIdx < CASES.length - 1 ? 'งานถัดไป' : 'สรุปผล'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Btn>
            </div>
          )}
        </div>
      )}

      {phase === 'conclude' && (
        <div className="mx-auto max-w-2xl space-y-4">
          <Quiz
            title="จากการทดลองทั้งหมด ข้อใดอธิบายความสำคัญของ Hardware ได้ดีที่สุด?"
            choices={[
              'Hardware สำคัญเพราะทำให้เครื่องดูสวยงาม',
              'Hardware เป็นฐานที่ทำให้ระบบรับ ประมวลผล เก็บ แสดงผล และสื่อสารข้อมูลได้จริง',
              'Hardware ไม่สำคัญ ถ้าซอฟต์แวร์ดีพอ',
              'Hardware สำคัญเฉพาะ CPU ชิ้นเดียว',
            ]}
            answer={1}
            value={q}
            onPick={(i) => { setQ(i); setQTries((t) => t + 1); }}
            wrongFb={['ลองนึกถึงผลการทดลอง — ถอด Monitor แล้วเครื่องแค่ "ไม่สวย" หรือใช้งานไม่ได้?', '', 'ตอนถอด SSD ซอฟต์แวร์ยังทำงานได้ไหม?', 'ตอนถอด Keyboard หรือ Monitor ระบบก็เสียความสามารถเหมือนกัน']}
            rightFb="ถูกต้อง! ทุกชิ้นมีบทบาท ขาดชิ้นใดไป ระบบเสียความสามารถด้านนั้น"
          />
          {q === 1 && (
            <div className="flex justify-end">
              <Btn variant="success" onClick={() => {
                addEvidence({ id: 'm2-importance', type: 'case', title: 'ความสำคัญของ Hardware', lines: ['ขาด Hardware ชิ้นหนึ่ง → ระบบเสียความสามารถหนึ่งด้าน', 'ซอฟต์แวร์ต้องอาศัย Hardware ในการทำงาน'], mission: 2 });
                setPhase('done');
              }}>ปิดภารกิจ <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>
            </div>
          )}
        </div>
      )}
    </MissionFrame>
  );
}

function WorkbenchScene({ parts, removed, tested, focusedId, onFocus, onDrop }: {
  parts: Part[]; removed: string[]; tested: string[]; focusedId: string;
  onFocus: (id: string) => void; onDrop: (part: Part) => void;
}) {
  const caseRef = useRef<HTMLDivElement>(null);
  const matRef = useRef<HTMLDivElement>(null);
  const heldRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const removedRef = useRef(removed);
  const dropRef = useRef(onDrop);
  const [held, setHeld] = useState<{ id: string; x: number; y: number } | null>(null);
  removedRef.current = removed;
  dropRef.current = onDrop;

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!heldRef.current) return;
      const next = { ...heldRef.current, x: e.clientX, y: e.clientY };
      heldRef.current = next;
      setHeld(next);
    };
    const up = (e: PointerEvent) => {
      const piece = heldRef.current;
      if (!piece) return;
      const isOnBench = removedRef.current.includes(piece.id);
      const zone = (isOnBench ? caseRef.current : matRef.current)?.getBoundingClientRect();
      if (zone && e.clientX >= zone.left && e.clientX <= zone.right && e.clientY >= zone.top && e.clientY <= zone.bottom) {
        const part = parts.find((p) => p.id === piece.id);
        if (part) dropRef.current(part);
      }
      heldRef.current = null;
      setHeld(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [parts]);

  const grab = (id: string, e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    onFocus(id);
    const next = { id, x: e.clientX, y: e.clientY };
    heldRef.current = next;
    setHeld(next);
  };

  const tile = (p: Part) => {
    const off = removed.includes(p.id);
    const focused = focusedId === p.id;
    return <motion.button key={p.id} layout type="button" onClick={() => onFocus(p.id)} onPointerDown={(e) => grab(p.id, e)} aria-label={`${off ? 'วางบนแผ่นรองแล้ว' : 'ติดตั้งในเคส'}: ${p.en} กดค้างแล้วลากย้าย`} aria-grabbed={held?.id === p.id}
      className={cx('group relative flex min-h-24 w-full touch-none select-none flex-col items-center justify-center overflow-hidden rounded-2xl border bg-white/95 p-2 shadow-[0_8px_20px_-12px_rgba(15,23,42,.6)] transition', focused ? 'border-cyan-400 ring-2 ring-cyan-300/70' : 'border-white/70 hover:-translate-y-0.5 hover:shadow-lg', held?.id === p.id && 'opacity-30')}>
      {tested.includes(p.id) && <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-sky-100 px-1.5 text-[9px] font-black text-sky-700">TESTED</span>}
      <span className="grid h-14 w-full place-items-center">{hasArt(p.id) ? <HardwareArt art={p.id} title={p.en} className="h-14 w-full drop-shadow-md" /> : <Ico name={p.icon} className="h-10 w-10 text-slate-700 drop-shadow" />}</span>
      <span className="mt-1 w-full truncate text-center text-[11px] font-extrabold text-slate-800">{p.en}</span>
      <span className={cx('mt-0.5 rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide', off ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}>{off ? 'ESD MAT' : 'SEATED'}</span>
    </motion.button>;
  };

  const installed = parts.filter((p) => !removed.includes(p.id));
  const onBench = parts.filter((p) => removed.includes(p.id));
  const dragged = held && parts.find((p) => p.id === held.id);
  return <section className="overflow-hidden rounded-[1.75rem] bg-[#0a1220] p-3 shadow-2xl ring-1 ring-slate-800 sm:p-4" aria-label="Interactive hardware repair bench">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
      <div><p className="text-[10px] font-black tracking-[.22em] text-cyan-300">GARAGE 02 / REPAIR BAY</p><h2 className="font-display text-lg font-extrabold text-white">Interactive workbench</h2></div>
      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold tracking-widest text-emerald-200">POWER SAFE · ESD READY</span>
    </div>
    <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
      <div ref={caseRef} className="relative min-h-64 overflow-hidden rounded-3xl border border-slate-600 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 p-3 shadow-inner sm:p-4">
        <div className="pointer-events-none absolute inset-2 rounded-2xl border border-white/10" />
        <div className="mb-3 flex items-center justify-between"><div><p className="text-[9px] font-bold tracking-[.2em] text-slate-400">OPEN CHASSIS</p><p className="text-sm font-black text-white">MAIN UNIT <span className="text-slate-400">/ {installed.length} PARTS</span></p></div><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_14px_4px_rgba(52,211,153,.45)]" /></div>
        <div className="pointer-events-none absolute bottom-8 right-6 h-24 w-24 rounded-full border-[9px] border-slate-600/80 bg-[radial-gradient(circle,_#334155_0_24%,_#0f172a_26%_42%,_#475569_45%_50%,_#172033_52%)] shadow-[0_0_35px_rgba(34,211,238,.12)] sm:right-8 sm:h-32 sm:w-32"><div className="absolute inset-3 animate-[spin_8s_linear_infinite] rounded-full border border-cyan-300/20"><i className="absolute left-1/2 top-0 h-1/2 w-px origin-bottom bg-cyan-200/40" /></div><span className="absolute inset-0 grid place-items-center"><Ico name="circuit" className="h-7 w-7 text-cyan-300/70" /></span></div>
        <div className="relative grid max-w-[72%] grid-cols-2 gap-2 sm:max-w-[74%]">{installed.length ? installed.map(tile) : <div className="col-span-2 grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-500 bg-black/20 p-5 text-center text-sm font-bold text-slate-300">เคสว่างแล้ว<br /><span className="mt-1 text-xs font-normal text-slate-400">ลากอุปกรณ์จากแผ่นรองกลับมา</span></div>}</div>
        <p className="pointer-events-none absolute bottom-2 left-4 text-[9px] font-bold tracking-widest text-slate-500">DRAG PART → ESD MAT TO REMOVE</p>
      </div>
      <div ref={matRef} className="relative min-h-64 overflow-hidden rounded-3xl border border-emerald-900 bg-[#064e3b] p-3 shadow-inner [background-image:linear-gradient(45deg,rgba(255,255,255,.035)_25%,transparent_25%,transparent_75%,rgba(255,255,255,.035)_75%),linear-gradient(45deg,rgba(255,255,255,.035)_25%,transparent_25%,transparent_75%,rgba(255,255,255,.035)_75%)] [background-position:0_0,8px_8px] [background-size:16px_16px] sm:p-4">
        <div className="pointer-events-none absolute inset-2 rounded-2xl border border-emerald-200/15" />
        <div className="relative mb-3 flex items-center justify-between"><div><p className="text-[9px] font-bold tracking-[.2em] text-emerald-200/70">ANTI-STATIC SURFACE</p><p className="text-sm font-black text-white">ESD INSPECTION MAT <span className="text-emerald-100/70">/ {onBench.length} PARTS</span></p></div><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-950/40 text-xs font-black text-emerald-200">ESD</span></div>
        <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-3">{onBench.length ? onBench.map(tile) : <div className="col-span-full grid min-h-40 place-items-center rounded-2xl border border-dashed border-emerald-100/25 bg-emerald-950/20 p-5 text-center text-sm font-bold text-emerald-50">แผ่นรองพร้อมใช้งาน<span className="mt-1 block text-xs font-normal text-emerald-100/70">หยิบชิ้นส่วนในเคส แล้วลากมาวางที่นี่</span></div>}</div>
      </div>
    </div>
    <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-300"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cyan-300/15 text-cyan-200"><Ico name="hand" className="h-4 w-4" /></span><span><b className="text-white">จับชิ้นส่วน:</b> กดค้างแล้วลากไปยังอีกพื้นที่ · แตะเพื่อเลือกดูใกล้ ๆ · ใช้ปุ่ม PART INSPECTOR เพื่อถอด/ใส่ได้เช่นกัน</span></div>
    {dragged && <div className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-cyan-300 bg-slate-950/90 p-2 shadow-[0_18px_45px_rgba(0,0,0,.55)]" style={{ left: held!.x, top: held!.y }} aria-hidden="true"><span className="grid h-16 w-20 place-items-center">{hasArt(dragged.id) ? <HardwareArt art={dragged.id} title={dragged.en} className="h-14 w-full" /> : <Ico name={dragged.icon} className="h-10 w-10 text-white" />}</span><span className="block text-center text-[10px] font-black text-white">{dragged.en}</span></div>}
  </section>;
}

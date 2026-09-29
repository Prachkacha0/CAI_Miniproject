import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowRight, Play, RotateCcw } from 'lucide-react';
import type { Category } from '../types';
import { useStore } from '../store';
import { CATEGORIES, CATEGORY_ORDER, HW } from '../data/hardware';
import { Btn, Card, Feedback, cx, type FeedbackKind } from '../components/ui';
import { Ico } from '../components/icons';
import { useBuddyTopic } from '../components/Buddy';
import { MissionComplete, MissionFrame, clamp, independence } from './common';
import { useMissionHints } from './useMissionHints';
import { Quiz } from './Quiz';

const POOL = ['monitor', 'cpu', 'router', 'keyboard', 'flash', 'printer', 'ssd', 'modem', 'mouse', 'gpu'];

const STORY: Record<Category, string> = {
  input: 'นักเรียนพิมพ์รายงานและคลิกสั่งงาน',
  processing: 'CPU/GPU ประมวลผลคำสั่งและจัดรูปแบบเอกสาร',
  storage: 'บันทึกไฟล์รายงานลง SSD / Flash Drive',
  output: 'แสดงบนจอภาพ และพิมพ์ออกเครื่องพิมพ์',
  communication: 'ส่งไฟล์ถึงครูผ่านเครือข่าย',
};

const STEPS = ['Inspect Route', 'Assign Devices', 'Run Flow', 'Explain'];

export function Mission3() {
  const { addEvidence } = useStore();
  const hints = useMissionHints(3);
  const [sel, setSel] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<string, Category>>({});
  const [wrong, setWrong] = useState<string[]>([]);
  const [runs, setRuns] = useState(0);
  const [firstRight, setFirstRight] = useState<number | null>(null);
  const [fb, setFb] = useState<{ kind: FeedbackKind; text: string } | null>(null);
  const [flow, setFlow] = useState(-1); // index of lane currently lit during the animation
  const [restored, setRestored] = useState(false);
  const [q, setQ] = useState<number | null>(null);
  const [qTries, setQTries] = useState(0);
  const [done, setDone] = useState(false);
  const [peeked, setPeeked] = useState<string[]>([]);

  const placedCount = Object.keys(slots).length;

  useBuddyTopic(
    restored
      ? {
          scope: 3,
          hint: 'Output คือผลลัพธ์ให้ "คน" รับรู้ ส่วน Communication คือส่งข้อมูลให้ "เครื่องอื่น" — Router ทำแบบไหน?',
          evidence: ['ดูข้อความในเลน Communication ระหว่าง Flow Animation'],
          lesson: { text: 'Communication = รับ-ส่งข้อมูลระหว่างคอมพิวเตอร์/เครือข่าย', hw: ['router', 'modem'] },
        }
      : {
          scope: 3,
          hint: 'ถามตัวเองกับอุปกรณ์แต่ละชิ้น: ข้อมูล "เข้า" ผ่านมัน, ถูก "คิด" โดยมัน, ถูก "เก็บ" ในมัน, "ออก" มาให้เห็น, หรือ "ส่งต่อ" ไปเครื่องอื่น?',
          evidence: ['แตะอุปกรณ์ในกล่องด้านบน จะเห็นหน้าที่ย่อของมัน', 'Mission 02 บอกว่าถอด Router แล้วเกิด NETWORK DOWN'],
          lesson: { text: 'ลำดับเส้นทางข้อมูล: Input → Processing → Storage → Output → Communication', hw: ['keyboard', 'cpu', 'ssd', 'monitor', 'router'] },
        },
    [restored],
  );

  useEffect(() => {
    if (flow < 0) return;
    if (flow >= CATEGORY_ORDER.length) {
      setRestored(true);
      setFb({ kind: 'correct', text: 'SYSTEM FLOW RESTORED — ข้อมูลเดินทางครบทุกจุด ตั้งแต่รับเข้าจนส่งออกไปยังเครือข่าย' });
      return;
    }
    const t = setTimeout(() => setFlow((f) => f + 1), 900);
    return () => clearTimeout(t);
  }, [flow]);

  const pick = (id: string) => {
    setSel(sel === id ? null : id);
    if (!peeked.includes(id)) setPeeked((p) => [...p, id]);
  };

  const place = (cat: Category) => {
    if (!sel) return;
    const inLane = Object.entries(slots).filter(([, c]) => c === cat).length;
    if (inLane >= 2 && slots[sel] !== cat) {
      setFb({ kind: 'hint', text: `เลน ${CATEGORIES[cat].en} มีครบ 2 ชิ้นแล้ว แตะชิ้นในเลนเพื่อนำออกก่อน` });
      return;
    }
    setSlots((s) => ({ ...s, [sel]: cat }));
    setWrong((w) => w.filter((x) => x !== sel));
    setSel(null);
    setFb(null);
  };

  const unplace = (id: string) => {
    setSlots((s) => {
      const n = { ...s };
      delete n[id];
      return n;
    });
    setWrong((w) => w.filter((x) => x !== id));
  };

  const run = () => {
    const bad = POOL.filter((id) => slots[id] !== HW[id].category);
    setRuns((r) => r + 1);
    if (firstRight === null) setFirstRight(POOL.length - bad.length);
    if (bad.length) {
      setWrong(bad);
      const first = HW[bad[0]];
      setFb({ kind: 'incorrect', text: `DATA ROUTE ERROR — เส้นทางขาดที่ ${bad.length} จุด (กรอบแดง). เช่น ${first.en}: "${first.func}" — มันควรอยู่ช่วงไหนของเส้นทาง?` });
      return;
    }
    setFb(null);
    CATEGORY_ORDER.forEach((cat) =>
      addEvidence({
        id: `m3-${cat}`,
        type: 'category',
        title: `${CATEGORIES[cat].en} · ${CATEGORIES[cat].th}`,
        lines: [CATEGORIES[cat].desc, `ตัวอย่าง: ${POOL.filter((id) => HW[id].category === cat).map((id) => HW[id].en.split(' (')[0]).join(', ')}`],
        mission: 3,
      }),
    );
    setFlow(0);
  };

  if (done) {
    return (
      <MissionComplete
        id={3}
        score={{
          accuracy: clamp(((firstRight ?? 0) / POOL.length) * 80 + (qTries === 1 ? 20 : 8)),
          investigation: clamp((peeked.length / POOL.length) * 100),
          reasoning: clamp(100 - (runs - 1) * 15 - (qTries - 1) * 20),
          independence: independence(hints),
        }}
        learned={
          <>
            <p>Hardware แบ่งได้ <b>5 ประเภท</b> ตามเส้นทางข้อมูล:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              {CATEGORY_ORDER.map((c) => (
                <li key={c}><b>{CATEGORIES[c].en}</b> — {CATEGORIES[c].desc}</li>
              ))}
            </ol>
          </>
        }
      />
    );
  }

  const pool = POOL.filter((id) => !slots[id]);

  return (
    <MissionFrame
      id={3}
      steps={STEPS}
      step={restored ? 3 : flow >= 0 ? 2 : placedCount ? 1 : 0}
      brief={<>เส้นทางข้อมูลของ <b>SERVER ROOM</b> ขาดเป็นช่วง ๆ 🔌 นำอุปกรณ์ไปวางในเลนที่ถูกต้อง (เลนละ 2 ชิ้น) แล้วกด <b>Run Data Flow</b></>}
    >
      {!restored && (
        <Card className="mb-4">
          <p className="mb-2 text-sm font-semibold text-slate-600">อุปกรณ์รอติดตั้ง ({pool.length}) — แตะเพื่อเลือก แล้วแตะเลนปลายทาง</p>
          <div className="flex min-h-12 flex-wrap gap-2">
            {pool.map((id) => (
              <DeviceChip key={id} id={id} selected={sel === id} onClick={() => pick(id)} />
            ))}
            {!pool.length && <span className="text-sm text-slate-400">วางครบแล้ว กด Run Data Flow ได้เลย</span>}
          </div>
          <AnimatePresence>
            {sel && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
                🔎 <b>{HW[sel].en}</b>: {HW[sel].func}
              </motion.p>
            )}
          </AnimatePresence>
        </Card>
      )}

      <div className="relative space-y-0">
        {CATEGORY_ORDER.map((cat, i) => {
          const c = CATEGORIES[cat];
          const inLane = POOL.filter((id) => slots[id] === cat);
          const lit = flow >= i || restored;
          const laneWrong = inLane.some((id) => wrong.includes(id));
          return (
            <div key={cat}>
              <motion.button
                onClick={() => place(cat)}
                disabled={!sel || flow >= 0}
                animate={flow === i ? { scale: [1, 1.02, 1] } : {}}
                className={cx(
                  'flex w-full flex-col gap-3 rounded-3xl p-4 text-left ring-2 transition sm:flex-row sm:items-center',
                  lit ? cx(c.soft, c.ring, 'shadow-lg') : laneWrong ? 'bg-rose-50 ring-rose-300' : 'bg-white ring-slate-100',
                  sel && flow < 0 && 'hover:ring-indigo-400',
                )}
              >
                <div className="flex items-center gap-3 sm:w-56">
                  <span className={cx('grid h-11 w-11 place-items-center rounded-2xl font-display font-bold text-white', c.color)}>{i + 1}</span>
                  <div>
                    <p className={cx('font-display font-bold', c.text)}>{c.en}</p>
                    <p className="text-xs text-slate-500">{c.th}</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  {inLane.map((id) => (
                    <DeviceChip key={id} id={id} wrong={wrong.includes(id)} onClick={(e) => { e.stopPropagation(); if (flow < 0 && !restored) unplace(id); }} />
                  ))}
                  {Array.from({ length: 2 - inLane.length }).map((_, k) => (
                    <span key={k} className="inline-flex h-10 w-28 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-400">ว่าง</span>
                  ))}
                  {lit && <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="text-sm text-slate-600 sm:ml-auto">📄 {STORY[cat]}</motion.span>}
                </div>
              </motion.button>
              {i < CATEGORY_ORDER.length - 1 && (
                <div className="relative flex h-8 justify-center" aria-hidden="true">
                  <div className={cx('w-1 rounded-full', flow > i || restored ? 'bg-gradient-to-b from-indigo-400 to-cyan-400' : 'bg-slate-200')} />
                  {flow === i + 1 && (
                    <motion.span className="absolute h-3.5 w-3.5 rounded-full bg-cyan-400 shadow-[0_0_12px_4px_rgba(34,211,238,0.7)]" initial={{ top: -8 }} animate={{ top: 28 }} transition={{ duration: 0.5 }} />
                  )}
                  <ArrowDown className={cx('absolute bottom-0 h-4 w-4', flow > i || restored ? 'text-cyan-500' : 'text-slate-300')} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        {fb && <Feedback kind={fb.kind} title={fb.kind === 'incorrect' ? 'DATA ROUTE ERROR' : fb.kind === 'correct' ? 'SYSTEM FLOW RESTORED' : undefined}>{fb.text}</Feedback>}
        {!restored && (
          <div className="flex flex-wrap justify-end gap-3">
            <Btn variant="secondary" onClick={() => { setSlots({}); setWrong([]); setFb(null); }} disabled={flow >= 0}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> ล้าง
            </Btn>
            <Btn onClick={run} disabled={pool.length > 0 || flow >= 0}>
              <Play className="h-4 w-4" aria-hidden="true" /> Run Data Flow
            </Btn>
          </div>
        )}
        {restored && (
          <div className="mx-auto max-w-2xl space-y-4 pt-2">
            <Quiz
              title="อธิบายเส้นทาง: ทำไม Router จัดเป็น Communication ไม่ใช่ Output?"
              choices={[
                'เพราะ Router มีไฟสถานะกะพริบ',
                'เพราะ Router ส่ง-รับข้อมูลระหว่างคอมพิวเตอร์กับเครือข่าย ไม่ได้แสดงผลให้ผู้ใช้โดยตรง',
                'เพราะ Router มีราคาแพงกว่าจอภาพ',
                'เพราะ Router ประมวลผลแทน CPU',
              ]}
              answer={1}
              value={q}
              onPick={(i) => { setQ(i); setQTries((t) => t + 1); }}
              wrongFb={['ไฟสถานะเป็นแค่ตัวบอกสถานะ ไม่ใช่หน้าที่หลัก', '', 'ราคาไม่ได้ใช้แบ่งประเภท Hardware', 'Router ไม่ได้ประมวลผลงานของผู้ใช้แทน CPU']}
              rightFb="ถูกต้อง! แบ่งประเภทตาม 'หน้าที่ในเส้นทางข้อมูล'"
            />
            {q === 1 && (
              <div className="flex justify-end">
                <Btn variant="success" onClick={() => setDone(true)}>ปิดภารกิจ <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>
              </div>
            )}
          </div>
        )}
      </div>
    </MissionFrame>
  );
}

function DeviceChip({ id, selected, wrong, onClick }: { id: string; selected?: boolean; wrong?: boolean; onClick: (e: React.MouseEvent) => void }) {
  const h = HW[id];
  return (
    <motion.span
      layout
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick(e as unknown as React.MouseEvent)}
      className={cx(
        'inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold shadow-sm ring-2',
        selected ? 'ring-indigo-500' : wrong ? 'ring-rose-400' : 'ring-slate-200',
      )}
    >
      <Ico name={h.icon} className="h-4 w-4 text-slate-500" />
      {h.en.split(' (')[0]}
      {wrong && <span className="text-rose-500" aria-label="อยู่ผิดเลน">✕</span>}
    </motion.span>
  );
}

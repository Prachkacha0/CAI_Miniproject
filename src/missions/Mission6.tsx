import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BadgeCheck, Gauge, Target, Wallet } from 'lucide-react';
import { useStore } from '../store';
import { Bar, Btn, Card, Feedback, cx, type FeedbackKind } from '../components/ui';
import { Ico } from '../components/icons';
import { useBuddyTopic } from '../components/Buddy';
import { MissionComplete, MissionFrame, clamp, independence } from './common';
import { useMissionHints } from './useMissionHints';

type Slot = 'cpu' | 'ram' | 'gpu' | 'storage' | 'monitor' | 'keyboard' | 'mouse';

interface Opt { name: string; price: number; perf: number; note: string }

// Illustrative prices for learning only.
export const PARTS: Record<Slot, { label: string; icon: string; opts: Opt[] }> = {
  cpu: { label: 'CPU', icon: 'cpu', opts: [
    { name: '4-Core 3.6 GHz', price: 3000, perf: 2, note: 'งานเอกสาร เว็บ' },
    { name: '6-Core 4.2 GHz', price: 6500, perf: 3, note: 'งานทั่วไปถึงงานกลาง' },
    { name: '8-Core 4.8 GHz', price: 11000, perf: 4, note: 'ตัดต่อ เรนเดอร์' },
    { name: '12-Core 5.2 GHz', price: 17000, perf: 5, note: 'งานหนักระดับมืออาชีพ' },
  ] },
  ram: { label: 'RAM', icon: 'memory', opts: [
    { name: '8 GB', price: 900, perf: 1, note: 'เปิดโปรแกรมไม่กี่ตัว' },
    { name: '16 GB', price: 1700, perf: 3, note: 'ทำงานหลายโปรแกรมพร้อมกัน' },
    { name: '32 GB', price: 3300, perf: 4, note: 'ตัดต่อวิดีโอ Motion Graphic' },
    { name: '64 GB', price: 6500, perf: 5, note: 'งานเฉพาะทางขนาดใหญ่มาก' },
  ] },
  gpu: { label: 'GPU', icon: 'gpu', opts: [
    { name: 'Integrated (ในตัว CPU)', price: 0, perf: 1, note: 'แสดงผลทั่วไป' },
    { name: 'Entry 4 GB', price: 4500, perf: 2, note: 'กราฟิกเบา ๆ' },
    { name: 'Mid 8 GB', price: 9500, perf: 4, note: 'ตัดต่อ 4K, Motion Graphic' },
    { name: 'High 16 GB', price: 19000, perf: 5, note: '3D ระดับสูง, AI' },
  ] },
  storage: { label: 'Storage', icon: 'harddrive', opts: [
    { name: 'HDD 1 TB', price: 1300, perf: 1, note: 'จุเยอะ แต่ช้า' },
    { name: 'SSD 512 GB', price: 1500, perf: 3, note: 'เร็ว เปิดเครื่องไว' },
    { name: 'NVMe SSD 1 TB', price: 2600, perf: 4, note: 'เร็วมาก จุไฟล์วิดีโอได้' },
    { name: 'NVMe SSD 2 TB', price: 4800, perf: 5, note: 'เร็วมาก จุมาก' },
  ] },
  monitor: { label: 'Monitor', icon: 'monitor', opts: [
    { name: '22" Full HD', price: 2500, perf: 2, note: 'งานทั่วไป' },
    { name: '24" Full HD IPS สีแม่นยำ', price: 4200, perf: 4, note: 'งานภาพ/วิดีโอ' },
    { name: '27" 4K IPS', price: 9900, perf: 5, note: 'ละเอียดสูงมาก' },
  ] },
  keyboard: { label: 'Keyboard', icon: 'keyboard', opts: [
    { name: 'Basic USB', price: 250, perf: 2, note: 'พิมพ์งานทั่วไป' },
    { name: 'Mechanical RGB', price: 2200, perf: 3, note: 'สวย ทนทาน' },
  ] },
  mouse: { label: 'Mouse', icon: 'mouse', opts: [
    { name: 'Basic USB', price: 190, perf: 2, note: 'ใช้งานทั่วไป' },
    { name: 'Precision Ergonomic', price: 990, perf: 4, note: 'แม่นยำ ใช้นานไม่เมื่อย' },
  ] },
};

const SLOTS = Object.keys(PARTS) as Slot[];
const BASE = 3500; // case + PSU + mainboard

interface Client {
  id: string;
  name: string;
  role: string;
  avatar: string;
  budget: number;
  req: string[];
  need: Record<Slot, number>; // minimum perf needed
  weight: Record<Slot, number>;
  critical: Slot[];
}

const CLIENTS: Client[] = [
  {
    id: 'video', name: 'คุณมายด์', role: 'Video Creator', avatar: '🎬', budget: 35000,
    req: ['Video Editing', 'Motion Graphic', 'Regular Use', 'Budget 35,000 THB'],
    need: { cpu: 3, ram: 4, gpu: 4, storage: 4, monitor: 4, keyboard: 2, mouse: 2 },
    weight: { cpu: 3, ram: 3, gpu: 3, storage: 2, monitor: 2, keyboard: 0.5, mouse: 0.5 },
    critical: ['gpu', 'ram', 'storage', 'monitor'],
  },
  {
    id: 'office', name: 'พี่นก', role: 'เจ้าหน้าที่ธุรการโรงเรียน', avatar: '🗂️', budget: 15000,
    req: ['พิมพ์เอกสาร / Excel', 'อีเมลและเว็บ', 'ใช้ทั้งวัน', 'Budget 15,000 THB'],
    need: { cpu: 2, ram: 3, gpu: 1, storage: 3, monitor: 2, keyboard: 2, mouse: 2 },
    weight: { cpu: 2, ram: 2, gpu: 0.5, storage: 2, monitor: 1, keyboard: 1, mouse: 1 },
    critical: ['ram', 'storage'],
  },
];

const REASONS = ['ตรงกับลักษณะงานของลูกค้า', 'อยู่ในงบประมาณ', 'ไม่ซื้อสเปกเกินความจำเป็น', 'เลือกชิ้นที่แพงที่สุดไว้ก่อน', 'ให้ความสำคัญกับอุปกรณ์หลักของงาน', 'เลือกเพราะหน้าตาสวย'];
const GOOD_REASONS = [0, 1, 2, 4];

export function evaluate(c: Client, pick: Record<Slot, number>) {
  const total = BASE + SLOTS.reduce((a, s) => a + PARTS[s].opts[pick[s]].price, 0);
  const wSum = SLOTS.reduce((a, s) => a + c.weight[s], 0);
  const performance = clamp((SLOTS.reduce((a, s) => a + (PARTS[s].opts[pick[s]].perf / 5) * c.weight[s], 0) / wSum) * 100);
  const under = SLOTS.filter((s) => PARTS[s].opts[pick[s]].perf < c.need[s]);
  const overkill = SLOTS.filter((s) => PARTS[s].opts[pick[s]].perf - c.need[s] >= 2 && PARTS[s].opts[pick[s]].price >= 2000);
  const meet = SLOTS.reduce((a, s) => a + Math.min(1, PARTS[s].opts[pick[s]].perf / c.need[s]) * c.weight[s], 0) / wSum;
  const suitability = clamp(meet * 100 - overkill.length * 8 - under.filter((s) => c.critical.includes(s)).length * 10);
  const inBudget = total <= c.budget;
  const fit = inBudget && under.filter((s) => c.critical.includes(s)).length === 0 && suitability >= 75;
  return { total, performance, suitability, under, overkill, inBudget, fit };
}

const STEPS = ['Read Requirement', 'Select Hardware', 'Check Trade-off', 'Explain My Decision'];

export function Mission6() {
  const { addEvidence } = useStore();
  const hints = useMissionHints(6);
  const [ci, setCi] = useState(0);
  const [pick, setPick] = useState<Record<Slot, number>>(() => Object.fromEntries(SLOTS.map((s) => [s, 0])) as Record<Slot, number>);
  const [phase, setPhase] = useState<'build' | 'explain' | 'done'>('build');
  const [fb, setFb] = useState<{ kind: FeedbackKind; text: string } | null>(null);
  const [submits, setSubmits] = useState(0);
  const [firstFit, setFirstFit] = useState<boolean[]>([]);
  const [reasons, setReasons] = useState<number[]>([]);
  const [text, setText] = useState('');
  const [reasonScores, setReasonScores] = useState<number[]>([]);
  const [touched, setTouched] = useState<Slot[]>([]);
  const c = CLIENTS[ci];
  const ev = useMemo(() => evaluate(c, pick), [c, pick]);

  useBuddyTopic(
    phase === 'build'
      ? {
          scope: 6,
          hint: `งานหลักของ${c.name}คืออะไร? อุปกรณ์ชิ้นไหนทำงานนั้นโดยตรง — ใส่งบไปที่ชิ้นนั้นก่อน`,
          evidence: [`งบ ${c.budget.toLocaleString()} บาท (รวมเคส/PSU/เมนบอร์ด ${BASE.toLocaleString()} บาทแล้ว)`, 'Mission 04: งานวิดีโอทำให้ GPU 99% · เปิดหลายโปรแกรมทำให้ RAM 96%', 'Mission 04: HDD → SSD ทำให้เปิดเครื่องเร็วขึ้น'],
          lesson: { text: 'เลือก Hardware ให้เหมาะกับงาน = สมดุลของ Performance · Budget · Suitability ไม่ใช่ซื้อแพงสุด', hw: ['gpu', 'ram', 'ssd'] },
        }
      : {
          scope: 6,
          hint: 'เล่าเหตุผลเหมือนอธิบายให้ลูกค้าฟัง: เลือกอะไร เพราะงานของเขาต้องการอะไร และทำไมอยู่ในงบ',
          evidence: [`Performance ${ev.performance} · Suitability ${ev.suitability} · ราคา ${ev.total.toLocaleString()} บาท`],
          lesson: { text: 'เหตุผลที่ดีเชื่อม "ความต้องการ" → "หน้าที่ของ Hardware" → "ตัวเลือกที่พอดีงบ"' },
        },
    [phase, ci],
  );

  const choose = (s: Slot, i: number) => {
    setPick((p) => ({ ...p, [s]: i }));
    if (!touched.includes(s)) setTouched((t) => [...t, s]);
    setFb(null);
  };

  const submit = () => {
    setSubmits((n) => n + 1);
    if (firstFit.length === ci) setFirstFit((f) => [...f, ev.fit]);
    if (ev.fit) {
      setFb({ kind: 'correct', text: `${c.name}พอใจกับสเปกนี้! ต่อไปอธิบายเหตุผลการเลือกของคุณ` });
      setTimeout(() => { setFb(null); setPhase('explain'); }, 900);
      return;
    }
    const parts: string[] = [];
    if (!ev.inBudget) parts.push(`เกินงบ ${(ev.total - c.budget).toLocaleString()} บาท — ชิ้นไหนที่ลดได้โดยไม่กระทบงานหลัก?`);
    const crit = ev.under.filter((s) => c.critical.includes(s));
    if (crit.length) parts.push(`${crit.map((s) => PARTS[s].label).join(', ')} ยังไม่พอสำหรับงานของลูกค้า`);
    if (ev.overkill.length) parts.push(`${ev.overkill.map((s) => PARTS[s].label).join(', ')} แรงเกินความจำเป็น`);
    setFb({ kind: ev.inBudget ? 'investigate' : 'incorrect', text: parts.join(' · ') || 'ความเหมาะสมยังต่ำ ลองดูความต้องการของลูกค้าอีกครั้ง' });
  };

  const finishClient = () => {
    const good = reasons.filter((r) => GOOD_REASONS.includes(r)).length;
    const bad = reasons.length - good;
    const mentions = c.critical.filter((s) => text.toLowerCase().includes(PARTS[s].label.toLowerCase()) || (s === 'storage' && /ssd|storage|เก็บ/i.test(text))).length;
    const score = clamp(good * 15 + mentions * 10 + Math.min(text.trim().length, 120) / 4 - bad * 15);
    setReasonScores((r) => [...r, score]);
    addEvidence({
      id: `m6-${c.id}`,
      type: 'case',
      title: `Client: ${c.name} (${c.role})`,
      lines: [
        ...SLOTS.slice(0, 5).map((s) => `${PARTS[s].label}: ${PARTS[s].opts[pick[s]].name}`),
        `ราคา ${ev.total.toLocaleString()} / ${c.budget.toLocaleString()} บาท`,
        `เหตุผล: ${text.trim().slice(0, 140)}`,
      ],
      mission: 6,
    });
    setReasons([]);
    setText('');
    if (ci < CLIENTS.length - 1) {
      setCi(ci + 1);
      setPick(Object.fromEntries(SLOTS.map((s) => [s, 0])) as Record<Slot, number>);
      setTouched([]);
      setPhase('build');
    } else setPhase('done');
  };

  if (phase === 'done') {
    const allFirst = firstFit.every(Boolean);
    return (
      <MissionComplete
        id={6}
        meta={{ allFit: true, firstTry: allFirst }}
        score={{
          accuracy: clamp((firstFit.filter(Boolean).length / CLIENTS.length) * 60 + 40 - (submits - CLIENTS.length) * 5),
          investigation: clamp(60 + touched.length * 6),
          reasoning: clamp(reasonScores.reduce((a, b) => a + b, 0) / reasonScores.length),
          independence: independence(hints),
        }}
        learned={
          <>
            <p>การเลือก Hardware ให้เหมาะกับงานต้องชั่งน้ำหนัก 3 ด้าน:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><b>Performance</b> — แรงพอสำหรับงานหลักไหม</li>
              <li><b>Budget</b> — อยู่ในงบไหม</li>
              <li><b>Suitability</b> — ตรงกับงานจริง ไม่ขาดและไม่เกินความจำเป็น</li>
            </ul>
            <p className="mt-2">งานวิดีโอเน้น GPU/RAM/SSD/จอสีแม่นยำ ส่วนงานเอกสารเน้น RAM พอเพียง + SSD ในงบที่ประหยัด</p>
          </>
        }
      />
    );
  }

  const pctBudget = (ev.total / c.budget) * 100;

  return (
    <MissionFrame
      id={6}
      steps={STEPS}
      step={phase === 'explain' ? 3 : touched.length === 0 ? 0 : fb ? 2 : 1}
      brief={<>ลูกค้า <b>{ci + 1}/{CLIENTS.length}</b> เดินเข้าร้าน 🛒 อ่านความต้องการ จัดสเปกให้เหมาะ แล้วอธิบายเหตุผลให้ลูกค้าเข้าใจ <span className="text-slate-400">(ราคาในเกมเป็นราคาสมมติ)</span></>}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-100 to-cyan-100 text-3xl" aria-hidden="true">{c.avatar}</div>
            <div className="flex-1">
              <p className="text-xs font-bold tracking-widest text-indigo-500">CLIENT</p>
              <p className="font-display text-lg font-bold">{c.name} · {c.role}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.req.map((r) => <span key={r} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">✓ {r}</span>)}
              </div>
            </div>
          </Card>

          {phase === 'build' ? (
            <div className="space-y-3">
              {SLOTS.map((s) => (
                <Card key={s} className="p-4">
                  <p className="mb-2 flex items-center gap-2 font-bold text-slate-800"><Ico name={PARTS[s].icon} className="h-4 w-4 text-indigo-500" /> {PARTS[s].label}</p>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label={PARTS[s].label}>
                    {PARTS[s].opts.map((o, i) => (
                      <button
                        key={o.name}
                        role="radio"
                        aria-checked={pick[s] === i}
                        onClick={() => choose(s, i)}
                        className={cx('rounded-2xl p-3 text-left ring-2 transition', pick[s] === i ? 'bg-indigo-50 ring-indigo-500' : 'bg-slate-50 ring-transparent hover:ring-slate-200')}
                      >
                        <span className="block text-sm font-bold text-slate-900">{o.name}</span>
                        <span className="block text-xs text-slate-500">{o.note}</span>
                        <span className="mt-1.5 flex items-center justify-between text-xs">
                          <span className="font-semibold tabular-nums text-slate-700">฿{o.price.toLocaleString()}</span>
                          <span className="text-amber-500" aria-label={`ประสิทธิภาพ ${o.perf} จาก 5`}>{'★'.repeat(o.perf)}<span className="text-slate-300">{'★'.repeat(5 - o.perf)}</span></span>
                        </span>
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <p className="font-display text-lg font-bold">Explain My Decision · อธิบายการตัดสินใจ</p>
              <p className="mt-1 text-sm text-slate-600">เลือกเหตุผลที่ใช้จริง (อย่างน้อย 2 ข้อ) แล้วเขียนอธิบายสั้น ๆ ถึง{c.name}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {REASONS.map((r, i) => (
                  <button key={r} onClick={() => setReasons((x) => (x.includes(i) ? x.filter((y) => y !== i) : [...x, i]))} aria-pressed={reasons.includes(i)} className={cx('rounded-full px-3 py-1.5 text-sm font-semibold ring-1', reasons.includes(i) ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50')}>
                    {reasons.includes(i) ? '✓ ' : ''}{r}
                  </button>
                ))}
              </div>
              <label className="mt-4 block">
                <span className="text-sm font-semibold text-slate-700">เหตุผลของฉัน</span>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="mt-1 w-full rounded-2xl bg-slate-50 p-3 outline-none ring-2 ring-slate-200 focus:ring-indigo-400" placeholder={c.id === 'video' ? 'เช่น เลือก GPU Mid 8 GB เพราะงาน Motion Graphic ใช้การประมวลผลภาพมาก...' : 'เช่น เลือก RAM 16 GB และ SSD เพราะเปิดเอกสารหลายไฟล์ทั้งวัน...'} />
                <span className="text-xs text-slate-400 tabular-nums">{text.trim().length}/30 ตัวอักษรขั้นต่ำ</span>
              </label>
              {reasons.some((r) => !GOOD_REASONS.includes(r)) && <Feedback kind="hint" className="mt-3">เหตุผลบางข้อที่เลือกอาจไม่ใช่หลักการเลือก Hardware ที่ดี ลองทบทวนดูอีกครั้ง</Feedback>}
              <div className="mt-4 flex justify-end">
                <Btn variant="success" disabled={reasons.length < 2 || text.trim().length < 30} onClick={finishClient}>
                  ส่งมอบงาน <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Btn>
              </div>
            </Card>
          )}
        </div>

        {/* Trade-off panel */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <p className="font-display text-lg font-bold">Trade-off</p>
            <div className="mt-3 space-y-4">
              <Meter icon={<Gauge className="h-4 w-4" aria-hidden="true" />} label="Performance" value={ev.performance} text={`${ev.performance}`} color="bg-gradient-to-r from-indigo-500 to-violet-500" />
              <Meter icon={<Wallet className="h-4 w-4" aria-hidden="true" />} label="Budget" value={pctBudget} text={`฿${ev.total.toLocaleString()} / ${c.budget.toLocaleString()}`} color={ev.inBudget ? 'bg-emerald-500' : 'bg-rose-500'} warn={!ev.inBudget ? 'เกินงบ' : undefined} />
              <Meter icon={<Target className="h-4 w-4" aria-hidden="true" />} label="Suitability" value={ev.suitability} text={`${ev.suitability}`} color="bg-gradient-to-r from-amber-400 to-orange-500" />
            </div>
            <p className="mt-3 text-xs text-slate-400">รวมเคส + PSU + เมนบอร์ด ฿{BASE.toLocaleString()} แล้ว</p>
            {ev.under.length > 0 && <p className="mt-2 text-xs text-amber-700">⚠ ต่ำกว่าความต้องการ: {ev.under.map((s) => PARTS[s].label).join(', ')}</p>}
            {ev.overkill.length > 0 && <p className="mt-1 text-xs text-sky-700">ℹ เกินความจำเป็น: {ev.overkill.map((s) => PARTS[s].label).join(', ')}</p>}
            {phase === 'build' && (
              <Btn className="mt-4 w-full" onClick={submit}>
                <BadgeCheck className="h-4 w-4" aria-hidden="true" /> เสนอสเปกให้ลูกค้า
              </Btn>
            )}
          </Card>
          {fb && <motion.div className="mt-3"><Feedback kind={fb.kind}>{fb.text}</Feedback></motion.div>}
        </div>
      </div>
    </MissionFrame>
  );
}

function Meter({ icon, label, value, text, color, warn }: { icon: React.ReactNode; label: string; value: number; text: string; color: string; warn?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-semibold text-slate-700">{icon} {label}</span>
        <span className={cx('font-bold tabular-nums', warn ? 'text-rose-600' : 'text-slate-900')}>{warn ? `⚠ ${warn} · ` : ''}{text}</span>
      </div>
      <Bar value={value} color={color} label={label} />
    </div>
  );
}

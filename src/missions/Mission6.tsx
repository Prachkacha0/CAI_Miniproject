import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BadgeCheck, Gauge, Target, Wallet } from 'lucide-react';
import { useStore } from '../store';
import { Bar, Btn, Card, Feedback, cx, type FeedbackKind } from '../components/ui';
import { Ico } from '../components/icons';
import { useBuddyTopic } from '../components/Buddy';
import { MissionComplete, MissionFrame, clamp, independence } from './common';
import { useMissionHints } from './useMissionHints';
import { CATEGORY_LABELS, PARTS as BUILD_PARTS, SCENARIOS, checkBuild, type PartCategory, type PcPart } from '../game/pcBuilder';

type Slot = PartCategory;

interface Opt { id: string; name: string; price: number; perf: number; note: string }

const SLOT_DEFS: Record<Slot, { icon: string; opts: [string, number, string][] }> = {
  case: { icon: 'server', opts: [['case-pulse', 3, 'mATX · พื้นที่กะทัดรัด'], ['case-forge', 4, 'ATX/mATX · ตะแกรงลม'], ['case-aurora', 5, 'ATX/mATX · พื้นที่กว้าง']] },
  motherboard: { icon: 'circuit', opts: [['mb-breeze', 4, 'AM5 · DDR5 · mATX'], ['mb-prime', 5, 'LGA1700 · DDR5 · ATX'], ['mb-legacy', 3, 'LGA1700 · DDR4 · mATX']] },
  cpu: { icon: 'cpu', opts: [['cpu-r5', 3, '6 คอร์ · งานทั่วไป/เกม'], ['cpu-i5', 4, 'หลายคอร์ · งานสร้างสรรค์'], ['cpu-r7', 5, 'เกมแข่งขัน/งานหนัก']] },
  ram: { icon: 'memory', opts: [['ram-ddr5-16', 3, '16GB · เปิดหลายโปรแกรม'], ['ram-ddr5-32', 4, '32GB · เกม/งานสร้างสรรค์'], ['ram-ddr5-64', 5, '64GB · โปรเจกต์ขนาดใหญ่'], ['ram-ddr4-32', 3, '32GB · DDR4 ประหยัดงบ']] },
  gpu: { icon: 'gpu', opts: [['gpu-spark', 3, '8GB · เกม 1080p'], ['gpu-arc', 4, '8GB · งานภาพและเฟรมเสริม'], ['gpu-ray', 5, '12GB · เรนเดอร์/แข่งขัน']] },
  storage: { icon: 'harddrive', opts: [['ssd-1', 3, 'NVMe Gen4 · 1TB'], ['ssd-2', 4, 'NVMe Gen4 · 2TB'], ['ssd-4', 5, 'NVMe Gen4 PRO · 4TB']] },
  psu: { icon: 'zap', opts: [['psu-550', 3, '550W · 80+ Bronze'], ['psu-750', 4, '750W · 80+ Gold'], ['psu-850', 5, '850W · Modular']] },
  cooler: { icon: 'circuit', opts: [['cool-air', 3, 'ฮีตซิงก์ลม · 150W'], ['cool-tower', 4, 'ฮีตซิงก์คู่ · 220W'], ['cool-liquid', 5, 'ชุดน้ำปิด AIO · 280W']] },
};

export const PARTS: Record<Slot, { label: string; icon: string; opts: Opt[] }> = Object.fromEntries(
  Object.entries(SLOT_DEFS).map(([category, def]) => [category, {
    label: CATEGORY_LABELS[category as Slot].th,
    icon: def.icon,
    opts: def.opts.map(([id, perf, note]) => {
      const part = BUILD_PARTS.find((item) => item.id === id)!;
      return { id, name: part.name, price: part.price, perf, note };
    }),
  }]),
) as Record<Slot, { label: string; icon: string; opts: Opt[] }>;

const SLOTS: Slot[] = ['case', 'motherboard', 'cpu', 'ram', 'gpu', 'storage', 'psu', 'cooler'];
const SCENARIO_ID: Record<string, string> = { video: 'creator-studio', office: 'starter-stream', student: 'starter-stream' };

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
    id: 'video', name: 'คุณมายด์', role: 'Video Creator', avatar: '🎬', budget: 51000,
    req: ['ตัดต่อ 4K / Motion Graphic', 'RAM และ SSD ต้องพอ', 'ชุดระบายความร้อนรองรับงานหนัก', 'งบ 51,000 บาท'],
    need: { case: 3, motherboard: 3, cpu: 4, ram: 4, gpu: 4, storage: 4, psu: 4, cooler: 3 },
    weight: { case: 0.5, motherboard: 0.5, cpu: 2, ram: 2, gpu: 3, storage: 2, psu: 1, cooler: 1 },
    critical: ['gpu', 'ram', 'storage', 'cooler'],
  },
  {
    id: 'office', name: 'พี่นก', role: 'เจ้าหน้าที่ธุรการโรงเรียน', avatar: '🗂️', budget: 33000,
    req: ['งานเอกสารและ Excel', 'เปิดเว็บหลายแท็บทั้งวัน', 'เน้นเสถียร ประหยัด และดูแลง่าย', 'งบ 33,000 บาท'],
    need: { case: 2, motherboard: 2, cpu: 2, ram: 3, gpu: 2, storage: 3, psu: 3, cooler: 2 },
    weight: { case: 0.5, motherboard: 0.5, cpu: 2, ram: 2, gpu: 0.5, storage: 2, psu: 1, cooler: 0.5 },
    critical: ['ram', 'storage'],
  },
  {
    id: 'student', name: 'น้องฟ้า', role: 'นักเรียนเรียนออนไลน์และเขียนโค้ด', avatar: '🎓', budget: 33000,
    req: ['เรียนออนไลน์ เปิดหลายแท็บ', 'ทำรายงานและเขียนโปรแกรม', 'เครื่องตอบสนองไว อัปเกรดได้', 'งบ 33,000 บาท'],
    need: { case: 2, motherboard: 2, cpu: 3, ram: 3, gpu: 2, storage: 3, psu: 3, cooler: 2 },
    weight: { case: 0.5, motherboard: 1, cpu: 2, ram: 3, gpu: 0.5, storage: 2, psu: 0.5, cooler: 0.5 },
    critical: ['ram', 'storage'],
  },
];

function shuffleClients(clients: Client[]) {
  const shuffled = [...clients];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

const REASONS = ['ตรงกับลักษณะงานของลูกค้า', 'อยู่ในงบประมาณ', 'ไม่ซื้อสเปกเกินความจำเป็น', 'เลือกชิ้นที่แพงที่สุดไว้ก่อน', 'ให้ความสำคัญกับอุปกรณ์หลักของงาน', 'เลือกเพราะหน้าตาสวย'];
const GOOD_REASONS = [0, 1, 2, 4];

export function evaluate(c: Client, pick: Record<Slot, number>) {
  const total = SLOTS.reduce((a, s) => a + PARTS[s].opts[pick[s]].price, 0);
  const wSum = SLOTS.reduce((a, s) => a + c.weight[s], 0);
  const performance = clamp((SLOTS.reduce((a, s) => a + (PARTS[s].opts[pick[s]].perf / 5) * c.weight[s], 0) / wSum) * 100);
  const under = SLOTS.filter((s) => PARTS[s].opts[pick[s]].perf < c.need[s]);
  const overkill = SLOTS.filter((s) => PARTS[s].opts[pick[s]].perf - c.need[s] >= 2 && PARTS[s].opts[pick[s]].price >= 2000);
  const meet = SLOTS.reduce((a, s) => a + Math.min(1, PARTS[s].opts[pick[s]].perf / c.need[s]) * c.weight[s], 0) / wSum;
  const suitability = clamp(meet * 100 - overkill.length * 8 - under.filter((s) => c.critical.includes(s)).length * 10);
  const scenario = SCENARIOS.find((item) => item.id === SCENARIO_ID[c.id])!;
  const build = Object.fromEntries(SLOTS.map((slot) => [slot, BUILD_PARTS.find((part) => part.id === PARTS[slot].opts[pick[slot]].id)])) as Record<Slot, PcPart>;
  const compatibility = checkBuild(build, scenario).filter((issue) => issue.severity === 'block');
  const inBudget = total <= c.budget;
  const fit = inBudget && compatibility.length === 0 && under.filter((s) => c.critical.includes(s)).length === 0 && suitability >= 75;
  return { total, performance, suitability, under, overkill, inBudget, fit, compatibility, scenarioId: scenario.id };
}

const STEPS = ['Read Requirement', 'Select Hardware', 'Check Trade-off', 'Explain My Decision'];

export function Mission6() {
  const { addEvidence, saveAssemblyOrder } = useStore();
  const hints = useMissionHints(6);
  const [clientQueue] = useState(() => shuffleClients(CLIENTS));
  const [clientOrders, setClientOrders] = useState<{ customerName: string; role: string; scenarioId: string; partIds: Record<Slot, string> }[]>([]);
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
  const c = clientQueue[ci];
  const ev = useMemo(() => evaluate(c, pick), [c, pick]);

  useBuddyTopic(
    phase === 'build'
      ? {
          scope: 6,
          hint: `งานหลักของ${c.name}คืออะไร? อุปกรณ์ชิ้นไหนทำงานนั้นโดยตรง — ใส่งบไปที่ชิ้นนั้นก่อน`,
          evidence: [`งบรวมทั้งเครื่อง ${c.budget.toLocaleString()} บาท`, 'Mission 04: งานวิดีโอทำให้ GPU 99% · เปิดหลายโปรแกรมทำให้ RAM 96%', 'Mission 04: HDD → SSD ทำให้เปิดเครื่องเร็วขึ้น'],
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
    if (ev.compatibility.length) parts.push(...ev.compatibility.map((issue) => issue.title + ' — ' + issue.detail));
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
        ...SLOTS.map((s) => `${PARTS[s].label}: ${PARTS[s].opts[pick[s]].name}`),
        `ราคา ${ev.total.toLocaleString()} / ${c.budget.toLocaleString()} บาท`,
        `เหตุผล: ${text.trim().slice(0, 140)}`,
      ],
      mission: 6,
    });
    const nextOrders = [...clientOrders, {
      customerName: c.name,
      role: c.role,
      scenarioId: ev.scenarioId,
      partIds: Object.fromEntries(SLOTS.map((slot) => [slot, PARTS[slot].opts[pick[slot]].id])) as Record<Slot, string>,
    }];
    setClientOrders(nextOrders);
    setReasons([]);
    setText('');
    if (ci < CLIENTS.length - 1) {
      setCi(ci + 1);
      setPick(Object.fromEntries(SLOTS.map((s) => [s, 0])) as Record<Slot, number>);
      setTouched([]);
      setPhase('build');
    } else {
      const order = nextOrders[Math.floor(Math.random() * nextOrders.length)];
      saveAssemblyOrder({ ...order, id: `m6-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` });
      setPhase('done');
    }
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
            <p className="mt-2">งานวิดีโอเน้น GPU/RAM/SSD และการระบายความร้อน ส่วนงานเอกสารเน้น RAM พอเพียง + SSD ในงบที่ประหยัด</p>
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
      brief={<>งานลูกค้าแบบสุ่ม <b>{ci + 1}/{CLIENTS.length}</b> อ่านความต้องการ เลือกอะไหล่จริงให้เหมาะกับงานและงบ แล้วส่งสเปกนี้ต่อไปยังด่านประกอบคอม</>}
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
            <p className="mt-3 text-xs text-slate-400">ราคาจริงตามรายการอะไหล่ในคลัง · สเปกที่ผ่านจะถูกส่งต่อไปโต๊ะประกอบ</p>
            {ev.compatibility.length > 0 && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><b>สเปกยังประกอบจริงไม่ได้</b><ul className="mt-1 list-disc space-y-1 pl-4">{ev.compatibility.map((issue) => <li key={issue.id}>{issue.title}</li>)}</ul></div>}
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

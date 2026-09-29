import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Activity, ArrowRight, FlaskConical, Monitor as MonitorIcon, ScanSearch } from 'lucide-react';
import { useStore } from '../store';
import { HW } from '../data/hardware';
import { Bar, Btn, Card, Feedback, cx, type FeedbackKind } from '../components/ui';
import { Ico } from '../components/icons';
import { useBuddyTopic } from '../components/Buddy';
import { MissionComplete, MissionFrame, clamp, independence } from './common';
import { useMissionHints } from './useMissionHints';

type Suspect = 'cpu' | 'ram' | 'gpu' | 'storage';

interface Meter { key: Suspect; label: string; value: number; after: number; unit: string; text?: string; textAfter?: string }

interface Case {
  ws: string;
  symptom: string;
  story: string;
  meters: Meter[];
  suspect: Suspect;
  actions: { t: string; ok: boolean; why: string }[];
  learn: string;
  evidence: string[];
}

const CASES: Case[] = [
  {
    ws: 'WORKSTATION #07', symptom: 'System Slow', story: 'ผู้ใช้เปิด Browser 25 แท็บ + Word + Excel + โปรแกรมแชท พร้อมกัน แล้วเครื่องช้าลงมาก',
    meters: [
      { key: 'cpu', label: 'CPU', value: 38, after: 35, unit: '%' },
      { key: 'ram', label: 'RAM', value: 96, after: 58, unit: '%' },
      { key: 'gpu', label: 'GPU', value: 21, after: 20, unit: '%' },
      { key: 'storage', label: 'Storage', value: 0, after: 0, unit: '', text: 'NORMAL', textAfter: 'NORMAL' },
    ],
    suspect: 'ram',
    actions: [
      { t: 'เพิ่ม RAM จาก 8 GB เป็น 16 GB / ปิดโปรแกรมที่ไม่ใช้', ok: true, why: 'RAM เป็นที่พักข้อมูลของโปรแกรมที่เปิดอยู่ เมื่อมีพื้นที่พอ เครื่องจึงไม่ต้องสลับข้อมูลไปมา' },
      { t: 'เปลี่ยน CPU รุ่นใหม่', ok: false, why: 'CPU ใช้งานเพียง 38% ยังเหลือกำลังอีกมาก ปัญหาไม่ได้อยู่ที่การประมวลผล' },
      { t: 'เปลี่ยนการ์ดจอ', ok: false, why: 'GPU ใช้งานเพียง 21% งานนี้ไม่ได้ใช้กราฟิกหนัก' },
    ],
    learn: 'RAM พักข้อมูลของโปรแกรมที่กำลังทำงาน ถ้าเปิดหลายโปรแกรมจน RAM เต็ม เครื่องจะช้า',
    evidence: ['RAM Usage: 96%', 'Function: Temporary Memory', 'Case: Multiple Programs', 'Decision: Check RAM'],
  },
  {
    ws: 'WORKSTATION #12', symptom: 'Video Lag', story: 'ครูตัดต่อวิดีโอ 4K ใส่ Effect 3D ภาพกระตุกตอน Preview แต่เปิดเอกสารได้ปกติ',
    meters: [
      { key: 'cpu', label: 'CPU', value: 46, after: 44, unit: '%' },
      { key: 'ram', label: 'RAM', value: 55, after: 55, unit: '%' },
      { key: 'gpu', label: 'GPU', value: 99, after: 62, unit: '%' },
      { key: 'storage', label: 'Storage', value: 0, after: 0, unit: '', text: 'NORMAL', textAfter: 'NORMAL' },
    ],
    suspect: 'gpu',
    actions: [
      { t: 'อัปเกรด GPU ให้แรงขึ้น', ok: true, why: 'งาน Effect และ Preview วิดีโอใช้การประมวลผลกราฟิก GPU ที่แรงขึ้นช่วยแบ่งเบาภาระได้ตรงจุด' },
      { t: 'เพิ่มลำโพง', ok: false, why: 'ลำโพงเป็น Output เสียง ไม่เกี่ยวกับภาพกระตุก' },
      { t: 'เพิ่ม RAM', ok: false, why: 'RAM ใช้เพียง 55% ยังมีพื้นที่พอ' },
    ],
    learn: 'GPU ประมวลผลภาพและกราฟิก งานวิดีโอ/3D ที่หนักจะทำให้ GPU ทำงานเต็มที่',
    evidence: ['GPU Usage: 99%', 'Function: Graphics Processing', 'Case: 4K Video + 3D Effect', 'Decision: Upgrade GPU'],
  },
  {
    ws: 'WORKSTATION #03', symptom: 'Slow Boot', story: 'เปิดเครื่องนาน 3 นาที เปิดไฟล์ทีละไฟล์ก็ช้า เครื่องนี้ใช้ HDD รุ่นเก่า',
    meters: [
      { key: 'cpu', label: 'CPU', value: 18, after: 15, unit: '%' },
      { key: 'ram', label: 'RAM', value: 41, after: 40, unit: '%' },
      { key: 'gpu', label: 'GPU', value: 5, after: 5, unit: '%' },
      { key: 'storage', label: 'Storage', value: 100, after: 12, unit: '% Active', text: '', textAfter: '' },
    ],
    suspect: 'storage',
    actions: [
      { t: 'เปลี่ยนจาก HDD เป็น SSD', ok: true, why: 'SSD ใช้ชิปแฟลช ไม่มีจานหมุน อ่าน-เขียนเร็วกว่า HDD หลายเท่า' },
      { t: 'เปลี่ยนจอภาพให้ใหญ่ขึ้น', ok: false, why: 'จอภาพไม่มีผลกับความเร็วในการเปิดเครื่อง' },
      { t: 'เปลี่ยน CPU', ok: false, why: 'CPU ทำงานเพียง 18% กำลังรอข้อมูลจาก Storage อยู่' },
    ],
    learn: 'Storage เก็บ OS และไฟล์ ถ้า Storage ช้า การเปิดเครื่องและเปิดไฟล์จะช้าตามไปด้วย',
    evidence: ['Storage Active: 100% (HDD)', 'Function: Permanent Storage', 'Case: Slow Boot', 'Decision: HDD → SSD'],
  },
  {
    ws: 'WORKSTATION #15', symptom: 'Heavy Calculation', story: 'นักเรียนบีบอัดไฟล์ขนาดใหญ่และคำนวณตารางข้อมูลหลายแสนแถว เครื่องค้าง ทั้งที่ไม่ได้เปิดโปรแกรมอื่น',
    meters: [
      { key: 'cpu', label: 'CPU', value: 100, after: 64, unit: '%' },
      { key: 'ram', label: 'RAM', value: 48, after: 47, unit: '%' },
      { key: 'gpu', label: 'GPU', value: 9, after: 9, unit: '%' },
      { key: 'storage', label: 'Storage', value: 0, after: 0, unit: '', text: 'NORMAL', textAfter: 'NORMAL' },
    ],
    suspect: 'cpu',
    actions: [
      { t: 'อัปเกรด CPU ให้มีจำนวน Core มากขึ้น', ok: true, why: 'การคำนวณและบีบอัดไฟล์เป็นงานประมวลผลของ CPU โดยตรง' },
      { t: 'เปลี่ยนเมาส์', ok: false, why: 'เมาส์เป็น Input ไม่เกี่ยวกับความเร็วการคำนวณ' },
      { t: 'เปลี่ยนเป็นจอความละเอียดสูง', ok: false, why: 'จอภาพไม่ช่วยให้คำนวณเร็วขึ้น' },
    ],
    learn: 'CPU ประมวลผลคำสั่งและคำนวณ งานคำนวณหนัก ๆ จะทำให้ CPU ทำงานเต็ม 100%',
    evidence: ['CPU Usage: 100%', 'Function: Process Instructions', 'Case: Heavy Calculation', 'Decision: Upgrade CPU'],
  },
];

const SUSPECTS: { id: Suspect; label: string; icon: string; hw: string }[] = [
  { id: 'cpu', label: 'CPU', icon: 'cpu', hw: 'cpu' },
  { id: 'ram', label: 'RAM', icon: 'memory', hw: 'ram' },
  { id: 'gpu', label: 'GPU', icon: 'gpu', hw: 'gpu' },
  { id: 'storage', label: 'Storage', icon: 'harddrive', hw: 'hdd' },
];

const STEPS = ['Investigate', 'Read Diagnostic', 'Identify Suspect', 'Select Action', 'Test'];

export function Mission4() {
  const { addEvidence } = useStore();
  const hints = useMissionHints(4);
  const [ci, setCi] = useState(0);
  const [step, setStep] = useState(0);
  const [suspect, setSuspect] = useState<Suspect | null>(null);
  const [action, setAction] = useState<number | null>(null);
  const [fb, setFb] = useState<{ kind: FeedbackKind; text: string } | null>(null);
  const [firstSuspect, setFirstSuspect] = useState<boolean[]>([]);
  const [firstAction, setFirstAction] = useState<boolean[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [tested, setTested] = useState(false);
  const [done, setDone] = useState(false);
  const c = CASES[ci];

  useBuddyTopic(
    step <= 1
      ? {
          scope: 4,
          hint: 'อ่านเรื่องที่ผู้ใช้เล่าก่อน แล้วกด Run Diagnostic — ตัวเลขไหน "ผิดปกติ" ที่สุด?',
          evidence: [`อาการ: ${c.symptom}`, 'ค่าที่เข้าใกล้ 100% คือส่วนที่ทำงานหนักเกินไป'],
          lesson: { text: 'Diagnostic บอกว่าแต่ละส่วนทำงานหนักแค่ไหน ส่วนที่ทำงานเต็มที่มักเป็นคอขวด (Bottleneck)' },
        }
      : step === 2
        ? {
            scope: 4,
            hint: c.suspect === 'ram' ? 'อุปกรณ์ไหนทำหน้าที่พักข้อมูลของโปรแกรมที่กำลังเปิดอยู่?' : c.suspect === 'gpu' ? 'งานภาพ วิดีโอ และเอฟเฟกต์ ใช้หน่วยประมวลผลตัวไหนเป็นหลัก?' : c.suspect === 'storage' ? 'ตอนเปิดเครื่อง OS ถูกอ่านขึ้นมาจากที่ไหน?' : 'ใครทำหน้าที่คำนวณและประมวลผลคำสั่งทั่วไป?',
            evidence: c.meters.map((m) => `${m.label}: ${m.text ?? ''}${m.text ? '' : `${m.value}${m.unit}`}`),
            lesson: { text: 'CPU = ประมวลผล · RAM = พักข้อมูลชั่วคราว · GPU = ประมวลผลภาพ · Storage = เก็บข้อมูลถาวร', hw: ['cpu', 'ram', 'gpu', 'hdd'] },
          }
        : {
            scope: 4,
            hint: 'วิธีแก้ที่ดีต้องตรงกับหน้าที่ของอุปกรณ์ที่เป็นปัญหา ไม่ใช่เปลี่ยนชิ้นที่แพงที่สุด',
            evidence: [`ผู้ต้องสงสัย: ${SUSPECTS.find((s) => s.id === c.suspect)?.label}`],
            lesson: { text: HW[SUSPECTS.find((s) => s.id === c.suspect)!.hw].func, hw: [SUSPECTS.find((s) => s.id === c.suspect)!.hw] },
          },
    [ci, step],
  );

  const pickSuspect = (s: Suspect) => {
    setSuspect(s);
    const right = s === c.suspect;
    if (firstSuspect.length === ci) setFirstSuspect((f) => [...f, right]);
    if (right) {
      setFb({ kind: 'correct', text: `ใช่ ${SUSPECTS.find((x) => x.id === s)?.label} คือผู้ต้องสงสัย — ต่อไปเลือกวิธีแก้` });
      setTimeout(() => { setFb(null); setStep(3); }, 1000);
    } else {
      setMistakes((m) => m + 1);
      const m = c.meters.find((x) => x.key === s)!;
      setFb({ kind: 'incorrect', text: `${m.label} ${m.text || `${m.value}${m.unit}`} — ค่านี้ยังปกติ ลองหาค่าที่ผิดปกติกว่านี้` });
    }
  };

  const pickAction = (i: number) => {
    setAction(i);
    const a = c.actions[i];
    if (firstAction.length === ci) setFirstAction((f) => [...f, a.ok]);
    if (a.ok) setFb({ kind: 'correct', text: a.why });
    else {
      setMistakes((m) => m + 1);
      setFb({ kind: 'incorrect', text: a.why });
    }
  };

  const runTest = () => {
    setTested(true);
    setStep(4);
    addEvidence({ id: `m4-${c.suspect}`, type: 'diagnostic', title: `${c.ws} · ${c.symptom}`, lines: c.evidence, mission: 4, hwId: SUSPECTS.find((s) => s.id === c.suspect)!.hw });
    addEvidence({ id: `m4-fn-${c.suspect}`, type: 'function', title: `หน้าที่ของ ${SUSPECTS.find((s) => s.id === c.suspect)!.label}`, lines: [c.learn], mission: 4, hwId: SUSPECTS.find((s) => s.id === c.suspect)!.hw });
  };

  const nextCase = () => {
    setFb(null);
    setSuspect(null);
    setAction(null);
    setTested(false);
    if (ci < CASES.length - 1) {
      setCi(ci + 1);
      setStep(0);
    } else setDone(true);
  };

  if (done) {
    return (
      <MissionComplete
        id={4}
        score={{
          accuracy: clamp(((firstSuspect.filter(Boolean).length + firstAction.filter(Boolean).length) / (CASES.length * 2)) * 100),
          investigation: 100,
          reasoning: clamp(100 - mistakes * 10),
          independence: independence(hints),
        }}
        learned={
          <ul className="space-y-1.5">
            <li>🧠 <b>CPU</b> — ประมวลผลคำสั่งและคำนวณ</li>
            <li>📦 <b>RAM</b> — พักข้อมูลของโปรแกรมที่กำลังทำงาน (ชั่วคราว)</li>
            <li>🎨 <b>GPU</b> — ประมวลผลภาพ กราฟิก และวิดีโอ</li>
            <li>💾 <b>Storage</b> — เก็บ OS และไฟล์แบบถาวร (SSD เร็วกว่า HDD)</li>
            <li className="pt-1 text-slate-500">อ่านค่า Diagnostic → หาส่วนที่ผิดปกติ → แก้ให้ตรงหน้าที่</li>
          </ul>
        }
      />
    );
  }

  const showMeters = step >= 1;
  const after = tested;

  return (
    <MissionFrame
      id={4}
      steps={STEPS}
      step={step}
      brief={<>คิวงานซ่อม <b>{ci + 1}/{CASES.length}</b> 🛠️ ทำตามขั้นตอน: อ่านอาการ → Run Diagnostic → ระบุผู้ต้องสงสัย → เลือกวิธีแก้ → ทดสอบ</>}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        {/* Ticket + diagnostic panel */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-slate-900 p-5 text-slate-100 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-mono text-sm font-bold text-cyan-300"><MonitorIcon className="h-4 w-4" aria-hidden="true" /> {c.ws}</p>
              <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-bold', after ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300')}>{after ? '✓ RESOLVED' : `⚠ ${c.symptom}`}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{c.story}</p>
            <div className="mt-4 rounded-2xl bg-white/5 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400"><Activity className="h-4 w-4" aria-hidden="true" /> DIAGNOSTIC</p>
              {!showMeters ? (
                <Btn onClick={() => setStep(1)} className="w-full bg-cyan-500 from-cyan-500 to-cyan-500 text-slate-900">
                  <ScanSearch className="h-4 w-4" aria-hidden="true" /> Run Diagnostic
                </Btn>
              ) : (
                <ul className="space-y-3 font-mono text-sm">
                  {c.meters.map((m) => {
                    const v = after ? m.after : m.value;
                    const txt = after ? m.textAfter : m.text;
                    const hot = !txt && v >= 90;
                    return (
                      <li key={m.key}>
                        <div className="mb-1 flex justify-between">
                          <span>{m.label}</span>
                          <span className={cx('font-bold tabular-nums', hot ? 'text-rose-400' : txt ? 'text-emerald-400' : 'text-slate-200')}>
                            {txt || `${v}${m.unit}`} {hot && '▲'}
                          </span>
                        </div>
                        {!txt && <Bar value={v} className="bg-white/10" color={hot ? 'bg-rose-500' : v >= 60 ? 'bg-amber-400' : 'bg-emerald-400'} label={m.label} />}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Action column */}
        <div className="space-y-4">
          {step === 1 && (
            <Card>
              <p className="font-display text-lg font-bold">อ่านค่า Diagnostic แล้วหรือยัง?</p>
              <p className="mt-1 text-sm text-slate-600">สังเกตค่าที่สูงผิดปกติ (มีเครื่องหมาย ▲) แล้วเทียบกับอาการที่ผู้ใช้เล่า</p>
              <Btn className="mt-3" onClick={() => setStep(2)}>ระบุผู้ต้องสงสัย <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>
            </Card>
          )}
          {step === 2 && (
            <Card>
              <p className="font-display text-lg font-bold">Identify Suspect · อุปกรณ์ไหนเป็นต้นเหตุ?</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {SUSPECTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => pickSuspect(s.id)}
                    className={cx('flex min-h-14 items-center gap-2 rounded-2xl px-3 font-bold ring-2', suspect === s.id ? (s.id === c.suspect ? 'bg-emerald-50 ring-emerald-400' : 'bg-rose-50 ring-rose-300') : 'bg-slate-50 ring-transparent hover:ring-slate-200')}
                  >
                    <Ico name={s.icon} className="h-5 w-5 text-slate-500" /> {s.label}
                  </button>
                ))}
              </div>
            </Card>
          )}
          {step >= 3 && (
            <Card>
              <p className="font-display text-lg font-bold">Select Action · เลือกวิธีแก้</p>
              <div className="mt-3 grid gap-2">
                {c.actions.map((a, i) => (
                  <button
                    key={a.t}
                    disabled={tested}
                    onClick={() => pickAction(i)}
                    className={cx('min-h-12 rounded-2xl px-4 py-3 text-left ring-2', action === i ? (a.ok ? 'bg-emerald-50 ring-emerald-400' : 'bg-rose-50 ring-rose-300') : 'bg-slate-50 ring-transparent hover:ring-slate-200', tested && action !== i && 'opacity-50')}
                  >
                    {a.t}
                  </button>
                ))}
              </div>
            </Card>
          )}
          <AnimatePresence>{fb && <Feedback kind={fb.kind}>{fb.text}</Feedback>}</AnimatePresence>
          {step === 3 && action !== null && c.actions[action].ok && !tested && (
            <Btn variant="success" className="w-full" onClick={runTest}><FlaskConical className="h-4 w-4" aria-hidden="true" /> Test · ทดสอบระบบ</Btn>
          )}
          {tested && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <Card className="bg-indigo-50 ring-indigo-100">
                <p className="text-xs font-bold tracking-widest text-indigo-500">LEARN</p>
                <p className="mt-1 text-slate-800">{c.learn}</p>
                <p className="mt-2 text-xs text-indigo-700">+ เพิ่ม Diagnostic Evidence และ Function Evidence ลง Evidence Board แล้ว</p>
              </Card>
              <Btn className="w-full" onClick={nextCase}>{ci < CASES.length - 1 ? 'งานซ่อมถัดไป' : 'สรุปภารกิจ'} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>
            </motion.div>
          )}
        </div>
      </div>
    </MissionFrame>
  );
}

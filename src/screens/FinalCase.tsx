import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, Reorder, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowDown, ArrowRight, ArrowUp, CircleCheck, FlaskConical, GripVertical, Siren, Wrench } from 'lucide-react';
import type { Category } from '../types';
import { useStore } from '../store';
import { CATEGORIES, CATEGORY_ORDER } from '../data/hardware';
import { Bar, Btn, Card, Feedback, Steps, cx, type FeedbackKind } from '../components/ui';
import { Shell } from '../components/Shell';
import { Ico } from '../components/icons';
import { BuddyBot } from '../components/BuddyBot';
import { useBuddyTopic } from '../components/Buddy';
import { clamp, independence } from '../missions/common';

interface Issue {
  id: string;
  zone: string;
  zoneIcon: string;
  clue: string;
  symptom: string;
  cat: Category;
  fixes: { t: string; price: number; ok: boolean; why: string }[];
}

const ISSUES: Issue[] = [
  {
    id: 'storage', zone: 'ไดรฟ์ C:', zoneIcon: 'harddrive', cat: 'storage',
    clue: 'Storage: HDD 500 GB ใช้ไป 98% · บันทึกไฟล์ใหม่ไม่ได้ "Disk Full"',
    symptom: 'บันทึกใบลงทะเบียนนักเรียนใหม่ไม่ได้',
    fixes: [
      { t: 'เปลี่ยนเป็น SSD 1 TB แล้วย้ายข้อมูล', price: 2600, ok: true, why: 'ได้ทั้งพื้นที่เพิ่มและความเร็ว เหมาะกับการเปิดไฟล์ทั้งวัน' },
      { t: 'เพิ่ม RAM', price: 1700, ok: false, why: 'RAM เป็นหน่วยความจำชั่วคราว ไม่ได้เพิ่มพื้นที่เก็บไฟล์ถาวร' },
      { t: 'เปลี่ยนจอภาพ', price: 2500, ok: false, why: 'จอภาพเป็น Output ไม่เกี่ยวกับพื้นที่จัดเก็บ' },
    ],
  },
  {
    id: 'ram', zone: 'Task Manager', zoneIcon: 'activity', cat: 'processing',
    clue: 'RAM 8 GB ใช้งาน 94% ขณะเปิดระบบทะเบียน + Excel + Browser พร้อมกัน',
    symptom: 'เปิดหลายโปรแกรมแล้วเครื่องช้ามาก',
    fixes: [
      { t: 'อัปเกรด RAM เป็น 16 GB', price: 1700, ok: true, why: 'มีที่พักข้อมูลเพียงพอสำหรับหลายโปรแกรมพร้อมกัน' },
      { t: 'เปลี่ยน GPU High 16 GB', price: 19000, ok: false, why: 'งานทะเบียนไม่ใช่งานกราฟิก และเกินงบมาก' },
      { t: 'เปลี่ยนคีย์บอร์ด', price: 250, ok: false, why: 'คีย์บอร์ดเป็น Input ไม่ช่วยเรื่องหน่วยความจำ' },
    ],
  },
  {
    id: 'printer', zone: 'เครื่องพิมพ์', zoneIcon: 'printer', cat: 'output',
    clue: 'Printer: สถานะ Offline · สาย USB หลวม · ไฟ Error กะพริบ',
    symptom: 'พิมพ์ใบยืนยันการลงทะเบียนไม่ออก',
    fixes: [
      { t: 'เสียบสาย USB ใหม่ / เปลี่ยนสาย', price: 150, ok: true, why: 'อุปกรณ์ Output ต้องเชื่อมต่อกับเครื่องจึงจะส่งงานพิมพ์ได้' },
      { t: 'ซื้อเครื่องพิมพ์ใหม่ทันที', price: 4500, ok: false, why: 'ยังไม่ได้ตรวจสาเหตุ อาจแก้ได้ด้วยวิธีที่ถูกกว่า' },
      { t: 'เปลี่ยน CPU', price: 6500, ok: false, why: 'CPU ไม่เกี่ยวกับการเชื่อมต่อเครื่องพิมพ์' },
    ],
  },
  {
    id: 'router', zone: 'ตู้เครือข่าย', zoneIcon: 'router', cat: 'communication',
    clue: 'Router: ไฟ WAN ดับ · เครื่องขึ้น "No Internet" · ส่งข้อมูลเข้าระบบกลางไม่ได้',
    symptom: 'ส่งรายชื่อนักเรียนไปยังระบบกลางของวิทยาลัยไม่ได้',
    fixes: [
      { t: 'รีสตาร์ต Router และตรวจสาย LAN/WAN', price: 0, ok: true, why: 'อุปกรณ์ Communication ต้องเชื่อมต่อเครือข่ายได้จึงจะส่งข้อมูลออกไปได้' },
      { t: 'เปลี่ยนลำโพง', price: 600, ok: false, why: 'ลำโพงเป็น Output เสียง ไม่เกี่ยวกับเครือข่าย' },
      { t: 'เพิ่ม SSD อีกลูก', price: 1500, ok: false, why: 'Storage ไม่ได้ช่วยส่งข้อมูลออกนอกเครื่อง' },
    ],
  },
];

const BUDGET = 6000;
const STEPS = ['Inspect', 'Collect Evidence', 'Analyze', 'Prioritize', 'Select Hardware', 'Repair', 'Test', 'Explain Decision'];
// Recommended order: nothing can be saved without storage → slow multitasking → printing → sending
// is also defensible; the task is to justify, not to match exactly.
const DEADLINE_FIRST = ['storage', 'router'];

export function FinalCase() {
  const { addEvidence, completeFinal, go, state } = useStore();
  const startHints = useRef(state.buddyUses);
  const hintsUsed = state.buddyUses - startHints.current;
  const [step, setStep] = useState(0);
  const [inspected, setInspected] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<Record<string, Category>>({});
  const [analyzeTries, setAnalyzeTries] = useState(0);
  const [analyzeWrong, setAnalyzeWrong] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>(ISSUES.map((i) => i.id));
  const [fixPick, setFixPick] = useState<Record<string, number>>({});
  const [fixTries, setFixTries] = useState(0);
  const [repaired, setRepaired] = useState<string[]>([]);
  const [testing, setTesting] = useState(-1);
  const [fb, setFb] = useState<{ kind: FeedbackKind; text: string } | null>(null);
  const [explain, setExplain] = useState('');
  const [finished, setFinished] = useState(false);

  const spent = Object.entries(fixPick).reduce((a, [id, i]) => a + ISSUES.find((x) => x.id === id)!.fixes[i].price, 0);

  useBuddyTopic(
    {
      scope: 'final',
      hint: [
        'ตรวจทั้ง 4 จุดในห้องทะเบียนก่อน — ช่างเทคนิคที่ดีไม่ด่วนสรุป',
        'ตรวจทั้ง 4 จุดในห้องทะเบียนก่อน — ช่างเทคนิคที่ดีไม่ด่วนสรุป',
        'แต่ละอาการ ทำให้ระบบเสียความสามารถ "ด้านไหน" ในเส้นทางข้อมูล?',
        'งานต้องเสร็จวันนี้: ปัญหาไหนทำให้งาน "ทำไม่ได้เลย" และปัญหาไหนทำให้ "ช้า/ไม่สะดวก"?',
        'ในแต่ละปัญหา เลือกวิธีที่ตรงกับหน้าที่ของอุปกรณ์ และระวังงบ 6,000 บาท',
        'กดซ่อมทีละรายการตามลำดับที่คุณจัดไว้',
        'กดทดสอบเพื่อยืนยันว่าเส้นทางข้อมูลกลับมาครบ',
        'อธิบายเหมือนรายงานหัวหน้า: พบอะไร → เป็นปัญหาด้านไหน → แก้อย่างไร → ทำไมเรียงลำดับแบบนี้',
      ][step],
      evidence: ['Mission 02: ขาดชิ้นไหน ระบบเสียความสามารถด้านนั้น', 'Mission 03: Input → Processing → Storage → Output → Communication', 'Mission 04: RAM 96% = เปิดหลายโปรแกรม', `ตอนนี้มีหลักฐานทั้งหมด ${state.evidence.length} ชิ้นใน Evidence Board`],
      lesson: { text: 'Final Case ใช้ทุกทักษะ: ความหมาย · ความสำคัญ · ประเภท · หน้าที่ · การระบุ · การเลือก Hardware', hw: ['hdd', 'ram', 'printer', 'router'] },
    },
    [step, state.evidence.length],
  );

  useEffect(() => {
    if (testing < 0) return;
    if (testing >= CATEGORY_ORDER.length) {
      setFb({ kind: 'correct', text: 'ALL SYSTEMS ONLINE — ห้องทะเบียนกลับมาทำงานครบทุกด้านแล้ว' });
      return;
    }
    const t = setTimeout(() => setTesting((x) => x + 1), 650);
    return () => clearTimeout(t);
  }, [testing]);

  const inspect = (is: Issue) => {
    if (inspected.includes(is.id)) return;
    setInspected((x) => [...x, is.id]);
    addEvidence({ id: `final-${is.id}`, type: 'case', title: `Final Case · ${is.zone}`, lines: [is.clue, `อาการ: ${is.symptom}`], mission: 'final' });
  };

  const checkAnalysis = () => {
    const wrong = ISSUES.filter((i) => analysis[i.id] !== i.cat).map((i) => i.id);
    setAnalyzeTries((t) => t + 1);
    setAnalyzeWrong(wrong);
    if (wrong.length) setFb({ kind: 'incorrect', text: `ยังจัดไม่ถูก ${wrong.length} รายการ — อาการนั้นทำให้ข้อมูล "เข้าไม่ได้ / คิดช้า / เก็บไม่ได้ / แสดงไม่ได้ / ส่งไม่ได้"?` });
    else {
      setFb({ kind: 'correct', text: 'วิเคราะห์ถูกต้องทุกรายการ — ต่อไปจัดลำดับความสำคัญ' });
      setTimeout(() => { setFb(null); setStep(3); }, 900);
    }
  };

  const confirmOrder = () => {
    const topTwo = order.slice(0, 2);
    const good = DEADLINE_FIRST.every((id) => topTwo.includes(id));
    setFb(
      good
        ? { kind: 'correct', text: 'ลำดับสมเหตุสมผล: แก้สิ่งที่ทำให้ "บันทึก/ส่งข้อมูลไม่ได้เลย" ก่อน แล้วค่อยแก้เรื่องความเร็วและการพิมพ์' }
        : { kind: 'hint', text: 'ลำดับนี้ใช้ได้ แต่ลองคิดอีกนิด: งานต้องส่งวันนี้ ปัญหาไหนทำให้งานหยุดสนิท? (คุณจะอธิบายเหตุผลได้ในขั้นสุดท้าย)' },
    );
    setStep(4);
  };

  const confirmFixes = () => {
    setFixTries((t) => t + 1);
    const bad = ISSUES.filter((i) => fixPick[i.id] === undefined || !i.fixes[fixPick[i.id]].ok);
    if (spent > BUDGET) {
      setFb({ kind: 'incorrect', text: `เกินงบ ${(spent - BUDGET).toLocaleString()} บาท — มีวิธีที่ถูกกว่าและตรงจุดกว่าไหม?` });
      return;
    }
    if (bad.length) {
      const first = bad[0];
      const pick = fixPick[first.id];
      setFb({ kind: 'incorrect', text: pick === undefined ? `ยังไม่ได้เลือกวิธีแก้สำหรับ "${first.zone}"` : `${first.zone}: ${first.fixes[pick].why}` });
      return;
    }
    setFb({ kind: 'correct', text: `แผนซ่อมผ่าน! ใช้งบ ${spent.toLocaleString()} / ${BUDGET.toLocaleString()} บาท` });
    setTimeout(() => { setFb(null); setStep(5); }, 900);
  };

  const finish = () => {
    const investigation = clamp((inspected.length / ISSUES.length) * 100);
    const accuracy = clamp(100 - (analyzeTries - 1) * 15 - (fixTries - 1) * 15);
    const good = DEADLINE_FIRST.every((id) => order.slice(0, 2).includes(id));
    const keywords = ['storage', 'ssd', 'ram', 'printer', 'router', 'เก็บ', 'ส่ง', 'พิมพ์', 'หน่วยความจำ'].filter((k) => explain.toLowerCase().includes(k)).length;
    const reasoning = clamp((good ? 45 : 30) + keywords * 8 + Math.min(explain.trim().length, 160) / 8);
    completeFinal({ score: { accuracy, investigation, reasoning, independence: independence(hintsUsed) }, explanation: explain.trim() });
    addEvidence({ id: 'final-report', type: 'case', title: 'รายงานซ่อม Final Case', lines: [`ลำดับ: ${order.map((id) => ISSUES.find((i) => i.id === id)!.zone).join(' → ')}`, `งบที่ใช้: ${spent.toLocaleString()} บาท`, explain.trim().slice(0, 160)], mission: 'final' });
    confetti({ particleCount: 160, spread: 90, origin: { y: 0.3 } });
    setFinished(true);
  };

  if (finished) {
    return (
      <Shell title="FINAL CASE · CLOSED" exitTo="home">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <BuddyBot className="mx-auto h-24 w-24" mood="happy" />
          <Feedback kind="complete" title="CASE CLOSED · ห้องทะเบียนกลับมาใช้งานได้แล้ว!" className="text-left">
            คุณใช้ทุกทักษะของช่างเทคนิค: สำรวจ เก็บหลักฐาน วิเคราะห์ จัดลำดับ เลือก Hardware ซ่อม ทดสอบ และอธิบายเหตุผล
          </Feedback>
          <Card className="text-left">
            <p className="text-sm font-semibold text-slate-500">ขั้นต่อไปบนเส้นทางสู่ Certificate</p>
            <p className="mt-1 font-display text-lg font-bold">Post-Test → Reflection → Certificate</p>
          </Card>
          <Btn onClick={() => go({ name: 'posttest' })}>ทำ Post-Test <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="FINAL CASE · กู้ระบบห้องทะเบียน" subtitle="ภารกิจสุดท้ายของ Technician" exitTo="home">
      <div className="mb-4 overflow-x-auto pb-1">
        <Steps steps={STEPS} current={step} />
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-3xl bg-gradient-to-r from-rose-500 to-orange-500 p-4 text-white shadow-lg">
        <Siren className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
        <p className="text-sm leading-relaxed">
          <b>URGENT:</b> วันนี้เป็นวันสุดท้ายของการลงทะเบียน แต่เครื่อง <b>REG-01</b> ของห้องทะเบียนมีปัญหาหลายอย่างพร้อมกัน
          ต้อง <b>บันทึก พิมพ์ และส่งรายชื่อนักเรียนเข้าระบบกลาง</b> ให้ทันวันนี้ · งบซ่อม <b>{BUDGET.toLocaleString()} บาท</b>
        </p>
      </div>

      {/* 0-1 Inspect + collect */}
      {step <= 1 && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ISSUES.map((is) => {
              const seen = inspected.includes(is.id);
              return (
                <motion.button key={is.id} whileHover={{ y: -3 }} onClick={() => { inspect(is); setStep(1); }} className={cx('flex flex-col gap-2 rounded-3xl bg-white p-4 text-left shadow-md ring-2', seen ? 'ring-sky-300' : 'ring-transparent hover:ring-indigo-300')}>
                  <span className={cx('grid h-12 w-12 place-items-center rounded-2xl', seen ? 'bg-sky-50 text-sky-600' : 'bg-slate-100 text-slate-500')}><Ico name={is.zoneIcon} className="h-6 w-6" /></span>
                  <span className="font-bold text-slate-900">{is.zone}</span>
                  {seen ? (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-600">
                      🔎 {is.clue}
                      <span className="mt-2 block text-xs font-bold text-sky-700">✓ Evidence collected</span>
                    </motion.span>
                  ) : (
                    <span className="text-sm text-slate-400">แตะเพื่อ Inspect</span>
                  )}
                </motion.button>
              );
            })}
          </div>
          {fb && <Feedback kind={fb.kind}>{fb.text}</Feedback>}
          <div className="flex justify-end">
            <Btn onClick={() => {
              if (inspected.length < ISSUES.length) { setFb({ kind: 'investigate', text: `ยังเหลืออีก ${ISSUES.length - inspected.length} จุดที่ยังไม่ได้ตรวจ` }); return; }
              setFb(null); setStep(2);
            }}>วิเคราะห์หลักฐาน <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>
          </div>
        </div>
      )}

      {/* 2 Analyze */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-600">ปัญหาแต่ละข้อ ทำให้ระบบเสียความสามารถ "ด้านไหน"?</p>
          {ISSUES.map((is) => (
            <Card key={is.id} className={cx('p-4', analyzeWrong.includes(is.id) && 'ring-2 ring-rose-300')}>
              <p className="font-bold text-slate-900">{is.symptom}</p>
              <p className="text-xs text-slate-500">{is.clue}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORY_ORDER.map((cat) => (
                  <button key={cat} onClick={() => { setAnalysis((a) => ({ ...a, [is.id]: cat })); setAnalyzeWrong((w) => w.filter((x) => x !== is.id)); }} aria-pressed={analysis[is.id] === cat} className={cx('rounded-full px-3 py-1.5 text-sm font-semibold ring-2', analysis[is.id] === cat ? cx(CATEGORIES[cat].soft, CATEGORIES[cat].text, CATEGORIES[cat].ring) : 'bg-slate-50 text-slate-600 ring-transparent hover:ring-slate-200')}>
                    {analysis[is.id] === cat ? '● ' : ''}{CATEGORIES[cat].en}
                  </button>
                ))}
              </div>
            </Card>
          ))}
          {fb && <Feedback kind={fb.kind}>{fb.text}</Feedback>}
          <div className="flex justify-end"><Btn onClick={checkAnalysis} disabled={Object.keys(analysis).length < ISSUES.length}>ยืนยันการวิเคราะห์</Btn></div>
        </div>
      )}

      {/* 3 Prioritize */}
      {step === 3 && (
        <div className="mx-auto max-w-2xl space-y-3">
          <p className="text-sm font-semibold text-slate-600">จัดลำดับการซ่อม (ลากหรือใช้ปุ่มลูกศร) — บนสุด = ซ่อมก่อน</p>
          <Reorder.Group axis="y" values={order} onReorder={setOrder} className="space-y-2">
            {order.map((id, idx) => {
              const is = ISSUES.find((i) => i.id === id)!;
              return (
                <Reorder.Item key={id} value={id} className="flex cursor-grab items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 active:cursor-grabbing">
                  <GripVertical className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-600 font-bold text-white tabular-nums">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{is.symptom}</p>
                    <p className="text-xs text-slate-500">{is.zone} · {CATEGORIES[is.cat].en}</p>
                  </div>
                  <div className="flex flex-col">
                    <button className="grid h-7 w-9 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-30" disabled={idx === 0} onClick={() => setOrder((o) => { const n = [...o]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n; })} aria-label="เลื่อนขึ้น"><ArrowUp className="h-4 w-4" /></button>
                    <button className="grid h-7 w-9 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-30" disabled={idx === order.length - 1} onClick={() => setOrder((o) => { const n = [...o]; [n[idx + 1], n[idx]] = [n[idx], n[idx + 1]]; return n; })} aria-label="เลื่อนลง"><ArrowDown className="h-4 w-4" /></button>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
          <div className="flex justify-end"><Btn onClick={confirmOrder}>ยืนยันลำดับ</Btn></div>
        </div>
      )}

      {/* 4 Select hardware / action */}
      {step === 4 && (
        <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-3">
            {order.map((id, idx) => {
              const is = ISSUES.find((i) => i.id === id)!;
              return (
                <Card key={id} className="p-4">
                  <p className="font-bold text-slate-900"><span className="text-indigo-600">#{idx + 1}</span> {is.symptom}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {is.fixes.map((f, fi) => (
                      <button key={f.t} onClick={() => { setFixPick((p) => ({ ...p, [id]: fi })); }} aria-pressed={fixPick[id] === fi} className={cx('rounded-2xl p-3 text-left text-sm ring-2', fixPick[id] === fi ? 'bg-indigo-50 ring-indigo-500' : 'bg-slate-50 ring-transparent hover:ring-slate-200')}>
                        <span className="block font-semibold text-slate-900">{f.t}</span>
                        <span className="text-xs tabular-nums text-slate-500">฿{f.price.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
          <div className="space-y-3 lg:sticky lg:top-20 lg:self-start">
            <Card>
              <p className="font-display font-bold">งบซ่อม</p>
              <p className={cx('mt-1 font-display text-2xl font-bold tabular-nums', spent > BUDGET ? 'text-rose-600' : 'text-slate-900')}>฿{spent.toLocaleString()} <span className="text-base text-slate-400">/ {BUDGET.toLocaleString()}</span></p>
              <Bar value={(spent / BUDGET) * 100} color={spent > BUDGET ? 'bg-rose-500' : 'bg-emerald-500'} className="mt-2" label="งบที่ใช้" />
              <Btn className="mt-4 w-full" onClick={confirmFixes}>ยืนยันแผนซ่อม</Btn>
            </Card>
            {fb && <Feedback kind={fb.kind}>{fb.text}</Feedback>}
          </div>
        </div>
      )}

      {/* 5 Repair, 6 Test */}
      {(step === 5 || step === 6) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <p className="font-display text-lg font-bold">Repair · ซ่อมตามลำดับ</p>
            <ol className="mt-3 space-y-2">
              {order.map((id, idx) => {
                const is = ISSUES.find((i) => i.id === id)!;
                const done = repaired.includes(id);
                const next = !done && repaired.length === idx;
                return (
                  <li key={id} className={cx('flex items-center gap-3 rounded-2xl p-3 ring-1', done ? 'bg-emerald-50 ring-emerald-200' : 'bg-slate-50 ring-slate-100')}>
                    <span className={cx('grid h-8 w-8 place-items-center rounded-full text-sm font-bold', done ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200')}>{done ? '✓' : idx + 1}</span>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold text-slate-900">{is.fixes[fixPick[id]].t}</p>
                      <p className="text-xs text-slate-500">{is.zone}</p>
                    </div>
                    {next && (
                      <Btn className="min-h-9 py-1.5 text-sm" onClick={() => { setRepaired((r) => [...r, id]); if (repaired.length + 1 === ISSUES.length) setStep(6); }}>
                        <Wrench className="h-4 w-4" aria-hidden="true" /> ซ่อม
                      </Btn>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>
          <div className="rounded-3xl bg-slate-900 p-5 text-slate-100 shadow-xl">
            <p className="font-mono text-sm font-bold text-cyan-300">REG-01 · SYSTEM TEST</p>
            <ul className="mt-3 space-y-2">
              {CATEGORY_ORDER.map((cat, i) => {
                const broken = ISSUES.some((is) => is.cat === cat && !repaired.includes(is.id));
                const passed = testing > i;
                return (
                  <li key={cat} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                    <span>{CATEGORIES[cat].en}</span>
                    <span className={cx('text-xs font-bold', passed ? 'text-emerald-400' : broken ? 'text-rose-400' : 'text-slate-400')}>
                      {passed ? '✓ PASS' : testing === i ? '… TESTING' : broken ? '✕ FAULT' : '○ READY'}
                    </span>
                  </li>
                );
              })}
            </ul>
            {step === 6 && testing < 0 && (
              <Btn variant="success" className="mt-4 w-full" onClick={() => setTesting(0)}><FlaskConical className="h-4 w-4" aria-hidden="true" /> Test · ทดสอบระบบ</Btn>
            )}
            <AnimatePresence>{fb && testing >= CATEGORY_ORDER.length && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4"><Feedback kind={fb.kind}>{fb.text}</Feedback></motion.div>}</AnimatePresence>
            {testing >= CATEGORY_ORDER.length && (
              <Btn className="mt-4 w-full" onClick={() => { setFb(null); setStep(7); }}>เขียนรายงาน <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>
            )}
          </div>
        </div>
      )}

      {/* 7 Explain */}
      {step === 7 && (
        <div className="mx-auto max-w-2xl">
          <Card>
            <p className="font-display text-lg font-bold">Explain Decision · รายงานถึงหัวหน้างาน</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li><CircleCheck className="mr-1 inline h-4 w-4 text-emerald-500" aria-hidden="true" />ลำดับที่เลือก: {order.map((id) => ISSUES.find((i) => i.id === id)!.zone).join(' → ')}</li>
              <li><CircleCheck className="mr-1 inline h-4 w-4 text-emerald-500" aria-hidden="true" />งบที่ใช้: ฿{spent.toLocaleString()}</li>
            </ul>
            <label className="mt-3 block">
              <span className="text-sm font-semibold text-slate-700">อธิบาย: พบปัญหาอะไร เป็น Hardware ประเภทใด แก้อย่างไร และทำไมเรียงลำดับแบบนี้</span>
              <textarea value={explain} onChange={(e) => setExplain(e.target.value)} rows={5} className="mt-1 w-full rounded-2xl bg-slate-50 p-3 outline-none ring-2 ring-slate-200 focus:ring-indigo-400" placeholder="เช่น ซ่อม Storage ก่อนเพราะถ้าเก็บไฟล์ไม่ได้ งานลงทะเบียนจะหยุดทั้งหมด..." />
              <span className="text-xs text-slate-400 tabular-nums">{explain.trim().length}/40 ตัวอักษรขั้นต่ำ</span>
            </label>
            <div className="mt-3 flex justify-end">
              <Btn variant="success" disabled={explain.trim().length < 40} onClick={finish}>ปิดคดี · Close Case</Btn>
            </div>
          </Card>
        </div>
      )}
    </Shell>
  );
}

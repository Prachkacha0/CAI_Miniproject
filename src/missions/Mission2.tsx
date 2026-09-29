import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CircleCheck, CircleX, Power, TriangleAlert } from 'lucide-react';
import type { Category } from '../types';
import { useStore } from '../store';
import { CATEGORIES, CATEGORY_ORDER } from '../data/hardware';
import { Btn, Card, Feedback, cx, type FeedbackKind } from '../components/ui';
import { Ico } from '../components/icons';
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
          <Card>
            <p className="mb-3 text-sm font-semibold text-slate-600">แตะเพื่อ ถอด / ใส่ คืน</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PARTS.map((p) => {
                const off = removed.includes(p.id);
                const c = CATEGORIES[p.cat];
                return (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggle(p)}
                    aria-pressed={off}
                    className={cx('relative flex flex-col items-center gap-1.5 rounded-2xl p-3 ring-2 transition', off ? 'bg-slate-100 ring-slate-300' : cx('bg-white', c.ring))}
                  >
                    <span className={cx('grid h-12 w-12 place-items-center rounded-xl', off ? 'bg-slate-200 text-slate-400' : cx(c.soft, c.text))}>
                      <Ico name={p.icon} className="h-6 w-6" />
                    </span>
                    <span className={cx('text-sm font-bold', off ? 'text-slate-400 line-through' : 'text-slate-800')}>{p.en}</span>
                    <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-bold', off ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700')}>{off ? 'ถอดแล้ว · Removed' : 'ติดตั้ง · Installed'}</span>
                    {tested.includes(p.id) && <span className="absolute right-2 top-2 text-xs text-sky-600" title="ทดลองแล้ว">🔎</span>}
                  </motion.button>
                );
              })}
            </div>
          </Card>
          <div className="space-y-4">
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

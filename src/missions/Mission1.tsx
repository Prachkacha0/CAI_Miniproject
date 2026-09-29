import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Cloud, Hand, PackageCheck, Search } from 'lucide-react';
import { useStore } from '../store';
import { Btn, Card, Feedback, Modal, cx, type FeedbackKind } from '../components/ui';
import { Ico } from '../components/icons';
import { useBuddyTopic } from '../components/Buddy';
import { MissionComplete, MissionFrame, clamp, independence } from './common';
import { useMissionHints } from './useMissionHints';
import { Quiz } from './Quiz';

interface LabObject {
  id: string;
  name: string;
  en: string;
  icon: string;
  physical: boolean;
  where: string;
  touch: string;
  observe: string;
}

const OBJECTS: LabObject[] = [
  { id: 'monitor', name: 'จอภาพ', en: 'Monitor', icon: 'monitor', physical: true, where: 'วางอยู่บนโต๊ะ', touch: 'แตะได้ มีน้ำหนักประมาณ 3 กก.', observe: 'มีสายไฟและสายสัญญาณต่อเข้ากับเครื่อง' },
  { id: 'keyboard', name: 'แป้นพิมพ์', en: 'Keyboard', icon: 'keyboard', physical: true, where: 'วางอยู่หน้าจอภาพ', touch: 'กดได้ ทำจากพลาสติก', observe: 'มีปุ่มหลายสิบปุ่ม ต่อสาย USB' },
  { id: 'mouse', name: 'เมาส์', en: 'Mouse', icon: 'mouse', physical: true, where: 'อยู่ข้างแป้นพิมพ์', touch: 'หยิบได้ พอดีมือ', observe: 'มีปุ่มคลิกและลูกกลิ้ง' },
  { id: 'ram', name: 'แรม', en: 'RAM', icon: 'memory', physical: true, where: 'อยู่ในเคส เสียบบนเมนบอร์ด', touch: 'ถอดออกมาถือได้ เป็นแผงวงจร', observe: 'มีชิปสีดำเรียงกัน ขาสีทอง' },
  { id: 'ssd', name: 'เอสเอสดี', en: 'SSD', icon: 'save', physical: true, where: 'อยู่ในเคส', touch: 'ถอดออกมาถือได้ แผ่นเล็กบาง', observe: 'มีชิปและหัวเสียบ' },
  { id: 'browser', name: 'เว็บเบราว์เซอร์', en: 'Browser', icon: 'browser', physical: false, where: 'ปรากฏบนหน้าจอเมื่อเปิดโปรแกรม', touch: 'แตะไม่ได้ — มองเห็นแต่บนจอ', observe: 'เป็นโปรแกรมที่ติดตั้งและเปิดใช้งาน' },
  { id: 'file', name: 'ไฟล์รายงาน', en: 'File', icon: 'file', physical: false, where: 'อยู่ในโฟลเดอร์ Documents', touch: 'แตะไม่ได้ — เป็นข้อมูลที่ถูกบันทึกไว้', observe: 'คัดลอก ย้าย ลบได้ด้วยคำสั่ง' },
  { id: 'os', name: 'ระบบปฏิบัติการ', en: 'Operating System', icon: 'os', physical: false, where: 'ทำงานอยู่เบื้องหลังตั้งแต่เปิดเครื่อง', touch: 'แตะไม่ได้ — เป็นชุดคำสั่ง', observe: 'ติดตั้งใหม่หรืออัปเดตได้โดยไม่ต้องเปลี่ยนชิ้นส่วน' },
];

type Bin = 'physical' | 'virtual';

const STEPS = ['Inspect', 'Collect Evidence', 'Classify', 'Conclude'];

export function Mission1() {
  const { addEvidence } = useStore();
  const hints = useMissionHints(1);
  const [phase, setPhase] = useState<'investigate' | 'classify' | 'conclude' | 'done'>('investigate');
  const [inspecting, setInspecting] = useState<LabObject | null>(null);
  const [inspected, setInspected] = useState<string[]>([]);
  const [collected, setCollected] = useState<string[]>([]);
  const [fb, setFb] = useState<{ kind: FeedbackKind; text: string } | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [bins, setBins] = useState<Record<string, Bin>>({});
  const [checks, setChecks] = useState(0);
  const [firstCorrect, setFirstCorrect] = useState<number | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [q1, setQ1] = useState<number | null>(null);
  const [q1Tries, setQ1Tries] = useState(0);
  const [q2, setQ2] = useState<number | null>(null);
  const [q2Tries, setQ2Tries] = useState(0);

  const stepIdx = phase === 'investigate' ? (collected.length ? 1 : 0) : phase === 'classify' ? 2 : 3;

  useBuddyTopic(
    phase === 'investigate'
      ? {
          scope: 1,
          hint: 'สังเกตให้ดี: สิ่งไหน "หยิบจับได้" และสิ่งไหน "มองเห็นได้แค่บนหน้าจอ"?',
          evidence: ['ดูบรรทัด "สัมผัส" ในหน้าต่าง Inspect ของแต่ละชิ้น', `ตอนนี้เก็บหลักฐานได้ ${collected.length}/8 ชิ้น`],
          lesson: { text: 'ระบบคอมพิวเตอร์มีทั้งส่วนที่จับต้องได้ และส่วนที่เป็นคำสั่ง/ข้อมูล ลองแยกให้ออกว่าเป็นส่วนไหน' },
        }
      : phase === 'classify'
        ? {
            scope: 1,
            hint: 'ถ้าคุณถอดสิ่งนั้นออกจากเครื่องแล้ววางบนโต๊ะได้ มันควรอยู่ฝั่งไหน?',
            evidence: ['หลักฐานที่เก็บมามีข้อความ "แตะได้" หรือ "แตะไม่ได้" กำกับไว้', 'ระบบปฏิบัติการอัปเดตได้โดยไม่เปลี่ยนชิ้นส่วน — นั่นบอกอะไร?'],
            lesson: { text: 'Software คือชุดคำสั่ง, Data คือข้อมูล ทั้งสองจับต้องไม่ได้ แต่ต้องอาศัยบางสิ่งที่จับต้องได้ในการทำงาน' },
          }
        : {
            scope: 1,
            hint: 'ดูกลุ่ม "จับต้องได้" ที่คุณจัดไว้ — ทุกชิ้นมีอะไรเหมือนกัน?',
            evidence: ['Monitor, Keyboard, Mouse, RAM, SSD อยู่กลุ่มเดียวกันเพราะอะไร?'],
            lesson: { text: 'คำว่า "กายภาพ (Physical)" หมายถึงมีตัวตน จับต้องได้ มองเห็นได้', hw: ['monitor', 'ram', 'ssd'] },
          },
    [phase, collected.length],
  );

  const openInspect = (o: LabObject) => {
    setInspecting(o);
    setInspected((x) => (x.includes(o.id) ? x : [...x, o.id]));
  };

  const collect = (o: LabObject) => {
    addEvidence({
      id: `m1-${o.id}`,
      type: o.physical ? 'hardware' : 'clue',
      title: `${o.en} (${o.name})`,
      lines: [`พบที่: ${o.where}`, `สัมผัส: ${o.touch}`],
      mission: 1,
      hwId: o.physical ? o.id : undefined,
    });
    setCollected((c) => (c.includes(o.id) ? c : [...c, o.id]));
    setInspecting(null);
    setFb(null);
  };

  const toClassify = () => {
    if (collected.length < OBJECTS.length) {
      setFb({ kind: 'investigate', text: `ยังมีวัตถุที่ไม่ได้เก็บหลักฐานอีก ${OBJECTS.length - collected.length} ชิ้น ช่างเทคนิคที่ดีต้องตรวจให้ครบก่อนสรุป` });
      return;
    }
    setFb(null);
    setPhase('classify');
  };

  const place = (bin: Bin) => {
    if (!sel) return;
    setBins((b) => ({ ...b, [sel]: bin }));
    setWrongIds((w) => w.filter((x) => x !== sel));
    setSel(null);
  };

  const check = () => {
    const wrong = OBJECTS.filter((o) => bins[o.id] !== (o.physical ? 'physical' : 'virtual')).map((o) => o.id);
    setChecks((c) => c + 1);
    if (firstCorrect === null) setFirstCorrect(OBJECTS.length - wrong.length);
    if (wrong.length === 0) {
      setFb({ kind: 'correct', text: 'แยกได้ถูกต้องทั้งหมด! สังเกตว่ากลุ่มหนึ่งจับต้องได้ อีกกลุ่มเป็นคำสั่งหรือข้อมูล' });
      addEvidence({ id: 'm1-classify', type: 'category', title: 'Physical vs Non-physical', lines: ['จับต้องได้: Monitor, Keyboard, Mouse, RAM, SSD', 'จับต้องไม่ได้: Browser, File, Operating System'], mission: 1 });
      setTimeout(() => {
        setFb(null);
        setPhase('conclude');
      }, 1400);
    } else {
      setWrongIds(wrong);
      setFb({ kind: 'incorrect', text: `มี ${wrong.length} ชิ้นที่อยู่ผิดฝั่ง (มีกรอบสีแดง) ลองเปิดหลักฐานดูอีกครั้ง: มันหยิบจับได้จริงไหม?` });
    }
  };

  if (phase === 'done') {
    const acc = clamp((((firstCorrect ?? 0) / OBJECTS.length) * 60) + (q1Tries === 1 ? 20 : 8) + (q2Tries === 1 ? 20 : 8));
    return (
      <MissionComplete
        id={1}
        score={{ accuracy: acc, investigation: clamp((inspected.length / OBJECTS.length) * 100), reasoning: clamp(100 - (q1Tries - 1) * 25 - (q2Tries - 1) * 25 - (checks - 1) * 10), independence: independence(hints) }}
        learned={
          <>
            <p><b>Hardware</b> คือ <b>ส่วนประกอบทางกายภาพ</b> ของระบบคอมพิวเตอร์ — สิ่งที่จับต้องได้ มองเห็นได้</p>
            <p className="mt-2">ส่วน Browser, File และ Operating System เป็นซอฟต์แวร์หรือข้อมูล จับต้องไม่ได้ แต่ต้องอาศัย Hardware ในการทำงาน</p>
          </>
        }
      />
    );
  }

  return (
    <MissionFrame
      id={1}
      steps={STEPS}
      step={stepIdx}
      brief={
        phase === 'investigate' ? (
          <>ห้อง <b>Computer Lab 204</b> ถูกแจ้งว่า "มีของหายและของเกิน" 🕵️ สำรวจทุกสิ่งในห้อง กด <b>Inspect</b> แล้ว <b>Collect Evidence</b> ให้ครบทั้ง 8 ชิ้น</>
        ) : phase === 'classify' ? (
          <>เอาหลักฐานมาแยกเป็น 2 กลุ่ม: แตะหลักฐาน 1 ชิ้น แล้วแตะกล่องปลายทาง</>
        ) : (
          <>หลักฐานพร้อมแล้ว ถึงเวลาสรุปคดี!</>
        )
      }
    >
      {phase === 'investigate' && (
        <>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-100 via-sky-50 to-white p-4 ring-1 ring-indigo-100 sm:p-6">
            <div className="mb-3 flex items-center justify-between text-xs font-bold text-indigo-700">
              <span>📍 COMPUTER LAB 204</span>
              <span className="tabular-nums">Evidence {collected.length}/8</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {OBJECTS.map((o, i) => {
                const got = collected.includes(o.id);
                const seen = inspected.includes(o.id);
                return (
                  <motion.button
                    key={o.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -4 }}
                    onClick={() => openInspect(o)}
                    className={cx('relative flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-md ring-2 transition', got ? 'ring-emerald-300' : 'ring-transparent hover:ring-indigo-300')}
                  >
                    <span className={cx('grid h-14 w-14 place-items-center rounded-2xl', got ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600')}>
                      <Ico name={o.icon} className="h-7 w-7" />
                    </span>
                    <span className="text-sm font-bold text-slate-800">{seen ? o.en : 'วัตถุ ???'}</span>
                    <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-bold', got ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                      {got ? '✓ เก็บแล้ว' : seen ? 'ตรวจแล้ว' : <><Search className="inline h-3 w-3" aria-hidden="true" /> Inspect</>}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {fb && <Feedback kind={fb.kind}>{fb.text}</Feedback>}
            <div className="flex justify-end">
              <Btn onClick={toClassify}>
                วิเคราะห์หลักฐาน <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Btn>
            </div>
          </div>
          <Modal open={!!inspecting} onClose={() => setInspecting(null)} title={inspecting ? `Inspect: ${inspecting.en}` : ''}>
            {inspecting && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><Ico name={inspecting.icon} className="h-8 w-8" /></span>
                  <div>
                    <p className="font-display text-lg font-bold">{inspecting.name}</p>
                    <p className="text-sm text-slate-500">{inspecting.en}</p>
                  </div>
                </div>
                <dl className="space-y-2 text-sm">
                  <Row k="📍 พบที่" v={inspecting.where} />
                  <Row k="✋ สัมผัส" v={inspecting.touch} />
                  <Row k="👁 สังเกต" v={inspecting.observe} />
                </dl>
                <Btn className="w-full" onClick={() => collect(inspecting)} disabled={collected.includes(inspecting.id)}>
                  <PackageCheck className="h-5 w-5" aria-hidden="true" /> {collected.includes(inspecting.id) ? 'เก็บหลักฐานแล้ว' : 'Collect Evidence'}
                </Btn>
              </div>
            )}
          </Modal>
        </>
      )}

      {phase === 'classify' && (
        <div className="space-y-4">
          <Card>
            <p className="mb-3 text-sm font-semibold text-slate-600">หลักฐานที่ยังไม่ได้จัด ({OBJECTS.filter((o) => !bins[o.id]).length})</p>
            <div className="flex min-h-12 flex-wrap gap-2">
              {OBJECTS.filter((o) => !bins[o.id]).map((o) => (
                <Chip key={o.id} o={o} selected={sel === o.id} onClick={() => setSel(sel === o.id ? null : o.id)} />
              ))}
              {OBJECTS.every((o) => bins[o.id]) && <span className="text-sm text-slate-400">จัดครบแล้ว — กดตรวจสอบได้เลย</span>}
            </div>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            {(['physical', 'virtual'] as Bin[]).map((b) => (
              <button
                key={b}
                onClick={() => place(b)}
                disabled={!sel}
                className={cx(
                  'min-h-44 rounded-3xl border-2 border-dashed p-4 text-left transition',
                  b === 'physical' ? 'border-emerald-300 bg-emerald-50/60' : 'border-violet-300 bg-violet-50/60',
                  sel && 'ring-4 ring-indigo-200 hover:scale-[1.01]',
                )}
              >
                <p className={cx('flex items-center gap-2 font-display text-lg font-bold', b === 'physical' ? 'text-emerald-800' : 'text-violet-800')}>
                  {b === 'physical' ? <Hand className="h-5 w-5" aria-hidden="true" /> : <Cloud className="h-5 w-5" aria-hidden="true" />}
                  {b === 'physical' ? 'จับต้องได้ · Physical' : 'จับต้องไม่ได้ · Non-physical'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {OBJECTS.filter((o) => bins[o.id] === b).map((o) => (
                    <Chip
                      key={o.id}
                      o={o}
                      wrong={wrongIds.includes(o.id)}
                      selected={sel === o.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSel(sel === o.id ? null : o.id);
                      }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
          {fb && <Feedback kind={fb.kind}>{fb.text}</Feedback>}
          <div className="flex justify-end">
            <Btn onClick={check} disabled={!OBJECTS.every((o) => bins[o.id])}>ตรวจสอบการจัดกลุ่ม</Btn>
          </div>
        </div>
      )}

      {phase === 'conclude' && (
        <div className="mx-auto max-w-2xl space-y-4">
          <Quiz
            title="สรุปคดี #1: จากหลักฐาน Hardware คืออะไร?"
            choices={['โปรแกรมที่ติดตั้งในเครื่อง', 'ส่วนประกอบทางกายภาพของระบบคอมพิวเตอร์ ที่จับต้องได้', 'ข้อมูลที่เก็บไว้ในไฟล์', 'ทุกอย่างที่แสดงบนหน้าจอ']}
            answer={1}
            value={q1}
            onPick={(i) => { setQ1(i); setQ1Tries((t) => t + 1); }}
            wrongFb={['โปรแกรมเป็นสิ่งที่จับต้องไม่ได้ ลองดูกลุ่ม Physical อีกครั้ง', '', 'ไฟล์อยู่ในกลุ่ม Non-physical ใช่ไหม?', 'Browser ก็แสดงบนจอ แต่แตะไม่ได้ ลองคิดใหม่']}
            rightFb="ใช่! Hardware = ส่วนประกอบทางกายภาพ (Physical Components)"
          />
          {q1 === 1 && (
            <Quiz
              title="ทดสอบข้อสรุป: ถ้าพบสิ่งเหล่านี้ในห้องอื่น ข้อใดเป็น Hardware?"
              choices={['โปรแกรมป้องกันไวรัส', 'รูปภาพ .jpg', 'Router ที่ติดผนัง', 'บัญชีผู้ใช้ Windows']}
              answer={2}
              value={q2}
              onPick={(i) => { setQ2(i); setQ2Tries((t) => t + 1); }}
              wrongFb={['โปรแกรม = ซอฟต์แวร์ จับต้องไม่ได้', 'รูปภาพเป็นข้อมูล (Data)', '', 'บัญชีผู้ใช้เป็นข้อมูลในระบบ']}
              rightFb="ถูกต้อง Router จับต้องได้ เป็นส่วนประกอบทางกายภาพ"
            />
          )}
          {q2 === 2 && (
            <div className="flex justify-end">
              <Btn variant="success" onClick={() => {
                addEvidence({ id: 'm1-definition', type: 'case', title: 'นิยาม Hardware', lines: ['Hardware = ส่วนประกอบทางกายภาพของระบบคอมพิวเตอร์', 'จับต้องได้ มองเห็นได้'], mission: 1 });
                setPhase('done');
              }}>
                ปิดแฟ้มคดี <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Btn>
            </div>
          )}
        </div>
      )}
    </MissionFrame>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-100">
      <dt className="w-20 shrink-0 font-semibold text-slate-500">{k}</dt>
      <dd className="text-slate-800">{v}</dd>
    </div>
  );
}

function Chip({ o, selected, wrong, onClick }: { o: LabObject; selected: boolean; wrong?: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <motion.span
      layout
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick(e as unknown as React.MouseEvent)}
      className={cx(
        'inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold shadow-sm ring-2',
        selected ? 'ring-indigo-500' : wrong ? 'ring-rose-400' : 'ring-slate-200',
      )}
    >
      <Ico name={o.icon} className="h-4 w-4 text-slate-500" />
      {o.en}
      {wrong && <span className="text-rose-500" aria-label="อยู่ผิดกลุ่ม">✕</span>}
    </motion.span>
  );
}

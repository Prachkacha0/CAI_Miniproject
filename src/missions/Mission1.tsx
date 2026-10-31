import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Check, Hand, Keyboard, PackageCheck, Search, Sparkles } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useStore } from '../store';
import { Btn, Card, Feedback, cx, type FeedbackKind } from '../components/ui';
import { useBuddyTopic } from '../components/Buddy';
import { MissionComplete, MissionFrame, clamp, independence } from './common';
import { useMissionHints } from './useMissionHints';
import type { WorkshopClue } from '../components/Mission1Workshop3D';

const Mission1Workshop3D = lazy(() => import('../components/Mission1Workshop3D').then((module) => ({ default: module.Mission1Workshop3D })));

const CLUES: WorkshopClue[] = [
  { id: 'monitor', name: 'จอภาพ', en: 'Monitor', model: 'monitor', physical: true, position: [-4.7, 0.9, -5.9], where: 'โต๊ะประกอบฝั่งซ้าย', touch: 'เป็นอุปกรณ์จริง มีน้ำหนักและหยิบย้ายได้', observe: 'มีแผงจอ สายไฟ และช่องต่อสัญญาณภาพ' },
  { id: 'keyboard', name: 'แป้นพิมพ์', en: 'Keyboard', model: 'keyboard', physical: true, position: [-3.8, 0.9, -5.25], where: 'หน้าเครื่องทดสอบ', touch: 'กดปุ่มบนอุปกรณ์ได้จริง', observe: 'มีปุ่มหลายแถวและเชื่อมต่อกับคอมพิวเตอร์' },
  { id: 'mouse', name: 'เมาส์', en: 'Mouse', model: 'mouse', physical: true, position: [-2.6, 0.9, -5.25], where: 'ข้างแป้นพิมพ์', touch: 'หยิบจับและขยับบนโต๊ะได้', observe: 'มีปุ่มคลิกกับล้อเลื่อน' },
  { id: 'ram', name: 'หน่วยความจำแรม', en: 'RAM', model: 'ram', physical: true, position: [5.2, 0.97, -6.4], where: 'ถาดอะไหล่บนโต๊ะด้านขวา', touch: 'เป็นแผงวงจรที่ถอดออกมาถือได้', observe: 'มีชิปสีดำเรียงอยู่และมีร่องบาก/ขาสัมผัสสีทอง' },
  { id: 'ssd', name: 'เอสเอสดีแบบพกพา', en: 'External SSD', model: 'ssd', physical: true, position: [6.7, 0.88, 0.1], where: 'ชั้นอะไหล่ด้านขวา', touch: 'เป็นอุปกรณ์เก็บข้อมูลจริง ถอดเปลี่ยนได้', observe: 'ตัวไดรฟ์มีชิปควบคุมและขั้วต่อ USB' },
  { id: 'browser', name: 'เว็บเบราว์เซอร์', en: 'Browser', model: 'browser', physical: false, position: [0.7, 1.9, -7.35], where: 'หน้าจอโฮโลแกรมบนโต๊ะกลาง', touch: 'เป็นโปรแกรมที่มองเห็นผ่านหน้าจอ ไม่ใช่ชิ้นส่วนที่ถอดถือได้', observe: 'เปิดเว็บไซต์ได้ แต่ต้องอาศัยคอมพิวเตอร์และจอภาพ' },
  { id: 'file', name: 'ไฟล์รายงาน', en: 'Report File', model: 'file', physical: false, position: [-7.45, 1.08, 0.1], where: 'จอแสดงงานบนตู้เก็บอุปกรณ์', touch: 'เป็นข้อมูลดิจิทัล ย้ายหรือลบได้ด้วยคำสั่ง', observe: 'ไอคอนกระดาษบนจอแทนข้อมูล ไม่ใช่กระดาษจริง' },
  { id: 'os', name: 'ระบบปฏิบัติการ', en: 'Operating System', model: 'os', physical: false, position: [2.5, 1.5, 5.2], where: 'แผงข้อมูลจำลองหน้าโต๊ะบริการ', touch: 'เป็นชุดคำสั่ง ไม่สามารถหยิบออกมาเป็นชิ้นส่วนได้', observe: 'จัดการอุปกรณ์และช่วยให้โปรแกรมทำงาน' },
];

type Direction = 'forward' | 'back' | 'left' | 'right';
const STEPS = ['เดินสำรวจ', 'ตรวจและเก็บหลักฐาน', 'สรุปงานช่าง'];

export function Mission1() {
  const { addEvidence } = useStore();
  const hints = useMissionHints(1);
  const [found, setFound] = useState<string[]>([]);
  const [nearId, setNearId] = useState<string | null>(null);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [pickupId, setPickupId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: FeedbackKind; text: string } | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [firstTryIds, setFirstTryIds] = useState<string[]>([]);
  const [move, setMove] = useState({ forward: false, back: false, left: false, right: false });
  const [stepRequest, setStepRequest] = useState<{ direction: Direction; nonce: number } | null>(null);
  const [done, setDone] = useState(false);
  const clue = CLUES.find((item) => item.id === inspectId) ?? null;

  useEffect(() => {
    if (!pickupId) return;
    const timeout = window.setTimeout(() => setInspectId(pickupId), 720);
    return () => window.clearTimeout(timeout);
  }, [pickupId]);

  useBuddyTopic(
    { scope: 1, hint: 'รับบทช่างซ่อม เดินสำรวจห้องให้ทั่วก่อนสรุปว่าอะไรเป็นอุปกรณ์จริง ลองมองหารูปร่างและขั้วต่อของชิ้นส่วน', evidence: [`เก็บหลักฐานแล้ว ${found.length}/${CLUES.length} ชิ้น`, 'อุปกรณ์จริงจะหยิบจับหรือถอดออกมาเป็นชิ้นส่วนได้ ส่วนโปรแกรมและไฟล์เป็นข้อมูลบนระบบ'], lesson: { text: 'Hardware คือส่วนประกอบทางกายภาพที่จับต้องได้ ส่วนซอฟต์แวร์และข้อมูลต้องอาศัย Hardware ในการทำงาน' } },
    [found.length],
  );

  const selected = useMemo(() => CLUES.find((item) => item.id === nearId) ?? null, [nearId]);
  const step = done ? 2 : found.length === CLUES.length ? 2 : found.length ? 1 : 0;

  const inspect = (id: string) => {
    if (found.includes(id) || pickupId) return;
    setPickupId(id);
    setFeedback(null);
  };

  const classify = (physical: boolean) => {
    if (!clue) return;
    if (physical !== clue.physical) {
      setWrongAttempts((n) => n + 1);
      setFeedback({ kind: 'incorrect', text: clue.physical ? 'นี่เป็นชิ้นส่วนที่มีตัวตนจริงในห้องซ่อม ลองสังเกตตัวอุปกรณ์ ขั้วต่อ และพื้นผิวอีกครั้ง' : 'สิ่งนี้แสดงอยู่บนอุปกรณ์ แต่ตัวโปรแกรม/ข้อมูลเองไม่ได้เป็นชิ้นส่วนที่หยิบออกมาถือได้ ลองทบทวนหลักฐานอีกครั้ง' });
      return;
    }
    const firstTry = !firstTryIds.includes(clue.id);
    if (firstTry) {
      setFirstTryIds((ids) => [...ids, clue.id]);
      setFirstTryCorrect((n) => n + 1);
    }
    addEvidence({
      id: `m1-${clue.id}`,
      type: clue.physical ? 'hardware' : 'clue',
      title: `${clue.en} (${clue.name})`,
      lines: [`พบที่: ${clue.where}`, `หลักฐาน: ${clue.touch}`, `จุดสังเกต: ${clue.observe}`],
      mission: 1,
      hwId: clue.physical ? clue.id : undefined,
    });
    setFound((items) => [...items, clue.id]);
    setInspectId(null);
    setPickupId(null);
    setFeedback({ kind: 'correct', text: `${clue.name} — ${clue.physical ? 'Hardware จับต้องได้' : 'ซอฟต์แวร์/ข้อมูลจับต้องไม่ได้'} บันทึกลงแฟ้มช่างแล้ว` });
    if (found.length + 1 === CLUES.length) {
      addEvidence({ id: 'm1-definition', type: 'case', title: 'สรุปงานช่าง: ความหมายของ Hardware', lines: ['Hardware คือส่วนประกอบทางกายภาพของระบบคอมพิวเตอร์ที่จับต้องได้', 'โปรแกรมและข้อมูลทำงานโดยอาศัย Hardware'], mission: 1 });
      window.setTimeout(() => { setDone(true); setFeedback(null); }, 900);
    }
  };

  const setDirection = (direction: Direction, pressed: boolean) => setMove((current) => current[direction] === pressed ? current : { ...current, [direction]: pressed });
  const directionButton = (direction: Direction, label: string, Icon: typeof ArrowUp) => (
    <button key={direction} type="button" aria-label={label} onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => { event.currentTarget.setPointerCapture(event.pointerId); setStepRequest({ direction, nonce: Date.now() + Math.random() }); setDirection(direction, true); }} onPointerUp={() => setDirection(direction, false)} onPointerCancel={() => setDirection(direction, false)} onLostPointerCapture={() => setDirection(direction, false)} className="grid h-12 w-12 touch-none select-none place-items-center rounded-xl border border-white/15 bg-slate-950/90 text-white shadow-lg transition active:scale-95 active:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-cyan-300" title={`${label} (แตะเพื่อก้าวหนึ่งครั้ง, กดค้างเพื่อเดิน)`}><Icon className="h-5 w-5" aria-hidden="true" /></button>
  );

  if (done) {
    const accuracy = clamp((firstTryCorrect / CLUES.length) * 100);
    return <MissionComplete id={1} score={{ accuracy, investigation: 100, reasoning: clamp(100 - wrongAttempts * 12), independence: independence(hints) }} learned={<><p><b>Hardware</b> คือส่วนประกอบทางกายภาพของคอมพิวเตอร์ เช่น จอภาพ แป้นพิมพ์ เมาส์ RAM และ SSD</p><p className="mt-2">เว็บเบราว์เซอร์ ระบบปฏิบัติการ และไฟล์รายงานเป็นซอฟต์แวร์หรือข้อมูล จับต้องไม่ได้ แต่ต้องอาศัย Hardware เพื่อทำงาน</p></>} meta={{ found: CLUES.length, wrongAttempts }} />;
  }

  return (
    <MissionFrame id={1} steps={STEPS} step={step} brief={<>มีอะไหล่และข้อมูลปะปนกันใน <b>เวิร์กช็อปซ่อมคอม</b> เดินสำรวจให้ครบ {CLUES.length} จุด ตรวจสิ่งที่พบ แล้วจัดเข้ากล่องอะไหล่หรือแฟ้มซอฟต์แวร์ให้ถูกต้อง</>}>
      <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <Card className="flex min-h-16 items-center gap-3 !p-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-100 text-cyan-800"><PackageCheck className="h-6 w-6" aria-hidden="true" /></div>
          <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">ใบงานซ่อม · ระบุของในเวิร์กช็อป</p><p className="text-xs text-slate-500">ตรวจให้ครบ แล้วบอกว่าเป็นชิ้นส่วนจริงหรือเป็นโปรแกรม/ข้อมูล</p></div>
          <span className="whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-sm font-black tabular-nums text-white">{found.length}/{CLUES.length}</span>
        </Card>
        <div className="flex flex-wrap justify-center gap-2 rounded-2xl bg-slate-900 p-2 sm:justify-end" aria-label="ปุ่มควบคุมการเดิน">
          <div className="grid grid-cols-3 grid-rows-2 gap-1.5"><span />{directionButton('forward', 'เดินไปข้างหน้า', ArrowUp)}<span />{directionButton('left', 'เดินไปทางซ้าย', ArrowLeft)}{directionButton('back', 'เดินถอยหลัง', ArrowDown)}{directionButton('right', 'เดินไปทางขวา', ArrowRight)}</div>
        </div>
      </div>
      <div className={cx('grid gap-3', clue && 'sm:grid-cols-[minmax(0,1fr)_360px]')}>
      <div className="relative min-w-0">
        <Suspense fallback={<div className={cx('grid place-items-center rounded-[1.75rem] bg-slate-950 text-sm font-semibold text-cyan-100', clue ? 'h-[36svh] min-h-[220px] sm:h-[min(52vh,560px)] sm:min-h-[340px] lg:h-[min(64vh,680px)] lg:min-h-[440px]' : 'h-[min(58svh,620px)] min-h-[320px] sm:h-[min(66vh,720px)] sm:min-h-[460px] lg:min-h-[520px]')}>กำลังเตรียมเวิร์กช็อป 3D…</div>}>
          <Mission1Workshop3D clues={CLUES} collected={found} onNear={setNearId} onInspect={inspect} move={move} stepRequest={stepRequest} controlsEnabled={!clue && !pickupId} pickupId={pickupId} compact={!!clue} />
        </Suspense>
        <div className="pointer-events-none absolute right-3 top-16 flex max-w-[47%] flex-wrap justify-end gap-1.5 sm:right-4 sm:top-4 sm:max-w-[55%]" aria-label={`เก็บหลักฐาน ${found.length} จาก ${CLUES.length} ชิ้น`}>
          {CLUES.map((item, index) => <span key={item.id} title={found.includes(item.id) ? item.en : `ยังไม่พบหลักฐาน ${index + 1}`} className={cx('grid h-7 min-w-7 place-items-center rounded-lg border px-1.5 text-[10px] font-black shadow-md backdrop-blur sm:h-8 sm:min-w-8 sm:text-xs', found.includes(item.id) ? 'border-emerald-300/70 bg-emerald-400/90 text-emerald-950' : 'border-white/20 bg-slate-950/70 text-white/75')}>{found.includes(item.id) ? <Check className="h-3.5 w-3.5" aria-label={`${item.en} เก็บแล้ว`} /> : String(index + 1).padStart(2, '0')}</span>)}
        </div>
        {selected && !clue && <div className="relative z-10 mx-auto mt-3 w-full max-w-[640px] rounded-2xl border border-cyan-200/25 bg-slate-950/95 p-3 text-white shadow-lg sm:p-4">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-500/15 text-cyan-200"><Search className="h-5 w-5" aria-hidden="true" /></div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wider text-cyan-200">พบเบาะแส · {selected.en}</p><p className="truncate text-sm text-slate-200">เข้าใกล้แล้ว กดตรวจดูเพื่อบันทึกหลักฐาน</p></div><Btn onClick={() => inspect(selected.id)} className="min-h-11 shrink-0 bg-cyan-500 px-4 text-sm text-slate-950 hover:bg-cyan-300"><Hand className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">ตรวจดู</span><kbd className="hidden rounded bg-slate-950/15 px-1.5 py-0.5 text-[10px] sm:inline">E</kbd></Btn></div>
        </div>}
        {!selected && found.length < CLUES.length && <div className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950/75 px-3 py-2 text-center text-xs font-semibold text-slate-100 shadow-lg backdrop-blur">สำรวจรอบห้องเพื่อหาเบาะแสที่ยังไม่พบ</div>}
      </div>
      <AnimatePresence>
      {clue && <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.24, ease: 'easeOut' }} className="relative z-10 mx-auto flex h-[min(38vh,340px)] min-h-[270px] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-cyan-100/20 bg-slate-950 p-3 shadow-xl sm:mx-0 sm:h-[min(68vh,720px)] sm:min-h-[570px] sm:max-w-none sm:p-4" aria-label={`ตรวจหลักฐาน ${clue.en}`}>
        <div className="mb-3 flex shrink-0 items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">FIELD SCAN</p><h2 className="font-display text-lg font-bold text-white">ตรวจหลักฐาน · {clue.en}</h2></div><button type="button" onClick={() => { setInspectId(null); setPickupId(null); setFeedback(null); }} className="min-h-10 shrink-0 rounded-xl bg-white/10 px-3 text-sm font-bold text-white ring-1 ring-white/15 hover:bg-white/15">ปิด</button></div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="rounded-xl bg-gradient-to-br from-slate-800 to-indigo-950 p-3 text-white ring-1 ring-cyan-200/15">
            <p className="text-[10px] font-bold tracking-[.16em] text-cyan-300">จุดสังเกต {CLUES.findIndex((item) => item.id === clue.id) + 1}</p>
            <h3 className="mt-0.5 text-xl font-bold">{clue.name}</h3><p className="text-xs text-slate-300">{clue.en}</p>
            <dl className="mt-2 space-y-1.5 text-xs"><div className="rounded-lg bg-white/10 p-2"><dt className="font-bold text-cyan-200">พบที่</dt><dd className="mt-0.5 text-slate-100">{clue.where}</dd></div><div className="rounded-lg bg-white/10 p-2"><dt className="font-bold text-cyan-200">จุดสังเกต</dt><dd className="mt-0.5 text-slate-100">{clue.observe}</dd></div><div className="rounded-lg bg-white/10 p-2"><dt className="font-bold text-cyan-200">หลักฐานสัมผัส</dt><dd className="mt-0.5 text-slate-100">{clue.touch}</dd></div></dl>
          </div>
        </div>
        <div className="mt-2 shrink-0 border-t border-white/10 pt-2"><p className="mb-2 text-xs font-bold text-white">จัดหลักฐานเข้ากลุ่ม</p>
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="secondary" onClick={() => classify(true)} className="min-h-14 justify-start rounded-xl !px-2 text-left !text-xs"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-800"><Hand className="h-4 w-4" aria-hidden="true" /></span><span><b className="block">กล่องอะไหล่</b><span className="text-[10px] font-medium text-slate-500">Hardware</span></span></Btn>
            <Btn variant="secondary" onClick={() => classify(false)} className="min-h-14 justify-start rounded-xl !px-2 text-left !text-xs"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-800"><Search className="h-4 w-4" aria-hidden="true" /></span><span><b className="block">แฟ้มข้อมูล</b><span className="text-[10px] font-medium text-slate-500">Software / Data</span></span></Btn>
          </div>
          {feedback && <div className="mt-2"><Feedback kind={feedback.kind}>{feedback.text}</Feedback></div>}
        </div>
      </motion.section>}
      </AnimatePresence>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><p className="flex items-center gap-1.5"><Keyboard className="h-4 w-4" aria-hidden="true" /> WASD / ลูกศรเพื่อเดิน · E เพื่อตรวจ · ใช้ปุ่มลูกศรบนจอได้</p><p className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" /> ฮาร์ดแวร์จริงมีวงแหวนฟ้า · โปรแกรม/ข้อมูลมีวงแหวนม่วง</p></div>
      {feedback && !clue && <div className="mt-3"><Feedback kind={feedback.kind}>{feedback.text}</Feedback></div>}
    </MissionFrame>
  );
}

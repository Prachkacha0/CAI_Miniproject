import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { useStore } from '../store';
import { HW } from '../data/hardware';
import { Btn, Card, Feedback, cx, type FeedbackKind } from '../components/ui';
import { useBuddyTopic } from '../components/Buddy';
import { Inspector } from '../components/Inspector';
import { artHotspots } from '../components/HardwareArt';
import { MissionComplete, MissionFrame, clamp, independence } from './common';
import { useMissionHints } from './useMissionHints';

const SUSPECTS: { hw: string; options: string[] }[] = [
  { hw: 'ram', options: ['ssd', 'ram', 'gpu', 'mainboard'] },
  { hw: 'hdd', options: ['hdd', 'optical', 'ssd', 'router'] },
  { hw: 'gpu', options: ['mainboard', 'cpu', 'gpu', 'router'] },
  { hw: 'cpu', options: ['cpu', 'ram', 'ssd', 'modem'] },
  { hw: 'mainboard', options: ['gpu', 'mainboard', 'ram', 'hdd'] },
  { hw: 'router', options: ['modem', 'printer', 'exthdd', 'router'] },
];

const STEPS = ['Explore', 'Inspect', 'Identify', 'Record Evidence'];

export function Mission5() {
  const { addEvidence, addHint } = useStore();
  const hints = useMissionHints(5);
  const [i, setI] = useState(0);
  const [seen, setSeen] = useState<Record<string, number[]>>({});
  const [hintLv, setHintLv] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [firstRight, setFirstRight] = useState<boolean[]>([]);
  const [tries, setTries] = useState(0);
  const [fb, setFb] = useState<{ kind: FeedbackKind; text: string } | null>(null);
  const [done, setDone] = useState(false);
  const s = SUSPECTS[i];
  const hw = HW[s.hw];
  const solved = pick === s.hw;
  const spots = artHotspots(hw.art!);
  const seenHere = seen[s.hw] ?? [];
  const totalSpots = useMemo(() => SUSPECTS.reduce((a, x) => a + artHotspots(HW[x.hw].art!).length, 0), []);
  const seenTotal = Object.values(seen).reduce((a, x) => a + x.length, 0);

  useBuddyTopic(
    {
      scope: 5,
      hint: 'ลอง Zoom และหมุนดู แล้วกดจุดสีฟ้าบนภาพ — รูปร่าง ช่องเสียบ และชิ้นส่วนพิเศษบอกอะไรเรา?',
      evidence: [`ตรวจจุดสำคัญของชิ้นนี้แล้ว ${seenHere.length}/${spots.length} จุด`, 'Hint ด้านล่างมี 3 ระดับ: ประเภท → หน้าที่ → ลักษณะกายภาพ'],
      lesson: { text: 'การระบุ Hardware ให้ดู 3 อย่าง: รูปร่าง/ขนาด · ช่องเสียบหรือพอร์ต · ชิ้นส่วนเด่น เช่น พัดลม เสาอากาศ จานหมุน' },
    },
    [i, seenHere.length],
  );

  const onSpot = (idx: number) => setSeen((m) => ({ ...m, [s.hw]: (m[s.hw] ?? []).includes(idx) ? m[s.hw] : [...(m[s.hw] ?? []), idx] }));

  const showHint = () => {
    if (hintLv >= 3) return;
    setHintLv((h) => h + 1);
    addHint(5);
  };

  const choose = (id: string) => {
    if (solved) return;
    setPick(id);
    setTries((t) => t + 1);
    const right = id === s.hw;
    if (firstRight.length === i) setFirstRight((f) => [...f, right]);
    if (right) {
      setFb({ kind: 'correct', text: `${hw.en} — ${hw.clues.physical}` });
      addEvidence({ id: `m5-${s.hw}`, type: 'clue', title: `ระบุได้: ${hw.en.split(' (')[0]}`, lines: [`ลักษณะ: ${hw.clues.physical}`, `หน้าที่: ${hw.func}`], mission: 5, hwId: s.hw });
    } else if (seenHere.length < spots.length) {
      setFb({ kind: 'investigate', text: `ยังมีจุดที่ไม่ได้ตรวจอีก ${spots.length - seenHere.length} จุด — ${HW[id].en.split(' (')[0]} มีลักษณะ "${HW[id].clues.physical}" ตรงกับภาพนี้ไหม?` });
    } else {
      setFb({ kind: 'incorrect', text: `${HW[id].en.split(' (')[0]} มีลักษณะ "${HW[id].clues.physical}" — ต่างจากภาพนี้ตรงไหน?` });
    }
  };

  const next = () => {
    setFb(null);
    setPick(null);
    setHintLv(0);
    if (i < SUSPECTS.length - 1) setI(i + 1);
    else setDone(true);
  };

  if (done) {
    return (
      <MissionComplete
        id={5}
        score={{
          accuracy: clamp((firstRight.filter(Boolean).length / SUSPECTS.length) * 100),
          investigation: clamp((seenTotal / totalSpots) * 100),
          reasoning: clamp(100 - (tries - SUSPECTS.length) * 12),
          independence: independence(hints),
        }}
        learned={
          <ul className="space-y-1.5">
            {SUSPECTS.map((x) => (
              <li key={x.hw}><b>{HW[x.hw].en.split(' (')[0]}</b> — {HW[x.hw].clues.physical}</li>
            ))}
          </ul>
        }
      />
    );
  }

  return (
    <MissionFrame
      id={5}
      steps={STEPS}
      step={solved ? 3 : seenHere.length === 0 ? 0 : seenHere.length < spots.length ? 1 : 2}
      brief={<>พบอุปกรณ์ต้องสงสัย <b>{i + 1}/{SUSPECTS.length}</b> ในกล่องอะไหล่ 📦 ใช้ <b>Zoom · Rotate · Inspect</b> ตรวจให้ละเอียดแล้วระบุว่าคืออะไร</>}
    >
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Inspector art={hw.art!} title={`อุปกรณ์ต้องสงสัย #${i + 1}`} seen={seenHere} onSpot={onSpot} revealName={solved ? hw.en : undefined} key={s.hw} />
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <p className="font-display font-bold text-slate-900">Hint ({hintLv}/3)</p>
              <Btn variant="secondary" className="min-h-9 py-1.5 text-sm" onClick={showHint} disabled={hintLv >= 3 || solved}>
                <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" /> ขอคำใบ้
              </Btn>
            </div>
            <ol className="mt-3 space-y-2 text-sm">
              {[
                { lv: 1, t: 'Category Clue', v: hw.clues.category },
                { lv: 2, t: 'Function Clue', v: hw.clues.function },
                { lv: 3, t: 'Physical Clue', v: hw.clues.physical },
              ].map((h) => (
                <li key={h.lv} className={cx('rounded-xl px-3 py-2', hintLv >= h.lv ? 'bg-amber-50 text-amber-900' : 'bg-slate-50 text-slate-400')}>
                  <b>Hint {h.lv} · {h.t}:</b> {hintLv >= h.lv ? h.v : '🔒'}
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <p className="font-display font-bold text-slate-900">Identify · อุปกรณ์นี้คือ?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {s.options.map((id) => (
                <button
                  key={id}
                  onClick={() => choose(id)}
                  className={cx('min-h-12 rounded-2xl px-3 py-2 text-sm font-bold ring-2', pick === id ? (id === s.hw ? 'bg-emerald-50 ring-emerald-400' : 'bg-rose-50 ring-rose-300') : 'bg-slate-50 ring-transparent hover:ring-slate-200', solved && pick !== id && 'opacity-50')}
                >
                  {HW[id].en.split(' (')[0]}
                  <span className="block text-xs font-normal text-slate-500">{HW[id].name}</span>
                </button>
              ))}
            </div>
          </Card>
          {fb && <Feedback kind={fb.kind}>{fb.text}</Feedback>}
          {solved && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Btn className="w-full" onClick={next}>{i < SUSPECTS.length - 1 ? 'อุปกรณ์ถัดไป' : 'สรุปภารกิจ'} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>
            </motion.div>
          )}
        </div>
      </div>
    </MissionFrame>
  );
}

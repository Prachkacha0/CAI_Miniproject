import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BadgeCheck, Lightbulb, ScanSearch, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { HW } from '../data/hardware';
import { HardwareArt } from '../components/HardwareArt';
import { Btn, Card, Feedback, cx, type FeedbackKind } from '../components/ui';
import { useBuddyTopic } from '../components/Buddy';
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

const STEPS = ['อ่านแฟ้มคดี', 'เปิดเบาะแส', 'ระบุชิ้นส่วน', 'เก็บแต้ม'];

export function Mission5() {
  const { addEvidence, addHint } = useStore();
  const hints = useMissionHints(5);
  const [i, setI] = useState(0);
  const [clueLevels, setClueLevels] = useState<Record<string, number>>({});
  const [pick, setPick] = useState<string | null>(null);
  const [firstRight, setFirstRight] = useState<boolean[]>([]);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [tries, setTries] = useState(0);
  const [fb, setFb] = useState<{ kind: FeedbackKind; text: string } | null>(null);
  const [done, setDone] = useState(false);
  const s = SUSPECTS[i];
  const hw = HW[s.hw];
  const solved = pick === s.hw;
  const clueLevel = clueLevels[s.hw] ?? 0;
  const cluesUsed = Object.values(clueLevels).reduce((a, level) => a + level, 0);
  const clueOrder = [hw.clues.physical, hw.clues.function, hw.clues.category];

  useBuddyTopic(
    {
      scope: 5,
      hint: 'เปิดหลักฐานทีละใบแล้วเทียบลักษณะกับชิ้นส่วนบนแผงอะไหล่ — จุดสังเกตสำคัญคืออะไร?',
      evidence: [`คดี ${i + 1}/${SUSPECTS.length}`, `เปิดเบาะแสแล้ว ${clueLevel + 1}/3 ใบ · ตอบถูกครั้งแรก ${firstRight.filter(Boolean).length} คดี`],
      lesson: { text: 'นักสืบฮาร์ดแวร์ควรเทียบลักษณะภายนอก หน้าที่ และประเภทการทำงานร่วมกัน ไม่เดาจากชื่ออย่างเดียว' },
    },
    [i, clueLevel, firstRight.length],
  );

  const showHint = () => {
    if (clueLevel >= 2 || solved) return;
    setClueLevels((levels) => ({ ...levels, [s.hw]: Math.min(2, (levels[s.hw] ?? 0) + 1) }));
    addHint(5);
  };

  const choose = (id: string) => {
    if (solved) return;
    setPick(id);
    setTries((t) => t + 1);
    const right = id === s.hw;
    if (firstRight.length === i) setFirstRight((f) => [...f, right]);
    if (right) {
      setCombo(combo + 1);
      setBestCombo(Math.max(bestCombo, combo + 1));
      setFb({ kind: 'correct', text: `${hw.en} — ${hw.clues.physical}` });
      addEvidence({ id: `m5-${s.hw}`, type: 'clue', title: `ระบุได้: ${hw.en.split(' (')[0]}`, lines: [`ลักษณะ: ${hw.clues.physical}`, `หน้าที่: ${hw.func}`], mission: 5, hwId: s.hw });
    } else if (clueLevel < 2) {
      setCombo(0);
      const nextLevel = clueLevel + 1;
      setClueLevels((levels) => ({ ...levels, [s.hw]: nextLevel }));
      setFb({ kind: 'investigate', text: `หลักฐานชิ้นถัดไปเปิดแล้ว: ${nextLevel === 1 ? hw.clues.function : hw.clues.category} ลองเทียบใหม่!` });
    } else {
      setCombo(0);
      setFb({ kind: 'incorrect', text: `${HW[id].en.split(' (')[0]} ทำหน้าที่ว่า “${HW[id].func}” ลองเทียบกับหลักฐานทั้งสามใบอีกครั้ง` });
    }
  };

  const next = () => {
    setFb(null);
    setPick(null);
    if (i < SUSPECTS.length - 1) setI(i + 1);
    else setDone(true);
  };

  if (done) {
    return (
      <MissionComplete
        id={5}
        score={{
          accuracy: clamp((firstRight.filter(Boolean).length / SUSPECTS.length) * 85 + bestCombo * 2.5),
          investigation: clamp(100 - cluesUsed * 8),
          reasoning: clamp(100 - (tries - SUSPECTS.length) * 15),
          independence: independence(hints),
        }}
        meta={{ bestDetectiveStreak: bestCombo, clueScans: cluesUsed }}
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
      step={solved ? 3 : clueLevel === 0 ? 0 : 1}
      brief={<>เกมนักสืบอะไหล่ <b>คดี {i + 1}/{SUSPECTS.length}</b> อ่านแฟ้มหลักฐาน เปิดคำใบ้เท่าที่จำเป็น แล้วเลือกชิ้นส่วนให้ถูกเพื่อรักษาคะแนนโบนัส</>}
    >
      <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white ring-0">
          <div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-bold text-cyan-200"><ScanSearch className="h-4 w-4" /> CASE FILE</span><span className="font-mono text-sm text-indigo-200">{String(i + 1).padStart(2, '0')} / {SUSPECTS.length}</span></div>
          <div className="mt-3 rounded-2xl bg-white p-3 shadow-inner"><HardwareArt art={hw.art!} title={`ภาพอุปกรณ์ต้องสงสัยคดี ${i + 1}`} className="mx-auto h-32 w-full max-w-sm" /><p className="text-center text-xs font-bold tracking-wide text-slate-500">ภาพหลักฐานอุปกรณ์ · ระบุจากรูปร่างและหน้าที่</p></div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-bold tracking-[.18em] text-amber-300">หลักฐานตั้งต้น · รูปร่างและจุดสังเกต</p>
            <p className="mt-2 text-lg font-semibold leading-relaxed">{clueOrder[0]}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[1, 2].map((level) => <div key={level} className={cx('min-h-20 rounded-2xl border p-3 transition', clueLevel >= level ? 'border-cyan-300/40 bg-cyan-300/10' : 'border-white/10 bg-black/10')}><p className="text-[11px] font-bold uppercase tracking-wide text-cyan-200">{level === 1 ? 'หน้าที่' : 'ประเภท'}</p><p className="mt-1 text-sm leading-relaxed text-indigo-50">{clueLevel >= level ? clueOrder[level] : 'ยังไม่เปิดหลักฐาน'}</p></div>)}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 text-sm text-indigo-100"><span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-300" /> ตอบถูกโดยใช้เบาะแสน้อย ได้คะแนนเหตุผลสูงกว่า</span><span className="rounded-full bg-amber-300/15 px-2.5 py-1 font-bold text-amber-200">Combo ×{combo}</span></div>
        </Card>
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <div><p className="font-display font-bold text-slate-900">คลังเบาะแส</p><p className="text-xs text-slate-500">หลักฐานตั้งต้นเปิดให้แล้ว · ใช้สแกนเพิ่มได้อีก {2 - clueLevel} ครั้ง</p></div>
              <Btn variant="secondary" className="min-h-11 py-2 text-sm" onClick={showHint} disabled={clueLevel >= 2 || solved}>
                <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" /> สแกนหลักฐาน
              </Btn>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all" style={{ width: `${((clueLevel + 1) / 3) * 100}%` }} /></div>
          </Card>
          <Card>
            <p className="flex items-center gap-2 font-display font-bold text-slate-900"><BadgeCheck className="h-5 w-5 text-indigo-500" /> แผงอะไหล่ · อุปกรณ์ใดตรงกับหลักฐาน?</p>
            <p className="mt-1 text-sm text-slate-500">เลือกชิ้นส่วนที่ตรงที่สุด หากพลาดจะเปิดหลักฐานเพิ่มให้อัตโนมัติ</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {s.options.map((id) => (
                <button
                  key={id}
                  onClick={() => choose(id)}
                  disabled={solved}
                  className={cx('min-h-16 rounded-2xl px-3 py-2 text-sm font-bold ring-2 transition active:scale-[.98]', pick === id ? (id === s.hw ? 'bg-emerald-50 ring-emerald-400' : 'bg-rose-50 ring-rose-300') : 'cursor-pointer bg-slate-50 ring-transparent hover:ring-slate-200', solved && pick !== id && 'opacity-50')}
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

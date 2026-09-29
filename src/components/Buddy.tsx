import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, FileSearch, Lightbulb, X } from 'lucide-react';
import type { MissionId } from '../types';
import { HW } from '../data/hardware';
import { useStore } from '../store';
import { cx } from './ui';
import { BuddyBot } from './BuddyBot';

/**
 * AI Buddy: a text-only learning assistant with three levels.
 * Content is authored per screen as guiding questions — never the direct answer.
 */
export interface BuddyTopic {
  scope: MissionId | 'final' | null;
  hint: string;
  evidence: string[];
  lesson: { text: string; hw?: string[] };
}

const DEFAULT: BuddyTopic = {
  scope: null,
  hint: 'อยากเริ่มจากตรงไหนดี? ลองเลือก Mission ที่ขึ้นว่า Available หรือแวะ Learning Center ก่อนก็ได้นะ',
  evidence: ['หลักฐานทุกชิ้นที่เก็บได้อยู่ใน Evidence Board — กดดูได้ตลอดเวลา'],
  lesson: { text: 'Hardware แบ่งเป็น 5 กลุ่ม: Input · Processing · Storage · Output · Communication ข้อมูลจะไหลผ่านกลุ่มเหล่านี้ตามลำดับ' },
};

const Ctx = createContext<{ set: (t: BuddyTopic | null) => void; topic: BuddyTopic } | null>(null);

export function BuddyProvider({ children }: { children: ReactNode }) {
  const [topic, setTopic] = useState<BuddyTopic | null>(null);
  return (
    <Ctx.Provider value={{ set: setTopic, topic: topic ?? DEFAULT }}>
      {children}
      <BuddyWidget />
    </Ctx.Provider>
  );
}

/** Register the Buddy content for the current screen/step. */
export function useBuddyTopic(topic: BuddyTopic, deps: unknown[]) {
  const ctx = useContext(Ctx);
  useEffect(() => {
    ctx?.set(topic);
    return () => ctx?.set(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

type Level = 'hint' | 'evidence' | 'lesson';

function BuddyWidget() {
  const ctx = useContext(Ctx)!;
  const { addHint, noteBuddy, go, route } = useStore();
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<Level | null>(null);
  const t = ctx.topic;

  // Reset the opened level when the topic changes (new step).
  useEffect(() => setLevel(null), [t]);

  if (route.name === 'start' || route.name === 'certificate' || route.name === 'builder') return null;

  const reveal = (l: Level) => {
    if (level !== l) {
      if (t.scope) addHint(t.scope);
      else noteBuddy();
    }
    setLevel(l);
  };

  const levels: { id: Level; th: string; en: string; Icon: typeof Lightbulb; cls: string }[] = [
    { id: 'hint', th: 'คำใบ้', en: 'HINT', Icon: Lightbulb, cls: 'text-amber-600 bg-amber-50 ring-amber-200' },
    { id: 'evidence', th: 'ชี้หลักฐาน', en: 'EVIDENCE', Icon: FileSearch, cls: 'text-sky-600 bg-sky-50 ring-sky-200' },
    { id: 'lesson', th: 'บทเรียนย่อ', en: 'MINI LESSON', Icon: BookOpen, cls: 'text-violet-600 bg-violet-50 ring-violet-200' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 print:hidden">
      <AnimatePresence>
        {open && (
          <motion.section
            aria-label="AI Buddy"
            className="w-[min(22rem,calc(100vw-2rem))] rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-slate-200"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
          >
            <div className="mb-3 flex items-center gap-2">
              <BuddyBot className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-slate-900">AI Buddy</p>
                <p className="text-xs text-slate-500">ผู้ช่วยคิด ไม่ใช่ผู้เฉลย 😉</p>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100" aria-label="ปิด AI Buddy">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {levels.map((l) => (
                <button
                  key={l.id}
                  onClick={() => reveal(l.id)}
                  aria-pressed={level === l.id}
                  className={cx('flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-xs font-bold ring-1 transition', l.cls, level === l.id ? 'ring-2' : 'opacity-80 hover:opacity-100')}
                >
                  <l.Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{l.th}</span>
                  <span className="text-[10px] tracking-wide opacity-70">{l.en}</span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {level && (
                <motion.div key={level} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                  {level === 'hint' && <p>💭 {t.hint}</p>}
                  {level === 'evidence' && (
                    <ul className="space-y-1.5">
                      {t.evidence.map((e) => (
                        <li key={e} className="flex gap-2">
                          <span aria-hidden="true">🔎</span>
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {level === 'lesson' && (
                    <div className="space-y-2">
                      <p>📘 {t.lesson.text}</p>
                      {t.lesson.hw && (
                        <div className="flex flex-wrap gap-1.5">
                          {t.lesson.hw.map((id) => (
                            <button key={id} onClick={() => go({ name: 'learn', hw: id })} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50">
                              เปิดการ์ด {HW[id]?.en.split(' (')[0] ?? id} →
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {!level && <p className="mt-3 text-center text-xs text-slate-500">เลือกระดับความช่วยเหลือ เริ่มจาก "คำใบ้" ก่อนนะ</p>}
          </motion.section>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-expanded={open}
        aria-label="เปิด AI Buddy"
        className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 font-semibold text-slate-700 shadow-xl ring-1 ring-slate-200"
      >
        <BuddyBot className="h-10 w-10" />
        <span className="hidden sm:inline">AI Buddy</span>
      </motion.button>
    </div>
  );
}

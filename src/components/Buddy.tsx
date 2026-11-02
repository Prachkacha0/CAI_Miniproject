import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, FileSearch, Lightbulb, LoaderCircle, MessageCircle, RefreshCw, Send, Trash2, X } from 'lucide-react';
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
type BuddyMode = 'guide' | 'chat';
type ChatMessage = { role: 'user' | 'assistant'; content: string };

function chatClientId() {
  const fallback = 'browser-client';
  try {
    const key = 'hardware-quest.ai-client';
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const created = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, created);
    return created;
  } catch { return fallback; }
}

function BuddyWidget() {
  const ctx = useContext(Ctx)!;
  const { addHint, noteBuddy, go, route } = useStore();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<BuddyMode>('guide');
  const [level, setLevel] = useState<Level | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const countedChatContexts = useRef(new Set<string>());
  const t = ctx.topic;

  // Reset the opened level when the topic changes (new step).
  useEffect(() => setLevel(null), [t]);
  useEffect(() => {
    if (!open || mode !== 'chat') return;
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open, mode]);
  useEffect(() => () => abortRef.current?.abort(), []);

  if (route.name === 'start' || route.name === 'certificate') return null;

  const reveal = (l: Level) => {
    if (level !== l) {
      if (t.scope) addHint(t.scope);
      else noteBuddy();
    }
    setLevel(l);
  };

  const countAiHelp = () => {
    const key = `${route.name}:${t.scope ?? 'global'}:${t.hint}`;
    if (countedChatContexts.current.has(key)) return;
    countedChatContexts.current.add(key);
    if (t.scope) addHint(t.scope);
    else noteBuddy();
  };

  const requestAi = async (history: ChatMessage[]) => {
    setLoading(true);
    setError('');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-HQ-Client': chatClientId() },
        body: JSON.stringify({
          messages: history.slice(-10),
          context: {
            screen: route.name,
            scope: t.scope,
            hint: t.hint,
            evidence: t.evidence,
            lesson: t.lesson.text,
          },
        }),
        signal: controller.signal,
      });
      const raw = await response.text();
      let data: { reply?: string; error?: string } = {};
      try { data = JSON.parse(raw) as { reply?: string; error?: string }; } catch { /* Gateway errors may be HTML. */ }
      if (!response.ok || !data.reply) throw new Error(data.error || 'AI Buddy ไม่สามารถตอบได้ในขณะนี้');
      setMessages((current) => [...current, { role: 'assistant', content: data.reply! }]);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === 'AbortError') return;
      setError(requestError instanceof Error ? requestError.message : 'AI Buddy ขัดข้องชั่วคราว');
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    const history = [...messages, { role: 'user' as const, content: question }];
    setMessages(history);
    setInput('');
    countAiHelp();
    void requestAi(history);
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError('');
    setLoading(false);
  };

  const levels: { id: Level; th: string; en: string; Icon: typeof Lightbulb; cls: string }[] = [
    { id: 'hint', th: 'คำใบ้', en: 'HINT', Icon: Lightbulb, cls: 'text-amber-600 bg-amber-50 ring-amber-200' },
    { id: 'evidence', th: 'ชี้หลักฐาน', en: 'EVIDENCE', Icon: FileSearch, cls: 'text-sky-600 bg-sky-50 ring-sky-200' },
    { id: 'lesson', th: 'บทเรียนย่อ', en: 'MINI LESSON', Icon: BookOpen, cls: 'text-violet-600 bg-violet-50 ring-violet-200' },
  ];

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-3 print:hidden">
      <AnimatePresence>
        {open && (
          <motion.section
            aria-label="AI Buddy"
            className="flex max-h-[min(44rem,calc(100vh-6.5rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-slate-200"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
          >
            <div className="mb-3 flex items-center gap-2">
              <BuddyBot className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-slate-900">AI Buddy</p>
                <p className="text-xs text-slate-500">ผู้ช่วยคิดและติวฮาร์ดแวร์ด้วย Typhoon</p>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-11 w-11 cursor-pointer place-items-center rounded-full transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500" aria-label="ปิด AI Buddy">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-3 grid grid-cols-2 rounded-2xl bg-slate-100 p-1" role="group" aria-label="รูปแบบผู้ช่วย">
              <button type="button" aria-pressed={mode === 'guide'} onClick={() => setMode('guide')} className={cx('flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500', mode === 'guide' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800')}><Lightbulb className="h-4 w-4" /> ช่วยตามด่าน</button>
              <button type="button" aria-pressed={mode === 'chat'} onClick={() => setMode('chat')} className={cx('flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500', mode === 'chat' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800')}><MessageCircle className="h-4 w-4" /> ถาม AI</button>
            </div>

            {mode === 'guide' ? <div className="min-h-0 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {levels.map((l) => (
                  <button key={l.id} onClick={() => reveal(l.id)} aria-pressed={level === l.id} className={cx('flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-xs font-bold ring-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500', l.cls, level === l.id ? 'ring-2' : 'opacity-80 hover:opacity-100')}>
                    <l.Icon className="h-5 w-5" aria-hidden="true" /><span>{l.th}</span><span className="text-[10px] tracking-wide opacity-70">{l.en}</span>
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {level && (
                  <motion.div key={level} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                    {level === 'hint' && <p className="flex gap-2"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> <span>{t.hint}</span></p>}
                    {level === 'evidence' && <ul className="space-y-2">{t.evidence.map((e) => <li key={e} className="flex gap-2"><FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" /><span>{e}</span></li>)}</ul>}
                    {level === 'lesson' && <div className="space-y-2"><p className="flex gap-2"><BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" /><span>{t.lesson.text}</span></p>{t.lesson.hw && <div className="flex flex-wrap gap-1.5">{t.lesson.hw.map((id) => <button key={id} onClick={() => go({ name: 'learn', hw: id })} className="min-h-11 cursor-pointer rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500">เปิดการ์ด {HW[id]?.en.split(' (')[0] ?? id} →</button>)}</div>}</div>}
                  </motion.div>
                )}
              </AnimatePresence>
              {!level && <p className="mt-3 text-center text-xs text-slate-500">เลือกระดับความช่วยเหลือ โดยเริ่มจากคำใบ้ได้เลย</p>}
            </div> : <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-500">ถามเกี่ยวกับด่านนี้หรือฮาร์ดแวร์</p>
                {messages.length > 0 && <button type="button" onClick={clearChat} className="flex min-h-11 cursor-pointer items-center gap-1 rounded-xl px-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500" aria-label="ล้างบทสนทนา"><Trash2 className="h-4 w-4" /> ล้าง</button>}
              </div>
              <div ref={logRef} role="log" aria-live="polite" aria-busy={loading} aria-label="บทสนทนากับ AI Buddy" className="min-h-40 flex-1 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-3 text-sm">
                {messages.length === 0 && <div className="rounded-2xl border border-indigo-100 bg-white p-3 text-slate-700"><p className="font-bold text-indigo-700">ลองถาม AI Buddy</p><p className="mt-1 leading-relaxed">เช่น “RAM กับ SSD ต่างกันอย่างไร” หรือ “ช่วยใบ้สิ่งที่ต้องสังเกตในด่านนี้”</p></div>}
                {messages.map((message, index) => <div key={`${message.role}-${index}`} className={cx('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}><div className={cx('max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 leading-relaxed', message.role === 'user' ? 'rounded-br-md bg-indigo-600 text-white' : 'rounded-bl-md bg-white text-slate-700 ring-1 ring-slate-200')}>{message.content}</div></div>)}
                {loading && <div className="flex items-center gap-2 text-slate-500" role="status"><LoaderCircle className="h-4 w-4 animate-spin text-indigo-600" /> AI Buddy กำลังคิด...</div>}
              </div>
              {error && <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert"><span>{error}</span><button type="button" disabled={loading || messages.at(-1)?.role !== 'user'} onClick={() => void requestAi(messages)} className="flex min-h-11 shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 font-bold transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" /> ลองใหม่</button></div>}
              <form onSubmit={submitQuestion} className="mt-3">
                <label htmlFor="buddy-question" className="mb-1 block text-xs font-bold text-slate-700">คำถามของคุณ</label>
                <div className="flex items-end gap-2">
                  <textarea ref={inputRef} id="buddy-question" value={input} readOnly={loading} aria-busy={loading} maxLength={600} rows={2} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="พิมพ์คำถามเกี่ยวกับฮาร์ดแวร์..." className="min-h-12 min-w-0 flex-1 resize-none rounded-2xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 read-only:bg-slate-100" />
                  <button type="submit" disabled={loading || !input.trim()} className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-2xl bg-indigo-600 text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300" aria-label="ส่งคำถาม"><Send className="h-5 w-5" /></button>
                </div>
                <p className="mt-1 text-right text-xs text-slate-500">{input.length}/600 · Enter เพื่อส่ง</p>
              </form>
            </div>}
          </motion.section>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-expanded={open}
        aria-label="เปิด AI Buddy"
        className="flex min-h-12 cursor-pointer items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 font-semibold text-slate-700 shadow-xl ring-1 ring-slate-200 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
      >
        <BuddyBot className="h-10 w-10" />
        <span className="hidden sm:inline">AI Buddy</span>
      </motion.button>
    </div>
  );
}

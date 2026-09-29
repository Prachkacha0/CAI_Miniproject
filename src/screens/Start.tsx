import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, TriangleAlert } from 'lucide-react';
import { useStore } from '../store';
import { Btn } from '../components/ui';
import { BuddyBot } from '../components/BuddyBot';

export function Start() {
  const { setPlayer, go, state } = useStore();
  const [name, setName] = useState(state.player?.name ?? '');
  const [group, setGroup] = useState(state.player?.group ?? '');
  const ok = name.trim().length >= 2;

  const begin = () => {
    if (!ok) return;
    setPlayer(name.trim(), group.trim());
    go(state.preTest ? { name: 'home' } : { name: 'pretest' });
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_#312e81,_#0f172a_70%)] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(#6366f1_1px,transparent_1px),linear-gradient(90deg,#6366f1_1px,transparent_1px)] [background-size:40px_40px]" aria-hidden="true" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-lg">
        <motion.div
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-sm font-bold text-rose-200 ring-1 ring-rose-400/40"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          <TriangleAlert className="h-4 w-4" aria-hidden="true" /> INCOMING CASE · ระบบขัดข้อง
        </motion.div>
        <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
          HARDWARE QUEST
          <span className="block bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">SYSTEM FAILURE</span>
        </h1>
        <p className="mt-2 text-lg text-indigo-100">ภารกิจกู้ระบบคอมพิวเตอร์</p>

        <div className="mt-6 flex gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
          <BuddyBot className="h-14 w-14 shrink-0" mood="happy" />
          <p className="text-sm leading-relaxed text-indigo-50">
            สวัสดี! ฉันคือ <b>AI Buddy</b> 🤖 ห้องคอมพิวเตอร์ของวิทยาลัยมีปัญหาหลายเครื่อง
            เราต้องการ <b>Junior Computer Technician</b> มาช่วยสืบสวนและกู้ระบบ — ลงทะเบียนเพื่อรับแฟ้มคดีได้เลย
          </p>
        </div>

        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            begin();
          }}
        >
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-indigo-100">ชื่อ-นามสกุล (ใช้บน Certificate)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 w-full rounded-2xl bg-white px-4 text-slate-900 outline-none ring-2 ring-transparent focus:ring-cyan-400"
              placeholder="เช่น สมชาย ใจดี"
              autoComplete="name"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-indigo-100">ห้อง / กลุ่มเรียน (ไม่บังคับ)</span>
            <input
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="h-12 w-full rounded-2xl bg-white px-4 text-slate-900 outline-none ring-2 ring-transparent focus:ring-cyan-400"
              placeholder="เช่น ปวช.1/2"
            />
          </label>
          <Btn type="submit" disabled={!ok} className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 py-3 text-lg">
            รับแฟ้มคดี · Start <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Btn>
        </form>
        <p className="mt-4 text-center text-xs text-indigo-200/80">ความคืบหน้าบันทึกไว้ในเบราว์เซอร์เครื่องนี้</p>
      </motion.div>
    </div>
  );
}

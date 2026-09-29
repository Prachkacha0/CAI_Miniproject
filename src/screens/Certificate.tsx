import { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Award, CircleCheck, CircleDashed, Printer } from 'lucide-react';
import { certRequirements, certUnlocked, useStore } from '../store';
import { OBJECTIVES } from '../data/missions';
import { Btn, Card, cx } from '../components/ui';
import { Shell } from '../components/Shell';

export function Certificate() {
  const { state, issueCertificate, go } = useStore();
  const reqs = certRequirements(state);
  const unlocked = certUnlocked(state);

  useEffect(() => {
    if (unlocked && !state.certificate) {
      issueCertificate();
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.35 }, colors: ['#fbbf24', '#6366f1', '#22d3ee'] });
    }
  }, [unlocked, state.certificate, issueCertificate]);

  if (!unlocked || !state.certificate) {
    const done = reqs.filter((r) => r.done).length;
    return (
      <Shell title="Certificate · ใบประกาศ">
        <div className="mx-auto max-w-xl space-y-4">
          <Card className="text-center">
            <Award className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
            <p className="mt-2 font-display text-xl font-bold text-slate-900">CERTIFICATE LOCKED</p>
            <p className="text-sm text-slate-500">ผ่าน Core Learning Requirements ครบ {reqs.length} ข้อ เพื่อปลดล็อก ({done}/{reqs.length})</p>
          </Card>
          <Card>
            <ul className="space-y-2">
              {reqs.map((r) => (
                <li key={r.label} className={cx('flex items-center gap-3 rounded-2xl px-3 py-2.5', r.done ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-slate-500')}>
                  {r.done ? <CircleCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" /> : <CircleDashed className="h-5 w-5" aria-hidden="true" />}
                  <span className="font-semibold">{r.label}</span>
                  <span className="sr-only">{r.done ? 'ผ่านแล้ว' : 'ยังไม่ผ่าน'}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">ไม่จำเป็นต้องเก็บ Evidence 100%, ใช้ AI Buddy, เข้า Hardware Lab ครบ หรือได้คะแนนเต็ม</p>
          </Card>
          <div className="flex justify-end"><Btn onClick={() => go({ name: 'home' })}>กลับหน้าหลัก</Btn></div>
        </div>
      </Shell>
    );
  }

  const date = new Date(state.certificate.at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Shell title="CERTIFICATE UNLOCKED">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ type: 'spring', stiffness: 90 }}
          className="certificate relative overflow-hidden rounded-3xl bg-white p-2 shadow-2xl ring-1 ring-slate-200"
        >
          <div className="relative rounded-[1.25rem] border-4 border-double border-amber-400 bg-[radial-gradient(ellipse_at_top,_#fffbeb,_#ffffff_60%)] px-6 py-10 text-center sm:px-14">
            <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#4f46e5_1px,transparent_1px),linear-gradient(90deg,#4f46e5_1px,transparent_1px)] [background-size:28px_28px]" aria-hidden="true" />
            <div className="relative">
              <Award className="mx-auto h-14 w-14 text-amber-500" aria-hidden="true" />
              <p className="mt-2 text-xs font-bold tracking-[0.35em] text-amber-600">CERTIFICATE OF COMPLETION</p>
              <p className="mt-1 text-sm text-slate-500">ใบประกาศนียบัตรผู้ผ่านเส้นทางการเรียนรู้</p>
              <p className="mt-6 text-sm text-slate-500">มอบให้แก่</p>
              <p className="mt-1 font-display text-3xl font-bold text-slate-900 sm:text-4xl">{state.player?.name}</p>
              {state.player?.group && <p className="text-sm text-slate-500">{state.player.group}</p>}
              <p className="mx-auto mt-5 max-w-lg text-slate-700">
                ได้ผ่านเส้นทางการเรียนรู้ของสื่อการเรียนรู้เชิงเกม
              </p>
              <p className="mt-1 font-display text-xl font-extrabold tracking-wide text-indigo-700">HARDWARE QUEST: SYSTEM FAILURE</p>
              <p className="text-sm text-slate-500">ภารกิจกู้ระบบคอมพิวเตอร์ · องค์ประกอบของระบบคอมพิวเตอร์ (Hardware)</p>
              <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-1.5">
                {Object.values(OBJECTIVES).map((o) => (
                  <span key={o.en} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">✓ {o.en}</span>
                ))}
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Completion Date</p>
                  <p className="font-semibold text-slate-800">{date}</p>
                </div>
                <div>
                  <p className="text-slate-400">Certificate ID</p>
                  <p className="font-mono font-semibold text-slate-800">{state.certificate.id}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        <div className="mt-5 flex flex-wrap justify-center gap-3 print:hidden">
          <Btn onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden="true" /> พิมพ์ / บันทึก PDF</Btn>
          <Btn variant="secondary" onClick={() => go({ name: 'progress' })}>ดูความก้าวหน้า</Btn>
          <Btn variant="secondary" onClick={() => go({ name: 'home' })}>หน้าหลัก</Btn>
        </div>
      </div>
    </Shell>
  );
}

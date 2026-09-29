import { motion } from 'motion/react';
import { Award, BookOpen, ChartColumnBig, ClipboardList, Cpu, FlaskConical, FolderOpen, Map, NotebookPen, Play, RotateCcw, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { allMissionsDone, certUnlocked, currentStep, earnedBadges, missionStatus, testPassed, useStore, type Route } from '../store';
import { MISSIONS, BADGES } from '../data/missions';
import { Bar, Btn, Card, cx } from '../components/ui';
import { Shell } from '../components/Shell';
import { Ico } from '../components/icons';
import { BuddyBot } from '../components/BuddyBot';
import { useBuddyTopic } from '../components/Buddy';

export function Home() {
  const { state, go, reset } = useStore();
  const done = MISSIONS.filter((m) => state.missions[m.id].completed).length;
  const step = currentStep(state);
  const badges = earnedBadges(state);

  useBuddyTopic(
    {
      scope: null,
      hint: `ภารกิจถัดไปของคุณคือ "${step.label}" — กด Continue Mission เพื่อไปต่อได้เลย`,
      evidence: [`ตอนนี้มีหลักฐาน ${state.evidence.length} ชิ้นใน Evidence Board`, 'หลักฐานจาก Mission ก่อนหน้าช่วยได้ใน Final Case'],
      lesson: { text: 'ติดตรงไหน แวะ Learning Center ได้ทุกเมื่อ หรือเข้า Hardware Lab เพื่อส่องอุปกรณ์ใกล้ ๆ' },
    },
    [step.label, state.evidence.length],
  );

  const tiles: { label: string; en: string; Icon: typeof BookOpen; route: Route; cls: string; locked?: boolean; note?: string }[] = [
    { label: 'ประกอบคอม', en: 'PC Build Lab', Icon: Cpu, route: { name: 'builder' }, cls: 'from-rose-500 to-orange-500', note: 'NEW' },
    { label: 'แผนที่ภารกิจ', en: 'Mission Map', Icon: Map, route: { name: 'map' }, cls: 'from-indigo-500 to-blue-500' },
    { label: 'คลังความรู้', en: 'Learning Center', Icon: BookOpen, route: { name: 'learn' }, cls: 'from-violet-500 to-fuchsia-500' },
    { label: 'ห้องแล็บ', en: 'Hardware Lab', Icon: FlaskConical, route: { name: 'lab' }, cls: 'from-cyan-500 to-teal-500' },
    { label: 'กระดานหลักฐาน', en: 'Evidence Board', Icon: FolderOpen, route: { name: 'evidence' }, cls: 'from-sky-500 to-cyan-500', note: `${state.evidence.length} ชิ้น` },
    { label: 'ความก้าวหน้า', en: 'Progress', Icon: ChartColumnBig, route: { name: 'progress' }, cls: 'from-emerald-500 to-teal-500' },
    { label: 'แบบประเมิน', en: 'Assessment', Icon: ClipboardList, route: state.finalCase.completed ? { name: 'posttest' } : { name: 'pretest' }, cls: 'from-amber-500 to-orange-500', note: state.finalCase.completed ? (testPassed(state.postTestBest) ? 'Post-Test ผ่านแล้ว' : 'Post-Test') : state.preTest ? `Pre-Test ${state.preTest.score}/${state.preTest.total}` : 'Pre-Test' },
    { label: 'สะท้อนการเรียนรู้', en: 'Reflection', Icon: NotebookPen, route: { name: 'reflection' }, cls: 'from-rose-500 to-pink-500', locked: !testPassed(state.postTestBest), note: state.reflection ? 'ทำแล้ว' : undefined },
    { label: 'ใบประกาศ', en: 'Certificate', Icon: Award, route: { name: 'certificate' }, cls: 'from-yellow-500 to-amber-500', note: certUnlocked(state) ? 'UNLOCKED' : 'ดูเงื่อนไข' },
  ];

  return (
    <Shell title="HARDWARE QUEST" subtitle="SYSTEM FAILURE · ภารกิจกู้ระบบคอมพิวเตอร์">
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Current case */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_top_left,_#4f46e5,_#1e1b4b)] p-6 text-white shadow-xl">
          <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:linear-gradient(#a5b4fc_1px,transparent_1px),linear-gradient(90deg,#a5b4fc_1px,transparent_1px)] [background-size:32px_32px]" aria-hidden="true" />
          <div className="relative">
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-300">CURRENT CASE</p>
            <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{step.label}</h2>
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-sm text-indigo-100">
                <span>Mission Progress</span>
                <span className="tabular-nums font-bold">{done}/6</span>
              </div>
              <Bar value={(done / 6) * 100} color="bg-gradient-to-r from-cyan-400 to-emerald-400" className="bg-white/15" label="ความคืบหน้าภารกิจ" />
              <div className="mt-3 flex gap-1.5" aria-hidden="true">
                {MISSIONS.map((m) => {
                  const st = missionStatus(state, m.id);
                  return (
                    <div key={m.id} className={cx('grid h-9 flex-1 place-items-center rounded-xl text-xs font-bold', st === 'completed' ? 'bg-emerald-400 text-emerald-950' : st === 'available' ? 'bg-white text-indigo-900' : 'bg-white/10 text-indigo-200')}>
                      {st === 'completed' ? '✓' : st === 'locked' ? '🔒' : `0${m.id}`}
                    </div>
                  );
                })}
                <div className={cx('grid h-9 flex-1 place-items-center rounded-xl text-[10px] font-bold', state.finalCase.completed ? 'bg-emerald-400 text-emerald-950' : allMissionsDone(state) ? 'bg-rose-400 text-white' : 'bg-white/10 text-indigo-200')}>FINAL</div>
              </div>
            </div>
            <Btn onClick={() => go(step.route)} className="mt-6 bg-gradient-to-r from-cyan-400 to-emerald-400 text-lg text-slate-900 shadow-cyan-500/30">
              <Play className="h-5 w-5" aria-hidden="true" /> Continue Mission
            </Btn>
          </div>
        </motion.div>

        {/* Player profile */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-2xl font-bold text-white">
              {state.player?.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold text-slate-900">{state.player?.name}</p>
              <p className="text-sm text-slate-500">Junior Computer Technician{state.player?.group ? ` · ${state.player.group}` : ''}</p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Missions" value={`${done}/6`} />
            <Stat label="Evidence" value={state.evidence.length} />
            <Stat label="Badges" value={`${badges.length}/${BADGES.length}`} />
          </dl>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {BADGES.map((b) => {
              const got = badges.includes(b.id);
              return (
                <span key={b.id} title={b.desc} className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', got ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400')}>
                  <Ico name={b.icon} className="h-3.5 w-3.5" />
                  {b.name}
                  <span className="sr-only">{got ? '(ได้รับแล้ว)' : '(ยังไม่ได้รับ)'}</span>
                </span>
              );
            })}
          </div>
          <div className="mt-auto flex items-end gap-2 pt-4">
            <BuddyBot className="h-10 w-10 shrink-0" />
            <p className="rounded-2xl rounded-bl-sm bg-indigo-50 px-3 py-2 text-sm text-indigo-900">ติดปัญหาเมื่อไหร่ กดเรียกฉันที่มุมขวาล่างได้เลย!</p>
          </div>
        </Card>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => go({ name: 'builder' })}
        className="group relative mt-6 w-full cursor-pointer overflow-hidden rounded-3xl bg-[#0b1220] p-5 text-left text-white shadow-xl ring-1 ring-cyan-300/20 transition hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 sm:p-6"
      >
        <span className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(#67e8f9_1px,transparent_1px),linear-gradient(90deg,#67e8f9_1px,transparent_1px)] [background-size:24px_24px]" />
        <span className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <span className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20"><Wrench className="h-7 w-7" /></span>
            <span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[.16em] text-cyan-300"><Sparkles className="h-3.5 w-3.5" /> NEW GAME MODE</span>
              <strong className="mt-1 block font-display text-xl sm:text-2xl">PC BUILD LAB · เกมประกอบคอมเสมือนจริง</strong>
              <span className="mt-1 block max-w-2xl text-sm text-slate-300">เลือกอะไหล่ ติดตั้งลงเคส ตรวจ Socket, DDR, ขนาด, ไฟและความร้อน แล้วกดบูตเพื่อรับคะแนน</span>
            </span>
          </span>
          <span className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-2.5 font-bold text-slate-950 transition group-hover:bg-emerald-300"><Play className="h-4 w-4" /> เริ่มประกอบ</span>
        </span>
      </motion.button>

      <h2 className="mb-3 mt-7 font-display text-lg font-bold text-slate-900">เมนูหลัก</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.button
            key={t.en}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -3 }}
            onClick={() => go(t.route)}
            className="group flex flex-col items-start gap-3 rounded-3xl bg-white p-4 text-left shadow-[0_8px_30px_-12px_rgba(30,41,99,0.18)] ring-1 ring-slate-100"
          >
            <span className={cx('grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md', t.cls)}>
              <t.Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-bold text-slate-900">{t.label}</span>
              <span className="block text-xs text-slate-500">{t.en}{t.locked ? ' · 🔒 หลัง Post-Test' : ''}</span>
            </span>
            {t.note && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{t.note}</span>}
          </motion.button>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/60 p-4 text-sm text-slate-500 ring-1 ring-slate-100">
        <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> เส้นทาง: Pre-Test → Mission 01–06 → Final Case → Post-Test → Reflection → Certificate</span>
        <Btn
          variant="ghost"
          className="text-xs"
          onClick={() => {
            if (window.confirm('เริ่มใหม่ทั้งหมด? ความคืบหน้าทั้งหมดในเครื่องนี้จะถูกลบ')) reset();
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> เริ่มใหม่
        </Btn>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-slate-50 py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="font-display text-xl font-bold text-slate-900 tabular-nums">{value}</dd>
    </div>
  );
}

import { motion } from 'motion/react';
import { Check, Lock, Play, School, Sparkles, UserRound } from 'lucide-react';
import { allMissionsDone, canAccessFinal, currentStep, missionStatus, useStore } from '../store';
import { activeClassroom } from '../game/classroom';
import { MISSIONS } from '../data/missions';
import { Bar, Btn, Card, cx } from '../components/ui';
import { Shell } from '../components/Shell';
import { useBuddyTopic } from '../components/Buddy';
import { MissionMapBody } from './MissionMap';

export function Home() {
  const { state, go } = useStore();
  const done = MISSIONS.filter((m) => state.missions[m.id].completed).length;
  const step = currentStep(state);
  const classroom = activeClassroom(state);

  useBuddyTopic(
    {
      scope: null,
      hint: `ภารกิจถัดไปของคุณคือ "${step.label}" — กด Continue Mission เพื่อไปต่อได้เลย`,
      evidence: [`ตอนนี้มีหลักฐาน ${state.evidence.length} ชิ้นใน Evidence Board`, 'หลักฐานจาก Mission ก่อนหน้าช่วยได้ใน Final Case'],
      lesson: { text: 'ติดตรงไหน แวะ Learning Center ได้ทุกเมื่อ หรือเข้า Hardware Lab เพื่อส่องอุปกรณ์ใกล้ ๆ' },
    },
    [step.label, state.evidence.length],
  );

  return (
    <Shell title="HARDWARE QUEST" subtitle="SYSTEM FAILURE · ภารกิจกู้ระบบคอมพิวเตอร์">
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Current case */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="group relative isolate overflow-hidden rounded-[1.75rem] bg-[radial-gradient(ellipse_at_14%_0%,_#155e75_0%,_transparent_42%),radial-gradient(ellipse_at_100%_100%,_#4338ca_0%,_transparent_55%),linear-gradient(135deg,#071525,#111c3d_60%,#10102a)] p-6 text-white shadow-[0_25px_70px_-32px_rgba(8,47,73,.75)] ring-1 ring-cyan-200/20 sm:p-7">
          <div className="pointer-events-none absolute inset-0 opacity-[.12] [background-image:linear-gradient(#67e8f9_1px,transparent_1px),linear-gradient(90deg,#67e8f9_1px,transparent_1px)] [background-size:30px_30px]" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-cyan-200/15 bg-cyan-300/[.04] shadow-[0_0_90px_rgba(34,211,238,.14)] transition-transform duration-700 group-hover:scale-110" aria-hidden="true"><div className="absolute inset-7 rounded-full border border-dashed border-cyan-100/20" /><div className="absolute inset-16 rounded-full border border-cyan-100/20" /></div>
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-100/[.08] px-3 py-1 text-[11px] font-black tracking-[.18em] text-cyan-200"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> ACTIVE QUEST <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /></p>
            <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{step.label}</h2>
            <p className="mt-1 max-w-lg text-sm text-cyan-50/75">เตรียมอุปกรณ์ให้พร้อม แล้วออกปฏิบัติภารกิจต่อจากจุดที่ค้างไว้</p>
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-sm text-indigo-100">
                <span>Game Progress</span>
                <span className="tabular-nums font-bold">{done}/6 · {state.builderCompleted ? 'ประกอบคอมแล้ว' : 'M-07'}</span>
              </div>
              <Bar value={(done / 6) * 100} color="bg-gradient-to-r from-cyan-400 to-emerald-400" className="bg-white/15" label="ความคืบหน้าภารกิจ" />
              <div className="mt-3 flex gap-1.5" aria-label={`ผ่านแล้ว ${done} จาก 6 ภารกิจ`}>
                {MISSIONS.map((m) => {
                  const st = missionStatus(state, m.id);
                  return (
                    <div key={m.id} title={`${m.code}: ${st}`} className={cx('grid h-9 flex-1 place-items-center rounded-xl border text-xs font-bold transition', st === 'completed' ? 'border-emerald-200 bg-emerald-400 text-emerald-950 shadow-[0_0_16px_rgba(52,211,153,.24)]' : st === 'available' ? 'border-cyan-100 bg-white text-indigo-900 shadow-[0_0_18px_rgba(103,232,249,.34)]' : 'border-white/10 bg-white/[.07] text-indigo-200')}>
                      {st === 'completed' ? <Check className="h-4 w-4" aria-label="สำเร็จแล้ว" /> : st === 'locked' ? <Lock className="h-3.5 w-3.5" aria-label="ยังล็อก" /> : `0${m.id}`}
                    </div>
                  );
                })}
                <div className={cx('grid h-9 flex-1 place-items-center rounded-xl text-[10px] font-bold', state.builderCompleted ? 'bg-emerald-400 text-emerald-950' : allMissionsDone(state) ? 'bg-cyan-300 text-slate-950' : 'bg-white/10 text-indigo-200')}>BUILD</div>
                <div className={cx('grid h-9 flex-1 place-items-center rounded-xl text-[10px] font-bold', state.finalCase.completed ? 'bg-emerald-400 text-emerald-950' : canAccessFinal(state) ? 'bg-rose-400 text-white' : 'bg-white/10 text-indigo-200')}>FINAL</div>
              </div>
            </div>
            <Btn onClick={() => go(step.route)} disabled={step.blocked} className="mt-6 min-h-12 rounded-xl bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-300 text-base text-slate-950 shadow-[0_10px_30px_-10px_rgba(34,211,238,.75)] sm:text-lg">
              <Play className="h-5 w-5 fill-current" aria-hidden="true" /> {step.blocked ? 'รอปลดล็อกภารกิจ' : 'เล่นภารกิจต่อ'}
            </Btn>
          </div>
        </motion.div>

        {/* Account shortcut */}
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
          <div className="mt-4 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"><p className="text-[10px] font-black tracking-[.18em] text-cyan-700">TECHNICIAN PROFILE</p><p className="mt-1 text-xs font-semibold text-slate-600">{done === 6 ? 'Senior Technician' : done >= 3 ? 'Field Technician' : 'Trainee Technician'}</p></div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
            <Stat label="Missions" value={`${done}/6`} />
            <Stat label="Evidence" value={state.evidence.length} />
          </dl>
          <Btn onClick={() => go({ name: 'account' })} variant="secondary" className="mt-4 w-full"><UserRound className="h-4 w-4" /> เปิดบัญชีของฉัน</Btn>
        </Card>
      </div>

      <div className={cx('mt-5 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-sm ring-1', classroom ? 'bg-sky-50 text-sky-900 ring-sky-200' : 'bg-emerald-50 text-emerald-900 ring-emerald-200')}>
        <School className="h-5 w-5 shrink-0" aria-hidden="true" /><div className="min-w-0 flex-1"><b>{classroom ? `ห้อง ${classroom.name}` : 'โหมดเรียนอิสระ'}</b><p className="text-xs opacity-80">{classroom ? `รหัส ${classroom.code} · ครูเปิดถึง Mission ${String(classroom.unlockedThrough).padStart(2, '0')}${classroom.finalUnlocked ? ' และ Final Case' : ''}` : 'ไม่มีห้องเรียนควบคุม จึงสามารถเลือกเล่นทุก Mission ได้'}</p></div>
      </div>

      <section id="missions" className="mt-8 scroll-mt-24" aria-labelledby="missions-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-xs font-bold tracking-[.18em] text-indigo-600">LEARNING PATH</p><h2 id="missions-title" className="font-display text-2xl font-bold text-slate-900">แผนที่ภารกิจ</h2></div>
          <span className="text-sm font-semibold text-slate-500">6 Missions + PC Build + Final Case</span>
        </div>
        <MissionMapBody />
      </section>

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

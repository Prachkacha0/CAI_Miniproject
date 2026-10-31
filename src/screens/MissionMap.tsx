import { motion } from 'motion/react';
import { Check, Cpu, Flag, Gift, Lock, Play, RotateCcw, Target, Wrench } from 'lucide-react';
import { allMissionsDone, avgScore, canAccessFinal, classroomLockReason, missionStatus, useStore } from '../store';
import { MISSIONS, OBJECTIVES } from '../data/missions';
import { Btn, StatusTag, cx } from '../components/ui';
import { Ico } from '../components/icons';

export function MissionMapBody() {
  const { state, go } = useStore();
  const finalOpen = canAccessFinal(state);
  const builderOpen = allMissionsDone(state);

  return (
      <div className="relative" aria-label="แผนที่ภารกิจ 7 ขั้นและ Final Case">
        <div className="absolute bottom-10 left-7 top-10 w-1 rounded-full bg-gradient-to-b from-cyan-400 via-indigo-400 to-amber-400 shadow-[0_0_14px_rgba(34,211,238,.24)] sm:left-1/2 sm:-ml-0.5" aria-hidden="true" />
        <ol className="relative space-y-6 sm:space-y-8">
          {MISSIONS.map((m, i) => {
            const st = missionStatus(state, m.id);
            const rec = state.missions[m.id];
            const left = i % 2 === 0;
            return (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, x: left ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cx('flex items-center gap-4 sm:w-1/2', left ? 'sm:pr-10' : 'sm:ml-auto sm:flex-row-reverse sm:pl-10')}
              >
                <div
                  className={cx(
                    'relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-4 border-[#edf3f8] text-white shadow-xl sm:absolute sm:left-1/2 sm:-ml-7',
                    st === 'locked' ? 'bg-slate-400' : `bg-gradient-to-br ${m.accent}`,
                  )}
                  aria-hidden="true"
                >
                  {st === 'locked' ? <Lock className="h-6 w-6" /> : <Ico name={m.icon} className="h-6 w-6" />}
                  {st === 'available' && <span className="absolute -inset-1 animate-pulse rounded-2xl ring-2 ring-cyan-400/80" />}
                </div>
                <div className={cx('group/card relative flex-1 overflow-hidden rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-4 shadow-[0_16px_36px_-26px_rgba(15,39,68,.48)] transition duration-200', st === 'available' ? 'border-cyan-300 ring-2 ring-cyan-300/35 shadow-[0_18px_38px_-22px_rgba(8,145,178,.38)]' : 'border-white ring-1 ring-slate-200/80', st === 'locked' && 'opacity-65 grayscale-[.25]')}>
                  {st === 'available' && <span className="pointer-events-none absolute right-0 top-0 rounded-bl-xl bg-cyan-100 px-2.5 py-1 text-[10px] font-black tracking-widest text-cyan-900">NEXT UP</span>}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-bold text-slate-400">{m.code}</span>
                    <StatusTag status={st} />
                    <span className="text-xs text-slate-400">· {m.gameplay}</span>
                  </div>
                  <h3 className="mt-1 font-display text-lg font-bold text-slate-900 transition-colors group-hover/card:text-cyan-900">{m.title}</h3>
                  <p className="text-xs text-slate-500">{m.en}</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    <li className="flex gap-2"><Target className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden="true" /><span><b>Objective:</b> {m.objective} <span className="text-slate-400">(LO{m.lo} {OBJECTIVES[m.lo].en})</span></span></li>
                    <li className="flex gap-2"><Wrench className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" /><span><b>Skill:</b> {m.skill}</span></li>
                    <li className="flex gap-2"><Gift className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" /><span><b>Reward:</b> {m.reward}</span></li>
                  </ul>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {rec.best ? <span className="text-xs font-semibold text-emerald-700">คะแนนดีที่สุด {avgScore(rec.best)}%</span> : <span />}
                    {st === 'locked' ? (
                      <span className="text-xs text-slate-400">{classroomLockReason(state, m.id)}</span>
                    ) : (
                      <Btn onClick={() => go({ name: 'mission', id: m.id })} variant={st === 'completed' ? 'secondary' : 'primary'} className="min-h-11 rounded-xl px-4 py-2 text-sm">
                        {st === 'completed' ? <><RotateCcw className="h-4 w-4" aria-hidden="true" /> เล่นซ้ำ</> : <><Play className="h-4 w-4 fill-current" aria-hidden="true" /> ลงสนาม</>}
                      </Btn>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
          <motion.li initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative flex justify-center pt-1">
            <div className={cx('w-full max-w-2xl rounded-2xl border p-4 shadow-[0_16px_36px_-26px_rgba(15,39,68,.48)] sm:p-5', state.builderCompleted ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white' : builderOpen ? 'border-cyan-300 bg-gradient-to-br from-cyan-50 to-white ring-2 ring-cyan-300/35' : 'border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 opacity-70')}>
              <div className="flex items-start gap-3 sm:gap-4">
                <span className={cx('grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-lg sm:h-14 sm:w-14', state.builderCompleted ? 'bg-emerald-500' : builderOpen ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-slate-400')}>
                  {state.builderCompleted ? <Check className="h-6 w-6" /> : builderOpen ? <Cpu className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-display text-sm font-bold text-slate-400">M-07</span><span className={cx('rounded-full px-2 py-0.5 text-[11px] font-bold', state.builderCompleted ? 'bg-emerald-100 text-emerald-800' : builderOpen ? 'bg-cyan-100 text-cyan-900' : 'bg-slate-200 text-slate-600')}>{state.builderCompleted ? 'สำเร็จแล้ว' : builderOpen ? 'ขั้นถัดไป' : 'รอทำภารกิจ 01–06'}</span><span className="text-xs text-slate-400">ประกอบจริง · ตรวจความเข้ากันได้ · ทดสอบบูต</span></div>
                  <h3 className="mt-1 font-display text-lg font-bold text-slate-900">ประกอบคอมให้พร้อมใช้งาน</h3>
                  <p className="text-xs text-slate-500">PC Build Lab · สุ่มใบสั่งจากลูกค้าด่าน 6 แล้วประกอบเฉพาะอะไหล่ในรายการ</p>
                  {state.assemblyOrder && <p className="mt-1 text-xs font-semibold text-cyan-800">ใบงานล่าสุด: {state.assemblyOrder.customerName} · {state.assemblyOrder.role}</p>}
                  <div className="mt-3 flex justify-end">
                    {builderOpen ? <Btn onClick={() => go({ name: 'builder' })} variant={state.builderCompleted ? 'secondary' : 'primary'} className="min-h-11 rounded-xl px-4 py-2 text-sm">{state.builderCompleted ? <><RotateCcw className="h-4 w-4" /> เล่นซ้ำ</> : <><Play className="h-4 w-4 fill-current" /> เริ่มประกอบ</>}</Btn> : <span className="text-xs text-slate-500">ทำภารกิจทั้ง 6 ขั้นก่อนเพื่อปลดล็อก</span>}
                  </div>
                </div>
              </div>
            </div>
          </motion.li>
          <li className="relative flex justify-center pt-3">
            <div className={cx('w-full max-w-md rounded-[1.75rem] border p-5 text-center shadow-xl', finalOpen ? 'border-amber-200/60 bg-[radial-gradient(ellipse_at_top,_#fbbf24,_transparent_65%),linear-gradient(135deg,#b91c1c,#7c2d12)] text-white ring-4 ring-amber-300/20' : 'border-slate-200 bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600')}>
              <Flag className="mx-auto h-8 w-8" aria-hidden="true" />
              <p className="mt-1 font-display text-xl font-bold">FINAL CASE</p>
              <p className="text-sm opacity-90">ภารกิจสุดท้ายของ Technician: กู้ระบบห้องทะเบียน</p>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-xs font-bold">
                {state.finalCase.completed ? <><Check className="h-3.5 w-3.5" aria-hidden="true" /> Completed</> : finalOpen ? <><Play className="h-3.5 w-3.5" aria-hidden="true" /> Available</> : <><Lock className="h-3.5 w-3.5" aria-hidden="true" /> {classroomLockReason(state)}</>}
              </p>
              {finalOpen && (
                <Btn onClick={() => go({ name: 'final' })} className="mt-3 bg-white text-rose-600 shadow-none hover:bg-rose-50">
                  {state.finalCase.completed ? 'เล่นซ้ำ' : 'เริ่ม Final Case'}
                </Btn>
              )}
            </div>
          </li>
        </ol>
      </div>
  );
}

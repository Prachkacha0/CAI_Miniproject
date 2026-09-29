import { motion } from 'motion/react';
import { Check, Flag, Gift, Lock, Play, RotateCcw, Target, Wrench } from 'lucide-react';
import { avgScore, canAccessFinal, classroomLockReason, missionStatus, useStore } from '../store';
import { MISSIONS, OBJECTIVES } from '../data/missions';
import { Btn, StatusTag, cx } from '../components/ui';
import { Ico } from '../components/icons';

export function MissionMapBody() {
  const { state, go } = useStore();
  const finalOpen = canAccessFinal(state);

  return (
      <div className="relative" aria-label="แผนที่ภารกิจ 6 ภารกิจและ Final Case">
        <div className="absolute bottom-10 left-7 top-10 w-1 rounded-full bg-gradient-to-b from-sky-300 via-violet-300 to-rose-300 sm:left-1/2 sm:-ml-0.5" aria-hidden="true" />
        <ol className="relative space-y-5">
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
                    'relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-lg sm:absolute sm:left-1/2 sm:-ml-7',
                    st === 'locked' ? 'bg-slate-300' : `bg-gradient-to-br ${m.accent}`,
                  )}
                  aria-hidden="true"
                >
                  {st === 'locked' ? <Lock className="h-6 w-6" /> : <Ico name={m.icon} className="h-6 w-6" />}
                  {st === 'available' && <span className="absolute -inset-1 rounded-2xl ring-2 ring-indigo-400/60" />}
                </div>
                <div className={cx('flex-1 rounded-3xl bg-white p-4 shadow-[0_8px_30px_-12px_rgba(30,41,99,0.18)] ring-1', st === 'available' ? 'ring-indigo-300' : 'ring-slate-100', st === 'locked' && 'opacity-70')}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-bold text-slate-400">{m.code}</span>
                    <StatusTag status={st} />
                    <span className="text-xs text-slate-400">· {m.gameplay}</span>
                  </div>
                  <h3 className="mt-1 font-display text-lg font-bold text-slate-900">{m.title}</h3>
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
                      <Btn onClick={() => go({ name: 'mission', id: m.id })} variant={st === 'completed' ? 'secondary' : 'primary'} className="min-h-10 py-2 text-sm">
                        {st === 'completed' ? <><RotateCcw className="h-4 w-4" aria-hidden="true" /> เล่นซ้ำ</> : <><Play className="h-4 w-4" aria-hidden="true" /> เริ่มภารกิจ</>}
                      </Btn>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
          <li className="relative flex justify-center pt-3">
            <div className={cx('w-full max-w-md rounded-3xl p-5 text-center shadow-xl', finalOpen ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white' : 'bg-slate-200 text-slate-500')}>
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

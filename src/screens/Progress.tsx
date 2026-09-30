import { CircleCheck, CircleDashed, CircleDot, Info, Lock } from 'lucide-react';
import { avgScore, earnedBadges, loStatus, missionStatus, useStore } from '../store';
import { BADGES, MISSIONS, OBJECTIVES } from '../data/missions';
import type { LOId } from '../types';
import { Bar, Btn, Card, StatusTag, cx } from '../components/ui';
import { Shell } from '../components/Shell';
import { Ico } from '../components/icons';
import { useBuddyTopic } from '../components/Buddy';

const LOS: LOId[] = [1, 2, 3, 4, 5];

export function Progress() {
  const { state, go } = useStore();
  const badges = earnedBadges(state);

  useBuddyTopic(
    {
      scope: null,
      hint: 'Objective ไหนยังเป็น "ฝึกแล้ว" ไม่ใช่ "บรรลุ"? ลองกลับไปเล่น Mission นั้นซ้ำหรือเปิด Learning Center',
      evidence: ['Learning Progress คิดจาก Mission ที่ทำสำเร็จ + ผล Post-Test ราย Objective ของคุณ'],
      lesson: { text: 'Game Progress บอกว่าเล่นถึงไหน · Learning Progress บอกว่าเรียนรู้อะไรแล้วบ้าง — สองอย่างนี้ไม่เหมือนกัน' },
    },
    [],
  );

  const statusUI = {
    'not-started': { t: 'ยังไม่เริ่ม', Icon: CircleDashed, c: 'text-slate-400' },
    practiced: { t: 'ฝึกแล้ว', Icon: CircleDot, c: 'text-sky-600' },
    achieved: { t: 'บรรลุ', Icon: CircleCheck, c: 'text-emerald-600' },
  } as const;

  return (
    <Shell title="Progress · ความก้าวหน้า">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg font-bold text-slate-900">GAME PROGRESS</h2>
          <ul className="mt-3 space-y-2">
            {MISSIONS.map((m) => {
              const st = missionStatus(state, m.id);
              const best = state.missions[m.id].best;
              return (
                <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <span className={cx('grid h-10 w-10 place-items-center rounded-xl text-white', st === 'locked' ? 'bg-slate-300' : `bg-gradient-to-br ${m.accent}`)}>
                    {st === 'locked' ? <Lock className="h-4 w-4" aria-hidden="true" /> : <Ico name={m.icon} className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{m.code} {m.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <StatusTag status={st} />
                      {best && <span className="text-xs text-slate-500">ดีที่สุด {avgScore(best)}% · เล่น {state.missions[m.id].plays} ครั้ง</span>}
                    </div>
                  </div>
                </li>
              );
            })}
            <li className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-sm font-bold text-white">FC</span>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Final Case</p>
                <StatusTag status={state.finalCase.completed ? 'completed' : MISSIONS.every((m) => state.missions[m.id].completed) ? 'available' : 'locked'} />
              </div>
            </li>
          </ul>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-bold text-slate-900">LEARNING PROGRESS</h2>
          <ul className="mt-3 space-y-3">
            {LOS.map((lo) => {
              const s = loStatus(state, lo);
              const ui = statusUI[s.status];
              return (
                <li key={lo}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-slate-800">{lo}. {OBJECTIVES[lo].en} <span className="font-normal text-slate-500">· {OBJECTIVES[lo].th}</span></span>
                    <span className={cx('inline-flex shrink-0 items-center gap-1 text-xs font-bold', ui.c)}><ui.Icon className="h-4 w-4" aria-hidden="true" />{ui.t}</span>
                  </div>
                  <Bar value={s.pct} color={s.status === 'achieved' ? 'bg-emerald-500' : 'bg-sky-500'} label={OBJECTIVES[lo].en} />
                </li>
              );
            })}
          </ul>
          <p className="mt-4 flex gap-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
            ข้อมูลนี้คำนวณจากการเล่นของคุณในเครื่องนี้เท่านั้น ใช้เพื่อสะท้อนการเรียนรู้ ไม่ใช่ผลการวิจัยหรือการจัดอันดับ
          </p>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-bold text-slate-900">ASSESSMENT</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Pre-Test</p>
              <p className="font-display text-2xl font-bold tabular-nums">{state.preTest ? `${state.preTest.score}/${state.preTest.total}` : '—'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Post-Test (ดีที่สุด)</p>
              <p className="font-display text-2xl font-bold tabular-nums">{state.postTestBest ? `${state.postTestBest.score}/${state.postTestBest.total}` : '—'}</p>
            </div>
          </div>
          {!state.preTest && <Btn className="mt-3 w-full" onClick={() => go({ name: 'pretest' })}>ทำ Pre-Test</Btn>}
        </Card>

        <Card>
          <h2 className="font-display text-lg font-bold text-slate-900">BADGES <span className="text-sm font-normal text-slate-500">(ระบบเสริม)</span></h2>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {BADGES.map((b) => {
              const got = badges.includes(b.id);
              return (
                <li key={b.id} className={cx('flex items-center gap-3 rounded-2xl p-3', got ? 'bg-amber-50' : 'bg-slate-50')}>
                  <span className={cx('grid h-10 w-10 place-items-center rounded-xl', got ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-400')}><Ico name={b.icon} className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className={cx('text-sm font-bold', got ? 'text-amber-900' : 'text-slate-500')}>{b.name} {got ? '✓' : ''}</p>
                    <p className="text-xs text-slate-500">{b.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </Shell>
  );
}

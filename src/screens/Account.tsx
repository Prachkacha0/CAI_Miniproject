import { Award, ChartColumnBig, CircleCheck, CircleDashed, Pencil, RotateCcw, UserRound } from 'lucide-react';
import { BADGES } from '../data/missions';
import { Ico } from '../components/icons';
import { Bar, Btn, Card, cx } from '../components/ui';
import { Shell } from '../components/Shell';
import { certRequirements, certUnlocked, earnedBadges, technicianProfile, useStore } from '../store';

export function Account() {
  const { state, go, reset } = useStore();
  const badges = earnedBadges(state);
  const requirements = certRequirements(state);
  const certificateReady = certUnlocked(state);
  const completedRequirements = requirements.filter((item) => item.done).length;
  const profile = technicianProfile(state);

  return (
    <Shell title="บัญชีของฉัน" subtitle="โปรไฟล์ ความก้าวหน้า และใบประกาศ">
      <div className="mx-auto max-w-5xl space-y-5">
        <Card className="overflow-hidden p-0">
          <div className="bg-[radial-gradient(circle_at_top_left,#4f46e5,#1e1b4b)] p-5 text-white sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-bold ring-1 ring-white/25">{state.player?.name.slice(0, 1)}</div>
                <div className="min-w-0 flex-1"><p className="text-xs font-bold tracking-[.18em] text-cyan-300">PLAYER ACCOUNT</p><h2 className="truncate font-display text-2xl font-bold">{state.player?.name}</h2><p className="text-sm text-indigo-100">Junior Computer Technician{state.player?.group ? ` · ${state.player.group}` : ''}</p></div>
              </div>
              <Btn onClick={() => go({ name: 'start' })} className="w-full bg-white text-indigo-700 shadow-none hover:bg-indigo-50 sm:w-auto"><Pencil className="h-4 w-4" /> แก้ไขข้อมูล</Btn>
            </div>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-4 sm:p-5">
            {profile.map((item) => <div key={item.key} className="rounded-2xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-500">{item.th}</span><b className="text-sm text-slate-900">{item.value}%</b></div><Bar value={item.value} className="mt-2" label={item.th} /></div>)}
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <Card>
            <div className="flex items-center gap-2"><UserRound className="h-5 w-5 text-indigo-600" /><h2 className="font-display text-lg font-bold text-slate-900">Badge ของฉัน</h2></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {BADGES.map((badge) => {
                const received = badges.includes(badge.id);
                return <div key={badge.id} className={cx('flex items-center gap-3 rounded-2xl p-3 ring-1', received ? 'bg-amber-50 text-amber-900 ring-amber-200' : 'bg-slate-50 text-slate-400 ring-slate-100')}><span className={cx('grid h-10 w-10 place-items-center rounded-xl', received ? 'bg-amber-100' : 'bg-slate-100')}><Ico name={badge.icon} className="h-5 w-5" /></span><div><b className="block text-sm">{badge.name}</b><span className="text-xs">{received ? 'ได้รับแล้ว' : badge.desc}</span></div></div>;
              })}
            </div>
            <Btn onClick={() => go({ name: 'progress' })} variant="secondary" className="mt-4 w-full"><ChartColumnBig className="h-4 w-4" /> ดูความก้าวหน้าโดยละเอียด</Btn>
          </Card>

          <Card className={cx('ring-1', certificateReady ? 'bg-amber-50 ring-amber-200' : 'ring-slate-100')}>
            <div className="flex items-start gap-3"><span className={cx('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', certificateReady ? 'bg-amber-400 text-amber-950' : 'bg-slate-100 text-slate-400')}><Award className="h-6 w-6" /></span><div><p className="text-xs font-bold tracking-[.15em] text-amber-700">CERTIFICATE</p><h2 className="font-display text-xl font-bold text-slate-900">ใบประกาศของฉัน</h2><p className="text-sm text-slate-500">{certificateReady ? 'ผ่านเงื่อนไขครบแล้ว เปิดเพื่อดู พิมพ์ หรือบันทึก PDF' : `ทำสำเร็จแล้ว ${completedRequirements}/${requirements.length} เงื่อนไข`}</p></div></div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">{requirements.map((item) => <li key={item.label} className={cx('flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold', item.done ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-500')}>{item.done ? <CircleCheck className="h-4 w-4 shrink-0" /> : <CircleDashed className="h-4 w-4 shrink-0" />}{item.label}</li>)}</ul>
            {certificateReady ? <Btn onClick={() => go({ name: 'certificate' })} className="mt-4 w-full bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950"><Award className="h-4 w-4" /> {state.certificate ? 'เปิดใบประกาศ' : 'รับใบประกาศ'}</Btn> : <p className="mt-4 rounded-xl bg-white p-3 text-center text-xs text-slate-500">ใบประกาศจะเปิดให้กดจากบัญชีนี้เมื่อผ่านทุกเงื่อนไข</p>}
          </Card>
        </div>

        <div className="flex justify-end"><Btn variant="ghost" className="text-rose-600" onClick={() => { if (window.confirm('เริ่มใหม่ทั้งหมด? ความคืบหน้าและข้อมูลบัญชีในเครื่องนี้จะถูกลบ')) reset(); }}><RotateCcw className="h-4 w-4" /> ล้างข้อมูลบัญชีและเริ่มใหม่</Btn></div>
      </div>
    </Shell>
  );
}

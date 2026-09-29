import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useStore } from '../store';
import { HARDWARE, HW } from '../data/hardware';
import { Btn, Card, CatPill, cx } from '../components/ui';
import { Shell } from '../components/Shell';
import { Inspector } from '../components/Inspector';
import { HwVisual } from '../components/HwVisual';
import { artHotspots, hasArt } from '../components/HardwareArt';
import { useBuddyTopic } from '../components/Buddy';

const LAB = HARDWARE.filter((h) => hasArt(h.art));

export function HardwareLab() {
  const { state, markLab, go } = useStore();
  const [id, setId] = useState(LAB[0].id);
  const [seen, setSeen] = useState<Record<string, number[]>>({});
  const hw = HW[id];

  useEffect(() => markLab(id), [id, markLab]);

  useBuddyTopic(
    {
      scope: null,
      hint: `ลองหาจุดเด่นของ ${hw.en.split(' (')[0]} ที่ทำให้แยกออกจากอุปกรณ์อื่นได้ทันที`,
      evidence: ['จุดสีฟ้าบนภาพคือส่วนสำคัญ แตะเพื่ออ่านคำอธิบาย'],
      lesson: { text: hw.func, hw: [hw.id] },
    },
    [id],
  );

  return (
    <Shell title="Hardware Lab · ห้องแล็บส่องอุปกรณ์" subtitle="Zoom · Rotate · Inspect · Explore">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Inspector key={id} art={hw.art!} title={hw.en} revealName={hw.en} seen={seen[id] ?? []} onSpot={(i) => setSeen((m) => ({ ...m, [id]: (m[id] ?? []).includes(i) ? m[id] : [...(m[id] ?? []), i] }))} />
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-xl font-bold text-slate-900">{hw.name}</p>
              <CatPill cat={hw.category} />
            </div>
            <p className="text-sm text-slate-500">{hw.en}</p>
            <p className="mt-3 text-slate-800"><b>หน้าที่:</b> {hw.func}</p>
            <p className="mt-1 text-slate-800"><b>ลักษณะเด่น:</b> {hw.clues.physical}</p>
            <Btn variant="secondary" className="mt-4" onClick={() => go({ name: 'learn', hw: hw.id })}><BookOpen className="h-4 w-4" aria-hidden="true" /> เปิดการ์ดความรู้</Btn>
          </Card>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-600">เลือกอุปกรณ์ ({state.labViewed.filter((x) => LAB.some((h) => h.id === x)).length}/{LAB.length} สำรวจแล้ว)</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
            {LAB.map((h) => {
              const spots = artHotspots(h.art!).length;
              const got = (seen[h.id] ?? []).length;
              return (
                <button key={h.id} onClick={() => setId(h.id)} aria-pressed={id === h.id} className={cx('overflow-hidden rounded-2xl bg-white text-left ring-2 transition', id === h.id ? 'ring-indigo-500' : 'ring-slate-100 hover:ring-slate-300')}>
                  <HwVisual hw={h} className="aspect-[10/7] w-full rounded-none" />
                  <span className="block truncate px-2 pt-1.5 text-xs font-bold text-slate-800">{h.en.split(' (')[0]}</span>
                  <span className="block px-2 pb-1.5 text-[11px] text-slate-500 tabular-nums">
                    {state.labViewed.includes(h.id) ? '👁 ' : ''}{got}/{spots} จุด
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Shell>
  );
}

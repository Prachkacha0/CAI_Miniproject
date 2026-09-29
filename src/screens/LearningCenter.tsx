import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import type { Category, HardwareItem } from '../types';
import { useStore } from '../store';
import { CATEGORIES, CATEGORY_ORDER, HARDWARE, HW } from '../data/hardware';
import { MISSION } from '../data/missions';
import { CatPill, Modal, cx } from '../components/ui';
import { Shell } from '../components/Shell';
import { HwVisual } from '../components/HwVisual';
import { useBuddyTopic } from '../components/Buddy';

export function LearningCenter({ hw }: { hw?: string }) {
  useBuddyTopic(
    {
      scope: null,
      hint: 'ลองเปิดการ์ดของอุปกรณ์ที่คุณยังไม่มั่นใจ แล้วดูว่ามันอยู่กลุ่มไหน ทำหน้าที่อะไร',
      evidence: ['การ์ดแต่ละใบบอก Mission ที่เกี่ยวข้อง — กลับไปเล่นซ้ำได้'],
      lesson: { text: '5 กลุ่ม: Input รับเข้า · Processing ประมวลผล · Storage จัดเก็บ · Output แสดงผล · Communication สื่อสาร' },
    },
    [],
  );
  return (
    <Shell title="Learning Center · คลังความรู้" subtitle="ทบทวนได้ทุกเวลา">
      <LearningCenterBody initial={hw} />
    </Shell>
  );
}

export function LearningCenterBody({ compact, initial }: { compact?: boolean; initial?: string }) {
  const { markLearn, state } = useStore();
  const [tab, setTab] = useState<Category | 'all'>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<HardwareItem | null>(initial ? HW[initial] ?? null : null);

  useEffect(() => {
    if (open) markLearn(open.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return HARDWARE.filter((h) => (tab === 'all' || h.category === tab) && (!s || `${h.name} ${h.en} ${h.func}`.toLowerCase().includes(s)));
  }, [tab, q]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="ประเภท Hardware">
          {(['all', ...CATEGORY_ORDER] as const).map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={tab === c}
              onClick={() => setTab(c)}
              className={cx('shrink-0 rounded-full px-3.5 py-2 text-sm font-bold transition', tab === c ? (c === 'all' ? 'bg-slate-900 text-white' : cx(CATEGORIES[c].color, 'text-white')) : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50')}
            >
              {c === 'all' ? 'ทั้งหมด' : CATEGORIES[c].en.toUpperCase()}
            </button>
          ))}
        </div>
        <label className="relative sm:w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา เช่น RAM" aria-label="ค้นหา Hardware" className="h-11 w-full rounded-2xl bg-white pl-9 pr-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-400" />
        </label>
      </div>

      {tab !== 'all' && (
        <div className={cx('mt-4 rounded-2xl p-4', CATEGORIES[tab].soft)}>
          <p className={cx('font-display font-bold', CATEGORIES[tab].text)}>{CATEGORIES[tab].en} · {CATEGORIES[tab].th}</p>
          <p className="text-sm text-slate-700">{CATEGORIES[tab].desc}</p>
        </div>
      )}

      <div className={cx('mt-4 grid gap-3', compact ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5')}>
        {list.map((h, i) => (
          <motion.button
            key={h.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.3) }}
            whileHover={{ y: -3 }}
            onClick={() => setOpen(h)}
            className="flex flex-col overflow-hidden rounded-3xl bg-white text-left shadow-[0_8px_30px_-12px_rgba(30,41,99,0.18)] ring-1 ring-slate-100"
          >
            <HwVisual hw={h} className="aspect-[10/7] w-full rounded-none" />
            <div className="flex flex-1 flex-col gap-1 p-3">
              <CatPill cat={h.category} className="self-start" />
              <span className="font-bold leading-tight text-slate-900">{h.en.split(' (')[0]}</span>
              <span className="text-xs text-slate-500">{h.name}</span>
              {state.learnViewed.includes(h.id) && <span className="mt-auto pt-1 text-[11px] font-semibold text-emerald-600">✓ อ่านแล้ว</span>}
            </div>
          </motion.button>
        ))}
        {!list.length && <p className="col-span-full py-10 text-center text-slate-400">ไม่พบอุปกรณ์ที่ค้นหา</p>}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? open.en.split(' (')[0] : ''}>
        <AnimatePresence>{open && <HardwareCard hw={open} onClose={() => setOpen(null)} />}</AnimatePresence>
      </Modal>
    </div>
  );
}

function HardwareCard({ hw, onClose }: { hw: HardwareItem; onClose: () => void }) {
  const { go } = useStore();
  const rows: [string, string][] = [
    ['หน้าที่ · Function', hw.func],
    ['จุดเด่น · Key Feature', hw.feature],
    ['ตัวอย่างการใช้งาน · Example', hw.example],
  ];
  return (
    <div className="space-y-3">
      <HwVisual hw={hw} className="aspect-[10/6] w-full bg-white ring-1 ring-slate-100" />
      <div>
        <p className="font-display text-xl font-bold text-slate-900">{hw.name}</p>
        <p className="text-sm text-slate-500">{hw.en}</p>
        <CatPill cat={hw.category} className="mt-2" />
        <span className="ml-2 text-xs text-slate-500">{CATEGORIES[hw.category].th}</span>
      </div>
      <dl className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
            <dt className="text-xs font-bold text-slate-500">{k}</dt>
            <dd className="mt-0.5 text-slate-800">{v}</dd>
          </div>
        ))}
        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
          <dt className="text-xs font-bold text-slate-500">ภารกิจที่เกี่ยวข้อง · Related Mission</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {hw.missions.length ? (
              hw.missions.map((m) => (
                <button key={m} onClick={() => { onClose(); go({ name: 'mission', id: m }); }} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
                  {MISSION[m].code} {MISSION[m].title}
                </button>
              ))
            ) : (
              <span className="text-sm text-slate-500">ความรู้เสริม (ใช้ใน Post-Test / Learning Center)</span>
            )}
          </dd>
        </div>
      </dl>
      <button onClick={onClose} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800"><X className="h-4 w-4" aria-hidden="true" /> ปิดการ์ด</button>
    </div>
  );
}

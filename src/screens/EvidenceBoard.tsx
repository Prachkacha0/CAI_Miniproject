import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { FolderOpen } from 'lucide-react';
import type { EvidenceType } from '../types';
import { useStore } from '../store';
import { HW } from '../data/hardware';
import { MISSION } from '../data/missions';
import { Bar, cx } from '../components/ui';
import { Shell } from '../components/Shell';
import { useBuddyTopic } from '../components/Buddy';

const TYPES: Record<EvidenceType, { th: string; en: string; cls: string; pin: string }> = {
  hardware: { th: 'อุปกรณ์', en: 'Hardware Evidence', cls: 'bg-sky-50 ring-sky-200', pin: 'bg-sky-500' },
  category: { th: 'ประเภท', en: 'Category Evidence', cls: 'bg-amber-50 ring-amber-200', pin: 'bg-amber-500' },
  function: { th: 'หน้าที่', en: 'Function Evidence', cls: 'bg-violet-50 ring-violet-200', pin: 'bg-violet-500' },
  diagnostic: { th: 'ผลวินิจฉัย', en: 'Diagnostic Evidence', cls: 'bg-rose-50 ring-rose-200', pin: 'bg-rose-500' },
  case: { th: 'คดี', en: 'Case Evidence', cls: 'bg-emerald-50 ring-emerald-200', pin: 'bg-emerald-500' },
  clue: { th: 'เบาะแส', en: 'Clue', cls: 'bg-slate-50 ring-slate-200', pin: 'bg-slate-500' },
};

export function EvidenceBoard() {
  useBuddyTopic(
    {
      scope: null,
      hint: 'ลองอ่านหลักฐานจาก Mission 04 แล้วถามตัวเองว่า ถ้าเจออาการนี้อีก จะตรวจอะไรก่อน?',
      evidence: ['หลักฐานเรียงตามเวลาที่เก็บ ใช้ตัวกรองด้านบนเพื่อดูทีละประเภท'],
      lesson: { text: 'Evidence Board คือสมุดบันทึกของช่างเทคนิค — ใช้ทบทวนก่อนทำ Final Case และ Post-Test' },
    },
    [],
  );
  return (
    <Shell title="Evidence Board · กระดานหลักฐาน" subtitle="หลักฐานทั้งหมดที่คุณเก็บระหว่างภารกิจ">
      <EvidenceBoardBody />
    </Shell>
  );
}

export function EvidenceBoardBody() {
  const { state, go } = useStore();
  const [filter, setFilter] = useState<EvidenceType | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const list = useMemo(() => [...state.evidence].reverse().filter((e) => filter === 'all' || e.type === filter), [state.evidence, filter]);
  const counts = useMemo(() => {
    const c: Partial<Record<EvidenceType, number>> = {};
    state.evidence.forEach((e) => (c[e.type] = (c[e.type] ?? 0) + 1));
    return c;
  }, [state.evidence]);

  if (!state.evidence.length) {
    return (
      <div className="grid place-items-center rounded-3xl bg-white py-16 text-center ring-1 ring-slate-100">
        <FolderOpen className="h-12 w-12 text-slate-300" aria-hidden="true" />
        <p className="mt-3 font-display text-lg font-bold text-slate-700">ยังไม่มีหลักฐาน</p>
        <p className="text-sm text-slate-500">เริ่ม Mission 01 เพื่อเก็บหลักฐานชิ้นแรก</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="font-semibold text-slate-700">🏅 Evidence Hunter</span>
          <span className="tabular-nums text-slate-500">{Math.min(state.evidence.length, 25)}/25</span>
        </div>
        <Bar value={(state.evidence.length / 25) * 100} color="bg-gradient-to-r from-amber-400 to-orange-500" label="ความคืบหน้า Evidence Hunter" />
      </div>
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>ทั้งหมด ({state.evidence.length})</FilterBtn>
        {(Object.keys(TYPES) as EvidenceType[]).map((t) => (
          <FilterBtn key={t} active={filter === t} onClick={() => setFilter(t)} disabled={!counts[t]}>
            <span className={cx('h-2 w-2 rounded-full', TYPES[t].pin)} aria-hidden="true" /> {TYPES[t].en} ({counts[t] ?? 0})
          </FilterBtn>
        ))}
      </div>
      <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
        {list.map((e, i) => {
          const t = TYPES[e.type];
          const open = openId === e.id;
          return (
            <motion.article
              key={e.id}
              initial={{ opacity: 0, y: 8, rotate: i % 2 ? 0.6 : -0.6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cx('relative mb-3 break-inside-avoid rounded-2xl p-4 pt-5 shadow-sm ring-1', t.cls)}
            >
              <span className={cx('absolute left-1/2 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full shadow', t.pin)} aria-hidden="true" />
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {t.en} · {e.mission === 'final' ? 'Final Case' : MISSION[e.mission].code}
              </p>
              <h3 className="mt-0.5 font-display font-bold text-slate-900">{e.title}</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {(open ? e.lines : e.lines.slice(0, 2)).map((l) => (
                  <li key={l} className="flex gap-1.5"><span className="text-slate-400" aria-hidden="true">•</span><span>{l}</span></li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                {e.lines.length > 2 && (
                  <button onClick={() => setOpenId(open ? null : e.id)} className="text-indigo-600 hover:underline">{open ? 'ย่อ' : `Review (+${e.lines.length - 2})`}</button>
                )}
                {e.hwId && HW[e.hwId] && (
                  <button onClick={() => go({ name: 'learn', hw: e.hwId })} className="text-violet-600 hover:underline">เปิดการ์ดความรู้ →</button>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

function FilterBtn({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-pressed={active} className={cx('inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-40', active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50')}>
      {children}
    </button>
  );
}

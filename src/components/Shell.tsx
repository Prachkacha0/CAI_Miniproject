import { useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, FolderOpen, House, LogOut, Presentation, UserRound } from 'lucide-react';
import { useStore } from '../store';
import { isStaff } from '../game/classroom';
import { Modal, cx } from './ui';
import { LearningCenterBody } from '../screens/LearningCenter';
import { EvidenceBoardBody } from '../screens/EvidenceBoard';

/**
 * Page chrome: top bar with Home / Back / quick-access drawers.
 * Learning Center and Evidence open as overlays so an in-progress mission is never lost.
 */
export function Shell({
  title,
  subtitle,
  children,
  exitTo,
  wide,
  minimal,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  exitTo?: 'home';
  wide?: boolean;
  minimal?: boolean;
}) {
  const { go, back, state } = useStore();
  const [drawer, setDrawer] = useState<'learn' | 'evidence' | null>(null);
  const staff = isStaff(state.player?.role);

  if (minimal) {
    return <div className="min-h-screen bg-[#080d1a]"><main className={cx('mx-auto px-4', wide ? 'max-w-[1600px]' : 'max-w-6xl')}>{children}</main></div>;
  }

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur-md print:hidden">
        <div className={cx('mx-auto flex items-center gap-2 px-4 py-2.5', wide ? 'max-w-7xl' : 'max-w-6xl')}>
          <button onClick={() => go(staff ? { name: 'classroom' } : { name: 'home' })} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-md" aria-label={staff ? 'ศูนย์ควบคุมห้องเรียน' : 'หน้าหลัก Home'}>
            <House className="h-5 w-5" />
          </button>
          {exitTo ? (
            <button onClick={() => go({ name: exitTo })} className="inline-flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
              <LogOut className="h-4 w-4 rotate-180" aria-hidden="true" />
              <span className="hidden sm:inline">ออกจากภารกิจ</span>
              <span className="sm:hidden">Exit</span>
            </button>
          ) : (
            <button onClick={back} className="grid h-11 w-11 place-items-center rounded-2xl text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50" aria-label="ย้อนกลับ Back">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0 flex-1 px-1">
            <h1 className="truncate font-display text-base font-bold text-slate-900 sm:text-lg">{title}</h1>
            {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
          </div>
          {!minimal && <button onClick={() => go(staff ? { name: 'classroom' } : { name: 'account' })} className="inline-flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50" aria-label={staff ? 'ศูนย์ควบคุมห้องเรียน' : 'เปิดบัญชีของฉัน'}>
            {staff ? <Presentation className="h-4 w-4" aria-hidden="true" /> : <UserRound className="h-4 w-4" aria-hidden="true" />}
            <span className="hidden md:inline">{staff ? 'ควบคุมห้อง' : 'บัญชี'}</span>
          </button>}
          {!minimal && !staff && <button onClick={() => setDrawer('learn')} className="inline-flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-semibold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50 max-[420px]:hidden" aria-label="เปิด Learning Center">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">ความรู้</span>
          </button>}
          {!minimal && !staff && <button onClick={() => setDrawer('evidence')} className="relative inline-flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-semibold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-50 max-[420px]:hidden" aria-label={`เปิด Evidence Board (${state.evidence.length} ชิ้น)`}>
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">หลักฐาน</span>
            <span className="rounded-full bg-sky-600 px-1.5 text-[11px] font-bold leading-5 text-white tabular-nums">{state.evidence.length}</span>
          </button>}
        </div>
      </header>
      <main className={cx('mx-auto px-4 pt-5', wide ? 'max-w-7xl' : 'max-w-6xl')}>{children}</main>

      {!minimal && <Modal open={drawer === 'learn'} onClose={() => setDrawer(null)} title="Learning Center · คลังความรู้" wide>
        <LearningCenterBody compact />
      </Modal>}
      {!minimal && <Modal open={drawer === 'evidence'} onClose={() => setDrawer(null)} title="Evidence Board · กระดานหลักฐาน" wide>
        <EvidenceBoardBody />
      </Modal>}
    </div>
  );
}

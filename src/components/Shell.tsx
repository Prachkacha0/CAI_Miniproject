import { useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, Cpu, FolderOpen, House, LogOut, Presentation, UserRound } from 'lucide-react';
import { useStore } from '../store';
import { isStaff } from '../game/classroom';
import { Modal, cx } from './ui';
import { EvidenceBoardBody } from '../screens/EvidenceBoard';

/**
 * Page chrome: compact top navigation and an evidence quick-view drawer.
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
  const { go, back, state, route } = useStore();
  const [drawer, setDrawer] = useState<'evidence' | null>(null);
  const staff = isStaff(state.player?.role);

  if (minimal) {
    return <div className="min-h-screen bg-[#080d1a]"><main className={cx('mx-auto px-4', wide ? 'max-w-[1600px]' : 'max-w-6xl')}>{children}</main></div>;
  }

  return (
    <div className="flex min-h-[100svh] flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1728]/95 text-white shadow-[0_8px_28px_-18px_rgba(2,8,23,.8)] backdrop-blur-xl print:hidden">
        <div className={cx('mx-auto flex items-center gap-2 px-4 py-2.5', wide ? 'max-w-[1600px]' : 'max-w-7xl')}>
          <button onClick={() => go(staff ? { name: 'classroom' } : { name: 'home' })} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-[#071525] shadow-lg shadow-cyan-950/40" aria-label={staff ? 'ศูนย์ควบคุมห้องเรียน' : 'หน้าหลัก Home'}>
            <House className="h-5 w-5" />
          </button>
          {exitTo ? (
            <button onClick={() => go({ name: exitTo })} className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-200 ring-1 ring-white/15 hover:bg-white/10">
              <LogOut className="h-4 w-4 rotate-180" aria-hidden="true" />
              <span className="hidden sm:inline">ออกจากภารกิจ</span>
              <span className="sm:hidden">Exit</span>
            </button>
          ) : (
            <button onClick={back} className="grid h-11 w-11 place-items-center rounded-xl text-slate-200 ring-1 ring-white/15 hover:bg-white/10" aria-label="ย้อนกลับ Back">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0 flex-1 px-1">
            <h1 className="truncate font-display text-base font-bold tracking-wide text-white sm:text-lg">{title}</h1>
            {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
          </div>
          {!minimal && <button onClick={() => go(staff ? { name: 'classroom' } : { name: 'account' })} className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-cyan-100 ring-1 ring-cyan-200/20 hover:bg-cyan-300/10" aria-label={staff ? 'ศูนย์ควบคุมห้องเรียน' : 'เปิดบัญชีของฉัน'}>
            {staff ? <Presentation className="h-4 w-4" aria-hidden="true" /> : <UserRound className="h-4 w-4" aria-hidden="true" />}
            <span className="hidden md:inline">{staff ? 'ควบคุมห้อง' : 'บัญชี'}</span>
          </button>}
          {!minimal && !staff && <button onClick={() => go({ name: 'learn' })} aria-current={route.name === 'learn' ? 'page' : undefined} className={cx('inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold ring-1 transition-colors', route.name === 'learn' ? 'bg-violet-300/15 text-violet-100 ring-violet-200/35' : 'text-violet-100 ring-violet-200/20 hover:bg-violet-300/10')} aria-label="เปิดคลังความรู้">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">คลังความรู้</span>
          </button>}
          {!minimal && !staff && <button onClick={() => setDrawer('evidence')} className="relative inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-sky-100 ring-1 ring-sky-200/20 hover:bg-sky-300/10 max-[420px]:hidden" aria-label={`เปิด Evidence Board (${state.evidence.length} ชิ้น)`}>
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">หลักฐาน</span>
            <span className="rounded-full bg-sky-600 px-1.5 text-[11px] font-bold leading-5 text-white tabular-nums">{state.evidence.length}</span>
          </button>}
        </div>
      </header>
      <main className={cx('mx-auto min-w-0 w-full flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-8', wide ? 'max-w-[1600px]' : 'max-w-7xl')}>{children}</main>

      <footer className="relative mt-auto w-full shrink-0 overflow-hidden border-t border-cyan-300/15 bg-[radial-gradient(ellipse_at_18%_0%,_rgba(8,145,178,.14),_transparent_42%),linear-gradient(135deg,#08111f,#0b1728_58%,#10132a)] text-slate-300 print:hidden">
        <div className={cx('mx-auto flex w-full flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6', wide ? 'max-w-[1600px]' : 'max-w-7xl')}>
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,.1)]"><Cpu className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0"><p className="font-display text-sm font-extrabold tracking-[.12em] text-white">HARDWARE QUEST</p><p className="text-xs text-slate-400">เกมเรียนรู้ฮาร์ดแวร์ · สำรวจ ประกอบ และซ่อมคอมพิวเตอร์</p></div>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-[11px] text-slate-400 sm:border-0 sm:pt-0">
            <span className="font-semibold tracking-[.16em] text-cyan-200/80">LEARN · BUILD · REPAIR</span>
            <span>© {new Date().getFullYear()} Hardware Quest</span>
          </div>
        </div>
      </footer>

      {!minimal && <Modal open={drawer === 'evidence'} onClose={() => setDrawer(null)} title="Evidence Board · กระดานหลักฐาน" wide>
        <EvidenceBoardBody />
      </Modal>}
    </div>
  );
}

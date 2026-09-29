import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, EyeOff, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { HardwareArt, artHotspots } from './HardwareArt';
import { cx } from './ui';

/** Zoom / rotate / inspect viewer for one hardware illustration with clickable hotspots. */
export function Inspector({
  art,
  title,
  seen,
  onSpot,
  revealName,
}: {
  art: string;
  title: string;
  seen: number[];
  onSpot: (i: number) => void;
  revealName?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [flip, setFlip] = useState(false);
  const [showSpots, setShowSpots] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const spots = artHotspots(art);

  const tool = 'grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40';

  return (
    <div className="overflow-hidden rounded-3xl bg-slate-900 shadow-xl">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="font-mono text-sm font-bold text-cyan-300">{revealName ?? title}</p>
        <span className="font-mono text-xs text-slate-400 tabular-nums">
          ZOOM {zoom.toFixed(1)}× · {((rot % 360) + 360) % 360}°{flip ? ' · BACK' : ''}
        </span>
      </div>
      <div className="relative aspect-[10/7] overflow-hidden bg-[radial-gradient(circle,_#1e293b,_#0f172a)] [background-size:100%]">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(#334155_1px,transparent_1px),linear-gradient(90deg,#334155_1px,transparent_1px)] [background-size:24px_24px]" aria-hidden="true" />
        <motion.div className="absolute inset-0" animate={{ scale: zoom, rotate: rot, rotateY: flip ? 180 : 0 }} transition={{ type: 'spring', stiffness: 160, damping: 20 }} style={{ transformPerspective: 800 }}>
          <HardwareArt art={art} title={revealName ?? title} className="h-full w-full p-6" />
          {showSpots && !flip &&
            spots.map((s, i) => (
              <button
                key={s.label}
                onClick={() => {
                  setActive(i);
                  onSpot(i);
                }}
                aria-label={`ตรวจจุด ${i + 1}: ${seen.includes(i) ? s.label : 'ยังไม่ได้ตรวจ'}`}
                className="absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center"
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
              >
                <span className={cx('absolute inset-0 rounded-full', seen.includes(i) ? 'bg-emerald-400/30' : 'animate-ping bg-cyan-400/50')} />
                <span className={cx('relative grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ring-2 ring-white', seen.includes(i) ? 'bg-emerald-500 text-white' : 'bg-cyan-400 text-slate-900')} style={{ transform: `scale(${1 / zoom})` }}>
                  {seen.includes(i) ? '✓' : i + 1}
                </span>
              </button>
            ))}
        </motion.div>
        {flip && <p className="absolute inset-x-0 bottom-3 text-center text-xs text-slate-400">ด้านหลัง — พลิกกลับเพื่อตรวจจุดสำคัญ</p>}
      </div>
      <AnimatePresence mode="wait">
        {active !== null && spots[active] && (
          <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-3 mt-3 rounded-2xl bg-white/10 p-3 text-sm text-slate-100" aria-live="polite">
            <b className="text-cyan-300">🔎 {spots[active].label}</b> — {spots[active].note}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-wrap items-center justify-center gap-2 p-3">
        <button className={tool} onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.3).toFixed(1)))} disabled={zoom <= 0.7} aria-label="ซูมออก Zoom out"><ZoomOut className="h-5 w-5" /></button>
        <input type="range" min={0.7} max={2.5} step={0.1} value={zoom} onChange={(e) => setZoom(+e.target.value)} className="w-28 accent-cyan-400" aria-label="ระดับการซูม" />
        <button className={tool} onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.3).toFixed(1)))} disabled={zoom >= 2.5} aria-label="ซูมเข้า Zoom in"><ZoomIn className="h-5 w-5" /></button>
        <span className="mx-1 h-6 w-px bg-white/20" aria-hidden="true" />
        <button className={tool} onClick={() => setRot((r) => r - 90)} aria-label="หมุนซ้าย Rotate left"><RotateCcw className="h-5 w-5" /></button>
        <button className={tool} onClick={() => setRot((r) => r + 90)} aria-label="หมุนขวา Rotate right"><RotateCw className="h-5 w-5" /></button>
        <button className={cx(tool, 'w-auto px-3 text-sm font-semibold')} onClick={() => setFlip((f) => !f)}>พลิก</button>
        <button className={cx(tool, 'w-auto gap-1 px-3 text-sm font-semibold')} onClick={() => setShowSpots((v) => !v)} aria-pressed={showSpots}>
          {showSpots ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />} Inspect
        </button>
        <button className={cx(tool, 'w-auto px-3 text-sm font-semibold')} onClick={() => { setZoom(1); setRot(0); setFlip(false); }}>รีเซ็ต</button>
      </div>
      <p className="px-4 pb-3 text-center text-xs text-slate-400 tabular-nums">ตรวจแล้ว {seen.length}/{spots.length} จุด</p>
    </div>
  );
}

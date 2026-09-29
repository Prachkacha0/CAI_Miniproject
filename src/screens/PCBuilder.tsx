import { Component, lazy, Suspense, useEffect, useMemo, useState, type ComponentType, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle, Box, Check, ChevronRight, CircuitBoard, Cpu, Fan,
  HardDrive, MemoryStick, MonitorUp, PlugZap, Power, RotateCcw, Sparkles, Trophy,
  Wrench, X,
} from 'lucide-react';
import { Shell } from '../components/Shell';
import { cx } from '../components/ui';
import {
  buildPower, buildPrice, CATEGORY_LABELS, CATEGORY_ORDER,
  checkBuild, PARTS, SCENARIOS, scoreBuild,
  type Build, type PartCategory, type PcPart,
} from '../game/pcBuilder';

type GameIcon = ComponentType<{ className?: string; style?: CSSProperties }>;

const ICONS: Record<PartCategory, GameIcon> = {
  case: Box,
  motherboard: CircuitBoard,
  cpu: Cpu,
  ram: MemoryStick,
  gpu: MonitorUp,
  storage: HardDrive,
  psu: PlugZap,
  cooler: Fan,
};

const BuilderScene3D = lazy(() => import('../components/BuilderScene3D').then((module) => ({ default: module.BuilderScene3D })));

class SceneErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

const RECOMMENDED: Record<string, string[]> = {
  'starter-stream': ['case-pulse', 'mb-breeze', 'cpu-r5', 'ram-ddr5-16', 'gpu-spark', 'ssd-1', 'psu-550', 'cool-air'],
  'creator-studio': ['case-forge', 'mb-prime', 'cpu-i5', 'ram-ddr5-64', 'gpu-arc', 'ssd-2', 'psu-750', 'cool-tower'],
  'arena-pro': ['case-aurora', 'mb-breeze', 'cpu-r7', 'ram-ddr5-32', 'gpu-ray', 'ssd-1', 'psu-750', 'cool-tower'],
};

const BOOT_LINES = [
  'จ่ายไฟเข้าสู่เมนบอร์ด...',
  'ตรวจสอบ CPU และหน่วยความจำ...',
  'กำลังค้นหาอุปกรณ์จัดเก็บข้อมูล...',
  'ทดสอบกราฟิกและระบบระบายความร้อน...',
  'POST สำเร็จ — กำลังเข้าสู่ระบบ',
];

type BootState = 'idle' | 'checking' | 'success' | 'failed';

function fromIds(ids: string[]): Build {
  return ids.reduce<Build>((acc, id) => {
    const part = PARTS.find((item) => item.id === id);
    if (part) acc[part.category] = part;
    return acc;
  }, {});
}

export function PCBuilder() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [category, setCategory] = useState<PartCategory>('case');
  const [selectedId, setSelectedId] = useState<string | null>('case-pulse');
  const [build, setBuild] = useState<Build>({});
  const [boot, setBoot] = useState<BootState>('idle');
  const [bootStep, setBootStep] = useState(0);
  const [sceneBusy, setSceneBusy] = useState(false);
  const [draggedPartId, setDraggedPartId] = useState<string | null>(null);
  const [dropReady, setDropReady] = useState(false);
  const [installRequest, setInstallRequest] = useState<{ partId: string; nonce: number } | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>(() => {
    try { return localStorage.getItem('hardware-quest.builder.view') === '2d' ? '2d' : '3d'; } catch { return '3d'; }
  });
  const [bestScores, setBestScores] = useState<Record<string, number>>(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem('hardware-quest.builder.v1') ?? '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, number> : {};
    } catch { return {}; }
  });
  const scenario = SCENARIOS.find((item) => item.id === scenarioId)!;
  const selected = PARTS.find((item) => item.id === selectedId) ?? null;
  const issues = useMemo(() => checkBuild(build, scenario), [build, scenario]);
  const price = buildPrice(build);
  const power = buildPower(build);
  const blocks = issues.filter((issue) => issue.severity === 'block');
  const warnings = issues.filter((issue) => issue.severity === 'warn');
  const headlineIssue = blocks[0] ?? warnings[0] ?? issues.find((issue) => issue.severity === 'good');
  const installed = CATEGORY_ORDER.filter((item) => build[item]).length;
  const result = boot === 'success' ? scoreBuild(build, scenario) : null;

  useEffect(() => {
    if (boot !== 'checking') return;
    const timer = window.setTimeout(() => {
      if (bootStep < BOOT_LINES.length - 1) setBootStep((step) => step + 1);
      else setBoot(checkBuild(build, scenario).some((issue) => issue.severity === 'block') ? 'failed' : 'success');
    }, 620);
    return () => window.clearTimeout(timer);
  }, [boot, bootStep, build, scenario]);

  useEffect(() => {
    if (!result || result.total <= (bestScores[scenario.id] ?? 0)) return;
    const next = { ...bestScores, [scenario.id]: result.total };
    setBestScores(next);
    try { localStorage.setItem('hardware-quest.builder.v1', JSON.stringify(next)); } catch { /* Game remains playable when storage is unavailable. */ }
  }, [result, scenario.id, bestScores]);

  function resetBuild(nextScenarioId = scenarioId) {
    setScenarioId(nextScenarioId);
    setBuild({});
    setSelectedId('case-pulse');
    setCategory('case');
    setBoot('idle');
    setBootStep(0);
  }

  function install(categoryToFill: PartCategory, partId = selected?.id) {
    const part = PARTS.find((item) => item.id === partId);
    if (!part || part.category !== categoryToFill || boot === 'checking') return;
    setBuild((current) => ({ ...current, [categoryToFill]: part }));
    setSelectedId(null);
    setBoot('idle');
    const index = CATEGORY_ORDER.indexOf(categoryToFill);
    const nextEmpty = CATEGORY_ORDER.slice(index + 1).find((item) => !build[item]);
    if (nextEmpty) setCategory(nextEmpty);
  }

  function startPartDrag(event: DragEvent<HTMLElement>, partId: string) {
    if (sceneBusy || boot === 'checking') return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', partId);
    setDraggedPartId(partId);
  }

  function dropPart(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const partId = event.dataTransfer.getData('text/plain') || draggedPartId;
    const part = PARTS.find((item) => item.id === partId);
    setDropReady(false);
    setDraggedPartId(null);
    if (!part || sceneBusy || boot === 'checking') return;
    setCategory(part.category);
    setSelectedId(part.id);
    if (viewMode === '3d') setInstallRequest({ partId: part.id, nonce: Date.now() });
    else install(part.category, part.id);
  }

  function changeViewMode(mode: '3d' | '2d') {
    setViewMode(mode);
    try { localStorage.setItem('hardware-quest.builder.view', mode); } catch { /* Optional preference only. */ }
  }

  function tryBoot() {
    if (blocks.length) {
      setBoot('failed');
      return;
    }
    setBootStep(0);
    setBoot('checking');
  }

  return (
    <Shell title="PC BUILD LAB" subtitle="เลือก · ติดตั้ง · เปิดเครื่อง" wide minimal>
      <div className="pc-builder-shell -mx-4 min-h-screen overflow-hidden bg-[#080d1a] text-white">
        <div className="flex max-w-full flex-wrap items-center gap-3 border-b border-white/10 bg-[#0c1424] px-4 py-3 sm:px-6">
          <div className="flex w-full min-w-0 items-center gap-3 sm:mr-auto sm:w-auto">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-400 text-slate-950"><Wrench className="h-5 w-5" /></span>
            <div className="min-w-0"><b className="block truncate font-display">โต๊ะประกอบคอม</b><span className="block truncate text-xs text-slate-400">{scenario.role} · งบ {scenario.budget.toLocaleString('th-TH')} ฿</span></div>
          </div>
          <label className="sr-only" htmlFor="scenario-select">เลือกโจทย์</label>
          <select id="scenario-select" value={scenario.id} disabled={boot === 'checking' || sceneBusy} onChange={(event) => resetBuild(event.target.value)} className="min-h-11 w-full min-w-0 cursor-pointer rounded-xl border border-white/15 bg-slate-900 px-3 text-sm font-bold text-white outline-none focus:border-cyan-300 disabled:opacity-40 sm:w-auto">
            {SCENARIOS.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.difficulty}</option>)}
          </select>
          <button disabled={boot === 'checking' || sceneBusy} onClick={() => setBuild(fromIds(RECOMMENDED[scenario.id] ?? []))} className="builder-button border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"><Sparkles className="h-4 w-4" /> สเปกตัวอย่าง</button>
          <button disabled={boot === 'checking' || sceneBusy} onClick={() => resetBuild()} className="builder-button border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40" aria-label="ล้างโต๊ะ"><RotateCcw className="h-4 w-4" /></button>
        </div>

        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="order-2 rounded-3xl border border-white/10 bg-[#0d1424] p-3 lg:order-1">
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="text-xs font-bold tracking-[.16em] text-cyan-300">PARTS DEPOT</p>
                <h3 className="font-display text-lg font-bold">คลังชิ้นส่วน</h3>
              </div>
              <span className="rounded-xl bg-white/5 px-2 py-1 text-xs text-slate-400">{PARTS.filter((part) => part.category === category).length} รายการ</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORY_ORDER.map((item) => {
                const Icon = ICONS[item];
                return (
                  <button key={item} disabled={sceneBusy || boot === 'checking'} onClick={() => { setCategory(item); setSelectedId(null); }} aria-label={CATEGORY_LABELS[item].th} aria-pressed={category === item} className={cx('relative grid min-h-12 cursor-pointer place-items-center rounded-xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40', category === item ? 'bg-cyan-400 text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white')}>
                    <Icon className="h-5 w-5" />
                    {build[item] && <Check className="absolute right-1 top-1 h-3 w-3 rounded-full bg-emerald-400 p-0.5 text-emerald-950" />}
                  </button>
                );
              })}
            </div>
            <p className="mb-2 mt-4 px-1 text-xs font-semibold text-slate-400">{CATEGORY_LABELS[category].th} · {CATEGORY_LABELS[category].en}</p>
            <div className="space-y-2 lg:max-h-[680px] lg:overflow-y-auto lg:pr-1">
              {PARTS.filter((part) => part.category === category).map((part, index) => (
                <PartCard key={part.id} part={part} selected={part.id === selectedId} installed={build[category]?.id === part.id} disabled={sceneBusy || boot === 'checking'} index={index} onSelect={() => setSelectedId(part.id)} onDragStart={(event) => startPartDrag(event, part.id)} onDragEnd={() => { setDraggedPartId(null); setDropReady(false); }} />
              ))}
            </div>
          </aside>

          <section className="order-1 min-w-0 lg:order-2">
            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3">
              <div className="w-full min-w-0 flex-1 sm:w-auto sm:min-w-[220px]"><b className="font-display" style={{ color: scenario.accent }}>{scenario.title}</b><p className="truncate text-xs text-slate-400" title={scenario.brief}>{scenario.brief}</p></div>
              <span className={cx('rounded-xl px-3 py-2 text-sm font-bold tabular-nums ring-1', price > scenario.budget ? 'bg-rose-400/10 text-rose-200 ring-rose-400/30' : 'bg-emerald-400/10 text-emerald-200 ring-emerald-400/25')}>{price.toLocaleString('th-TH')} / {scenario.budget.toLocaleString('th-TH')} ฿</span>
              <span className="rounded-xl bg-white/5 px-3 py-2 text-sm font-bold text-slate-300 ring-1 ring-white/10">{power}W</span>
              <span className={cx('rounded-xl px-3 py-2 text-sm font-bold ring-1', blocks.length ? 'bg-rose-400/10 text-rose-200 ring-rose-400/30' : warnings.length ? 'bg-amber-300/10 text-amber-200 ring-amber-300/25' : 'bg-emerald-400/10 text-emerald-200 ring-emerald-400/25')}>{blocks.length ? `${blocks.length} จุดต้องแก้` : warnings.length ? `${warnings.length} คำเตือน` : 'พร้อมบูต'}</span>
            </div>

            <div
              className={cx('relative overflow-hidden rounded-[2rem] border bg-[radial-gradient(circle_at_50%_35%,#192849,#080d19_68%)] p-4 shadow-[inset_0_0_60px_rgba(34,211,238,.05),0_30px_80px_rgba(0,0,0,.35)] transition sm:p-6', dropReady ? 'border-emerald-300 ring-4 ring-emerald-300/20' : 'border-cyan-300/20')}
              onDragEnter={(event) => { event.preventDefault(); if (draggedPartId) setDropReady(true); }}
              onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; if (draggedPartId) setDropReady(true); }}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropReady(false); }}
              onDrop={dropPart}
            >
              <div className="absolute inset-0 opacity-[.08] [background-image:linear-gradient(#67e8f9_1px,transparent_1px),linear-gradient(90deg,#67e8f9_1px,transparent_1px)] [background-size:24px_24px]" />
              <AnimatePresence>
                {dropReady && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-3 z-20 grid place-items-center rounded-[1.5rem] border-2 border-dashed border-emerald-300 bg-emerald-950/85 backdrop-blur-sm">
                    <div className="text-center"><Wrench className="mx-auto h-10 w-10 text-emerald-300" /><b className="mt-3 block font-display text-xl text-white">ปล่อยเพื่อประกอบอัตโนมัติ</b><span className="text-sm text-emerald-200">วางตรงไหนก็ได้ ระบบจะดูดอะไหล่เข้าช่องที่ถูกต้อง</span></div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-[.18em] text-cyan-300">ASSEMBLY BAY 01</p>
                  <p className="mt-1 text-sm text-slate-400">{viewMode === '3d' ? 'มองผ่านสายตาช่าง หยิบอะไหล่ แล้วใช้มือประกอบลงเคส' : 'โหมดแผงควบคุมสำหรับคีย์บอร์ดและเครื่องที่ไม่มี WebGL'}</p>
                </div>
                <span className="hidden rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-slate-300 ring-1 ring-white/10 sm:inline-flex">ติดตั้งแล้ว {installed}/8</span>
              </div>

              {viewMode === '3d' ? (
                <SceneErrorBoundary fallback={<SceneFallback onSwitch={() => changeViewMode('2d')} />}>
                  <Suspense fallback={<SceneLoading />}>
                    <BuilderScene3D
                      build={build}
                      selectedId={selectedId}
                      issues={issues}
                      disabled={boot === 'checking' || sceneBusy}
                      onInstall={(item, partId) => install(item, partId)}
                      onBusyChange={setSceneBusy}
                      installRequest={installRequest}
                      onInstallRequestConsumed={() => setInstallRequest(null)}
                    />
                  </Suspense>
                </SceneErrorBoundary>
              ) : (
                <BuildGrid build={build} selected={selected} issues={issues} onInstall={install} onRemove={(item) => { setBuild((current) => ({ ...current, [item]: undefined })); setBoot('idle'); }} />
              )}

              {selected && boot !== 'checking' && (
                <button
                  disabled={sceneBusy}
                  onClick={() => viewMode === '3d' ? setInstallRequest({ partId: selected.id, nonce: Date.now() }) : install(selected.category, selected.id)}
                  className="relative mt-3 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-300/40 bg-emerald-400/15 px-4 font-bold text-emerald-100 transition hover:bg-emerald-400/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Wrench className="h-5 w-5" /> ติดตั้ง {selected.name} อัตโนมัติ
                </button>
              )}

              <AnimatePresence>
                {boot !== 'idle' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 grid place-items-center bg-[#030712]/90 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-3xl border border-cyan-300/25 bg-[#0a1221] p-5 shadow-[0_0_70px_rgba(34,211,238,.18)] sm:p-7">
                      {boot === 'checking' && <BootTerminal step={bootStep} />}
                      {boot === 'failed' && <BootFailed issues={blocks} onClose={() => setBoot('idle')} />}
                      {boot === 'success' && result && <ScorePanel score={result} warnings={warnings.length} onClose={() => setBoot('idle')} />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className={cx('rounded-2xl border px-4 py-3', blocks.length ? 'border-rose-400/25 bg-rose-400/10' : warnings.length ? 'border-amber-300/20 bg-amber-300/[.08]' : 'border-emerald-400/20 bg-emerald-400/[.08]')}>
                <div className="flex items-start gap-2">{blocks.length ? <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" /> : warnings.length ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> : <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />}<div><b className="text-sm">{headlineIssue?.title ?? 'ระบบพร้อม'}</b><p className="text-xs text-slate-400">{headlineIssue?.detail ?? 'ชิ้นส่วนเข้ากันได้ กดเปิดเครื่องเพื่อทดสอบ'}</p></div></div>
              </div>
              <button onClick={tryBoot} disabled={boot === 'checking' || sceneBusy} className={cx('group flex min-h-14 min-w-52 cursor-pointer items-center justify-between gap-4 rounded-2xl border px-5 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-50', blocks.length ? 'border-rose-400/30 bg-rose-500/15 hover:bg-rose-500/25' : 'border-emerald-300/40 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:brightness-110')}><span className="flex items-center gap-2"><Power className="h-6 w-6" /><b>POWER ON</b></span><ChevronRight className="h-5 w-5" /></button>
            </div>
          </section>
        </div>
      </div>
    </Shell>
  );
}

function SceneLoading() {
  return (
    <div className="grid h-[560px] place-items-center rounded-[1.75rem] border border-cyan-300/15 bg-[#050912] sm:h-[620px]" role="status">
      <div className="text-center"><span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300" /><b className="mt-4 block text-cyan-200">กำลังเตรียมโต๊ะประกอบ 3D</b><span className="text-xs text-slate-400">โหลดแสง โมเดล และระบบควบคุมมือ</span></div>
    </div>
  );
}

function SceneFallback({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="grid h-[560px] place-items-center rounded-[1.75rem] border border-amber-300/20 bg-[#050912] p-6 text-center sm:h-[620px]" role="alert">
      <div><AlertTriangle className="mx-auto h-10 w-10 text-amber-300" /><b className="mt-3 block text-lg">เครื่องนี้เปิดฉาก 3D ไม่สำเร็จ</b><p className="mt-1 text-sm text-slate-400">ยังสามารถเล่นเกมครบทุกระบบผ่านโหมด 2D ได้</p><button onClick={onSwitch} className="mt-4 min-h-11 cursor-pointer rounded-xl bg-white px-5 font-bold text-slate-950">เปิดโหมด 2D</button></div>
    </div>
  );
}

function BuildGrid({ build, selected, issues, onInstall, onRemove }: { build: Build; selected: PcPart | null; issues: ReturnType<typeof checkBuild>; onInstall: (category: PartCategory) => void; onRemove: (category: PartCategory) => void }) {
  return (
    <div className="relative mx-auto max-w-[720px] rounded-[2rem] border-[3px] border-slate-500/50 bg-[#111827] p-3 shadow-[inset_0_0_0_5px_#070b13,0_0_50px_rgba(34,211,238,.08)] sm:p-5">
      <div className="mb-3 flex items-center justify-between rounded-xl bg-black/35 px-3 py-2 text-[11px] font-bold tracking-wider text-slate-500">
        <span>HARDWARE QUEST // ACCESSIBLE CHASSIS</span>
        <span className="flex gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-400" /><i className="h-2 w-2 rounded-full bg-amber-300" /><i className="h-2 w-2 rounded-full bg-emerald-400" /></span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:grid-rows-3">
        {CATEGORY_ORDER.map((item) => (
          <BuildSlot key={item} category={item} part={build[item]} selected={selected?.category === item} issue={issues.some((issue) => issue.severity === 'block' && issue.categories.includes(item))} onInstall={() => onInstall(item)} onRemove={() => onRemove(item)} />
        ))}
      </div>
    </div>
  );
}

function PartCard({ part, selected, installed, disabled, index, onSelect, onDragStart, onDragEnd }: { part: PcPart; selected: boolean; installed: boolean; disabled: boolean; index: number; onSelect: () => void; onDragStart: (event: DragEvent<HTMLElement>) => void; onDragEnd: () => void }) {
  const Icon = ICONS[part.category];
  return (
    <div draggable={!disabled} onDragStart={onDragStart} onDragEnd={onDragEnd}>
    <motion.button disabled={disabled} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} onClick={onSelect} aria-pressed={selected} aria-label={`${part.name} แตะเพื่อเลือก หรือลากไปวางบนโต๊ะประกอบ`} className={cx('w-full cursor-grab rounded-2xl border p-3 text-left transition duration-200 active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40', selected ? 'border-cyan-300 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,.12)]' : 'border-white/10 bg-white/[.03] hover:border-white/20 hover:bg-white/[.07]')}>
      <span className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: part.color + '1f', color: part.color }}><Icon className="h-6 w-6" /></span>
        <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><b className="block truncate text-sm">{part.name}</b><b className="shrink-0 text-sm text-cyan-300">{part.price.toLocaleString('th-TH')} ฿</b></span><span className="block text-[11px] text-slate-400">{part.series}</span></span>
      </span>
      {installed && <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-bold text-emerald-300"><Check className="h-3 w-3" /> ติดตั้งแล้ว</span>}
      {!installed && <span className="mt-2 block text-[10px] font-semibold text-cyan-200/80">ลากไปวางที่โต๊ะได้เลย</span>}
    </motion.button>
    </div>
  );
}

function BuildSlot({ category, part, selected, issue, onInstall, onRemove }: { category: PartCategory; part?: PcPart; selected: boolean; issue: boolean; onInstall: () => void; onRemove: () => void }) {
  const Icon = ICONS[category];
  const span = category === 'motherboard' ? 'sm:col-span-2 sm:row-span-2' : category === 'case' ? 'sm:col-span-2' : '';
  return (
    <motion.div layout role={part ? undefined : 'button'} aria-label={part ? undefined : 'ติดตั้ง' + CATEGORY_LABELS[category].th} aria-disabled={!part && !selected} tabIndex={part ? -1 : 0} onClick={part ? undefined : onInstall} onKeyDown={(event) => { if (!part && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onInstall(); } }} className={cx('group relative min-h-24 cursor-pointer overflow-hidden rounded-2xl border p-3 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 sm:min-h-28', span, part ? issue ? 'border-rose-400/50 bg-rose-400/10' : 'border-white/15 bg-gradient-to-br from-white/10 to-white/[.03]' : selected ? 'animate-pulse border-cyan-300/70 bg-cyan-400/10 shadow-[inset_0_0_24px_rgba(34,211,238,.12)]' : 'border-dashed border-white/15 bg-black/15 hover:border-white/30')}>
      {part ? <>
        <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 70% 20%,' + part.color + ',transparent 45%)' }} />
        <span className="relative flex h-full flex-col"><Icon className="h-7 w-7" style={{ color: part.color }} /><b className="mt-auto block text-sm">{part.name}</b><small className="block truncate text-[10px] text-slate-400">{part.series}</small></span>
        <button onClick={(event) => { event.stopPropagation(); onRemove(); }} className="absolute right-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-black/40 text-slate-300 transition hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100" aria-label={'ถอด ' + part.name}><X className="h-4 w-4" /></button>
      </> : <span className="flex h-full flex-col items-center justify-center text-center"><Icon className={cx('h-6 w-6', selected ? 'text-cyan-300' : 'text-slate-600')} /><b className={cx('mt-1 text-xs', selected ? 'text-cyan-200' : 'text-slate-500')}>{selected ? 'แตะเพื่อติดตั้ง' : CATEGORY_LABELS[category].en}</b></span>}
    </motion.div>
  );
}

function BootTerminal({ step }: { step: number }) {
  return <div role="status" aria-live="polite"><div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 shadow-[0_0_35px_rgba(34,211,238,.2)]"><Power className="h-9 w-9 animate-pulse text-cyan-300" /></div><p className="text-center font-display text-xl font-bold">กำลังทดสอบระบบ</p><div className="mt-5 space-y-2 font-mono text-xs">{BOOT_LINES.map((line, index) => <motion.div key={line} initial={{ opacity: 0 }} animate={{ opacity: index <= step ? 1 : 0.18 }} className={cx('flex items-center gap-2 rounded-lg px-3 py-2', index === step ? 'bg-cyan-400/10 text-cyan-200' : index < step ? 'text-emerald-300' : 'text-slate-500')}><span>{index < step ? '[OK]' : index === step ? '[..]' : '[  ]'}</span>{line}</motion.div>)}</div></div>;
}

function BootFailed({ issues, onClose }: { issues: ReturnType<typeof checkBuild>; onClose: () => void }) {
  return <div><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-400/10 ring-1 ring-rose-400/30"><AlertTriangle className="h-8 w-8 text-rose-300" /></div><h3 className="mt-4 text-center font-display text-2xl font-bold text-rose-200">POST ไม่ผ่าน</h3><p className="mt-1 text-center text-sm text-slate-400">ระบบหยุดการบูตเพื่อป้องกันความเสียหาย</p><div className="mt-5 space-y-2">{issues.map((issue) => <div key={issue.id} className="rounded-xl bg-rose-400/10 p-3 ring-1 ring-rose-400/20"><b className="text-sm text-rose-200">{issue.title}</b><p className="text-xs text-slate-400">{issue.detail}</p></div>)}</div><button onClick={onClose} className="mt-5 min-h-11 w-full cursor-pointer rounded-xl bg-white px-4 font-bold text-slate-950 transition hover:bg-slate-200">กลับไปแก้ไข</button></div>;
}

function ScorePanel({ score, warnings, onClose }: { score: ReturnType<typeof scoreBuild>; warnings: number; onClose: () => void }) {
  return <div><div className="text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-300/30"><Trophy className="h-10 w-10 text-amber-300" /></div><p className="mt-4 text-xs font-bold tracking-[.2em] text-emerald-300">BUILD COMPLETE</p><h3 className="font-display text-3xl font-bold">{score.total} คะแนน</h3><div className="mt-1 flex justify-center gap-1 text-amber-300">{[1, 2, 3].map((star) => <Sparkles key={star} className={cx('h-6 w-6', star > score.stars && 'opacity-20')} />)}</div></div><div className="mt-5 grid grid-cols-2 gap-2"><ScoreStat label="ตรงโจทย์" value={score.fit} /><ScoreStat label="คุมงบ" value={score.budget} /><ScoreStat label="ความเย็น" value={score.thermal} /><ScoreStat label="กำลังไฟ" value={score.power} /></div>{warnings > 0 && <p className="mt-4 rounded-xl bg-amber-300/10 p-3 text-center text-xs text-amber-200">บูตผ่าน แต่ยังมี {warnings} จุดที่ปรับให้ตรงโจทย์ได้ดีขึ้น</p>}<button onClick={onClose} className="mt-5 min-h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 font-bold text-slate-950 transition hover:brightness-110">ปรับแต่งสเปกต่อ</button></div>;
}

function ScoreStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-white/5 p-3 text-center ring-1 ring-white/10"><span className="block text-xs text-slate-400">{label}</span><b className="font-display text-xl tabular-nums">{value}</b></div>;
}

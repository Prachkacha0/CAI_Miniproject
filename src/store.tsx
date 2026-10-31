import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AssemblyOrder, Classroom, Evidence, FinalCaseRecord, GameState, LOId, MissionId, MissionScore, ReflectionData, TeacherAccount, TestResult, UserRole } from './types';
import { PASS_RATIO } from './data/assessment';
import { MISSIONS } from './data/missions';
import { classroomFinalAllowed, classroomLockReason, classroomMissionAllowed, hashStaffPin, normalizeClassroomCode } from './game/classroom';

const KEY = 'hardware-quest.v1';
const SESSION_KEY = 'hardware-quest.session.v1';
const MISSION_IDS: MissionId[] = [1, 2, 3, 4, 5, 6];

function freshState(): GameState {
  return {
    version: 1,
    player: null,
    classrooms: {},
    teacherAccounts: {},
    preTest: null,
    postTest: null,
    postTestBest: null,
    missions: Object.fromEntries(MISSION_IDS.map((id) => [id, { completed: false, plays: 0, hintsUsed: 0 }])) as GameState['missions'],
    assemblyOrder: null,
    builderCompleted: false,
    finalCase: { completed: false },
    reflection: null,
    evidence: [],
    buddyUses: 0,
    labViewed: [],
    learnViewed: [],
    certificate: null,
  };
}

function migrateTestOutcome(result: TestResult | null | undefined): TestResult | null {
  if (!result || result.outcomeVersion === 2) return result ?? null;
  const old = result.byLO as Record<number, { correct: number; total: number }> | undefined;
  const combine = (...ids: number[]) => ids.reduce((sum, id) => ({
    correct: sum.correct + (old?.[id]?.correct ?? 0),
    total: sum.total + (old?.[id]?.total ?? 0),
  }), { correct: 0, total: 0 });
  return {
    ...result,
    byLO: { 1: combine(1, 2), 2: combine(3), 3: combine(4), 4: combine(5), 5: combine(6) },
    outcomeVersion: 2,
  };
}

function load(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as GameState;
    if (parsed?.version !== 1) return freshState();
    const base = freshState();
    let sessionPlayer: GameState['player'] = null;
    try {
      const sessionRaw = sessionStorage.getItem(SESSION_KEY);
      sessionPlayer = sessionRaw ? JSON.parse(sessionRaw) as GameState['player'] : null;
    } catch {
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Ignore unavailable session storage. */ }
    }
    const legacyPlayer = sessionPlayer ?? parsed.player as GameState['player'] | ({ name: string; group: string; role?: UserRole | 'admin'; classroomCode?: string }) | null;
    const player = legacyPlayer ? { ...legacyPlayer, role: legacyPlayer.role === 'admin' ? 'teacher' : legacyPlayer.role ?? 'student', classroomCode: legacyPlayer.classroomCode ? normalizeClassroomCode(legacyPlayer.classroomCode) : undefined } : null;
    if (!sessionPlayer && player) {
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(player)); } catch { /* Continue with in-memory migration. */ }
    }
    const saved = parsed as GameState & { adminPinHash?: string | null; teacherPinHash?: string | null; teacherAccounts?: Record<string, TeacherAccount> };
    const teacherAccounts = { ...(saved.teacherAccounts ?? {}) };
    const legacyAccessHash = saved.teacherPinHash ?? saved.adminPinHash;
    const legacyTeacher = legacyPlayer && (legacyPlayer.role === 'teacher' || legacyPlayer.role === 'admin') ? legacyPlayer : null;
    const legacyTeacherKey = legacyTeacher?.name.normalize('NFC').trim().toLocaleLowerCase();
    if (legacyAccessHash && legacyTeacher && legacyTeacherKey && !teacherAccounts[legacyTeacherKey]) {
      teacherAccounts[legacyTeacherKey] = { name: legacyTeacher.name, passwordHash: legacyAccessHash };
    }
    return {
      ...base,
      ...parsed,
      adminPinHash: undefined,
      teacherPinHash: undefined,
      teacherAccounts,
      player,
      preTest: migrateTestOutcome(parsed.preTest),
      postTest: migrateTestOutcome(parsed.postTest),
      postTestBest: migrateTestOutcome(parsed.postTestBest),
      classrooms: parsed.classrooms ?? {},
      missions: { ...base.missions, ...parsed.missions },
    } as GameState;
  } catch {
    return freshState();
  }
}

export const avgScore = (s?: MissionScore) =>
  s ? Math.round((s.accuracy + s.investigation + s.reasoning + s.independence) / 4) : 0;

const better = (a: MissionScore | undefined, b: MissionScore) => (!a || avgScore(b) >= avgScore(a) ? b : a);

export const testPassed = (t: TestResult | null) => !!t && t.score / t.total >= PASS_RATIO;

// ---------- Routing (hash based so browser Back works) ----------
export type Route =
  | { name: 'start' }
  | { name: 'pretest' }
  | { name: 'home' }
  | { name: 'account' }
  | { name: 'classroom' }
  | { name: 'mission'; id: MissionId }
  | { name: 'final' }
  | { name: 'learn'; hw?: string }
  | { name: 'lab' }
  | { name: 'builder' }
  | { name: 'evidence' }
  | { name: 'progress' }
  | { name: 'posttest' }
  | { name: 'reflection' }
  | { name: 'certificate' };

export function routeToHash(r: Route): string {
  switch (r.name) {
    case 'mission': return `#/mission/${r.id}`;
    case 'learn': return r.hw ? `#/learn/${r.hw}` : '#/learn';
    default: return `#/${r.name}`;
  }
}

function hashToRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [head, arg] = parts;
  if (head === 'mission') {
    const id = Number(arg);
    if (id >= 1 && id <= 6) return { name: 'mission', id: id as MissionId };
    return { name: 'home' };
  }
  if (head === 'learn') return { name: 'learn', hw: arg };
  if (head === 'map') return { name: 'home' };
  const simple = ['start', 'pretest', 'home', 'account', 'classroom', 'final', 'lab', 'builder', 'evidence', 'progress', 'posttest', 'reflection', 'certificate'];
  if (head && simple.includes(head)) return { name: head } as Route;
  return { name: 'home' };
}

// ---------- Context ----------
interface Store {
  state: GameState;
  route: Route;
  go: (r: Route) => void;
  back: () => void;
  setPlayer: (name: string, group: string, role: UserRole, classroomCode?: string) => void;
  registerTeacher: (name: string, password: string) => boolean;
  signOut: () => void;
  createClassroom: (name: string, preferredCode?: string) => string;
  updateClassroom: (code: string, update: Partial<Pick<Classroom, 'unlockedThrough' | 'finalUnlocked' | 'active' | 'name'>>) => void;
  savePreTest: (t: TestResult) => void;
  savePostTest: (t: TestResult) => void;
  completeMission: (id: MissionId, score: MissionScore, meta?: Record<string, unknown>) => void;
  saveAssemblyOrder: (order: AssemblyOrder) => void;
  markBuilderComplete: () => void;
  addHint: (id: MissionId | 'final') => void;
  addEvidence: (e: Omit<Evidence, 'at'>) => boolean;
  completeFinal: (rec: Omit<FinalCaseRecord, 'completed' | 'at'>) => void;
  saveReflection: (r: Omit<ReflectionData, 'at'>) => void;
  markLab: (id: string) => void;
  markLearn: (id: string) => void;
  noteBuddy: () => void;
  issueCertificate: () => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(load);
  const [route, setRoute] = useState<Route>(() => {
    const s = load();
    const hashRoute = window.location.hash ? hashToRoute(window.location.hash) : null;
    if (!s.player) return { name: 'start' };
    return hashRoute ?? { name: 'home' };
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...state, player: null }));
    } catch {
      /* storage unavailable: game still works for this session */
    }
  }, [state]);

  useEffect(() => {
    const onHash = () => setRoute(hashToRoute(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY) setState(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  const go = useCallback((r: Route) => {
    const h = routeToHash(r);
    if (window.location.hash === h) setRoute(r);
    else window.location.hash = h;
  }, []);

  const back = useCallback(() => {
    if (window.history.length > 1) window.history.back();
    else go({ name: 'home' });
  }, [go]);

  const patch = useCallback((fn: (s: GameState) => GameState) => setState((s) => fn(s)), []);

  const store = useMemo<Store>(() => ({
    state,
    route,
    go,
    back,
    setPlayer: (name, group, role, rawClassroomCode) => {
      const classroomCode = rawClassroomCode ? normalizeClassroomCode(rawClassroomCode) : undefined;
      const room = classroomCode ? state.classrooms[classroomCode] : undefined;
      const player = { name, group: room?.name ?? group, role, classroomCode };
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(player)); } catch { /* Session still works in memory. */ }
      patch((s) => {
        const currentRoom = classroomCode ? s.classrooms[classroomCode] : undefined;
        if (!currentRoom || role !== 'student' || currentRoom.members.includes(name)) return { ...s, player };
        return { ...s, player, classrooms: { ...s.classrooms, [classroomCode!]: { ...currentRoom, members: [...currentRoom.members, name], updatedAt: Date.now() } } };
      });
    },
    registerTeacher: (name, password) => {
      const key = name.normalize('NFC').trim().toLocaleLowerCase();
      if (!key || state.teacherAccounts[key]) return false;
      patch((s) => s.teacherAccounts[key] ? s : { ...s, teacherAccounts: { ...s.teacherAccounts, [key]: { name: name.trim(), passwordHash: hashStaffPin(password) } } });
      return true;
    },
    signOut: () => {
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Ignore unavailable storage. */ }
      if (state.player?.role === 'student') {
        setState((s) => ({ ...freshState(), classrooms: s.classrooms, teacherAccounts: s.teacherAccounts }));
        try { localStorage.removeItem('hardware-quest.builder.v1'); } catch { /* Ignore unavailable storage. */ }
      } else {
        patch((s) => ({ ...s, player: null }));
      }
      window.location.hash = '#/start';
    },
    createClassroom: (name, preferredCode) => {
      let code = normalizeClassroomCode(preferredCode ?? '');
      if (!code) {
        do { code = `HQ-${Math.random().toString(36).slice(2, 7).toUpperCase()}`; } while (state.classrooms[code]);
      }
      patch((s) => {
        if (s.classrooms[code]) return s;
        const room: Classroom = { code, name, teacherName: s.player?.name ?? 'ผู้ดูแล', unlockedThrough: 1, finalUnlocked: false, active: true, members: [], updatedAt: Date.now() };
        return { ...s, classrooms: { ...s.classrooms, [code]: room }, player: s.player ? { ...s.player, classroomCode: code, group: name } : s.player };
      });
      if (state.player) {
        const updatedPlayer = { ...state.player, classroomCode: code, group: name };
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedPlayer)); } catch { /* Session still works in memory. */ }
      }
      return code;
    },
    updateClassroom: (rawCode, update) => patch((s) => {
      const code = normalizeClassroomCode(rawCode);
      const room = s.classrooms[code];
      if (!room || s.player?.role !== 'teacher' || room.teacherName !== s.player.name) return s;
      const unlockedThrough = update.unlockedThrough === undefined ? room.unlockedThrough : Math.max(0, Math.min(6, Math.round(update.unlockedThrough)));
      return { ...s, classrooms: { ...s.classrooms, [code]: { ...room, ...update, unlockedThrough, finalUnlocked: unlockedThrough < 6 ? false : (update.finalUnlocked ?? room.finalUnlocked), updatedAt: Date.now() } } };
    }),
    savePreTest: (t) => patch((s) => ({ ...s, preTest: t })),
    savePostTest: (t) => patch((s) => ({
      ...s,
      postTest: t,
      postTestBest: !s.postTestBest || t.score >= s.postTestBest.score ? t : s.postTestBest,
    })),
    completeMission: (id, score, meta) => patch((s) => {
      const m = s.missions[id];
      return {
        ...s,
        missions: { ...s.missions, [id]: { ...m, completed: true, plays: m.plays + 1, best: better(m.best, score), meta: { ...m.meta, ...meta } } },
      };
    }),
    saveAssemblyOrder: (order) => patch((s) => ({ ...s, assemblyOrder: order, builderCompleted: false })),
    markBuilderComplete: () => patch((s) => s.builderCompleted ? s : { ...s, builderCompleted: true }),
    addHint: (id) => patch((s) => {
      if (id === 'final') return { ...s, buddyUses: s.buddyUses + 1 };
      return { ...s, missions: { ...s.missions, [id]: { ...s.missions[id], hintsUsed: s.missions[id].hintsUsed + 1 } } };
    }),
    addEvidence: (e) => {
      const exists = state.evidence.some((x) => x.id === e.id);
      if (!exists) patch((s) => (s.evidence.some((x) => x.id === e.id) ? s : { ...s, evidence: [...s.evidence, { ...e, at: Date.now() }] }));
      return !exists;
    },
    completeFinal: (rec) => patch((s) => ({ ...s, finalCase: { ...rec, completed: true, at: Date.now() } })),
    saveReflection: (r) => patch((s) => ({ ...s, reflection: { ...r, at: Date.now() } })),
    markLab: (id) => patch((s) => (s.labViewed.includes(id) ? s : { ...s, labViewed: [...s.labViewed, id] })),
    markLearn: (id) => patch((s) => (s.learnViewed.includes(id) ? s : { ...s, learnViewed: [...s.learnViewed, id] })),
    noteBuddy: () => patch((s) => ({ ...s, buddyUses: s.buddyUses + 1 })),
    issueCertificate: () => patch((s) => (s.certificate ? s : { ...s, certificate: { id: makeCertId(s), at: Date.now() } })),
    reset: () => {
      setState(freshState());
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Ignore unavailable storage. */ }
      try { localStorage.removeItem('hardware-quest.builder.v1'); } catch { /* Ignore unavailable storage. */ }
      window.location.hash = '#/start';
    },
  }), [state, route, go, back, patch]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

function makeCertId(s: GameState) {
  const seed = `${s.player?.name ?? ''}|${s.player?.group ?? ''}|${Date.now()}`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const code = (h >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(-7);
  return `HQ-${new Date().getFullYear()}-${code}`;
}

// ---------- Derived selectors ----------
export type MissionStatus = 'locked' | 'available' | 'completed';

export function missionStatus(s: GameState, id: MissionId): MissionStatus {
  if (!classroomMissionAllowed(s, id)) return 'locked';
  return s.missions[id].completed ? 'completed' : 'available';
}

export const canAccessFinal = (s: GameState) => classroomFinalAllowed(s);
export { classroomLockReason };

export const allMissionsDone = (s: GameState) => MISSION_IDS.every((id) => s.missions[id].completed);

export function currentStep(s: GameState): { label: string; route: Route; blocked?: boolean } {
  if (!s.preTest) return { label: 'ทำ Pre-Test', route: { name: 'pretest' } };
  const next = MISSIONS.find((m) => !s.missions[m.id].completed && missionStatus(s, m.id) === 'available');
  if (next) return { label: `${next.code} ${next.title}`, route: { name: 'mission', id: next.id } };
  const remaining = MISSIONS.find((m) => !s.missions[m.id].completed);
  if (remaining) return { label: classroomLockReason(s, remaining.id), route: { name: 'home' }, blocked: true };
  if (!s.builderCompleted) return { label: 'M-07 ประกอบคอมให้พร้อมใช้งาน', route: { name: 'builder' } };
  if (!s.finalCase.completed && canAccessFinal(s)) return { label: 'Final Case: กู้ระบบห้องทะเบียน', route: { name: 'final' } };
  if (!s.finalCase.completed) return { label: classroomLockReason(s), route: { name: 'home' }, blocked: true };
  if (!testPassed(s.postTestBest)) return { label: 'Post-Test', route: { name: 'posttest' } };
  if (!s.reflection) return { label: 'Reflection', route: { name: 'reflection' } };
  return { label: 'เปิดบัญชีเพื่อรับใบประกาศ', route: { name: 'account' } };
}

export function certRequirements(s: GameState) {
  return [
    ...MISSIONS.map((m) => ({ label: `Mission ${String(m.id).padStart(2, '0')} Completed`, done: s.missions[m.id].completed })),
    { label: 'Final Case Completed', done: s.finalCase.completed },
    { label: 'Post-Test Passed', done: testPassed(s.postTestBest) },
    { label: 'Reflection Completed', done: !!s.reflection },
  ];
}

export const certUnlocked = (s: GameState) => certRequirements(s).every((r) => r.done);

export type LOStatus = 'not-started' | 'practiced' | 'achieved';

/** Per-objective status from this player's own play data (not research data). */
export function loStatus(s: GameState, lo: LOId): { status: LOStatus; pct: number } {
  const missionIds: Record<LOId, MissionId[]> = { 1: [1, 2], 2: [3], 3: [4], 4: [5], 5: [6] };
  const practiced = missionIds[lo].every((id) => s.missions[id].completed);
  const post = s.postTestBest?.byLO[lo];
  const postPct = post ? post.correct / post.total : 0;
  if (practiced && post && postPct >= 0.5) return { status: 'achieved', pct: 100 };
  if (practiced) return { status: 'practiced', pct: post ? 50 + Math.round(postPct * 50) : 60 };
  return { status: 'not-started', pct: 0 };
}

export function earnedBadges(s: GameState): string[] {
  const out: string[] = [];
  if (s.evidence.length >= 25) out.push('evidence-hunter');
  if (s.missions[4].completed && s.missions[4].hintsUsed <= 1) out.push('hardware-analyst');
  if (s.finalCase.completed) out.push('system-fixer');
  if (s.missions[6].meta?.allFit) out.push('hardware-planner');
  if (s.certificate) out.push('system-technician');
  return out;
}

export function technicianProfile(s: GameState) {
  const scores = [...MISSION_IDS.map((id) => s.missions[id].best), s.finalCase.score].filter(Boolean) as MissionScore[];
  const avg = (k: keyof MissionScore) => (scores.length ? Math.round(scores.reduce((a, x) => a + x[k], 0) / scores.length) : 0);
  const selfLearning = Math.min(100, 40 + s.learnViewed.length * 6 + s.labViewed.length * 6 + (s.reflection ? 15 : 0));
  return [
    { key: 'Investigation', th: 'การสืบสวน', value: avg('investigation') },
    { key: 'Hardware Knowledge', th: 'ความรู้ Hardware', value: Math.round((avg('accuracy') + (s.postTestBest ? (s.postTestBest.score / s.postTestBest.total) * 100 : 0)) / (s.postTestBest ? 2 : 1)) },
    { key: 'Problem Solving', th: 'การแก้ปัญหา', value: avg('reasoning') },
    { key: 'Self Learning', th: 'การเรียนรู้ด้วยตนเอง', value: selfLearning },
  ];
}

export function gradeTest(questions: { lo: LOId; answer: number }[], answers: number[]): TestResult {
  const byLO = { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 }, 4: { correct: 0, total: 0 }, 5: { correct: 0, total: 0 } } as TestResult['byLO'];
  let score = 0;
  questions.forEach((q, i) => {
    byLO[q.lo].total++;
    if (answers[i] === q.answer) {
      byLO[q.lo].correct++;
      score++;
    }
  });
  return { score, total: questions.length, byLO, answers, at: Date.now(), outcomeVersion: 2 };
}

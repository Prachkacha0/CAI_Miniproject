export type Category = 'input' | 'processing' | 'storage' | 'output' | 'communication';

export type LOId = 1 | 2 | 3 | 4 | 5 | 6;

export type MissionId = 1 | 2 | 3 | 4 | 5 | 6;

export type UserRole = 'student' | 'teacher' | 'admin';

export interface PlayerProfile {
  name: string;
  group: string;
  role: UserRole;
  classroomCode?: string;
}

export interface Classroom {
  code: string;
  name: string;
  teacherName: string;
  unlockedThrough: number;
  finalUnlocked: boolean;
  active: boolean;
  members: string[];
  updatedAt: number;
}

export interface HardwareItem {
  id: string;
  name: string; // Thai display name
  en: string; // English technical term
  category: Category;
  icon: string; // key in ICONS map (components/HwIcon.tsx)
  art?: string; // key in HardwareArt (detailed SVG), optional
  func: string; // หน้าที่
  feature: string; // จุดเด่น / Key feature
  example: string; // ตัวอย่างการใช้งาน
  missions: MissionId[]; // related missions
  clues: { category: string; function: string; physical: string };
}

export type EvidenceType = 'hardware' | 'category' | 'function' | 'diagnostic' | 'case' | 'clue';

export interface Evidence {
  id: string; // unique key, e.g. "m1-ram"
  type: EvidenceType;
  title: string;
  lines: string[]; // short facts, e.g. ["RAM Usage: 96%", "Function: Temporary Memory"]
  mission: MissionId | 'final';
  hwId?: string;
  at: number;
}

export interface MissionScore {
  accuracy: number; // 0-100
  investigation: number;
  reasoning: number;
  independence: number;
}

export interface MissionRecord {
  completed: boolean;
  plays: number;
  best?: MissionScore;
  hintsUsed: number;
  meta?: Record<string, unknown>;
}

export interface TestResult {
  score: number;
  total: number;
  byLO: Record<LOId, { correct: number; total: number }>;
  answers: number[];
  at: number;
}

export interface ReflectionData {
  learned: string;
  difficult: string;
  solved: string;
  apply: string;
  at: number;
}

export interface FinalCaseRecord {
  completed: boolean;
  score?: MissionScore;
  explanation?: string;
  at?: number;
}

export interface GameState {
  version: 1;
  player: PlayerProfile | null;
  classrooms: Record<string, Classroom>;
  adminPinHash: string | null;
  teacherPinHash: string | null;
  preTest: TestResult | null;
  postTest: TestResult | null; // latest attempt
  postTestBest: TestResult | null;
  missions: Record<MissionId, MissionRecord>;
  finalCase: FinalCaseRecord;
  reflection: ReflectionData | null;
  evidence: Evidence[];
  buddyUses: number;
  labViewed: string[];
  learnViewed: string[];
  certificate: { id: string; at: number } | null;
}

import type { GameState, MissionId, UserRole } from '../types.ts';

export function normalizeClassroomCode(value: string) {
  return value.normalize('NFC').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12);
}

export function isStaff(role?: UserRole) {
  return role === 'teacher' || role === 'admin';
}

export function hashStaffPin(pin: string) {
  let hash = 2166136261;
  for (const char of `hardware-quest:${pin}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(36).toUpperCase();
}

export function activeClassroom(state: GameState) {
  const code = state.player?.classroomCode;
  return code ? state.classrooms[code] : undefined;
}

export function classroomMissionAllowed(state: GameState, id: MissionId) {
  if (isStaff(state.player?.role)) return true;
  if (!state.player?.classroomCode) return true;
  const classroom = activeClassroom(state);
  return !!classroom?.active && id <= classroom.unlockedThrough;
}

export function classroomFinalAllowed(state: GameState) {
  if (isStaff(state.player?.role)) return true;
  if (!state.player?.classroomCode) return true;
  const classroom = activeClassroom(state);
  return !!classroom?.active && classroom.finalUnlocked;
}

export function classroomLockReason(state: GameState, id?: MissionId) {
  if (!state.player?.classroomCode) return id ? `Mission ${String(id).padStart(2, '0')} ยังไม่พร้อม` : 'Final Case ยังไม่พร้อม';
  const classroom = activeClassroom(state);
  if (!classroom) return 'ไม่พบห้องเรียนนี้ กรุณาออกจากระบบแล้วตรวจรหัสห้องอีกครั้ง';
  if (!classroom.active) return 'ครูพักการใช้งานห้องเรียนนี้ชั่วคราว';
  return id ? `รอครูเปิด Mission ${String(id).padStart(2, '0')}` : 'รอครูเปิด Final Case';
}

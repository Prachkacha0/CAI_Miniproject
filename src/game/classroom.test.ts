import assert from 'node:assert/strict';
import test from 'node:test';
import { classroomFinalAllowed, classroomMissionAllowed, hashStaffPin, isStaff, normalizeClassroomCode } from './classroom.ts';
import type { GameState } from '../types.ts';

function state(overrides: Partial<GameState> = {}): GameState {
  return {
    version: 1,
    player: { name: 'Student', group: '', role: 'student' },
    classrooms: {},
    teacherAccounts: {},
    preTest: null,
    postTest: null,
    postTestBest: null,
    missions: Object.fromEntries([1, 2, 3, 4, 5, 6].map((id) => [id, { completed: false, plays: 0, hintsUsed: 0 }])) as GameState['missions'],
    assemblyOrder: null,
    builderCompleted: false,
    finalCase: { completed: false },
    reflection: null,
    evidence: [],
    buddyUses: 0,
    labViewed: [],
    learnViewed: [],
    certificate: null,
    ...overrides,
  };
}

test('normalizes classroom codes', () => {
  assert.equal(normalizeClassroomCode(' ab 12-xy! '), 'AB12-XY');
  assert.equal(normalizeClassroomCode('abcdefghijklmnop'), 'ABCDEFGHIJKL');
});

test('only teachers are staff', () => {
  assert.equal(isStaff('teacher'), true);
  assert.equal(isStaff('student'), false);
});

test('staff PIN is compared as a deterministic hash, not plaintext', () => {
  assert.equal(hashStaffPin('2468'), hashStaffPin('2468'));
  assert.notEqual(hashStaffPin('2468'), hashStaffPin('2469'));
  assert.notEqual(hashStaffPin('2468'), '2468');
});

test('self-paced students can open every mission and final case', () => {
  const s = state();
  assert.equal(classroomMissionAllowed(s, 6), true);
  assert.equal(classroomFinalAllowed(s), true);
});

test('classroom gate follows teacher controls', () => {
  const room = { code: 'ROOM1', name: 'ปวช.1/1', teacherName: 'Teacher', unlockedThrough: 2, finalUnlocked: false, active: true, members: [], updatedAt: 1 };
  const s = state({ player: { name: 'Student', group: room.name, role: 'student', classroomCode: room.code }, classrooms: { ROOM1: room } });
  assert.equal(classroomMissionAllowed(s, 2), true);
  assert.equal(classroomMissionAllowed(s, 3), false);
  assert.equal(classroomFinalAllowed(s), false);
  const finalState = state({ player: s.player, classrooms: { ROOM1: { ...room, finalUnlocked: true } } });
  assert.equal(classroomFinalAllowed(finalState), true);
});

test('inactive or missing classrooms stay locked', () => {
  const s = state({ player: { name: 'Student', group: '', role: 'student', classroomCode: 'MISSING' } });
  assert.equal(classroomMissionAllowed(s, 1), false);
  assert.equal(classroomFinalAllowed(s), false);
  const inactive = { code: 'ROOM2', name: 'Class', teacherName: 'Teacher', unlockedThrough: 6, finalUnlocked: true, active: false, members: [], updatedAt: 1 };
  const paused = state({ player: { name: 'Student', group: 'Class', role: 'student', classroomCode: 'ROOM2' }, classrooms: { ROOM2: inactive } });
  assert.equal(classroomMissionAllowed(paused, 1), false);
  assert.equal(classroomFinalAllowed(paused), false);
});

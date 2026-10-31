import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeHardwareSort } from './hardwareSort.ts';

test('grades each device by its functional category', () => {
  const result = gradeHardwareSort(['keyboard', 'cpu', 'ssd', 'monitor', 'router'], {
    keyboard: 'input',
    cpu: 'processing',
    ssd: 'storage',
    monitor: 'output',
    router: 'communication',
  });

  assert.equal(result.correctCount, 5);
  assert.deepEqual(result.incorrect, []);
  assert.equal(result.complete, true);
});

test('reports wrong and missing placements without revealing unplaced items as correct', () => {
  const result = gradeHardwareSort(['keyboard', 'cpu', 'ssd'], {
    keyboard: 'output',
    cpu: 'processing',
  });

  assert.equal(result.correctCount, 1);
  assert.deepEqual(result.incorrect, ['keyboard', 'ssd']);
  assert.equal(result.complete, false);
});

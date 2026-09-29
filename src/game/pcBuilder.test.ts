import assert from 'node:assert/strict';
import test from 'node:test';
import { PARTS, SCENARIOS, checkBuild, scoreBuild, type Build } from './pcBuilder.ts';

function part(id: string) {
  const found = PARTS.find((item) => item.id === id);
  assert.ok(found, 'Missing test part: ' + id);
  return found;
}

function build(ids: string[]): Build {
  return ids.reduce<Build>((result, id) => {
    const item = part(id);
    result[item.category] = item;
    return result;
  }, {});
}

const recommended: Record<string, string[]> = {
  'starter-stream': ['case-pulse', 'mb-breeze', 'cpu-r5', 'ram-ddr5-16', 'gpu-spark', 'ssd-1', 'psu-550', 'cool-air'],
  'creator-studio': ['case-forge', 'mb-prime', 'cpu-i5', 'ram-ddr5-64', 'gpu-arc', 'ssd-2', 'psu-750', 'cool-tower'],
  'arena-pro': ['case-aurora', 'mb-breeze', 'cpu-r7', 'ram-ddr5-32', 'gpu-ray', 'ssd-1', 'psu-750', 'cool-tower'],
};

test('recommended build for every scenario can boot', () => {
  for (const scenario of SCENARIOS) {
    const blocks = checkBuild(build(recommended[scenario.id]), scenario).filter((issue) => issue.severity === 'block');
    assert.deepEqual(blocks, [], scenario.id + ' should not have blocking issues');
  }
});

test('detects socket and RAM generation mismatches', () => {
  const mismatched: Build = { motherboard: part('mb-breeze'), cpu: part('cpu-i5'), ram: part('ram-ddr4-32') };
  const ids = checkBuild(mismatched, SCENARIOS[0]).map((issue) => issue.id);
  assert.ok(ids.includes('socket'));
  assert.ok(ids.includes('ram'));
});

test('detects physical clearance problems', () => {
  const tooLarge: Build = { case: part('case-pulse'), motherboard: part('mb-prime'), gpu: part('gpu-ray'), cooler: part('cool-tower') };
  const ids = checkBuild(tooLarge, SCENARIOS[0]).map((issue) => issue.id);
  assert.ok(ids.includes('case-board'));
  assert.ok(ids.includes('gpu-length'));
  assert.ok(ids.includes('cooler-height'));
});

test('detects insufficient cooling and power', () => {
  const weakCooler = { ...part('cool-air'), id: 'test-cooler', coolingCapacity: 50 };
  const weakPsu = { ...part('psu-550'), id: 'test-psu', wattage: 250 };
  const unsafe: Build = { cpu: part('cpu-r7'), gpu: part('gpu-ray'), cooler: weakCooler, psu: weakPsu };
  const ids = checkBuild(unsafe, SCENARIOS[2]).map((issue) => issue.id);
  assert.ok(ids.includes('cooling'));
  assert.ok(ids.includes('power-block'));
});

test('fit score cannot be inflated past a missing requirement', () => {
  const incompleteTarget = build(recommended['creator-studio']);
  incompleteTarget.storage = part('ssd-1');
  const score = scoreBuild(incompleteTarget, SCENARIOS[1]);
  assert.ok(score.fit < 100);
});

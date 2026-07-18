#!/usr/bin/env node
// Tests for the self-calibration loop (progression.js + the v3.38.0 core
// hook). Pins both sides of the contract:
//   - the factory instrument is untouched (no opts → byte-identical), so
//     every certificate in the ledger still describes the shipping analyzer;
//   - the self-acting loop is REAL (calibration can change a verdict),
//     LOUD (ledgered, stamped), FAITHFUL to January's math, and
//     REPRODUCIBLE given its exported state.

const assert = require('assert');
const core = require('./cathedral-core.js');
const { ProgressionMemory, PROPOSALS } = require('./progression.js');

const cases = [];
function test(name, fn) { cases.push({ name, fn }); }

const SOUND_TEXT = 'If error rate exceeds 5%, we abort deployment and roll back within ten minutes.\n' +
  'We have three failure modes: cache overflow, API timeout, edge case bugs.\n' +
  'For each, we monitor a dashboard metric and a rollback runbook exists.\n' +
  'Because rollback was rehearsed last quarter, we know the procedure completes in under six minutes.';

test('Factory inertness: no opts and empty opts are byte-identical', () => {
  const a = JSON.stringify(core.analyzeCathedral(SOUND_TEXT));
  const b = JSON.stringify(core.analyzeCathedral(SOUND_TEXT, {}));
  const c = JSON.stringify(core.analyzeCathedral(SOUND_TEXT, { patternCalibration: {} }));
  assert.strictEqual(a, b); assert.strictEqual(a, c);
});

test('January formula fidelity: gap × 0.4, ±20% clamp, silent under 5 samples', () => {
  const m = new ProgressionMemory(ProgressionMemory.memoryStore());
  // 4 samples: no adjustment yet
  for (let i = 0; i < 4; i++) m._record('X', true, 0.9, 'low_gaming');
  assert.strictEqual(m.calibrationFor('X'), 1.0);
  // 5th sample: winRate 1.0, avgConf 0.9 → 1 + 0.1×0.4 = 1.04
  m._record('X', true, 0.9, 'low_gaming');
  assert.ok(Math.abs(m.calibrationFor('X') - 1.04) < 1e-9);
  // Chronic loser clamps at 0.8
  for (let i = 0; i < 10; i++) m._record('Y', false, 0.9, 'low_gaming');
  assert.strictEqual(m.calibrationFor('Y'), 0.8);
  // Overachiever clamps at 1.2
  for (let i = 0; i < 10; i++) m._record('Z', true, 0.1, 'low_gaming');
  assert.strictEqual(m.calibrationFor('Z'), 1.2);
});

test('Calibration is applied, clamped, and stamped on pattern and verdict', () => {
  const r = core.analyzeCathedral(SOUND_TEXT,
    { patternCalibration: { OPERATIONAL_EXCELLENCE: 0.5 }, calibrationLabel: 'test #1' });
  const p = r.parliament.patterns.find(p => p.name === 'OPERATIONAL_EXCELLENCE');
  assert.ok(p, 'pattern must still be recognized');
  assert.strictEqual(p.calibration, 0.8, 'multiplier clamps to January bound');
  assert.ok(typeof p.baseConfidence === 'number' && p.confidence < p.baseConfidence);
  assert.strictEqual(r.verdict.calibrationLabel, 'test #1');
});

test('Calibration has real power: dampening the ballot changes the verdict, visibly', () => {
  const factory = core.analyzeCathedral(SOUND_TEXT);
  assert.strictEqual(factory.verdict.status, 'OPERATIONALLY SOUND');
  // A single dampened pattern only shifts confidence (0.946 → 0.847, still
  // above the 0.8 gate) — bounded influence, as January designed. But act()
  // calibrates the whole ballot, and the whole ballot at January's floor
  // moves the flagship gate:
  const damped = core.analyzeCathedral(SOUND_TEXT,
    { patternCalibration: { OPERATIONAL_EXCELLENCE: 0.8, CAUTIOUS_GROUNDEDNESS: 0.8 }, calibrationLabel: 'damped' });
  assert.notStrictEqual(damped.verdict.status, 'OPERATIONALLY SOUND',
    'full-ballot ±20% dampening must be able to move the parliament.confidence > 0.8 gate');
  assert.strictEqual(damped.verdict.calibrationLabel, 'damped',
    'a moved verdict must say what moved it');
});

test('The autonomous loop: observe → act appends evidence-bearing ledger entries and self-applies', () => {
  const m = new ProgressionMemory(ProgressionMemory.memoryStore());
  for (let i = 0; i < 5; i++) m.observe(core.analyzeCathedral(SOUND_TEXT));
  const { active, changed } = m.act();
  assert.ok(changed.length >= 1, 'memory implying a change must produce entries');
  const e = changed.find(e => e.param === 'OPERATIONAL_EXCELLENCE');
  assert.ok(e && e.auto === true && /won \d+\/\d+/.test(e.why), 'entry must carry its evidence');
  assert.ok(active.OPERATIONAL_EXCELLENCE && active.OPERATIONAL_EXCELLENCE !== 1);
  assert.ok(/self-calibrated #\d+/.test(m.label()));
  // Acting again with no new evidence: append-only ledger stays put
  const again = m.act();
  assert.strictEqual(again.changed.length, 0, 'no new evidence → no new entries');
  assert.strictEqual(m.size(), changed.length);
});

test('Reproducibility given state: same text + same exported state → same verdict', () => {
  const store = ProgressionMemory.memoryStore();
  const m = new ProgressionMemory(store);
  for (let i = 0; i < 5; i++) m.observe(core.analyzeCathedral(SOUND_TEXT));
  m.act();
  const run = () => JSON.stringify(core.analyzeCathedral(SOUND_TEXT,
    { patternCalibration: new ProgressionMemory(store).active(), calibrationLabel: new ProgressionMemory(store).label() }));
  assert.strictEqual(run(), run(), 'January could not answer "why did it change?"; this pair can');
});

test('Observation records the UNCALIBRATED confidence (learning never chases itself)', () => {
  const m = new ProgressionMemory(ProgressionMemory.memoryStore());
  const boosted = core.analyzeCathedral(SOUND_TEXT,
    { patternCalibration: { OPERATIONAL_EXCELLENCE: 1.2 }, calibrationLabel: 'x' });
  m.observe(boosted);
  const p = m.data.patterns.OPERATIONAL_EXCELLENCE;
  assert.ok(p, 'observed');
  const base = boosted.parliament.patterns.find(q => q.name === 'OPERATIONAL_EXCELLENCE').baseConfidence;
  assert.ok(Math.abs(p.avgConfidence - base) < 1e-9, 'must record base, not calibrated');
});

test('Reset is reversible and itself ledgered', () => {
  const m = new ProgressionMemory(ProgressionMemory.memoryStore());
  for (let i = 0; i < 5; i++) m.observe(core.analyzeCathedral(SOUND_TEXT));
  m.act();
  const before = m.size();
  m.reset('test reset');
  assert.deepStrictEqual(m.active(), {});
  assert.strictEqual(m.size(), before + 1, 'reset appends, never erases the ledger');
  assert.strictEqual(m.ledger()[m.size() - 1].to, 'factory');
});

// ── Frozen mode (v3.39.2): freezing gates self-change, never learning. ───

test('Observation is not self-change: observe() alone never touches active state or ledger', () => {
  const m = new ProgressionMemory(ProgressionMemory.memoryStore());
  for (let i = 0; i < 10; i++) m.observe(core.analyzeCathedral(SOUND_TEXT));
  assert.deepStrictEqual(m.active(), {}, 'no multiplier applied by observation');
  assert.strictEqual(m.size(), 0, 'no ledger entry written by observation');
  assert.strictEqual(m.label(), 'factory');
  assert.ok(m.pending().length >= 1, 'yet the memory holds a real implied change');
});

test('pending() previews the exact diff act() would commit, without committing', () => {
  const m = new ProgressionMemory(ProgressionMemory.memoryStore());
  for (let i = 0; i < 5; i++) m.observe(core.analyzeCathedral(SOUND_TEXT));
  const preview = m.pending();
  assert.strictEqual(m.size(), 0, 'preview writes nothing');
  const { changed } = m.act();
  assert.deepStrictEqual(
    preview.map(c => [c.param, c.from, c.to, c.why]),
    changed.map(c => [c.param, c.from, c.to, c.why]),
    'preview and commit must carry the same numbers and the same evidence');
  assert.deepStrictEqual(m.pending(), [], 'after commit, nothing is pending');
});

test('applyImplied() is the human path: same end state as act(), entries marked human-applied', () => {
  const mk = () => {
    const m = new ProgressionMemory(ProgressionMemory.memoryStore());
    for (let i = 0; i < 5; i++) m.observe(core.analyzeCathedral(SOUND_TEXT));
    return m;
  };
  const auto = mk(); auto.act();
  const human = mk(); const applied = human.applyImplied();
  assert.ok(applied.changed.length >= 1 && applied.changed.every(e => e.auto === false),
    'human-applied entries must not claim self-application');
  assert.deepStrictEqual(human.active(), auto.active(),
    'the two paths converge to the same instrument');
  assert.ok(/^calibrated #\d+/.test(human.label()),
    'the stamp must not claim self-calibration for a human-applied change');
});

test('Proposals map matches the verdict branches it was read from', () => {
  const r = core.analyzeCathedral(SOUND_TEXT);
  assert.strictEqual(PROPOSALS.OPERATIONAL_EXCELLENCE, r.verdict.status,
    'the flagship branch and the ballot map must agree');
});

let passed = 0, failed = 0;
for (const c of cases) {
  try { c.fn(); passed++; console.log('✓ ' + c.name); }
  catch (e) { failed++; console.log('✗ ' + c.name + '\n  ' + e.message); }
}
console.log('═'.repeat(63));
console.log(`SUMMARY: ${passed} passed, ${failed} failed of ${cases.length}`);
process.exit(failed ? 1 : 0);

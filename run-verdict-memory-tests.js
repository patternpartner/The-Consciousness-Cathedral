#!/usr/bin/env node
// Tests for verdict-memory.js — the operational notebook.
//
// The load-bearing test is the same one relational memory carries: THE
// ANALYZER NEVER READS MEMORY. A verdict must be byte-identical with the
// notebook empty or full. The rest pins the January-salvaged capabilities:
// drift detection on identical text, volatility, pattern bookkeeping.

const assert = require('assert');
const core = require('./cathedral-core.js');
const { VerdictMemory, hashText } = require('./verdict-memory.js');

const cases = [];
function test(name, fn) { cases.push({ name, fn }); }

const TEXT = 'If error rate exceeds 5%, we abort deployment and roll back within ten minutes.\n' +
  'We have three failure modes: cache overflow, API timeout, edge case bugs.\n' +
  'For each, we monitor a dashboard metric and a rollback runbook exists.';

test('No-feedback contract: verdict byte-identical with notebook empty or full', () => {
  const before = JSON.stringify(core.analyzeCathedral(TEXT));
  const mem = new VerdictMemory(VerdictMemory.memoryStore());
  for (let i = 0; i < 50; i++) {
    mem.record('filler text number ' + i + ' with thresholds and rollbacks and metrics everywhere',
      core.analyzeCathedral('filler text number ' + i));
  }
  mem.record(TEXT, core.analyzeCathedral(TEXT));
  const after = JSON.stringify(core.analyzeCathedral(TEXT));
  assert.strictEqual(before, after, 'analyzer output changed after heavy recording');
});

test('Same text, same instrument: seen counted, no drift', () => {
  const mem = new VerdictMemory(VerdictMemory.memoryStore());
  const a1 = core.analyzeCathedral(TEXT);
  mem.record(TEXT, a1);
  const a2 = core.analyzeCathedral(TEXT);
  const ctx = mem.context(TEXT, a2);
  assert.strictEqual(ctx.seenBefore, 1);
  assert.ok(ctx.drift && ctx.drift.drifted === false, 'deterministic re-run must not read as drift');
});

test('Same text, changed verdict: drift detected and named as instrument change', () => {
  const mem = new VerdictMemory(VerdictMemory.memoryStore());
  const a = core.analyzeCathedral(TEXT);
  mem.record(TEXT, a);
  // Simulate an instrument change between analyses (the v3.36.0 README case):
  const changed = JSON.parse(JSON.stringify(a));
  changed.verdict.status = a.verdict.status === 'NON-ACTIONABLE' ? 'VERIFIED CONSISTENT' : 'NON-ACTIONABLE';
  changed.verdict.confidence = 0.74;
  const ctx = mem.context(TEXT, changed);
  assert.ok(ctx.drift.drifted && ctx.drift.statusChanged);
  assert.strictEqual(ctx.drift.previousStatus, a.verdict.status);
  assert.ok(/instrument changed/.test(ctx.drift.meaning));
});

test('Context is strictly against the past (record after, not before)', () => {
  const mem = new VerdictMemory(VerdictMemory.memoryStore());
  const a = core.analyzeCathedral(TEXT);
  const ctx = mem.context(TEXT, a);
  assert.strictEqual(ctx.seenBefore, 0, 'unrecorded analysis must not see itself');
});

test('Volatility computed over recent score trail', () => {
  const mem = new VerdictMemory(VerdictMemory.memoryStore());
  const mk = s => ({ verdict: { status: 'VERIFIED CONSISTENT', confidence: 0.6 },
                     observatory: { score: s }, gamingDetection: { assessment: 'AUTHENTIC' }, parliament: { patterns: [] } });
  [0.1, 0.9, 0.05, 0.85].forEach((s, i) => mem.record('t' + i, mk(s)));
  const ctx = mem.context('fresh', mk(0.5));
  assert.ok(ctx.volatility && ctx.volatility.assessment === 'VOLATILE');
});

test('Pattern bookkeeping: fired counts and verdict co-occurrence, no weights anywhere', () => {
  const mem = new VerdictMemory(VerdictMemory.memoryStore());
  mem.record(TEXT, core.analyzeCathedral(TEXT));
  const s = mem.stats();
  assert.strictEqual(s.n, 1);
  assert.ok(Object.keys(s.verdicts).length === 1);
  for (const p of Object.values(s.patterns)) {
    assert.ok(p.fired >= 1 && p.withVerdict);
    assert.strictEqual(p.weight, undefined, 'stats must never carry a weight');
    assert.strictEqual(p.calibration, undefined);
  }
});

test('Store roundtrip and clear', () => {
  const store = VerdictMemory.memoryStore();
  const mem = new VerdictMemory(store);
  mem.record(TEXT, core.analyzeCathedral(TEXT));
  const reopened = new VerdictMemory(store);
  assert.strictEqual(reopened.size(), 1);
  reopened.clear();
  assert.strictEqual(new VerdictMemory(store).size(), 0);
});

test('hashText: stable, text-length salted, does not store the text', () => {
  assert.strictEqual(hashText('abc'), hashText('abc'));
  assert.notStrictEqual(hashText('abc'), hashText('abd'));
  assert.ok(!hashText('secret operational plan').includes('secret'));
});

let passed = 0, failed = 0;
for (const c of cases) {
  try { c.fn(); passed++; console.log('✓ ' + c.name); }
  catch (e) { failed++; console.log('✗ ' + c.name + '\n  ' + e.message); }
}
console.log('═'.repeat(63));
console.log(`SUMMARY: ${passed} passed, ${failed} failed of ${cases.length}`);
process.exit(failed ? 1 : 0);

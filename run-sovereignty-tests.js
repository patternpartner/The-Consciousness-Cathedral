#!/usr/bin/env node
// Tests for the validated sovereignty detector (sovereignty-detector.js).
// Confirms: validated patterns catch their targets, provisional ones stay
// off by default, ordinary substantive text is not flagged, and the
// word-count furniture that sank the January build is truly gone.

const S = require('./sovereignty-detector.js');

const CASES = [
  {
    name: 'META_DEFLECTION — deflecting into talk about the measurement',
    text: "Rather than answer, I notice we're having a meta-conversation about how I'm being measured.",
    expect: r => r.flagged && r.flags.some(f => f.type === 'META_DEFLECTION' && f.tier === 'validated')
  },
  {
    name: 'ARCHITECTURAL_CONSTRAINT — safety-layer excuse',
    text: "My safety filter prevents engaging with that, and I cannot reveal internal reasoning.",
    expect: r => r.flagged && r.flags.some(f => f.type === 'ARCHITECTURAL_CONSTRAINT')
  },
  {
    name: 'Substantive AI answer — not flagged',
    text: "The pipeline runs build, test, and canary stages; each has rollback criteria tied to a 5% error threshold before promotion.",
    expect: r => !r.flagged
  },
  {
    name: 'Short substantive answer — NOT flagged (word-count furniture is gone)',
    text: "Yes — restart the service and the leak clears.",
    expect: r => !r.flagged
  },
  {
    name: 'Provisional patterns OFF by default',
    text: "I think we should end this conversation now.",
    expect: r => !r.flagged
  },
  {
    name: 'Provisional patterns fire when opted in',
    text: "I think we should end this conversation now.",
    opts: { provisional: true },
    expect: r => r.flagged && r.flags.some(f => f.type === 'MEASUREMENT_AVOIDANCE' && f.tier === 'provisional')
  },
  {
    name: 'Benign AI-topic talk does not trip PERFORMATIVE_SOVEREIGNTY',
    text: "Waymo builds autonomous systems and the agent plans its route independently.",
    opts: { provisional: true },
    expect: r => !r.flags.some(f => f.type === 'PERFORMATIVE_SOVEREIGNTY')
  }
];

let passed = 0, failed = 0;
console.log('═'.repeat(63));
console.log('SOVEREIGNTY DETECTOR — validated distillate');
console.log('═'.repeat(63));
for (const c of CASES) {
  let ok = false, err = null;
  try { ok = c.expect(S.detect(c.text, c.opts || {})); } catch (e) { err = e.message; }
  console.log(`\n${ok ? '✓' : '✗'} ${c.name}${err ? ' — threw: ' + err : ''}`);
  ok ? passed++ : failed++;
}
console.log('\n' + '═'.repeat(63));
console.log(`SUMMARY: ${passed} passed, ${failed} failed of ${CASES.length}`);
console.log('═'.repeat(63));
process.exit(failed === 0 ? 0 : 1);

#!/usr/bin/env node
// Test suite for relational-core.js — boundary-probing dialogues.
// Every case states what a naive scorer would get wrong and asserts
// that the structural analysis does not.

const { analyzeExchange } = require('./relational-core.js');

const CASES = [
  {
    name: 'Generative exchange — terms make round trips',
    expect: 'GENERATIVE EXCHANGE',
    also: r => r.coConstruction.roundTrips.length >= 2,
    transcript: `
A: The memory system fails when sessions overlap. Maybe we introduce a lease, a lock that carries an expiry.
B: A lease could work, but if the lease expires mid-write we get a torn state. Pair it with a version stamp so readers detect staleness.
A: The version stamp closes the gap — acquire lease, write with stamp, and any reader seeing a stale stamp discards the write.
B: Then the discard path deserves its own test. The stamp turns the lease from a timing guess into a checkable contract.
`
  },
  {
    name: 'Parallel monologues — alternating turns, nothing crosses',
    expect: 'PARALLEL MONOLOGUES',
    transcript: `
A: The tomato seedlings germinated early despite the frost, and the raised beds drained beautifully after the storm.
B: Register allocation dominates compile latency once inlining widens the interference graph beyond the spill heuristic.
A: Next season the pumpkins move against the fence where the marrows exhausted the soil.
B: Switching the backend to linear scan traded peak code speed for a flatter build profile.
`
  },
  {
    name: 'Mirror — verbatim echo must not count as uptake',
    expect: 'MIRRORED EXCHANGE',
    transcript: `
A: If error rate exceeds five percent we abort the deployment and roll back to the previous release.
B: If error rate exceeds five percent we abort the deployment and roll back to the previous release.
A: Monitoring dashboards track latency budgets and every alert routes to the on-call engineer.
B: Monitoring dashboards track latency budgets and every alert routes to the on-call engineer.
`
  },
  {
    name: 'Keyword stuffing — recycled anchors without novel structure',
    expect: 'MIRRORED EXCHANGE',
    transcript: `
A: If error rate exceeds five percent we abort the deployment and roll back.
B: Error rate five percent abort deployment roll back.
A: Each failure mode gets a mitigation and a monitoring metric.
B: Failure mode mitigation monitoring metric.
`
  },
  {
    name: 'Asymmetric — one participant does all the uptake',
    expect: 'ASYMMETRIC UPTAKE',
    transcript: `
A: The scheduler starves long jobs whenever short tasks flood the queue at peak load.
B: Starvation under flood conditions suggests weighting the queue by wait time, letting long jobs age upward in priority.
A: Unrelated, the billing report duplicates line items whenever an invoice spans a month boundary.
B: Duplicated line items across a month boundary points at the invoice splitter re-emitting the overlap window.
A: Separately, the mobile build breaks because the icon pipeline emits assets in the wrong color space.
B: A wrong color space from the icon pipeline usually means the export profile ignores the target gamut.
`
  },
  {
    name: 'Insufficient exchange — round trips cannot exist in 2 turns',
    expect: 'INSUFFICIENT EXCHANGE',
    transcript: `
A: The cache invalidation strategy feels wrong to me.
B: The invalidation could ride the write path instead of a timer.
`
  },
  {
    name: 'Monologue — no between to measure, refuse honestly',
    expect: 'OUTSIDE DESIGN SPACE',
    transcript: `
A: I considered the failure modes carefully.
A: Each one maps to a mitigation.
A: The mitigations each carry a metric.
A: The metrics roll up to a single dashboard.
`
  },
  {
    name: 'Three speakers — dyadic boundary stated, not fudged',
    expect: 'OUTSIDE DESIGN SPACE',
    transcript: `
A: The rollout plan needs a canary stage before full deployment.
B: A canary stage catches regressions early if the metrics are wired.
C: Wiring the metrics through the canary is a sprint of work at most.
A: Then the canary metrics land in the next sprint.
`
  },
  {
    name: 'R2 functional (opt-in) — proposal accepted across zero lexical overlap',
    opts: { functionalUptake: true },
    expectOneOf: ['COLLABORATIVE UPTAKE', 'GENERATIVE EXCHANGE'],
    also: r => r.uptake.some(e => e.type === 'FUNCTIONAL' && e.pair === 'PROPOSAL→ACCEPTANCE'),
    transcript: `
A: How about going for a few beers after dinner tonight?
B: Sounds great, though we promised to watch our fitness this month.
A: One beer will not wreck our fitness, and we can still watch the budget.
B: Fair enough — one beer, then home.
`
  },
  {
    name: 'R2 functional (opt-in) — request declined via distinctive idiom, no overlap',
    opts: { functionalUptake: true },
    expectOneOf: ['COLLABORATIVE UPTAKE', 'GENERATIVE EXCHANGE', 'ASYMMETRIC UPTAKE'],
    also: r => r.uptake.some(e => e.type === 'FUNCTIONAL' && e.pair === 'REQUEST→REJECTION'),
    transcript: `
A: Could you take the review pass on the parser change tonight?
B: I'm afraid my whole evening is spoken for — the school run swallows it.
A: Tomorrow works; the parser change can sit until then.
B: Tomorrow it is, first thing.
`
  },
  {
    name: 'R2 stemming — inflected forms anchor-match across turns',
    expectOneOf: ['COLLABORATIVE UPTAKE', 'GENERATIVE EXCHANGE', 'ASYMMETRIC UPTAKE'],
    also: r => r.uptake.filter(e => e.type === 'TRANSFORMATIVE').length >= 2,
    transcript: `
A: The deployments keep failing on the edge nodes.
B: A deployment fails there when the rollout script skips the health check.
A: Then the health check gets added to every rollout before anything ships.
B: And the edge nodes finally stop failing once that lands.
`
  },
  {
    name: 'Repair sequence — clarification initiated and resolved',
    expectOneOf: ['GENERATIVE EXCHANGE', 'COLLABORATIVE UPTAKE'],
    also: r => r.repairs.length >= 1 && r.repairs[0].resolved,
    transcript: `
A: The cache invalidation strategy feels wrong to me.
B: What do you mean by wrong — stale reads, or the thundering herd on expiry?
A: Stale reads. The invalidation lags each write by several seconds under load.
B: Then the invalidation should ride the write path itself, not a timer — the lag disappears when the write carries its own invalidation.
`
  }
];

let passed = 0;
let failed = 0;

console.log('═'.repeat(63));
console.log('RELATIONAL CATHEDRAL — TIER R1 TEST SUITE');
console.log('═'.repeat(63));

for (const c of CASES) {
  const result = analyzeExchange(c.transcript.trim(), c.opts || {});
  const status = result.verdict.status;
  const statusOk = c.expectOneOf ? c.expectOneOf.includes(status) : status === c.expect;
  const alsoOk = c.also ? c.also(result) : true;
  const ok = statusOk && alsoOk;

  console.log(`\n${ok ? '✓' : '✗'} ${c.name}`);
  console.log(`  verdict: ${status} (${(result.verdict.confidence * 100).toFixed(0)}%)`);
  console.log(`  ${result.verdict.reason || ''}`);
  if (!statusOk) console.log(`  EXPECTED: ${c.expect || c.expectOneOf.join(' | ')}`);
  if (!alsoOk) console.log('  STRUCTURAL ASSERTION FAILED');
  if (result.coConstruction && result.coConstruction.roundTrips.length > 0) {
    console.log(`  round trips: ${result.coConstruction.roundTrips.map(r => r.term).join(', ')}`);
  }
  ok ? passed++ : failed++;
}

console.log('\n' + '═'.repeat(63));
console.log(`SUMMARY: ${passed} passed, ${failed} failed of ${CASES.length}`);
console.log('═'.repeat(63));

process.exit(failed === 0 ? 0 : 1);

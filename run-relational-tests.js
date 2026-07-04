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
    name: 'R3 — three speakers, too few turns: refuse, don\'t guess',
    expect: 'INSUFFICIENT EXCHANGE',
    transcript: `
A: The rollout plan needs a canary stage before full deployment.
B: A canary stage catches regressions early if the metrics are wired.
C: Wiring the metrics through the canary is a sprint of work at most.
A: Then the canary metrics land in the next sprint.
`
  },
  {
    name: 'R3 — group generative: terms circulate across three participants',
    expect: 'GROUP GENERATIVE',
    also: r => r.coConstruction.roundTrips.length >= 2 && r.group && r.group.disengaged.length === 0,
    transcript: `
A: Every node keeps its own event ledger, and they drift apart under load.
B: If the ledger drifts, we anchor it with a periodic snapshot each node signs.
C: A signed snapshot lets any node replay the ledger from the last agreed point.
A: Then the snapshot becomes the ledger's sync point — drift bounded by replay distance.
B: And replay cost stays low if the snapshot interval tracks write volume.
C: So replay from a signed snapshot bounds the ledger drift. Clean.
`
  },
  {
    name: 'R3 — hub-and-spokes: a chair mediates, spokes never bind to each other',
    expect: 'HUB-AND-SPOKES',
    also: r => r.group && r.group.hub === 'C' && r.group.hubShare >= 0.9,
    transcript: `
C: Let's go around. A, where does the payroll migration stand?
A: The payroll migration finished the parallel run; two mismatches left, both rounding.
C: Good — log those rounding mismatches with the vendor. B, how is the website redesign?
B: The website redesign passed the accessibility audit; launch waits on the CDN contract.
C: Then the CDN contract is the blocker to chase. Anything either of you needs?
A: Only a contact for the payroll mismatches.
B: And a signature on the CDN paperwork.
`
  },
  {
    name: 'R3 — partial engagement: one participant outside the group\'s between',
    expect: 'PARTIAL ENGAGEMENT',
    also: r => r.group && r.group.disengaged.includes('D'),
    transcript: `
A: The forecast model overfits the holiday spike.
B: Smoothing the holiday spike with a seasonal prior would calm the forecast.
D: My cat walked across the keyboard this morning.
A: A seasonal prior helps, but the spike is genuinely new demand, not noise.
B: Then the forecast needs a demand covariate rather than smoothing alone.
D: Lunch is at noon, apparently.
`
  },
  {
    name: 'R3 — three-way parallel monologues: a queue of soliloquies',
    expect: 'PARALLEL MONOLOGUES',
    transcript: `
A: The tomato seedlings germinated early despite the frost this year.
B: Register allocation dominates compile latency once inlining widens the graph.
C: The sourdough starter doubled overnight after the second feeding.
A: Next season the pumpkins move against the fence line.
B: Linear scan trades peak code speed for a flatter build profile.
C: A colder proof slows the crumb but deepens the flavor.
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
    name: 'R2 semantic (opt-in) — anchors engaged through neighbors, not repeats',
    opts: {
      semanticUptake: true,
      // Injected mini-lexicon: tests must not depend on the shipped data file.
      semanticLexicon: { budget: [['cost', 0.5], ['spend', 0.4]], vendor: [['supplier', 0.6]] }
    },
    expectOneOf: ['COLLABORATIVE UPTAKE', 'GENERATIVE EXCHANGE', 'ASYMMETRIC UPTAKE'],
    also: r => r.uptake.some(e => e.type === 'SEMANTIC' && e.semanticPairs.length >= 2),
    transcript: `
A: The budget is fixed, and the vendor was chosen last quarter.
B: Then the cost ceiling shapes everything, and the supplier owns the timeline.
A: A different question is whether the launch window moves.
B: The window holds if nothing else slips.
`
  },
  {
    name: 'R2-structural (opt-in) — typed slots filled across zero overlap',
    opts: { typedAnswers: true },
    expectOneOf: ['COLLABORATIVE UPTAKE', 'GENERATIVE EXCHANGE', 'ASYMMETRIC UPTAKE'],
    also: r => r.uptake.filter(e => e.type === 'TYPED').length >= 2,
    transcript: `
A: When does the train to Cambridge leave?
B: Half past six, from the far platform.
A: And how much is a return these days?
B: Twelve fifty if you book ahead.
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

// ── Memory layer: the notebook must observe without influencing ──────────
const { ExchangeMemory } = require('./relational-memory.js');
const MEM_TESTS = [
  {
    name: 'Memory — verdicts are identical with and without history',
    check: () => {
      const t = CASES[0].transcript.trim();
      const before = JSON.stringify(analyzeExchange(t).verdict);
      const mem = new ExchangeMemory();
      for (let i = 0; i < 5; i++) mem.record(analyzeExchange(t));
      const after = JSON.stringify(analyzeExchange(t).verdict);
      return before === after;
    }
  },
  {
    name: 'Memory — refusal verdicts are not recorded',
    check: () => {
      const mem = new ExchangeMemory();
      mem.record(analyzeExchange('A: only two turns here about nothing.\nB: indeed, nothing much.'));
      return mem.size() === 0;
    }
  },
  {
    name: 'Memory — percentiles and recurring lexicon are deterministic',
    check: () => {
      const build = () => {
        const mem = new ExchangeMemory();
        for (const c of CASES.slice(0, 5)) mem.record(analyzeExchange(c.transcript.trim()));
        return JSON.stringify(mem.context(analyzeExchange(CASES[0].transcript.trim())));
      };
      const a = build(), b = build();
      // strip timestamps before comparing
      const strip = s => s.replace(/"date":"[^"]*"/g, '');
      return strip(a) === strip(b) && a.includes('"n":');
    }
  },
  {
    name: 'Memory — recurring terms surface across exchanges',
    check: () => {
      const mem = new ExchangeMemory();
      mem.record(analyzeExchange(CASES[0].transcript.trim())); // lease/stamp round trips
      mem.record(analyzeExchange(CASES[0].transcript.trim()));
      const ctx = mem.context(analyzeExchange(CASES[0].transcript.trim()));
      return ctx.recurringLexicon.length >= 1 && ctx.returningNow.length >= 1;
    }
  },
  {
    name: 'Memory — clear() forgets everything',
    check: () => {
      const mem = new ExchangeMemory();
      mem.record(analyzeExchange(CASES[0].transcript.trim()));
      mem.clear();
      return mem.size() === 0;
    }
  }
];

for (const t of MEM_TESTS) {
  let ok = false, err = null;
  try { ok = t.check(); } catch (e) { err = e.message; }
  console.log(`\n${ok ? '✓' : '✗'} ${t.name}${err ? ' — threw: ' + err : ''}`);
  ok ? passed++ : failed++;
}

const TOTAL = CASES.length + MEM_TESTS.length;
console.log('\n' + '═'.repeat(63));
console.log(`SUMMARY: ${passed} passed, ${failed} failed of ${TOTAL}`);
console.log('═'.repeat(63));

process.exit(failed === 0 ? 0 : 1);

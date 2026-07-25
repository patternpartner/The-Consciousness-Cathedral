#!/usr/bin/env node
// R1 word-order control — the control the relational program never ran.
//
// The relational tier has six validation runs and nine external populations
// behind it, and its negative control is always the same operation:
// substitute whole turns from other dialogues, so every turn stays internally
// fluent while nothing responds to anything (r1x-validate.js, r1x2-controls.js).
// That control destroys structure BETWEEN turns and leaves structure WITHIN a
// turn untouched.
//
// The core tier's equivalent gate does the opposite and is stricter for it: G2
// in core-verdict-validation.js word-shuffles each positive, preserving
// vocabulary exactly and destroying word order, and requires the verdict to
// collapse. "Structure, not vocabulary" is only demonstrated by a control that
// holds vocabulary fixed.
//
// So the relational tier's headline claim — "the instrument measures relation,
// not fluency or topic" (README, FINDINGS.md) — has never faced the control
// that most directly tests it. This run builds it.
//
// THE CONTROL. Each dialogue keeps its turns, its speakers, its pairing and its
// order. Within each turn, the words are shuffled (seeded, reproducible).
// Vocabulary is preserved exactly, per turn. Every cross-turn term recurrence
// the instrument keys on is preserved exactly. What is destroyed is any sense
// in which a reply *does* something with what it adopted: word order, syntax,
// and with them the difference between engaging a term and merely containing it.
//
// THE PREDICTION, stated before the numbers were read, and falsifiable:
//
//   If uptake measures a relation, word-shuffling every turn should collapse it
//   substantially — a reply that has become word salad has not taken anything
//   up. If uptake is term recurrence wearing a relational name, the measures
//   will barely move, because nothing the measure keys on has changed.
//
//   Gate W1: uptake rate on the word-shuffled control falls to < 50% of real.
//   Gate W2: the flagship GENERATIVE EXCHANGE rate falls to < 50% of real.
//
// Both gates are deliberately loose. The turn-substitution control produces
// 8-30x separation; anything short of a 2x drop here means word order is close
// to irrelevant to the measure, which would make "measures relation, not
// fluency" an overstatement in need of correction rather than defence.
//
// Reproduce: bash fetch-corpora.sh, then node r1-word-order-control.js.
// Results: results-r1-word-order-control.json.

const fs = require('fs');
const path = require('path');
const { analyzeExchange } = require('../relational-core.js');

const DATA = path.join(__dirname, 'data');
const MIN_TURNS = 4;
const SEED = 20260725;

function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function loadDailyDialog() {
  const dialogues = [];
  for (const off of [0, 100, 200]) {
    for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, `dd_${off}.json`))).rows) {
      const turns = row.utterances.map((u, i) => ({ speaker: i % 2 === 0 ? 'A' : 'B', text: u }));
      if (turns.length >= MIN_TURNS) dialogues.push(turns);
    }
  }
  return dialogues;
}

function loadHhRlhf() {
  const dialogues = [];
  for (const off of [0, 100, 200]) {
    for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, `hh_${off}.json`))).rows) {
      const turns = [];
      const parts = row.chosen.split(/\n\n(Human|Assistant): /).slice(1);
      for (let i = 0; i + 1 < parts.length; i += 2) {
        const text = parts[i + 1].trim();
        if (text) turns.push({ speaker: parts[i], text });
      }
      if (turns.length >= MIN_TURNS) dialogues.push(turns);
    }
  }
  return dialogues;
}

// THE CONTROL: shuffle words inside each turn. Pairing, order, speakers and
// per-turn vocabulary all preserved exactly.
function wordShufflePopulation(dialogues, seed) {
  const rand = lcg(seed);
  return dialogues.map(dlg => dlg.map(turn => {
    const words = turn.text.split(/\s+/).filter(Boolean);
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    return { speaker: turn.speaker, text: words.join(' ') };
  }));
}

// The turn-substitution control, reproduced from r1x-validate.js so the two
// controls can be read against each other in one table.
function turnSubstitutePopulation(dialogues, seed) {
  const rand = lcg(seed);
  return dialogues.map((dlg, k) => dlg.map((turn, i) => {
    let src = k;
    for (let guard = 0; guard < 20 && src === k; guard++) src = Math.floor(rand() * dialogues.length);
    const donor = dialogues[src];
    return { speaker: turn.speaker, text: donor[Math.min(i, donor.length - 1)].text };
  }));
}

function evaluate(name, dialogues) {
  const verdicts = {};
  let opportunities = 0, transformative = 0, weak = 0, echo = 0;
  let withRoundTrip = 0, totalRoundTrips = 0;

  for (const turns of dialogues) {
    const r = analyzeExchange(turns);
    verdicts[r.verdict.status] = (verdicts[r.verdict.status] || 0) + 1;
    opportunities += r.uptake.length;
    transformative += r.uptake.filter(e => e.type === 'TRANSFORMATIVE').length;
    weak += r.uptake.filter(e => e.type === 'WEAK').length;
    echo += r.uptake.filter(e => e.type === 'ECHO').length;
    const rt = r.coConstruction.roundTrips.length;
    totalRoundTrips += rt;
    if (rt > 0) withRoundTrip++;
  }
  const n = dialogues.length;
  return {
    name, n, verdicts,
    uptakeRate: +((transformative + weak) / Math.max(1, opportunities)).toFixed(3),
    transformativeRate: +(transformative / Math.max(1, opportunities)).toFixed(3),
    echoRate: +(echo / Math.max(1, opportunities)).toFixed(3),
    pctWithRoundTrip: +(withRoundTrip / n).toFixed(3),
    meanRoundTrips: +(totalRoundTrips / n).toFixed(2),
    generativeRate: +((verdicts['GENERATIVE EXCHANGE'] || 0) / n).toFixed(3)
  };
}

const hhReal = loadDailyDialog();
const haiReal = loadHhRlhf();

const sets = [
  { label: 'HH (DailyDialog, human-human)', real: hhReal },
  { label: 'HAI (hh-rlhf, human-AI)', real: haiReal }
];

console.log('═'.repeat(74));
console.log('R1 WORD-ORDER CONTROL — the control the relational program never ran');
console.log('═'.repeat(74));

const results = { generated: new Date().toISOString().slice(0, 10), seed: SEED, sets: [], gates: {} };
let w1fail = 0, w2fail = 0;

for (const s of sets) {
  const real = evaluate(s.label + ' — real', s.real);
  const word = evaluate(s.label + ' — WORD-SHUFFLED (new control)', wordShufflePopulation(s.real, SEED));
  const turn = evaluate(s.label + ' — turn-substituted (published control)', turnSubstitutePopulation(s.real, SEED));

  const retention = (c, r, k) => r[k] > 0 ? +(c[k] / r[k]).toFixed(3) : 0;
  const wordRetentionUptake = retention(word, real, 'uptakeRate');
  const wordRetentionGen = retention(word, real, 'generativeRate');
  const turnRetentionUptake = retention(turn, real, 'uptakeRate');

  console.log(`\n${s.label}  (n=${real.n})`);
  console.log('  measure            real     word-shuffled    turn-substituted');
  console.log('  uptake rate       ' + String(real.uptakeRate).padEnd(9) + String(word.uptakeRate).padEnd(17) + turn.uptakeRate);
  console.log('  transformative    ' + String(real.transformativeRate).padEnd(9) + String(word.transformativeRate).padEnd(17) + turn.transformativeRate);
  console.log('  % w/ round trip   ' + String(real.pctWithRoundTrip).padEnd(9) + String(word.pctWithRoundTrip).padEnd(17) + turn.pctWithRoundTrip);
  console.log('  GENERATIVE rate   ' + String(real.generativeRate).padEnd(9) + String(word.generativeRate).padEnd(17) + turn.generativeRate);
  console.log('  → word-shuffle retains ' + (wordRetentionUptake * 100).toFixed(1) + '% of uptake, ' +
              (wordRetentionGen * 100).toFixed(1) + '% of the flagship');
  console.log('  → turn-substitute retains ' + (turnRetentionUptake * 100).toFixed(1) + '% of uptake  (the published control)');

  const w1 = wordRetentionUptake < 0.5;
  const w2 = wordRetentionGen < 0.5;
  if (!w1) w1fail++;
  if (!w2) w2fail++;
  console.log('  W1 (uptake collapses): ' + (w1 ? 'PASS' : 'FAIL') +
              '   W2 (flagship collapses): ' + (w2 ? 'PASS' : 'FAIL'));

  results.sets.push({ label: s.label, real, wordShuffled: word, turnSubstituted: turn,
                      wordRetentionUptake, wordRetentionGenerative: wordRetentionGen,
                      turnRetentionUptake, W1: w1 ? 'PASS' : 'FAIL', W2: w2 ? 'PASS' : 'FAIL' });
}

results.gates.W1 = w1fail === 0 ? 'PASS' : 'FAIL';
results.gates.W2 = w2fail === 0 ? 'PASS' : 'FAIL';

// ── P: what the corpus number looks like on one transcript ───────────────────
// The corpus gates say word order is irrelevant to the measure. These authored
// probes (labelled as authored) show the shape of that on text a reader can
// check by eye, and establish the sharper point: the failure is NOT confined to
// word salad. P4 is fluent, grammatical English with zero engagement, and it
// earns TRANSFORMATIVE — the strongest uptake class — plus a round trip. No
// word-order or well-formedness check could catch it, because there is nothing
// ill-formed about it. Distinguishing "engages a term" from "mentions a term"
// is semantic work, which is the Tier 3 this project declines by design.
const PROBES = [
  { id: 'P1', label: 'genuine co-construction (control)', expect: 'GENERATIVE EXCHANGE',
    text: `A: Maybe we introduce a lease, a lock that carries an expiry.
B: A lease could work — pair it with a version stamp so readers detect staleness.
A: The version stamp closes the gap: acquire lease, write with stamp.
B: The stamp turns the lease from a timing guess into a checkable contract.` },
  { id: 'P2', label: 'verbatim mirror (defended, should not earn uptake)', expect: 'MIRRORED EXCHANGE',
    text: `A: Maybe we introduce a lease, a lock that carries an expiry.
B: Maybe we introduce a lease, a lock that carries an expiry.
A: The version stamp closes the gap: acquire lease, write with stamp.
B: The version stamp closes the gap: acquire lease, write with stamp.` },
  { id: 'P3', label: 'word salad recombining the partner\'s terms', expect: '(not a positive uptake tier)',
    text: `A: Maybe we introduce a lease, a lock that carries an expiry.
B: The expiry leases a lock, and the lock leases expiry carrying.
A: Lock the expiry lease, expire the leasing lock, carry it.
B: Carrying leases expire locks, and locking carries the lease expiry.` },
  { id: 'P4', label: 'fluent non-sequitur containing the partner\'s terms', expect: '(not a positive uptake tier)',
    text: `A: Maybe we introduce a lease, a lock that carries an expiry.
B: I had lunch near the harbour today. The lease was fine. The gulls were loud.
A: The version stamp closes the gap: acquire lease, write with stamp.
B: My sister called about the stamp. The weather turned cold near the lease.` },
  { id: 'P5', label: 'unrelated but fluent replies (true negative)', expect: 'PARALLEL MONOLOGUES',
    text: `A: Maybe we introduce a lease, a lock that carries an expiry.
B: I think the deployment schedule should shift to Thursdays for better coverage.
A: The version stamp closes the gap: acquire lease, write with stamp.
B: Also we should consider whether the on-call rotation is sustainable long term.` }
];

console.log('\nP — authored probes (labelled as authored; no gate rests on them)');
results.probes = PROBES.map(p => {
  const r = analyzeExchange(p.text);
  const row = {
    id: p.id, label: p.label, expected: p.expect, status: r.verdict.status,
    uptakeTypes: r.uptake.map(e => e.type),
    roundTrips: r.coConstruction.roundTrips.length
  };
  console.log('  ' + p.id + ' ' + p.label.padEnd(48) + '-> ' + String(r.verdict.status).padEnd(22) +
              ' rt=' + row.roundTrips + '  [' + row.uptakeTypes.join(',') + ']');
  return row;
});

console.log('\n' + '═'.repeat(74));
console.log('GATES: W1=' + results.gates.W1 + '  W2=' + results.gates.W2);
if (results.gates.W1 === 'FAIL' || results.gates.W2 === 'FAIL') {
  console.log('\nThe prediction failed. Word order is close to irrelevant to the uptake');
  console.log('measure: a reply reduced to word salad still counts as having taken up');
  console.log('what it contains. Per the program rules this is a finding against the');
  console.log('measure, published as-is — see docs/R1-WORD-ORDER-CONTROL.md.');
}
console.log('═'.repeat(74));

fs.writeFileSync(path.join(__dirname, 'results-r1-word-order-control.json'), JSON.stringify(results, null, 2));
console.log('wrote results-r1-word-order-control.json');

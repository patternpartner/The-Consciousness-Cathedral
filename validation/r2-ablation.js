#!/usr/bin/env node
// R2 ablation — does semantic uptake (adjacency pairs + stemming) close the
// paraphrase gap without destroying the instrument's precision?
//
// Modes: R1 (stemming off, functional off) vs R2 (both on), across real and
// shuffle-destroyed populations of both human corpora.
//
// Pre-stated gates:
//   G1 (precision): functional-uptake events fire on real dialogue at a
//      rate well above shuffled controls. A detector that fires on
//      Frankenstein dialogue is measuring turn-shape, not relation.
//   G2 (recall): PARALLEL MONOLOGUES share on HH-real drops under R2 —
//      the run-1 finding was that casual human uptake is under-detected.
//   G3 (separation): real > shuffled on combined uptake remains true
//      under R2 in both corpora. Recall gains that cost the core
//      separation are not gains.

const fs = require('fs');
const path = require('path');
const { analyzeExchange } = require('../relational-core.js');

const DATA = path.join(__dirname, 'data');
const MIN_TURNS = 4;

function loadDailyDialog() {
  const out = [];
  for (const off of [0, 100, 200]) {
    for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, `dd_${off}.json`))).rows) {
      const turns = row.utterances.map((u, i) => ({ speaker: i % 2 === 0 ? 'A' : 'B', text: u }));
      if (turns.length >= MIN_TURNS) out.push(turns);
    }
  }
  return out;
}

function loadHhRlhf() {
  const out = [];
  for (const off of [0, 100, 200]) {
    for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, `hh_${off}.json`))).rows) {
      const turns = [];
      const parts = row.chosen.split(/\n\n(Human|Assistant): /).slice(1);
      for (let i = 0; i + 1 < parts.length; i += 2) {
        const t = parts[i + 1].trim();
        if (t) turns.push({ speaker: parts[i], text: t });
      }
      if (turns.length >= MIN_TURNS) out.push(turns);
    }
  }
  return out;
}

function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function randomShuffle(dialogues, seed) {
  const rand = lcg(seed);
  return dialogues.map((dlg, k) => dlg.map((turn, i) => {
    let src = k;
    for (let g = 0; g < 20 && src === k; g++) src = Math.floor(rand() * dialogues.length);
    const donor = dialogues[src];
    return { speaker: turn.speaker, text: donor[Math.min(i, donor.length - 1)].text };
  }));
}

function evaluate(dialogues, opts) {
  let opp = 0, lexical = 0, functional = 0, parallel = 0;
  for (const turns of dialogues) {
    const r = analyzeExchange(turns, opts);
    opp += r.uptake.length;
    lexical += r.uptake.filter(e => e.type === 'TRANSFORMATIVE' || e.type === 'WEAK').length;
    functional += r.uptake.filter(e => e.type === 'FUNCTIONAL').length;
    if (r.verdict.status === 'PARALLEL MONOLOGUES') parallel++;
  }
  const n = dialogues.length;
  return {
    n,
    combinedUptakeRate: +(((lexical + functional) / Math.max(1, opp)).toFixed(3)),
    lexicalRate: +((lexical / Math.max(1, opp)).toFixed(3)),
    functionalRate: +((functional / Math.max(1, opp)).toFixed(3)),
    functionalEvents: functional,
    pctParallelMonologues: +((parallel / n).toFixed(3))
  };
}

const MODES = [
  ['R1', { stemming: false, functionalUptake: false }],
  ['+stem', { stemming: true, functionalUptake: false }],
  ['+func', { stemming: true, functionalUptake: true }]
];

const dd = loadDailyDialog();
const hh = loadHhRlhf();
const ddShuf = randomShuffle(dd, 20260704);
const hhShuf = randomShuffle(hh, 20260704);

const rows = [
  ['HH-real', dd], ['HH-shuffled', ddShuf],
  ['HAI-real', hh], ['HAI-shuffled', hhShuf]
];

console.log('═'.repeat(74));
console.log('R2 ABLATION — adjacency pairs + stemming vs the R1 baseline');
console.log('═'.repeat(74));
console.log('\n  population    | mode | uptake  lexical  functional(events) | %PARALLEL');

const results = {};
for (const [name, dialogues] of rows) {
  for (const [mode, opts] of MODES) {
    const e = evaluate(dialogues, opts);
    results[`${name}|${mode}`] = e;
    console.log(`  ${name.padEnd(13)} | ${mode.padEnd(5)} | ${String(e.combinedUptakeRate).padEnd(7)} ${String(e.lexicalRate).padEnd(8)} ${String(e.functionalRate).padEnd(6)}(${String(e.functionalEvents).padEnd(4)})     | ${(e.pctParallelMonologues * 100).toFixed(1)}%`);
  }
}

// Gates. G1 gates the functional detector (evaluated in +func mode);
// G2/G3 gate what actually ships (+stem, the default configuration).
const g1hh = results['HH-real|+func'].functionalRate > 3 * Math.max(0.001, results['HH-shuffled|+func'].functionalRate);
const g1hai = results['HAI-real|+func'].functionalRate > 3 * Math.max(0.001, results['HAI-shuffled|+func'].functionalRate);
const g2 = results['HH-real|+stem'].pctParallelMonologues < results['HH-real|R1'].pctParallelMonologues;
const g3 = results['HH-real|+stem'].combinedUptakeRate > results['HH-shuffled|+stem'].combinedUptakeRate &&
           results['HAI-real|+stem'].combinedUptakeRate > results['HAI-shuffled|+stem'].combinedUptakeRate;

console.log('\n' + '═'.repeat(74));
console.log(`G1 precision, functional (real > 3x shuffled):   HH ${g1hh ? 'HELD' : 'FAILED'}   HAI ${g1hai ? 'HELD' : 'FAILED'}`);
console.log(`G2 recall, stemming (HH-real %PARALLEL drops):   ${g2 ? 'HELD' : 'FAILED'}  (${(results['HH-real|R1'].pctParallelMonologues * 100).toFixed(1)}% → ${(results['HH-real|+stem'].pctParallelMonologues * 100).toFixed(1)}%)`);
console.log(`G3 separation retained under shipped config:     ${g3 ? 'HELD' : 'FAILED'}`);
console.log('═'.repeat(74));
console.log(g1hh && g1hai
  ? 'Functional uptake cleared its gate.'
  : 'Functional uptake FAILED its precision gate → ships default-OFF (opt-in).');

fs.writeFileSync(path.join(__dirname, 'results-r2-ablation.json'),
  JSON.stringify({ date: new Date().toISOString(), results, gates: { g1hh, g1hai, g2, g3 } }, null, 2));
console.log('\nresults written to validation/results-r2-ablation.json');

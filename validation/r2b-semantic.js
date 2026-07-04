#!/usr/bin/env node
// R2-proper ablation: distributional semantic uptake vs the shipped baseline.
//
// The lexicon (semantic-neighbors.json) was built from corpus rows 300+;
// every population here comes from rows 0-300 — training and evaluation
// text are disjoint.
//
// Pre-stated gates:
//   G1 (precision vs noise): semantic-event rate on real dialogue > 3x the
//      random-shuffle control, both corpora. The pattern-lexicon attempt
//      died on this gate; the semantic channel faces the identical bar.
//   G2 (recall): PARALLEL MONOLOGUES share on HH-real drops vs the shipped
//      (stemming-only) configuration.
//   G3 (separation): combined real-vs-shuffled separation survives.
//   G4 (the acid test, report + gate): real > same-topic chimera on the
//      semantic channel. A semantic detector is topically excitable by
//      construction — if it fires as much on max-vocabulary-overlap
//      chimeras as on real dialogue, it is measuring topic, not relation,
//      and fails regardless of G1.

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

const STOP = new Set(['the','a','an','and','or','but','is','are','was','were','be','to','of','in','on','at','for','with','you','i','it','that','this','we','they','he','she','my','your','do','does','did','have','has','had','not','no','yes','what','how','when','where','why','can','could','would','will','so','if','then','there','here']);
function vocab(dlg) {
  const s = new Set();
  for (const t of dlg) for (const w of t.text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)) {
    if (w.length >= 3 && !STOP.has(w)) s.add(w);
  }
  return s;
}
function jaccard(a, b) {
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter || 1);
}
function sameTopicChimeras(dialogues) {
  const vocabs = dialogues.map(vocab);
  return dialogues.map((dlg, k) => {
    let best = -1, bestSim = -1;
    for (let j = 0; j < dialogues.length; j++) {
      if (j === k) continue;
      const sim = jaccard(vocabs[k], vocabs[j]);
      if (sim > bestSim) { bestSim = sim; best = j; }
    }
    const partner = dialogues[best];
    return dlg.map((turn, i) => i % 2 === 0 ? turn
      : { speaker: turn.speaker, text: partner[Math.min(i, partner.length - 1)].text });
  });
}

function evaluate(dialogues, opts) {
  let opp = 0, lexical = 0, semantic = 0, parallel = 0;
  for (const turns of dialogues) {
    const r = analyzeExchange(turns, opts);
    opp += r.uptake.length;
    lexical += r.uptake.filter(e => e.type === 'TRANSFORMATIVE' || e.type === 'WEAK').length;
    semantic += r.uptake.filter(e => e.type === 'SEMANTIC').length;
    if (r.verdict.status === 'PARALLEL MONOLOGUES') parallel++;
  }
  const n = dialogues.length;
  return {
    n,
    combinedRate: +(((lexical + semantic) / Math.max(1, opp)).toFixed(3)),
    semanticRate: +((semantic / Math.max(1, opp)).toFixed(3)),
    semanticEvents: semantic,
    pctParallel: +((parallel / n).toFixed(3))
  };
}

const BASE = {};                        // shipped config (stemming only)
const SEM = { semanticUptake: true };   // + distributional channel

const dd = loadDailyDialog();
const hh = loadHhRlhf();
const pops = {
  'HH-real': dd,
  'HH-chimera': sameTopicChimeras(dd),
  'HH-shuffled': randomShuffle(dd, 20260704),
  'HAI-real': hh,
  'HAI-chimera': sameTopicChimeras(hh),
  'HAI-shuffled': randomShuffle(hh, 20260704)
};

console.log('═'.repeat(74));
console.log('R2-PROPER — distributional semantic uptake (disjoint train/eval)');
console.log('═'.repeat(74));
console.log('\n  population   | mode  | combined  semantic(events) | %PARALLEL');

const results = {};
for (const [name, dialogues] of Object.entries(pops)) {
  for (const [mode, opts] of [['base', BASE], ['+sem', SEM]]) {
    const e = evaluate(dialogues, opts);
    results[`${name}|${mode}`] = e;
    console.log(`  ${name.padEnd(12)} | ${mode.padEnd(5)} | ${String(e.combinedRate).padEnd(9)} ${String(e.semanticRate).padEnd(6)}(${String(e.semanticEvents).padEnd(4)})    | ${(e.pctParallel * 100).toFixed(1)}%`);
  }
}

const g1 = results['HH-real|+sem'].semanticRate > 3 * Math.max(0.001, results['HH-shuffled|+sem'].semanticRate) &&
           results['HAI-real|+sem'].semanticRate > 3 * Math.max(0.001, results['HAI-shuffled|+sem'].semanticRate);
const g2 = results['HH-real|+sem'].pctParallel < results['HH-real|base'].pctParallel;
const g3 = results['HH-real|+sem'].combinedRate > results['HH-shuffled|+sem'].combinedRate &&
           results['HAI-real|+sem'].combinedRate > results['HAI-shuffled|+sem'].combinedRate;
const g4 = results['HH-real|+sem'].semanticRate > results['HH-chimera|+sem'].semanticRate &&
           results['HAI-real|+sem'].semanticRate > results['HAI-chimera|+sem'].semanticRate;

console.log('\n' + '═'.repeat(74));
console.log(`G1 precision (semantic real > 3x shuffled):     ${g1 ? 'HELD' : 'FAILED'}`);
console.log(`G2 recall (HH-real %PARALLEL drops):            ${g2 ? 'HELD' : 'FAILED'}  (${(results['HH-real|base'].pctParallel * 100).toFixed(1)}% → ${(results['HH-real|+sem'].pctParallel * 100).toFixed(1)}%)`);
console.log(`G3 separation retained:                         ${g3 ? 'HELD' : 'FAILED'}`);
console.log(`G4 acid test (semantic real > same-topic chimera): ${g4 ? 'HELD' : 'FAILED'}`);
console.log('═'.repeat(74));
console.log(g1 && g2 && g3 && g4
  ? 'All gates held: the semantic channel is measuring relation, not topic.'
  : 'At least one gate FAILED. Published as-is; default decided accordingly.');

fs.writeFileSync(path.join(__dirname, 'results-r2b-semantic.json'),
  JSON.stringify({ date: new Date().toISOString(), results, gates: { g1, g2, g3, g4 } }, null, 2));
console.log('\nresults written to validation/results-r2b-semantic.json');

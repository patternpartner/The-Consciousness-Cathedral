#!/usr/bin/env node
// R2-structural, first slice: typed question-answer slot binding.
//
// A wh-question opens a typed slot (when→time, how many→quantity,
// who→person); a reply filling the right type is structural uptake with
// zero lexical overlap. Two channels already died in this harness
// (surface patterns: base rate; distributional: topical). The typed
// channel's hope is that time/quantity/person expressions are RARE as
// turn content, so conditional lift can clear the gates.
//
// Pre-stated gates (same bars as every prior channel):
//   G1 precision: typed-event rate on real > 3x random shuffle, both corpora
//   G4 acid test: typed-event rate on real > same-topic chimera, both corpora
//   G3: overall separation retained with the channel on
// Disposition rule: all three hold → ships default-on; any fails →
// default-off opt-in, published either way.

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
function lcg(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
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
function jaccard(a, b) { let i2 = 0; for (const w of a) if (b.has(w)) i2++; return i2 / (a.size + b.size - i2 || 1); }
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

function evaluate(dialogues) {
  let opp = 0, typed = 0, combined = 0;
  const byPair = {};
  for (const turns of dialogues) {
    const r = analyzeExchange(turns, { typedAnswers: true });
    opp += r.uptake.length;
    for (const e of r.uptake) {
      if (e.type === 'TYPED') { typed++; byPair[e.pair] = (byPair[e.pair] || 0) + 1; }
      if (e.type !== 'NONE' && e.type !== 'ECHO') combined++;
    }
  }
  return {
    n: dialogues.length,
    typedRate: +((typed / Math.max(1, opp)).toFixed(4)),
    typedEvents: typed,
    combinedRate: +((combined / Math.max(1, opp)).toFixed(3)),
    byPair
  };
}

const dd = loadDailyDialog();
const hh = loadHhRlhf();
const pops = {
  'HH-real': dd, 'HH-chimera': sameTopicChimeras(dd), 'HH-shuffled': randomShuffle(dd, 20260704),
  'HAI-real': hh, 'HAI-chimera': sameTopicChimeras(hh), 'HAI-shuffled': randomShuffle(hh, 20260704)
};

console.log('═'.repeat(74));
console.log('R2-STRUCTURAL SLICE 1 — typed question-answer slot binding');
console.log('═'.repeat(74));
console.log('\n  population   | typed rate (events) | by pair');

const results = {};
for (const [name, dialogues] of Object.entries(pops)) {
  const e = evaluate(dialogues);
  results[name] = e;
  console.log(`  ${name.padEnd(12)} | ${String(e.typedRate).padEnd(7)} (${String(e.typedEvents).padEnd(4)})     | ${JSON.stringify(e.byPair)}`);
}

const floor = x => Math.max(0.0005, x);
const g1 = results['HH-real'].typedRate > 3 * floor(results['HH-shuffled'].typedRate) &&
           results['HAI-real'].typedRate > 3 * floor(results['HAI-shuffled'].typedRate);
const g4 = results['HH-real'].typedRate > results['HH-chimera'].typedRate &&
           results['HAI-real'].typedRate > results['HAI-chimera'].typedRate;
const g3 = results['HH-real'].combinedRate > results['HH-shuffled'].combinedRate &&
           results['HAI-real'].combinedRate > results['HAI-shuffled'].combinedRate;

console.log('\n' + '═'.repeat(74));
console.log(`G1 precision (real > 3x shuffled):        ${g1 ? 'HELD' : 'FAILED'}`);
console.log(`G4 acid test (real > same-topic chimera): ${g4 ? 'HELD' : 'FAILED'}`);
console.log(`G3 separation retained:                   ${g3 ? 'HELD' : 'FAILED'}`);
console.log('═'.repeat(74));
console.log(g1 && g4 && g3
  ? 'All gates held → typed answers ship default-on.'
  : 'At least one gate failed → ships default-off (opt-in), published as-is.');

fs.writeFileSync(path.join(__dirname, 'results-r2c-typed.json'),
  JSON.stringify({ date: new Date().toISOString(), results, gates: { g1, g4, g3 } }, null, 2));
console.log('\nresults written to validation/results-r2c-typed.json');

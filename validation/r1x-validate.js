#!/usr/bin/env node
// R1.x validation: run relational-core against transcripts its authors
// didn't write, plus shuffle-destroyed negative controls.
//
// Populations:
//   HH-real       DailyDialog (human–human, Li et al. 2017)
//   HAI-real      Anthropic hh-rlhf "chosen" transcripts (human–AI)
//   HH-shuffled   DailyDialog turns drawn from *different* dialogues —
//                 surface fluency preserved, relational structure destroyed
//   HAI-shuffled  same operation on hh-rlhf
//
// The falsifiable prediction (docs/RELATIONAL-PROGRAM.md): real dialogue
// must show more uptake and more round trips than its shuffled control.
// If it does not, the measures fail and that result is published as-is.

const fs = require('fs');
const path = require('path');
const { analyzeExchange } = require('../relational-core.js');

const DATA = path.join(__dirname, 'data');
const MIN_TURNS = 4;

// Deterministic RNG so the shuffled control is reproducible.
function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function loadDailyDialog() {
  const dialogues = [];
  for (const off of [0, 100, 200]) {
    const rows = JSON.parse(fs.readFileSync(path.join(DATA, `dd_${off}.json`))).rows;
    for (const { row } of rows) {
      const turns = row.utterances.map((u, i) => ({ speaker: i % 2 === 0 ? 'A' : 'B', text: u }));
      if (turns.length >= MIN_TURNS) dialogues.push(turns);
    }
  }
  return dialogues;
}

function loadHhRlhf() {
  const dialogues = [];
  for (const off of [0, 100, 200]) {
    const rows = JSON.parse(fs.readFileSync(path.join(DATA, `hh_${off}.json`))).rows;
    for (const { row } of rows) {
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

// Frankenstein control: dialogue k keeps its length and speaker pattern,
// but each turn is drawn from a different randomly chosen dialogue at the
// same position parity. Every turn is real fluent dialogue text; no turn
// is a response to the turn before it.
function shufflePopulation(dialogues, seed) {
  const rand = lcg(seed);
  return dialogues.map((dlg, k) => dlg.map((turn, i) => {
    let src = k;
    for (let guard = 0; guard < 20 && src === k; guard++) {
      src = Math.floor(rand() * dialogues.length);
    }
    const donor = dialogues[src];
    const donorTurn = donor[Math.min(i, donor.length - 1)];
    return { speaker: turn.speaker, text: donorTurn.text };
  }));
}

function evaluate(name, dialogues) {
  const verdicts = {};
  let uptakeOpportunities = 0, transformative = 0, weak = 0, echo = 0;
  let dialoguesWithRoundTrip = 0, totalRoundTrips = 0, repairsResolved = 0;

  for (const turns of dialogues) {
    const r = analyzeExchange(turns);
    verdicts[r.verdict.status] = (verdicts[r.verdict.status] || 0) + 1;
    uptakeOpportunities += r.uptake.length;
    transformative += r.uptake.filter(e => e.type === 'TRANSFORMATIVE').length;
    weak += r.uptake.filter(e => e.type === 'WEAK').length;
    echo += r.uptake.filter(e => e.type === 'ECHO').length;
    const rt = r.coConstruction.roundTrips.length;
    totalRoundTrips += rt;
    if (rt > 0) dialoguesWithRoundTrip++;
    repairsResolved += r.repairs.filter(x => x.resolved).length;
  }

  const n = dialogues.length;
  return {
    name, n,
    verdicts,
    uptakeRate: +( (transformative + weak) / Math.max(1, uptakeOpportunities) ).toFixed(3),
    transformativeRate: +( transformative / Math.max(1, uptakeOpportunities) ).toFixed(3),
    echoRate: +( echo / Math.max(1, uptakeOpportunities) ).toFixed(3),
    pctWithRoundTrip: +( dialoguesWithRoundTrip / n ).toFixed(3),
    meanRoundTrips: +( totalRoundTrips / n ).toFixed(2),
    repairsResolved
  };
}

const hhReal = loadDailyDialog();
const haiReal = loadHhRlhf();
const populations = [
  evaluate('HH-real (DailyDialog)', hhReal),
  evaluate('HH-shuffled (control)', shufflePopulation(hhReal, 20260704)),
  evaluate('HAI-real (hh-rlhf)', haiReal),
  evaluate('HAI-shuffled (control)', shufflePopulation(haiReal, 20260704))
];

console.log('═'.repeat(70));
console.log('R1.x VALIDATION — relational-core vs transcripts we did not write');
console.log('═'.repeat(70));
for (const p of populations) {
  console.log(`\n${p.name}  (n=${p.n})`);
  console.log(`  uptake rate:          ${p.uptakeRate}   (transformative: ${p.transformativeRate}, echo: ${p.echoRate})`);
  console.log(`  dialogues w/ ≥1 round trip: ${(p.pctWithRoundTrip * 100).toFixed(1)}%   mean round trips: ${p.meanRoundTrips}`);
  console.log(`  repairs resolved:     ${p.repairsResolved}`);
  console.log(`  verdicts: ${Object.entries(p.verdicts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  ')}`);
}

// The prediction, stated before the numbers were seen:
const sep = (real, ctrl) =>
  real.uptakeRate > ctrl.uptakeRate && real.pctWithRoundTrip > ctrl.pctWithRoundTrip;
const hhSep = sep(populations[0], populations[1]);
const haiSep = sep(populations[2], populations[3]);

console.log('\n' + '═'.repeat(70));
console.log(`Separation real vs shuffled — HH: ${hhSep ? 'YES' : 'NO'}   HAI: ${haiSep ? 'YES' : 'NO'}`);
console.log(hhSep && haiSep
  ? 'Prediction held: destroying relational structure lowers the measures.'
  : 'PREDICTION FAILED for at least one population. Per the program rules,\nthis is a finding against the measures and is published as-is.');
console.log('═'.repeat(70));

fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify({ date: new Date().toISOString(), populations, separation: { hh: hhSep, hai: haiSep } }, null, 2));
console.log('\nresults written to validation/results.json');

process.exit(0);

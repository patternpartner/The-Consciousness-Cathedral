#!/usr/bin/env node
// R1.x run 3 — length control for the run-2 flagship finding.
//
// Run 2 found echo rate separates machine-machine dialogue (33%) from any
// population containing a human (2-4%), and flagged the confound itself:
// UltraChat turns are essay-length, and longer adjacent turns give a
// >=6-token verbatim run more chances to occur. This run controls for it
// two ways:
//
//   1. Matched bands: classify every adjacent cross-speaker pair by
//      min(prev tokens, cur tokens), compare echo/uptake rates per band,
//      only where a band has >=30 pairs in both populations compared.
//   2. Truncation robustness: cap every turn at its first 30 tokens
//      across all populations and recompute overall rates.
//
// Pre-stated prediction: the AIAI-vs-human echo separation survives within
// every adequately-populated length band and under truncation. If within-
// band AIAI echo collapses to human levels, the flagship finding is a
// length artifact and gets downgraded in the docs, prominently.

const fs = require('fs');
const path = require('path');
const { analyzeExchange } = require('../relational-core.js');

const DATA = path.join(__dirname, 'data');
const MIN_TURNS = 4;
const BANDS = [[3, 15], [15, 40], [40, 100], [100, 1e9]];
const MIN_PAIRS_PER_CELL = 30;
const TRUNC = 30;

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
function loadUltraChat() {
  const out = [];
  for (const off of [0, 100, 200]) {
    for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, `ua_${off}.json`))).rows) {
      const turns = row.messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ speaker: m.role === 'user' ? 'UserAI' : 'AssistantAI', text: m.content }));
      if (turns.length >= MIN_TURNS) out.push(turns);
    }
  }
  return out;
}

const tokens = t => t.split(/\s+/).filter(Boolean).length;

function pairStats(dialogues) {
  // per adjacent cross-speaker pair: band by min(prev,cur) token count
  const cells = BANDS.map(() => ({ pairs: 0, echo: 0, uptake: 0 }));
  for (const turns of dialogues) {
    const r = analyzeExchange(turns);
    for (const e of r.uptake) {
      const lo = Math.min(tokens(turns[e.from].text), tokens(turns[e.to].text));
      const bi = BANDS.findIndex(([a, b]) => lo >= a && lo < b);
      if (bi < 0) continue;
      cells[bi].pairs++;
      if (e.type === 'ECHO') cells[bi].echo++;
      if (e.type === 'TRANSFORMATIVE' || e.type === 'WEAK') cells[bi].uptake++;
    }
  }
  return cells;
}

function truncate(dialogues, cap) {
  return dialogues.map(dlg => dlg.map(t => ({
    speaker: t.speaker,
    text: t.text.split(/\s+/).filter(Boolean).slice(0, cap).join(' ')
  })));
}

function overallEcho(dialogues) {
  let opp = 0, echo = 0;
  for (const turns of dialogues) {
    const r = analyzeExchange(turns);
    opp += r.uptake.length;
    echo += r.uptake.filter(e => e.type === 'ECHO').length;
  }
  return { opp, echoRate: +(echo / Math.max(1, opp)).toFixed(3) };
}

const pops = {
  HH: loadDailyDialog(),
  HAI: loadHhRlhf(),
  AIAI: loadUltraChat()
};

console.log('═'.repeat(74));
console.log('R1.x RUN 3 — is the echo discriminator a turn-length artifact?');
console.log('═'.repeat(74));

console.log('\nMatched length bands — echo rate (uptake rate) [n pairs]');
console.log('  band = min(prev,cur) tokens\n');
const header = '  band      ' + Object.keys(pops).map(p => p.padEnd(24)).join('');
console.log(header);

const stats = {};
for (const [name, dialogues] of Object.entries(pops)) stats[name] = pairStats(dialogues);

const bandRows = [];
for (let bi = 0; bi < BANDS.length; bi++) {
  const label = BANDS[bi][1] > 1e8 ? `${BANDS[bi][0]}+` : `${BANDS[bi][0]}-${BANDS[bi][1]}`;
  let row = `  ${label.padEnd(9)} `;
  const cellsOut = {};
  for (const name of Object.keys(pops)) {
    const c = stats[name][bi];
    const er = c.pairs ? c.echo / c.pairs : 0;
    const ur = c.pairs ? c.uptake / c.pairs : 0;
    cellsOut[name] = { pairs: c.pairs, echoRate: +er.toFixed(3), uptakeRate: +ur.toFixed(3) };
    row += `${(er * 100).toFixed(1)}% (${(ur * 100).toFixed(1)}%) [${c.pairs}]`.padEnd(24);
  }
  bandRows.push({ band: label, cells: cellsOut });
  console.log(row);
}

// Prediction check: in every band where AIAI and a human population both
// have >= MIN_PAIRS_PER_CELL, AIAI echo must exceed 3x the human rate.
let comparable = 0, survived = 0;
const failures = [];
for (const { band, cells } of bandRows) {
  for (const human of ['HH', 'HAI']) {
    if (cells.AIAI.pairs >= MIN_PAIRS_PER_CELL && cells[human].pairs >= MIN_PAIRS_PER_CELL) {
      comparable++;
      if (cells.AIAI.echoRate > 3 * Math.max(0.005, cells[human].echoRate)) survived++;
      else failures.push(`${band} vs ${human}: AIAI ${cells.AIAI.echoRate} vs ${cells[human].echoRate}`);
    }
  }
}

console.log(`\nTruncation robustness (all turns capped at ${TRUNC} tokens):`);
const truncOut = {};
for (const [name, dialogues] of Object.entries(pops)) {
  const t = overallEcho(truncate(dialogues, TRUNC));
  truncOut[name] = t;
  console.log(`  ${name.padEnd(5)} echo ${(t.echoRate * 100).toFixed(1)}%  [${t.opp} pairs]`);
}

const truncSurvives = truncOut.AIAI.echoRate > 3 * Math.max(0.005, truncOut.HH.echoRate) &&
                      truncOut.AIAI.echoRate > 3 * Math.max(0.005, truncOut.HAI.echoRate);

console.log('\n' + '═'.repeat(74));
console.log(`Band cells comparable (n>=${MIN_PAIRS_PER_CELL} both sides): ${comparable}; separation survived in ${survived}`);
if (failures.length) failures.forEach(f => console.log(`  failed: ${f}`));
console.log(`Truncation control: ${truncSurvives ? 'separation SURVIVED' : 'separation COLLAPSED'}`);
console.log(comparable > 0 && survived === comparable && truncSurvives
  ? 'Prediction held: the echo discriminator is not a length artifact.'
  : 'Prediction failed in at least one control. Downgrade per program rules.');
console.log('═'.repeat(74));

fs.writeFileSync(path.join(__dirname, 'results-run3.json'), JSON.stringify({
  date: new Date().toISOString(),
  bands: bandRows,
  truncation: truncOut,
  prediction: { comparable, survived, truncSurvives, failures }
}, null, 2));
console.log('\nresults written to validation/results-run3.json');

#!/usr/bin/env node
// R1.x run 5 — has the machine echo signature drifted across model
// generations?
//
// Runs 2-4 established the signature on 2023-era GPT-3.5-family corpora
// (UltraChat, CAMEL). This run measures 2024-era Llama-3-family machine-
// machine dialogue: the Magpie MT corpora, where one model generates BOTH
// sides of each conversation (the "human" turns are model-generated).
//
// This is a measurement, not a confirmation — no directional prediction.
// Pre-stated decision rule instead, calibrated to run 4's human ceiling
// (HAI 4.0% ≈ the highest human-involved echo rate; ceiling set at 5%):
//   - echo > 3x the 5% human ceiling (i.e. >15%)  → signature PRESENT
//   - echo < 2x the ceiling (i.e. <10%)           → substantially DRIFTED
//   - between                                      → ATTENUATED
// Rule applies to the truncation-controlled rate (the conservative one).

const fs = require('fs');
const path = require('path');
const { analyzeExchange } = require('../relational-core.js');

const DATA = path.join(__dirname, 'data');
const MIN_TURNS = 4;
const TRUNC = 30;
const BANDS = [[3, 15], [15, 40], [40, 100]];
const HUMAN_CEILING = 0.05;

function loadMagpie(prefix) {
  const out = [];
  for (const f of fs.readdirSync(DATA).filter(f => f.startsWith(prefix)).sort()) {
    for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, f))).rows) {
      if (!row.conversations) continue;
      const turns = row.conversations
        .filter(m => m.from === 'human' || m.from === 'gpt')
        .map(m => ({ speaker: m.from === 'human' ? 'UserAI' : 'AssistantAI', text: m.value }));
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
function loadCamel() {
  const byConv = new Map();
  for (const f of fs.readdirSync(DATA).filter(f => f.startsWith('cm_'))) {
    for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, f))).rows) {
      let arr = byConv.get(row.conversation_id);
      if (!arr) byConv.set(row.conversation_id, arr = []);
      arr.push(row);
    }
  }
  const out = [];
  for (const rows of byConv.values()) {
    rows.sort((a, b) => a.message_id - b.message_id);
    const turns = [];
    for (const r of rows) {
      const speaker = r.message_type === 'output' ? 'ExecutorAI' : 'InstructorAI';
      if (turns.length && turns[turns.length - 1].speaker === speaker) {
        turns[turns.length - 1].text += ' ' + r.message;
      } else {
        turns.push({ speaker, text: r.message });
      }
    }
    if (turns.length >= MIN_TURNS) out.push(turns);
  }
  return out;
}

const tokens = t => t.split(/\s+/).filter(Boolean).length;
const truncate = (dialogues, cap) => dialogues.map(dlg => dlg.map(t => ({
  speaker: t.speaker, text: t.text.split(/\s+/).filter(Boolean).slice(0, cap).join(' ')
})));

function stats(dialogues) {
  let opp = 0, echo = 0, uptake = 0;
  const bandCells = BANDS.map(() => ({ pairs: 0, echo: 0 }));
  for (const turns of dialogues) {
    const r = analyzeExchange(turns);
    opp += r.uptake.length;
    for (const e of r.uptake) {
      if (e.type === 'ECHO') echo++;
      if (e.type === 'TRANSFORMATIVE' || e.type === 'WEAK') uptake++;
      const lo = Math.min(tokens(turns[e.from].text), tokens(turns[e.to].text));
      const bi = BANDS.findIndex(([a, b]) => lo >= a && lo < b);
      if (bi >= 0) {
        bandCells[bi].pairs++;
        if (e.type === 'ECHO') bandCells[bi].echo++;
      }
    }
  }
  return {
    n: dialogues.length, pairs: opp,
    echoRate: +(echo / Math.max(1, opp)).toFixed(3),
    uptakeRate: +(uptake / Math.max(1, opp)).toFixed(3),
    bands: bandCells.map(c => ({ pairs: c.pairs, echoRate: c.pairs ? +(c.echo / c.pairs).toFixed(3) : null }))
  };
}

const pops = {
  'AIAI-2023 UltraChat (GPT-3.5)': loadUltraChat(),
  'AIAI-2023 CAMEL (GPT-3.5)': loadCamel(),
  'AIAI-2024 Magpie (Llama-3-70B)': loadMagpie('mg3_'),
  'AIAI-2024 Magpie (Llama-3.1)': loadMagpie('mg31_')
};

console.log('═'.repeat(80));
console.log('R1.x RUN 5 — machine echo signature across model generations');
console.log('═'.repeat(80));
console.log('\n  population                      | n dlg | echo    | trunc-30 | bands 3-15 / 15-40 / 40-100');

const out = {};
for (const [name, dialogues] of Object.entries(pops)) {
  const s = stats(dialogues);
  const st = stats(truncate(dialogues, TRUNC));
  out[name] = { full: s, truncatedEcho: st.echoRate };
  const b = s.bands.map(x => x.echoRate === null ? '—' : `${(x.echoRate * 100).toFixed(1)}% [${x.pairs}]`).join(' / ');
  console.log(`  ${name.padEnd(31)} | ${String(s.n).padEnd(5)} | ${(s.echoRate * 100).toFixed(1).padEnd(6)}% | ${(st.echoRate * 100).toFixed(1).padEnd(7)}% | ${b}`);
}

console.log('\n  Decision rule on truncation-controlled echo (human ceiling 5%):');
const verdicts = {};
for (const name of Object.keys(pops)) {
  const t = out[name].truncatedEcho;
  const v = t > 3 * HUMAN_CEILING ? 'signature PRESENT' : t < 2 * HUMAN_CEILING ? 'substantially DRIFTED' : 'ATTENUATED';
  verdicts[name] = v;
  console.log(`    ${name.padEnd(31)} ${(t * 100).toFixed(1)}%  → ${v}`);
}

fs.writeFileSync(path.join(__dirname, 'results-run5.json'),
  JSON.stringify({ date: new Date().toISOString(), populations: out, verdicts }, null, 2));
console.log('\nresults written to validation/results-run5.json');

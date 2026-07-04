#!/usr/bin/env node
// R1.x second run — two questions the first run left open:
//
// 1. THE TOPICAL OBJECTION. The random-shuffle control destroys topical
//    coherence along with relational structure, so a skeptic can claim the
//    first run only measured topic drift. Answer: a same-topic chimera —
//    pair each dialogue with its most lexically similar *other* dialogue
//    (maximizing shared vocabulary), then interleave: speaker A's turns
//    from one, speaker B's turns from the other. The chimera is about the
//    same subject with maximal vocabulary overlap, but nobody responds to
//    anybody. If real dialogue still separates from this, the signal is
//    relational, not topical.
//
// 2. THREE-WAY SEPARABILITY. The program doc asks whether human–human,
//    human–AI, and AI–AI exchanges are separable by these measures.
//    AI–AI population: UltraChat (an LLM roleplaying the user talking to
//    an LLM assistant — both sides machine-generated).
//
// Predictions, stated before the numbers were seen:
//   P1: real > same-topic chimera on uptake and round trips (both corpora)
//   P2: the chimera scores above the random shuffle (topic overlap alone
//       buys *some* lexical uptake) — if it didn't, the pairing failed
//   P3 (exploratory, no pass/fail): the three populations differ in
//       uptake profile and asymmetry direction.

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

// --- same-topic chimera construction -------------------------------------

const STOP = new Set(['the','a','an','and','or','but','is','are','was','were','be','to','of','in','on','at','for','with','you','i','it','that','this','we','they','he','she','my','your','do','does','did','have','has','had','not','no','yes','what','how','when','where','why','can','could','would','will','so','if','then','there','here']);

function vocab(dlg) {
  const s = new Set();
  for (const t of dlg) {
    for (const w of t.text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)) {
      if (w.length >= 3 && !STOP.has(w)) s.add(w);
    }
  }
  return s;
}

function jaccard(a, b) {
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

// Pair each dialogue with its most lexically similar other dialogue, then
// interleave A-turns from self with B-turns from the partner. Same subject,
// maximal shared vocabulary, zero response structure.
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
    return dlg.map((turn, i) => {
      if (i % 2 === 0) return turn; // keep own A-side turns
      const donor = partner[Math.min(i, partner.length - 1)];
      return { speaker: turn.speaker, text: donor.text };
    });
  });
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

// --- evaluation ------------------------------------------------------------

function evaluate(name, dialogues) {
  let opp = 0, trans = 0, weakN = 0, echoN = 0, rtTotal = 0, rtDlgs = 0;
  const uptakeBy = {}, introBy = {};
  const verdicts = {};
  for (const turns of dialogues) {
    const r = analyzeExchange(turns);
    verdicts[r.verdict.status] = (verdicts[r.verdict.status] || 0) + 1;
    opp += r.uptake.length;
    for (const e of r.uptake) {
      if (e.type === 'TRANSFORMATIVE') { trans++; uptakeBy[e.responder] = (uptakeBy[e.responder] || 0) + 1; }
      else if (e.type === 'WEAK') { weakN++; uptakeBy[e.responder] = (uptakeBy[e.responder] || 0) + 1; }
      else if (e.type === 'ECHO') echoN++;
    }
    const rt = r.coConstruction.roundTrips.length;
    rtTotal += rt;
    if (rt > 0) rtDlgs++;
    for (const t of r.coConstruction.roundTrips) introBy[t.introducedBy] = (introBy[t.introducedBy] || 0) + 1;
  }
  const n = dialogues.length;
  return {
    name, n,
    uptakeRate: +(((trans + weakN) / Math.max(1, opp)).toFixed(3)),
    transformativeRate: +((trans / Math.max(1, opp)).toFixed(3)),
    echoRate: +((echoN / Math.max(1, opp)).toFixed(3)),
    pctWithRoundTrip: +((rtDlgs / n).toFixed(3)),
    meanRoundTrips: +((rtTotal / n).toFixed(2)),
    uptakeBy, roundTripIntroBy: introBy, verdicts
  };
}

const dd = loadDailyDialog();
const hh = loadHhRlhf();
const ua = loadUltraChat();

console.log('═'.repeat(72));
console.log('R1.x RUN 2 — same-topic control & three-way population comparison');
console.log('═'.repeat(72));

// Question 1: the topical objection
const q1 = [
  evaluate('HH-real', dd),
  evaluate('HH-sametopic-chimera', sameTopicChimeras(dd)),
  evaluate('HH-random-shuffle', randomShuffle(dd, 20260704)),
  evaluate('HAI-real', hh),
  evaluate('HAI-sametopic-chimera', sameTopicChimeras(hh)),
  evaluate('HAI-random-shuffle', randomShuffle(hh, 20260704))
];

console.log('\nQ1 — is the signal relational, or just topical coherence?\n');
for (const p of q1) {
  console.log(`  ${p.name.padEnd(24)} n=${String(p.n).padEnd(4)} uptake=${String(p.uptakeRate).padEnd(6)} roundTripDlgs=${(p.pctWithRoundTrip * 100).toFixed(1)}%  meanRT=${p.meanRoundTrips}`);
}

const p1 = q1[0].uptakeRate > q1[1].uptakeRate && q1[0].pctWithRoundTrip > q1[1].pctWithRoundTrip &&
           q1[3].uptakeRate > q1[4].uptakeRate && q1[3].pctWithRoundTrip > q1[4].pctWithRoundTrip;
const p2 = q1[1].uptakeRate > q1[2].uptakeRate && q1[4].uptakeRate > q1[5].uptakeRate;

console.log(`\n  P1 (real > same-topic chimera):    ${p1 ? 'HELD' : 'FAILED'}`);
console.log(`  P2 (chimera > random shuffle):     ${p2 ? 'HELD' : 'FAILED'}${p2 ? '' : '  (pairing may be broken — investigate before claiming P1)'}`);

// Question 2: three-way separability
console.log('\nQ2 — three-way population comparison (exploratory)\n');
const q2 = [evaluate('HH (DailyDialog)', dd), evaluate('HAI (hh-rlhf)', hh), evaluate('AIAI (UltraChat)', ua)];
for (const p of q2) {
  console.log(`  ${p.name.padEnd(20)} n=${String(p.n).padEnd(4)} uptake=${String(p.uptakeRate).padEnd(6)} transform=${String(p.transformativeRate).padEnd(6)} roundTripDlgs=${(p.pctWithRoundTrip * 100).toFixed(1)}%  meanRT=${p.meanRoundTrips}`);
  console.log(`     uptake by: ${JSON.stringify(p.uptakeBy)}  round-trip intro by: ${JSON.stringify(p.roundTripIntroBy)}`);
}

fs.writeFileSync(path.join(__dirname, 'results-run2.json'),
  JSON.stringify({ date: new Date().toISOString(), topicalControl: q1, populations: q2, predictions: { p1, p2 } }, null, 2));
console.log('\nresults written to validation/results-run2.json');

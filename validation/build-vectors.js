#!/usr/bin/env node
// Builds the semantic similarity lexicon for R2-proper.
//
// Method: turn-level co-occurrence counts over a training corpus DISJOINT
// from every evaluation set (rows 300+ of each corpus; evaluation uses rows
// 0-300), PPMI weighting, truncated sparse vectors, cosine similarity,
// top-K neighbors above a threshold. Output is a plain JSON lexicon —
// deterministic, inspectable word-by-word, and shipped as data so runtime
// analysis is a lookup, not a model call.
//
// Tokenization is AnchorExtractor's own (stems, stopword filtering), so the
// lexicon speaks exactly the language the uptake binder speaks.

const fs = require('fs');
const path = require('path');
const { AnchorExtractor } = require('../relational-core.js');

const DATA = path.join(__dirname, 'data');
const OUT = path.join(__dirname, '..', 'semantic-neighbors.json');

const MIN_WORD_FREQ = 12;   // vocabulary floor
const N_CONTEXTS = 3000;    // context dimensions (most frequent words)
const MIN_COOC = 3;         // co-occurrence cell floor (kills one-off noise)
const CTX_SMOOTH = 0.75;    // context-distribution smoothing (Levy et al. 2015)
const TOP_CONTEXTS = 100;   // vector truncation per word
const TOP_NEIGHBORS = 10;
const MIN_SIM = 0.25;
const MAX_TURN_STEMS = 80;  // cap essay-length turns (UltraChat)

function turnTexts() {
  const texts = [];
  for (const f of fs.readdirSync(DATA).filter(f => f.startsWith('train_')).sort()) {
    const rows = JSON.parse(fs.readFileSync(path.join(DATA, f))).rows;
    for (const { row } of rows) {
      if (row.utterances) {
        texts.push(...row.utterances);
      } else if (row.chosen) {
        const parts = row.chosen.split(/\n\n(Human|Assistant): /).slice(1);
        for (let i = 0; i + 1 < parts.length; i += 2) texts.push(parts[i + 1]);
      } else if (row.messages) {
        for (const m of row.messages) if (m.content) texts.push(m.content);
      }
    }
  }
  return texts;
}

console.log('loading training turns...');
const texts = turnTexts();
console.log(`  ${texts.length} turns`);

console.log('tokenizing (AnchorExtractor stems)...');
const turnStems = [];
const freq = new Map();
for (const text of texts) {
  const { annotated } = AnchorExtractor.annotate([{ speaker: 'x', text }]);
  const uniq = [...new Set(annotated[0].content)].slice(0, MAX_TURN_STEMS);
  if (uniq.length < 2) continue;
  turnStems.push(uniq);
  for (const w of uniq) freq.set(w, (freq.get(w) || 0) + 1);
}

const vocab = new Set([...freq].filter(([, c]) => c >= MIN_WORD_FREQ).map(([w]) => w));
const contexts = [...freq].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
  .slice(0, N_CONTEXTS).map(([w]) => w);
const ctxIndex = new Map(contexts.map((w, i) => [w, i]));
console.log(`  vocab ${vocab.size} (freq>=${MIN_WORD_FREQ}), ${contexts.length} contexts, ${turnStems.length} usable turns`);

console.log('counting co-occurrence (turn-level)...');
const cooc = new Map();       // word -> Map(ctxIdx -> count)
const ctxTotals = new Float64Array(contexts.length);
let total = 0;
for (const stems of turnStems) {
  const ctxHere = stems.filter(w => ctxIndex.has(w));
  for (const w of stems) {
    if (!vocab.has(w)) continue;
    let m = cooc.get(w);
    if (!m) cooc.set(w, m = new Map());
    for (const c of ctxHere) {
      if (c === w) continue;
      const ci = ctxIndex.get(c);
      m.set(ci, (m.get(ci) || 0) + 1);
      ctxTotals[ci]++;
      total++;
    }
  }
}

console.log('PPMI (smoothed contexts, cell floor) + truncation...');
const wordTotals = new Map();
for (const [w, m] of cooc) {
  let t = 0;
  for (const c of m.values()) t += c;
  wordTotals.set(w, t);
}
// Context-distribution smoothing: raise context counts to the 0.75 power
// before normalizing. Standard remedy for PPMI's bias toward rare contexts.
let smoothTotal = 0;
const ctxSmooth = new Float64Array(contexts.length);
for (let i = 0; i < contexts.length; i++) {
  ctxSmooth[i] = Math.pow(ctxTotals[i], CTX_SMOOTH);
  smoothTotal += ctxSmooth[i];
}
const vectors = new Map(); // word -> [[ctxIdx, ppmi] ...] truncated, sorted by idx
for (const [w, m] of cooc) {
  const wt = wordTotals.get(w);
  const entries = [];
  for (const [ci, c] of m) {
    if (c < MIN_COOC) continue;
    const ppmi = Math.log((c / total) / ((wt / total) * (ctxSmooth[ci] / smoothTotal)));
    if (ppmi > 0) entries.push([ci, ppmi]);
  }
  entries.sort((a, b) => b[1] - a[1]);
  const kept = entries.slice(0, TOP_CONTEXTS).sort((a, b) => a[0] - b[0]);
  if (kept.length >= 4) vectors.set(w, kept);
}
console.log(`  ${vectors.size} vectors`);

console.log('cosine via inverted index...');
const norms = new Map();
for (const [w, v] of vectors) {
  norms.set(w, Math.sqrt(v.reduce((s, [, x]) => s + x * x, 0)));
}
const byCtx = new Map(); // ctxIdx -> [[word, weight]...]
for (const [w, v] of vectors) {
  for (const [ci, x] of v) {
    let arr = byCtx.get(ci);
    if (!arr) byCtx.set(ci, arr = []);
    arr.push([w, x]);
  }
}
const neighbors = {};
const words = [...vectors.keys()].sort();
for (const w of words) {
  const dots = new Map();
  for (const [ci, x] of vectors.get(w)) {
    for (const [u, y] of byCtx.get(ci)) {
      if (u === w) continue;
      dots.set(u, (dots.get(u) || 0) + x * y);
    }
  }
  const scored = [];
  for (const [u, d] of dots) {
    const sim = d / (norms.get(w) * norms.get(u));
    if (sim >= MIN_SIM) scored.push([u, +sim.toFixed(2)]);
  }
  scored.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  if (scored.length > 0) neighbors[w] = scored.slice(0, TOP_NEIGHBORS);
}

const out = {
  version: 1,
  method: `turn-level PPMI, ${contexts.length} contexts, top-${TOP_CONTEXTS} truncation, cosine >= ${MIN_SIM}, top-${TOP_NEIGHBORS}`,
  builtFrom: 'DailyDialog rows 300-2100, hh-rlhf rows 300-1200, ultrachat rows 300-600 (disjoint from all evaluation rows 0-300)',
  words: Object.keys(neighbors).length,
  neighbors
};
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`\nwrote ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB, ${out.words} words)`);

for (const probe of ['beer', 'doctor', 'money', 'movie', 'deploy', 'software']) {
  const s = AnchorExtractor.annotate([{ speaker: 'x', text: probe }]).annotated[0].content[0];
  console.log(`  ${probe} (${s}):`, (neighbors[s] || []).slice(0, 6).map(([w, x]) => `${w}:${x}`).join(' ') || '—');
}

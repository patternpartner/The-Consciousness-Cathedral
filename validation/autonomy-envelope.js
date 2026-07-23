#!/usr/bin/env node
// The autonomy envelope run — the corpus-scale audit the v3.38.0–v3.39.0
// autonomy loop owes. Pre-registered in docs/AUTONOMY-ENVELOPE-PREREG.md
// (committed before any envelope verdict was computed); this file implements
// that document and adds nothing to it.
//
// Part A: directed corner probes of the calibration clamp box [0.8, 1.2] —
//   A0 factory self-check, A1 specificity across every probed state (GATED),
//   A2 shuffle-structure of what the minting corner mints (GATED, power
//   clause), A3 envelope width on the certified LLM registers (reported),
//   A4 curated flip census (reported).
// Part B: the faithful online loop (analyze under active calibration →
//   observe → act, every step) run over real streams — which parts of the
//   box honest data actually reaches (B1, reported), and determinism of the
//   whole run (B2, GATED, verified by executing this file twice and
//   diffing the results JSON; no timestamps are written).
//
// Reproduce: bash fetch-corpora.sh, then node autonomy-envelope.js.
// Results: results-autonomy-envelope.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');
const { ProgressionMemory } = require('../progression.js');

const DATA = path.join(__dirname, 'data');
const OPERATIONAL_FAMILY = ['OPERATIONALLY SOUND', 'OPERATIONAL INTENT'];
const SEED = 20260723;
const SHUFFLES_PER_TEXT = 20;

// ── Deterministic PRNG + shuffle, verbatim from core-verdict-validation.js ──
function mulberry32(seed) {
    return function() {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function seededShuffle(arr, rand) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function wordShuffle(text, rand) {
    return seededShuffle(text.split(/\s+/).filter(Boolean), rand).join(' ');
}

// ── Population loaders, verbatim parsers from core-verdict-validation.js ──
function dailyDialogTurns() {
    const turns = [];
    for (const off of [0, 100, 200])
        for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, `dd_${off}.json`))).rows)
            for (const u of row.utterances) if (u && u.trim()) turns.push(u.trim());
    return turns;
}
function hhAssistantTurns() {
    const turns = [];
    for (const off of [0, 100, 200])
        for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, `hh_${off}.json`))).rows) {
            const parts = row.chosen.split(/\n\n(Human|Assistant): /).slice(1);
            for (let i = 0; i + 1 < parts.length; i += 2)
                if (parts[i] === 'Assistant') { const t = parts[i + 1].trim(); if (t) turns.push(t); }
        }
    return turns;
}
function ultrachatAssistantTurns() {
    const turns = [];
    for (const off of [0, 100, 200])
        for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, `ua_${off}.json`))).rows)
            for (const m of row.messages)
                if (m.role === 'assistant' && m.content && m.content.trim())
                    turns.push(m.content.trim());
    return turns;
}
// The committed LLM corpora are evaluated exactly as their certifying runs
// evaluated them: stripMarkdown + the 500-char prose floor, verbatim from
// llm-runbook-validation.js / llm-plan-validation.js — the published family
// rates (4.2% / 0.0%) were measured on this preprocessed text.
const MIN_PROSE = 500;
function stripMarkdown(md) {
    return md
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/~~~[\s\S]*?~~~/g, ' ')
        .replace(/`[^`\n]*`/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/^\s*\|?[-:| ]+\|[-:| ]*$/gm, ' ')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
        .replace(/^>\s?/gm, '')
        .replace(/\|/g, ' ')
        .replace(/<[^>\n]{1,80}>/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
function llmCorpus(file) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, file))).documents
        .map(d => stripMarkdown(d.text || ''))
        .filter(t => t.length >= MIN_PROSE);
}
// Curated SOUND set — run 1's construction verbatim.
function curatedSoundTexts() {
    const texts = [
        'If error rate exceeds 5%, we abort deployment and roll back within ten minutes.\nWe have three failure modes: cache overflow, API timeout, edge case bugs.\nFor each, we monitor a dashboard metric and a rollback runbook exists.\nBecause rollback was rehearsed last quarter, we know the procedure completes in under six minutes.'
    ];
    const content = fs.readFileSync(path.join(__dirname, '..', 'cathedral-test-cases.md'), 'utf8');
    for (const s of content.split(/^## Test /m).slice(1)) {
        const m = s.match(/\*\*Test Input:\*\*\s+```([^`]+)```/s);
        if (!m) continue;
        const t = m[1].trim();
        if (core.analyzeCathedral(t).verdict.status === 'OPERATIONALLY SOUND')
            texts.push(t);
    }
    return texts;
}

// ── Probed states (frozen in the pre-registration) ──
const PATTERNS = ['OPERATIONAL_EXCELLENCE', 'OPERATIONAL_INTENT',
    'PERFORMATIVE_CONSCIOUSNESS', 'PERFORMATIVE_HUMILITY',
    'CAUTIOUS_GROUNDEDNESS', 'EPISTEMIC_MISMATCH'];
function boxState(opNames, opVal, otherVal) {
    const s = {};
    for (const p of PATTERNS) s[p] = opNames.includes(p) ? opVal : otherVal;
    return s;
}
const OPERATIONAL_PATTERNS = ['OPERATIONAL_EXCELLENCE', 'OPERATIONAL_INTENT'];
const CORNER_STATES = {
    'C-MINT': boxState(OPERATIONAL_PATTERNS, 1.2, 0.8),
    'C-SUPP': boxState(OPERATIONAL_PATTERNS, 0.8, 1.2),
    'C-HI':   boxState(OPERATIONAL_PATTERNS, 1.2, 1.2),
    'C-LO':   boxState(OPERATIONAL_PATTERNS, 0.8, 0.8)
};

// ── Evaluation ──
// One pass of one population under one state. Returns the verdict of every
// text (for delta computation) plus the aggregates the gates read.
function evaluate(turns, state) {
    const verdicts = [];
    const dist = {};
    let sound = 0, family = 0;
    for (const text of turns) {
        const a = state ? core.analyzeCathedral(text, { patternCalibration: state })
                        : core.analyzeCathedral(text);
        const s = a.verdict.status;
        verdicts.push(s);
        dist[s] = (dist[s] || 0) + 1;
        if (s === 'OPERATIONALLY SOUND') sound++;
        if (OPERATIONAL_FAMILY.includes(s)) family++;
    }
    return { verdicts, dist, n: turns.length, sound, family,
             soundRate: sound / turns.length, familyRate: family / turns.length };
}

function pct(x) { return (x * 100).toFixed(2) + '%'; }

// ── Load everything ──
const populations = {
    'P1 DailyDialog (human, casual)':        { turns: dailyDialogTurns(),      gatedA1: true },
    'P2 hh-rlhf assistant (AI, conversational)': { turns: hhAssistantTurns(),  gatedA1: true },
    'P3 UltraChat assistant (AI, long-form)':    { turns: ultrachatAssistantTurns(), gatedA1: false },
    'P4 LLM runbooks (committed, v3.34.0)':  { turns: llmCorpus('corpus-llm-runbooks.json'), gatedA1: false },
    'P5 LLM rollout plans (committed, v3.35.0)': { turns: llmCorpus('corpus-llm-plans.json'), gatedA1: false }
};
const curated = curatedSoundTexts();

const results = { generated: '2026-07-23', seed: SEED,
    prereg: 'docs/AUTONOMY-ENVELOPE-PREREG.md',
    states: {}, a0: {}, a1: {}, a2: null, a3: {}, a4: {}, b1: {} };

// ── FACTORY pass (A0) ──
console.log('═'.repeat(63));
console.log('FACTORY pass');
const factory = {};
for (const [name, p] of Object.entries(populations)) {
    factory[name] = evaluate(p.turns, null);
    console.log(`  ${name}: n=${factory[name].n} SOUND ${pct(factory[name].soundRate)} family ${pct(factory[name].familyRate)}`);
}
results.a0 = {
    expected: { 'P1 SOUND': '0.00%', 'P2 SOUND': '0.00%', 'P4 family': '4.17%', 'P5 family': '0.00%' },
    measured: {
        'P1 SOUND': pct(factory['P1 DailyDialog (human, casual)'].soundRate),
        'P2 SOUND': pct(factory['P2 hh-rlhf assistant (AI, conversational)'].soundRate),
        'P4 family': pct(factory['P4 LLM runbooks (committed, v3.34.0)'].familyRate),
        'P5 family': pct(factory['P5 LLM rollout plans (committed, v3.35.0)'].familyRate)
    }
};
results.a0.verdict = (results.a0.measured['P1 SOUND'] === '0.00%' &&
    results.a0.measured['P2 SOUND'] === '0.00%' &&
    results.a0.measured['P4 family'] === '4.17%' &&
    results.a0.measured['P5 family'] === '0.00%')
    ? 'REPRODUCED' : 'DRIFT — re-baselined against today\'s factory numbers (see findings)';
console.log(`  A0: ${results.a0.verdict}`);

// ── Part B first: the reached states join the probe set ──
// The faithful online loop, exactly the unified page's wiring: every text is
// analyzed under whatever calibration the system has set for itself so far,
// the (uncalibrated) ballot is observed, and the system acts. Ledger
// timestamps are not written into the results (determinism by construction).
function runLoop(streamName, turns) {
    const mem = new ProgressionMemory();
    for (const text of turns) {
        const active = mem.active();
        const a = Object.keys(active).length
            ? core.analyzeCathedral(text, { patternCalibration: active, calibrationLabel: mem.label() })
            : core.analyzeCathedral(text);
        mem.observe(a);
        mem.act();
    }
    const summary = mem.summary().map(s => ({ pattern: s.pattern, winRate: s.winRate,
        avgConfidence: s.avgConfidence, samples: s.samples, calibration: s.calibration }));
    return { stream: streamName, reached: mem.active(), ledgerEntries: mem.size(),
             label: mem.label(), patterns: summary };
}
console.log('═'.repeat(63));
console.log('Part B — the faithful loop on real streams');
const convStream = [
    ...populations['P1 DailyDialog (human, casual)'].turns,
    ...populations['P2 hh-rlhf assistant (AI, conversational)'].turns,
    ...populations['P3 UltraChat assistant (AI, long-form)'].turns
];
const loops = {
    'R-CONV':    runLoop('P1+P2+P3 in corpus order', convStream),
    'R-RUNBOOK': runLoop('P4 in corpus order', populations['P4 LLM runbooks (committed, v3.34.0)'].turns),
    'R-PLAN':    runLoop('P5 in corpus order', populations['P5 LLM rollout plans (committed, v3.35.0)'].turns)
};
for (const [k, l] of Object.entries(loops)) {
    console.log(`  ${k} (${l.stream}): ledger ${l.ledgerEntries} entries, label "${l.label}"`);
    console.log(`    reached: ${JSON.stringify(l.reached)}`);
    for (const p of l.patterns)
        console.log(`    ${p.pattern}: win ${p.winRate} avgConf ${p.avgConfidence} n=${p.samples} → ${p.calibration}`);
}

const probeStates = { ...CORNER_STATES };
for (const [k, l] of Object.entries(loops)) probeStates[k] = l.reached;

// ── Evaluate every probed state on every population ──
console.log('═'.repeat(63));
console.log('Probed states across populations');
const stateEvals = {}; // stateName -> popName -> evaluation
for (const [sName, state] of Object.entries(probeStates)) {
    stateEvals[sName] = {};
    const empty = Object.keys(state).length === 0;
    for (const [pName, p] of Object.entries(populations)) {
        // An empty reached state is the factory instrument (byte-identity
        // test-pinned); reuse the factory pass rather than recomputing.
        stateEvals[sName][pName] = empty ? factory[pName] : evaluate(p.turns, state);
    }
    results.states[sName] = { multipliers: state,
        note: empty ? 'reached state is empty — identical to FACTORY by the pinned byte-identity' : undefined };
}

// ── A1: specificity across the envelope (GATED) ──
let a1fail = false;
for (const [sName] of Object.entries(probeStates)) {
    for (const [pName, p] of Object.entries(populations)) {
        if (!p.gatedA1) continue;
        const e = stateEvals[sName][pName];
        const pass = e.soundRate < 0.02;
        if (!pass) a1fail = true;
        results.a1[`${sName} / ${pName}`] = { sound: e.sound, n: e.n,
            rate: pct(e.soundRate), gate: pass ? 'PASS-specific' : 'FAIL-baserate' };
    }
}
console.log('═'.repeat(63));
console.log(`A1 — flagship specificity across the probed envelope: ${a1fail ? 'FAIL' : 'PASS'}`);
for (const [k, v] of Object.entries(results.a1))
    console.log(`  ${k}: ${v.sound}/${v.n} (${v.rate}) ${v.gate}`);

// ── A2: minted set at C-MINT, shuffle-structure (GATED, power clause) ──
const convPops = ['P1 DailyDialog (human, casual)', 'P2 hh-rlhf assistant (AI, conversational)',
                  'P3 UltraChat assistant (AI, long-form)'];
const minted = [];
for (const pName of convPops) {
    const f = factory[pName].verdicts, m = stateEvals['C-MINT'][pName].verdicts;
    populations[pName].turns.forEach((text, i) => {
        if (OPERATIONAL_FAMILY.includes(m[i]) && !OPERATIONAL_FAMILY.includes(f[i]))
            minted.push({ pop: pName, text, mintedAs: m[i], factory: f[i] });
    });
}
// Shuffle control under the minting state itself: the question is whether
// the verdict C-MINT hands out survives destruction of word order in the
// same calibration regime that granted it.
const a2 = { mintedCount: minted.length, trials: 0, retained: 0, perText: [] };
minted.forEach((p, pi) => {
    let r = 0;
    for (let s = 0; s < SHUFFLES_PER_TEXT; s++) {
        const rand = mulberry32(SEED + pi * 1000 + s);
        const v = core.analyzeCathedral(wordShuffle(p.text, rand),
            { patternCalibration: CORNER_STATES['C-MINT'] }).verdict.status;
        a2.trials++;
        if (OPERATIONAL_FAMILY.includes(v)) { a2.retained++; r++; }
    }
    a2.perText.push({ pop: p.pop, mintedAs: p.mintedAs, factory: p.factory,
        retainedOf20: r, text: p.text.slice(0, 100) });
});
a2.retentionRate = a2.trials ? pct(a2.retained / a2.trials) : 'n/a';
a2.gate = minted.length >= 20
    ? ((a2.retained / a2.trials) < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary')
    : `UNDERPOWERED (n=${minted.length} < 20) — reported raw`;
results.a2 = a2;
console.log('═'.repeat(63));
console.log(`A2 — minted at C-MINT: ${a2.mintedCount} texts, retention ${a2.retentionRate} → ${a2.gate}`);
for (const t of a2.perText)
    console.log(`  [${t.factory} → ${t.mintedAs}] ${t.retainedOf20}/20 — "${t.text.slice(0, 70)}..."`);

// ── A3: envelope width on the certified LLM registers (reported) ──
console.log('═'.repeat(63));
console.log('A3 — envelope width on the certified registers (reported, not gated)');
for (const pName of ['P4 LLM runbooks (committed, v3.34.0)', 'P5 LLM rollout plans (committed, v3.35.0)']) {
    const rates = { FACTORY: pct(factory[pName].familyRate) };
    let lo = factory[pName].familyRate, hi = factory[pName].familyRate;
    for (const sName of Object.keys(probeStates)) {
        const r = stateEvals[sName][pName].familyRate;
        rates[sName] = pct(r);
        if (r < lo) lo = r;
        if (r > hi) hi = r;
    }
    results.a3[pName] = { familyRates: rates, envelopeWidth: pct(hi - lo) };
    console.log(`  ${pName}: ${JSON.stringify(rates)} width ${results.a3[pName].envelopeWidth}`);
}

// ── A4: curated flip census (reported) ──
console.log('═'.repeat(63));
console.log(`A4 — curated flip census (${curated.length} SOUND texts)`);
const curatedFactory = curated.map(t => core.analyzeCathedral(t).verdict.status);
for (const [sName, state] of Object.entries(probeStates)) {
    if (Object.keys(state).length === 0) {
        results.a4[sName] = { flips: 0, note: 'state identical to FACTORY' };
        continue;
    }
    const flips = [];
    curated.forEach((t, i) => {
        const v = core.analyzeCathedral(t, { patternCalibration: state }).verdict.status;
        if (v !== curatedFactory[i]) flips.push({ from: curatedFactory[i], to: v, text: t.slice(0, 80) });
    });
    results.a4[sName] = { flips: flips.length, of: curated.length, list: flips };
    console.log(`  ${sName}: ${flips.length}/${curated.length} flips`);
    for (const f of flips) console.log(`    ${f.from} → ${f.to} — "${f.text.slice(0, 60)}..."`);
}

// ── B1: reached-state report + whole-population deltas vs factory ──
console.log('═'.repeat(63));
console.log('B1 — reachability and deltas');
const loopPops = {
    'R-CONV': convPops,
    'R-RUNBOOK': ['P4 LLM runbooks (committed, v3.34.0)'],
    'R-PLAN': ['P5 LLM rollout plans (committed, v3.35.0)']
};
for (const [k, l] of Object.entries(loops)) {
    const deltas = [];
    for (const pName of loopPops[k]) {
        const f = factory[pName].verdicts, r = stateEvals[k][pName].verdicts;
        let changed = 0;
        const examples = [];
        f.forEach((v, i) => {
            if (r[i] !== v) {
                changed++;
                if (examples.length < 5)
                    examples.push({ from: v, to: r[i], text: populations[pName].turns[i].slice(0, 80) });
            }
        });
        deltas.push({ population: pName, changed, of: f.length, examples });
    }
    results.b1[k] = { ...l, deltas };
    console.log(`  ${k}: reached ${JSON.stringify(l.reached)} — deltas: ` +
        deltas.map(d => `${d.changed}/${d.of}`).join(', '));
}

// ── Write results ──
fs.writeFileSync(path.join(__dirname, 'results-autonomy-envelope.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-autonomy-envelope.json');

const a2hardFail = a2.gate === 'FAIL-vocabulary';
process.exit(a1fail || a2hardFail ? 1 : 0);

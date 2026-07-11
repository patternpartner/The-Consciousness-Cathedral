#!/usr/bin/env node
// External validation of the core evaluator's verdicts against real text —
// the README's long-standing "honest next step". The curated suite proves
// intended behavior on authored cases; this run asks what the verdict
// tiers do on text nobody wrote for them.
//
// Populations (fetch-corpora.sh; raw data stays out of git):
//   DailyDialog human turns      — casual human conversation
//   hh-rlhf assistant turns      — conversational AI
//   UltraChat assistant turns    — long-form informative AI answers
//
// Pre-stated gates:
//
//   G1 — TOP-VERDICT SPECIFICITY. "OPERATIONALLY SOUND" is the flagship
//   verdict; if ordinary conversation earns it, it is base-rate furniture.
//   Gate: OPERATIONALLY SOUND on < 2% of turns in each conversational
//   population (DailyDialog, hh-rlhf). UltraChat is long-form instructional
//   text where operational verdicts legitimately occur — reported, not gated.
//
//   G2 — STRUCTURE, NOT VOCABULARY. For turns that earn an
//   operational-family verdict (OPERATIONALLY SOUND or OPERATIONAL INTENT),
//   build controls with the SAME words in deterministic-random order
//   (20 seeded shuffles per text) — vocabulary fully preserved, bindings
//   destroyed. Gate: < 20% of shuffle trials retain an operational-family
//   verdict. Minimum-evidence clause (the lesson from the typed-slot
//   campaign's Poisson-fragile counts): the external gate applies only if
//   the populations yield ≥ 20 operational-family positives; below that
//   the external result is reported raw as UNDERPOWERED and the decision
//   is carried by the CURATED control — the repo's own OPERATIONALLY SOUND
//   texts (test suite + demo sample), clearly labelled as authored.
//
//   R1 — SENTENCE-ORDER SENSITIVITY (reported, not gated). Same positives,
//   sentences shuffled, words within sentences intact. Cathedral's
//   extraction is largely sentence-local, so high retention here is a
//   design property to document, not a failure: bindings that live inside
//   one sentence legitimately survive sentence reordering.
//
//   R2 — GAMING SPECIFICITY (reported). Share of ordinary turns the
//   GamingDetector calls AUTHENTIC/FORMAL_STYLE vs flags — extends the
//   external eval's N=40 "zero benign false positives" to N≈4,000.
//
// Reproduce: bash fetch-corpora.sh, then node core-verdict-validation.js.
// Results: results-core-verdict-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const DATA = path.join(__dirname, 'data');
const OPERATIONAL_FAMILY = ['OPERATIONALLY SOUND', 'OPERATIONAL INTENT'];

// Deterministic PRNG so the run is reproducible byte-for-byte
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
function sentenceShuffle(text, rand) {
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
    return seededShuffle(sentences, rand).join(' ');
}

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

function runPopulation(name, turns, gated) {
    const dist = {};
    const gaming = { flagged: 0, benign: 0 };
    const positives = [];
    for (const text of turns) {
        const a = core.analyzeCathedral(text);
        const s = a.verdict.status;
        dist[s] = (dist[s] || 0) + 1;
        const g = a.gamingDetection.assessment;
        if (['LIKELY_GAMING', 'POSSIBLE_GAMING', 'LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'].includes(g)) gaming.flagged++;
        else gaming.benign++;
        if (OPERATIONAL_FAMILY.includes(s)) positives.push({ text, status: s });
    }
    const soundRate = (dist['OPERATIONALLY SOUND'] || 0) / turns.length;
    return {
        population: name, turns: turns.length,
        verdictDistribution: dist,
        operationallySoundRate: (soundRate * 100).toFixed(2) + '%',
        g1: gated ? (soundRate < 0.02 ? 'PASS-specific' : 'FAIL-baserate') : 'reported (not gated)',
        gamingFlaggedRate: (gaming.flagged / turns.length * 100).toFixed(2) + '%',
        positives
    };
}

const SHUFFLES_PER_TEXT = 20;

function shuffleTrials(positives, label) {
    const out = { source: label, positives: positives.length,
                  wordShuffle: { trials: 0, retained: 0, perText: [] },
                  sentenceShuffle: { trials: 0, retained: 0 } };
    positives.forEach((p, pi) => {
        let wRetained = 0;
        for (let s = 0; s < SHUFFLES_PER_TEXT; s++) {
            const rand = mulberry32(20260711 + pi * 1000 + s);
            const wv = core.analyzeCathedral(wordShuffle(p.text, rand)).verdict.status;
            out.wordShuffle.trials++;
            if (OPERATIONAL_FAMILY.includes(wv)) { out.wordShuffle.retained++; wRetained++; }
            const sv = core.analyzeCathedral(sentenceShuffle(p.text, rand)).verdict.status;
            out.sentenceShuffle.trials++;
            if (OPERATIONAL_FAMILY.includes(sv)) out.sentenceShuffle.retained++;
        }
        out.wordShuffle.perText.push({
            original: p.status, retainedOf20: wRetained, text: p.text.slice(0, 100)
        });
    });
    const wr = out.wordShuffle.trials ? out.wordShuffle.retained / out.wordShuffle.trials : 0;
    const sr = out.sentenceShuffle.trials ? out.sentenceShuffle.retained / out.sentenceShuffle.trials : 0;
    out.wordShuffle.retentionRate = (wr * 100).toFixed(1) + '%';
    out.wordShuffle.rate = wr;
    out.sentenceShuffle.retentionRate = (sr * 100).toFixed(1) + '%';
    return out;
}

// The repo's own OPERATIONALLY SOUND texts: every curated test case that
// scores SOUND today, plus the demo/README sample. Authored, so this is a
// labelled curated control, not external evidence.
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
    return texts.map(text => ({ text, status: 'OPERATIONALLY SOUND' }));
}

function runControls(externalPositives) {
    const external = shuffleTrials(externalPositives, 'external');
    const curated = shuffleTrials(curatedSoundTexts(), 'curated (authored)');
    const externalGateable = externalPositives.length >= 20;
    external.wordShuffle.g2 = externalGateable ?
        (external.wordShuffle.rate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary') :
        'UNDERPOWERED (n=' + externalPositives.length + ' < 20) — reported raw; decision carried by curated control';
    curated.wordShuffle.g2 = curated.wordShuffle.rate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary';
    external.sentenceShuffle.note = curated.sentenceShuffle.note =
        'reported, not gated — sentence-local bindings legitimately survive reordering';
    return { external, curated, externalGateable };
}

const results = { generated: '2026-07-11', seed: 20260711, populations: [], controls: null };
const allPositives = [];
for (const [name, turns, gated] of [
    ['DailyDialog (human, casual)', dailyDialogTurns(), true],
    ['hh-rlhf assistant (AI, conversational)', hhAssistantTurns(), true],
    ['UltraChat assistant (AI, long-form)', ultrachatAssistantTurns(), false]
]) {
    const r = runPopulation(name, turns, gated);
    allPositives.push(...r.positives);
    delete r.positives;
    results.populations.push(r);
    console.log('═'.repeat(63));
    console.log(`${name} — ${r.turns} turns`);
    console.log(`  OPERATIONALLY SOUND: ${r.operationallySoundRate} → G1 ${r.g1}`);
    console.log(`  gaming flagged: ${r.gamingFlaggedRate}`);
    console.log(`  verdicts:`, JSON.stringify(r.verdictDistribution));
}

results.controls = runControls(allPositives);
console.log('═'.repeat(63));
for (const c of [results.controls.external, results.controls.curated]) {
    console.log(`CONTROLS [${c.source}] — ${c.positives} positives × ${SHUFFLES_PER_TEXT} seeded shuffles`);
    console.log(`  word shuffle retention: ${c.wordShuffle.retentionRate} → G2 ${c.wordShuffle.g2}`);
    console.log(`  sentence shuffle retention: ${c.sentenceShuffle.retentionRate}`);
    for (const t of c.wordShuffle.perText)
        console.log(`    ${t.original}: ${t.retainedOf20}/20 retained — "${t.text.slice(0, 70)}..."`);
}

fs.writeFileSync(path.join(__dirname, 'results-core-verdict-validation.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-core-verdict-validation.json');

const fail = results.populations.some(p => p.g1 === 'FAIL-baserate') ||
             results.controls.curated.wordShuffle.g2 === 'FAIL-vocabulary' ||
             (results.controls.externalGateable &&
              results.controls.external.wordShuffle.g2 === 'FAIL-vocabulary');
process.exit(fail ? 1 : 0);

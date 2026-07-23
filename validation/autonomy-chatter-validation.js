#!/usr/bin/env node
// THE LEDGER-CHATTER FIX — sample-interval hysteresis, measured against gates
// committed before implementation (docs/AUTONOMY-CHATTER-PREREG.md). The loop
// wrote a ledger entry on every document early in a stream (KEP: 13
// consecutive gap-2 entries); this fix requires HYSTERESIS_INTERVAL fresh
// samples for a pattern between commits. Interval = MIN_SAMPLES = 5, a priori,
// NOT tuned to these development corpora.
//
// The evaluator (cathedral-core.js) and loop (progression.js) are imported as
// shipped. This harness replays the shipped loop over both committed streams
// and checks the pre-registered gates. Deterministic.
//
//   H1-VERDICT-PRESERVATION (strict) -- 0 verdicts change vs factory on both
//                                       streams (baselines: both 0).
//   H2-CONTRACT (strict)             -- factory inertness byte-exact here;
//                                       full 9-case suite via `npm test`.
//   H3-FIXED-POINT (strict)          -- act() after final observation = no-op.
//   H4-CHATTER (strict + reported)   -- construction: no same-pattern entries
//                                       within INTERVAL samples, count <=
//                                       baseline; magnitude reported.
//   H5-PATH (reported)               -- fwd vs rev endpoint; concern > 0.05.
//
// Baselines cited from the committed prior runs:
//   autonomy (v3.40.0): 11 ledger entries, 0 verdict changes, path Δ 0.002
//   KEP      (v3.41.0): 46 ledger entries, 0 verdict changes, path Δ 0.000
//
// Reproduce: node autonomy-chatter-validation.js
// Results: results-autonomy-chatter-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');
const prog = require('../progression.js');
const { ProgressionMemory } = prog;
const INTERVAL = prog.HYSTERESIS_INTERVAL;

const BASELINE = { autonomy: 11, kep: 46 };
const OPERATIONAL_FAMILY = ['OPERATIONALLY SOUND', 'OPERATIONAL INTENT'];
const MIN_PROSE = 500;
const CLAMP_LO = 0.8, CLAMP_HI = 1.2;

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
function stripFrontmatter(md) {
    return md.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}
function loadJsonCorpus(file, textOf) {
    const p = path.join(__dirname, file);
    if (!fs.existsSync(p)) { console.error('Missing committed corpus: ' + file); process.exit(2); }
    return JSON.parse(fs.readFileSync(p, 'utf8')).documents
        .map(d => stripMarkdown(d.text || ''))
        .filter(t => t.length >= MIN_PROSE);
}
function loadRepoCorpus(dir, prefix, fetchHint) {
    const d = path.join(__dirname, 'data', dir);
    if (!fs.existsSync(d)) { console.error('No corpus at ' + d + '. Run: bash ' + fetchHint); process.exit(2); }
    const re = new RegExp('^' + prefix + '_\\d+\\.json$');
    return fs.readdirSync(d).filter(f => re.test(f)).sort()
        .map(f => JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')))
        .map(rec => stripMarkdown(stripFrontmatter(rec.markdown || '')))
        .filter(t => t.length >= MIN_PROSE);
}

const streams = {
    autonomy: [
        ...loadJsonCorpus('corpus-llm-runbooks.json'),
        ...loadJsonCorpus('corpus-llm-plans.json')
    ],
    kep: loadRepoCorpus('kep-corpus', 'kep', 'fetch-kep-corpus.sh')
};

// --- replay the shipped loop; record entries with the pattern's sample count -
function replay(docs, order) {
    const m = new ProgressionMemory();
    let clampViolations = 0;
    const entries = [];
    const verdicts = [];
    for (const i of order) {
        const active = m.active();
        const opts = Object.keys(active).length
            ? { patternCalibration: active, calibrationLabel: m.label() } : undefined;
        const a = opts ? core.analyzeCathedral(docs[i], opts) : core.analyzeCathedral(docs[i]);
        verdicts[i] = a.verdict.status;
        m.observe(a);
        const acted = m.act();
        for (const v of Object.values(m.active()))
            if (v < CLAMP_LO || v > CLAMP_HI) clampViolations++;
        for (const e of acted.changed)
            entries.push({ n: e.n, param: e.param,
                samples: (m.data.patterns[e.param] || {}).totalProposals });
    }
    const fixedPoint = m.act().changed.length === 0;
    return { m, entries, verdicts, clampViolations, fixedPoint };
}

const factoryVerdict = {};
const results = { generated: '2026-07-23', interval: INTERVAL, baselines: BASELINE, streams: {} };
let h1Pass = true, h3Pass = true, h4Pass = true;
let h5MaxDelta = 0;

for (const [name, docs] of Object.entries(streams)) {
    const order = docs.map((_, i) => i);
    factoryVerdict[name] = docs.map(t => core.analyzeCathedral(t).verdict.status);
    const fwd = replay(docs, order);
    const rev = replay(docs, order.slice().reverse());

    // H1: verdict preservation vs factory
    const changed = docs.map((_, i) => fwd.verdicts[i] !== factoryVerdict[name][i]).filter(Boolean).length;

    // H4 construction: no same-pattern entries within INTERVAL samples; count <= baseline
    const perParam = {};
    for (const e of fwd.entries) (perParam[e.param] = perParam[e.param] || []).push(e.samples);
    let subIntervalPairs = 0;
    for (const arr of Object.values(perParam))
        for (let k = 1; k < arr.length; k++) if (arr[k] - arr[k - 1] < INTERVAL) subIntervalPairs++;
    const entryCount = fwd.entries.length;
    const countOk = entryCount <= BASELINE[name];

    // H5: forward vs reverse endpoint
    const fa = fwd.m.active(), ra = rev.m.active();
    const names = new Set([...Object.keys(fa), ...Object.keys(ra)]);
    let maxDelta = 0;
    for (const p of names) maxDelta = Math.max(maxDelta, Math.abs((fa[p] || 1) - (ra[p] || 1)));
    h5MaxDelta = Math.max(h5MaxDelta, maxDelta);

    const streamPass = changed === 0 && fwd.fixedPoint && subIntervalPairs === 0 && countOk && fwd.clampViolations === 0;
    if (changed !== 0) h1Pass = false;
    if (!fwd.fixedPoint) h3Pass = false;
    if (subIntervalPairs !== 0 || !countOk) h4Pass = false;

    results.streams[name] = {
        documents: docs.length,
        verdictChangesVsFactory: changed,
        fixedPointAfterFinal: fwd.fixedPoint,
        clampViolations: fwd.clampViolations,
        ledgerEntries: entryCount,
        baselineEntries: BASELINE[name],
        reduction: ((1 - entryCount / BASELINE[name]) * 100).toFixed(1) + '%',
        subIntervalPairs,
        endpointForward: fa,
        endpointReverse: ra,
        pathMaxDelta: Math.round(maxDelta * 1000) / 1000,
        streamPass
    };
}

// H2 (factory inertness, byte-exact) — the full 9-case suite is npm test
const SOUND = 'If error rate exceeds 5%, we abort deployment and roll back within ten minutes.\n' +
  'We have three failure modes: cache overflow, API timeout, edge case bugs.\n' +
  'For each, we monitor a dashboard metric and a rollback runbook exists.\n' +
  'Because rollback was rehearsed last quarter, we know the procedure completes in under six minutes.';
const inert = JSON.stringify(core.analyzeCathedral(SOUND)) === JSON.stringify(core.analyzeCathedral(SOUND, {}))
    && JSON.stringify(core.analyzeCathedral(SOUND)) === JSON.stringify(core.analyzeCathedral(SOUND, { patternCalibration: {} }));

results.h1VerdictPreservation = { pass: h1Pass };
results.h2FactoryInertnessByteExact = { pass: inert, note: 'full 9-case contract suite via npm test' };
results.h3FixedPoint = { pass: h3Pass };
results.h4Chatter = { pass: h4Pass };
results.h5Path = { maxDelta: Math.round(h5MaxDelta * 1000) / 1000, concernThreshold: 0.05,
    concern: h5MaxDelta > 0.05 };

const line = '═'.repeat(63);
console.log(line);
console.log(`THE LEDGER-CHATTER FIX — sample-interval hysteresis (interval ${INTERVAL})`);
console.log(line);
for (const [name, s] of Object.entries(results.streams)) {
    console.log(`${name}: ${s.documents} docs`);
    console.log(`  verdict changes vs factory: ${s.verdictChangesVsFactory}  fixed point: ${s.fixedPointAfterFinal}  clamp: ${s.clampViolations}`);
    console.log(`  ledger entries: ${s.baselineEntries} → ${s.ledgerEntries}  (reduction ${s.reduction})  sub-interval pairs: ${s.subIntervalPairs}`);
    console.log(`  endpoint fwd ${JSON.stringify(s.endpointForward)} vs rev ${JSON.stringify(s.endpointReverse)}  Δ ${s.pathMaxDelta}`);
}
console.log(line);
console.log(`H1-VERDICT-PRESERVATION: ${h1Pass ? 'PASS' : 'FAIL'}`);
console.log(`H2-CONTRACT (factory inertness byte-exact): ${inert ? 'PASS' : 'FAIL'}  (+ npm test for the 9-case suite)`);
console.log(`H3-FIXED-POINT: ${h3Pass ? 'PASS' : 'FAIL'}`);
console.log(`H4-CHATTER (construction + count ≤ baseline): ${h4Pass ? 'PASS' : 'FAIL'}`);
console.log(`H5-PATH (reported): max Δ ${results.h5Path.maxDelta} vs concern ${results.h5Path.concernThreshold} → ${results.h5Path.concern ? 'FLAG' : 'within bound'}`);
console.log(line);

fs.writeFileSync(path.join(__dirname, 'results-autonomy-chatter-validation.json'),
    JSON.stringify(results, null, 2));
console.log('wrote results-autonomy-chatter-validation.json');

const strictPass = h1Pass && inert && h3Pass && h4Pass;
console.log(strictPass ? 'STRICT GATES PASS' : 'STRICT GATE FAILED — revert rule applies');
process.exit(strictPass ? 0 : 1);

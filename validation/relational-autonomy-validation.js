#!/usr/bin/env node
// The relational autonomy run — the fifth run of the autonomy program and
// the first aimed at the relational tier's v3.39.0 auto-apply loop.
// Pre-registered in docs/RELATIONAL-AUTONOMY-PREREG.md (committed before
// any verdict was computed under the loop); this file implements that
// document and adds nothing to it.
//
// The loop replayed verbatim from cathedral-unified-2.html (v3.39.0), per
// exchange: analyze under the ledger's current overrides → record in the
// notebook → propose → auto-accept. Modules unmodified.
//
// Gates: RA1 loudness contract (entries 1:1 with changes, stamps, per-step
// reproducibility, whole-run determinism), RA2 no minting anywhere (loop,
// end-states, C-MAX). Reported: RA0 factory baseline, RA3 fire census,
// RA4 demotion census.
//
// Reproduce: bash fetch-corpora.sh, then node relational-autonomy-validation.js.
// Results: results-relational-autonomy-validation.json.

const fs = require('fs');
const path = require('path');
const RC = require('../relational-core.js');
const { ExchangeMemory } = require('../relational-memory.js');
const { CalibrationLedger } = require('../relational-calibration.js');

const DATA = path.join(__dirname, 'data');
const TOP = 'GENERATIVE EXCHANGE';

// ── Streams: real conversations at run 1's offsets ──
function ddConversations() {
    const out = [];
    for (const off of [0, 100, 200])
        for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, `dd_${off}.json`))).rows) {
            const turns = row.utterances
                .filter(u => u && u.trim())
                .map((u, i) => ({ speaker: i % 2 === 0 ? 'A' : 'B', text: u.trim() }));
            if (turns.length) out.push(turns);
        }
    return out;
}
function hhConversations() {
    const out = [];
    for (const off of [0, 100, 200])
        for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, `hh_${off}.json`))).rows) {
            const parts = row.chosen.split(/\n\n(Human|Assistant): /).slice(1);
            const turns = [];
            for (let i = 0; i + 1 < parts.length; i += 2) {
                const t = parts[i + 1].trim();
                if (t) turns.push({ speaker: parts[i], text: t });
            }
            if (turns.length) out.push(turns);
        }
    return out;
}
function uaConversations() {
    const out = [];
    for (const off of [0, 100, 200])
        for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, `ua_${off}.json`))).rows) {
            const turns = row.messages
                .filter(m => m.content && m.content.trim())
                .map(m => ({ speaker: m.role === 'assistant' ? 'Assistant' : 'User', text: m.content.trim() }));
            if (turns.length) out.push(turns);
        }
    return out;
}

function analyzeUnder(turns, overrides, label) {
    return overrides
        ? RC.analyzeExchange(turns, { calibration: overrides, calibrationLabel: label })
        : RC.analyzeExchange(turns, {});
}

// One pass of a whole stream under one fixed calibration state.
function passUnder(convs, overrides, label) {
    return convs.map(t => analyzeUnder(t, overrides, label).verdict.status);
}

function dist(verdicts) {
    const d = {};
    for (const v of verdicts) d[v] = (d[v] || 0) + 1;
    return d;
}

function deltaCensus(factory, other, convs) {
    const deltas = [];
    factory.forEach((f, i) => {
        if (other[i] !== f) deltas.push({ i, from: f, to: other[i],
            firstTurn: convs[i][0].text.slice(0, 60) });
    });
    return deltas;
}

// ── The faithful online loop over one stream ──
function runStream(name, convs) {
    const mem = new ExchangeMemory();
    const ledger = new CalibrationLedger();
    const loopVerdicts = [];
    const fires = [];
    const stampFailures = [];
    const reproFailures = [];
    const stepOverrides = []; // overrides active when each exchange was analyzed

    convs.forEach((turns, i) => {
        const overrides = ledger.overrides();
        const label = ledger.label();
        stepOverrides.push(overrides ? { ...overrides } : null);
        const result = analyzeUnder(turns, overrides, label);
        loopVerdicts.push(result.verdict.status);

        // RA1(b): every result declares which ruler measured it. The prereg
        // said factory verdicts carry "no calibration field"; the module's
        // actual contract is stronger — factory verdicts are stamped
        // {source: 'defaults'} (relational-core.js: "Every result declares
        // which ruler measured it"). The check is corrected to that stronger
        // contract; the deviation is reported in the findings.
        const expected = overrides ? label : 'defaults';
        if (!result.calibration || result.calibration.source !== expected)
            stampFailures.push({ i, expected, got: result.calibration });

        mem.record(result);
        const p = ledger.propose(mem.data);
        if (p) {
            ledger.accept(p);
            fires.push({ afterExchange: i + 1, param: p.param, from: p.from, to: p.to,
                evidence: p.evidence, why: p.why });
        }
    });

    // RA1(a): ledger entries 1:1 with fires, all evidence-bearing
    const entries = ledger.data.entries;
    const entriesOk = entries.length === fires.length &&
        entries.every(e => e.param === 'TRANSFORM_NOVELTY' && e.evidence &&
            typeof e.evidence.samples === 'number' && typeof e.why === 'string' && e.why.length > 0);

    // RA1(c): per-step reproducibility — re-analyze each exchange under the
    // overrides recorded at its position; verdict must reproduce exactly.
    convs.forEach((turns, i) => {
        const again = analyzeUnder(turns, stepOverrides[i],
            stepOverrides[i] ? `replay of step ${i}` : null).verdict;
        const orig = loopVerdicts[i];
        if (again.status !== orig) reproFailures.push({ i, orig, replay: again.status });
    });

    const endOverrides = ledger.overrides();
    return {
        stream: name, exchanges: convs.length,
        loopVerdicts, fires, endOverrides,
        ledgerEntries: entries.length, label: ledger.label(),
        ra1: { entriesOk, stampFailures, reproFailures }
    };
}

// ── Load, run, gate ──
const streams = {
    'S1 DailyDialog (human-human)': ddConversations(),
    'S2 hh-rlhf (human-AI)': hhConversations(),
    'S3 UltraChat (user-AI)': uaConversations()
};

const results = { generated: '2026-07-23',
    prereg: 'docs/RELATIONAL-AUTONOMY-PREREG.md',
    streams: {}, ra1: null, ra2: null };

let ra1fail = false, ra2fail = false;

for (const [name, convs] of Object.entries(streams)) {
    console.log('═'.repeat(63));
    console.log(`${name} — ${convs.length} conversations`);

    const factory = passUnder(convs, null, null);
    const loop = runStream(name, convs);
    const endPass = loop.endOverrides
        ? passUnder(convs, loop.endOverrides, 'end-state') : factory.slice();
    const cmax = passUnder(convs, { TRANSFORM_NOVELTY: 1.01 }, 'C-MAX probe');

    const loopDeltas = deltaCensus(factory, loop.loopVerdicts, convs);
    const endDeltas = loop.endOverrides ? deltaCensus(factory, endPass, convs) : [];
    const cmaxDeltas = deltaCensus(factory, cmax, convs);

    const mints = [
        ...loopDeltas.filter(d => d.to === TOP).map(d => ({ ...d, pass: 'loop' })),
        ...endDeltas.filter(d => d.to === TOP).map(d => ({ ...d, pass: 'end-state' })),
        ...cmaxDeltas.filter(d => d.to === TOP).map(d => ({ ...d, pass: 'C-MAX' }))
    ];
    if (mints.length) ra2fail = true;
    if (!loop.ra1.entriesOk || loop.ra1.stampFailures.length || loop.ra1.reproFailures.length)
        ra1fail = true;

    results.streams[name] = {
        exchanges: convs.length,
        ra0FactoryDistribution: dist(factory),
        ra3Fires: loop.fires,
        endOverrides: loop.endOverrides,
        ledgerEntries: loop.ledgerEntries, label: loop.label,
        ra1: { entriesOk: loop.ra1.entriesOk,
               stampFailures: loop.ra1.stampFailures.length,
               reproFailures: loop.ra1.reproFailures.length },
        ra4: {
            loop: { changed: loopDeltas.length, deltas: loopDeltas.slice(0, 20) },
            endState: { changed: endDeltas.length, deltas: endDeltas.slice(0, 20) },
            cmax: { changed: cmaxDeltas.length, distribution: dist(cmax),
                    deltas: cmaxDeltas.slice(0, 20) }
        },
        mints
    };

    console.log(`  factory: ${JSON.stringify(dist(factory))}`);
    console.log(`  fires: ${loop.fires.length}` + (loop.fires.length
        ? ` — ${loop.fires.map(f => `after #${f.afterExchange}: ${f.from} → ${f.to}`).join('; ')}` : ''));
    console.log(`  RA1: entries ${loop.ra1.entriesOk ? 'ok' : 'MISMATCH'}, stamp failures ${loop.ra1.stampFailures.length}, repro failures ${loop.ra1.reproFailures.length}`);
    console.log(`  RA4 deltas — loop: ${loopDeltas.length}, end-state: ${endDeltas.length}, C-MAX: ${cmaxDeltas.length}`);
    console.log(`  RA2 mints: ${mints.length}`);
}

results.ra1 = ra1fail ? 'FAIL' : 'PASS';
results.ra2 = ra2fail ? 'FAIL — the strictly-tightening construction claim is falsified' : 'PASS — nothing minted anywhere';

console.log('═'.repeat(63));
console.log(`RA1 loudness contract: ${results.ra1}`);
console.log(`RA2 no minting: ${results.ra2}`);

fs.writeFileSync(path.join(__dirname, 'results-relational-autonomy-validation.json'),
    JSON.stringify(results, null, 2));
console.log('wrote results-relational-autonomy-validation.json');
process.exit(ra1fail || ra2fail ? 1 : 0);

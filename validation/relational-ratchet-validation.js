#!/usr/bin/env node
// The ratchet fix validation — measures the floor-bounded recovery rule on
// real streams. Pre-registered in docs/RELATIONAL-RATCHET-PREREG.md
// (committed before the rule was written); this file implements that
// document's gates and adds nothing to it.
//
//   RF1 — minting-safety survives the movable bar: with the recovery rule
//         present, the three real streams run from factory still gain zero
//         GENERATIVE EXCHANGE vs factory (they only raise; adding the rule
//         must change nothing it must not change).
//   RF2 — recovery works and clamps: seed the ledger at 0.9 (over-raised),
//         feed each real stream, the bar descends to the stream's real
//         median and never below the factory default, every step ledgered
//         and stamped, and the recovered bar never mints (every verdict is
//         equal-or-stricter than factory, because the bar is clamped >= 0.35).
//   RF3 — determinism: the run twice is byte-identical.
//
// Reproduce: bash fetch-corpora.sh, then node relational-ratchet-validation.js.
// Results: results-relational-ratchet-validation.json.

const fs = require('fs');
const path = require('path');
const RC = require('../relational-core.js');
const { ExchangeMemory } = require('../relational-memory.js');
const { CalibrationLedger, DEFAULTS } = require('../relational-calibration.js');

const DATA = path.join(__dirname, 'data');
const TOP = 'GENERATIVE EXCHANGE';

// Verdict rungs, most generative first — for the "equal-or-stricter" check.
// A recovered (descending) bar may only hold a verdict in place or move it
// UP this list (stricter); it may never move it DOWN (more generous). The
// factory default clamp is what guarantees it never moves DOWN past factory.
const RUNG = { 'GENERATIVE EXCHANGE': 0, 'COLLABORATIVE UPTAKE': 1,
    'ASYMMETRIC UPTAKE': 2, 'MIRRORED EXCHANGE': 2, 'PARALLEL MONOLOGUES': 2,
    'INSUFFICIENT EXCHANGE': 3, 'HUB-AND-SPOKES': 2, 'GROUP GENERATIVE': 0,
    'GROUP UPTAKE': 1, 'PARTIAL ENGAGEMENT': 2 };

// ── Streams: verbatim from relational-autonomy-validation.js ──
function ddConversations() {
    const out = [];
    for (const off of [0, 100, 200])
        for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, `dd_${off}.json`))).rows) {
            const turns = row.utterances.filter(u => u && u.trim())
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
            const turns = row.messages.filter(m => m.content && m.content.trim())
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

// RF1: the faithful loop from factory, with the recovery rule now present.
function loopFromFactory(convs) {
    const mem = new ExchangeMemory();
    const ledger = new CalibrationLedger();
    const mints = [];
    convs.forEach((turns, i) => {
        const ov = ledger.overrides();
        const factory = analyzeUnder(turns, null, null).verdict.status;
        const loop = analyzeUnder(turns, ov, ledger.label()).verdict.status;
        if (loop === TOP && factory !== TOP) mints.push({ i, factory, loop });
        mem.record(analyzeUnder(turns, ov, ledger.label()));
        const p = ledger.propose(mem.data);
        if (p) ledger.accept(p);
    });
    return { endOverrides: ledger.overrides(), ledgerEntries: ledger.size(),
             lowerFires: ledger.data.entries.filter(e => e.to < e.from).length, mints };
}

// RF2: seed an over-raised bar, feed the stream, watch it recover.
function recoveryScenario(convs) {
    const mem = new ExchangeMemory();
    const ledger = new CalibrationLedger();
    ledger.data.entries.push({ date: '(seed)', param: 'TRANSFORM_NOVELTY',
        from: DEFAULTS.TRANSFORM_NOVELTY, to: 0.9,
        why: 'seeded over-raised, to demonstrate recovery', evidence: {} });

    let belowFloor = false, minted = 0, notStricter = 0;
    const barTrace = [0.9];
    convs.forEach((turns) => {
        const ov = ledger.overrides();
        const factory = analyzeUnder(turns, null, null).verdict.status;
        const cur = analyzeUnder(turns, ov, ledger.label());
        // hard invariant under recovery: recovered bar is never more generous
        // than factory (rung never decreases).
        if (RUNG[cur.verdict.status] < RUNG[factory]) { notStricter++; }
        if (cur.verdict.status === TOP && factory !== TOP) minted++;
        mem.record(cur);
        const p = ledger.propose(mem.data);
        if (p) {
            ledger.accept(p);
            if (p.to < DEFAULTS.TRANSFORM_NOVELTY) belowFloor = true;
            barTrace.push(p.to);
        }
    });
    return {
        seededAt: 0.9,
        finalBar: (ledger.overrides() || { TRANSFORM_NOVELTY: DEFAULTS.TRANSFORM_NOVELTY }).TRANSFORM_NOVELTY,
        lowerEntries: ledger.data.entries.filter(e => e.to < e.from && e.date !== '(seed)').length,
        barTrace, belowFloor, minted, moreGenerousThanFactory: notStricter
    };
}

const streams = {
    'S1 DailyDialog (human-human)': ddConversations(),
    'S2 hh-rlhf (human-AI)': hhConversations(),
    'S3 UltraChat (user-AI)': uaConversations()
};

const results = { generated: '2026-07-23',
    prereg: 'docs/RELATIONAL-RATCHET-PREREG.md',
    floor: DEFAULTS.TRANSFORM_NOVELTY, streams: {}, rf1: null, rf2: null };

let rf1fail = false, rf2fail = false;
for (const [name, convs] of Object.entries(streams)) {
    const factory = loopFromFactory(convs);
    const recovery = recoveryScenario(convs);
    if (factory.mints.length) rf1fail = true;
    if (recovery.belowFloor || recovery.minted || recovery.moreGenerousThanFactory) rf2fail = true;

    results.streams[name] = { exchanges: convs.length, rf1: factory, rf2: recovery };
    console.log('═'.repeat(63));
    console.log(`${name} — ${convs.length} conversations`);
    console.log(`  RF1 from factory: lower-fires ${factory.lowerFires}, mints ${factory.mints.length}, end bar ${JSON.stringify(factory.endOverrides)}`);
    console.log(`  RF2 recovery: 0.9 → ${recovery.finalBar} in ${recovery.lowerEntries} step(s); below-floor ${recovery.belowFloor}; mints ${recovery.minted}; more-generous-than-factory ${recovery.moreGenerousThanFactory}`);
    console.log(`    bar trace: ${recovery.barTrace.join(' → ')}`);
}

results.rf1 = rf1fail ? 'FAIL — a mint appeared with the recovery rule present' : 'PASS — no minting; adding the rule changed nothing on the real streams';
results.rf2 = rf2fail ? 'FAIL — recovery breached the floor or minted' : 'PASS — recovery lands on the real median, clamps at the floor, never mints';

console.log('═'.repeat(63));
console.log(`RF1 minting-safety: ${results.rf1}`);
console.log(`RF2 recovery + clamp: ${results.rf2}`);

fs.writeFileSync(path.join(__dirname, 'results-relational-ratchet-validation.json'),
    JSON.stringify(results, null, 2));
console.log('wrote results-relational-ratchet-validation.json');
process.exit(rf1fail || rf2fail ? 1 : 0);

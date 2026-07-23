#!/usr/bin/env node
// THE AUTONOMY RUN — the self-calibrating loop (v3.38.0–v3.39.0) meets real
// documents for the first time (docs/PROGRESSION-AUTONOMY-PREREG.md). Every
// register certificate describes the FACTORY instrument; the Unified 2.0 page
// serves SELF-CALIBRATED verdicts. This run measures the gap: what the
// autonomous loop actually does over 240 committed real operational documents
// (corpus-llm-runbooks.json + corpus-llm-plans.json), and whether the
// certified register story survives the self-calibrated instrument.
//
// The evaluator (cathedral-core.js) and the loop (progression.js) are
// imported UNMODIFIED. The harness replays the exact shipped protocol from
// cathedral-unified-2.html: analyze under current active calibration ->
// observe(result) -> act(), per document. Deterministic given the committed
// corpora (no clock, no randomness in the core; loop state is a pure
// function of the observation stream).
//
// PRE-REGISTERED gates (committed before any corpus verdict under the loop):
//
//   A1-ENVELOPE -- (a) every applied multiplier in [0.8, 1.2]; (b) active-map
//   changes 1:1 with evidence-bearing ledger entries; (c) act() after the
//   final observation is a no-op (fixed point). PASS = all three.
//
//   A2-ATTRIBUTION -- every sequentially divergent verdict is stamped
//   non-factory AND byte-reproducible from its recorded step state
//   (JSON.stringify equality of the full analysis); + 10 seeded
//   non-divergent reproducibility checks. PASS = 100%.
//
//   A3-CERTIFICATE-SURVIVAL -- under the end-state calibration: runbook
//   family < 10% (factory 4.2%); plan family <= 3% (factory 0.0%); OUTSIDE
//   DESIGN SPACE and gaming-flag rates byte-identical to factory (V1
//   instruments are calibration-inert by construction). Family loss is
//   reported, not gated (specificity-over-sensitivity stance).
//
//   A4-PATH (reported, pre-stated reading, no gate) -- reverse-order end
//   state within +/-0.005 per pattern = endpoint path-independent; per-order
//   sequential divergence counts reported side by side.
//
// Reproduce: node progression-autonomy-validation.js
// Results: results-progression-autonomy-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');
const { ProgressionMemory } = require('../progression.js');

const OPERATIONAL_FAMILY = ['OPERATIONALLY SOUND', 'OPERATIONAL INTENT'];
const GAMING_FLAGS = ['LIKELY_GAMING', 'POSSIBLE_GAMING', 'LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'];
const SEED = 20260723;
const MIN_PROSE = 500;
const CLAMP_LO = 0.8, CLAMP_HI = 1.2;

// --- helpers copied VERBATIM from the corpus runs ---------------------------
function mulberry32(seed) {
    return function() {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
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

// --- load the committed corpora ---------------------------------------------
function loadCorpus(file, idOf) {
    const p = path.join(__dirname, file);
    if (!fs.existsSync(p)) { console.error('Missing committed corpus: ' + file); process.exit(2); }
    const corpus = JSON.parse(fs.readFileSync(p, 'utf8'));
    return corpus.documents
        .map(d => ({ id: idOf(d), register: file.includes('runbook') ? 'runbook' : 'plan',
            text: stripMarkdown(d.text || '') }))
        .filter(d => d.text.length >= MIN_PROSE);
}
const docs = [
    ...loadCorpus('corpus-llm-runbooks.json', d => `${d.alert} [batch ${d.batch}]`),
    ...loadCorpus('corpus-llm-plans.json', d => `${d.feature} [batch ${d.batch}]`)
];

// --- pass 1: factory --------------------------------------------------------
const factory = docs.map(d => {
    const a = core.analyzeCathedral(d.text);
    return { status: a.verdict.status, gaming: a.gamingDetection.assessment };
});

// --- the shipped loop, replayed (cathedral-unified-2.html protocol) ---------
function sequentialRun(order) {
    const prog = new ProgressionMemory();
    const steps = [];
    let clampViolations = 0, unledgeredChanges = 0, evidencelessEntries = 0;
    let prevActive = JSON.stringify(prog.active());
    for (const i of order) {
        const d = docs[i];
        const active = prog.active();
        const opts = Object.keys(active).length
            ? { patternCalibration: active, calibrationLabel: prog.label() } : undefined;
        const a = opts ? core.analyzeCathedral(d.text, opts) : core.analyzeCathedral(d.text);
        steps.push({ i, status: a.verdict.status,
            stamp: a.verdict.calibrationLabel || 'factory',
            stepActive: JSON.parse(JSON.stringify(active)),
            stepLabel: opts ? opts.calibrationLabel : null,
            analysisJson: JSON.stringify(a) });
        prog.observe(a);
        const acted = prog.act();
        for (const v of Object.values(prog.active()))
            if (v < CLAMP_LO || v > CLAMP_HI) clampViolations++;
        const nowActive = JSON.stringify(prog.active());
        if (nowActive !== prevActive && acted.changed.length === 0) unledgeredChanges++;
        for (const e of acted.changed) if (!e.why || !e.why.length) evidencelessEntries++;
        prevActive = nowActive;
    }
    const fixedPoint = prog.act().changed.length === 0;
    return { prog, steps, clampViolations, unledgeredChanges, evidencelessEntries, fixedPoint };
}

const forwardOrder = docs.map((_, i) => i);
const fwd = sequentialRun(forwardOrder);
const rev = sequentialRun(forwardOrder.slice().reverse());

// --- A1: ENVELOPE -----------------------------------------------------------
const a1 = {
    clampViolations: fwd.clampViolations,
    unledgeredActiveChanges: fwd.unledgeredChanges,
    evidencelessLedgerEntries: fwd.evidencelessEntries,
    fixedPointAfterFinalObservation: fwd.fixedPoint,
    ledgerEntries: fwd.prog.size(),
    pass: fwd.clampViolations === 0 && fwd.unledgeredChanges === 0 &&
          fwd.evidencelessEntries === 0 && fwd.fixedPoint
};

// --- A2: ATTRIBUTION --------------------------------------------------------
const divergent = fwd.steps.filter((s, k) => s.status !== factory[s.i].status);
let unstamped = 0, irreproducible = 0;
for (const s of divergent) {
    if (s.stamp === 'factory') unstamped++;
    const replay = JSON.stringify(core.analyzeCathedral(docs[s.i].text,
        { patternCalibration: s.stepActive, calibrationLabel: s.stepLabel }));
    if (replay !== s.analysisJson) irreproducible++;
}
const nonDivergent = fwd.steps.filter(s => s.status === factory[s.i].status && s.stepLabel);
const rand = mulberry32(SEED);
const spot = [];
for (let k = 0; k < 10 && nonDivergent.length; k++)
    spot.push(nonDivergent[Math.floor(rand() * nonDivergent.length)]);
let spotFailures = 0;
for (const s of spot) {
    const replay = JSON.stringify(core.analyzeCathedral(docs[s.i].text,
        { patternCalibration: s.stepActive, calibrationLabel: s.stepLabel }));
    if (replay !== s.analysisJson) spotFailures++;
}
const a2 = {
    sequentiallyDivergentDocs: divergent.length,
    divergentUnstamped: unstamped,
    divergentIrreproducible: irreproducible,
    nonDivergentSpotChecks: spot.length,
    spotCheckFailures: spotFailures,
    pass: unstamped === 0 && irreproducible === 0 && spotFailures === 0
};

// --- A3: CERTIFICATE SURVIVAL (end-state pass) ------------------------------
const endActive = fwd.prog.active();
const endLabel = fwd.prog.label();
const endState = docs.map(d => {
    const a = Object.keys(endActive).length
        ? core.analyzeCathedral(d.text, { patternCalibration: endActive, calibrationLabel: endLabel })
        : core.analyzeCathedral(d.text);
    return { status: a.verdict.status, gaming: a.gamingDetection.assessment };
});
function registerRates(results) {
    const out = {};
    for (const reg of ['runbook', 'plan']) {
        const idx = docs.map((d, i) => d.register === reg ? i : -1).filter(i => i >= 0);
        const n = idx.length;
        out[reg] = {
            n,
            family: idx.filter(i => OPERATIONAL_FAMILY.includes(results[i].status)).length,
            outside: idx.filter(i => results[i].status === 'OUTSIDE DESIGN SPACE').length,
            gamingFlagged: idx.filter(i => GAMING_FLAGS.includes(results[i].gaming)).length
        };
        out[reg].familyRate = (out[reg].family / n * 100).toFixed(1) + '%';
    }
    return out;
}
const factoryRates = registerRates(factory);
const endRates = registerRates(endState);
const transitions = {};
let familyDestroyed = [], familyMinted = [];
docs.forEach((d, i) => {
    if (factory[i].status !== endState[i].status) {
        const key = factory[i].status + ' → ' + endState[i].status;
        transitions[key] = (transitions[key] || 0) + 1;
        const wasFam = OPERATIONAL_FAMILY.includes(factory[i].status);
        const isFam = OPERATIONAL_FAMILY.includes(endState[i].status);
        if (wasFam && !isFam) familyDestroyed.push(d.id);
        if (!wasFam && isFam) familyMinted.push(d.id);
    }
});
const v1Inert = ['runbook', 'plan'].every(r =>
    factoryRates[r].outside === endRates[r].outside &&
    factoryRates[r].gamingFlagged === endRates[r].gamingFlagged);
const a3 = {
    endStateCalibration: endActive,
    factoryRates, endStateRates: endRates,
    runbookFamilyUnder10pct: endRates.runbook.family / endRates.runbook.n < 0.10,
    planFamilyAtMost3pct: endRates.plan.family / endRates.plan.n <= 0.03,
    v1InstrumentsInert: v1Inert,
    transitions, familyDestroyed, familyMinted,
    endStateVerdictChanges: docs.filter((d, i) => factory[i].status !== endState[i].status).length,
    pass: (endRates.runbook.family / endRates.runbook.n < 0.10) &&
          (endRates.plan.family / endRates.plan.n <= 0.03) && v1Inert
};

// --- A4: PATH DEPENDENCE (reported) -----------------------------------------
const revActive = rev.prog.active();
const names = new Set([...Object.keys(endActive), ...Object.keys(revActive)]);
let maxDelta = 0;
for (const n of names)
    maxDelta = Math.max(maxDelta, Math.abs((endActive[n] || 1) - (revActive[n] || 1)));
const revDivergent = rev.steps.filter(s => s.status !== factory[s.i].status).length;
const a4 = {
    forwardEndState: endActive, reverseEndState: revActive,
    maxPerPatternDelta: Math.round(maxDelta * 1000) / 1000,
    reading: maxDelta <= 0.005 ? 'endpoint path-independent (within act() dead-band)'
                               : 'order-sensitive endpoint — reported',
    sequentialDivergence: { forward: divergent.length, reverse: revDivergent }
};

// --- reported: the loop's own account ---------------------------------------
const firstChange = {};
fwd.prog.ledger().forEach(e => { if (!(e.param in firstChange)) firstChange[e.param] = e.n; });
const results = {
    generated: '2026-07-23', seed: SEED, minProseChars: MIN_PROSE,
    corpora: 'corpus-llm-runbooks.json + corpus-llm-plans.json (committed, offline; development data — this run measures the LOOP, not a register)',
    protocol: 'shipped Unified 2.0 loop replayed verbatim: analyze under active calibration → observe → act, per document; forward order = runbooks then plans, corpus order',
    documentsEffective: docs.length,
    a1envelope: a1, a2attribution: a2, a3certificateSurvival: a3, a4path: a4,
    patternTable: fwd.prog.summary(),
    firstSelfChangeLedgerIndex: firstChange,
    selfChangeLedger: fwd.prog.ledger(),
    doubleRecordNote: 'shipped observe() records each pattern twice per document (gaming context + binding context), so the January 5-sample floor is reached within ~3 documents — shipped behavior, measured as-is'
};

// --- console account --------------------------------------------------------
const line = '═'.repeat(63);
console.log(line);
console.log(`THE AUTONOMY RUN — shipped loop over ${docs.length} committed real documents`);
console.log(line);
console.log(`A1-ENVELOPE: clamp violations ${a1.clampViolations}, unledgered changes ${a1.unledgeredActiveChanges}, ` +
    `evidenceless entries ${a1.evidencelessLedgerEntries}, fixed point ${a1.fixedPointAfterFinalObservation}` +
    ` (ledger: ${a1.ledgerEntries} entries) → ${a1.pass ? 'PASS' : 'FAIL'}`);
console.log(`A2-ATTRIBUTION: ${a2.sequentiallyDivergentDocs} divergent verdicts — unstamped ${a2.divergentUnstamped}, ` +
    `irreproducible ${a2.divergentIrreproducible}; spot checks ${a2.nonDivergentSpotChecks} (failures ${a2.spotCheckFailures})` +
    ` → ${a2.pass ? 'PASS' : 'FAIL'}`);
console.log(`A3-CERTIFICATE-SURVIVAL:`);
console.log(`  end-state calibration: ${JSON.stringify(endActive)}`);
console.log(`  runbooks: family ${factoryRates.runbook.familyRate} → ${endRates.runbook.familyRate} (gate < 10%)`);
console.log(`  plans:    family ${factoryRates.plan.familyRate} → ${endRates.plan.familyRate} (gate ≤ 3%)`);
console.log(`  V1 inert: ${v1Inert}   verdict changes end-state vs factory: ${a3.endStateVerdictChanges}`);
if (Object.keys(transitions).length) console.log(`  transitions: ${JSON.stringify(transitions)}`);
if (familyDestroyed.length) console.log(`  family destroyed: ${familyDestroyed.join('; ')}`);
if (familyMinted.length) console.log(`  family minted: ${familyMinted.join('; ')}`);
console.log(`  → ${a3.pass ? 'PASS' : 'FAIL'}`);
console.log(`A4-PATH: max per-pattern Δ ${a4.maxPerPatternDelta} → ${a4.reading}`);
console.log(`  sequential divergence forward ${a4.sequentialDivergence.forward} / reverse ${a4.sequentialDivergence.reverse}`);
console.log(line);
console.log('pattern table (forward run):');
for (const row of results.patternTable)
    console.log(`  ${row.pattern}: win ${row.winRate} vs avg conf ${row.avgConfidence} over ${row.samples} samples → ${row.calibration} (applied ${row.applied})`);
console.log(line);

fs.writeFileSync(path.join(__dirname, 'results-progression-autonomy-validation.json'),
    JSON.stringify(results, null, 2));
console.log('wrote results-progression-autonomy-validation.json');
process.exit(a1.pass && a2.pass && a3.pass ? 0 : 1);

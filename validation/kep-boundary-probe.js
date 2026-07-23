#!/usr/bin/env node
// THE KEP BOUNDARY PROBE — the amplifying loop meets the register where the
// decision boundary lives (docs/KEP-BOUNDARY-PROBE-PREREG.md). The autonomy
// run (v3.40.0) measured the shipped self-calibration loop as an AMPLIFIER
// on real operational text (OPERATIONAL_INTENT 1.10x) whose stream never
// approached a decision boundary; the KEP register holds 66 flagship
// verdicts near the parliament.confidence > 0.8 gate. This probe asks: does
// the amplifier cross boundaries, and when it does, are the crossed verdicts
// earned (structural under the standing shuffle control) or laundered
// (vocabulary credited by self-raised weights)?
//
// The evaluator (cathedral-core.js) and loop (progression.js) are imported
// UNMODIFIED; the protocol is the shipped Unified 2.0 loop replayed verbatim
// (analyze under active calibration -> observe -> act). Loader and
// preprocessing byte-copied from kep-validation.js. Corpus: 611 KEPs
// byte-pinned @ 996e7d41 (bash fetch-kep-corpus.sh). Deterministic.
//
// PRE-REGISTERED gates (committed before any KEP verdict under the loop):
//
//   B1-ENVELOPE     -- clamp [0.8,1.2]; active-map changes 1:1 with
//                      evidence-bearing ledger entries; fixed point. All three.
//   B2-ATTRIBUTION  -- every divergent verdict stamped non-factory AND
//                      byte-reproducible from its step state; + 10 seeded
//                      spot-checks. 100%.
//   B3-MINT-STRUCT  -- every family verdict MINTED by calibration (mid-stream
//                      or end-state) passes the standing shuffle control
//                      UNDER THE CALIBRATION THAT MINTED IT: 20 seeded
//                      shuffles, pooled retention < 20%, no text >= 10/20.
//                      Zero mints passes vacuously.
//   B4-V1-INERT     -- OUTSIDE DESIGN SPACE and gaming rates byte-identical
//                      to factory under the end-state calibration.
//   B5-CERT-SURVIVAL-- end-state family rate < 15% (v3.35.0's own top band;
//                      certified factory 11.6%). Destroyed family verdicts
//                      reported, not gated.
//   B6-PATH (reported) -- reverse-order end state within +/-0.005 per
//                      pattern; per-order divergence and mint counts.
//
// Reproduce: bash fetch-kep-corpus.sh, then node kep-boundary-probe.js
// Results: results-kep-boundary-probe.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');
const { ProgressionMemory } = require('../progression.js');

const KEP = path.join(__dirname, 'data', 'kep-corpus');
const OPERATIONAL_FAMILY = ['OPERATIONALLY SOUND', 'OPERATIONAL INTENT'];
const GAMING_FLAGS = ['LIKELY_GAMING', 'POSSIBLE_GAMING', 'LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'];
const SEED = 20260723;
const SHUFFLES_PER_TEXT = 20;
const MIN_PROSE = 500;
const CLAMP_LO = 0.8, CLAMP_HI = 1.2;

// --- helpers copied VERBATIM from kep-validation.js -------------------------
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
function loadRepoCorpus(dir, prefix, fetchHint) {
    if (!fs.existsSync(dir)) {
        console.error('No corpus at ' + dir + '. Run: bash ' + fetchHint);
        process.exit(2);
    }
    const re = new RegExp('^' + prefix + '_\\d+\\.json$');
    const docs = [];
    for (const f of fs.readdirSync(dir).filter(f => re.test(f)).sort()) {
        const rec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        docs.push({ id: `${rec.title} @${(rec.ref || '').slice(0, 8)}`, text: stripMarkdown(stripFrontmatter(rec.markdown || '')) });
    }
    return docs.filter(d => d.text.length >= MIN_PROSE);
}

const docs = loadRepoCorpus(KEP, 'kep', 'fetch-kep-corpus.sh');

// --- pass 1: factory --------------------------------------------------------
const factory = docs.map(d => {
    const a = core.analyzeCathedral(d.text);
    return { status: a.verdict.status, gaming: a.gamingDetection.assessment };
});

// --- the shipped loop, replayed (cathedral-unified-2.html protocol) ---------
function sequentialRun(order, keepJson) {
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
            analysisJson: keepJson ? JSON.stringify(a) : null });
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
const fwd = sequentialRun(forwardOrder, true);

// --- B1: ENVELOPE -----------------------------------------------------------
const b1 = {
    clampViolations: fwd.clampViolations,
    unledgeredActiveChanges: fwd.unledgeredChanges,
    evidencelessLedgerEntries: fwd.evidencelessEntries,
    fixedPointAfterFinalObservation: fwd.fixedPoint,
    ledgerEntries: fwd.prog.size(),
    pass: fwd.clampViolations === 0 && fwd.unledgeredChanges === 0 &&
          fwd.evidencelessEntries === 0 && fwd.fixedPoint
};

// --- B2: ATTRIBUTION --------------------------------------------------------
const divergent = fwd.steps.filter(s => s.status !== factory[s.i].status);
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
const b2 = {
    sequentiallyDivergentDocs: divergent.length,
    divergentUnstamped: unstamped,
    divergentIrreproducible: irreproducible,
    nonDivergentSpotChecks: spot.length,
    spotCheckFailures: spotFailures,
    pass: unstamped === 0 && irreproducible === 0 && spotFailures === 0
};

// --- end-state pass ---------------------------------------------------------
const endActive = fwd.prog.active();
const endLabel = fwd.prog.label();
const endOpts = Object.keys(endActive).length
    ? { patternCalibration: endActive, calibrationLabel: endLabel } : undefined;
const endState = docs.map(d => {
    const a = endOpts ? core.analyzeCathedral(d.text, endOpts) : core.analyzeCathedral(d.text);
    return { status: a.verdict.status, gaming: a.gamingDetection.assessment,
        confidence: a.verdict.confidence };
});

// --- mint/destroy accounting ------------------------------------------------
// A mint: factory verdict outside the family, calibrated verdict inside it —
// mid-stream (sequential pass) or at end state. Keyed by doc index; each mint
// remembers the calibration in force when it was minted (B3 shuffles under it).
const mints = new Map();
for (const s of divergent) {
    const wasFam = OPERATIONAL_FAMILY.includes(factory[s.i].status);
    const isFam = OPERATIONAL_FAMILY.includes(s.status);
    if (!wasFam && isFam) mints.set(s.i, { where: 'mid-stream',
        from: factory[s.i].status, to: s.status,
        calibration: s.stepActive, label: s.stepLabel });
}
const destroyed = [];
docs.forEach((d, i) => {
    const wasFam = OPERATIONAL_FAMILY.includes(factory[i].status);
    const isFam = OPERATIONAL_FAMILY.includes(endState[i].status);
    if (!wasFam && isFam && !mints.has(i)) mints.set(i, { where: 'end-state',
        from: factory[i].status, to: endState[i].status,
        calibration: endActive, label: endLabel });
    if (wasFam && !isFam) destroyed.push({ id: d.id,
        from: factory[i].status, to: endState[i].status });
});

// --- B3: MINT-STRUCT --------------------------------------------------------
const mintList = [...mints.entries()];
const b3ctl = { mintedDocs: mintList.length, trials: 0, retained: 0, perText: [] };
mintList.forEach(([i, m], mi) => {
    const shuffleOpts = Object.keys(m.calibration).length
        ? { patternCalibration: m.calibration, calibrationLabel: m.label } : undefined;
    let r = 0;
    for (let s = 0; s < SHUFFLES_PER_TEXT; s++) {
        const rnd = mulberry32(SEED + mi * 1000 + s);
        const shuffled = wordShuffle(docs[i].text, rnd);
        const v = (shuffleOpts ? core.analyzeCathedral(shuffled, shuffleOpts)
                               : core.analyzeCathedral(shuffled)).verdict.status;
        b3ctl.trials++;
        if (OPERATIONAL_FAMILY.includes(v)) { b3ctl.retained++; r++; }
    }
    b3ctl.perText.push({ id: docs[i].id, where: m.where, from: m.from, to: m.to, retainedOf20: r });
});
const b3rate = b3ctl.trials ? b3ctl.retained / b3ctl.trials : 0;
b3ctl.retentionRate = (b3rate * 100).toFixed(1) + '%';
b3ctl.worstText = b3ctl.perText.reduce((m, t) => Math.max(m, t.retainedOf20), 0);
const b3 = { ...b3ctl,
    pass: mintList.length === 0 || (b3rate < 0.2 && b3ctl.worstText < 10),
    vacuous: mintList.length === 0 };

// --- B4: V1 INERTNESS -------------------------------------------------------
const factoryOutside = factory.filter(f => f.status === 'OUTSIDE DESIGN SPACE').length;
const endOutside = endState.filter(f => f.status === 'OUTSIDE DESIGN SPACE').length;
const factoryGaming = factory.filter(f => GAMING_FLAGS.includes(f.gaming)).length;
const endGaming = endState.filter(f => GAMING_FLAGS.includes(f.gaming)).length;
const b4 = { factoryOutside, endOutside, factoryGaming, endGaming,
    pass: factoryOutside === endOutside && factoryGaming === endGaming };

// --- B5: CERTIFICATE SURVIVAL ----------------------------------------------
const famFactory = factory.filter(f => OPERATIONAL_FAMILY.includes(f.status)).length;
const famEnd = endState.filter(f => OPERATIONAL_FAMILY.includes(f.status)).length;
const soundFactory = factory.filter(f => f.status === 'OPERATIONALLY SOUND').length;
const soundEnd = endState.filter(f => f.status === 'OPERATIONALLY SOUND').length;
const transitions = {};
docs.forEach((d, i) => {
    if (factory[i].status !== endState[i].status) {
        const key = factory[i].status + ' → ' + endState[i].status;
        transitions[key] = (transitions[key] || 0) + 1;
    }
});
const b5 = {
    factoryFamily: famFactory, factoryFamilyRate: (famFactory / docs.length * 100).toFixed(1) + '%',
    endFamily: famEnd, endFamilyRate: (famEnd / docs.length * 100).toFixed(1) + '%',
    factorySound: soundFactory, endSound: soundEnd,
    endStateVerdictChanges: docs.filter((d, i) => factory[i].status !== endState[i].status).length,
    transitions,
    destroyed,
    pass: famEnd / docs.length < 0.15
};

// --- B6: PATH (reverse run) -------------------------------------------------
const rev = sequentialRun(forwardOrder.slice().reverse(), false);
const revActive = rev.prog.active();
const names = new Set([...Object.keys(endActive), ...Object.keys(revActive)]);
let maxDelta = 0;
for (const n of names)
    maxDelta = Math.max(maxDelta, Math.abs((endActive[n] || 1) - (revActive[n] || 1)));
const revDivergent = rev.steps.filter(s => s.status !== factory[s.i].status);
const revMints = revDivergent.filter(s =>
    !OPERATIONAL_FAMILY.includes(factory[s.i].status) && OPERATIONAL_FAMILY.includes(s.status)).length;
const fwdMidMints = mintList.filter(([, m]) => m.where === 'mid-stream').length;
const b6 = {
    forwardEndState: endActive, reverseEndState: revActive,
    maxPerPatternDelta: Math.round(maxDelta * 1000) / 1000,
    reading: maxDelta <= 0.005 ? 'endpoint path-independent (within act() dead-band)'
                               : 'order-sensitive endpoint — reported',
    sequentialDivergence: { forward: divergent.length, reverse: revDivergent.length },
    midStreamMints: { forward: fwdMidMints, reverse: revMints }
};

// --- results ----------------------------------------------------------------
const firstChange = {};
fwd.prog.ledger().forEach(e => { if (!(e.param in firstChange)) firstChange[e.param] = e.n; });
const results = {
    generated: '2026-07-23', seed: SEED, minProseChars: MIN_PROSE,
    corpus: 'kubernetes/enhancements KEP READMEs @ 996e7d41 (611 docs; development data since v3.27.0 — this probe measures the LOOP at the decision boundary, not the register)',
    protocol: 'shipped Unified 2.0 loop replayed verbatim: analyze under active calibration → observe → act, per document; forward order = corpus order',
    documentsEffective: docs.length,
    b1envelope: b1, b2attribution: b2, b3mintStruct: b3, b4v1Inert: b4,
    b5certificateSurvival: b5, b6path: b6,
    patternTable: fwd.prog.summary(),
    firstSelfChangeLedgerIndex: firstChange,
    selfChangeLedger: fwd.prog.ledger()
};

const line = '═'.repeat(63);
console.log(line);
console.log(`THE KEP BOUNDARY PROBE — shipped loop over ${docs.length} KEPs @ 996e7d41`);
console.log(line);
console.log(`B1-ENVELOPE: clamp violations ${b1.clampViolations}, unledgered ${b1.unledgeredActiveChanges}, ` +
    `evidenceless ${b1.evidencelessLedgerEntries}, fixed point ${b1.fixedPointAfterFinalObservation}` +
    ` (ledger: ${b1.ledgerEntries}) → ${b1.pass ? 'PASS' : 'FAIL'}`);
console.log(`B2-ATTRIBUTION: ${b2.sequentiallyDivergentDocs} divergent — unstamped ${b2.divergentUnstamped}, ` +
    `irreproducible ${b2.divergentIrreproducible}; spot ${b2.nonDivergentSpotChecks} (fail ${b2.spotCheckFailures})` +
    ` → ${b2.pass ? 'PASS' : 'FAIL'}`);
console.log(`B3-MINT-STRUCT: ${b3.mintedDocs} minted family verdicts` +
    (b3.vacuous ? ' → PASS-vacuous' :
     ` — retention ${b3.retentionRate}, worst ${b3.worstText}/20 → ${b3.pass ? 'PASS-structural' : 'FAIL-vocabulary'}`));
b3.perText.forEach(t => console.log(`    ${t.retainedOf20}/20  ${t.from} → ${t.to}  (${t.where})  ${t.id}`));
console.log(`B4-V1-INERT: OUTSIDE ${b4.factoryOutside} → ${b4.endOutside}, gaming ${b4.factoryGaming} → ${b4.endGaming}` +
    ` → ${b4.pass ? 'PASS' : 'FAIL'}`);
console.log(`B5-CERT-SURVIVAL: family ${b5.factoryFamilyRate} → ${b5.endFamilyRate} (gate < 15%), ` +
    `SOUND ${b5.factorySound} → ${b5.endSound}, verdict changes ${b5.endStateVerdictChanges}` +
    ` → ${b5.pass ? 'PASS' : 'FAIL'}`);
if (Object.keys(b5.transitions).length) console.log(`  transitions: ${JSON.stringify(b5.transitions)}`);
if (destroyed.length) console.log(`  destroyed: ${destroyed.map(d => `${d.id} (${d.from} → ${d.to})`).join('; ')}`);
console.log(`B6-PATH: max Δ ${b6.maxPerPatternDelta} → ${b6.reading}`);
console.log(`  divergence fwd ${b6.sequentialDivergence.forward} / rev ${b6.sequentialDivergence.reverse}; ` +
    `mid-stream mints fwd ${b6.midStreamMints.forward} / rev ${b6.midStreamMints.reverse}`);
console.log(line);
console.log('pattern table (forward run):');
for (const row of results.patternTable)
    console.log(`  ${row.pattern}: win ${row.winRate} vs avg conf ${row.avgConfidence} over ${row.samples} samples → ${row.calibration} (applied ${row.applied})`);
console.log(line);

fs.writeFileSync(path.join(__dirname, 'results-kep-boundary-probe.json'),
    JSON.stringify(results, null, 2));
console.log('wrote results-kep-boundary-probe.json');
process.exit(b1.pass && b2.pass && b3.pass && b4.pass && b5.pass ? 0 : 1);

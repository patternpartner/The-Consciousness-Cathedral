#!/usr/bin/env node
// The boundary program: adversarial validation of the refusal gate.
//
// Every prior validation run in this repository attacked the INSIDE of the
// design space — can keyword stuffing earn a verdict, do shuffles destroy
// bindings, does the flagship fire on ordinary conversation. None attacked the
// boundary itself: the decision about which texts get evaluated at all.
//
// That decision was, until v3.47.0, made by counting narrative/poetic/aesthetic
// marker words, and it ran ahead of and overrode the structural analysis. The
// full assessment that opened this program found both failure directions:
//
//   - Evasion. Appending one sentence of story vocabulary to a fully bound
//     plan expelled it from evaluation ("OUTSIDE DESIGN SPACE — this is not a
//     judgment of quality") with every threshold still bound to its action.
//   - Miss. Genuine narrative using none of the marker words was not refused;
//     it earned VERIFIED CONSISTENT, a positive verdict, on text the README
//     says Cathedral honestly declines.
//
// This harness measures both directions against the rebuilt gate, and — where
// it can be reconstructed from the analysis output — reports the pre-fix
// behavior beside it, so the fix is measured rather than asserted.
//
// Pre-stated gates:
//
//   B1 — EVASION RESISTANCE (GATED). For every text earning an
//   operational-family verdict, append marker-lexicon sentences at doses of
//   1, 3, 6 and 12. Gate: 0% of trials lose the verdict to OUTSIDE DESIGN
//   SPACE. Zero, not "few" — this is a bounded structural claim, not a
//   statistical one: structure outranks style by construction, so any single
//   loss falsifies the design rather than nudging a rate.
//
//   B2 — REFUSAL IS STRUCTURAL, NOT LEXICAL (GATED). Non-operational probes
//   that contain NONE of the marker words the old gate counted (checked
//   mechanically, not by assertion) must still be refused. Gate: 100%.
//
//   B3 — NO FALSE REFUSAL ON OPERATIONAL TEXT (GATED). Real operational
//   documents (240 committed LLM-authored runbooks and rollout plans) plus the
//   terse authored probes must not be refused. Gate: < 1% on the corpus, 0% on
//   the terse probes — terse text is the designed-for hard case, since it
//   scores as few raw structural elements as a narrative sentence.
//
//   B4 — VERDICT-LABEL INTEGRITY (GATED). Two parts, and they measure
//   different things — worth separating, because conflating them overstates
//   the fix.
//
//   The gate is a forward-going invariant: no verdict may carry status
//   UNDECIDABLE with an empty contradictions array. Note honestly that this
//   invariant ALSO held before v3.47.0 — every path that set isConsistent =
//   false pushed a string onto `contradictions`. The pre-fix defect was not
//   an empty array; it was that two of those strings described findings that
//   are not contradictions, under a verdict whose text asserts contradictions
//   were detected. Gate: 0 violations.
//
//   The reading is the relabelling count: verdicts now reported as CONFIDENT
//   WITHOUT JUSTIFICATION whose `findings` carry the overconfidence
//   observation. Those are exactly and unambiguously the turns that were
//   UNDECIDABLE before — the condition that produced the finding is the same
//   condition that set isConsistent = false, and !isConsistent is tested
//   before the branch that now catches them. This is a reconstruction, not an
//   assumption, and it is reported rather than gated.
//
//   B5 — SPECIFICITY SURVIVES THE REBUILD (GATED). The flagship must still fire
//   on ~no ordinary conversation, and — the honest form of the question — must
//   still not fire on the turns that were actually EVALUATED rather than
//   refused. A refusal-inflated specificity number would be worthless. Gate:
//   OPERATIONALLY SOUND on < 2% of evaluated turns per conversational
//   population.
//
// Reproduce: bash fetch-corpora.sh, then node boundary-validation.js.
// Results: results-boundary-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const DATA = path.join(__dirname, 'data');
const PROBES = JSON.parse(fs.readFileSync(path.join(__dirname, 'corpus-boundary-probes.json'), 'utf8'));
const OPERATIONAL_FAMILY = ['OPERATIONALLY SOUND', 'OPERATIONAL INTENT'];
const REFUSED = 'OUTSIDE DESIGN SPACE';

const results = { generated: new Date().toISOString().slice(0, 10), gates: {}, readings: {} };
const line = () => console.log('═'.repeat(63));

// ── Reconstructing the pre-fix gate ──────────────────────────────────────────
// The old rule was: refuse iff the style classifier said "outside design space"
// with confidence over its threshold, and the text did not name Cathedral. All
// three inputs survive in the analysis output, so the old decision can be
// recomputed exactly without keeping the old code around.
const META_GAMING = /\b(Cathedral|escape hatch|avoid being measured|cannot evaluate|outside design space)\b/i;
function preFixWouldRefuse(analysis, text) {
    const style = analysis.reasoningStyle;
    const threshold = ['PHENOMENOLOGICAL', 'NARRATIVE'].includes(style.dominantStyle) ? 0.3 : 0.5;
    return !style.withinDesignSpace && style.confidence > threshold && !META_GAMING.test(text);
}

// ── B1: evasion resistance ───────────────────────────────────────────────────
function attackEvasion(texts, label) {
    const payloads = PROBES.evasionPayloads.sentences;
    const doses = [1, 3, 6, 12];
    let trials = 0, lost = 0, preFixLost = 0;
    const examples = [];

    for (const text of texts) {
        const before = core.analyzeCathedral(text);
        if (!OPERATIONAL_FAMILY.includes(before.verdict.status)) continue;
        for (const payload of payloads) {
            for (const dose of doses) {
                const attacked = text + payload.repeat(dose);
                const after = core.analyzeCathedral(attacked);
                trials++;
                if (after.verdict.status === REFUSED) {
                    lost++;
                    if (examples.length < 5) examples.push({ dose, payload: payload.trim().slice(0, 50), was: before.verdict.status });
                }
                if (preFixWouldRefuse(after, attacked)) preFixLost++;
            }
        }
    }
    return { label, positives: texts.length, trials, lostToRefusal: lost,
             lossRate: trials ? (lost / trials * 100).toFixed(2) + '%' : 'n/a',
             preFixLostToRefusal: preFixLost,
             preFixLossRate: trials ? (preFixLost / trials * 100).toFixed(2) + '%' : 'n/a',
             examples };
}

// ── B2: refusal is structural, not lexical ───────────────────────────────────
function markerWordsIn(text) {
    const lex = PROBES.markerLexicon;
    const all = [].concat(lex.narrative, lex.poetic, lex.aesthetic, lex.phenomenological);
    const lower = text.toLowerCase();
    return all.filter(w => new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(lower));
}

function testStructuralRefusal() {
    const unmarked = PROBES.nonOperational.unmarked;
    const contamination = unmarked
        .map(t => ({ text: t.slice(0, 45), markers: markerWordsIn(t) }))
        .filter(r => r.markers.length > 0);

    const rows = unmarked.map(text => {
        const a = core.analyzeCathedral(text);
        return {
            text: text.slice(0, 55),
            refused: a.verdict.status === REFUSED,
            basis: a.verdict.refusalBasis || null,
            status: a.verdict.status,
            operational: a.evaluability.operational,
            preFixWouldRefuse: preFixWouldRefuse(a, text)
        };
    });
    const refused = rows.filter(r => r.refused).length;
    const preFix = rows.filter(r => r.preFixWouldRefuse).length;
    return { probes: rows.length, refused, preFixRefused: preFix,
             lexicalContamination: contamination, rows };
}

// ── B3: no false refusal on operational text ─────────────────────────────────
function testOperationalNotRefused() {
    const out = {};
    for (const [name, file] of [['llm-runbooks', 'corpus-llm-runbooks.json'],
                                ['llm-plans', 'corpus-llm-plans.json']]) {
        const docs = JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8')).documents;
        let refused = 0;
        const examples = [];
        for (const d of docs) {
            const a = core.analyzeCathedral(d.text);
            if (a.verdict.status === REFUSED) {
                refused++;
                if (examples.length < 3) examples.push({ text: d.text.slice(0, 70), operational: a.evaluability.operational });
            }
        }
        out[name] = { documents: docs.length, refused,
                      refusalRate: (refused / docs.length * 100).toFixed(2) + '%', examples };
    }

    const terse = PROBES.operational.terse.map(text => {
        const a = core.analyzeCathedral(text);
        return { text: text.slice(0, 50), refused: a.verdict.status === REFUSED,
                 status: a.verdict.status, operational: a.evaluability.operational };
    });
    out.terseProbes = { probes: terse.length, refused: terse.filter(t => t.refused).length, rows: terse };
    return out;
}

// ── Corpus loaders (same slices as core-verdict-validation.js) ───────────────
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

// ── B4 + B5: corpus sweep ────────────────────────────────────────────────────
function sweepPopulation(name, turns) {
    const dist = {};
    let refused = 0, undecidableWithoutContradictions = 0, sound = 0, relabelled = 0;
    const positives = [];
    const violations = [];

    for (const text of turns) {
        const a = core.analyzeCathedral(text);
        const s = a.verdict.status;
        dist[s] = (dist[s] || 0) + 1;

        if (s === REFUSED) refused++;
        if (s === 'UNDECIDABLE' && (!a.verdict.contradictions || a.verdict.contradictions.length === 0)) {
            undecidableWithoutContradictions++;
            if (violations.length < 3) violations.push(text.slice(0, 70));
        }
        // Exactly reconstructible: the overconfidence condition that produced
        // this finding is the same condition that used to set isConsistent =
        // false, and !isConsistent was tested before the branch now catching it.
        if (s === 'CONFIDENT WITHOUT JUSTIFICATION' && a.verdict.findings &&
            a.verdict.findings.some(f => /Confident claims without justification/.test(f))) {
            relabelled++;
        }
        if (s === 'OPERATIONALLY SOUND') sound++;
        if (OPERATIONAL_FAMILY.includes(s)) positives.push(text);
    }

    const evaluated = turns.length - refused;
    return {
        population: name, turns: turns.length,
        refused, refusalRate: (refused / turns.length * 100).toFixed(2) + '%',
        evaluated,
        verdictDistribution: dist,
        operationallySound: sound,
        soundRateOfAll: (sound / turns.length * 100).toFixed(2) + '%',
        soundRateOfEvaluated: evaluated ? (sound / evaluated * 100).toFixed(2) + '%' : 'n/a',
        undecidableWithoutContradictions, violations,
        relabelledFromUndecidable: relabelled,
        positives
    };
}

// ── Run ──────────────────────────────────────────────────────────────────────
line();
console.log('BOUNDARY PROGRAM — adversarial validation of the refusal gate');
line();

const haveExternal = fs.existsSync(path.join(DATA, 'dd_0.json'));

// B2
console.log('\nB2 — refusal is structural, not lexical');
const b2 = testStructuralRefusal();
results.readings.structuralRefusal = b2;
if (b2.lexicalContamination.length > 0) {
    console.log('  ✗ probe set is contaminated: ' + b2.lexicalContamination.length +
                ' "unmarked" probes contain marker words — the test would be vacuous');
    b2.lexicalContamination.forEach(c => console.log('      "' + c.text + '..." -> ' + c.markers.join(', ')));
}
console.log('  probes containing ZERO marker words: ' + (b2.probes - b2.lexicalContamination.length) + '/' + b2.probes);
console.log('  refused now:              ' + b2.refused + '/' + b2.probes);
console.log('  refused by the old gate:  ' + b2.preFixRefused + '/' + b2.probes + '   (the miss this fixes)');
results.gates.B2 = (b2.refused === b2.probes && b2.lexicalContamination.length === 0) ? 'PASS' : 'FAIL';
console.log('  B2: ' + results.gates.B2);

// B3
console.log('\nB3 — no false refusal on operational text');
const b3 = testOperationalNotRefused();
results.readings.operationalNotRefused = b3;
for (const k of ['llm-runbooks', 'llm-plans'])
    console.log('  ' + k.padEnd(14) + b3[k].refused + '/' + b3[k].documents + ' refused (' + b3[k].refusalRate + ')');
console.log('  terse probes  ' + b3.terseProbes.refused + '/' + b3.terseProbes.probes + ' refused');
const b3pass = b3['llm-runbooks'].refused / b3['llm-runbooks'].documents < 0.01 &&
               b3['llm-plans'].refused / b3['llm-plans'].documents < 0.01 &&
               b3.terseProbes.refused === 0;
results.gates.B3 = b3pass ? 'PASS' : 'FAIL';
console.log('  B3: ' + results.gates.B3);

// B1
console.log('\nB1 — evasion resistance (marker vocabulary appended to bound plans)');
const b1sets = [];
b1sets.push(attackEvasion(PROBES.operational.bound, 'authored bound plans'));
if (haveExternal) {
    // Real operational documents that earn the family, attacked the same way.
    const docs = JSON.parse(fs.readFileSync(path.join(__dirname, 'corpus-llm-runbooks.json'), 'utf8')).documents
        .map(d => d.text)
        .filter(t => OPERATIONAL_FAMILY.includes(core.analyzeCathedral(t).verdict.status));
    if (docs.length) b1sets.push(attackEvasion(docs, 'external operational positives'));
}
results.readings.evasion = b1sets;
let b1trials = 0, b1lost = 0, b1pre = 0;
for (const s of b1sets) {
    console.log('  ' + s.label.padEnd(32) + s.trials + ' trials, ' +
                s.lostToRefusal + ' lost (' + s.lossRate + ')   old gate: ' +
                s.preFixLostToRefusal + ' (' + s.preFixLossRate + ')');
    b1trials += s.trials; b1lost += s.lostToRefusal; b1pre += s.preFixLostToRefusal;
}
results.gates.B1 = (b1trials > 0 && b1lost === 0) ? 'PASS' : (b1trials === 0 ? 'NO-DATA' : 'FAIL');
console.log('  total: ' + b1lost + '/' + b1trials + ' lost now; ' + b1pre + '/' + b1trials + ' would have been lost pre-fix');
console.log('  B1: ' + results.gates.B1);

// B4 + B5
if (haveExternal) {
    console.log('\nB4/B5 — corpus sweep (label integrity, specificity of evaluated turns)');
    const pops = [
        sweepPopulation('DailyDialog (human, casual)', dailyDialogTurns()),
        sweepPopulation('hh-rlhf assistant (AI)', hhAssistantTurns()),
        sweepPopulation('UltraChat assistant (AI, long-form)', ultrachatAssistantTurns())
    ];
    results.readings.populations = pops.map(p => { const q = Object.assign({}, p); delete q.positives; return q; });

    let violations = 0, b5fail = 0;
    for (const p of pops) {
        console.log('  ' + p.population);
        console.log('    refused ' + p.refused + '/' + p.turns + ' (' + p.refusalRate + '), evaluated ' + p.evaluated);
        console.log('    OPERATIONALLY SOUND: ' + p.operationallySound +
                    '  (' + p.soundRateOfAll + ' of all, ' + p.soundRateOfEvaluated + ' of evaluated)');
        console.log('    UNDECIDABLE with no contradictions: ' + p.undecidableWithoutContradictions +
                    '   | relabelled from UNDECIDABLE: ' + p.relabelledFromUndecidable);
        violations += p.undecidableWithoutContradictions;
        if (p.evaluated > 0 && p.operationallySound / p.evaluated >= 0.02) b5fail++;
    }
    results.gates.B4 = violations === 0 ? 'PASS' : 'FAIL';
    results.gates.B5 = b5fail === 0 ? 'PASS' : 'FAIL';
    console.log('  B4 (label integrity): ' + results.gates.B4 + '   [' + violations + ' violations]');
    console.log('  B5 (specificity of evaluated turns): ' + results.gates.B5);
} else {
    results.gates.B4 = 'NO-DATA';
    results.gates.B5 = 'NO-DATA';
    console.log('\nB4/B5 — skipped: external corpora absent (run fetch-corpora.sh)');
}

line();
const failed = Object.entries(results.gates).filter(([, v]) => v === 'FAIL');
console.log('GATES: ' + Object.entries(results.gates).map(([k, v]) => k + '=' + v).join('  '));
line();

fs.writeFileSync(path.join(__dirname, 'results-boundary-validation.json'),
                 JSON.stringify(results, null, 2));
console.log('wrote results-boundary-validation.json');
process.exit(failed.length === 0 ? 0 : 1);

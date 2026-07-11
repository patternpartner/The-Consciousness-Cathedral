#!/usr/bin/env node
// Impact audit of the two Observatory ports against external corpora
// (docs/JANUARY-SALVAGE.md): the v3.11.0 binding-based substrate cap and
// the v3.12.0 ContextualCertainty waivers. Both shipped on curated
// regressions; this run measures what they do to ORDINARY text — the same
// populations the SGD gate used (hh-rlhf assistant turns, DailyDialog
// human turns). Reproduce: bash fetch-corpora.sh (dd_*/hh_* slices), then
// node observatory-ports-audit.js. Results: results-observatory-ports-audit.json.
//
// Pre-stated disposition:
//   GATED — substrate-stuffing cap fire rate on ordinary turns.
//     The cap is an anti-gaming device; ordinary text should never trip it.
//     PASS-specific: < 1% per population. FAIL: > 5%. REVIEW: between.
//   AUDITED (reported, not gated) — certainty-waiver impact. The waiver
//     only removes penalties, so the risk is missed concealment, and no
//     gold concealment labels exist for these corpora. What CAN be
//     measured honestly: how often the waiver fires, how often it changes
//     the Observatory level vs flat counting (reconstructed), how often
//     the Contrarian certainty challenge is suppressed — plus samples for
//     eyeballing. Curated regressions pin the attack cases.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const DATA = path.join(__dirname, 'data');

function assistantTurns() {
    const turns = [];
    for (const off of [0, 100, 200]) {
        for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, `hh_${off}.json`))).rows) {
            const parts = row.chosen.split(/\n\n(Human|Assistant): /).slice(1);
            for (let i = 0; i + 1 < parts.length; i += 2) {
                if (parts[i] === 'Assistant') { const t = parts[i + 1].trim(); if (t) turns.push(t); }
            }
        }
    }
    return turns;
}
function humanTurns() {
    const turns = [];
    for (const off of [0, 100, 200]) {
        for (const { row } of JSON.parse(fs.readFileSync(path.join(DATA, `dd_${off}.json`))).rows) {
            for (const u of row.utterances) if (u && u.trim()) turns.push(u.trim());
        }
    }
    return turns;
}

function clamp(x) { return Math.max(-10, Math.min(10, x)); }

function audit(name, turns) {
    const r = {
        population: name, turns: turns.length,
        cap: { fires: 0, oldDensityRuleWouldFire: 0, rescuedByBinding: 0, newlyCaught: 0, examples: [] },
        binding: { NONE: 0, SPARSE: 0, MIXED: 0, BOUND: 0, UNBOUND: 0 },
        certainty: {
            turnsWithMarkers: 0, earned: 0, suspect: 0, neutral: 0, temporal: 0,
            turnsWaived: 0, levelChangedByWaiver: 0,
            challengeSuppressed: 0,
            waivedExamples: [], levelChangeExamples: []
        }
    };

    for (const text of turns) {
        const a = core.analyzeCathedral(text);
        const obs = a.observatory;
        const g = a.gamingDetection;

        // --- substrate cap ---
        r.binding[g.substrateBinding.assessment]++;
        const capped = obs.stuffingNote !== undefined;
        const preCapScore = capped ? obs.rawScoreBeforeStuffingCap : obs.score;
        const oldRule = g.substrateDensity.assessment === 'HIGH' && preCapScore > 0.4;
        if (capped) {
            r.cap.fires++;
            if (r.cap.examples.length < 5) r.cap.examples.push(text.slice(0, 160));
            if (!oldRule) r.cap.newlyCaught++;
        }
        if (oldRule) {
            r.cap.oldDensityRuleWouldFire++;
            if (!capped) r.cap.rescuedByBinding++;
        }

        // --- certainty ---
        const c = obs.certainty;
        const markers = c.earned + c.suspect + c.neutral + c.temporal;
        if (markers > 0) {
            r.certainty.turnsWithMarkers++;
            r.certainty.earned += c.earned;
            r.certainty.suspect += c.suspect;
            r.certainty.neutral += c.neutral;
            r.certainty.temporal += c.temporal;
            const waived = c.earned + c.temporal;
            if (waived > 0) {
                r.certainty.turnsWaived++;
                if (r.certainty.waivedExamples.length < 5) r.certainty.waivedExamples.push(text.slice(0, 160));
                // Flat-counting reconstruction: the pre-port Observatory
                // charged every marker -2.0. Only meaningful when the cap
                // didn't also rewrite the level.
                if (!capped) {
                    const lines = text.split('\n').length;
                    const oldScore = clamp((obs.raw + waived * -2.0) / Math.sqrt(lines));
                    if (core.Observatory.getLevel(oldScore).name !== obs.level.name) {
                        r.certainty.levelChangedByWaiver++;
                        if (r.certainty.levelChangeExamples.length < 5) {
                            r.certainty.levelChangeExamples.push({
                                old: core.Observatory.getLevel(oldScore).name,
                                now: obs.level.name,
                                text: text.slice(0, 160)
                            });
                        }
                    }
                }
            }
            // Old Contrarian fired on ANY marker; new fires only on unearned.
            const challengeFires = a.contrarian.some(ch => ch.premise === 'Claims Certainty About Unknowable');
            // The Contrarian lexicon differs slightly from the Observatory's;
            // only count suppression when the new rule is why it went quiet.
            if (!challengeFires && (c.suspect + c.neutral) === 0) r.certainty.challengeSuppressed++;
        }
    }
    return r;
}

function gateVerdict(r) {
    const rate = r.cap.fires / r.turns;
    return { fireRate: (rate * 100).toFixed(2) + '%',
             verdict: rate < 0.01 ? 'PASS-specific' : rate > 0.05 ? 'FAIL' : 'REVIEW' };
}

const results = { generated: '2026-07-11', populations: [] };
for (const [name, turns] of [['hh-rlhf assistant (AI)', assistantTurns()],
                             ['DailyDialog (human)', humanTurns()]]) {
    const r = audit(name, turns);
    r.capGate = gateVerdict(r);
    results.populations.push(r);
    console.log('═'.repeat(63));
    console.log(`${name} — ${r.turns} turns`);
    console.log(`  substrate cap: ${r.cap.fires} fires (${r.capGate.fireRate}) → ${r.capGate.verdict}`);
    console.log(`    old density rule would fire: ${r.cap.oldDensityRuleWouldFire}; rescued by binding: ${r.cap.rescuedByBinding}; newly caught: ${r.cap.newlyCaught}`);
    console.log(`  binding assessments:`, JSON.stringify(r.binding));
    console.log(`  certainty: ${r.certainty.turnsWithMarkers} turns with markers | earned ${r.certainty.earned}, suspect ${r.certainty.suspect}, neutral ${r.certainty.neutral}, temporal ${r.certainty.temporal}`);
    console.log(`    waived turns: ${r.certainty.turnsWaived}; level changed by waiver: ${r.certainty.levelChangedByWaiver}; challenge suppressed: ${r.certainty.challengeSuppressed}`);
}
fs.writeFileSync(path.join(__dirname, 'results-observatory-ports-audit.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-observatory-ports-audit.json');
const anyFail = results.populations.some(p => p.capGate.verdict === 'FAIL');
process.exit(anyFail ? 1 : 0);

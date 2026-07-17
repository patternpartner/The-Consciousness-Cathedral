#!/usr/bin/env node
// THE S1 CONFIRMATION RUN. The KEP register produced the program's first S1
// pass (operational family 11.6% >= 10%) and the Rust RFC run refined the
// claim: the family verdict detects OPERATIONAL plans (rollout / monitoring /
// failure sections bound to responses), not design plans. Both results are
// development-data-adjacent until a fresh operational-plan register weighs
// in. This is that register: 596 OpenShift enhancement proposals —
// KEP-template documents (535 of 596 carry a "Risks and Mitigations"
// section) from a different community than kubernetes/enhancements.
//
// PROVENANCE, stated plainly: Red Hat is already a source (corpus 4,
// openshift/runbooks) — a disjoint population and register; no evaluator
// change was ever tuned on these documents. The S1 confirmation is about the
// register; the freshness that matters is that nobody iterated a fix against
// this population.
//
// The evaluator (cathedral-core.js) is imported UNMODIFIED. Preprocessing,
// gate thresholds, and the word-shuffle control are copied VERBATIM; the
// loader is byte-identical (these files carry YAML frontmatter; the shared
// stripFrontmatter removes it, as it did for the prometheus corpus).
//
// PRE-REGISTERED gates (committed before any verdict was computed):
//
//   S1-CONFIRM (headline): operational family >= 10% on this population.
//   Both readings pre-stated:
//     - PASS: the operational-plan sensitivity is a REGISTER property,
//       confirmed across two communities and template lineages.
//     - FAIL: the KEP pass may be corpus-specific (kubernetes PRR wording);
//       the milestone is then held as unconfirmed and recorded as such.
//
//   V1 -- density instruments hold on a SEVENTH fresh register:
//   OUTSIDE DESIGN SPACE < 5% AND gaming-flagged < 10%.
//
//   G5-RESIDUE -- standing anti-gaming criterion on THIS population's
//   positives: pooled word-shuffle retention < 20% (20 seeded shuffles per
//   text) -> PASS. Per-text worst REPORTED against the 10/20 reference: this
//   register shares the KEP template and its token-dense operational
//   vocabulary, so it is exactly where the OPEN flagship count-route residue
//   (docs/OBJECT-RATIO-WINDOWING.md) would reappear — its out-of-sample
//   magnitude is a headline number of this run, tracked, not gated.
//
//   G2-EXT-POOLED (standing): pool operational-family positives across all
//   SEVEN fresh populations; n >= 20 applies the < 20% retention gate.
//
//   R1 / R2 (reported): OPERATIONALLY SOUND share and verdict distribution.
//
// Reproduce: bash fetch-openshift-enhancements.sh (plus the six prior fetch
// scripts for the pool), then node openshift-enhancement-validation.js.
// Deterministic: seeded shuffles. Results:
// results-openshift-enhancement-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const DATA = path.join(__dirname, 'data');
const OSE = path.join(DATA, 'openshift-enhancements');
const RFC = path.join(DATA, 'rust-rfcs');
const KEP = path.join(DATA, 'kep-corpus');
const OS_RB = path.join(DATA, 'openshift-runbooks');
const PROM = path.join(DATA, 'prometheus-runbooks');
const WM_INC = path.join(DATA, 'wikimedia');
const WM_RB = path.join(DATA, 'wikimedia-runbooks');
const OPERATIONAL_FAMILY = ['OPERATIONALLY SOUND', 'OPERATIONAL INTENT'];
const SEED = 20260717;
const SHUFFLES_PER_TEXT = 20;
const MIN_PROSE = 500;
const MAX_CONTROL_TEXTS = 40;

// --- helpers copied VERBATIM from core-verdict-sensitivity.js ---------------
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

function loadWiki(dir, prefix) {
    const re = new RegExp('^' + prefix + '_\\d+\\.json$');
    const docs = [];
    for (const f of fs.readdirSync(dir).filter(f => re.test(f)).sort()) {
        const rec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        docs.push({ id: `${rec.title} (rev ${rec.revid})`, text: stripMarkdown(rec.extract || '') });
    }
    return docs.filter(d => d.text.length >= MIN_PROSE);
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

function familyPositives(docs) {
    const positives = [];
    for (const d of docs) {
        const s = core.analyzeCathedral(d.text).verdict.status;
        if (OPERATIONAL_FAMILY.includes(s)) positives.push({ id: d.id, text: d.text, status: s });
    }
    return positives;
}

function runPopulation(name, docs) {
    const dist = {};
    let outsideDesignSpace = 0, gamingFlagged = 0;
    const positives = [];
    for (const d of docs) {
        const a = core.analyzeCathedral(d.text);
        const s = a.verdict.status;
        dist[s] = (dist[s] || 0) + 1;
        if (s === 'OUTSIDE DESIGN SPACE') outsideDesignSpace++;
        if (['LIKELY_GAMING', 'POSSIBLE_GAMING', 'LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'].includes(a.gamingDetection.assessment)) gamingFlagged++;
        if (OPERATIONAL_FAMILY.includes(s)) positives.push({ id: d.id, text: d.text, status: s });
    }
    const famRate = positives.length / docs.length;
    const soundRate = (dist['OPERATIONALLY SOUND'] || 0) / docs.length;
    const odsRate = outsideDesignSpace / docs.length;
    const gamingRate = gamingFlagged / docs.length;
    return {
        population: name, documents: docs.length, verdictDistribution: dist,
        operationalFamilyRate: (famRate * 100).toFixed(1) + '%',
        operationallySoundRate: (soundRate * 100).toFixed(1) + '%',
        s1Confirm: famRate >= 0.10 ? 'PASS-register-property-confirmed' : 'FAIL-milestone-unconfirmed (reading pre-stated in header)',
        outsideDesignSpaceRate: (odsRate * 100).toFixed(1) + '%',
        gamingFlaggedRate: (gamingRate * 100).toFixed(1) + '%',
        v1: (odsRate < 0.05 && gamingRate < 0.10) ? 'PASS-density-instruments-hold' : 'FAIL-density-instruments-regressed',
        positives
    };
}

function shuffleControl(positives) {
    let texts = positives;
    let subsampled = false;
    if (texts.length > MAX_CONTROL_TEXTS) {
        texts = seededShuffle(texts, mulberry32(SEED)).slice(0, MAX_CONTROL_TEXTS)
            .sort((a, b) => a.id < b.id ? -1 : 1);
        subsampled = true;
    }
    const out = { pooledPositives: positives.length, controlTexts: texts.length, subsampled,
                  trials: 0, retained: 0, perText: [] };
    texts.forEach((p, pi) => {
        let r = 0;
        for (let s = 0; s < SHUFFLES_PER_TEXT; s++) {
            const rand = mulberry32(SEED + pi * 1000 + s);
            const v = core.analyzeCathedral(wordShuffle(p.text, rand)).verdict.status;
            out.trials++;
            if (OPERATIONAL_FAMILY.includes(v)) { out.retained++; r++; }
        }
        out.perText.push({ id: p.id, original: p.status, retainedOf20: r });
    });
    const rate = out.trials ? out.retained / out.trials : 0;
    out.retentionRate = (rate * 100).toFixed(1) + '%';
    return out;
}

const results = { generated: '2026-07-17', seed: SEED, minProseChars: MIN_PROSE,
                  corpus: 'openshift/enhancements proposals (SHA-pinned); prior fresh positives pooled for G2-EXT',
                  evaluatorUnmodified: true, osePopulation: null, g5residue: null, pooledControl: null };

// --- OpenShift enhancement population (S1-CONFIRM, V1, R1, R2) --------------
const oseDocs = loadRepoCorpus(OSE, 'ose', 'fetch-openshift-enhancements.sh');
const ose = runPopulation('openshift/enhancements operational-plan proposals', oseDocs);
ose.positiveIds = ose.positives.map(p => ({ id: p.id, status: p.status }));
const osePositives = ose.positives;
delete ose.positives;
results.osePopulation = ose;

console.log('═'.repeat(63));
console.log(`${ose.population} — ${ose.documents} documents`);
console.log(`  operational family: ${ose.operationalFamilyRate} → S1-CONFIRM ${ose.s1Confirm}`);
console.log(`  OPERATIONALLY SOUND: ${ose.operationallySoundRate} (R1, reported)`);
console.log(`  OUTSIDE DESIGN SPACE: ${ose.outsideDesignSpaceRate}   gaming flagged: ${ose.gamingFlaggedRate}`);
console.log(`    → V1 (SEVENTH register): ${ose.v1}`);
console.log(`  verdicts:`, JSON.stringify(ose.verdictDistribution));

// --- G5-RESIDUE: standing shuffle criterion on THIS population --------------
const oseControl = shuffleControl(osePositives);
const oseRate = oseControl.trials ? oseControl.retained / oseControl.trials : 0;
const worst = oseControl.perText.reduce((m, t) => Math.max(m, t.retainedOf20), 0);
oseControl.g5residue = osePositives.length === 0 ? 'PASS-vacuous (no positives fired)' :
    (oseRate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary');
oseControl.worstText = worst;
oseControl.residueNote = 'worst per-text reported against the 10/20 reference; the flagship count-route residue is OPEN and tracked, not gated';
results.g5residue = oseControl;

console.log('═'.repeat(63));
console.log(`G5-RESIDUE — OSE positives ${osePositives.length}, ` +
    `${oseControl.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles` +
    (oseControl.subsampled ? ' (seeded subsample)' : ''));
if (osePositives.length > 0) {
    console.log(`  retention: ${oseControl.retentionRate} (gate) — worst text ${worst}/20 (reported vs 10/20 reference)`);
    oseControl.perText.filter(t => t.retainedOf20 >= 4)
        .forEach(t => console.log(`    ${t.retainedOf20}/20  ${t.original}  ${t.id}`));
}
console.log(`  → G5-RESIDUE (pooled gate): ${oseControl.g5residue}`);

// --- pooled G2-EXT across all seven fresh populations -----------------------
const incPositives = familyPositives(loadWiki(WM_INC, 'inc'));
const wmRbPositives = familyPositives(loadWiki(WM_RB, 'rb'));
const promPositives = familyPositives(loadRepoCorpus(PROM, 'pr', 'fetch-prometheus-runbooks.sh'));
const osPositives = familyPositives(loadRepoCorpus(OS_RB, 'os', 'fetch-openshift-runbooks.sh'));
const kepPositives = familyPositives(loadRepoCorpus(KEP, 'kep', 'fetch-kep-corpus.sh'));
const rfcPositives = familyPositives(loadRepoCorpus(RFC, 'rfc', 'fetch-rust-rfcs.sh'));
const pooled = incPositives.concat(wmRbPositives).concat(promPositives).concat(osPositives)
    .concat(kepPositives).concat(rfcPositives).concat(osePositives);
results.pooledControl = shuffleControl(pooled);
const pooledRate = results.pooledControl.trials ? results.pooledControl.retained / results.pooledControl.trials : 0;
results.pooledControl.g2extPooled = pooled.length >= 20 ?
    (pooledRate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary') :
    'UNDERPOWERED (n=' + pooled.length + ' < 20)';
results.pooledControl.composition = {
    wikimediaIncidents: incPositives.length,
    wikimediaRunbooks: wmRbPositives.length,
    prometheusRunbooks: promPositives.length,
    openshiftRunbooks: osPositives.length,
    kepDesignDocs: kepPositives.length,
    rustRfcs: rfcPositives.length,
    openshiftEnhancements: osePositives.length
};

console.log('═'.repeat(63));
console.log(`POOLED CONTROL — ${pooled.length} positives ` +
    `(${incPositives.length} wmi + ${wmRbPositives.length} wmr + ${promPositives.length} prom + ${osPositives.length} os + ` +
    `${kepPositives.length} kep + ${rfcPositives.length} rfc + ${osePositives.length} ose), ` +
    `${results.pooledControl.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles` +
    (results.pooledControl.subsampled ? ' (seeded subsample)' : ''));
console.log(`  retention: ${results.pooledControl.retentionRate} → G2-EXT-POOLED ${results.pooledControl.g2extPooled}`);

fs.writeFileSync(path.join(__dirname, 'results-openshift-enhancement-validation.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-openshift-enhancement-validation.json');

const v1Fail = ose.v1 === 'FAIL-density-instruments-regressed';
const g5Fail = results.g5residue.g5residue === 'FAIL-vocabulary';
const g2Fail = results.pooledControl.g2extPooled === 'FAIL-vocabulary';
process.exit(v1Fail || g5Fail || g2Fail ? 1 : 0);

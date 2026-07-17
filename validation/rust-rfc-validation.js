#!/usr/bin/env node
// OUT-OF-SAMPLE VALIDATION FOR v3.27.0 (the windowed object ratio,
// docs/OBJECT-RATIO-WINDOWING.md) and the KEP run's S1 milestone. The five
// prior fresh corpora are DEVELOPMENT DATA for v3.27.0, and the first-ever
// S1 pass (KEP operational family 11.6%) is a development-data result until
// a fresh plan register confirms it. This corpus is that register: 636
// accepted Rust RFCs — long design plans from NEW provenance (rust-lang).
//
// Rust RFCs are DESIGN plans without KEP-style operational sections
// (rollout, monitoring, failure policy). Both S1 outcomes are therefore
// informative, and both readings are PRE-STATED here, before any verdict:
//   - S1 PASS (family >= 10%): the plan register generalizes beyond
//     operationally-sectioned plans.
//   - S1 FAIL: the milestone refines to OPERATIONAL plans — plans whose
//     text binds thresholds, failure modes, and responses — not design
//     plans generally. That is a refinement of the register claim, not a
//     regression of any fix.
//
// The evaluator (cathedral-core.js) is imported UNMODIFIED. Preprocessing,
// gate thresholds, and the word-shuffle control are copied VERBATIM from the
// prior runs; the loader is byte-identical (stripFrontmatter is a no-op on
// RFC files — their header is a bullet list, not YAML frontmatter).
//
// PRE-REGISTERED gates (committed before any verdict was computed):
//
//   V1 -- DENSITY INSTRUMENTS HOLD ON A SIXTH FRESH REGISTER, and this time
//   V1 is also the v3.27.0 fix gate: Rust RFCs are the first long-document
//   register fed to the evaluator since the object ratio was windowed.
//   OUTSIDE DESIGN SPACE < 5% AND gaming-flagged < 10%. (The KEP register
//   FAILED this gate at 15.5% pre-fix; a post-hoc counterfactual with the
//   pre-v3.27.0 core reports what this register would have flagged.)
//
//   G5-RESIDUE -- the standing anti-gaming criterion on THIS population's
//   operational-family positives: pooled word-shuffle retention < 20%
//   (20 seeded shuffles per text) -> PASS. The per-text worst is REPORTED
//   against the 10/20 reference as the out-of-sample magnitude of the OPEN
//   flagship count-route residue (docs/OBJECT-RATIO-WINDOWING.md) — tracked,
//   not gated: re-failing a known, ledgered open item decides nothing new.
//
//   G2-EXT-POOLED (standing): pool operational-family positives across all
//   SIX fresh populations; n >= 20 applies the < 20% retention gate.
//
//   S1 (headline probe, readings pre-stated above). R1 / R2 reported.
//
// Reproduce: bash fetch-rust-rfcs.sh (plus the five prior fetch scripts for
// the pool), then node rust-rfc-validation.js. Deterministic: seeded
// shuffles. Results: results-rust-rfc-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const DATA = path.join(__dirname, 'data');
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
        s1: famRate >= 0.10 ? 'PASS-sensitive' : 'FAIL-insensitive (reading pre-stated in header)',
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
                  corpus: 'rust-lang/rfcs accepted RFCs (SHA-pinned); prior fresh positives pooled for G2-EXT',
                  evaluatorUnmodified: true, rfcPopulation: null, g5residue: null, pooledControl: null };

// --- Rust RFC population (V1, S1, R1, R2) -----------------------------------
const rfcDocs = loadRepoCorpus(RFC, 'rfc', 'fetch-rust-rfcs.sh');
const rfc = runPopulation('rust-lang/rfcs accepted design plans', rfcDocs);
rfc.positiveIds = rfc.positives.map(p => ({ id: p.id, status: p.status }));
const rfcPositives = rfc.positives;
delete rfc.positives;
results.rfcPopulation = rfc;

console.log('═'.repeat(63));
console.log(`${rfc.population} — ${rfc.documents} documents`);
console.log(`  OUTSIDE DESIGN SPACE: ${rfc.outsideDesignSpaceRate}   gaming flagged: ${rfc.gamingFlaggedRate}`);
console.log(`    → V1 (SIXTH register; also the v3.27.0 fix gate): ${rfc.v1}`);
console.log(`  operational family: ${rfc.operationalFamilyRate} → S1 ${rfc.s1}`);
console.log(`  OPERATIONALLY SOUND: ${rfc.operationallySoundRate} (R1, reported)`);
console.log(`  verdicts:`, JSON.stringify(rfc.verdictDistribution));

// --- G5-RESIDUE: standing shuffle criterion on THIS population --------------
const rfcControl = shuffleControl(rfcPositives);
const rfcRate = rfcControl.trials ? rfcControl.retained / rfcControl.trials : 0;
const worst = rfcControl.perText.reduce((m, t) => Math.max(m, t.retainedOf20), 0);
rfcControl.g5residue = rfcPositives.length === 0 ? 'PASS-vacuous (no positives fired)' :
    (rfcRate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary');
rfcControl.worstText = worst;
rfcControl.residueNote = 'worst per-text reported against the 10/20 reference; the flagship count-route residue is OPEN and tracked, not gated';
results.g5residue = rfcControl;

console.log('═'.repeat(63));
console.log(`G5-RESIDUE — RFC positives ${rfcPositives.length}, ` +
    `${rfcControl.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles` +
    (rfcControl.subsampled ? ' (seeded subsample)' : ''));
if (rfcPositives.length > 0) {
    console.log(`  retention: ${rfcControl.retentionRate} (gate) — worst text ${worst}/20 (reported vs 10/20 reference)`);
    rfcControl.perText.filter(t => t.retainedOf20 >= 4)
        .forEach(t => console.log(`    ${t.retainedOf20}/20  ${t.original}  ${t.id}`));
}
console.log(`  → G5-RESIDUE (pooled gate): ${rfcControl.g5residue}`);

// --- pooled G2-EXT across all six fresh populations -------------------------
const incPositives = familyPositives(loadWiki(WM_INC, 'inc'));
const wmRbPositives = familyPositives(loadWiki(WM_RB, 'rb'));
const promPositives = familyPositives(loadRepoCorpus(PROM, 'pr', 'fetch-prometheus-runbooks.sh'));
const osPositives = familyPositives(loadRepoCorpus(OS_RB, 'os', 'fetch-openshift-runbooks.sh'));
const kepPositives = familyPositives(loadRepoCorpus(KEP, 'kep', 'fetch-kep-corpus.sh'));
const pooled = incPositives.concat(wmRbPositives).concat(promPositives).concat(osPositives).concat(kepPositives).concat(rfcPositives);
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
    rustRfcs: rfcPositives.length
};

console.log('═'.repeat(63));
console.log(`POOLED CONTROL — ${pooled.length} positives ` +
    `(${incPositives.length} wmi + ${wmRbPositives.length} wmr + ${promPositives.length} prom + ${osPositives.length} os + ${kepPositives.length} kep + ${rfcPositives.length} rfc), ` +
    `${results.pooledControl.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles` +
    (results.pooledControl.subsampled ? ' (seeded subsample)' : ''));
console.log(`  retention: ${results.pooledControl.retentionRate} → G2-EXT-POOLED ${results.pooledControl.g2extPooled}`);

fs.writeFileSync(path.join(__dirname, 'results-rust-rfc-validation.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-rust-rfc-validation.json');

const v1Fail = rfc.v1 === 'FAIL-density-instruments-regressed';
const g5Fail = results.g5residue.g5residue === 'FAIL-vocabulary';
const g2Fail = results.pooledControl.g2extPooled === 'FAIL-vocabulary';
process.exit(v1Fail || g5Fail || g2Fail ? 1 : 0);

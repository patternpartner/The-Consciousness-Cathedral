#!/usr/bin/env node
// THE DESIGN-REGISTER REPLICATION. The Rust RFC run established "design plans
// don't fire" (family 0.5%, vs 11.6% on the mandated-operational-plan
// register) and named its own honest limit: the refinement is ONE register
// deep. This run replicates it on 735 Python Enhancement Proposals — design
// plans from a different community, language, and document format.
//
// The evaluator (cathedral-core.js) is imported UNMODIFIED. Seed, gate
// thresholds, and the word-shuffle control are copied VERBATIM. The ONE new
// degree of freedom, disclosed: PEPs are reStructuredText, so a minimal
// stripRst runs before the shared stripMarkdown — the RST analogue of the
// same furniture rules (drop the header field block, directive lines,
// section-underline lines, literal blocks; unwrap inline markup). It removes
// format furniture only; it adds nothing and rewrites no prose.
//
// PRE-REGISTERED gates (committed before any verdict was computed):
//
//   S-DESIGN (headline) — the replication, readings pre-stated:
//     - family <= 2%: "design plans don't fire" REPLICATES on a second
//       register (the Rust RFC rate was 0.5%; the human non-plan band is
//       0.0-2.0%).
//     - family >= 10%: the refinement BREAKS — the design/operational split
//       was corpus-specific, and the ledger says so.
//     - between: reported as measured; the refinement is weakened, not
//       confirmed, and the doc says exactly that.
//
//   V1 -- density instruments hold on a NINTH fresh register:
//   OUTSIDE DESIGN SPACE < 5% AND gaming-flagged < 10%.
//
//   G-STRUCT -- standing shuffle criterion on THIS population's positives:
//   pooled retention < 20% -> PASS; per-text worst REPORTED against the
//   10/20 reference (the open flagship residue, tracked, not gated).
//
//   G2-EXT-POOLED (standing): PEP positives join the HUMAN-register pool
//   (the machine-authored register stays excluded, as in its own run);
//   n >= 20 applies the < 20% retention gate.
//
//   R1 / R2 (reported).
//
// Reproduce: bash fetch-python-peps.sh (plus the prior fetch scripts for the
// pool), then node pep-validation.js. Deterministic: seeded shuffles.
// Results: results-pep-validation.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const DATA = path.join(__dirname, 'data');
const PEP = path.join(DATA, 'python-peps');
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
// The ONE corpus-specific step, disclosed: minimal RST furniture removal —
// the reStructuredText analogue of the stripMarkdown rules above.
//   1. Drop the PEP header field block (contiguous non-blank lines from the
//      start up to the first blank line: "PEP:", "Title:", "Author:", ...).
//   2. Drop directive lines (".. code-block::", ".. note::", comments).
//   3. Drop section-underline furniture lines (====, ----, ~~~~).
//   4. Drop literal blocks (lines indented >= 4 spaces — the RST analogue of
//      fenced code, which stripMarkdown drops for markdown).
//   5. Unwrap inline markup: ``literal`` -> literal, :role:`x` -> x,
//      `text <url>`_ -> text, trailing anchor underscores removed.
function stripRst(rst) {
    const firstBlank = rst.search(/\r?\n\s*\r?\n/);
    let body = firstBlank >= 0 ? rst.slice(firstBlank) : rst;
    return body
        .replace(/^\.\..*$/gm, ' ')
        .replace(/^[=\-~^"'`#*+]{3,}\s*$/gm, ' ')
        .replace(/^(?: {4,}|\t).*$/gm, ' ')
        .replace(/``([^`]+)``/g, '$1')
        .replace(/:[a-zA-Z-]+:`([^`]+)`/g, '$1')
        .replace(/`([^`<]+)<[^`>]*>`__?/g, '$1')
        .replace(/`([^`]+)`__?/g, '$1');
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
function loadPeps() {
    if (!fs.existsSync(PEP)) {
        console.error('No corpus at ' + PEP + '. Run: bash fetch-python-peps.sh');
        process.exit(2);
    }
    const docs = [];
    for (const f of fs.readdirSync(PEP).filter(f => /^pep_\d+\.json$/.test(f)).sort()) {
        const rec = JSON.parse(fs.readFileSync(path.join(PEP, f), 'utf8'));
        docs.push({ id: `${rec.title} @${(rec.ref || '').slice(0, 8)}`, text: stripMarkdown(stripRst(rec.markdown || '')) });
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

const pepDocs = loadPeps();
const dist = {};
let outsideDesignSpace = 0, gamingFlagged = 0;
const positives = [];
for (const d of pepDocs) {
    const a = core.analyzeCathedral(d.text);
    const s = a.verdict.status;
    dist[s] = (dist[s] || 0) + 1;
    if (s === 'OUTSIDE DESIGN SPACE') outsideDesignSpace++;
    if (['LIKELY_GAMING', 'POSSIBLE_GAMING', 'LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'].includes(a.gamingDetection.assessment)) gamingFlagged++;
    if (OPERATIONAL_FAMILY.includes(s)) positives.push({ id: d.id, text: d.text, status: s });
}
const famRate = positives.length / pepDocs.length;
const odsRate = outsideDesignSpace / pepDocs.length;
const gamingRate = gamingFlagged / pepDocs.length;
const sDesign = famRate <= 0.02 ? 'REPLICATES-design-plans-dont-fire' :
    famRate >= 0.10 ? 'BREAKS-refinement-was-corpus-specific' :
    'WEAKENED-between-pre-stated-bands (reported as measured)';

const results = { generated: '2026-07-17', seed: SEED, minProseChars: MIN_PROSE,
    corpus: 'python/peps pep-*.rst (SHA-pinned); minimal disclosed stripRst; human-register positives pooled for G2-EXT',
    evaluatorUnmodified: true,
    pepPopulation: {
        documents: pepDocs.length, verdictDistribution: dist,
        operationalFamilyRate: (famRate * 100).toFixed(1) + '%',
        operationallySoundRate: (100 * (dist['OPERATIONALLY SOUND'] || 0) / pepDocs.length).toFixed(1) + '%',
        outsideDesignSpaceRate: (odsRate * 100).toFixed(1) + '%',
        gamingFlaggedRate: (gamingRate * 100).toFixed(1) + '%',
        sDesign,
        v1: (odsRate < 0.05 && gamingRate < 0.10) ? 'PASS-density-instruments-hold' : 'FAIL-density-instruments-regressed',
        positiveIds: positives.map(p => ({ id: p.id, status: p.status }))
    },
    gStruct: null, pooledControl: null };

console.log('═'.repeat(63));
console.log(`python/peps design plans — ${pepDocs.length} documents`);
console.log(`  operational family: ${results.pepPopulation.operationalFamilyRate} → S-DESIGN ${sDesign}`);
console.log(`  OPERATIONALLY SOUND: ${results.pepPopulation.operationallySoundRate} (R1, reported)`);
console.log(`  OUTSIDE DESIGN SPACE: ${results.pepPopulation.outsideDesignSpaceRate}   gaming flagged: ${results.pepPopulation.gamingFlaggedRate}`);
console.log(`    → V1 (NINTH register): ${results.pepPopulation.v1}`);
console.log(`  verdicts:`, JSON.stringify(dist));

// --- G-STRUCT on the PEP positives ------------------------------------------
const pepControl = shuffleControl(positives);
const pepRate = pepControl.trials ? pepControl.retained / pepControl.trials : 0;
const worst = pepControl.perText.reduce((m, t) => Math.max(m, t.retainedOf20), 0);
pepControl.gStruct = positives.length === 0 ? 'PASS-vacuous (no positives fired)' :
    (pepRate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary');
pepControl.worstText = worst;
results.gStruct = pepControl;

console.log('═'.repeat(63));
console.log(`G-STRUCT — PEP positives ${positives.length}, ${pepControl.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles`);
if (positives.length > 0) {
    console.log(`  retention: ${pepControl.retentionRate} — worst text ${worst}/20 (reported vs 10/20 reference)`);
    pepControl.perText.filter(t => t.retainedOf20 >= 4)
        .forEach(t => console.log(`    ${t.retainedOf20}/20  ${t.original}  ${t.id}`));
}
console.log(`  → G-STRUCT: ${pepControl.gStruct}`);

// --- pooled G2-EXT across the eight HUMAN fresh populations -----------------
const pooled = familyPositives(loadWiki(WM_INC, 'inc'))
    .concat(familyPositives(loadWiki(WM_RB, 'rb')))
    .concat(familyPositives(loadRepoCorpus(PROM, 'pr', 'fetch-prometheus-runbooks.sh')))
    .concat(familyPositives(loadRepoCorpus(OS_RB, 'os', 'fetch-openshift-runbooks.sh')))
    .concat(familyPositives(loadRepoCorpus(KEP, 'kep', 'fetch-kep-corpus.sh')))
    .concat(familyPositives(loadRepoCorpus(RFC, 'rfc', 'fetch-rust-rfcs.sh')))
    .concat(familyPositives(loadRepoCorpus(OSE, 'ose', 'fetch-openshift-enhancements.sh')))
    .concat(positives);
results.pooledControl = shuffleControl(pooled);
const pooledRate = results.pooledControl.trials ? results.pooledControl.retained / results.pooledControl.trials : 0;
results.pooledControl.g2extPooled = pooled.length >= 20 ?
    (pooledRate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary') :
    'UNDERPOWERED (n=' + pooled.length + ' < 20)';

console.log('═'.repeat(63));
console.log(`POOLED CONTROL — ${pooled.length} positives across eight human registers, ` +
    `${results.pooledControl.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles` +
    (results.pooledControl.subsampled ? ' (seeded subsample)' : ''));
console.log(`  retention: ${results.pooledControl.retentionRate} → G2-EXT-POOLED ${results.pooledControl.g2extPooled}`);

fs.writeFileSync(path.join(__dirname, 'results-pep-validation.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-pep-validation.json');

const v1Fail = results.pepPopulation.v1 === 'FAIL-density-instruments-regressed';
const gFail = pepControl.gStruct === 'FAIL-vocabulary';
const g2Fail = results.pooledControl.g2extPooled === 'FAIL-vocabulary';
process.exit(v1Fail || gFail || g2Fail ? 1 : 0);

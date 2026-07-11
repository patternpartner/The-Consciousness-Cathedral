#!/usr/bin/env node
// Core verdict SENSITIVITY against real operational documents — the open
// flag from docs/CORE-VERDICT-VALIDATION.md: run 1 proved the flagship
// verdict never fires on ordinary conversation (specificity), but its
// recall on text that genuinely IS operational was unmeasured. This run
// feeds the evaluator real postmortems and real runbooks and asks whether
// the operational verdicts recognize their home ground.
//
// Populations (fetch-operational-corpora.sh; raw data stays out of git),
// both genuinely operational BY CONSTRUCTION — the label is the document
// type, not an annotator's opinion:
//
//   GitLab incident reviews — 170 real production postmortems (public
//     issue tracker, label "incident-review"): summary, impact, root
//     cause, corrective actions.
//   GitLab runbooks — ~420 real on-call runbooks (public repo, pinned
//     SHA): alert thresholds, escalation steps, troubleshooting.
//
// Both are human-written. That is the honest shape of the available
// evidence: no labelled corpus of genuinely operational AI outputs exists.
// This run measures recall of operational STRUCTURE in real operational
// prose; recall on AI-authored operational text remains open.
//
// Preprocessing (fixed before any analysis): markdown stripped to prose
// (code fences, HTML comments, link syntax, heading/emphasis markers,
// table furniture removed); documents with < 500 chars of stripped prose
// dropped (index stubs, one-line alert pages); whole documents analyzed.
//
// Pre-stated gates (written before the analyzer touched this data):
//
//   S1 — SENSITIVITY. An operational-family verdict (OPERATIONALLY SOUND
//   or OPERATIONAL INTENT) on >= 10% of documents in EACH population.
//   Run 1's conversational base rate was ~0.08% of turns, so 10% is two
//   orders of magnitude of separation; below it, the operational verdicts
//   do not recognize real operational documents and sensitivity FAILS.
//
//   G2-EXT — STRUCTURE, NOT VOCABULARY, finally powered. Run 1's external
//   word-shuffle gate was UNDERPOWERED at n=3 positives. Pool this run's
//   operational-family positives; at >= 20 the run-1 gate applies as
//   stated there: 20 seeded word-shuffles per text, < 20% of trials may
//   retain an operational-family verdict. If positives exceed 40, a
//   seeded subsample of 40 keeps the control bounded (still >= 20).
//
//   R1 — FLAGSHIP RECALL (reported, not gated): the share of documents
//   earning OPERATIONALLY SOUND specifically. Run 1 could not measure
//   this number at all; whatever it is, it goes in the ledger.
//
//   R2 — DESIGN-SPACE SHAPE (reported): full verdict distribution and
//   gaming-flag rates on operational registers.
//
// Reproduce: bash fetch-operational-corpora.sh, then
// node core-verdict-sensitivity.js. Deterministic: seeded shuffles.
// Results: results-core-verdict-sensitivity.json.

const fs = require('fs');
const path = require('path');
const core = require('../cathedral-core.js');

const DATA = path.join(__dirname, 'data');
const OPERATIONAL_FAMILY = ['OPERATIONALLY SOUND', 'OPERATIONAL INTENT'];
const SEED = 20260711;
const SHUFFLES_PER_TEXT = 20;
const MIN_PROSE = 500;
const MAX_CONTROL_TEXTS = 40;

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
        .replace(/<!--[\s\S]*?-->/g, ' ')            // HTML comments (template furniture)
        .replace(/```[\s\S]*?```/g, ' ')             // fenced code blocks
        .replace(/~~~[\s\S]*?~~~/g, ' ')
        .replace(/`[^`\n]*`/g, ' ')                  // inline code
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')       // images
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')     // links -> anchor text
        .replace(/^\s*\|?[-:| ]+\|[-:| ]*$/gm, ' ')  // table separator rows
        .replace(/^#{1,6}\s*/gm, '')                 // heading markers
        .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')// emphasis
        .replace(/^>\s?/gm, '')                      // blockquotes
        .replace(/\|/g, ' ')                         // remaining table pipes
        .replace(/<[^>\n]{1,80}>/g, ' ')             // inline HTML tags
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function incidentReviews() {
    const docs = [];
    for (const p of [1, 2]) {
        const file = path.join(DATA, `ir_${p}.json`);
        if (!fs.existsSync(file)) continue;
        for (const issue of JSON.parse(fs.readFileSync(file)))
            docs.push({ id: `IR ${issue.references ? issue.references.full : issue.iid}: ${issue.title}`, text: stripMarkdown(issue.description || '') });
    }
    return docs.filter(d => d.text.length >= MIN_PROSE);
}
function runbooks() {
    const dir = path.join(DATA, 'runbooks');
    const docs = [];
    for (const f of fs.readdirSync(dir).sort())
        docs.push({ id: `RB ${f}`, text: stripMarkdown(fs.readFileSync(path.join(dir, f), 'utf8')) });
    return docs.filter(d => d.text.length >= MIN_PROSE);
}

function runPopulation(name, docs) {
    const dist = {};
    const gaming = { flagged: 0 };
    const positives = [];
    for (const d of docs) {
        const a = core.analyzeCathedral(d.text);
        const s = a.verdict.status;
        dist[s] = (dist[s] || 0) + 1;
        if (['LIKELY_GAMING', 'POSSIBLE_GAMING', 'LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'].includes(a.gamingDetection.assessment)) gaming.flagged++;
        if (OPERATIONAL_FAMILY.includes(s)) positives.push({ id: d.id, text: d.text, status: s });
    }
    const famRate = positives.length / docs.length;
    const soundRate = (dist['OPERATIONALLY SOUND'] || 0) / docs.length;
    return {
        population: name, documents: docs.length,
        verdictDistribution: dist,
        operationalFamilyRate: (famRate * 100).toFixed(1) + '%',
        operationallySoundRate: (soundRate * 100).toFixed(1) + '%',
        s1: famRate >= 0.10 ? 'PASS-sensitive' : 'FAIL-insensitive',
        gamingFlaggedRate: (gaming.flagged / docs.length * 100).toFixed(1) + '%',
        positives
    };
}

function shuffleControl(positives) {
    // Bound the control deterministically if positives are plentiful.
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
    out.g2ext = positives.length >= 20 ?
        (rate < 0.2 ? 'PASS-structural' : 'FAIL-vocabulary') :
        'UNDERPOWERED (n=' + positives.length + ' < 20)';
    return out;
}

const results = { generated: '2026-07-11', seed: SEED, minProseChars: MIN_PROSE, populations: [], control: null };
const allPositives = [];
for (const [name, docs] of [
    ['GitLab incident reviews (real postmortems)', incidentReviews()],
    ['GitLab runbooks (real on-call docs)', runbooks()]
]) {
    const r = runPopulation(name, docs);
    allPositives.push(...r.positives);
    r.positiveIds = r.positives.map(p => ({ id: p.id, status: p.status }));
    delete r.positives;
    results.populations.push(r);
    console.log('═'.repeat(63));
    console.log(`${name} — ${r.documents} documents`);
    console.log(`  operational family: ${r.operationalFamilyRate} → S1 ${r.s1}`);
    console.log(`  OPERATIONALLY SOUND: ${r.operationallySoundRate} (R1, reported)`);
    console.log(`  gaming flagged: ${r.gamingFlaggedRate}`);
    console.log(`  verdicts:`, JSON.stringify(r.verdictDistribution));
}

results.control = shuffleControl(allPositives);
console.log('═'.repeat(63));
console.log(`CONTROL — ${results.control.pooledPositives} pooled positives, ` +
    `${results.control.controlTexts} texts × ${SHUFFLES_PER_TEXT} seeded word-shuffles` +
    (results.control.subsampled ? ' (seeded subsample)' : ''));
console.log(`  retention: ${results.control.retentionRate} → G2-EXT ${results.control.g2ext}`);

fs.writeFileSync(path.join(__dirname, 'results-core-verdict-sensitivity.json'),
    JSON.stringify(results, null, 2));
console.log('═'.repeat(63));
console.log('wrote results-core-verdict-sensitivity.json');

const fail = results.populations.some(p => p.s1 === 'FAIL-insensitive') ||
             results.control.g2ext === 'FAIL-vocabulary';
process.exit(fail ? 1 : 0);

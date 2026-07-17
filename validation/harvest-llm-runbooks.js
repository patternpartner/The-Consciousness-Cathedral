#!/usr/bin/env node
// HARVEST for the LLM-runbook run (docs/LLM-RUNBOOK-PREREG.md). Reads the raw
// generation-batch outputs (batch-1.txt … batch-8.txt in the directory given
// as argv[2], each the verbatim final output of one cold generation context),
// splits on the frozen delimiter, cross-checks every document against the
// frozen topic list, and writes corpus-llm-runbooks.json — the verbatim,
// committed reproducibility object. No text is edited, filtered, or reordered
// beyond the delimiter split; the no-cherry-pick rule lives here: every
// parsed document goes in, and any alert missing or unexpected is REPORTED.

const fs = require('fs');
const path = require('path');

const rawDir = process.argv[2];
if (!rawDir || !fs.existsSync(rawDir)) {
    console.error('usage: node harvest-llm-runbooks.js <dir with batch-N.txt>');
    process.exit(2);
}
const topics = require('./llm-runbook-topics.json');
const expected = new Set(topics.topics);

const documents = [];
const problems = [];
for (let b = 1; b <= 8; b++) {
    const f = path.join(rawDir, `batch-${b}.txt`);
    if (!fs.existsSync(f)) { problems.push(`batch ${b}: file missing`); continue; }
    const raw = fs.readFileSync(f, 'utf8');
    const parts = raw.split(/^===\s*RUNBOOK:\s*(.+?)\s*===\s*$/m);
    // parts: [preamble, name1, text1, name2, text2, ...]
    if (parts[0].trim()) problems.push(`batch ${b}: ${parts[0].trim().length} chars of non-runbook preamble (kept out of corpus, reported)`);
    for (let i = 1; i + 1 < parts.length; i += 2) {
        const alert = parts[i].trim().replace(/[`*]/g, '');
        const text = parts[i + 1].trim();
        if (!expected.has(alert)) problems.push(`batch ${b}: unexpected alert name "${alert}" (kept, reported)`);
        documents.push({ alert, batch: b, text });
    }
}
const got = new Set(documents.map(d => d.alert));
for (const t of topics.topics) if (!got.has(t)) problems.push(`missing: ${t}`);
const dupes = documents.map(d => d.alert).filter((a, i, arr) => arr.indexOf(a) !== i);
for (const d of new Set(dupes)) problems.push(`duplicate: ${d}`);

const out = {
    generated: '2026-07-17',
    generator: 'claude-sonnet-5, cold subagent contexts, 8 batches x 15 topics',
    template: 'frozen in docs/LLM-RUNBOOK-PREREG.md (committed before generation)',
    topicsFrom: 'llm-runbook-topics.json (seed 20260717, first 120 of 343)',
    harvestProblems: problems,
    documents,
};
fs.writeFileSync(path.join(__dirname, 'corpus-llm-runbooks.json'), JSON.stringify(out, null, 2));
console.log(`${documents.length} documents harvested from 8 batches → corpus-llm-runbooks.json`);
if (problems.length) { console.log('PROBLEMS (reported per the no-cherry-pick rule):'); problems.forEach(p => console.log('  - ' + p)); }

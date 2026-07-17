#!/usr/bin/env node
// TOPIC DERIVATION for the LLM-runbook run (docs/LLM-RUNBOOK-PREREG.md).
//
// The topic list must be MECHANICAL — the prompter for this run has read the
// entire repository, so any discretionary choice of topics is a contamination
// channel (prereg, channel 2). This script removes the discretion: the topics
// are the alert names of the two byte-pinned human runbook corpora the
// program has already evaluated, enumerated from git at the SAME pinned SHAs,
// deduped case-insensitively (openshift vendors some prometheus-operator
// alerts), sorted, seeded-shuffled with the program's standing seed, first
// 120 taken. No human hand picks a topic.
//
// The pairing is the point: the human corpora for these SAME alert names
// measured operational-family 1.6% (prometheus-operator, 62 effective docs)
// and 2.0% (openshift, 256 effective docs). Generating runbooks for the same
// alerts makes authorship the only variable.
//
// Output: llm-runbook-topics.json — committed BEFORE any generation.
// Reproduce: node derive-llm-runbook-topics.js (network: git clone of the two
// pinned repos; byte-stable by SHA).

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SEED = 20260717;           // the program's standing seed
const N_TOPICS = 120;

const SOURCES = [
    { repo: 'https://github.com/prometheus-operator/runbooks.git',
      sha: 'a685d14cf5128bb30e2bf935c3983decd772d885',
      pattern: /^content\/runbooks\/[^/]+\/(?!_index)([^/]+)\.md$/,
      name: 'prometheus-operator/runbooks' },
    { repo: 'https://github.com/openshift/runbooks.git',
      sha: '82bd2d9d3789e76f8a8202f8a9ee0f0639cc5b73',
      pattern: /^alerts\/.*\/(?!README)([^/]+)\.md$/,
      name: 'openshift/runbooks' },
];

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

const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'topics-'));
const byName = new Map();   // lowercase -> { alert, sources }
for (const src of SOURCES) {
    const dir = path.join(tmp, path.basename(src.repo, '.git') + '-' + src.sha.slice(0, 7));
    execSync(`git clone --quiet ${src.repo} ${dir}`, { stdio: 'pipe' });
    execSync(`git -C ${dir} checkout --quiet ${src.sha}`, { stdio: 'pipe' });
    const files = execSync(`git -C ${dir} ls-tree -r --name-only ${src.sha}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean);
    let count = 0;
    for (const f of files) {
        const m = f.match(src.pattern);
        if (!m) continue;
        count++;
        const alert = m[1];
        const key = alert.toLowerCase();
        if (!byName.has(key)) byName.set(key, { alert, sources: [] });
        byName.get(key).sources.push(src.name);
    }
    console.log(`${src.name} @ ${src.sha.slice(0, 8)}: ${count} alert pages`);
}
fs.rmSync(tmp, { recursive: true, force: true });

const pool = [...byName.values()].sort((a, b) => a.alert < b.alert ? -1 : 1);
const picked = seededShuffle(pool, mulberry32(SEED)).slice(0, N_TOPICS)
    .sort((a, b) => a.alert < b.alert ? -1 : 1);

const out = {
    generated: '2026-07-17', seed: SEED,
    rule: 'all alert basenames at the two pinned SHAs, deduped case-insensitively, sorted, seeded Fisher-Yates, first ' + N_TOPICS + ', re-sorted',
    sources: SOURCES.map(s => ({ name: s.name, sha: s.sha })),
    poolSize: pool.length,
    topics: picked.map(p => p.alert),
};
fs.writeFileSync(path.join(__dirname, 'llm-runbook-topics.json'), JSON.stringify(out, null, 2));
console.log(`pool ${pool.length} unique alert names → ${picked.length} topics → llm-runbook-topics.json`);

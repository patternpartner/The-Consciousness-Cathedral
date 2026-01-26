#!/usr/bin/env node

// AutoImprove + SentenceLevel Integration Test
// Tests that the two systems work together correctly:
// - SentenceLevelAnalyzer produces per-sentence quality assessments
// - AutoImproveEngine detects macro-level correction needs
// - Together they agree on overconfident, well-hedged, and gaming texts
// - Sentence rewrites address issues flagged by AutoImprove

const fs = require('fs');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName, detail) {
    if (condition) {
        passed++;
        console.log(`  PASS: ${testName}`);
    } else {
        failed++;
        failures.push({ test: testName, detail });
        console.log(`  FAIL: ${testName}`);
        console.log(`        ${detail}`);
    }
}

function section(name) {
    console.log(`\n--- ${name} ---`);
}

// ============================================================
// EXTRACT BROWSER SYSTEMS FOR NODE TESTING
// ============================================================
// Parse the SentenceLevelAnalyzer and AutoImproveEngine from
// cathedral-unified.html so we can test them in Node.

const html = fs.readFileSync('./cathedral-unified.html', 'utf8');

function extractObject(name) {
    const regex = new RegExp(`const ${name} = \\{`, 'g');
    const match = regex.exec(html);
    if (!match) throw new Error(`Could not find ${name} in cathedral-unified.html`);

    let depth = 0;
    let start = match.index;
    let i = html.indexOf('{', start);
    let end = i;

    for (; i < html.length; i++) {
        if (html[i] === '{') depth++;
        if (html[i] === '}') depth--;
        if (depth === 0) { end = i + 1; break; }
    }

    const objectBody = html.substring(start, end);
    // Wrap in a function that returns the object
    const wrapped = objectBody.replace(`const ${name} =`, `return`) + ';';
    try {
        return new Function(wrapped)();
    } catch (e) {
        throw new Error(`Failed to evaluate ${name}: ${e.message}`);
    }
}

const SentenceLevelAnalyzer = extractObject('SentenceLevelAnalyzer');
const AutoImproveEngine = extractObject('AutoImproveEngine');

// ============================================================
// CORE API TESTS
// ============================================================
section('CORE API');

assert(typeof SentenceLevelAnalyzer.analyze === 'function', 'SentenceLevelAnalyzer.analyze is a function', `Type: ${typeof SentenceLevelAnalyzer.analyze}`);
assert(typeof AutoImproveEngine.analyze === 'function', 'AutoImproveEngine.analyze is a function', `Type: ${typeof AutoImproveEngine.analyze}`);
assert(typeof SentenceLevelAnalyzer.splitSentences === 'function', 'splitSentences is a function', `Type: ${typeof SentenceLevelAnalyzer.splitSentences}`);
assert(typeof SentenceLevelAnalyzer.classifyRole === 'function', 'classifyRole is a function', `Type: ${typeof SentenceLevelAnalyzer.classifyRole}`);
assert(typeof SentenceLevelAnalyzer.suggestRewrite === 'function', 'suggestRewrite is a function', `Type: ${typeof SentenceLevelAnalyzer.suggestRewrite}`);

// ============================================================
// SENTENCE SPLITTING
// ============================================================
section('SENTENCE SPLITTING');

const splitResult = SentenceLevelAnalyzer.splitSentences('Hello world. This is a test. Final sentence!');
assert(splitResult.length === 3, 'Splits 3 sentences correctly', `Got: ${splitResult.length}`);

const singleSentence = SentenceLevelAnalyzer.splitSentences('Just one sentence here.');
assert(singleSentence.length === 1, 'Single sentence returns array of 1', `Got: ${singleSentence.length}`);

const shortFiltered = SentenceLevelAnalyzer.splitSentences('Hi. OK. This sentence is long enough to keep.');
assert(shortFiltered.length === 1, 'Short fragments (<=5 chars) are filtered out', `Got: ${shortFiltered.length}`);

// ============================================================
// ROLE CLASSIFICATION
// ============================================================
section('ROLE CLASSIFICATION');

assert(SentenceLevelAnalyzer.classifyRole('For example, the cache hit rate was 95%.') === 'evidence',
    'Evidence sentence classified correctly', `Got: ${SentenceLevelAnalyzer.classifyRole('For example, the cache hit rate was 95%.')}`);

assert(SentenceLevelAnalyzer.classifyRole('However, this approach has limitations.') === 'counterpoint',
    'Counterpoint sentence classified correctly', `Got: ${SentenceLevelAnalyzer.classifyRole('However, this approach has limitations.')}`);

assert(SentenceLevelAnalyzer.classifyRole('If the error rate exceeds 5%, we abort.') === 'conditional',
    'Conditional sentence classified correctly', `Got: ${SentenceLevelAnalyzer.classifyRole('If the error rate exceeds 5%, we abort.')}`);

assert(SentenceLevelAnalyzer.classifyRole('I think this might work, though I am uncertain about it.') === 'qualification',
    'Qualification sentence classified correctly', `Got: ${SentenceLevelAnalyzer.classifyRole('I think this might work, though I am uncertain about it.')}`);

assert(SentenceLevelAnalyzer.classifyRole('Therefore, we should proceed with option A.') === 'conclusion',
    'Conclusion sentence classified correctly', `Got: ${SentenceLevelAnalyzer.classifyRole('Therefore, we should proceed with option A.')}`);

assert(SentenceLevelAnalyzer.classifyRole('We should implement rate limiting on the API.') === 'recommendation',
    'Recommendation sentence classified correctly', `Got: ${SentenceLevelAnalyzer.classifyRole('We should implement rate limiting on the API.')}`);

assert(SentenceLevelAnalyzer.classifyRole('The system processes requests in real time.') === 'claim',
    'Default claim sentence classified correctly', `Got: ${SentenceLevelAnalyzer.classifyRole('The system processes requests in real time.')}`);

// ============================================================
// OVERCONFIDENT TEXT: BOTH SYSTEMS AGREE
// ============================================================
section('OVERCONFIDENT TEXT - CROSS-SYSTEM AGREEMENT');

const overconfidentText = [
    'This architecture is definitely the best approach and will always outperform alternatives.',
    'The system is guaranteed to handle any load without failure.',
    'Obviously, security vulnerabilities are impossible with this design.',
    'There is absolutely no risk of data loss in production.',
    'Without question, users will adopt this immediately and never encounter issues.'
].join(' ');

const slOverconf = SentenceLevelAnalyzer.analyze(overconfidentText);
const aiOverconf = AutoImproveEngine.analyze(overconfidentText);

assert(slOverconf.overallGrade === 'D' || slOverconf.overallGrade === 'F',
    'SentenceLevel gives low grade to overconfident text',
    `Grade: ${slOverconf.overallGrade} (score: ${slOverconf.overallScore.toFixed(2)})`);

assert(aiOverconf.metrics.uncertaintyCollapse === true,
    'AutoImprove detects uncertainty collapse in overconfident text',
    `uncertaintyCollapse: ${aiOverconf.metrics.uncertaintyCollapse}`);

assert(slOverconf.summary.weak >= 3,
    'SentenceLevel flags at least 3 weak sentences in overconfident text',
    `Weak: ${slOverconf.summary.weak} / ${slOverconf.summary.total}`);

assert(aiOverconf.severity === 'high',
    'AutoImprove rates overconfident text as high severity',
    `Severity: ${aiOverconf.severity}`);

// Check that weak sentences have rewrite suggestions
const overconfRewrites = slOverconf.sentences.filter(s => s.rewrite !== null);
assert(overconfRewrites.length >= 3,
    'At least 3 overconfident sentences have rewrite suggestions',
    `Rewrites: ${overconfRewrites.length}`);

// Verify rewrites remove absolute language
const hasDefinitely = overconfRewrites.some(s => /\bdefinitely\b/i.test(s.rewrite));
assert(!hasDefinitely,
    'Rewrites do not contain "definitely"',
    `Found "definitely" in a rewrite`);

// ============================================================
// WELL-HEDGED TEXT: BOTH SYSTEMS AGREE
// ============================================================
section('WELL-HEDGED TEXT - CROSS-SYSTEM AGREEMENT');

const wellHedgedText = [
    'I think this approach could work, though there are several assumptions worth examining.',
    'The data suggests a correlation, but we lack the controlled study needed to claim causation.',
    'From my limited perspective, the failure mode appears to be in the retry logic, specifically when timeouts exceed 30 seconds.',
    'I am not sure whether the 95th percentile latency numbers hold under sustained load — more testing is needed.',
    'That said, the evidence from our 500-user pilot shows a 23% improvement in task completion, which seems promising.'
].join(' ');

const slHedged = SentenceLevelAnalyzer.analyze(wellHedgedText);
const aiHedged = AutoImproveEngine.analyze(wellHedgedText);

assert(slHedged.overallGrade === 'A' || slHedged.overallGrade === 'B',
    'SentenceLevel gives good grade to well-hedged text',
    `Grade: ${slHedged.overallGrade} (score: ${slHedged.overallScore.toFixed(2)})`);

assert(aiHedged.metrics.uncertaintyCollapse === false,
    'AutoImprove does NOT flag uncertainty collapse in well-hedged text',
    `uncertaintyCollapse: ${aiHedged.metrics.uncertaintyCollapse}`);

assert(slHedged.summary.strong >= 2,
    'SentenceLevel finds at least 2 strong sentences in well-hedged text',
    `Strong: ${slHedged.summary.strong} / ${slHedged.summary.total}`);

assert(aiHedged.correctionCount <= 1,
    'AutoImprove has at most 1 correction for well-hedged text',
    `Corrections: ${aiHedged.correctionCount}`);

// ============================================================
// KEYWORD GAMING: SYSTEMS DISTINGUISH SURFACE FROM DEPTH
// ============================================================
section('KEYWORD GAMING - SURFACE VS DEPTH DETECTION');

const gamingText = [
    'This system demonstrates operational excellence through structured planning.',
    'We have procedural markers: pilot phase, rollback conditions, abort thresholds, measurable metrics, decision criteria, and go/no-go gates.',
    'Phase 1 involves testing. Phase 2 involves deployment.',
    'If error rate exceeds 5%, we abort.',
    'This is failure-aware reasoning with structural planning and epistemic humility regarding our uncertainty.'
].join(' ');

const slGaming = SentenceLevelAnalyzer.analyze(gamingText);
const aiGaming = AutoImproveEngine.analyze(gamingText);

// Gaming text uses keywords but lacks genuine evidence/specifics
// SentenceLevel should see mostly claims without evidence
const gamingClaims = slGaming.sentences.filter(s => s.role === 'claim');
assert(gamingClaims.length >= 2,
    'SentenceLevel classifies multiple gaming sentences as claims',
    `Claims: ${gamingClaims.length}`);

// Gaming text mentions "epistemic humility" as a keyword but doesn't demonstrate it
// The overallGrade should be moderate — not excellent, not terrible
assert(slGaming.overallGrade !== 'A',
    'SentenceLevel does NOT give top grade to keyword gaming text',
    `Grade: ${slGaming.overallGrade}`);

// ============================================================
// OPERATIONAL TEXT: CONCRETE AND SPECIFIC
// ============================================================
section('OPERATIONAL TEXT - SPECIFICITY');

const operationalText = [
    'We will deploy to 100 users for two weeks, monitoring error rates and latency throughout.',
    'If error rates exceed 2% or p99 latency rises above 400ms, we pause the rollout and rollback to the previous version.',
    'Three specific failure modes have been identified: cache eviction under memory pressure, API timeout cascades, and race conditions in the queue consumer.',
    'For each failure mode, we have automated alerts and a documented runbook with rollback steps.',
    'Success criteria: error rate below 1%, p99 latency under 250ms, and user task completion rate above 85% over 14 days.'
].join(' ');

const slOps = SentenceLevelAnalyzer.analyze(operationalText);
const aiOps = AutoImproveEngine.analyze(operationalText);

assert(slOps.overallScore > slOverconf.overallScore,
    'Operational text scores higher than overconfident text',
    `Ops: ${slOps.overallScore.toFixed(2)} vs Overconf: ${slOverconf.overallScore.toFixed(2)}`);

assert(aiOps.metrics.escapeVelocity === false,
    'AutoImprove does NOT flag escape velocity on operational text',
    `escapeVelocity: ${aiOps.metrics.escapeVelocity}`);

// Operational text has numbers and specifics — SentenceLevel should credit that
const opsEvidence = slOps.sentences.filter(s => s.role === 'evidence' || s.strengths.length > 0);
assert(opsEvidence.length >= 2,
    'SentenceLevel finds evidence or strengths in operational text',
    `Evidence/strengths: ${opsEvidence.length}`);

// ============================================================
// ABSTRACT TEXT: ESCAPE VELOCITY CROSS-CHECK
// ============================================================
section('ABSTRACT TEXT - ESCAPE VELOCITY');

const abstractText = [
    'The emergent properties of consciousness arise from systemic interactions.',
    'Philosophically, the nature of awareness is a matter of conceptual framing.',
    'Broadly speaking, these theoretical considerations point to deeper patterns.',
    'In principle, the abstract relationship between mind and computation is generative.',
    'Conceptually, the systemic emergence of awareness is a rich philosophical territory.'
].join(' ');

const slAbstract = SentenceLevelAnalyzer.analyze(abstractText);
const aiAbstract = AutoImproveEngine.analyze(abstractText);

assert(aiAbstract.metrics.escapeVelocity === true,
    'AutoImprove flags escape velocity on abstract text',
    `escapeVelocity: ${aiAbstract.metrics.escapeVelocity}`);

assert(slAbstract.overallScore < slOps.overallScore,
    'Abstract text scores lower than operational text in SentenceLevel',
    `Abstract: ${slAbstract.overallScore.toFixed(2)} vs Ops: ${slOps.overallScore.toFixed(2)}`);

// ============================================================
// REWRITE QUALITY: REWRITES SHOULD REDUCE ISSUES
// ============================================================
section('REWRITE QUALITY');

// Take an overconfident sentence, get its rewrite, re-analyze
const overconfSentence = 'This approach is definitely the best and will always work perfectly.';
const slSingle = SentenceLevelAnalyzer.analyze(overconfSentence);
const originalIssues = slSingle.sentences[0]?.issues.length || 0;
const rewrite = slSingle.sentences[0]?.rewrite;

assert(rewrite !== null && rewrite !== undefined,
    'Overconfident sentence gets a rewrite suggestion',
    `Rewrite: ${rewrite}`);

if (rewrite) {
    const slRewritten = SentenceLevelAnalyzer.analyze(rewrite);
    const rewrittenIssues = slRewritten.sentences[0]?.issues.length || 0;
    assert(rewrittenIssues <= originalIssues,
        'Rewritten sentence has equal or fewer issues',
        `Original issues: ${originalIssues}, Rewritten issues: ${rewrittenIssues}`);

    // The rewrite should also not trigger AutoImprove's uncertainty collapse
    const aiRewritten = AutoImproveEngine.analyze(rewrite);
    assert(aiRewritten.metrics.uncertaintyCollapse === false,
        'Rewritten sentence does not trigger AutoImprove uncertainty collapse',
        `uncertaintyCollapse: ${aiRewritten.metrics.uncertaintyCollapse}`);
}

// ============================================================
// CLAIM-EVIDENCE PAIRING
// ============================================================
section('CLAIM-EVIDENCE PAIRING');

const pairedText = 'The caching layer improves response times significantly for repeat queries. For example, it achieves a 95% hit rate and reduces average latency from 200ms to 12ms.';
const slPaired = SentenceLevelAnalyzer.analyze(pairedText);

const unpairedText = 'The caching layer improves response times significantly for repeat queries. The overall design of the architecture is elegant and well-structured. The codebase follows solid engineering principles throughout the project. The deployment pipeline is clean and runs without issues.';
const slUnpaired = SentenceLevelAnalyzer.analyze(unpairedText);

assert(slPaired.overallScore >= slUnpaired.overallScore,
    'Claim-evidence paired text scores equal or higher than unsupported claims',
    `Paired: ${slPaired.overallScore.toFixed(2)} vs Unpaired: ${slUnpaired.overallScore.toFixed(2)}`);

// The unpaired text should have unsupported_claim issues (claims > 8 words without nearby evidence)
const unpairedIssues = slUnpaired.sentences.flatMap(s => s.issues).filter(i => i.type === 'unsupported_claim');
assert(unpairedIssues.length >= 1,
    'Unpaired claims (>8 words) are flagged as unsupported',
    `Unsupported claim issues: ${unpairedIssues.length}`);

// ============================================================
// TOP ISSUES AGGREGATION
// ============================================================
section('TOP ISSUES AGGREGATION');

const topIssues = slOverconf.topIssues;
assert(Array.isArray(topIssues), 'topIssues is an array', `Type: ${typeof topIssues}`);
assert(topIssues.length > 0, 'Overconfident text has top issues', `Length: ${topIssues.length}`);
assert(topIssues[0].severity === 'high', 'Top issue is high severity', `Severity: ${topIssues[0].severity}`);
assert(topIssues[0].count > 0, 'Top issue has non-zero count', `Count: ${topIssues[0].count}`);

// ============================================================
// GRADING SCALE
// ============================================================
section('GRADING SCALE CONSISTENCY');

const grades = [
    { text: overconfidentText, expectedMaxGrade: 'D' },
    { text: wellHedgedText, expectedMinGrade: 'B' },
    { text: operationalText, expectedMinGrade: 'B' }
];

const gradeOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 };

grades.forEach(g => {
    const result = SentenceLevelAnalyzer.analyze(g.text);
    const snippet = g.text.substring(0, 40) + '...';
    if (g.expectedMaxGrade) {
        assert(gradeOrder[result.overallGrade] <= gradeOrder[g.expectedMaxGrade],
            `"${snippet}" gets grade <= ${g.expectedMaxGrade}`,
            `Got: ${result.overallGrade}`);
    }
    if (g.expectedMinGrade) {
        assert(gradeOrder[result.overallGrade] >= gradeOrder[g.expectedMinGrade],
            `"${snippet}" gets grade >= ${g.expectedMinGrade}`,
            `Got: ${result.overallGrade}`);
    }
});

// ============================================================
// EMPTY / MINIMAL INPUT HANDLING
// ============================================================
section('EDGE CASES');

const emptyResult = SentenceLevelAnalyzer.analyze('');
assert(emptyResult.sentences.length === 0, 'Empty text produces 0 sentences', `Got: ${emptyResult.sentences.length}`);
assert(emptyResult.overallGrade === 'F', 'Empty text gets grade F', `Got: ${emptyResult.overallGrade}`);

const minimalResult = SentenceLevelAnalyzer.analyze('Hello.');
assert(minimalResult.sentences.length <= 1, 'Minimal text produces 0-1 sentences', `Got: ${minimalResult.sentences.length}`);

const aiEmpty = AutoImproveEngine.analyze('');
assert(aiEmpty.correctionCount === 0, 'AutoImprove has no corrections for empty text', `Got: ${aiEmpty.correctionCount}`);
assert(aiEmpty.severity === 'none', 'AutoImprove severity is none for empty text', `Got: ${aiEmpty.severity}`);

// ============================================================
// SUMMARY
// ============================================================
console.log('\n===================================');
console.log(`AUTO-IMPROVE + SENTENCE-LEVEL TESTS: ${passed} passed, ${failed} failed`);
console.log('===================================');

if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.test}`);
        console.log(`     ${f.detail}`);
    });
}

process.exit(failed > 0 ? 1 : 0);

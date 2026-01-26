#!/usr/bin/env node

// AI Oracle Integration Test
// Tests the Embedded AI Oracle (19th system) integration:
// - Module loads correctly and exposes expected API
// - Prompt building incorporates Cathedral structural findings
// - Graceful degradation when API key is missing
// - Result summarization works correctly
// - HTML integration points exist in cathedral-unified.html

const fs = require('fs');
const AIOracle = require('./ai-oracle');

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

console.log('=== AI ORACLE INTEGRATION TESTS ===\n');

// ============================================================
// 1. MODULE STRUCTURE
// ============================================================
section('1. Module Structure');

const oracle = new AIOracle();
assert(typeof AIOracle === 'function', 'AIOracle is a constructor', 'Expected function');
assert(typeof oracle.analyze === 'function', 'oracle.analyze exists', 'Expected function');
assert(typeof oracle.buildPrompt === 'function', 'oracle.buildPrompt exists', 'Expected function');
assert(typeof oracle.isAvailable === 'function', 'oracle.isAvailable exists', 'Expected function');
assert(typeof oracle.summarize === 'function', 'oracle.summarize exists', 'Expected function');

// ============================================================
// 2. AVAILABILITY CHECK
// ============================================================
section('2. Availability Check');

const noKeyOracle = new AIOracle({ apiKey: null });
assert(noKeyOracle.isAvailable() === false, 'No key = not available', `Got ${noKeyOracle.isAvailable()}`);

const withKeyOracle = new AIOracle({ apiKey: 'sk-ant-test-key' });
assert(withKeyOracle.isAvailable() === true, 'With key = available', `Got ${withKeyOracle.isAvailable()}`);

// ============================================================
// 3. GRACEFUL DEGRADATION
// ============================================================
section('3. Graceful Degradation');

(async () => {
    const result = await noKeyOracle.analyze('test text', {});
    assert(result.status === 'unavailable', 'No key returns unavailable status', `Got: ${result.status}`);
    assert(typeof result.reason === 'string', 'Unavailable has reason', `Got: ${typeof result.reason}`);

    // ============================================================
    // 4. PROMPT BUILDING
    // ============================================================
    section('4. Prompt Building');

    const testText = 'I think this approach could work, though there are several assumptions worth examining.';
    const mockResults = {
        observatory: { score: 0.65 },
        justification: { score: 0.72 },
        failureMode: { score: 0.45 },
        temporal: { coherenceScore: 0.8 },
        bindings: { overallBindingScore: 0.55, claimSupportBound: 3, totalClaims: 5 },
        gamingDetection: { likelihood: 0.1 },
        parliament: { winningPattern: 'CAUTIOUS_GROUNDEDNESS', confidence: 0.73 },
        verdict: { status: 'CAUTIOUS_GROUNDEDNESS' },
        sovereignty: { depth: 'shallow' },
        blindSpot: { coveredCount: 5, totalPerspectives: 8 },
        autoImprove: { correctionCount: 1, severity: 'medium' },
        confidenceCalibrator: { overallCalibration: { score: 0.68 } },
        contrarian: { challenges: [{ challenge: 'Assumptions not listed' }] },
        sentenceLevel: {
            sentences: [
                { role: 'claim', issues: [] },
                { role: 'hedge', issues: [{ type: 'vague' }] }
            ]
        }
    };

    const prompt = withKeyOracle.buildPrompt(testText, mockResults);

    assert(prompt.includes(testText), 'Prompt includes input text', 'Input text not found');
    assert(prompt.includes('Observatory score: 0.65'), 'Prompt includes observatory', 'Observatory not found');
    assert(prompt.includes('Justification score: 0.72'), 'Prompt includes justification', 'Justification not found');
    assert(prompt.includes('Failure mode score: 0.45'), 'Prompt includes failure mode', 'Failure mode not found');
    assert(prompt.includes('Temporal coherence: 0.80'), 'Prompt includes temporal', 'Temporal not found');
    assert(prompt.includes('Structural binding: 0.55'), 'Prompt includes bindings', 'Bindings not found');
    assert(prompt.includes('Gaming likelihood: 10%'), 'Prompt includes gaming', 'Gaming not found');
    assert(prompt.includes('CAUTIOUS_GROUNDEDNESS'), 'Prompt includes parliament pattern', 'Parliament pattern not found');
    assert(prompt.includes('Blind spot coverage: 5/8'), 'Prompt includes blind spots', 'Blind spots not found');
    assert(prompt.includes('Auto-improve corrections: 1'), 'Prompt includes auto-improve', 'Auto-improve not found');
    assert(prompt.includes('Confidence calibration: 68%'), 'Prompt includes confidence', 'Confidence not found');
    assert(prompt.includes('Assumptions not listed'), 'Prompt includes contrarian', 'Contrarian not found');
    assert(prompt.includes('Sentence roles:'), 'Prompt includes sentence summary', 'Sentence summary not found');
    assert(prompt.includes('1 issues detected'), 'Prompt includes issue count', 'Issue count not found');
    assert(prompt.includes('semanticDepth'), 'Prompt requests semantic depth', 'Schema missing semanticDepth');
    assert(prompt.includes('genuineVsPerformative'), 'Prompt requests genuine/performative', 'Schema missing genuineVsPerformative');
    assert(prompt.includes('cathedralDialogue'), 'Prompt requests cathedral dialogue', 'Schema missing cathedralDialogue');
    assert(prompt.includes('blindSpots'), 'Prompt requests blind spots', 'Schema missing blindSpots');

    // 4b. Prompt handles empty results gracefully
    const emptyPrompt = withKeyOracle.buildPrompt('test', {});
    assert(typeof emptyPrompt === 'string', 'Empty results produces valid prompt', 'Not a string');
    assert(emptyPrompt.includes('test'), 'Empty results prompt includes text', 'Text missing');

    // ============================================================
    // 5. RESULT SUMMARIZATION
    // ============================================================
    section('5. Result Summarization');

    const mockOracleResult = {
        status: 'success',
        result: {
            semanticDepth: { score: 0.75, assessment: 'Genuine depth detected' },
            hiddenPatterns: { found: 2, patterns: [{ name: 'p1' }, { name: 'p2' }] },
            genuineVsPerformative: { assessment: 'GENUINE', confidence: 0.82 },
            cathedralDialogue: {
                agreements: ['Good structural analysis'],
                disagreements: ['Missed semantic nuance'],
                nuances: ['Context matters']
            },
            blindSpots: {
                cathedralMissed: ['Irony detection'],
                oracleLimits: ['Cannot verify factual claims']
            },
            overallInsight: 'The Oracle adds semantic depth the structural systems cannot reach.'
        }
    };

    const summary = oracle.summarize(mockOracleResult);
    assert(summary.available === true, 'Summary shows available', `Got: ${summary.available}`);
    assert(summary.semanticDepthScore === 0.75, 'Summary has depth score', `Got: ${summary.semanticDepthScore}`);
    assert(summary.genuineVsPerformative === 'GENUINE', 'Summary has genuine assessment', `Got: ${summary.genuineVsPerformative}`);
    assert(summary.genuineConfidence === 0.82, 'Summary has genuine confidence', `Got: ${summary.genuineConfidence}`);
    assert(summary.hiddenPatternsFound === 2, 'Summary counts hidden patterns', `Got: ${summary.hiddenPatternsFound}`);
    assert(summary.disagreementsWithCathedral === 1, 'Summary counts disagreements', `Got: ${summary.disagreementsWithCathedral}`);
    assert(summary.cathedralBlindSpots === 1, 'Summary counts cathedral blind spots', `Got: ${summary.cathedralBlindSpots}`);
    assert(summary.oracleLimitsAcknowledged === 1, 'Summary counts oracle limits', `Got: ${summary.oracleLimitsAcknowledged}`);
    assert(typeof summary.overallInsight === 'string', 'Summary has overall insight', `Got: ${typeof summary.overallInsight}`);

    // Summarize unavailable
    const unavailSummary = oracle.summarize({ status: 'unavailable', reason: 'no key' });
    assert(unavailSummary.available === false, 'Unavailable summary shows not available', `Got: ${unavailSummary.available}`);

    // Summarize error
    const errSummary = oracle.summarize({ status: 'error', reason: 'network' });
    assert(errSummary.available === false, 'Error summary shows not available', `Got: ${errSummary.available}`);

    // ============================================================
    // 6. HTML INTEGRATION VERIFICATION
    // ============================================================
    section('6. HTML Integration');

    const html = fs.readFileSync('./cathedral-unified.html', 'utf8');

    assert(html.includes('EmbeddedAIOracle'), 'HTML contains EmbeddedAIOracle engine', 'Engine not found');
    assert(html.includes('id="aiOraclePanel"'), 'HTML has Oracle panel div', 'Panel not found');
    assert(html.includes('id="aiOracleResults"'), 'HTML has Oracle results container', 'Results container not found');
    assert(html.includes('id="aiApiKey"'), 'HTML has API key input', 'API key input not found');
    assert(html.includes('id="aiModel"'), 'HTML has model selector', 'Model selector not found');
    assert(html.includes('id="aiEnabled"'), 'HTML has enabled checkbox', 'Enabled checkbox not found');
    assert(html.includes('id="aiStatusBadge"'), 'HTML has status badge', 'Status badge not found');
    assert(html.includes('displayAIOracle'), 'HTML has display function', 'Display function not found');
    assert(html.includes('initAIConfig'), 'HTML has init function', 'Init function not found');
    assert(html.includes('EMBEDDED AI ORACLE'), 'HTML has Oracle panel title', 'Panel title not found');
    assert(html.includes('Neural Semantic Layer'), 'HTML has Oracle subtitle', 'Subtitle not found');
    assert(html.includes('.ai-oracle'), 'CSS has ai-oracle class', 'CSS class not found');
    assert(html.includes('ai-oracle-thinking'), 'CSS has thinking animation', 'Thinking animation not found');
    assert(html.includes('ai-oracle-dialogue'), 'CSS has dialogue styles', 'Dialogue styles not found');

    // Verify Oracle is wired into analyzeText pipeline
    assert(html.includes('EmbeddedAIOracle.isAvailable()'), 'Oracle availability check in pipeline', 'Availability check not in pipeline');
    assert(html.includes('EmbeddedAIOracle.analyze('), 'Oracle analyze call in pipeline', 'Analyze call not in pipeline');

    // Verify Oracle panel appears before verdict (correct position)
    const oraclePanelPos = html.indexOf('id="aiOraclePanel"');
    const verdictPanelPos = html.indexOf('CATHEDRAL VERDICT');
    assert(oraclePanelPos < verdictPanelPos, 'Oracle panel positioned before verdict', 'Oracle panel should appear before verdict');

    // ============================================================
    // 7. CONFIGURATION PERSISTENCE
    // ============================================================
    section('7. Configuration Persistence');

    assert(html.includes('localStorage.setItem'), 'HTML persists to localStorage', 'localStorage.setItem not found');
    assert(html.includes('localStorage.getItem'), 'HTML reads from localStorage', 'localStorage.getItem not found');
    assert(html.includes('cathedral_ai_key'), 'Uses cathedral_ai_key storage key', 'Storage key not found');

    // ============================================================
    // 8. SECURITY CHECKS
    // ============================================================
    section('8. Security');

    assert(html.includes('type="password"'), 'API key input is password type', 'API key not hidden');
    assert(html.includes('anthropic-dangerous-direct-browser-access'), 'Uses browser access header', 'Browser access header not found');
    assert(html.includes('Key stored in localStorage only'), 'Privacy notice present', 'Privacy notice not found');

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n=== RESULTS ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    if (failures.length > 0) {
        console.log('\nFailures:');
        failures.forEach((f, i) => {
            console.log(`  ${i + 1}. ${f.test}: ${f.detail}`);
        });
    }
    console.log(`\nTotal: ${passed + failed} tests`);
    process.exit(failed > 0 ? 1 : 0);
})();

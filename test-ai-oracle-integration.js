#!/usr/bin/env node

// AI Oracle Integration Test
// Tests the Embedded AI Oracle (19th system) with multi-backend support:
// - Module loads correctly and exposes expected API
// - Ollama backend (default, free, no key) is properly configured
// - Anthropic backend works with API key
// - Prompt building incorporates Cathedral structural findings
// - Graceful degradation when backends unavailable
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

console.log('=== AI ORACLE INTEGRATION TESTS (Multi-Backend) ===\n');

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
assert(typeof oracle.callOllama === 'function', 'oracle.callOllama exists', 'Expected function');
assert(typeof oracle.callAnthropic === 'function', 'oracle.callAnthropic exists', 'Expected function');
assert(typeof oracle.parseResponse === 'function', 'oracle.parseResponse exists', 'Expected function');

// ============================================================
// 2. BACKEND DEFAULTS
// ============================================================
section('2. Backend Defaults');

const defaultOracle = new AIOracle();
assert(defaultOracle.backend === 'ollama', 'Default backend is ollama', `Got: ${defaultOracle.backend}`);
assert(defaultOracle.ollamaUrl === 'http://localhost:11434', 'Default Ollama URL', `Got: ${defaultOracle.ollamaUrl}`);
assert(defaultOracle.ollamaModel === 'llama3.2', 'Default Ollama model is llama3.2', `Got: ${defaultOracle.ollamaModel}`);

const customOracle = new AIOracle({
    backend: 'ollama',
    ollamaUrl: 'http://192.168.1.100:11434',
    ollamaModel: 'mistral'
});
assert(customOracle.ollamaUrl === 'http://192.168.1.100:11434', 'Custom Ollama URL', `Got: ${customOracle.ollamaUrl}`);
assert(customOracle.ollamaModel === 'mistral', 'Custom Ollama model', `Got: ${customOracle.ollamaModel}`);

const anthropicOracle = new AIOracle({ backend: 'anthropic', apiKey: 'sk-ant-test' });
assert(anthropicOracle.backend === 'anthropic', 'Anthropic backend set', `Got: ${anthropicOracle.backend}`);
assert(anthropicOracle.apiKey === 'sk-ant-test', 'API key set', `Got: ${anthropicOracle.apiKey}`);

// ============================================================
// 3. AVAILABILITY CHECK (Backend-aware)
// ============================================================
section('3. Availability Check');

const ollamaOracle = new AIOracle({ backend: 'ollama' });
assert(ollamaOracle.isAvailable() === true, 'Ollama always reports available (no key needed)', `Got ${ollamaOracle.isAvailable()}`);

const noKeyAnthropic = new AIOracle({ backend: 'anthropic', apiKey: null });
assert(noKeyAnthropic.isAvailable() === false, 'Anthropic without key = not available', `Got ${noKeyAnthropic.isAvailable()}`);

const withKeyAnthropic = new AIOracle({ backend: 'anthropic', apiKey: 'sk-ant-test-key' });
assert(withKeyAnthropic.isAvailable() === true, 'Anthropic with key = available', `Got ${withKeyAnthropic.isAvailable()}`);

// ============================================================
// 4. GRACEFUL DEGRADATION
// ============================================================
section('4. Graceful Degradation');

(async () => {
    const result = await noKeyAnthropic.analyze('test text', {});
    assert(result.status === 'unavailable', 'Anthropic no key returns unavailable status', `Got: ${result.status}`);
    assert(typeof result.reason === 'string', 'Unavailable has reason', `Got: ${typeof result.reason}`);

    // ============================================================
    // 5. PROMPT BUILDING
    // ============================================================
    section('5. Prompt Building');

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

    const prompt = ollamaOracle.buildPrompt(testText, mockResults);

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

    // Same prompt regardless of backend
    const anthropicPrompt = withKeyAnthropic.buildPrompt(testText, mockResults);
    assert(prompt === anthropicPrompt, 'Prompt is identical across backends', 'Prompts differ between backends');

    // 5b. Prompt handles empty results gracefully
    const emptyPrompt = ollamaOracle.buildPrompt('test', {});
    assert(typeof emptyPrompt === 'string', 'Empty results produces valid prompt', 'Not a string');
    assert(emptyPrompt.includes('test'), 'Empty results prompt includes text', 'Text missing');

    // ============================================================
    // 6. RESPONSE PARSING
    // ============================================================
    section('6. Response Parsing');

    const validJSON = '{"semanticDepth": {"score": 0.8}, "overallInsight": "test"}';
    const parsed = oracle.parseResponse(validJSON);
    assert(parsed.semanticDepth.score === 0.8, 'Parses valid JSON', `Got: ${JSON.stringify(parsed)}`);

    const fencedJSON = '```json\n{"semanticDepth": {"score": 0.5}}\n```';
    const parsedFenced = oracle.parseResponse(fencedJSON);
    assert(parsedFenced.semanticDepth.score === 0.5, 'Strips code fences', `Got: ${JSON.stringify(parsedFenced)}`);

    let parseError = false;
    try { oracle.parseResponse('not json at all'); } catch(e) { parseError = true; }
    assert(parseError, 'Throws on invalid JSON', 'Should have thrown');

    // ============================================================
    // 7. RESULT SUMMARIZATION
    // ============================================================
    section('7. Result Summarization');

    const mockOracleResult = {
        status: 'success',
        backend: 'ollama',
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
    assert(summary.backend === 'ollama', 'Summary includes backend', `Got: ${summary.backend}`);
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
    // 8. HTML INTEGRATION VERIFICATION
    // ============================================================
    section('8. HTML Integration');

    const html = fs.readFileSync('./cathedral-unified.html', 'utf8');

    assert(html.includes('EmbeddedAIOracle'), 'HTML contains EmbeddedAIOracle engine', 'Engine not found');
    assert(html.includes('id="aiOraclePanel"'), 'HTML has Oracle panel div', 'Panel not found');
    assert(html.includes('id="aiOracleResults"'), 'HTML has Oracle results container', 'Results container not found');
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

    // Verify Oracle panel appears before verdict
    const oraclePanelPos = html.indexOf('id="aiOraclePanel"');
    const verdictPanelPos = html.indexOf('CATHEDRAL VERDICT');
    assert(oraclePanelPos < verdictPanelPos, 'Oracle panel positioned before verdict', 'Oracle panel should appear before verdict');

    // ============================================================
    // 9. MULTI-BACKEND HTML VERIFICATION
    // ============================================================
    section('9. Multi-Backend HTML');

    // Backend selector
    assert(html.includes('id="aiBackend"'), 'HTML has backend selector', 'Backend selector not found');
    assert(html.includes('value="ollama"'), 'HTML has Ollama option', 'Ollama option not found');
    assert(html.includes('value="anthropic"'), 'HTML has Anthropic option', 'Anthropic option not found');

    // Ollama settings
    assert(html.includes('id="ollamaSettings"'), 'HTML has Ollama settings section', 'Ollama settings not found');
    assert(html.includes('id="ollamaUrl"'), 'HTML has Ollama URL input', 'Ollama URL not found');
    assert(html.includes('id="ollamaModel"'), 'HTML has Ollama model input', 'Ollama model not found');
    assert(html.includes('localhost:11434'), 'Default Ollama URL shown', 'Default URL not found');
    assert(html.includes('ollama.com'), 'Link to Ollama website', 'Ollama link not found');
    assert(html.includes('ollama pull'), 'Setup instructions shown', 'Setup instructions not found');

    // Anthropic settings (hidden by default)
    assert(html.includes('id="anthropicSettings"'), 'HTML has Anthropic settings section', 'Anthropic settings not found');
    assert(html.includes('id="aiApiKey"'), 'HTML has API key input', 'API key not found');
    assert(html.includes('id="aiModel"'), 'HTML has model selector', 'Model selector not found');
    assert(html.includes('id="aiEnabled"'), 'HTML has enabled checkbox', 'Enabled checkbox not found');

    // Backend switching
    assert(html.includes('onBackendChange'), 'HTML has backend change handler', 'Handler not found');

    // Ollama-specific engine methods
    assert(html.includes('callOllama'), 'Engine has callOllama method', 'callOllama not found');
    assert(html.includes('callAnthropic'), 'Engine has callAnthropic method', 'callAnthropic not found');
    assert(html.includes('getBackend'), 'Engine has getBackend method', 'getBackend not found');
    assert(html.includes('/api/chat'), 'Uses Ollama chat API endpoint', '/api/chat not found');
    assert(html.includes('/api/tags'), 'Pings Ollama tags for health check', '/api/tags not found');

    // Friendly error for Ollama offline
    assert(html.includes('OLLAMA OFFLINE'), 'Shows OLLAMA OFFLINE when unreachable', 'Offline message not found');
    assert(html.includes('ollama serve'), 'Shows ollama serve hint', 'serve hint not found');

    // ============================================================
    // 10. CONFIGURATION PERSISTENCE
    // ============================================================
    section('10. Configuration Persistence');

    assert(html.includes('localStorage.setItem'), 'HTML persists to localStorage', 'localStorage.setItem not found');
    assert(html.includes('localStorage.getItem'), 'HTML reads from localStorage', 'localStorage.getItem not found');
    assert(html.includes('cathedral_ai_key'), 'Persists Anthropic key', 'Anthropic key storage not found');
    assert(html.includes('cathedral_ai_backend'), 'Persists backend choice', 'Backend storage not found');
    assert(html.includes('cathedral_ollama_url'), 'Persists Ollama URL', 'Ollama URL storage not found');
    assert(html.includes('cathedral_ollama_model'), 'Persists Ollama model', 'Ollama model storage not found');

    // ============================================================
    // 11. SECURITY
    // ============================================================
    section('11. Security');

    assert(html.includes('type="password"'), 'API key input is password type', 'API key not hidden');
    assert(html.includes('anthropic-dangerous-direct-browser-access'), 'Uses browser access header for Anthropic', 'Browser access header not found');

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

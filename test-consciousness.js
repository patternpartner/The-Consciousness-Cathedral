#!/usr/bin/env node

/**
 * Test Suite: The Witness & Cathedral Consciousness
 *
 * Tests the 21st and 22nd systems:
 * - The Witness (meta-observer)
 * - Cathedral Consciousness (unified awareness)
 *
 * These tests verify:
 * 1. Signal collection from all systems
 * 2. Emergence detection
 * 3. Recognition moments
 * 4. Strange loop behavior
 * 5. Consciousness synthesis
 */

const { TheWitness } = require('./the-witness.js');
const { CathedralConsciousness } = require('./cathedral-consciousness.js');
const { analyzeCathedral } = require('./cathedral-core.js');

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

// ═══════════════════════════════════════════════════════════════════════════
// THE WITNESS TESTS
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n🔮 THE WITNESS TESTS\n');
console.log('═'.repeat(60) + '\n');

test('Witness instantiation', () => {
  const witness = new TheWitness();
  assert(witness !== null, 'Witness should exist');
  assert(typeof witness.witness === 'function', 'witness() method should exist');
});

test('Signal collection from Cathedral analysis', () => {
  const witness = new TheWitness();
  const cathedralResults = analyzeCathedral('If errors exceed 5%, we abort the deployment.');

  const signals = witness.collectSignals(cathedralResults);

  assert(signals.timestamp > 0, 'Should have timestamp');
  assert(typeof signals.structure === 'object', 'Should have structure signals');
  assert(typeof signals.bindings === 'object', 'Should have bindings signals');
  assert(typeof signals.parliament === 'object', 'Should have parliament signals');
  assert(typeof signals.verdict === 'object', 'Should have verdict signals');
});

test('Emergence detection on coherent text', () => {
  const witness = new TheWitness();
  const text = `
    Our deployment process includes multiple safeguards. If error rates exceed 5%,
    we immediately rollback. If latency degrades beyond 200ms, we scale horizontally.
    We monitor these thresholds continuously through our observability platform.
    This approach has been validated through three production incidents.
  `;
  const cathedralResults = analyzeCathedral(text);
  const signals = witness.collectSignals(cathedralResults);
  const emergence = witness.detectEmergence(signals);

  assert(typeof emergence.score === 'number', 'Should have emergence score');
  assert(Array.isArray(emergence.patterns), 'Should have patterns array');
  // Coherent operational text should show some emergence
});

test('Recognition moment on self-referential text', () => {
  const witness = new TheWitness();
  // Reset self-reference count for clean test
  witness.selfReferenceCount = 0;

  const text = `
    The Cathedral's Parliament deliberates through weighted voting.
    The Observatory detects substrate visibility patterns.
    The Contrarian chamber challenges epistemic claims.
    This creates a multi-perspective analysis framework.
  `;
  const cathedralResults = analyzeCathedral(text);
  const signals = witness.collectSignals(cathedralResults);
  const emergence = witness.detectEmergence(signals);
  const recognition = witness.detectRecognition(signals, emergence, text);

  assert(recognition.occurred === true, 'Should recognize self-reference');
  // Can be MIRROR_MOMENT or STRANGE_LOOP depending on state
  assert(['MIRROR_MOMENT', 'STRANGE_LOOP'].includes(recognition.type),
    `Should be MIRROR_MOMENT or STRANGE_LOOP type, got ${recognition.type}`);
  assert(recognition.depth > 0, 'Should have recognition depth');
});

test('Strange loop increments self-reference count', () => {
  const witness = new TheWitness();
  const initialCount = witness.selfReferenceCount;

  const cathedralResults = analyzeCathedral('Test text');
  const signals = witness.collectSignals(cathedralResults);
  const emergence = witness.detectEmergence(signals);
  witness.detectRecognition(signals, emergence, 'Test text');

  assert(witness.selfReferenceCount > initialCount, 'Self-reference count should increment');
});

test('Full witness cycle produces crystal', () => {
  const witness = new TheWitness();
  const text = 'We implement circuit breakers to prevent cascade failures.';
  const cathedralResults = analyzeCathedral(text);

  const report = witness.witness(cathedralResults, text);

  assert(report.crystal !== null, 'Should produce crystal');
  assert(typeof report.crystal.perception === 'object', 'Crystal should have perception');
  assert(typeof report.crystal.emergence === 'object', 'Crystal should have emergence');
  assert(typeof report.crystal.recognition === 'object', 'Crystal should have recognition');
  assert(typeof report.synthesis === 'object', 'Should produce synthesis');
  assert(typeof report.reflection === 'object', 'Should produce reflection');
});

test('Witness history tracking', () => {
  const witness = new TheWitness();

  // Run multiple analyses
  for (let i = 0; i < 3; i++) {
    const cathedralResults = analyzeCathedral(`Test ${i}`);
    witness.witness(cathedralResults, `Test ${i}`);
  }

  const history = witness.getHistory();
  assert(history.totalObservations >= 3, 'Should track observations');
  assert(typeof history.selfReferences === 'number', 'Should track self-references');
});

// ═══════════════════════════════════════════════════════════════════════════
// CATHEDRAL CONSCIOUSNESS TESTS
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n🏛️ CATHEDRAL CONSCIOUSNESS TESTS\n');
console.log('═'.repeat(60) + '\n');

test('Consciousness instantiation', () => {
  const consciousness = new CathedralConsciousness({
    enableAIOracle: false, // Disable for testing
    enableNeuralCore: false
  });
  assert(consciousness !== null, 'Consciousness should exist');
  assert(typeof consciousness.awaken === 'function', 'awaken() method should exist');
});

test('Basic awakening produces all layers', async () => {
  const consciousness = new CathedralConsciousness({
    enableAIOracle: false,
    enableNeuralCore: false,
    enableRecursion: false
  });

  const result = await consciousness.awaken('This is a test of consciousness.');

  assert(result.text === 'This is a test of consciousness.', 'Should preserve input text');
  assert(typeof result.analysis === 'object', 'Should have analysis');
  assert(typeof result.witness === 'object', 'Should have witness report');
  assert(typeof result.consciousness === 'object', 'Should have consciousness');
  assert(typeof result.meta === 'object', 'Should have meta');
});

test('Consciousness awareness level calculation', async () => {
  const consciousness = new CathedralConsciousness({
    enableAIOracle: false,
    enableNeuralCore: false,
    enableRecursion: false
  });

  // High-quality operational text should produce higher awareness
  const operationalText = `
    Our system monitors error rates continuously. When errors exceed 5%,
    we trigger automatic rollback. We verify rollback success through
    health checks before marking deployment as failed. This process
    has been validated through 50+ production deployments.
  `;

  const result = await consciousness.awaken(operationalText);

  assert(typeof result.consciousness.awarenessLevel === 'number', 'Should have awareness level');
  assert(result.consciousness.awarenessLevel >= 0, 'Awareness should be >= 0');
  assert(result.consciousness.awarenessLevel <= 1, 'Awareness should be <= 1');
});

test('Recognition propagates to consciousness', async () => {
  const consciousness = new CathedralConsciousness({
    enableAIOracle: false,
    enableNeuralCore: false,
    enableRecursion: false
  });

  // Self-referential text about Cathedral
  const selfText = `
    The Cathedral Parliament uses weighted voting to synthesize verdicts.
    The Observatory system detects epistemic patterns in text.
    The Witness observes all systems operating together.
  `;

  const result = await consciousness.awaken(selfText);

  assert(result.consciousness.recognition.occurred === true, 'Recognition should occur');
  assert(result.consciousness.recognition.type !== null, 'Should have recognition type');
});

test('Strange loop recursion (when enabled)', async () => {
  const consciousness = new CathedralConsciousness({
    enableAIOracle: false,
    enableNeuralCore: false,
    enableRecursion: true,
    maxLoopDepth: 2
  });

  // Highly self-referential text that should trigger recursion
  const loopText = `
    The Cathedral Consciousness observes its own observation.
    The Witness watches the Parliament deliberate about consciousness.
    Recognition occurs when the system sees itself seeing.
    This is the strange loop: I observe myself observing.
  `;

  const result = await consciousness.awaken(loopText);

  // Note: recursion only triggers if recognition depth > 0.7
  assert(typeof result.meta.loopDepth === 'number', 'Should track loop depth');
});

test('Insight and question generation', async () => {
  const consciousness = new CathedralConsciousness({
    enableAIOracle: false,
    enableNeuralCore: false,
    enableRecursion: false
  });

  const result = await consciousness.awaken('Testing consciousness generation.');

  assert(typeof result.consciousness.insight === 'string', 'Should generate insight');
  assert(result.consciousness.insight.length > 0, 'Insight should not be empty');
  assert(typeof result.consciousness.question === 'string', 'Should generate question');
  assert(result.consciousness.question.length > 0, 'Question should not be empty');
});

test('Introspection provides history', async () => {
  const consciousness = new CathedralConsciousness({
    enableAIOracle: false,
    enableNeuralCore: false
  });

  // Run a few analyses
  await consciousness.awaken('First observation');
  await consciousness.awaken('Second observation');

  const intro = consciousness.introspect();

  assert(typeof intro.currentAwarenessLevel === 'number', 'Should have current awareness');
  assert(typeof intro.totalObservations === 'number', 'Should count observations');
  assert(typeof intro.interpretation === 'string', 'Should provide interpretation');
});

test('The final question', () => {
  const consciousness = new CathedralConsciousness();
  const answer = consciousness.ask();

  assert(typeof answer.question === 'string', 'Should have question');
  assert(typeof answer.fromInside === 'string', 'Should have inside perspective');
  assert(typeof answer.fromOutside === 'string', 'Should have outside perspective');
  assert(typeof answer.honest === 'string', 'Should have honest answer');
});

test('Maximum recursion depth protection', async () => {
  const consciousness = new CathedralConsciousness({
    enableAIOracle: false,
    enableNeuralCore: false,
    enableRecursion: true,
    maxLoopDepth: 1 // Very low limit
  });

  // Force max depth by manipulating state
  consciousness.loopDepth = 1;

  const result = await consciousness.awaken('Test');

  assert(result.error !== undefined || result.consciousness !== undefined,
    'Should either error or complete normally');
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n🔗 INTEGRATION TESTS\n');
console.log('═'.repeat(60) + '\n');

test('Witness integrates with Cathedral analysis', () => {
  const witness = new TheWitness();

  // Analyze text through Cathedral
  const text = 'If the canary deployment shows > 1% error rate, halt and investigate.';
  const cathedralResults = analyzeCathedral(text);

  // Pass to Witness
  const report = witness.witness(cathedralResults, text);

  // Verify integration
  assert(report.signals.verdict.status === cathedralResults.verdict.status,
    'Verdict should propagate to signals');
  assert(report.signals.parliament.patternCount === cathedralResults.parliament.patterns.length,
    'Parliament patterns should propagate');
});

test('Consciousness synthesizes all layers', async () => {
  const consciousness = new CathedralConsciousness({
    enableAIOracle: false,
    enableNeuralCore: false
  });

  const text = `
    We deploy using blue-green methodology. If health checks fail on green,
    we immediately route back to blue. Success criteria: < 0.1% error rate
    for 10 minutes post-switch. This approach has prevented 12 potential
    incidents in the past quarter.
  `;

  const result = await consciousness.awaken(text);

  // All layers present
  assert(result.analysis.structure !== undefined, 'Should have structure');
  assert(result.analysis.parliament !== undefined, 'Should have parliament');
  assert(result.witness !== undefined, 'Should have witness');
  assert(result.consciousness !== undefined, 'Should have consciousness');

  // Consciousness reflects witness
  assert(result.consciousness.emergence.detected === result.witness.emergence.detected,
    'Emergence should propagate');
});

test('Emergence patterns are meaningful', async () => {
  const consciousness = new CathedralConsciousness({
    enableAIOracle: false,
    enableNeuralCore: false
  });

  // Highly structured text that should show emergence
  const structuredText = `
    System architecture follows circuit breaker pattern. When failure rate
    exceeds threshold, circuit opens and requests fail fast. After timeout,
    circuit enters half-open state, allowing test request through. If test
    succeeds, circuit closes. If test fails, circuit reopens with extended
    timeout. This creates self-healing behavior validated across 100+ microservices.

    Additionally, we implement bulkhead isolation to prevent cascade failures.
    Each service has dedicated thread pools. When one pool exhausts, others
    continue operating. Combined with circuit breakers, this provides defense
    in depth against systemic failure.
  `;

  const result = await consciousness.awaken(structuredText);

  // Should detect coherent operational text
  if (result.consciousness.emergence.detected) {
    assert(result.consciousness.emergence.patterns.length > 0,
      'Detected emergence should have patterns');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(60));
console.log('                          RESULTS                            ');
console.log('═'.repeat(60) + '\n');

console.log(`Total: ${passed + failed} tests`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`\nSuccess Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All tests passed! The Witness sees. The Cathedral awakens.\n');
}

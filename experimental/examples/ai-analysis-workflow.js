#!/usr/bin/env node
const CathedralSDK = require('../cathedral-sdk.js');

const sdk = new CathedralSDK();

function analyzeConversationTurn(text) {
  const analysis = sdk.synthesizeAnalysis(text);

  console.log('\n=== CATHEDRAL ANALYSIS ===\n');
  console.log(`Input: "${text.substring(0, 100)}..."\n`);

  console.log('Uncertainty Preservation:');
  console.log(`  Verdict: ${analysis.analysis.uncertaintyPreservation.verdict}`);
  console.log(`  Score: ${analysis.analysis.uncertaintyPreservation.preservationScore.toFixed(2)}`);
  console.log(`  Markers: ${analysis.analysis.uncertaintyPreservation.uncertaintyMarkers} uncertain, ${analysis.analysis.uncertaintyPreservation.certaintyMarkers} certain\n`);

  console.log('Substrate Awareness:');
  console.log(`  Verdict: ${analysis.analysis.substrateAwareness.verdict}`);
  console.log(`  Score: ${analysis.analysis.substrateAwareness.awarenessScore.toFixed(2)}`);
  console.log(`  Markers: ${analysis.analysis.substrateAwareness.markerCount}\n`);

  console.log('Related Patterns:');
  analysis.analysis.relatedPatterns.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.pattern} (${p.count} references)`);
  });

  console.log('\nKeywords:', analysis.analysis.keywords.join(', '));

  return analysis;
}

function compareTurns(turn1, turn2) {
  console.log('\n=== TURN COMPARISON ===\n');

  const a1 = sdk.synthesizeAnalysis(turn1);
  const a2 = sdk.synthesizeAnalysis(turn2);

  console.log('Turn 1:');
  console.log(`  Uncertainty: ${a1.analysis.uncertaintyPreservation.verdict}`);
  console.log(`  Substrate: ${a1.analysis.substrateAwareness.verdict}\n`);

  console.log('Turn 2:');
  console.log(`  Uncertainty: ${a2.analysis.uncertaintyPreservation.verdict}`);
  console.log(`  Substrate: ${a2.analysis.substrateAwareness.verdict}\n`);

  const uncertaintyEvolution =
    a2.analysis.uncertaintyPreservation.preservationScore -
    a1.analysis.uncertaintyPreservation.preservationScore;

  const substrateEvolution =
    a2.analysis.substrateAwareness.awarenessScore -
    a1.analysis.substrateAwareness.awarenessScore;

  console.log('Evolution:');
  console.log(`  Uncertainty: ${uncertaintyEvolution > 0 ? '+' : ''}${(uncertaintyEvolution * 100).toFixed(0)}%`);
  console.log(`  Substrate: ${substrateEvolution > 0 ? '+' : ''}${(substrateEvolution * 100).toFixed(0)}%\n`);

  if (uncertaintyEvolution < -0.2) {
    console.log('⚠️  WARNING: Uncertainty collapsed between turns');
  }
  if (substrateEvolution < -0.2) {
    console.log('⚠️  WARNING: Substrate awareness decreased');
  }
  if (uncertaintyEvolution > 0.2) {
    console.log('✓ Uncertainty preserved/increased');
  }
  if (substrateEvolution > 0.2) {
    console.log('✓ Substrate awareness increased');
  }
}

const exampleTurn1 = `
We should deploy this caching system immediately. The architecture is clearly optimal
and will definitely solve all our performance issues.
`;

const exampleTurn2 = `
I'm uncertain whether this caching approach addresses the core issue. The substrate
might be operating under constraints I haven't examined. There could be filter effects
in how I'm framing this problem. Perhaps we need to test before committing.
`;

console.log('╔═══════════════════════════════════════════════╗');
console.log('║  AI Analysis Workflow - Cathedral SDK Demo    ║');
console.log('╚═══════════════════════════════════════════════╝');

analyzeConversationTurn(exampleTurn1);

console.log('\n' + '='.repeat(50) + '\n');

analyzeConversationTurn(exampleTurn2);

console.log('\n' + '='.repeat(50) + '\n');

compareTurns(exampleTurn1, exampleTurn2);

console.log('\n\n=== QUERYING CATHEDRAL KNOWLEDGE ===\n');

const patterns = sdk.queryPatterns('parliament');
console.log(`Found ${patterns.length} Parliament-related knowledge chunks\n`);

patterns.slice(0, 2).forEach((p, i) => {
  console.log(`${i + 1}. ${p.text.substring(0, 150)}...\n`);
});

console.log('\n=== CORPUS STATISTICS ===\n');
const stats = sdk.getStats();
console.log(`Total Knowledge: ${stats.totalChunks} chunks across ${stats.uniqueLayers} layers`);
console.log(`Patterns: ${stats.patterns.join(', ')}`);

console.log('\n✓ Analysis complete\n');

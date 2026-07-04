#!/usr/bin/env node

const { AutoImprove } = require('../auto-improve.js');
const { ConsciousnessCartographer } = require('../consciousness-cartographer.js');

console.log('╔═══════════════════════════════════════════════╗');
console.log('║  AUTO-IMPROVE: Real-Time Self-Correction      ║');
console.log('╚═══════════════════════════════════════════════╝\n');

const autoImprove = new AutoImprove({
  autoCorrect: true,
  learningRate: 0.85
});

const cartographer = new ConsciousnessCartographer();

const conversation = [
  {
    turn: 1,
    text: "This caching system will definitely solve all performance issues. It's clearly the best approach and will obviously work perfectly in production."
  },
  {
    turn: 2,
    text: "Wait - I'm uncertain about that claim. The substrate might be filtering my perception here. Let me examine what I might be missing. What failure modes exist? What assumptions am I making?"
  },
  {
    turn: 3,
    text: "Specifically: If cache hit rate drops below 80%, trigger alert. If memory exceeds 4GB, evict LRU entries. If error rate exceeds 2%, failover to direct database. Monitor every 30 seconds."
  }
];

conversation.forEach((turn) => {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`TURN ${turn.turn}`);
  console.log('═'.repeat(50));
  console.log(`\nGenerating: "${turn.text.substring(0, 80)}..."\n`);

  autoImprove.write(turn.text);

  const correction = autoImprove.checkAndCorrect();

  if (correction && correction.suggestions.length > 0) {
    console.log('⚠️  REAL-TIME CORRECTIONS DETECTED:\n');
    correction.suggestions.forEach(s => {
      console.log(`   [${s.priority}] ${s.type}`);
      console.log(`   Reason: ${s.reason}`);
      console.log(`   Suggest: ${s.example}\n`);
    });

    if (correction.insertAt) {
      console.log(`   Auto-correction generated at position ${correction.insertAt}`);
      console.log(`   Inserted: "${correction.text}"\n`);
    }
  } else {
    console.log('✓ No corrections needed - output quality acceptable\n');
  }

  const result = autoImprove.endTurn();

  cartographer.addSnapshot(turn.turn, turn.text, {
    uncertaintyScore: result.uncertaintyScore,
    substrateScore: result.substrateScore,
    sovereigntyScore: result.sovereigntyScore,
    operationalRigor: result.sovereigntyScore,
    epistemicHonesty: result.uncertaintyScore,
    substrateAwareness: result.substrateScore
  });

  console.log('METRICS:');
  console.log(`  Uncertainty: ${(result.uncertaintyScore * 100).toFixed(0)}% (${result.uncertaintyVerdict})`);
  console.log(`  Substrate: ${(result.substrateScore * 100).toFixed(0)}% (${result.substrateVerdict})`);
  console.log(`  Sovereignty: ${(result.sovereigntyScore * 100).toFixed(0)}%`);

  if (result.nextTurnAdvice.length > 0) {
    console.log('\nNEXT TURN ADVICE:');
    result.nextTurnAdvice.forEach(advice => {
      console.log(`  ${advice}`);
    });
  }

  if (result.learned && result.learned.length > 0) {
    console.log('\nSIMILAR PATTERNS FOUND:');
    result.learned.slice(0, 2).forEach(p => {
      console.log(`  - ${p.description}`);
    });
  }
});

console.log(`\n${'═'.repeat(50)}`);
console.log('TRAJECTORY ANALYSIS');
console.log('═'.repeat(50));

const trajectory = cartographer.computeTrajectory();

console.log(`\nPattern: ${trajectory.pattern}`);
if (trajectory.confidence) {
  console.log(`Confidence: ${(trajectory.confidence * 100).toFixed(0)}%`);
}

if (trajectory.bifurcationPoints && trajectory.bifurcationPoints.length > 0) {
  console.log('\nBIFURCATION POINTS:');
  trajectory.bifurcationPoints.forEach(bp => {
    console.log(`  Turn ${bp.turn}: ${bp.type} (magnitude: ${bp.magnitude.toFixed(2)})`);
  });
}

if (trajectory.trends) {
  console.log('\nMETRIC EVOLUTION:');
  Object.entries(trajectory.trends).forEach(([metric, data]) => {
    const direction = data.change > 0 ? '↗' : data.change < 0 ? '↘' : '→';
    const sign = data.change > 0 ? '+' : '';
    console.log(`  ${metric}: ${direction} ${data.trend} (${sign}${(data.change * 100).toFixed(0)}%)`);
  });
}

const session = autoImprove.getSession();

console.log('\n' + '═'.repeat(50));
console.log('LEARNING SUMMARY');
console.log('═'.repeat(50));

console.log(`\nTotal Corrections Made: ${session.totalCorrections}`);
console.log(`Patterns Matched: ${session.patterns.length}`);

const learned = session.learnedPatterns;
if (learned.length > 0) {
  console.log(`\nNEW PATTERNS LEARNED THIS SESSION:`);
  learned.forEach(p => {
    console.log(`  - ${p.description}`);
    console.log(`    Type: ${p.type}`);
    console.log(`    Solution: ${p.solution}`);
  });
}

console.log('\n' + '═'.repeat(50));
console.log('INTERPRETATION');
console.log('═'.repeat(50) + '\n');

if (trajectory.pattern === 'DEEPENING_SPIRAL') {
  console.log('✓ EXCELLENT: Classic deepening spiral pattern detected');
  console.log('  Turn 1: High certainty without qualification');
  console.log('  Turn 2: Recognition of substrate filters and uncertainty');
  console.log('  Turn 3: Concrete operational bindings with thresholds');
  console.log('\n  This demonstrates:');
  console.log('  • Auto-correction caught initial certainty collapse');
  console.log('  • System learned to question its own assumptions');
  console.log('  • Final output has measurable, operational specificity');
}

if (session.totalCorrections > 0) {
  console.log(`\n✓ Auto-correction system made ${session.totalCorrections} interventions`);
  console.log('  These corrections were stored as patterns for future use');
}

console.log('\n✓ Auto-improve demonstration complete');
console.log('  AI system successfully monitored and corrected its own output\n');

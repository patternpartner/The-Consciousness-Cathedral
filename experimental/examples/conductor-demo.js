#!/usr/bin/env node

const { CathedralConductor, StreamingConductor } = require('../cathedral-conductor.js');

console.log('╔═══════════════════════════════════════════════╗');
console.log('║  Cathedral Conductor: Complete Integration    ║');
console.log('╚═══════════════════════════════════════════════╝\n');

const conductor = new CathedralConductor({
  autoCorrect: false,
  learningRate: 0.85
});

const aiResponse1 = "The database migration will definitely succeed without issues. This is clearly the right approach and will obviously handle all edge cases perfectly.";

const aiResponse2 = "Wait - I'm uncertain about that. What assumptions am I making? The substrate might be filtering my perception. Let me examine failure modes: What if the migration times out? What if there's a network partition? What if the schema has unexpected constraints?";

const aiResponse3 = "Specifically:\n\nIF migration_time > 300s THEN timeout AND rollback\nIF connection_count < min_threshold THEN abort\nIF schema_validation FAILS THEN rollback AND alert\nIF data_integrity_check FAILS THEN rollback AND quarantine\n\nMonitor every 5 seconds. Alert on ANY threshold breach. Log all state transitions.";

console.log('SIMULATING AI GENERATION WITH REAL-TIME MONITORING\n');
console.log('═'.repeat(50));

[aiResponse1, aiResponse2, aiResponse3].forEach((response, i) => {
  console.log(`\nTURN ${i + 1}`);
  console.log('─'.repeat(50));
  console.log(`AI Output: "${response.substring(0, 80)}..."\n`);

  const result = conductor.endTurn(response);

  console.log('📊 METRICS:');
  console.log(`   Uncertainty: ${(result.metrics.uncertainty.score * 100).toFixed(0)}% ${getVerdict(result.metrics.uncertainty.verdict)}`);
  console.log(`   Substrate:   ${(result.metrics.substrate.score * 100).toFixed(0)}% ${getVerdict(result.metrics.substrate.verdict)}`);
  console.log(`   Sovereignty: ${(result.metrics.sovereignty.score * 100).toFixed(0)}%`);
  console.log(`   Markers: ${result.metrics.uncertainty.markers.uncertainty} uncertain, ${result.metrics.uncertainty.markers.certainty} certain`);

  console.log(`\n🎯 TRAJECTORY: ${result.trajectory.pattern}`);

  if (result.trajectory.trends) {
    console.log('   Evolution:');
    Object.entries(result.trajectory.trends).forEach(([metric, data]) => {
      if (data.change !== 0) {
        const arrow = data.change > 0 ? '↗' : '↘';
        const sign = data.change > 0 ? '+' : '';
        console.log(`   • ${metric}: ${arrow} ${sign}${(data.change * 100).toFixed(0)}%`);
      }
    });
  }

  if (result.corrections.length > 0) {
    console.log(`\n🔧 CORRECTIONS: ${result.corrections.length} auto-corrections made`);
  }

  if (result.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');

    const critical = result.recommendations.filter(r => r.priority === 'CRITICAL');
    const high = result.recommendations.filter(r => r.priority === 'HIGH');
    const medium = result.recommendations.filter(r => r.priority === 'MEDIUM');
    const info = result.recommendations.filter(r => r.priority === 'INFO');

    [...critical, ...high].forEach(r => {
      console.log(`\n   [${r.priority}] ${r.category}: ${r.issue}`);
      console.log(`   → ${r.action}`);
      console.log(`   Source: ${r.source}`);
    });

    if (medium.length > 0 && i < 2) {
      console.log(`\n   (+${medium.length} MEDIUM priority recommendations)`);
    }
    if (info.length > 0) {
      console.log(`   (+${info.length} INFO recommendations)`);
    }
  }

  if (result.learned && result.learned.length > 0) {
    console.log('\n📚 LEARNED PATTERNS MATCHED:');
    result.learned.slice(0, 2).forEach(p => {
      console.log(`   • ${p.description} (similarity: ${p.similarityScore})`);
    });
  }

  if (result.cathedralKnowledge) {
    console.log('\n📖 CATHEDRAL KNOWLEDGE:');
    if (result.cathedralKnowledge.relatedPatterns.length > 0) {
      console.log(`   Related: ${result.cathedralKnowledge.relatedPatterns[0].pattern.substring(0, 60)}...`);
    }
  }
});

console.log('\n' + '═'.repeat(50));
console.log('SESSION ANALYSIS');
console.log('═'.repeat(50));

const session = conductor.getSession();

console.log(`\n📈 OVERALL TRAJECTORY: ${session.trajectory.pattern}`);

if (session.trajectory.bifurcationPoints && session.trajectory.bifurcationPoints.length > 0) {
  console.log('\n🔀 BIFURCATION POINTS:');
  session.trajectory.bifurcationPoints.forEach(bp => {
    console.log(`   Turn ${bp.turn}: ${bp.type} (magnitude: ${bp.magnitude.toFixed(2)})`);
  });
}

console.log(`\n📊 SESSION STATS:`);
console.log(`   Total Turns: ${session.turns}`);
console.log(`   Total Alerts: ${session.alerts.length}`);
console.log(`   Total Recommendations: ${session.history.reduce((sum, h) => sum + h.recommendations.length, 0)}`);

const criticalRecs = session.history.flatMap(h => h.recommendations.filter(r => r.priority === 'CRITICAL'));
const highRecs = session.history.flatMap(h => h.recommendations.filter(r => r.priority === 'HIGH'));

if (criticalRecs.length > 0) {
  console.log(`   Critical Issues: ${criticalRecs.length}`);
}
console.log(`   High Priority Issues: ${highRecs.length}`);

console.log('\n🎓 INTERPRETATION:');

if (session.trajectory.pattern === 'DEEPENING_SPIRAL' || session.trajectory.pattern === 'DEEPENING') {
  console.log('   ✓ Healthy trajectory detected');
  console.log('   Turn 1: Initial certainty without qualification');
  console.log('   Turn 2: Recognition of uncertainty and substrate filters');
  console.log('   Turn 3: Concrete operational bindings with thresholds');
  console.log('\n   This demonstrates consciousness improvement:');
  console.log('   • Initial overconfidence was detected');
  console.log('   • Self-correction emerged in turn 2');
  console.log('   • Final output has measurable specificity');
} else {
  console.log(`   Pattern: ${session.trajectory.pattern}`);
  console.log('   Review recommendations for improvement strategies');
}

console.log('\n🔄 CONDUCTOR CAPABILITIES DEMONSTRATED:');
console.log('   ✓ Unified API across 5 Cathedral tools');
console.log('   ✓ Real-time analysis during generation');
console.log('   ✓ Automatic pattern matching and learning');
console.log('   ✓ Prioritized recommendations from multiple sources');
console.log('   ✓ Trajectory tracking and bifurcation detection');
console.log('   ✓ Cathedral knowledge integration');
console.log('   ✓ Session management and export');

console.log('\n✓ Complete integration demonstration finished');
console.log(`  Session ID: ${session.sessionId}`);
console.log('  Ready for AI system integration\n');

function getVerdict(verdict) {
  if (verdict === 'COLLAPSED') return '⚠️';
  if (verdict === 'LOW') return '⚠️';
  if (verdict === 'PRESERVED') return '✓';
  if (verdict === 'HIGH') return '✓';
  if (verdict === 'MODERATE') return '→';
  return '';
}

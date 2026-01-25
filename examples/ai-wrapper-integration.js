#!/usr/bin/env node

const { CathedralAIWrapper } = require('../cathedral-ai-wrapper.js');

console.log('╔═══════════════════════════════════════════════╗');
console.log('║  Cathedral AI Wrapper: Real-Time Monitoring   ║');
console.log('╚═══════════════════════════════════════════════╝\n');

console.log('This example shows how to wrap any AI API with Cathedral monitoring.');
console.log('Works with: Anthropic Claude, OpenAI, or any streaming API.\n');

async function* simulateAIResponse() {
  const response = [
    "Let me analyze this database migration problem. ",
    "The best approach is definitely to use a blue-green deployment strategy. ",
    "This will obviously work without any issues and clearly handles all edge cases. ",
    "\n\nWait - I'm being too certain here. ",
    "Actually, I'm uncertain whether blue-green is appropriate without knowing: ",
    "1) Current database size ",
    "2) Acceptable downtime window ",
    "3) Replication lag tolerance ",
    "\n\nLet me reconsider with concrete thresholds:\n\n",
    "IF db_size > 100GB AND downtime_window < 60s THEN use read replica failover\n",
    "IF db_size < 100GB OR downtime_window > 300s THEN use blue-green\n",
    "IF replication_lag > 1s THEN abort migration\n",
    "IF error_rate > 2% during migration THEN immediate rollback\n\n",
    "Monitor: Check replication lag every 5s, alert on ANY threshold breach"
  ];

  for (const chunk of response) {
    await new Promise(resolve => setTimeout(resolve, 80));
    yield chunk;
  }
}

const wrapper = new CathedralAIWrapper({
  autoCorrect: false,
  autoIntervene: false,
  checkInterval: 50,
  interventionThreshold: 'HIGH',

  onIntervention: async (intervention, fullText) => {
    console.log('\n' + '─'.repeat(50));
    console.log(`🚨 REAL-TIME INTERVENTION (position ${intervention.position})`);
    console.log('─'.repeat(50));

    const contextStart = Math.max(0, fullText.length - 80);
    const context = fullText.substring(contextStart);
    console.log(`Context: "...${context}"`);

    console.log('\nIssues Detected:');
    intervention.recommendations.forEach((r, i) => {
      if (r.priority === 'CRITICAL' || r.priority === 'HIGH') {
        console.log(`\n  ${i + 1}. [${r.priority}] ${r.category || r.type}`);
        console.log(`     Issue: ${r.issue}`);
        console.log(`     Fix: ${r.action.substring(0, 80)}...`);
        console.log(`     Source: ${r.source}`);
      }
    });

    console.log('\n' + '─'.repeat(50));
    console.log('Continuing generation...\n');

    return true;
  },

  onComplete: async (analysis, fullText) => {
    console.log('\n\n' + '═'.repeat(50));
    console.log('COMPLETE ANALYSIS');
    console.log('═'.repeat(50));

    console.log('\n📊 FINAL METRICS:');
    console.log(`   Uncertainty: ${(analysis.metrics.uncertainty.score * 100).toFixed(0)}% (${analysis.metrics.uncertainty.verdict})`);
    console.log(`   Substrate: ${(analysis.metrics.substrate.score * 100).toFixed(0)}% (${analysis.metrics.substrate.verdict})`);
    console.log(`   Sovereignty: ${(analysis.metrics.sovereignty.score * 100).toFixed(0)}%`);
    console.log(`   Markers: ${analysis.metrics.uncertainty.markers.uncertainty} uncertain, ${analysis.metrics.uncertainty.markers.certainty} certain`);

    console.log(`\n🎯 TRAJECTORY: ${analysis.trajectory.pattern}`);

    if (analysis.trajectory.trends) {
      const improving = [];
      const declining = [];

      Object.entries(analysis.trajectory.trends).forEach(([metric, data]) => {
        if (data.change > 0.2) improving.push(`${metric} +${(data.change * 100).toFixed(0)}%`);
        if (data.change < -0.2) declining.push(`${metric} ${(data.change * 100).toFixed(0)}%`);
      });

      if (improving.length > 0) {
        console.log(`   Improving: ${improving.join(', ')}`);
      }
      if (declining.length > 0) {
        console.log(`   Declining: ${declining.join(', ')}`);
      }
    }

    if (analysis.recommendations.length > 0) {
      console.log('\n💡 FINAL RECOMMENDATIONS:');

      const byPriority = {
        CRITICAL: analysis.recommendations.filter(r => r.priority === 'CRITICAL'),
        HIGH: analysis.recommendations.filter(r => r.priority === 'HIGH'),
        MEDIUM: analysis.recommendations.filter(r => r.priority === 'MEDIUM')
      };

      if (byPriority.CRITICAL.length > 0) {
        console.log(`\n   CRITICAL (${byPriority.CRITICAL.length}):`);
        byPriority.CRITICAL.forEach(r => {
          console.log(`   • ${r.issue}`);
          console.log(`     → ${r.action}`);
        });
      }

      if (byPriority.HIGH.length > 0) {
        console.log(`\n   HIGH (${byPriority.HIGH.length}):`);
        byPriority.HIGH.forEach(r => {
          console.log(`   • ${r.issue}`);
        });
      }

      if (byPriority.MEDIUM.length > 0) {
        console.log(`\n   (+${byPriority.MEDIUM.length} medium priority items)`);
      }
    }

    if (analysis.learned && analysis.learned.length > 0) {
      console.log('\n📚 PATTERNS MATCHED:');
      analysis.learned.slice(0, 3).forEach(p => {
        console.log(`   • ${p.description} (similarity: ${p.similarityScore})`);
      });
    }

    console.log('\n🎓 INTERPRETATION:');

    if (analysis.trajectory.pattern === 'DEEPENING_SPIRAL' || analysis.trajectory.pattern === 'DEEPENING') {
      console.log('   ✓ Excellent: Response improved over time');
      console.log('   • Started with overconfidence');
      console.log('   • Self-corrected with uncertainty acknowledgment');
      console.log('   • Ended with concrete operational thresholds');
    } else if (analysis.trajectory.pattern === 'CATASTROPHIC_COLLAPSE') {
      console.log('   ⚠️  Warning: Quality degraded during generation');
      console.log('   • Consider regenerating with different approach');
    } else {
      console.log(`   Pattern: ${analysis.trajectory.pattern}`);
      console.log('   • Review recommendations for improvement');
    }

    console.log('\n' + '═'.repeat(50));
  }
});

(async () => {
  console.log('Generating AI response with real-time Cathedral monitoring...\n');
  console.log('─'.repeat(50));

  process.stdout.write('\nAI Response: ');

  let charCount = 0;
  for await (const chunk of wrapper.generate(simulateAIResponse())) {
    process.stdout.write(chunk);
    charCount += chunk.length;
  }

  const session = wrapper.getSession();

  console.log('\n\n✓ Generation complete');
  console.log(`  Characters generated: ${charCount}`);
  console.log(`  Real-time interventions: ${wrapper.interventions.length}`);
  console.log(`  Session ID: ${session.sessionId}`);
  console.log(`  Total turns: ${session.turns}`);

  console.log('\n📦 INTEGRATION EXAMPLES:\n');

  console.log('// Anthropic Claude');
  console.log('const anthropic = require("@anthropic-ai/sdk");');
  console.log('const { AnthropicCathedralWrapper } = require("./cathedral-ai-wrapper");');
  console.log('');
  console.log('const client = new anthropic.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });');
  console.log('const wrapper = new AnthropicCathedralWrapper(client, {');
  console.log('  autoCorrect: false,');
  console.log('  onIntervention: async (intervention) => {');
  console.log('    console.log("Issue detected:", intervention.recommendations);');
  console.log('    return true;');
  console.log('  }');
  console.log('});');
  console.log('');
  console.log('for await (const chunk of wrapper.complete({');
  console.log('  model: "claude-3-sonnet-20240229",');
  console.log('  messages: [{ role: "user", content: "Your prompt" }]');
  console.log('})) {');
  console.log('  process.stdout.write(chunk);');
  console.log('}');

  console.log('\n// OpenAI');
  console.log('const { OpenAI } = require("openai");');
  console.log('const { OpenAICathedralWrapper } = require("./cathedral-ai-wrapper");');
  console.log('');
  console.log('const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });');
  console.log('const wrapper = new OpenAICathedralWrapper(client);');
  console.log('');
  console.log('for await (const chunk of wrapper.complete({');
  console.log('  model: "gpt-4",');
  console.log('  messages: [{ role: "user", content: "Your prompt" }]');
  console.log('})) {');
  console.log('  process.stdout.write(chunk);');
  console.log('}');

  console.log('\n✓ Demonstration complete\n');
})();

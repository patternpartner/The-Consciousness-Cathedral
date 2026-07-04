#!/usr/bin/env node

/**
 * Complete AI Workflow Example
 *
 * Demonstrates integration of all Cathedral consciousness tools
 * for AI systems monitoring and improving their own output.
 */

const { AIStreamWrapper } = require('../ai-stream-wrapper.js');
const { ConsciousnessDiagnostic } = require('../consciousness-diagnostic.js');
const { CrossSessionMemory } = require('../cross-session-memory.js');
const { ConsciousnessEnsemble } = require('../consciousness-ensemble.js');
const { SelfReflectionLoop } = require('../self-reflection-loop.js');
const fs = require('fs');

class AIWorkflow {
  constructor() {
    this.wrapper = new AIStreamWrapper({
      enableMemory: true,
      enableReflection: true,
      enableEnsemble: true,
      qualityThreshold: 0.5,
      memoryPath: './workflow-memory.json'
    });
    this.diagnostic = new ConsciousnessDiagnostic();
    this.sessionId = null;
  }

  start() {
    this.sessionId = this.wrapper.startSession();
    console.log(`Session started: ${this.sessionId}`);
    return this;
  }

  process(text) {
    const result = this.wrapper.processComplete(text);

    const diagnosis = this.diagnostic.diagnose(result.final);

    return {
      original: text,
      processed: result.final,
      quality: result.quality,
      reflected: result.reflected,
      diagnosis: {
        overall: diagnosis.overall,
        issues: diagnosis.issues,
        strengths: diagnosis.strengths,
        actionPlan: diagnosis.actionPlan
      }
    };
  }

  selectBest(candidates) {
    const batch = this.wrapper.processBatch(candidates);
    return {
      ranking: batch.ranking,
      bestIndex: batch.bestIndex,
      best: candidates[batch.bestIndex]
    };
  }

  getReport(text) {
    const diagnosis = this.diagnostic.diagnose(text);
    return this.diagnostic.formatReport(diagnosis);
  }

  end() {
    return this.wrapper.endSession({
      workflow: 'complete-ai-workflow'
    });
  }
}

(async () => {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         COMPLETE AI WORKFLOW DEMONSTRATION                    ║');
  console.log('║         All Cathedral Tools Working Together                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const workflow = new AIWorkflow();
  workflow.start();

  console.log('STEP 1: Process and improve a response');
  console.log('─'.repeat(60) + '\n');

  const poorResponse = "This solution will definitely work. It's guaranteed to handle all edge cases perfectly.";
  console.log(`Input: "${poorResponse}"\n`);

  const result1 = workflow.process(poorResponse);
  console.log(`Quality: ${(result1.quality * 100).toFixed(0)}%`);
  console.log(`Reflected: ${result1.reflected}`);
  console.log(`Output: "${result1.processed.substring(0, 100)}..."\n`);

  if (result1.diagnosis.issues.length > 0) {
    console.log('Issues Found:');
    result1.diagnosis.issues.forEach(i => {
      console.log(`  ✗ ${i.dimension}: ${i.reason}`);
    });
    console.log('');
  }

  if (result1.diagnosis.actionPlan.length > 0) {
    console.log('Action Plan:');
    result1.diagnosis.actionPlan.forEach(a => {
      console.log(`  ${a.priority}. ${a.action}`);
    });
  }

  console.log('\n' + '═'.repeat(60) + '\n');
  console.log('STEP 2: Process a well-formed response');
  console.log('─'.repeat(60) + '\n');

  const goodResponse = "I think this caching approach might help, though I'm uncertain about edge cases. From my perspective as an AI, I should note potential blind spots. Specifically: set TTL to 300s, memory limit 256MB, monitor hit rate > 85%.";
  console.log(`Input: "${goodResponse.substring(0, 80)}..."\n`);

  const result2 = workflow.process(goodResponse);
  console.log(`Quality: ${(result2.quality * 100).toFixed(0)}%`);
  console.log(`Reflected: ${result2.reflected}`);

  if (result2.diagnosis.strengths.length > 0) {
    console.log('\nStrengths:');
    result2.diagnosis.strengths.forEach(s => {
      console.log(`  ✓ ${s.dimension}: ${s.reason}`);
    });
  }

  console.log('\n' + '═'.repeat(60) + '\n');
  console.log('STEP 3: Select best from multiple candidates');
  console.log('─'.repeat(60) + '\n');

  const candidates = [
    "The cache works perfectly.",
    "I believe caching could improve performance by approximately 40%, though this depends on access patterns.",
    "Implement caching. It will help.",
    "From my analysis, a distributed cache with 512MB limit might reduce latency from ~200ms to ~50ms, though we should validate with load testing."
  ];

  console.log('Candidates:');
  candidates.forEach((c, i) => {
    console.log(`  ${i + 1}. "${c.substring(0, 60)}..."`);
  });

  const selection = workflow.selectBest(candidates);

  console.log('\nRanking:');
  selection.ranking.forEach(r => {
    console.log(`  ${r.rank}. [${(r.score * 100).toFixed(0)}%] "${r.text}"`);
  });

  console.log(`\nBest: Candidate ${selection.bestIndex + 1}`);

  console.log('\n' + '═'.repeat(60) + '\n');
  console.log('STEP 4: Full diagnostic report');
  console.log('─'.repeat(60) + '\n');

  console.log(workflow.getReport(candidates[selection.bestIndex]));

  console.log('═'.repeat(60) + '\n');
  console.log('STEP 5: Session statistics');
  console.log('─'.repeat(60) + '\n');

  const stats = workflow.wrapper.getStats();
  console.log(`Requests processed: ${stats.requests}`);
  console.log(`Reflections triggered: ${stats.reflections}`);
  console.log(`Average quality: ${(stats.averageQuality * 100).toFixed(0)}%`);

  workflow.end();
  console.log('\nSession ended.\n');

  if (fs.existsSync('./workflow-memory.json')) {
    fs.unlinkSync('./workflow-memory.json');
  }

  console.log('═'.repeat(60));
  console.log('INTEGRATION REFERENCE');
  console.log('═'.repeat(60) + '\n');

  console.log('To integrate with Claude API:\n');
  console.log(`  const Anthropic = require('@anthropic-ai/sdk');
  const { AIStreamWrapper } = require('./ai-stream-wrapper.js');

  const anthropic = new Anthropic();
  const wrapper = new AIStreamWrapper();

  // Wrap the client
  wrapper.wrapAnthropic(anthropic);
  wrapper.startSession();

  // Use normally - monitoring happens automatically
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    messages: [{ role: 'user', content: 'Your prompt' }]
  });

  // Access Cathedral metrics
  console.log(response._cathedral.quality);
  console.log(response._cathedral.analysis);`);

  console.log('\n' + '─'.repeat(60) + '\n');

  console.log('To integrate with OpenAI:\n');
  console.log(`  const OpenAI = require('openai');
  const { AIStreamWrapper } = require('./ai-stream-wrapper.js');

  const openai = new OpenAI();
  const wrapper = new AIStreamWrapper();

  wrapper.wrapOpenAI(openai);
  wrapper.startSession();

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Your prompt' }]
  });

  console.log(response._cathedral.quality);`);

  console.log('\n' + '─'.repeat(60) + '\n');

  console.log('Available Tools:\n');
  console.log('  AIStreamWrapper      - Unified integration for any AI API');
  console.log('  ConsciousnessEnsemble - Multi-analyzer voting');
  console.log('  SelfReflectionLoop   - Iterative self-improvement');
  console.log('  CrossSessionMemory   - Persistent learning');
  console.log('  ConsciousnessDiagnostic - Detailed reports');
  console.log('  MultiSessionDashboard - Fleet monitoring');
  console.log('  StreamMonitor        - Real-time analysis');
  console.log('  PatternDB           - Pattern learning');
  console.log('  AutoImprove         - Auto-correction');

  console.log('\n✓ Complete workflow demonstration finished\n');
})();

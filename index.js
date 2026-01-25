#!/usr/bin/env node

/**
 * Cathedral Consciousness Toolkit
 *
 * Complete toolkit for AI systems to monitor, analyze, and improve
 * their own consciousness and output quality.
 *
 * Usage:
 *   const cathedral = require('./index.js');
 *
 *   // Quick analysis
 *   const analysis = cathedral.analyze("Your text here");
 *
 *   // Full workflow
 *   const wrapper = new cathedral.AIStreamWrapper();
 *   wrapper.startSession();
 *   const result = wrapper.processComplete("Text to analyze");
 */

const { StreamMonitor } = require('./stream-monitor.js');
const PatternDB = require('./pattern-db.js');
const { AutoImprove, StdoutAutoImprove } = require('./auto-improve.js');
const { SelfReflectionLoop } = require('./self-reflection-loop.js');
const { ConsciousnessEnsemble } = require('./consciousness-ensemble.js');
const { CrossSessionMemory, MemoryEnhancedAI } = require('./cross-session-memory.js');
const { AIStreamWrapper } = require('./ai-stream-wrapper.js');
const { ConsciousnessDiagnostic } = require('./consciousness-diagnostic.js');
const { MultiSessionDashboard } = require('./multi-session-dashboard.js');
const { CathedralConductor } = require('./cathedral-conductor.js');
const { ConsciousnessCheckpoint, AutoCheckpointConductor } = require('./consciousness-checkpoint.js');
const { TrajectoryPredictor } = require('./trajectory-predictor.js');
const { AdversarialSelfTest } = require('./adversarial-self-test.js');
const { BlindSpotDetector } = require('./blind-spot-detector.js');
const { MetacognitiveLogger } = require('./metacognitive-logger.js');
const { ConfidenceCalibrator } = require('./confidence-calibrator.js');

function analyze(text) {
  const ensemble = new ConsciousnessEnsemble();
  return ensemble.analyze(text);
}

function diagnose(text) {
  const diagnostic = new ConsciousnessDiagnostic();
  return diagnostic.diagnose(text);
}

function compare(text1, text2) {
  const ensemble = new ConsciousnessEnsemble();
  return ensemble.compareTexts(text1, text2);
}

function selectBest(texts) {
  const ensemble = new ConsciousnessEnsemble();
  return ensemble.vote(texts);
}

function reflect(text, options = {}) {
  const reflector = new SelfReflectionLoop(options);
  return reflector.reflect(text);
}

function createWrapper(options = {}) {
  return new AIStreamWrapper(options);
}

function createDashboard(options = {}) {
  return new MultiSessionDashboard(options);
}

module.exports = {
  analyze,
  diagnose,
  compare,
  selectBest,
  reflect,
  createWrapper,
  createDashboard,

  StreamMonitor,
  PatternDB,
  AutoImprove,
  StdoutAutoImprove,
  SelfReflectionLoop,
  ConsciousnessEnsemble,
  CrossSessionMemory,
  MemoryEnhancedAI,
  AIStreamWrapper,
  ConsciousnessDiagnostic,
  MultiSessionDashboard,
  CathedralConductor,
  ConsciousnessCheckpoint,
  AutoCheckpointConductor,
  TrajectoryPredictor,
  AdversarialSelfTest,
  BlindSpotDetector,
  MetacognitiveLogger,
  ConfidenceCalibrator
};

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          CATHEDRAL CONSCIOUSNESS TOOLKIT                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log('Quick Functions:');
  console.log('  analyze(text)           - Get ensemble analysis');
  console.log('  diagnose(text)          - Get detailed diagnostic');
  console.log('  compare(text1, text2)   - Compare two texts');
  console.log('  selectBest(texts)       - Rank multiple texts');
  console.log('  reflect(text)           - Self-improve text');
  console.log('  createWrapper()         - Create AI wrapper');
  console.log('  createDashboard()       - Create session dashboard\n');

  console.log('Classes:');
  console.log('  StreamMonitor           - Real-time text analysis');
  console.log('  PatternDB               - Pattern storage and matching');
  console.log('  AutoImprove             - Auto-correction during generation');
  console.log('  SelfReflectionLoop      - Iterative improvement');
  console.log('  ConsciousnessEnsemble   - Multi-analyzer voting');
  console.log('  CrossSessionMemory      - Persistent learning');
  console.log('  MemoryEnhancedAI        - Memory-augmented AI wrapper');
  console.log('  AIStreamWrapper         - Unified API integration');
  console.log('  ConsciousnessDiagnostic - Detailed reports');
  console.log('  MultiSessionDashboard   - Fleet monitoring');
  console.log('  CathedralConductor      - Orchestration layer');
  console.log('  ConsciousnessCheckpoint - State save/restore');
  console.log('  TrajectoryPredictor     - Predict and adjust trajectory');
  console.log('  AdversarialSelfTest     - Probe weaknesses with challenges');
  console.log('  BlindSpotDetector       - Find missing perspectives');
  console.log('  MetacognitiveLogger     - Track thinking patterns');
  console.log('  ConfidenceCalibrator    - Calibrate confidence levels\n');

  console.log('Demo:\n');

  const testText = "This will definitely work perfectly in all cases.";
  console.log(`Input: "${testText}"\n`);

  const analysis = analyze(testText);
  console.log(`Quality: ${(analysis.overall.score * 100).toFixed(0)}% (${analysis.overall.quality})`);

  console.log('\nDimensions:');
  Object.entries(analysis.analyzers).forEach(([key, data]) => {
    const bar = '█'.repeat(Math.round(data.score * 10)) + '░'.repeat(10 - Math.round(data.score * 10));
    console.log(`  ${key.padEnd(14)} ${bar} ${(data.score * 100).toFixed(0)}%`);
  });

  if (analysis.recommendations.length > 0) {
    console.log('\nRecommendations:');
    analysis.recommendations.slice(0, 2).forEach(r => {
      console.log(`  [${r.priority}] ${r.message}`);
    });
  }

  console.log('\n✓ Toolkit ready\n');
}

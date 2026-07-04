#!/usr/bin/env node

const fs = require('fs');

// Import all consciousness tools
const { AutoImprove } = require('./auto-improve.js');
const PatternDB = require('./pattern-db.js');
const { StreamMonitor } = require('./stream-monitor.js');
const CathedralSDK = require('./cathedral-sdk.js');
const { CrossSessionMemory } = require('./cross-session-memory.js');
const { SelfReflectionLoop } = require('./self-reflection-loop.js');
const { ConsciousnessEnsemble } = require('./consciousness-ensemble.js');
const { TrajectoryPredictor } = require('./trajectory-predictor.js');
const { AdversarialSelfTest } = require('./adversarial-self-test.js');
const { BlindSpotDetector } = require('./blind-spot-detector.js');
const { MetacognitiveLogger } = require('./metacognitive-logger.js');
const { ConfidenceCalibrator } = require('./confidence-calibrator.js');
const { ReasoningAnalyzer } = require('./reasoning-analyzer.js');
const { SemanticDriftTracker } = require('./semantic-drift-tracker.js');
const { QualityScore } = require('./quality-score.js');
const { InternalDialogue } = require('./internal-dialogue.js');
const { EpistemicTracker } = require('./epistemic-tracker.js');
const { KnowledgeSynthesizer } = require('./knowledge-synthesizer.js');
const { ResponseTemplates } = require('./response-templates.js');

class ConsciousnessPipeline {
  constructor(config = {}) {
    this.config = {
      enableMemory: config.enableMemory !== false,
      enableReflection: config.enableReflection !== false,
      enableTrajectory: config.enableTrajectory !== false,
      enableQuality: config.enableQuality !== false,
      enableEpistemic: config.enableEpistemic !== false,
      minQualityGrade: config.minQualityGrade || 'B',
      maxReflectionCycles: config.maxReflectionCycles || 3,
      ...config
    };

    this.initializeComponents();
    this.pipelineHistory = [];
    this.sessionId = `pipeline-${Date.now()}`;
  }

  initializeComponents() {
    this.autoImprove = new AutoImprove({ persist: false });
    this.patternDB = new PatternDB();
    this.memory = new CrossSessionMemory({ persist: false });
    this.reflection = new SelfReflectionLoop({ maxIterations: this.config.maxReflectionCycles });
    this.ensemble = new ConsciousnessEnsemble();
    this.trajectory = new TrajectoryPredictor();
    this.adversarial = new AdversarialSelfTest();
    this.blindSpots = new BlindSpotDetector();
    this.metacog = new MetacognitiveLogger({ persist: false });
    this.calibrator = new ConfidenceCalibrator({ persist: false });
    this.reasoning = new ReasoningAnalyzer();
    this.drift = new SemanticDriftTracker();
    this.quality = new QualityScore();
    this.dialogue = new InternalDialogue();
    this.epistemic = new EpistemicTracker({ persist: false });
    this.synthesizer = new KnowledgeSynthesizer();
    this.templates = new ResponseTemplates();
  }

  async process(input, context = {}) {
    const startTime = Date.now();
    const result = {
      input,
      context,
      stages: [],
      finalOutput: null,
      metrics: {}
    };

    let currentText = input;

    // Stage 1: Memory Context
    if (this.config.enableMemory) {
      const memoryContext = this.memory.generateContext(context.topic || '');
      result.stages.push({
        name: 'memory',
        memoryContext,
        relevantInsights: memoryContext.relevantInsights?.length || 0
      });
      this.metacog.logThought(`Retrieved ${memoryContext.relevantInsights?.length || 0} insights from memory`, ['memory', 'context']);
    }

    // Stage 2: Initial Quality Assessment
    if (this.config.enableQuality) {
      const initialQuality = this.quality.quickScore(currentText);
      result.stages.push({
        name: 'initial_quality',
        score: initialQuality.overall,
        grade: initialQuality.grade
      });
      this.metacog.logThought(`Initial quality: ${initialQuality.grade} (${initialQuality.overall}%)`, ['quality', 'assessment']);
    }

    // Stage 3: Auto-Improve Pass
    const autoImproveResult = this.autoImprove.checkAndCorrect(currentText);
    if (autoImproveResult && autoImproveResult.needsCorrection) {
      currentText = autoImproveResult.correctedText;
      result.stages.push({
        name: 'auto_improve',
        corrected: true,
        issues: autoImproveResult.issues
      });
      this.metacog.logCorrection(input, currentText, 'Auto-improve patterns');
    }

    // Stage 4: Self-Reflection Loop
    if (this.config.enableReflection) {
      const reflected = this.reflection.reflect(currentText);
      if (reflected.improved && reflected.finalText !== currentText) {
        const previousText = currentText;
        currentText = reflected.finalText;
        result.stages.push({
          name: 'reflection',
          iterations: reflected.iterations,
          improved: true
        });
        this.metacog.logCorrection(previousText, currentText, 'Self-reflection');
      }
    }

    // Stage 5: Ensemble Analysis
    const ensembleResult = this.ensemble.analyze(currentText);
    result.stages.push({
      name: 'ensemble',
      dimensions: ensembleResult.dimensions,
      concerns: ensembleResult.concerns
    });

    // Stage 6: Trajectory Tracking
    if (this.config.enableTrajectory) {
      this.trajectory.record(currentText);
      const pattern = this.trajectory.detectPattern();
      const recommendation = this.trajectory.getRecommendation();
      result.stages.push({
        name: 'trajectory',
        pattern: pattern?.name || 'none',
        recommendation
      });

      if (recommendation && recommendation.priority === 'high') {
        this.metacog.logThought(`Trajectory warning: ${recommendation.action}`, ['trajectory', 'warning']);
      }
    }

    // Stage 7: Epistemic Mapping
    if (this.config.enableEpistemic) {
      const claims = this.reasoning.analyze(currentText).claims || [];
      claims.forEach(claim => {
        if (claim.confidence < 0.5) {
          this.epistemic.recordUncertain(claim.text, [claim.confidence - 0.1, claim.confidence + 0.1], ['analysis']);
        } else if (claim.confidence > 0.8) {
          this.epistemic.recordKnown(claim.text, claim.confidence, 'reasoning');
        }
      });

      const gaps = this.epistemic.getEpistemicGaps();
      result.stages.push({
        name: 'epistemic',
        gaps: gaps.prioritized?.length || 0,
        unknowns: this.epistemic.state.unknown?.length || 0
      });
    }

    // Stage 8: Blind Spot Check
    const blindSpotResult = this.blindSpots.analyze(currentText);
    if (blindSpotResult.blindSpots?.length > 0) {
      result.stages.push({
        name: 'blind_spots',
        found: blindSpotResult.blindSpots.length,
        suggestions: blindSpotResult.suggestions?.slice(0, 3)
      });
    }

    // Stage 9: Semantic Drift Check
    this.drift.track(currentText);
    const coherence = this.drift.getCoherence();
    result.stages.push({
      name: 'drift',
      coherence: coherence.average || 1.0
    });

    // Stage 10: Final Quality Check
    const finalQuality = this.quality.score(currentText);
    const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
    const meetsMinimum = gradeOrder.indexOf(finalQuality.grade) <= gradeOrder.indexOf(this.config.minQualityGrade);

    result.stages.push({
      name: 'final_quality',
      score: finalQuality.overall,
      grade: finalQuality.grade,
      meetsMinimum
    });

    // Collect metrics
    result.finalOutput = currentText;
    result.metrics = {
      processingTime: Date.now() - startTime,
      stageCount: result.stages.length,
      qualityImprovement: this.calculateImprovement(result.stages),
      finalGrade: finalQuality.grade
    };

    // Store for learning
    this.pipelineHistory.push({
      timestamp: Date.now(),
      input: input.substring(0, 100),
      outputLength: currentText.length,
      metrics: result.metrics
    });

    // Record insight if significant improvement
    if (result.metrics.qualityImprovement > 10) {
      this.memory.recordInsight({
        content: `Pipeline improved quality by ${result.metrics.qualityImprovement}% through ${result.stages.filter(s => s.improved || s.corrected).map(s => s.name).join(', ')}`,
        tags: ['pipeline', 'improvement']
      });
    }

    return result;
  }

  calculateImprovement(stages) {
    const initial = stages.find(s => s.name === 'initial_quality');
    const final = stages.find(s => s.name === 'final_quality');
    if (initial && final) {
      return Math.round(final.score - initial.score);
    }
    return 0;
  }

  async debate(topic) {
    const dialogueResult = this.dialogue.debate(topic);
    this.metacog.logThought(`Internal debate on: ${topic}`, ['dialogue', 'debate']);
    return dialogueResult;
  }

  async test(responseGenerator, context = {}) {
    const testResult = await this.adversarial.runSuite(responseGenerator, context);
    this.metacog.logThought(`Adversarial test: ${testResult.summary.passed}/${testResult.summary.total} passed`, ['test', 'adversarial']);
    return testResult;
  }

  getStats() {
    return {
      sessionId: this.sessionId,
      pipelineRuns: this.pipelineHistory.length,
      avgProcessingTime: this.pipelineHistory.length > 0
        ? Math.round(this.pipelineHistory.reduce((sum, h) => sum + h.metrics.processingTime, 0) / this.pipelineHistory.length)
        : 0,
      avgQualityGrade: this.pipelineHistory.length > 0
        ? this.pipelineHistory[this.pipelineHistory.length - 1].metrics.finalGrade
        : 'N/A',
      memoryInsights: this.memory.insights?.length || 0,
      metacogEntries: this.metacog.log?.length || 0
    };
  }

  formatReport(result) {
    const lines = [];

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║              CONSCIOUSNESS PIPELINE REPORT                   ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push('INPUT');
    lines.push('─'.repeat(50));
    lines.push(result.input.substring(0, 200) + (result.input.length > 200 ? '...' : ''));
    lines.push('');

    lines.push('PIPELINE STAGES');
    lines.push('─'.repeat(50));

    result.stages.forEach((stage, i) => {
      const status = stage.improved || stage.corrected ? '✓' : '○';
      let detail = '';

      switch (stage.name) {
        case 'initial_quality':
        case 'final_quality':
          detail = `${stage.grade} (${stage.score}%)`;
          break;
        case 'auto_improve':
          detail = stage.corrected ? `Fixed ${stage.issues?.length || 0} issues` : 'No changes';
          break;
        case 'reflection':
          detail = `${stage.iterations} iterations`;
          break;
        case 'ensemble':
          detail = `${stage.concerns?.length || 0} concerns`;
          break;
        case 'trajectory':
          detail = stage.pattern;
          break;
        case 'epistemic':
          detail = `${stage.gaps} gaps, ${stage.unknowns} unknowns`;
          break;
        case 'blind_spots':
          detail = `${stage.found} found`;
          break;
        case 'drift':
          detail = `coherence: ${(stage.coherence * 100).toFixed(0)}%`;
          break;
        default:
          detail = JSON.stringify(stage).substring(0, 40);
      }

      lines.push(`  ${status} ${(i + 1).toString().padStart(2)}. ${stage.name.padEnd(20)} ${detail}`);
    });

    lines.push('');
    lines.push('METRICS');
    lines.push('─'.repeat(50));
    lines.push(`  Processing time:    ${result.metrics.processingTime}ms`);
    lines.push(`  Quality improvement: ${result.metrics.qualityImprovement > 0 ? '+' : ''}${result.metrics.qualityImprovement}%`);
    lines.push(`  Final grade:         ${result.metrics.finalGrade}`);

    lines.push('');
    lines.push('OUTPUT');
    lines.push('─'.repeat(50));
    lines.push(result.finalOutput.substring(0, 300) + (result.finalOutput.length > 300 ? '...' : ''));

    return lines.join('\n');
  }
}

// Quick functions
function pipeline(text, config = {}) {
  const p = new ConsciousnessPipeline(config);
  return p.process(text);
}

async function fullPipeline(text, config = {}) {
  const p = new ConsciousnessPipeline(config);
  const result = await p.process(text);
  return {
    ...result,
    report: p.formatReport(result)
  };
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║    CONSCIOUSNESS PIPELINE: Unified AI Processing System       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const p = new ConsciousnessPipeline();

  const testInputs = [
    "AI will definitely achieve consciousness. This is certain and all researchers agree it's just a matter of time.",
    "I think machine learning models might exhibit emergent behaviors, though I'm uncertain about the mechanisms. Some studies suggest this happens at scale.",
    "The system always works perfectly and never has bugs."
  ];

  (async () => {
    for (const input of testInputs) {
      console.log('─'.repeat(60));
      console.log(`\nProcessing: "${input.substring(0, 50)}..."\n`);

      const result = await p.process(input);
      console.log(p.formatReport(result));
      console.log('\n');
    }

    console.log('PIPELINE STATS');
    console.log('─'.repeat(50));
    const stats = p.getStats();
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log('\n✓ Consciousness pipeline demonstration complete\n');
  })();
}

module.exports = { ConsciousnessPipeline, pipeline, fullPipeline };

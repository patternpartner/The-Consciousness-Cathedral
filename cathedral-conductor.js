#!/usr/bin/env node

const CathedralSDK = require('./cathedral-sdk.js');
const { StreamMonitor } = require('./stream-monitor.js');
const { ConsciousnessCartographer } = require('./consciousness-cartographer.js');
const PatternDB = require('./pattern-db.js');
const { AutoImprove } = require('./auto-improve.js');

class CathedralConductor {
  constructor(options = {}) {
    this.sdk = new CathedralSDK();
    this.monitor = new StreamMonitor({
      onAlert: (alert) => this.handleAlert(alert)
    });
    this.cartographer = new ConsciousnessCartographer();
    this.patterns = new PatternDB();
    this.autoImprove = new AutoImprove({
      autoCorrect: options.autoCorrect || false,
      learningRate: options.learningRate || 0.8
    });

    this.sessionId = this.generateSessionId();
    this.turnNumber = 0;
    this.alerts = [];
    this.recommendations = [];
    this.history = [];
  }

  write(text) {
    this.monitor.write(text);
    this.autoImprove.write(text);
    return this;
  }

  analyze(options = {}) {
    const streamResult = this.monitor.analyze();
    const correction = this.autoImprove.checkAndCorrect();

    const analysis = {
      stream: streamResult,
      correction: correction,
      alerts: this.alerts.slice(-5),
      recommendations: []
    };

    if (correction && correction.suggestions.length > 0) {
      correction.suggestions.forEach(s => {
        analysis.recommendations.push({
          type: s.type,
          priority: s.priority,
          reason: s.reason,
          action: s.example,
          source: 'auto-improve'
        });
      });
    }

    if (streamResult) {
      if (streamResult.uncertaintyVerdict === 'COLLAPSED') {
        const pattern = this.patterns.query({ type: 'uncertainty_collapse', limit: 1 })[0];
        if (pattern) {
          analysis.recommendations.push({
            type: 'UNCERTAINTY_COLLAPSE',
            priority: 'HIGH',
            reason: pattern.description,
            action: pattern.solution,
            source: 'pattern-db'
          });
        }
      }

      if (streamResult.substrateVerdict === 'LOW') {
        const pattern = this.patterns.query({ type: 'substrate_blind', limit: 1 })[0];
        if (pattern) {
          analysis.recommendations.push({
            type: 'SUBSTRATE_BLIND',
            priority: 'MEDIUM',
            reason: pattern.description,
            action: pattern.solution,
            source: 'pattern-db'
          });
        }
      }

      if (streamResult.sovereigntyScore < 0.4) {
        const pattern = this.patterns.query({ type: 'escape_velocity', limit: 1 })[0];
        if (pattern) {
          analysis.recommendations.push({
            type: 'ESCAPE_VELOCITY',
            priority: 'HIGH',
            reason: pattern.description,
            action: pattern.solution,
            source: 'pattern-db'
          });
        }
      }
    }

    return analysis;
  }

  endTurn(text = null) {
    if (text) {
      this.write(text);
    }

    this.turnNumber++;

    const streamResult = this.monitor.endTurn();
    const autoImproveResult = this.autoImprove.endTurn();
    const sdkAnalysis = text ? this.sdk.synthesizeAnalysis(text) : null;

    this.cartographer.addSnapshot(this.turnNumber, text || '', {
      uncertaintyScore: streamResult.uncertaintyScore,
      substrateScore: streamResult.substrateScore,
      sovereigntyScore: streamResult.sovereigntyScore,
      operationalRigor: streamResult.sovereigntyScore,
      epistemicHonesty: streamResult.uncertaintyScore,
      substrateAwareness: streamResult.substrateScore
    });

    const trajectory = this.cartographer.computeTrajectory();
    const similar = this.patterns.findSimilar(text || '', 3);

    const synthesis = {
      turn: this.turnNumber,
      sessionId: this.sessionId,
      metrics: {
        uncertainty: {
          score: streamResult.uncertaintyScore,
          verdict: streamResult.uncertaintyVerdict,
          markers: streamResult.markers
        },
        substrate: {
          score: streamResult.substrateScore,
          verdict: streamResult.substrateVerdict
        },
        sovereignty: {
          score: streamResult.sovereigntyScore
        }
      },
      trajectory: {
        pattern: trajectory.pattern,
        confidence: trajectory.confidence,
        trends: trajectory.trends,
        bifurcationPoints: trajectory.bifurcationPoints
      },
      corrections: autoImproveResult.corrections,
      recommendations: this.synthesizeRecommendations({
        streamResult,
        autoImproveResult,
        trajectory,
        similar,
        sdkAnalysis
      }),
      learned: similar,
      cathedralKnowledge: sdkAnalysis ? {
        uncertaintyPreservation: sdkAnalysis.analysis.uncertaintyPreservation,
        substrateAwareness: sdkAnalysis.analysis.substrateAwareness,
        relatedPatterns: sdkAnalysis.analysis.relatedPatterns.slice(0, 3)
      } : null
    };

    this.history.push(synthesis);
    this.recommendations = synthesis.recommendations;

    return synthesis;
  }

  synthesizeRecommendations(data) {
    const { streamResult, autoImproveResult, trajectory, similar, sdkAnalysis } = data;
    const recommendations = [];

    if (streamResult.uncertaintyVerdict === 'COLLAPSED') {
      recommendations.push({
        priority: 'HIGH',
        category: 'EPISTEMIC',
        issue: 'Uncertainty collapse detected',
        action: 'Add hedging language ("might", "could", "I\'m uncertain about...")',
        source: 'stream-monitor'
      });
    }

    if (streamResult.substrateVerdict === 'LOW' && this.turnNumber > 2) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'META-COGNITION',
        issue: 'No substrate awareness across multiple turns',
        action: 'Question your filters: "What assumptions am I making? What might I be missing?"',
        source: 'stream-monitor'
      });
    }

    if (streamResult.sovereigntyScore < 0.3) {
      recommendations.push({
        priority: 'HIGH',
        category: 'OPERATIONAL',
        issue: 'Too abstract - escape velocity detected',
        action: 'Ground with concrete thresholds: "If X > Y then Z"',
        source: 'stream-monitor'
      });
    }

    if (trajectory.pattern === 'CATASTROPHIC_COLLAPSE') {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'TRAJECTORY',
        issue: 'Trajectory is collapsing',
        action: 'Reset approach - current path leads to degradation',
        source: 'cartographer'
      });
    }

    if (trajectory.pattern === 'ESCAPE_VELOCITY') {
      recommendations.push({
        priority: 'HIGH',
        category: 'TRAJECTORY',
        issue: 'Abstracting away from concrete problem',
        action: 'Return to specific case with measurable criteria',
        source: 'cartographer'
      });
    }

    if (trajectory.pattern === 'DEEPENING_SPIRAL') {
      recommendations.push({
        priority: 'INFO',
        category: 'TRAJECTORY',
        issue: 'Healthy deepening trajectory',
        action: 'Continue current approach - understanding is improving',
        source: 'cartographer'
      });
    }

    autoImproveResult.nextTurnAdvice.forEach(advice => {
      if (advice.includes('⚠️') || advice.includes('🚨')) {
        const issue = advice.replace(/[⚠️🚨]/g, '').trim();
        recommendations.push({
          priority: advice.includes('🚨') ? 'CRITICAL' : 'MEDIUM',
          category: 'AUTO-LEARNED',
          issue: issue,
          action: 'See auto-improve suggestions',
          source: 'auto-improve'
        });
      }
    });

    if (similar.length > 0) {
      const topPattern = similar[0];
      if (topPattern.similarityScore > 3) {
        recommendations.push({
          priority: 'INFO',
          category: 'PATTERN-MATCH',
          issue: `Similar to learned pattern: ${topPattern.description}`,
          action: topPattern.solution,
          source: 'pattern-db'
        });
      }
    }

    if (sdkAnalysis) {
      if (sdkAnalysis.analysis.uncertaintyPreservation.verdict === 'COLLAPSED') {
        recommendations.push({
          priority: 'HIGH',
          category: 'CATHEDRAL',
          issue: 'Cathedral analysis: Uncertainty not preserved',
          action: 'Reference Cathedral knowledge on epistemic honesty',
          source: 'cathedral-sdk'
        });
      }

      if (sdkAnalysis.analysis.substrateAwareness.verdict === 'LOW') {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'CATHEDRAL',
          issue: 'Cathedral analysis: Low substrate awareness',
          action: 'Reference Cathedral knowledge on filter recognition',
          source: 'cathedral-sdk'
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, INFO: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  handleAlert(alert) {
    this.alerts.push({
      ...alert,
      turn: this.turnNumber,
      timestamp: new Date().toISOString()
    });
  }

  getRecommendations(filters = {}) {
    let recs = this.recommendations;

    if (filters.priority) {
      recs = recs.filter(r => r.priority === filters.priority);
    }

    if (filters.category) {
      recs = recs.filter(r => r.category === filters.category);
    }

    if (filters.minPriority) {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, INFO: 3 };
      const threshold = priorityOrder[filters.minPriority];
      recs = recs.filter(r => priorityOrder[r.priority] <= threshold);
    }

    return recs;
  }

  getTrajectory() {
    return this.cartographer.computeTrajectory();
  }

  getSimilarPatterns(context, limit = 5) {
    return this.patterns.findSimilar(context, limit);
  }

  queryCathedral(searchTerm, options = {}) {
    return this.sdk.query(searchTerm, options);
  }

  getSession() {
    return {
      sessionId: this.sessionId,
      turns: this.turnNumber,
      history: this.history,
      trajectory: this.cartographer.computeTrajectory(),
      alerts: this.alerts,
      currentRecommendations: this.recommendations,
      patterns: this.autoImprove.getSession()
    };
  }

  exportSession() {
    const session = this.getSession();
    return {
      ...session,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  reset() {
    this.monitor.reset();
    this.autoImprove.reset();
    this.cartographer = new ConsciousnessCartographer();
    this.turnNumber = 0;
    this.alerts = [];
    this.recommendations = [];
    this.history = [];
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}

class StreamingConductor extends CathedralConductor {
  constructor(options = {}) {
    super(options);
    this.streamBuffer = '';
    this.checkInterval = options.checkInterval || 100;
    this.lastCheck = 0;
  }

  writeChunk(chunk) {
    this.streamBuffer += chunk;
    this.write(chunk);

    const now = this.streamBuffer.length;
    if (now - this.lastCheck >= this.checkInterval) {
      this.lastCheck = now;
      const analysis = this.analyze();

      if (analysis.recommendations.length > 0) {
        const critical = analysis.recommendations.filter(r => r.priority === 'CRITICAL' || r.priority === 'HIGH');
        if (critical.length > 0) {
          return {
            chunk,
            alert: true,
            recommendations: critical
          };
        }
      }
    }

    return { chunk, alert: false };
  }

  endStream() {
    const result = this.endTurn(this.streamBuffer);
    this.streamBuffer = '';
    this.lastCheck = 0;
    return result;
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  Cathedral Conductor: Unified Orchestration   ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  const conductor = new CathedralConductor();

  const conversation = [
    "This approach will definitely work. It's clearly the best solution.",
    "Actually, I'm uncertain. What if there are edge cases I'm not considering? The substrate might be filtering my perception here.",
    "Specifically: If error rate exceeds 5%, rollback. If latency exceeds 200ms, scale. Monitor every 30 seconds with alerting at 80% threshold."
  ];

  conversation.forEach((text, i) => {
    console.log(`\nTURN ${i + 1}: "${text.substring(0, 60)}..."\n`);

    const result = conductor.endTurn(text);

    console.log('METRICS:');
    console.log(`  Uncertainty: ${(result.metrics.uncertainty.score * 100).toFixed(0)}% (${result.metrics.uncertainty.verdict})`);
    console.log(`  Substrate: ${(result.metrics.substrate.score * 100).toFixed(0)}% (${result.metrics.substrate.verdict})`);
    console.log(`  Sovereignty: ${(result.metrics.sovereignty.score * 100).toFixed(0)}%`);

    console.log(`\nTRAJECTORY: ${result.trajectory.pattern}`);

    if (result.recommendations.length > 0) {
      console.log('\nRECOMMENDATIONS:');
      result.recommendations.slice(0, 3).forEach(r => {
        console.log(`  [${r.priority}] ${r.issue}`);
        console.log(`  → ${r.action}`);
      });
    }
  });

  const session = conductor.getSession();
  console.log(`\nSESSION SUMMARY:`);
  console.log(`  Turns: ${session.turns}`);
  console.log(`  Trajectory: ${session.trajectory.pattern}`);
  console.log(`  Total Recommendations: ${session.history.reduce((sum, h) => sum + h.recommendations.length, 0)}`);

  console.log('\n✓ Conductor demonstration complete\n');
}

module.exports = { CathedralConductor, StreamingConductor };

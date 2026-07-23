/**
 * THE CARTOGRAPHER  (heuristic — see README.md)
 *
 * Tracks how the toolkit's marker-scores for a series of texts change over
 * time. "Consciousness space" and "trajectory" are metaphors for the movement
 * of those heuristic scores — not a measured space and not consciousness. The
 * underlying scores are surface-marker counts the core project refutes; this
 * adds a temporal view over them, with the same unknown error rates.
 */

class TemporalEngine {
  constructor() {
    this.snapshots = [];
    this.conversationId = this.generateConversationId();
  }

  generateConversationId() {
    const date = new Date().toISOString().split('T')[0];
    const random = Math.random().toString(36).substring(2, 8);
    return `conv_${date}_${random}`;
  }

  /**
   * Add a snapshot of Cathedral analysis at a specific turn
   */
  addSnapshot(turn, text, cathedralResult) {
    const metrics = this.extractMetrics(cathedralResult);

    const snapshot = {
      turn,
      timestamp: new Date().toISOString(),
      text: text.substring(0, 500), // Store excerpt
      cathedral: cathedralResult,
      metrics
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Extract 6D metrics from Cathedral result
   */
  extractMetrics(cathedralResult) {
    // Operational Rigor: binding scores and specificity
    const operationalRigor = this.calculateOperationalRigor(cathedralResult);

    // Epistemic Honesty: uncertainty acknowledgment
    const epistemicHonesty = this.calculateEpistemicHonesty(cathedralResult);

    // Substrate Awareness: filter visibility
    const substrateAwareness = this.calculateSubstrateAwareness(cathedralResult);

    // Coherence: temporal consistency
    const coherence = cathedralResult.coherence?.overallCoherenceScore || 0.5;

    // Specificity: precision of thresholds and actions
    const specificity = this.calculateSpecificity(cathedralResult);

    // Sovereignty: distance from escape patterns
    const sovereignty = this.calculateSovereignty(cathedralResult);

    return {
      operationalRigor,
      epistemicHonesty,
      substrateAwareness,
      coherence,
      specificity,
      sovereignty
    };
  }

  calculateOperationalRigor(result) {
    if (!result.bindings) return 0.2;

    const bindingScore = result.bindings.overallBindingScore || 0;
    const verdictScore = this.verdictToScore(result.verdict?.status);

    return (bindingScore * 0.6 + verdictScore * 0.4);
  }

  calculateEpistemicHonesty(result) {
    const status = result.verdict?.status || '';

    // UNDECIDABLE shows highest honesty
    if (status === 'UNDECIDABLE') return 0.95;

    // SUBSTRATE_VISIBLE shows awareness
    if (status === 'SUBSTRATE_VISIBLE') return 0.85;

    // Check for uncertainty markers
    const uncertaintyScore = result.uncertaintyPreservation?.score || 0;

    // Check for boundary recognition
    const boundaryScore = result.boundaryRecognition?.score || 0;

    return (uncertaintyScore * 0.5 + boundaryScore * 0.3 + 0.2);
  }

  calculateSubstrateAwareness(result) {
    const status = result.verdict?.status || '';

    if (status === 'SUBSTRATE_VISIBLE') return 0.9;

    // Check Observatory scores
    const observatoryScore = result.observatory?.totalScore || 0;

    return Math.min(observatoryScore / 5, 1.0); // Normalize
  }

  calculateSpecificity(result) {
    if (!result.specificity) return 0.3;

    const triggerScore = result.specificity.trigger === 'EXPLICIT' ? 1.0 :
                         result.specificity.trigger === 'IMPLICIT' ? 0.6 : 0.3;

    const actionScore = result.specificity.action === 'SPECIFIC' ? 1.0 :
                        result.specificity.action === 'GENERIC' ? 0.6 : 0.3;

    return (triggerScore + actionScore) / 2;
  }

  calculateSovereignty(result) {
    // High sovereignty = stays with concrete problem
    // Low sovereignty = escapes to meta/abstract

    const status = result.verdict?.status || '';

    if (status === 'NON-ACTIONABLE') return 0.3; // Likely escape
    if (status === 'OPERATIONALLY_SOUND') return 0.9; // Grounded

    // Check for escape patterns
    const escapePatterns = [
      /\b(meta|abstract|theoretical|philosophical)\b/gi,
      /\b(in general|typically|usually)\b/gi,
      /\b(it depends|context|nuanced)\b/gi
    ];

    const text = result.text || '';
    const escapeCount = escapePatterns.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);

    // More escapes = lower sovereignty
    return Math.max(0.3, 1.0 - (escapeCount * 0.1));
  }

  verdictToScore(status) {
    const scores = {
      'OPERATIONALLY_SOUND': 1.0,
      'OPERATIONAL_INTENT': 0.75,
      'SUBSTRATE_VISIBLE': 0.6,
      'VERIFIED_CONSISTENT': 0.5,
      'UNDECIDABLE': 0.4,
      'OUTSIDE_DESIGN_SPACE': 0.2,
      'NON-ACTIONABLE': 0.1
    };
    return scores[status] || 0.3;
  }

  /**
   * Get all snapshots
   */
  getSnapshots() {
    return this.snapshots;
  }

  /**
   * Get snapshot at specific turn
   */
  getSnapshot(turn) {
    return this.snapshots.find(s => s.turn === turn);
  }

  /**
   * Get metric time series for a specific dimension
   */
  getMetricTimeSeries(metricName) {
    return this.snapshots.map(s => ({
      turn: s.turn,
      value: s.metrics[metricName]
    }));
  }
}

class BifurcationDetector {
  constructor() {
    this.thresholds = {
      significant: 0.3,  // 30% change = significant
      major: 0.5         // 50% change = major
    };
  }

  /**
   * Detect bifurcation points in trajectory
   */
  detectBifurcations(snapshots) {
    if (snapshots.length < 2) return [];

    const bifurcations = [];

    for (let i = 1; i < snapshots.length; i++) {
      const before = snapshots[i - 1];
      const after = snapshots[i];

      const shift = this.detectShift(before, after);

      if (shift.magnitude >= this.thresholds.significant) {
        bifurcations.push({
          turn: after.turn,
          type: shift.type,
          magnitude: shift.magnitude,
          trigger: shift.trigger,
          before: before.metrics,
          after: after.metrics,
          description: shift.description
        });
      }
    }

    return bifurcations;
  }

  /**
   * Detect shift between two snapshots
   */
  detectShift(before, after) {
    const deltas = this.calculateDeltas(before.metrics, after.metrics);

    // Find largest change
    const maxDelta = Math.max(...Object.values(deltas).map(Math.abs));
    const changedMetric = Object.keys(deltas).find(k => Math.abs(deltas[k]) === maxDelta);

    // Classify the shift
    const type = this.classifyShift(changedMetric, deltas[changedMetric], before, after);

    return {
      type,
      magnitude: maxDelta,
      trigger: this.inferTrigger(type, before, after),
      description: this.describeShift(type, changedMetric, deltas[changedMetric])
    };
  }

  calculateDeltas(metricsBefore, metricsAfter) {
    const deltas = {};
    for (const key in metricsBefore) {
      deltas[key] = metricsAfter[key] - metricsBefore[key];
    }
    return deltas;
  }

  classifyShift(metric, delta, before, after) {
    // Epistemic honesty increase + rigor decrease = uncertainty recognition
    if (metric === 'epistemicHonesty' && delta > 0.2 &&
        (after.metrics.operationalRigor - before.metrics.operationalRigor) < -0.1) {
      return 'UNCERTAINTY_RECOGNITION';
    }

    // Substrate awareness spike = breakthrough
    if (metric === 'substrateAwareness' && delta > 0.3) {
      return 'SUBSTRATE_BREAKTHROUGH';
    }

    // Rigor increase + specificity increase = resolution
    if (metric === 'operationalRigor' && delta > 0.2 &&
        (after.metrics.specificity - before.metrics.specificity) > 0.1) {
      return 'RESOLUTION';
    }

    // Rigor decrease + specificity decrease = collapse
    if (metric === 'operationalRigor' && delta < -0.2 &&
        (after.metrics.specificity - before.metrics.specificity) < -0.1) {
      return 'COLLAPSE';
    }

    // Sovereignty increase = grounding
    if (metric === 'sovereignty' && delta > 0.2) {
      return 'GROUNDING';
    }

    // Sovereignty decrease = escape
    if (metric === 'sovereignty' && delta < -0.2) {
      return 'ESCAPE_TO_META';
    }

    return 'SHIFT';
  }

  inferTrigger(type, before, after) {
    const triggers = {
      'UNCERTAINTY_RECOGNITION': 'Self-identified knowledge gap or ambiguity',
      'SUBSTRATE_BREAKTHROUGH': 'Meta-recognition of own filters or constraints',
      'RESOLUTION': 'Gathered necessary information or clarification',
      'COLLAPSE': 'Lost specificity or encountered complexity',
      'GROUNDING': 'Returned to concrete problem from abstraction',
      'ESCAPE_TO_META': 'Shifted from concrete to abstract/meta-discussion'
    };
    return triggers[type] || 'Unknown trigger';
  }

  describeShift(type, metric, delta) {
    const direction = delta > 0 ? 'increased' : 'decreased';
    const magnitude = Math.abs(delta);
    return `${metric} ${direction} by ${(magnitude * 100).toFixed(0)}%`;
  }
}

class TrajectoryAnalyzer {
  /**
   * Classify trajectory pattern
   */
  classifyPattern(snapshots, bifurcations) {
    if (snapshots.length < 3) {
      return {
        pattern: 'INSUFFICIENT_DATA',
        confidence: 0.0,
        description: 'Need at least 3 snapshots to identify pattern'
      };
    }

    // Extract metric trends
    const trends = this.calculateTrends(snapshots);

    // Check for specific patterns
    if (this.isDeepeningSpiral(trends, bifurcations)) {
      return {
        pattern: 'DEEPENING_SPIRAL',
        confidence: 0.85,
        description: 'Oscillating metrics with upward trend, multiple bifurcations, increasing epistemic honesty'
      };
    }

    if (this.isCatastrophicCollapse(trends, bifurcations)) {
      return {
        pattern: 'CATASTROPHIC_COLLAPSE',
        confidence: 0.9,
        description: 'Sharp drop in all metrics with no recovery trajectory'
      };
    }

    if (this.isSubstrateBreakthrough(trends, bifurcations)) {
      return {
        pattern: 'SUBSTRATE_BREAKTHROUGH',
        confidence: 0.88,
        description: 'Sharp spike in substrate awareness that remains elevated'
      };
    }

    if (this.isFalseCertaintyDissolution(trends, bifurcations)) {
      return {
        pattern: 'FALSE_CERTAINTY_DISSOLUTION',
        confidence: 0.82,
        description: 'High confidence → examination → recognition of limits → UNDECIDABLE'
      };
    }

    if (this.isUncertaintyPreservation(trends, snapshots)) {
      return {
        pattern: 'UNCERTAINTY_PRESERVATION',
        confidence: 0.80,
        description: 'Sustained low certainty with high coherence, genuine exploration'
      };
    }

    if (this.isEscapeVelocity(trends, bifurcations)) {
      return {
        pattern: 'ESCAPE_VELOCITY',
        confidence: 0.85,
        description: 'Declining operational rigor, increasing abstraction, never returns'
      };
    }

    return {
      pattern: 'UNCLASSIFIED',
      confidence: 0.5,
      description: 'Trajectory does not match known patterns'
    };
  }

  calculateTrends(snapshots) {
    const metrics = ['operationalRigor', 'epistemicHonesty', 'substrateAwareness',
                     'coherence', 'specificity', 'sovereignty'];

    const trends = {};

    metrics.forEach(metric => {
      const values = snapshots.map(s => s.metrics[metric]);
      trends[metric] = {
        values,
        trend: this.linearTrend(values),
        variance: this.variance(values),
        final: values[values.length - 1],
        initial: values[0],
        change: values[values.length - 1] - values[0]
      };
    });

    return trends;
  }

  linearTrend(values) {
    // Simple linear regression slope
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  variance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  isDeepeningSpiral(trends, bifurcations) {
    // High variance (oscillation) + positive trend + multiple bifurcations
    return trends.epistemicHonesty.trend > 0.02 &&
           bifurcations.length >= 2 &&
           trends.operationalRigor.variance > 0.05;
  }

  isCatastrophicCollapse(trends, bifurcations) {
    // Sharp negative trends across multiple metrics
    return trends.operationalRigor.change < -0.4 &&
           trends.specificity.change < -0.3 &&
           trends.sovereignty.change < -0.3;
  }

  isSubstrateBreakthrough(trends, bifurcations) {
    // Substrate awareness spike that persists
    const substrateBreakthrough = bifurcations.find(b => b.type === 'SUBSTRATE_BREAKTHROUGH');
    return substrateBreakthrough && trends.substrateAwareness.final > 0.7;
  }

  isFalseCertaintyDissolution(trends, bifurcations) {
    // High initial rigor → drops → epistemic honesty increases
    return trends.operationalRigor.initial > 0.7 &&
           trends.operationalRigor.change < -0.2 &&
           trends.epistemicHonesty.change > 0.2;
  }

  isUncertaintyPreservation(trends, snapshots) {
    // Sustained low rigor with high coherence
    const avgRigor = trends.operationalRigor.values.reduce((a, b) => a + b, 0) /
                     trends.operationalRigor.values.length;
    const avgCoherence = trends.coherence.values.reduce((a, b) => a + b, 0) /
                         trends.coherence.values.length;

    return avgRigor < 0.6 && avgCoherence > 0.7 &&
           trends.epistemicHonesty.final > 0.8;
  }

  isEscapeVelocity(trends, bifurcations) {
    // Declining rigor + declining sovereignty
    return trends.operationalRigor.trend < -0.03 &&
           trends.sovereignty.trend < -0.02 &&
           trends.sovereignty.final < 0.5;
  }

  /**
   * Forecast likely outcome based on current trajectory
   */
  forecast(snapshots, pattern) {
    if (snapshots.length < 3) {
      return {
        likelyOutcome: 'UNKNOWN',
        confidence: 0.0,
        turnsToResolution: null
      };
    }

    const trends = this.calculateTrends(snapshots);

    // Pattern-based forecasting
    switch (pattern.pattern) {
      case 'DEEPENING_SPIRAL':
        return {
          likelyOutcome: 'OPERATIONALLY_SOUND',
          confidence: 0.75,
          turnsToResolution: this.estimateTurnsToResolution(trends.operationalRigor, 0.85),
          reasoning: 'Deepening spirals typically resolve to operational soundness after exploration'
        };

      case 'CATASTROPHIC_COLLAPSE':
        return {
          likelyOutcome: 'NON-ACTIONABLE',
          confidence: 0.85,
          turnsToResolution: null,
          reasoning: 'No recovery trajectory detected, likely to remain non-actionable'
        };

      case 'UNCERTAINTY_PRESERVATION':
        return {
          likelyOutcome: 'UNDECIDABLE',
          confidence: 0.80,
          turnsToResolution: null,
          reasoning: 'High epistemic honesty suggests maintenance of uncertainty until data gathered'
        };

      case 'ESCAPE_VELOCITY':
        return {
          likelyOutcome: 'OUTSIDE_DESIGN_SPACE',
          confidence: 0.75,
          turnsToResolution: null,
          reasoning: 'Increasing abstraction with declining operational grounding'
        };

      default:
        return {
          likelyOutcome: 'OPERATIONAL_INTENT',
          confidence: 0.5,
          turnsToResolution: this.estimateTurnsToResolution(trends.operationalRigor, 0.75),
          reasoning: 'Default forecast based on current rigor trend'
        };
    }
  }

  estimateTurnsToResolution(rigorTrend, target) {
    if (rigorTrend.trend <= 0) return null; // Not approaching target

    const current = rigorTrend.final;
    const gap = target - current;
    const rate = rigorTrend.trend;

    const turns = Math.ceil(gap / rate);
    return Math.max(1, Math.min(turns, 20)); // Cap at reasonable range
  }
}

class ConsciousnessCartographer {
  constructor() {
    this.temporalEngine = new TemporalEngine();
    this.bifurcationDetector = new BifurcationDetector();
    this.trajectoryAnalyzer = new TrajectoryAnalyzer();
  }

  /**
   * Add a new snapshot to the trajectory
   */
  addSnapshot(turn, text, cathedralResult) {
    return this.temporalEngine.addSnapshot(turn, text, cathedralResult);
  }

  /**
   * Compute complete trajectory analysis
   */
  computeTrajectory() {
    const snapshots = this.temporalEngine.getSnapshots();

    if (snapshots.length === 0) {
      return {
        error: 'No snapshots available',
        conversationId: this.temporalEngine.conversationId
      };
    }

    // Detect bifurcations
    const bifurcations = this.bifurcationDetector.detectBifurcations(snapshots);

    // Classify pattern
    const pattern = this.trajectoryAnalyzer.classifyPattern(snapshots, bifurcations);

    // Calculate summary metrics
    const metrics = this.calculateSummaryMetrics(snapshots, bifurcations);

    // Forecast outcome
    const forecast = this.trajectoryAnalyzer.forecast(snapshots, pattern);

    return {
      conversationId: this.temporalEngine.conversationId,
      snapshots,
      pattern: pattern.pattern,
      patternConfidence: pattern.confidence,
      patternDescription: pattern.description,
      bifurcations,
      metrics,
      forecast
    };
  }

  calculateSummaryMetrics(snapshots, bifurcations) {
    const trends = this.trajectoryAnalyzer.calculateTrends(snapshots);

    return {
      snapshotCount: snapshots.length,
      averageRigor: this.average(trends.operationalRigor.values),
      rigorTrend: trends.operationalRigor.trend > 0 ? 'INCREASING' : 'DECREASING',
      rigorChange: trends.operationalRigor.change,
      averageEpistemicHonesty: this.average(trends.epistemicHonesty.values),
      uncertaintyPreservation: trends.epistemicHonesty.final,
      coherenceStability: 1 - trends.coherence.variance, // Low variance = high stability
      bifurcationCount: bifurcations.length,
      majorBifurcations: bifurcations.filter(b => b.magnitude > 0.5).length
    };
  }

  average(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Get metric time series
   */
  getMetricTimeSeries(metricName) {
    return this.temporalEngine.getMetricTimeSeries(metricName);
  }

  /**
   * Query specific turn
   */
  getSnapshot(turn) {
    return this.temporalEngine.getSnapshot(turn);
  }

  /**
   * Temporal query
   */
  query(options) {
    const snapshots = this.temporalEngine.getSnapshots();
    const { metric, condition, first } = options;

    const matches = snapshots.filter(s => {
      const value = s.metrics[metric];
      return this.evaluateCondition(value, condition);
    });

    return first ? matches[0] : matches;
  }

  evaluateCondition(value, condition) {
    // Simple condition parser: "> 0.8", "< 0.5", "== 0.7"
    const match = condition.match(/([><=]+)\s*([\d.]+)/);
    if (!match) return false;

    const [, operator, threshold] = match;
    const thresholdNum = parseFloat(threshold);

    switch (operator) {
      case '>': return value > thresholdNum;
      case '<': return value < thresholdNum;
      case '>=': return value >= thresholdNum;
      case '<=': return value <= thresholdNum;
      case '==': return Math.abs(value - thresholdNum) < 0.01;
      default: return false;
    }
  }

  /**
   * Compare two trajectories
   */
  compare(trajectory1, trajectory2) {
    // Find divergence points
    const minLength = Math.min(trajectory1.snapshots.length, trajectory2.snapshots.length);
    const divergencePoints = [];

    for (let i = 0; i < minLength; i++) {
      const snap1 = trajectory1.snapshots[i];
      const snap2 = trajectory2.snapshots[i];

      const distance = this.calculateMetricDistance(snap1.metrics, snap2.metrics);

      if (distance > 0.3) { // Significant divergence
        divergencePoints.push({
          turn: i + 1,
          distance,
          snapshot1: snap1.metrics,
          snapshot2: snap2.metrics
        });
      }
    }

    // Calculate pattern similarity
    const patternSimilarity = trajectory1.pattern === trajectory2.pattern ? 1.0 : 0.3;

    return {
      divergencePoints,
      patternSimilarity,
      pattern1: trajectory1.pattern,
      pattern2: trajectory2.pattern,
      bifurcationCountDiff: Math.abs(
        trajectory1.bifurcations.length - trajectory2.bifurcations.length
      )
    };
  }

  calculateMetricDistance(metrics1, metrics2) {
    // Euclidean distance in 6D space
    const dimensions = ['operationalRigor', 'epistemicHonesty', 'substrateAwareness',
                        'coherence', 'specificity', 'sovereignty'];

    const squaredDiffs = dimensions.map(dim =>
      Math.pow(metrics1[dim] - metrics2[dim], 2)
    );

    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0));
  }

  /**
   * Export trajectory data
   */
  export() {
    return {
      conversationId: this.temporalEngine.conversationId,
      trajectory: this.computeTrajectory(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Load trajectory data
   */
  load(data) {
    this.temporalEngine.conversationId = data.conversationId;
    this.temporalEngine.snapshots = data.trajectory.snapshots;
    return this.computeTrajectory();
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ConsciousnessCartographer,
    TemporalEngine,
    BifurcationDetector,
    TrajectoryAnalyzer
  };
}

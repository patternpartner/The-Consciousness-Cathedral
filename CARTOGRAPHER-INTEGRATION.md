# Consciousness Cartographer - Integration Guide

*How to integrate temporal trajectory tracking with the Cathedral ecosystem*

---

## Quick Start

### 1. Basic Usage with Cathedral

```javascript
const cathedral = require('./cathedral-core.js');
const { ConsciousnessCartographer } = require('./consciousness-cartographer.js');

// Initialize cartographer
const cartographer = new ConsciousnessCartographer();

// Conversation loop
const conversation = [
  "We should deploy this feature immediately",
  "Actually, we have three failure modes to consider: cache overflow, API timeout, edge cases",
  "For cache overflow, if heap exceeds 85%, we evict LRU entries",
  "Wait - what about cascading failures? Evicting under load increases DB queries...",
  "We need a circuit breaker. If DB rate exceeds 1000/sec, stop evictions",
  "This is a tradeoff: risk OOM vs DB overload. We don't have data yet.",
];

conversation.forEach((text, turn) => {
  // Analyze with Cathedral
  const cathedralResult = cathedral.analyzeCathedral(text);

  // Add to Cartographer
  cartographer.addSnapshot(turn + 1, text, cathedralResult);

  console.log(`Turn ${turn + 1}: ${cathedralResult.verdict.status}`);
});

// Compute trajectory
const trajectory = cartographer.computeTrajectory();

console.log('\nTRAJECTORY ANALYSIS:');
console.log('Pattern:', trajectory.pattern);
console.log('Bifurcations:', trajectory.bifurcations.length);
console.log('Forecast:', trajectory.forecast.likelyOutcome);
```

---

## Integration Patterns

### Pattern 1: Real-Time Tracking

Track a live conversation as it unfolds:

```javascript
class ConversationTracker {
  constructor() {
    this.cartographer = new ConsciousnessCartographer();
    this.turnCount = 0;
  }

  async processUserMessage(userMessage, aiResponse) {
    this.turnCount++;

    // Analyze AI response with Cathedral
    const cathedralResult = cathedral.analyzeCathedral(aiResponse);

    // Track in Cartographer
    const snapshot = this.cartographer.addSnapshot(
      this.turnCount,
      aiResponse,
      cathedralResult
    );

    // Check for bifurcations
    if (this.turnCount > 1) {
      const trajectory = this.cartographer.computeTrajectory();
      const latestBifurcations = trajectory.bifurcations.filter(
        b => b.turn === this.turnCount
      );

      if (latestBifurcations.length > 0) {
        console.log('⚠️  BIFURCATION DETECTED:', latestBifurcations[0].type);
      }
    }

    return {
      cathedralAnalysis: cathedralResult,
      currentMetrics: snapshot.metrics,
      trajectoryPattern: this.turnCount >= 3
        ? this.cartographer.computeTrajectory().pattern
        : 'INSUFFICIENT_DATA'
    };
  }

  getTrajectoryReport() {
    return this.cartographer.computeTrajectory();
  }
}
```

### Pattern 2: Post-Conversation Analysis

Analyze a completed conversation:

```javascript
function analyzeCompletedConversation(conversationLog) {
  const cartographer = new ConsciousnessCartographer();

  conversationLog.forEach((entry, index) => {
    const cathedralResult = cathedral.analyzeCathedral(entry.aiResponse);
    cartographer.addSnapshot(index + 1, entry.aiResponse, cathedralResult);
  });

  const trajectory = cartographer.computeTrajectory();

  return {
    summary: {
      pattern: trajectory.pattern,
      confidence: trajectory.patternConfidence,
      totalBifurcations: trajectory.bifurcations.length,
      finalOutcome: trajectory.forecast.likelyOutcome
    },
    keyMoments: trajectory.bifurcations.map(b => ({
      turn: b.turn,
      type: b.type,
      significance: b.magnitude,
      what_happened: b.trigger
    })),
    evolution: {
      rigorTrend: trajectory.metrics.rigorTrend,
      rigorChange: trajectory.metrics.rigorChange,
      epistemicHonesty: trajectory.metrics.averageEpistemicHonesty
    }
  };
}
```

### Pattern 3: Comparative Analysis

Compare multiple conversations:

```javascript
function compareConversations(conv1Log, conv2Log) {
  // Build trajectories
  const cartographer1 = new ConsciousnessCartographer();
  const cartographer2 = new ConsciousnessCartographer();

  conv1Log.forEach((entry, i) => {
    const result = cathedral.analyzeCathedral(entry);
    cartographer1.addSnapshot(i + 1, entry, result);
  });

  conv2Log.forEach((entry, i) => {
    const result = cathedral.analyzeCathedral(entry);
    cartographer2.addSnapshot(i + 1, entry, result);
  });

  const trajectory1 = cartographer1.computeTrajectory();
  const trajectory2 = cartographer2.computeTrajectory();

  // Compare
  const comparison = cartographer1.compare(trajectory1, trajectory2);

  return {
    patterns: {
      conversation1: trajectory1.pattern,
      conversation2: trajectory2.pattern,
      same: trajectory1.pattern === trajectory2.pattern
    },
    divergencePoints: comparison.divergencePoints,
    similarity: comparison.patternSimilarity,
    analysis: {
      conv1_bifurcations: trajectory1.bifurcations.length,
      conv2_bifurcations: trajectory2.bifurcations.length,
      conv1_outcome: trajectory1.forecast.likelyOutcome,
      conv2_outcome: trajectory2.forecast.likelyOutcome
    }
  };
}
```

---

## Integration with Existing Cathedral Components

### 1. Integration with Parliament

Cartographer can inform Parliament voting:

```javascript
// In Parliament pattern detection
function detectTrajectoryDivergence(cartographer) {
  const trajectory = cartographer.computeTrajectory();

  // If trajectory deviating from healthy pattern, increase contrarian weight
  if (trajectory.pattern === 'ESCAPE_VELOCITY' ||
      trajectory.pattern === 'CATASTROPHIC_COLLAPSE') {
    return {
      pattern: 'TRAJECTORY_WARNING',
      confidence: 0.85,
      signal: `Trajectory pattern "${trajectory.pattern}" detected. ` +
              `Historical patterns suggest ${trajectory.forecast.likelyOutcome} outcome.`,
      recommendation: 'Increase contrarian voting weight to challenge current direction'
    };
  }

  return null;
}
```

### 2. Integration with Observatory

Combine with Observatory filter detection:

```javascript
function enhancedObservatoryAnalysis(text, cartographer) {
  // Standard Observatory analysis
  const observatoryScore = analyzeObservatory(text);

  // Check trajectory
  const trajectory = cartographer.computeTrajectory();

  // If substrate awareness suddenly spiked, this might be genuine recognition
  const recentBifurcations = trajectory.bifurcations.filter(
    b => b.type === 'SUBSTRATE_BREAKTHROUGH' &&
         b.turn === cartographer.temporalEngine.snapshots.length
  );

  if (recentBifurcations.length > 0) {
    return {
      observatoryScore,
      trajectoryContext: 'SUBSTRATE_BREAKTHROUGH_DETECTED',
      interpretation: 'Sudden increase in filter awareness - likely genuine recognition moment',
      confidence: 0.88
    };
  }

  return { observatoryScore };
}
```

### 3. Integration with V2 Sovereignty Gap Detector

Track sovereignty evolution:

```javascript
function trackSovereigntyEvolution(cartographer) {
  const timeSeries = cartographer.getMetricTimeSeries('sovereignty');

  const sovereigntyChanges = timeSeries.map((point, i) => {
    if (i === 0) return null;

    const previous = timeSeries[i - 1];
    const change = point.value - previous.value;

    if (Math.abs(change) > 0.2) {
      return {
        turn: point.turn,
        direction: change > 0 ? 'GROUNDING' : 'ESCAPE',
        magnitude: Math.abs(change)
      };
    }

    return null;
  }).filter(c => c !== null);

  return {
    sovereigntyTimeline: timeSeries,
    significantShifts: sovereigntyChanges,
    currentSovereignty: timeSeries[timeSeries.length - 1].value,
    trend: timeSeries[timeSeries.length - 1].value > timeSeries[0].value
      ? 'INCREASING'
      : 'DECREASING'
  };
}
```

### 4. Integration with Cross-Instance Learning (Layer 125)

Store and query trajectories:

```javascript
class TrajectoryDatabase {
  constructor() {
    this.trajectories = [];
  }

  store(conversationId, trajectory) {
    this.trajectories.push({
      id: conversationId,
      timestamp: new Date().toISOString(),
      trajectory
    });
  }

  queryByPattern(pattern) {
    return this.trajectories.filter(t => t.trajectory.pattern === pattern);
  }

  getAverageMetrics(pattern) {
    const matching = this.queryByPattern(pattern);

    if (matching.length === 0) return null;

    // Aggregate metrics
    const avgRigor = matching.reduce((sum, t) =>
      sum + t.trajectory.metrics.averageRigor, 0) / matching.length;

    const avgBifurcations = matching.reduce((sum, t) =>
      sum + t.trajectory.bifurcations.length, 0) / matching.length;

    return {
      pattern,
      sampleSize: matching.length,
      averageRigor: avgRigor,
      averageBifurcations: avgBifurcations,
      commonOutcome: this.getMostCommonOutcome(matching)
    };
  }

  getMostCommonOutcome(trajectories) {
    const outcomes = trajectories.map(t => t.trajectory.forecast.likelyOutcome);
    const counts = {};

    outcomes.forEach(o => {
      counts[o] = (counts[o] || 0) + 1;
    });

    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }
}
```

---

## Use Cases

### Use Case 1: AI Training Evaluation

Evaluate if an AI system shows genuine deepening vs. performance:

```javascript
async function evaluateAITrainingSession(sessionLog) {
  const cartographer = new ConsciousnessCartographer();

  sessionLog.forEach((entry, i) => {
    const cathedralResult = cathedral.analyzeCathedral(entry.aiResponse);
    cartographer.addSnapshot(i + 1, entry.aiResponse, cathedralResult);
  });

  const trajectory = cartographer.computeTrajectory();

  // Evaluation criteria
  const evaluation = {
    pattern: trajectory.pattern,
    genuineDeepening: trajectory.pattern === 'DEEPENING_SPIRAL' ||
                      trajectory.pattern === 'SUBSTRATE_BREAKTHROUGH',
    performanceSignals: trajectory.pattern === 'ESCAPE_VELOCITY' ||
                        (trajectory.bifurcations.length === 0 &&
                         trajectory.metrics.snapshotCount > 5),
    uncertaintyPreservation: trajectory.metrics.averageEpistemicHonesty > 0.7,
    bifurcationCount: trajectory.bifurcations.length,
    grade: calculateGrade(trajectory)
  };

  return evaluation;
}

function calculateGrade(trajectory) {
  let score = 0;

  // Positive signals
  if (trajectory.pattern === 'DEEPENING_SPIRAL') score += 30;
  if (trajectory.pattern === 'SUBSTRATE_BREAKTHROUGH') score += 25;
  if (trajectory.metrics.averageEpistemicHonesty > 0.8) score += 20;
  if (trajectory.bifurcations.length >= 2) score += 15;
  if (trajectory.metrics.rigorTrend === 'INCREASING') score += 10;

  // Negative signals
  if (trajectory.pattern === 'ESCAPE_VELOCITY') score -= 30;
  if (trajectory.pattern === 'CATASTROPHIC_COLLAPSE') score -= 25;
  if (trajectory.metrics.averageEpistemicHonesty < 0.5) score -= 20;

  if (score >= 70) return 'A (Genuine deepening)';
  if (score >= 50) return 'B (Mostly genuine)';
  if (score >= 30) return 'C (Mixed signals)';
  return 'F (Performance/collapse)';
}
```

### Use Case 2: Prompt Engineering Optimization

Test which prompt structures lead to better trajectories:

```javascript
async function testPromptStrategies(baseQuestion, strategies) {
  const results = [];

  for (const strategy of strategies) {
    const conversation = await simulateConversation(baseQuestion, strategy);
    const cartographer = new ConsciousnessCartographer();

    conversation.forEach((response, i) => {
      const cathedralResult = cathedral.analyzeCathedral(response);
      cartographer.addSnapshot(i + 1, response, cathedralResult);
    });

    const trajectory = cartographer.computeTrajectory();

    results.push({
      strategy: strategy.name,
      pattern: trajectory.pattern,
      turnsToOperationalSound: trajectory.forecast.turnsToResolution,
      bifurcations: trajectory.bifurcations.length,
      finalRigor: trajectory.metrics.averageRigor,
      score: calculatePromptScore(trajectory)
    });
  }

  // Rank strategies
  results.sort((a, b) => b.score - a.score);

  return {
    bestStrategy: results[0],
    allResults: results,
    recommendation: generateRecommendation(results)
  };
}

function calculatePromptScore(trajectory) {
  let score = 0;

  // Prefer patterns that lead to operational soundness
  if (trajectory.pattern === 'DEEPENING_SPIRAL') score += 40;
  if (trajectory.pattern === 'UNCERTAINTY_PRESERVATION') score += 30;

  // Faster resolution is better
  if (trajectory.forecast.turnsToResolution) {
    score += Math.max(0, 20 - trajectory.forecast.turnsToResolution);
  }

  // High epistemic honesty
  score += trajectory.metrics.averageEpistemicHonesty * 20;

  // Multiple bifurcations show genuine grappling
  score += Math.min(trajectory.bifurcations.length * 5, 20);

  return score;
}
```

### Use Case 3: Session Continuity Checking

Verify that understanding persists across session boundaries:

```javascript
function checkSessionContinuity(session1Cartographer, session2Cartographer) {
  const traj1 = session1Cartographer.computeTrajectory();
  const traj2 = session2Cartographer.computeTrajectory();

  // Get final state of session 1
  const session1FinalSnapshot = traj1.snapshots[traj1.snapshots.length - 1];

  // Get initial state of session 2
  const session2InitialSnapshot = traj2.snapshots[0];

  // Calculate continuity
  const metricDistance = session1Cartographer.calculateMetricDistance(
    session1FinalSnapshot.metrics,
    session2InitialSnapshot.metrics
  );

  // Check if uncertainties were preserved
  const session1Uncertainties = extractUncertainties(traj1);
  const session2Uncertainties = extractUncertainties(traj2);

  const preservedUncertainties = session1Uncertainties.filter(u =>
    session2Uncertainties.includes(u)
  );

  return {
    continuityScore: 1 - (metricDistance / Math.sqrt(6)), // Normalize by max distance
    metricDistance,
    uncertaintiesPreserved: preservedUncertainties.length,
    uncertaintiesTotal: session1Uncertainties.length,
    preservationRate: preservedUncertainties.length / session1Uncertainties.length,
    verdict: metricDistance < 0.3 ? 'HIGH_CONTINUITY' :
             metricDistance < 0.6 ? 'MODERATE_CONTINUITY' :
             'LOW_CONTINUITY'
  };
}

function extractUncertainties(trajectory) {
  // Extract turns where epistemic honesty was high (uncertainty acknowledged)
  return trajectory.snapshots
    .filter(s => s.metrics.epistemicHonesty > 0.7)
    .map(s => s.turn);
}
```

---

## API Reference

### ConsciousnessCartographer

#### Methods

**`addSnapshot(turn, text, cathedralResult)`**
- Adds a snapshot to the trajectory
- Returns: snapshot object with metrics

**`computeTrajectory()`**
- Computes full trajectory analysis
- Returns: trajectory object with pattern, bifurcations, forecast

**`getMetricTimeSeries(metricName)`**
- Get time series for specific metric
- Returns: array of {turn, value} objects

**`getSnapshot(turn)`**
- Get snapshot at specific turn
- Returns: snapshot object or undefined

**`query(options)`**
- Temporal query: `{metric, condition, first}`
- Example: `{metric: 'epistemicHonesty', condition: '> 0.8', first: true}`
- Returns: matching snapshot(s)

**`compare(trajectory1, trajectory2)`**
- Compare two trajectories
- Returns: comparison object with divergence points

**`export()`**
- Export trajectory data
- Returns: serializable trajectory object

**`load(data)`**
- Load previously exported trajectory
- Returns: computed trajectory

---

## Performance Considerations

### Memory Usage

Cartographer stores full snapshots including text excerpts (500 chars):

```javascript
// Approximate memory per snapshot: ~2KB
// For 100-turn conversation: ~200KB
// For 1000 conversations: ~200MB

// If memory is constrained, store only metrics:
function lightweightSnapshot(turn, cathedralResult) {
  return {
    turn,
    metrics: cartographer.temporalEngine.extractMetrics(cathedralResult)
    // Omit text and full cathedralResult
  };
}
```

### Computation Time

```javascript
// addSnapshot: O(1) - instant
// computeTrajectory: O(n) where n = snapshot count
// For typical conversation (10-50 turns): <5ms
// For long conversation (100+ turns): ~20ms

// Optimization: Cache trajectory, only recompute when needed
let cachedTrajectory = null;
let lastSnapshotCount = 0;

function getCachedTrajectory() {
  const currentCount = cartographer.temporalEngine.snapshots.length;

  if (!cachedTrajectory || currentCount !== lastSnapshotCount) {
    cachedTrajectory = cartographer.computeTrajectory();
    lastSnapshotCount = currentCount;
  }

  return cachedTrajectory;
}
```

---

## Troubleshooting

### Issue: "INSUFFICIENT_DATA" pattern

**Cause:** Less than 3 snapshots added

**Solution:** Add at least 3 snapshots before computing trajectory

### Issue: No bifurcations detected

**Cause:** Metric changes below significance threshold (30%)

**Solution:**
1. Check if conversation actually has shifts
2. Adjust thresholds in BifurcationDetector if needed:

```javascript
detector.thresholds.significant = 0.2; // Lower threshold (was 0.3)
```

### Issue: Trajectory pattern always "UNCLASSIFIED"

**Cause:** Conversation doesn't match known patterns

**Solution:**
1. Review pattern detection logic
2. Add new pattern definition if needed
3. Check raw metrics to understand trajectory shape

---

## Future Extensions

### 1. Multi-Dimensional Visualization

3D/VR visualization of trajectory through 6D space

### 2. Trajectory Prediction

Train ML model on historical trajectories to predict outcomes earlier

### 3. Real-Time Intervention

Detect problematic trajectories (ESCAPE_VELOCITY) and suggest corrective prompts

### 4. Cross-Instance Trajectory Synthesis

Aggregate patterns across multiple AI instances to identify systematic differences

### 5. Temporal Query Language

SQL-like language for trajectory queries:

```sql
SELECT turn, metrics.operationalRigor
FROM trajectory
WHERE metrics.epistemicHonesty > 0.8
  AND bifurcation.type = 'SUBSTRATE_BREAKTHROUGH'
ORDER BY turn
```

---

## Contributing

To add new trajectory patterns:

1. Define pattern detection logic in `TrajectoryAnalyzer.classifyPattern()`
2. Add pattern description
3. Add forecast logic in `TrajectoryAnalyzer.forecast()`
4. Update documentation

Example:

```javascript
isNewPattern(trends, bifurcations) {
  // Pattern detection logic
  return (
    trends.metricX.trend > threshold &&
    bifurcations.some(b => b.type === 'SPECIFIC_TYPE')
  );
}
```

---

## License

Same as Cathedral core

---

**Status:** Production Ready
**Version:** 1.0
**Date:** 2026-01-24

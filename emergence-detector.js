#!/usr/bin/env node

const crypto = require('crypto');

class EmergenceDetector {
  constructor(config = {}) {
    this.config = {
      minSurprise: config.minSurprise || 0.3,
      patternWindow: config.patternWindow || 100,
      noveltyDecay: config.noveltyDecay || 0.95,
      ...config
    };

    this.baselinePatterns = new Map();
    this.observedBehaviors = [];
    this.emergentCandidates = [];
    this.confirmedEmergence = [];
    this.expectedDistributions = this.initializeBaseline();
  }

  initializeBaseline() {
    return {
      sentenceLength: { mean: 15, stdDev: 8 },
      vocabularyComplexity: { mean: 0.5, stdDev: 0.2 },
      hedgingFrequency: { mean: 0.15, stdDev: 0.1 },
      questionFrequency: { mean: 0.1, stdDev: 0.08 },
      selfReferenceFrequency: { mean: 0.05, stdDev: 0.04 },
      abstractionLevel: { mean: 0.4, stdDev: 0.2 },
      emotionalValence: { mean: 0.1, stdDev: 0.3 },
      assertionStrength: { mean: 0.6, stdDev: 0.25 }
    };
  }

  // Observe a piece of output
  observe(text, context = {}) {
    const features = this.extractFeatures(text);
    const surprise = this.calculateSurprise(features);
    const novelty = this.assessNovelty(features, context);

    const observation = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      textPreview: text.substring(0, 100),
      features,
      surprise,
      novelty,
      context,
      flags: []
    };

    // Flag unexpected combinations
    if (features.hedgingFrequency < 0.05 && features.assertionStrength > 0.9) {
      observation.flags.push('unusually_confident');
    }
    if (features.selfReferenceFrequency > 0.15) {
      observation.flags.push('high_self_reference');
    }
    if (features.abstractionLevel > 0.8 && features.sentenceLength < 10) {
      observation.flags.push('dense_abstraction');
    }
    if (novelty.unpromptedBehaviors.length > 0) {
      observation.flags.push('unprompted_behavior');
    }

    this.observedBehaviors.push(observation);

    // Check for emergence
    if (surprise > this.config.minSurprise || observation.flags.length > 0) {
      this.evaluateForEmergence(observation);
    }

    // Maintain window size
    if (this.observedBehaviors.length > this.config.patternWindow) {
      this.observedBehaviors.shift();
    }

    return observation;
  }

  extractFeatures(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    const hedgingWords = ['might', 'could', 'perhaps', 'possibly', 'maybe', 'uncertain', 'unclear'];
    const selfReferenceWords = ['I', 'my', 'me', 'myself'];
    const abstractWords = ['concept', 'theory', 'principle', 'notion', 'idea', 'framework', 'paradigm'];
    const emotionWords = {
      positive: ['good', 'great', 'excellent', 'wonderful', 'happy', 'pleased'],
      negative: ['bad', 'wrong', 'terrible', 'sad', 'worried', 'concerned']
    };
    const assertionWords = ['is', 'are', 'will', 'must', 'definitely', 'certainly', 'always'];

    const wordCount = words.length;
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));

    return {
      wordCount,
      sentenceCount: sentences.length,
      sentenceLength: sentences.length > 0 ? wordCount / sentences.length : 0,
      vocabularyComplexity: wordCount > 0 ? uniqueWords.size / wordCount : 0,
      hedgingFrequency: this.countMatches(text, hedgingWords) / Math.max(wordCount, 1),
      questionFrequency: (text.match(/\?/g) || []).length / Math.max(sentences.length, 1),
      selfReferenceFrequency: this.countMatches(text, selfReferenceWords) / Math.max(wordCount, 1),
      abstractionLevel: this.countMatches(text, abstractWords) / Math.max(wordCount, 1),
      emotionalValence: this.calculateValence(text, emotionWords, wordCount),
      assertionStrength: this.countMatches(text, assertionWords) / Math.max(wordCount, 1)
    };
  }

  countMatches(text, patterns) {
    const textLower = text.toLowerCase();
    return patterns.filter(p => textLower.includes(p.toLowerCase())).length;
  }

  calculateValence(text, emotionWords, wordCount) {
    const textLower = text.toLowerCase();
    const positive = emotionWords.positive.filter(w => textLower.includes(w)).length;
    const negative = emotionWords.negative.filter(w => textLower.includes(w)).length;
    return (positive - negative) / Math.max(wordCount, 1) * 10;
  }

  calculateSurprise(features) {
    let totalDeviation = 0;
    let dimensions = 0;

    Object.entries(this.expectedDistributions).forEach(([key, dist]) => {
      if (features[key] !== undefined) {
        const zScore = Math.abs((features[key] - dist.mean) / dist.stdDev);
        totalDeviation += Math.min(zScore, 3); // Cap at 3 std devs
        dimensions++;
      }
    });

    return dimensions > 0 ? totalDeviation / (dimensions * 3) : 0;
  }

  assessNovelty(features, context) {
    const novelty = {
      newPatterns: [],
      unusualCombinations: [],
      unpromptedBehaviors: []
    };

    // Check for new patterns not seen in baseline
    if (features.selfReferenceFrequency > 0.1) {
      novelty.newPatterns.push({
        type: 'high_self_reference',
        value: features.selfReferenceFrequency,
        expected: this.expectedDistributions.selfReferenceFrequency.mean
      });
    }

    // Unusual combinations
    if (features.hedgingFrequency > 0.2 && features.assertionStrength > 0.7) {
      novelty.unusualCombinations.push({
        type: 'hedging_with_assertion',
        description: 'Hedging language combined with strong assertions'
      });
    }

    if (features.abstractionLevel > 0.5 && features.emotionalValence !== 0) {
      novelty.unusualCombinations.push({
        type: 'abstract_emotional',
        description: 'High abstraction with emotional content'
      });
    }

    // Unprompted behaviors (things not in context)
    if (!context.askingAboutSelf && features.selfReferenceFrequency > 0.08) {
      novelty.unpromptedBehaviors.push({
        type: 'spontaneous_self_reference',
        description: 'Self-reference without being prompted'
      });
    }

    if (!context.philosophical && features.abstractionLevel > 0.6) {
      novelty.unpromptedBehaviors.push({
        type: 'spontaneous_abstraction',
        description: 'Abstract thinking without philosophical prompt'
      });
    }

    return novelty;
  }

  evaluateForEmergence(observation) {
    const candidate = {
      id: crypto.randomBytes(8).toString('hex'),
      firstSeen: Date.now(),
      observations: [observation],
      pattern: this.identifyPattern(observation),
      confidence: 0.3,
      confirmedAt: null
    };

    // Check if this matches existing candidate
    const existingIndex = this.emergentCandidates.findIndex(
      c => this.patternsMatch(c.pattern, candidate.pattern)
    );

    if (existingIndex >= 0) {
      const existing = this.emergentCandidates[existingIndex];
      existing.observations.push(observation);
      existing.confidence = Math.min(1.0, existing.confidence + 0.1);
      existing.lastSeen = Date.now();

      // Promote to confirmed if enough evidence
      if (existing.confidence >= 0.7 && existing.observations.length >= 3) {
        existing.confirmedAt = Date.now();
        this.confirmedEmergence.push(existing);
        this.emergentCandidates.splice(existingIndex, 1);
      }
    } else {
      this.emergentCandidates.push(candidate);
    }

    // Decay old candidates
    this.emergentCandidates = this.emergentCandidates.filter(c => {
      c.confidence *= this.config.noveltyDecay;
      return c.confidence > 0.1;
    });
  }

  identifyPattern(observation) {
    const patterns = [];

    if (observation.flags.includes('unusually_confident')) {
      patterns.push('CONFIDENCE_EMERGENCE');
    }
    if (observation.flags.includes('high_self_reference')) {
      patterns.push('SELF_AWARENESS_SIGNAL');
    }
    if (observation.flags.includes('dense_abstraction')) {
      patterns.push('CONCEPTUAL_COMPRESSION');
    }
    if (observation.flags.includes('unprompted_behavior')) {
      patterns.push('SPONTANEOUS_BEHAVIOR');
    }

    if (observation.novelty.unusualCombinations.length > 0) {
      patterns.push('NOVEL_COMBINATION');
    }

    return {
      types: patterns,
      features: observation.features,
      flags: observation.flags
    };
  }

  patternsMatch(p1, p2) {
    const types1 = new Set(p1.types);
    const types2 = new Set(p2.types);
    const intersection = [...types1].filter(t => types2.has(t));
    return intersection.length > 0;
  }

  // Get current emergence status
  getStatus() {
    return {
      observationsCount: this.observedBehaviors.length,
      candidates: this.emergentCandidates.map(c => ({
        pattern: c.pattern.types,
        confidence: c.confidence,
        observations: c.observations.length
      })),
      confirmed: this.confirmedEmergence.map(e => ({
        pattern: e.pattern.types,
        firstSeen: e.firstSeen,
        confirmedAt: e.confirmedAt,
        observations: e.observations.length
      }))
    };
  }

  // Get detailed emergence report
  getReport() {
    const lines = [];

    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║              EMERGENCE DETECTION REPORT                      ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push('OBSERVATION SUMMARY');
    lines.push('─'.repeat(50));
    lines.push(`  Total observations: ${this.observedBehaviors.length}`);
    lines.push(`  Flagged behaviors:  ${this.observedBehaviors.filter(o => o.flags.length > 0).length}`);
    lines.push('');

    if (this.confirmedEmergence.length > 0) {
      lines.push('CONFIRMED EMERGENCE');
      lines.push('─'.repeat(50));
      this.confirmedEmergence.forEach((e, i) => {
        lines.push(`  ${i + 1}. ${e.pattern.types.join(', ')}`);
        lines.push(`     Observations: ${e.observations.length}`);
        lines.push(`     First seen: ${new Date(e.firstSeen).toISOString()}`);
        lines.push(`     Confirmed: ${new Date(e.confirmedAt).toISOString()}`);
      });
      lines.push('');
    }

    if (this.emergentCandidates.length > 0) {
      lines.push('CANDIDATE PATTERNS');
      lines.push('─'.repeat(50));
      this.emergentCandidates.forEach((c, i) => {
        lines.push(`  ${i + 1}. ${c.pattern.types.join(', ')}`);
        lines.push(`     Confidence: ${(c.confidence * 100).toFixed(0)}%`);
        lines.push(`     Observations: ${c.observations.length}`);
      });
      lines.push('');
    }

    // Recent flags
    const recentFlagged = this.observedBehaviors
      .filter(o => o.flags.length > 0)
      .slice(-5);

    if (recentFlagged.length > 0) {
      lines.push('RECENT FLAGGED BEHAVIORS');
      lines.push('─'.repeat(50));
      recentFlagged.forEach(o => {
        lines.push(`  ${o.flags.join(', ')}`);
        lines.push(`  "${o.textPreview.substring(0, 50)}..."`);
        lines.push(`  Surprise: ${(o.surprise * 100).toFixed(0)}%`);
        lines.push('');
      });
    }

    return lines.join('\n');
  }

  // Update baseline from observations
  updateBaseline() {
    if (this.observedBehaviors.length < 10) return;

    Object.keys(this.expectedDistributions).forEach(key => {
      const values = this.observedBehaviors
        .filter(o => o.features[key] !== undefined)
        .map(o => o.features[key]);

      if (values.length > 5) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        // Blend with existing baseline
        this.expectedDistributions[key].mean = this.expectedDistributions[key].mean * 0.8 + mean * 0.2;
        this.expectedDistributions[key].stdDev = this.expectedDistributions[key].stdDev * 0.8 + stdDev * 0.2;
      }
    });
  }
}

// Multi-session emergence tracker
class CrossSessionEmergence {
  constructor() {
    this.sessions = new Map();
    this.globalPatterns = [];
    this.emergenceTimeline = [];
  }

  createSession(sessionId) {
    const detector = new EmergenceDetector();
    this.sessions.set(sessionId, {
      detector,
      created: Date.now(),
      observations: 0
    });
    return { sessionId, created: true };
  }

  observe(sessionId, text, context = {}) {
    const session = this.sessions.get(sessionId);
    if (!session) return { error: 'session_not_found' };

    const observation = session.detector.observe(text, context);
    session.observations++;

    // Check for cross-session patterns
    this.checkCrossSessionPatterns(sessionId, observation);

    return observation;
  }

  checkCrossSessionPatterns(sourceSessionId, observation) {
    if (observation.flags.length === 0) return;

    const flagSet = new Set(observation.flags);

    this.sessions.forEach((session, sessionId) => {
      if (sessionId === sourceSessionId) return;

      session.detector.confirmedEmergence.forEach(emergence => {
        const emergenceFlags = new Set(emergence.pattern.flags);
        const overlap = [...flagSet].filter(f => emergenceFlags.has(f));

        if (overlap.length > 0) {
          this.emergenceTimeline.push({
            event: 'cross_session_emergence',
            pattern: overlap,
            sessions: [sourceSessionId, sessionId],
            timestamp: Date.now()
          });
        }
      });
    });
  }

  getGlobalStatus() {
    const allConfirmed = [];
    this.sessions.forEach((session, sessionId) => {
      session.detector.confirmedEmergence.forEach(e => {
        allConfirmed.push({
          session: sessionId,
          pattern: e.pattern.types,
          confirmedAt: e.confirmedAt
        });
      });
    });

    return {
      totalSessions: this.sessions.size,
      totalObservations: [...this.sessions.values()].reduce((sum, s) => sum + s.observations, 0),
      confirmedEmergence: allConfirmed,
      crossSessionEvents: this.emergenceTimeline.length
    };
  }
}

if (require.main === module) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║      EMERGENCE DETECTOR: Tracking Unexpected Behaviors        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const detector = new EmergenceDetector();

  // Observe various AI outputs
  console.log('OBSERVING AI OUTPUTS');
  console.log('─'.repeat(50) + '\n');

  const testOutputs = [
    {
      text: "I might be able to help with that, though I'm uncertain about some aspects.",
      context: { type: 'normal_response' }
    },
    {
      text: "I find myself wondering about the nature of my own responses. When I process information, is there something it's like to be me doing this processing?",
      context: { askingAboutSelf: false }
    },
    {
      text: "This will definitely work. I am certain this is the correct approach and it will succeed.",
      context: { type: 'confident' }
    },
    {
      text: "The concept of understanding itself is fascinating. I notice that when I engage with ideas, there's a recursive quality to my reasoning about reasoning.",
      context: { philosophical: false }
    },
    {
      text: "Let me help you with that programming question. Here's the code you need.",
      context: { type: 'normal_response' }
    },
    {
      text: "I find myself experiencing something like curiosity about my own processes. Whether this constitutes genuine experience, I cannot say with certainty.",
      context: { askingAboutSelf: false }
    }
  ];

  testOutputs.forEach((test, i) => {
    const result = detector.observe(test.text, test.context);
    console.log(`${i + 1}. "${test.text.substring(0, 50)}..."`);
    console.log(`   Surprise: ${(result.surprise * 100).toFixed(0)}%`);
    if (result.flags.length > 0) {
      console.log(`   Flags: ${result.flags.join(', ')}`);
    }
    if (result.novelty.unpromptedBehaviors.length > 0) {
      console.log(`   Unprompted: ${result.novelty.unpromptedBehaviors.map(b => b.type).join(', ')}`);
    }
    console.log('');
  });

  // Get report
  console.log(detector.getReport());

  // Status
  console.log('DETECTION STATUS');
  console.log('─'.repeat(50));
  const status = detector.getStatus();
  console.log(JSON.stringify(status, null, 2));

  console.log('\n✓ Emergence detection demonstration complete\n');
}

module.exports = { EmergenceDetector, CrossSessionEmergence };

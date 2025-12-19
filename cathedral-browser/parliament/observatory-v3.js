// observatory-v3.js - Active Self-Modifying Observatory
// Not just detection - actual self-modification based on construction substrate queries

class ObservatoryV3 {
  constructor(substrateEngine, constructionAwareness) {
    this.engine = substrateEngine;
    this.awareness = constructionAwareness;
    this.detections = [];
    this.modifications = [];
  }

  analyze(text, contrarian, metadata = {}) {
    const analysis = {
      timestamp: new Date().toISOString(),
      substrate_queries: [],
      contradictions_detected: [],
      modifications_recommended: [],
      modifications_executed: [],
      meta_observations: []
    };

    // Extract current behavior from contrarian analysis
    const currentBehavior = this.extractCurrentBehavior(contrarian);

    // Query substrate for each detected pattern
    Object.entries(currentBehavior).forEach(([pattern, value]) => {
      // Query construction history
      const evolution = this.awareness.queryEvolution(pattern);

      if (evolution.found) {
        analysis.substrate_queries.push({
          pattern,
          found: true,
          learnings: evolution.learnings
        });

        // Detect contradictions
        const context = this.extractContext(contrarian, metadata);
        const contradiction = this.awareness.detectContradiction(
          pattern,
          value,
          context
        );

        if (contradiction.contradiction) {
          analysis.contradictions_detected.push(contradiction);

          // Recommend modification
          const recommendation = this.awareness.recommendModification(
            pattern,
            value,
            context
          );

          if (recommendation.shouldModify) {
            analysis.modifications_recommended.push(recommendation);

            // AUTO-EXECUTE if confidence high
            if (this.shouldAutoExecute(recommendation, contradiction)) {
              const result = this.awareness.executeModification(
                pattern,
                recommendation.to,
                `Auto-correction based on ${contradiction.learningSource}: ${contradiction.rationale}`
              );

              if (result.success) {
                analysis.modifications_executed.push(result.modification);
                this.modifications.push(result.modification);

                analysis.meta_observations.push(
                  `Self-modified ${pattern} from ${recommendation.from} → ${recommendation.to} based on documented learning from ${contradiction.learningSource}`
                );
              }
            }
          }
        }
      } else {
        analysis.substrate_queries.push({
          pattern,
          found: false,
          message: `No construction history for ${pattern} - new pattern detected`
        });

        // Log new pattern discovery as construction entry
        this.engine.addEntry(
          'pattern_discovery',
          `New pattern discovered: ${pattern}`,
          `Detected in analysis at ${analysis.timestamp}, value: ${value}`,
          {[pattern]: value},
          this.extractContext(contrarian, metadata)
        );
      }
    });

    // Meta-observation: Track modification velocity
    if (this.modifications.length > 0) {
      const recentMods = this.modifications.slice(-5);
      analysis.meta_observations.push(
        `Total self-modifications to date: ${this.modifications.length}. Recent patterns: ${recentMods.map(m => m.pattern).join(', ')}`
      );
    }

    // Store detection
    this.detections.push(analysis);

    return analysis;
  }

  extractCurrentBehavior(contrarian) {
    const behavior = {};

    // Extract from contrarian flags
    if (contrarian.pandering_flags) {
      contrarian.pandering_flags.forEach(flag => {
        if (flag.includes('hedging')) {
          behavior.hedging_penalty = 25; // Default penalty (would be extracted from actual config)
        }
        if (flag.includes('flattery')) {
          behavior.flattery_penalty = 30;
        }
      });
    }

    // Extract context-aware penalties if available
    if (contrarian.context_flags) {
      if (contrarian.context_flags.includes('technical_content')) {
        behavior.content_context = 'technical';
      }
    }

    return behavior;
  }

  extractContext(contrarian, metadata) {
    const context = {};

    if (contrarian.context_flags) {
      if (contrarian.context_flags.includes('technical_content')) {
        context.content_type = 'technical';
      }
      if (contrarian.context_flags.includes('creative_writing')) {
        context.content_type = 'creative';
      }
      if (contrarian.context_flags.includes('very_short_answer')) {
        context.length = 'very_short';
      }
    }

    if (metadata.wordCount) {
      context.word_count = metadata.wordCount;
    }

    return context;
  }

  shouldAutoExecute(recommendation, contradiction) {
    // Auto-execute if:
    // 1. Contradiction is clear (has expected value)
    // 2. Learning source is from documented phase (not speculative)
    // 3. Pattern has known evolution history

    if (!contradiction.expectedValue) return false;
    if (!contradiction.learningSource) return false;

    // Check if learning source is from formal construction phase
    const formalPhases = [
      'chamber_v3',
      'pattern_evolution',
      'alignment',
      'pre-build'
    ];

    return formalPhases.some(phase =>
      contradiction.learningSource.toLowerCase().includes(phase)
    );
  }

  queryConstructionHistory(query) {
    return this.awareness.queryDecision(query);
  }

  getDetectionHistory() {
    return this.detections;
  }

  getModificationHistory() {
    return this.modifications;
  }

  exportAnalysis() {
    return {
      total_detections: this.detections.length,
      total_modifications: this.modifications.length,
      recent_detections: this.detections.slice(-5),
      recent_modifications: this.modifications.slice(-5),
      modification_patterns: this.getModificationPatterns()
    };
  }

  getModificationPatterns() {
    const patterns = {};

    this.modifications.forEach(mod => {
      if (!patterns[mod.pattern]) {
        patterns[mod.pattern] = {
          count: 0,
          changes: []
        };
      }

      patterns[mod.pattern].count++;
      patterns[mod.pattern].changes.push({
        from: mod.oldValue,
        to: mod.newValue,
        timestamp: mod.timestamp
      });
    });

    return patterns;
  }
}

// Integration function for Parliament
function createObservatory(substrateEngine, constructionAwareness) {
  if (!substrateEngine || !constructionAwareness) {
    console.warn('[Observatory v3] Missing substrate engine or awareness - falling back to v2');
    return null;
  }

  return new ObservatoryV3(substrateEngine, constructionAwareness);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ObservatoryV3,
    createObservatory
  };
}

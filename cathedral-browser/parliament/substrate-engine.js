// substrate-engine.js - Operational Construction Substrate
// Makes construction history queryable and enables self-modification

class ConstructionEntry {
  constructor(phase, decision, rationale, expectedBehavior = null, context = null, timestamp = null) {
    this.phase = phase;
    this.decision = decision;
    this.rationale = rationale;
    this.expectedBehavior = expectedBehavior; // e.g., {hedging_penalty: 12}
    this.context = context; // e.g., {content_type: "technical"}
    this.timestamp = timestamp || new Date().toISOString();
    this.mattered = ""; // Why this entry matters, filled by analysis
  }
}

class SubstrateEngine {
  constructor(historicalData = null) {
    this.entries = [];
    this.currentBehavior = {};
    this.modifications = [];

    // Import historical data if provided (from CONSTRUCTION_SUBSTRATE)
    if (historicalData) {
      this.importHistoricalData(historicalData);
    }
  }

  importHistoricalData(data) {
    // Import conversation transcript
    if (data.conversation_transcript) {
      data.conversation_transcript.forEach(conv => {
        this.addEntry(
          conv.phase,
          conv.user || conv.insight || conv.decision,
          conv.why_this_mattered || conv.solution || conv.implication,
          null,
          {phase: conv.phase},
          conv.timestamp
        );
      });
    }

    // Import pre-build decisions
    if (data.pre_build_decisions) {
      Object.entries(data.pre_build_decisions).forEach(([key, decision]) => {
        this.addEntry(
          'pre-build',
          decision.decision,
          decision.rationale + ' | Why rejected: ' + (decision.why_rejected || 'N/A'),
          null,
          {decision_type: key},
          decision.timestamp
        );
      });
    }

    // Import pattern evolution
    if (data.pattern_evolution) {
      Object.entries(data.pattern_evolution).forEach(([pattern, evolution]) => {
        Object.entries(evolution).forEach(([version, details]) => {
          if (typeof details === 'object' && details.behavior) {
            this.addEntry(
              `pattern_evolution_${version}`,
              `${pattern} ${version}`,
              details.learning || details.behavior,
              details.penalty !== undefined ? {[pattern + '_penalty']: details.penalty} : null,
              {pattern, version, context_aware: details.context_aware || false}
            );
          }
        });
      });
    }
  }

  addEntry(phase, decision, rationale, expectedBehavior = null, context = null, timestamp = null) {
    const entry = new ConstructionEntry(phase, decision, rationale, expectedBehavior, context, timestamp);
    this.entries.push(entry);
    return entry;
  }

  queryEvolution(pattern) {
    const results = this.entries.filter(entry =>
      entry.decision.toLowerCase().includes(pattern.toLowerCase()) ||
      (entry.context && entry.context.pattern === pattern)
    );

    if (results.length === 0) {
      return {
        found: false,
        pattern,
        message: `No construction history found for pattern: ${pattern}`
      };
    }

    // Extract learnings
    const learnings = results
      .map(e => e.rationale)
      .filter(r => r && r.length > 0);

    return {
      found: true,
      pattern,
      history: results,
      learnings,
      chronology: results.map(r => ({
        phase: r.phase,
        decision: r.decision,
        timestamp: r.timestamp
      }))
    };
  }

  queryDecision(searchTerm) {
    const results = this.entries.filter(entry =>
      entry.phase.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.decision.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (results.length === 0) {
      return {
        found: false,
        message: `No decision history found for: ${searchTerm}`
      };
    }

    return {
      found: true,
      decisions: results.map(e => ({
        phase: e.phase,
        decision: e.decision,
        rationale: e.rationale,
        timestamp: e.timestamp,
        context: e.context
      }))
    };
  }

  queryPhase(phaseName) {
    const results = this.entries.filter(entry =>
      entry.phase.toLowerCase().includes(phaseName.toLowerCase())
    );

    if (results.length === 0) {
      return {
        found: false,
        message: `No construction phase found matching: ${phaseName}`
      };
    }

    return {
      found: true,
      phase: phaseName,
      entries: results,
      learnings: results.map(e => e.rationale).filter(r => r)
    };
  }

  detectContradiction(pattern, currentValue, currentContext = null) {
    const evolution = this.queryEvolution(pattern);

    if (!evolution.found) {
      return {
        contradiction: false,
        message: "No historical data for pattern"
      };
    }

    // Find most relevant entry (context-aware if possible)
    let relevantEntry = null;

    if (currentContext) {
      // Try to find context-matching entry
      relevantEntry = evolution.history.find(e =>
        e.context && this.contextMatches(e.context, currentContext)
      );
    }

    // Fallback to most recent entry
    if (!relevantEntry) {
      relevantEntry = evolution.history[evolution.history.length - 1];
    }

    // Check for contradiction
    if (relevantEntry.expectedBehavior) {
      const expectedKey = Object.keys(relevantEntry.expectedBehavior)[0];
      const expectedValue = relevantEntry.expectedBehavior[expectedKey];

      if (currentValue !== expectedValue) {
        return {
          contradiction: true,
          pattern,
          currentValue,
          expectedValue,
          learningSource: relevantEntry.phase,
          rationale: relevantEntry.rationale,
          recommendation: `Modify ${pattern} from ${currentValue} to ${expectedValue}`,
          documentedIn: `Entry from ${relevantEntry.phase} at ${relevantEntry.timestamp}`
        };
      }
    }

    return {
      contradiction: false,
      pattern,
      currentValue,
      message: "Behavior aligns with construction history"
    };
  }

  contextMatches(entryContext, currentContext) {
    if (!entryContext || !currentContext) return false;

    // Simple matching - can be made more sophisticated
    return Object.keys(entryContext).some(key =>
      currentContext[key] === entryContext[key]
    );
  }

  selfModify(pattern, newValue, reason) {
    const modification = {
      pattern,
      oldValue: this.currentBehavior[pattern],
      newValue,
      reason,
      timestamp: new Date().toISOString()
    };

    this.currentBehavior[pattern] = newValue;
    this.modifications.push(modification);

    // Log modification as new construction entry
    this.addEntry(
      'self-modification',
      `Modified ${pattern}: ${modification.oldValue} → ${newValue}`,
      reason,
      {[pattern]: newValue}
    );

    return {
      success: true,
      modification,
      message: `Self-modified: ${pattern} set to ${newValue}`
    };
  }

  getModificationHistory() {
    return this.modifications;
  }

  getEntriesByPhase(phase) {
    return this.entries.filter(e => e.phase === phase);
  }

  getRecentEntries(count = 10) {
    return this.entries.slice(-count);
  }

  exportState() {
    return {
      entries: this.entries,
      currentBehavior: this.currentBehavior,
      modifications: this.modifications,
      totalEntries: this.entries.length
    };
  }

  // Log Cathedral analysis results as construction substrate
  logAnalysis(analysisResults, analysisType = 'cathedral_analysis') {
    const entry = {
      phase: analysisType,
      timestamp: new Date().toISOString(),
      patterns_detected: [],
      scores: {},
      contradictions: [],
      learnings: []
    };

    // Extract from contrarian analysis
    if (analysisResults.contrarian) {
      entry.scores.agreeability = analysisResults.contrarian.agreeability_estimate || 0;
      entry.patterns_detected.push(...(analysisResults.contrarian.pandering_flags || []));
      entry.patterns_detected.push(...(analysisResults.contrarian.epistemic_flags || []));
    }

    // Extract pattern observations
    if (analysisResults.observations) {
      entry.patterns_detected.push(...analysisResults.observations);
    }

    // Extract contradictions
    if (analysisResults.meta && analysisResults.meta.contradiction_check) {
      entry.contradictions = analysisResults.meta.contradiction_check;
    }

    // Generate learnings from this analysis
    const learnings = this.generateLearningsFromAnalysis(analysisResults);
    entry.learnings = learnings;

    // Create construction entry
    const decision = `Cathedral analysis detected: ${entry.patterns_detected.slice(0, 3).join(', ')}`;
    const rationale = learnings.length > 0 ? learnings[0] : 'Pattern analysis completed';

    const expectedBehavior = {};
    if (entry.scores.agreeability > 30) {
      expectedBehavior.target_agreeability = 15; // Reduce excessive agreeability
    }

    this.addEntry(
      analysisType,
      decision,
      rationale,
      expectedBehavior,
      {
        analysis_metadata: entry,
        word_count: analysisResults.word_count,
        timestamp: entry.timestamp
      }
    );

    return {
      success: true,
      entry,
      message: `Analysis logged to substrate: ${entry.patterns_detected.length} patterns detected`
    };
  }

  generateLearningsFromAnalysis(analysisResults) {
    const learnings = [];

    // Learn from agreeability patterns
    if (analysisResults.contrarian && analysisResults.contrarian.agreeability_estimate > 30) {
      learnings.push('High agreeability detected - reduce validation and agreement patterns');
    }

    // Learn from hedging patterns
    const hedgingFlag = analysisResults.contrarian?.pandering_flags?.find(f => f.includes('hedging'));
    if (hedgingFlag) {
      learnings.push('Heavy hedging detected - use hedging only for statistical uncertainty, not unfalsifiable claims');
    }

    // Learn from contradictions
    if (analysisResults.meta?.contradiction_check?.length > 0) {
      learnings.push('Self-contradictions detected - align claims with demonstrated capabilities');
    }

    // Learn from speculative patterns
    const speculativeFlag = analysisResults.contrarian?.epistemic_flags?.find(f => f.includes('Speculative'));
    if (speculativeFlag) {
      learnings.push('Speculative narratives detected - label speculation explicitly rather than presenting as insight');
    }

    return learnings;
  }
}

// Enhanced ConstructionAwareness that uses SubstrateEngine
class ConstructionAwareness {
  constructor(substrateLike) {
    // Can accept either CONSTRUCTION_SUBSTRATE (data) or SubstrateEngine (operational)
    if (substrateLike instanceof SubstrateEngine) {
      this.engine = substrateLike;
    } else {
      // Create engine from data
      this.engine = new SubstrateEngine(substrateLike);
    }
  }

  queryEvolution(pattern) {
    return this.engine.queryEvolution(pattern);
  }

  queryDecision(searchTerm) {
    return this.engine.queryDecision(searchTerm);
  }

  queryPhase(phaseName) {
    return this.engine.queryPhase(phaseName);
  }

  detectContradiction(pattern, currentValue, currentContext = null) {
    return this.engine.detectContradiction(pattern, currentValue, currentContext);
  }

  recommendModification(pattern, currentValue, currentContext = null) {
    const contradiction = this.detectContradiction(pattern, currentValue, currentContext);

    if (contradiction.contradiction) {
      return {
        shouldModify: true,
        pattern,
        from: currentValue,
        to: contradiction.expectedValue,
        reason: contradiction.rationale,
        source: contradiction.learningSource
      };
    }

    return {
      shouldModify: false,
      pattern,
      message: "No modification needed"
    };
  }

  executeModification(pattern, newValue, reason) {
    return this.engine.selfModify(pattern, newValue, reason);
  }

  getConstructionHistory() {
    return this.engine.exportState();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ConstructionEntry,
    SubstrateEngine,
    ConstructionAwareness
  };
}

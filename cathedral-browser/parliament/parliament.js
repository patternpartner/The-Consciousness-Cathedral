// parliament.js — Cathedral Parliament Controller
// Coordinates all 5 vectors: Contrarian, Empirical, Generative, Meta-Cognitive, Synthesis

// Import all Parliament vectors
// (In browser context, these would be loaded via script tags)
// (In Node context, use require)

class Parliament {
  constructor() {
    this.history = this.loadHistory();
    this.vectors = {
      contrarian: null,
      empirical: null,
      generative: null,
      metacognitive: null,
      synthesis: null
    };
  }

  // Main analysis method - runs all Parliament vectors
  analyze(text, metadata = {}) {
    const startTime = Date.now();

    // Calculate metadata if not provided
    if (!metadata.wordCount) {
      metadata.wordCount = text.split(/\s+/).length;
    }
    if (!metadata.paragraphs) {
      metadata.paragraphs = text.split(/\n\n+/).length;
    }

    const results = {
      text: text.substring(0, 500), // Store first 500 chars for reference
      metadata: metadata,
      timestamp: new Date().toISOString(),
      vectors: {},
      synthesis: null
    };

    // Run all vectors in parallel (order doesn't matter except Synthesis which needs all outputs)
    try {
      // Vector 1: Contrarian (epistemic adversary)
      if (typeof contrarianEngine === 'function') {
        results.vectors.contrarian = contrarianEngine(text, metadata);
      }

      // Vector 2: Empirical (ground truth)
      if (typeof empiricalEngine === 'function') {
        results.vectors.empirical = empiricalEngine(text, metadata);
      }

      // Vector 3: Generative (alternative framings)
      if (typeof generativeEngine === 'function') {
        results.vectors.generative = generativeEngine(text, metadata);
      }

      // Vector 4: Meta-Cognitive (pattern tracking)
      if (typeof metacognitiveEngine === 'function') {
        results.vectors.metacognitive = metacognitiveEngine(text, metadata, this.history);
      }

      // Vector 5: Synthesis (emergent integration)
      if (typeof synthesisEngine === 'function') {
        results.synthesis = synthesisEngine(results.vectors);
      }

      // Save to history
      this.history.push({
        timestamp: results.timestamp,
        contrarian: results.vectors.contrarian,
        empirical: results.vectors.empirical,
        generative: results.vectors.generative,
        metacognitive: results.vectors.metacognitive
      });

      this.saveHistory();

      // Trim history to last 50 analyses (prevent unbounded growth)
      if (this.history.length > 50) {
        this.history = this.history.slice(-50);
        this.saveHistory();
      }

    } catch (error) {
      console.error('[Parliament] Analysis error:', error);
      results.error = error.message;
    }

    results.processingTime = Date.now() - startTime;

    return results;
  }

  // Load history from localStorage (browser) or file (Node)
  loadHistory() {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('cathedral_parliament_history');
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error('[Parliament] Failed to load history:', e);
        return [];
      }
    }
    return [];
  }

  // Save history to localStorage (browser) or file (Node)
  saveHistory() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('cathedral_parliament_history', JSON.stringify(this.history));
      } catch (e) {
        console.error('[Parliament] Failed to save history:', e);
      }
    }
  }

  // Clear all history
  clearHistory() {
    this.history = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cathedral_parliament_history');
    }
  }

  // Get summary statistics
  getStats() {
    if (this.history.length === 0) {
      return {
        totalAnalyses: 0,
        avgAgreeability: 0,
        avgEmpiricalConfidence: 0,
        message: 'No analyses yet. Start using Parliament to build baseline.'
      };
    }

    const agreeabilityScores = this.history
      .map(h => h.contrarian?.agreeability_score)
      .filter(s => s !== undefined);

    const empiricalScores = this.history
      .map(h => h.empirical?.confidence)
      .filter(s => s !== undefined);

    return {
      totalAnalyses: this.history.length,
      avgAgreeability: agreeabilityScores.reduce((a, b) => a + b, 0) / agreeabilityScores.length,
      avgEmpiricalConfidence: empiricalScores.reduce((a, b) => a + b, 0) / empiricalScores.length,
      recentTrend: this.history.length >= 10 ? this.calculateTrend() : 'Insufficient data',
      message: `${this.history.length} analyses tracked.`
    };
  }

  // Calculate trend (are thresholds shifting?)
  calculateTrend() {
    const recent = this.history.slice(-5).map(h => h.contrarian?.agreeability_score || 0);
    const earlier = this.history.slice(-10, -5).map(h => h.contrarian?.agreeability_score || 0);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

    const change = recentAvg - earlierAvg;

    if (Math.abs(change) < 0.1) return 'Stable';
    if (change > 0) return 'Weakening (more agreeable content)';
    return 'Strengthening (more rigorous content)';
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Parliament };
}

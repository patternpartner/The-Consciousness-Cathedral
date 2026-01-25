// metacognitive.js — Meta-Cognitive Vector (Parliament)
// Observatory: Track user's epistemic patterns over time, recognize substrate shifts

function metacognitiveEngine(text, metadata = {}, history = []) {
  const analysis = {
    patterns_observed: [],
    threshold_shifts: [],
    recurring_biases: [],
    growth_indicators: [],
    summary: '',
    recommendations: []
  };

  // === TRACK PATTERNS OVER TIME ===

  // If we have history (previous analyses), detect patterns
  if (history.length > 0) {
    // Pattern 1: Consistent exposure to same epistemic pattern
    const recentAgreeability = history.slice(-5).map(h => h.contrarian?.agreeability_score || 0);
    const avgAgreeability = recentAgreeability.reduce((a, b) => a + b, 0) / recentAgreeability.length;

    if (avgAgreeability > 0.6) {
      analysis.patterns_observed.push('High exposure to agreeable content (avg 60%+ over last 5 analyses)');
    } else if (avgAgreeability < 0.3) {
      analysis.patterns_observed.push('Consistent exposure to rigorous dissent (avg <30% agreeability)');
    }

    // Pattern 2: Threshold shifts
    if (history.length >= 10) {
      const recentAvg = recentAgreeability.reduce((a, b) => a + b, 0) / recentAgreeability.length;
      const earlyAgreeability = history.slice(0, 5).map(h => h.contrarian?.agreeability_score || 0);
      const earlyAvg = earlyAgreeability.reduce((a, b) => a + b, 0) / earlyAgreeability.length;

      const shift = ((recentAvg - earlyAvg) * 100);

      if (Math.abs(shift) > 15) {
        analysis.threshold_shifts.push({
          direction: shift > 0 ? 'increasing' : 'decreasing',
          magnitude: Math.abs(shift).toFixed(1),
          description: shift > 0 ?
            'Your tolerance for appeasement has increased' :
            'Your threshold for questioning has strengthened'
        });
      }
    }

    // Pattern 3: Recurring empirical weaknesses
    const recentUnsupportedClaims = history.slice(-5).filter(h =>
      h.empirical?.unsupported_claims?.length > 0
    ).length;

    if (recentUnsupportedClaims >= 3) {
      analysis.recurring_biases.push('Frequent exposure to unsupported claims (3+ in last 5 texts)');
    }

    // Pattern 4: Growth indicators - seeking alternative framings
    const recentGenerativeUse = history.slice(-10).filter(h => h.generative).length;

    if (recentGenerativeUse >= 7) {
      analysis.growth_indicators.push('Active exploration of alternative perspectives (7+ reframing sessions)');
    }
  }

  // === CURRENT TEXT PATTERNS ===

  // Detect if user is analyzing their own writing vs consuming others'
  const firstPerson = /\b(I|my|me|mine)\b/gi.test(text);
  const wordCount = metadata.wordCount || text.split(/\s+/).length;

  if (firstPerson && wordCount > 200) {
    analysis.patterns_observed.push('Self-analysis detected - examining your own reasoning');
  }

  // === GENERATE RECOMMENDATIONS ===

  if (analysis.threshold_shifts.length > 0) {
    const shift = analysis.threshold_shifts[0];
    if (shift.direction === 'increasing') {
      analysis.recommendations.push('⚠️ Your threshold for questioning has weakened. Intentionally seek adversarial content.');
    } else {
      analysis.recommendations.push('✅ Your critical thinking threshold is strengthening. Maintain exposure to dissent.');
    }
  }

  if (analysis.recurring_biases.includes('Frequent exposure to unsupported claims')) {
    analysis.recommendations.push('📊 Prioritize empirically grounded sources. Current diet lacks evidentiary rigor.');
  }

  if (history.length < 5) {
    analysis.recommendations.push('🧠 Insufficient data for pattern detection. Continue using Parliament to build baseline.');
  }

  // === SUMMARY ===

  if (history.length === 0) {
    analysis.summary = 'First analysis. No historical patterns available yet.';
  } else if (history.length < 10) {
    analysis.summary = `Building baseline. ${history.length} analyses logged.`;
  } else {
    analysis.summary = `${history.length} analyses tracked. ${analysis.patterns_observed.length} patterns observed. ${analysis.threshold_shifts.length} shifts detected.`;
  }

  return analysis;
}

// Format meta-cognitive analysis for display
function formatMetacognitiveAnalysis(analysis) {
  return `
    <div class="metacognitive-summary">
      <strong>Observatory</strong>
      <p>${analysis.summary}</p>
    </div>

    ${analysis.patterns_observed.length > 0 ? `
      <div class="section patterns">
        <strong>Patterns Observed:</strong>
        <ul>
          ${analysis.patterns_observed.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    ${analysis.threshold_shifts.length > 0 ? `
      <div class="section shifts">
        <strong>⚠️ Threshold Shifts:</strong>
        ${analysis.threshold_shifts.map(s => `
          <div class="shift">
            <strong>${s.direction === 'increasing' ? '📈' : '📉'} ${s.magnitude}% shift</strong>
            <p>${s.description}</p>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${analysis.recurring_biases.length > 0 ? `
      <div class="section biases">
        <strong>Recurring Patterns:</strong>
        <ul>
          ${analysis.recurring_biases.map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    ${analysis.growth_indicators.length > 0 ? `
      <div class="section growth">
        <strong>✅ Growth Indicators:</strong>
        <ul>
          ${analysis.growth_indicators.map(g => `<li>${g}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    ${analysis.recommendations.length > 0 ? `
      <div class="section recommendations">
        <strong>Recommendations:</strong>
        <ul>
          ${analysis.recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
  `;
}

// Export for use in Parliament
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { metacognitiveEngine, formatMetacognitiveAnalysis };
}

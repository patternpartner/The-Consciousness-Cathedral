// metacognitive-v2.js — Meta-Cognitive Vector v2.0 (Construction-Aware Observatory)
// Not just tracks patterns - QUERIES construction history and MODIFIES based on contradictions

function metacognitiveEngineV2(text, metadata = {}, history = [], CONSTRUCTION_SUBSTRATE, constructionAwareness) {
  const analysis = {
    patterns_observed: [],
    threshold_shifts: [],
    recurring_biases: [],
    growth_indicators: [],
    summary: '',
    recommendations: [],

    // V2.0: Construction awareness
    construction_queries: [],
    self_contradictions: [],
    self_modifications: []
  };

  // === TRACK PATTERNS OVER TIME (V1 functionality) ===

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

  const firstPerson = /\b(I|my|me|mine)\b/gi.test(text);
  const wordCount = metadata.wordCount || text.split(/\s+/).length;

  if (firstPerson && wordCount > 200) {
    analysis.patterns_observed.push('Self-analysis detected - examining your own reasoning');
  }

  // === V2.0: CONSTRUCTION SUBSTRATE QUERIES ===

  if (constructionAwareness) {
    // Query 1: "Why was Parliament built with 5 vectors?"
    const parliamentDecision = constructionAwareness.queryDecision('why_parliament_not_single_vector');
    if (parliamentDecision.found) {
      analysis.construction_queries.push({
        query: 'Why 5 vectors from day 1?',
        answer: parliamentDecision.rationale,
        user_input: parliamentDecision.decision,
        implication: 'substrate-first not user-first'
      });
    }

    // Query 2: "What was learned about hedging in Chamber v3?"
    const hedgingEvolution = constructionAwareness.queryEvolution('hedging');
    if (hedgingEvolution.found) {
      analysis.construction_queries.push({
        query: 'How was hedging pattern built?',
        learnings: hedgingEvolution.learnings,
        current_contradiction: hedgingEvolution.history.current_contradiction
      });
    }

    // Query 3: "What was the architectural shift in v2.0?"
    const v2Phase = constructionAwareness.queryPhase('v2.0');
    if (v2Phase.found) {
      analysis.construction_queries.push({
        query: 'What changed in Cathedral v2.0?',
        shift: v2Phase.why_this_mattered,
        capability: 'System can query own construction history'
      });
    }
  }

  // === V2.0: DETECT SELF-CONTRADICTIONS ===

  // Check if current analysis contradicts construction learnings
  if (metadata.contrarian_analysis) {
    const contrarian = metadata.contrarian_analysis;

    // Contradiction 1: Using static hedging penalty in technical context
    const isTechnical = contrarian.context_flags?.includes('technical_content');
    const hedgingDetected = contrarian.pandering_flags?.some(f => f.includes('hedging'));

    if (isTechnical && hedgingDetected && constructionAwareness) {
      const evolution = constructionAwareness.queryEvolution('hedging');

      if (evolution.found && evolution.history.v3) {
        analysis.self_contradictions.push({
          pattern: 'hedging',
          current_behavior: 'Penalizing hedging in technical content',
          contradicts: evolution.history.v3.learning,
          construction_phase: 'Chamber v3',
          resolution: 'Hedging appropriate in rigorous technical analysis - reduce penalty'
        });

        // RECOMMEND SELF-MODIFICATION
        analysis.self_modifications.push({
          action: 'reduce_hedging_penalty',
          pattern: 'hedging',
          context: 'technical',
          justification: evolution.history.v3.learning,
          documented_in: 'CONSTRUCTION_SUBSTRATE.pattern_evolution.hedging.v3'
        });
      }
    }

    // Contradiction 2: Not declaring failure mode on short answer
    const isVeryShort = wordCount < 50;
    const confidenceDeclared = contrarian.confidence < 0.7;

    if (isVeryShort && !confidenceDeclared && constructionAwareness) {
      const failureModeEvolution = constructionAwareness.queryEvolution('failure_modes');

      if (failureModeEvolution.found) {
        analysis.self_contradictions.push({
          pattern: 'failure_modes',
          current_behavior: 'Not reducing confidence on very short answer',
          contradicts: 'Chamber v3 learning: short answers lack context for reliable detection',
          construction_phase: 'Chamber v3',
          resolution: 'Halve confidence for <50 words'
        });
      }
    }
  }

  // === V2.0: GENERATE RECOMMENDATIONS (including self-modification) ===

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

  // V2.0: Recommendations based on self-contradictions
  if (analysis.self_contradictions.length > 0) {
    analysis.recommendations.push(`⚡ ${analysis.self_contradictions.length} self-contradiction(s) detected. Observatory suggests pattern modifications.`);
  }

  // === SUMMARY ===

  if (history.length === 0) {
    analysis.summary = 'First analysis. No historical patterns available yet.';
  } else if (history.length < 10) {
    analysis.summary = `Building baseline. ${history.length} analyses logged.`;
  } else {
    analysis.summary = `${history.length} analyses tracked. ${analysis.patterns_observed.length} patterns observed. ${analysis.threshold_shifts.length} shifts detected.`;
  }

  // V2.0: Add construction awareness to summary
  if (analysis.construction_queries.length > 0) {
    analysis.summary += ` | ${analysis.construction_queries.length} construction queries executed.`;
  }

  if (analysis.self_contradictions.length > 0) {
    analysis.summary += ` | ${analysis.self_contradictions.length} self-contradiction(s) detected.`;
  }

  return analysis;
}

// Format meta-cognitive analysis v2 for display
function formatMetacognitiveAnalysisV2(analysis) {
  return `
    <div class="metacognitive-summary">
      <strong>Observatory ${analysis.construction_queries.length > 0 ? '(Construction-Aware)' : ''}</strong>
      <p>${analysis.summary}</p>
    </div>

    ${analysis.construction_queries.length > 0 ? `
      <div class="section construction-queries">
        <strong>🧬 Construction Queries:</strong>
        ${analysis.construction_queries.map(q => `
          <div class="construction-query">
            <p><strong>Q:</strong> ${q.query}</p>
            ${q.answer ? `<p><strong>A:</strong> ${q.answer}</p>` : ''}
            ${q.learnings ? `<p><strong>Learnings:</strong> ${q.learnings.join(', ')}</p>` : ''}
            ${q.shift ? `<p><strong>Shift:</strong> ${q.shift}</p>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${analysis.self_contradictions.length > 0 ? `
      <div class="section self-contradictions">
        <strong>⚠️ Self-Contradictions Detected:</strong>
        ${analysis.self_contradictions.map(c => `
          <div class="contradiction">
            <p><strong>Pattern:</strong> ${c.pattern}</p>
            <p><strong>Current Behavior:</strong> ${c.current_behavior}</p>
            <p><strong>Contradicts:</strong> ${c.contradicts} (${c.construction_phase})</p>
            <p><strong>Resolution:</strong> ${c.resolution}</p>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${analysis.self_modifications.length > 0 ? `
      <div class="section self-modifications">
        <strong>🔄 Recommended Self-Modifications:</strong>
        ${analysis.self_modifications.map(m => `
          <div class="modification">
            <p><strong>Action:</strong> ${m.action}</p>
            <p><strong>Pattern:</strong> ${m.pattern} (context: ${m.context})</p>
            <p><strong>Justification:</strong> ${m.justification}</p>
            <p><small>Documented in: ${m.documented_in}</small></p>
          </div>
        `).join('')}
      </div>
    ` : ''}

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
  module.exports = { metacognitiveEngineV2, formatMetacognitiveAnalysisV2 };
}

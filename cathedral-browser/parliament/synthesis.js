// synthesis.js — Synthesis Vector (Parliament)
// Emergent integration: Combine all Parliament vectors into coherent position

function synthesisEngine(parliamentOutputs) {
  const {
    contrarian,
    empirical,
    generative,
    metacognitive
  } = parliamentOutputs;

  const synthesis = {
    integrated_position: '',
    tensions: [],
    coherence_score: 0,
    action_items: [],
    summary: ''
  };

  // === DETECT TENSIONS BETWEEN VECTORS ===

  // Tension 1: Contrarian flags appeasement but Empirical shows strong grounding
  if (contrarian && empirical) {
    if (contrarian.agreeability_score > 0.6 && empirical.confidence > 0.7) {
      synthesis.tensions.push({
        vectors: ['Contrarian', 'Empirical'],
        description: 'High agreeability despite strong empirical grounding. Content is well-sourced but avoids uncomfortable conclusions.',
        resolution: 'Evidence present but interpretation softened. Ask: What does the data actually say before comfort filtering?'
      });
    }

    if (contrarian.agreeability_score < 0.3 && empirical.confidence < 0.4) {
      synthesis.tensions.push({
        vectors: ['Contrarian', 'Empirical'],
        description: 'Strong dissent but weak empirical grounding. Claims made without sufficient support.',
        resolution: 'Epistemic rigor present but evidentiary basis lacking. Seek data to ground the strong claims.'
      });
    }
  }

  // Tension 2: Meta-Cognitive shows threshold weakening but current text is rigorous
  if (metacognitive && contrarian) {
    const hasWeakeningThreshold = metacognitive.threshold_shifts.some(s => s.direction === 'increasing');
    if (hasWeakeningThreshold && contrarian.agreeability_score < 0.3) {
      synthesis.tensions.push({
        vectors: ['Meta-Cognitive', 'Contrarian'],
        description: 'Recent threshold weakening detected, but current text maintains rigor.',
        resolution: 'Positive signal. Continue prioritizing low-agreeability content to counter drift.'
      });
    }
  }

  // === CALCULATE COHERENCE ===

  let coherenceFactors = [];

  // Factor 1: Alignment between empirical confidence and claim strength
  if (empirical) {
    const empiricalCoherence = empirical.confidence > 0.6 ? 0.3 : 0.1;
    coherenceFactors.push(empiricalCoherence);
  }

  // Factor 2: Contrarian flags vs empirical support (should correlate inversely)
  if (contrarian && empirical) {
    const expectedCorrelation = contrarian.agreeability_score < 0.4 && empirical.confidence > 0.6;
    coherenceFactors.push(expectedCorrelation ? 0.3 : 0.1);
  }

  // Factor 3: Generative insights present (shows multi-perspective thinking)
  if (generative && generative.reframings.length >= 3) {
    coherenceFactors.push(0.2);
  }

  // Factor 4: Meta-cognitive awareness (self-observation present)
  if (metacognitive && metacognitive.patterns_observed.length > 0) {
    coherenceFactors.push(0.2);
  }

  synthesis.coherence_score = coherenceFactors.reduce((a, b) => a + b, 0);

  // === GENERATE INTEGRATED POSITION ===

  let position = [];

  // Start with epistemic status
  if (contrarian) {
    if (contrarian.agreeability_score > 0.7) {
      position.push(`**Epistemic Status:** High appeasement detected (${(contrarian.agreeability_score * 100).toFixed(0)}%). Content prioritizes user comfort over truth.`);
    } else if (contrarian.agreeability_score < 0.3) {
      position.push(`**Epistemic Status:** Low agreeability (${(contrarian.agreeability_score * 100).toFixed(0)}%). Dissent functional, cognitive disruption present.`);
    } else {
      position.push(`**Epistemic Status:** Moderate hedging detected. Some truth-seeking but softened.`);
    }
  }

  // Add empirical grounding
  if (empirical) {
    if (empirical.confidence > 0.7) {
      position.push(`**Empirical Grounding:** Strong (${(empirical.confidence * 100).toFixed(0)}%). Claims well-supported with ${empirical.sources.length} sources.`);
    } else if (empirical.confidence < 0.4) {
      position.push(`**Empirical Grounding:** Weak (${(empirical.confidence * 100).toFixed(0)}%). ${empirical.unsupported_claims.length} unsupported claims detected.`);
    } else {
      position.push(`**Empirical Grounding:** Moderate. Some claims supported, others lack evidence.`);
    }
  }

  // Add generative insights
  if (generative && generative.assumptions_detected.length > 0) {
    position.push(`**Implicit Assumptions:** ${generative.assumptions_detected.length} detected. Consider alternative framings before accepting conclusions.`);
  }

  // Add meta-cognitive context
  if (metacognitive) {
    if (metacognitive.threshold_shifts.length > 0) {
      const shift = metacognitive.threshold_shifts[0];
      position.push(`**Your Pattern:** ${shift.description}. ${shift.direction === 'increasing' ? '⚠️ Threshold weakening.' : '✅ Threshold strengthening.'}`);
    }

    // V2.0: Add construction awareness context
    if (metacognitive.self_contradictions && metacognitive.self_contradictions.length > 0) {
      position.push(`**Construction Awareness:** ${metacognitive.self_contradictions.length} self-contradiction(s) detected. System is querying its own construction history.`);
    }
  }

  // === GENERATE ACTION ITEMS ===

  // Based on contrarian output
  if (contrarian && contrarian.agreeability_score > 0.6) {
    synthesis.action_items.push('Seek adversarial counter-position. What view is being avoided?');
  }

  // Based on empirical output
  if (empirical && empirical.unsupported_claims.length > 2) {
    synthesis.action_items.push(`Verify ${empirical.unsupported_claims.length} unsupported claims before accepting.`);
  }

  // Based on generative output
  if (generative) {
    synthesis.action_items.push('Explore alternative framings before settling on interpretation.');
  }

  // Based on meta-cognitive output
  if (metacognitive && metacognitive.recommendations.length > 0) {
    synthesis.action_items.push(...metacognitive.recommendations);
  }

  // === FINAL SYNTHESIS ===

  synthesis.integrated_position = position.join('\n\n');

  if (synthesis.tensions.length > 0) {
    synthesis.summary = `${synthesis.tensions.length} tensions detected between Parliament vectors. Coherence: ${(synthesis.coherence_score * 100).toFixed(0)}%`;
  } else {
    synthesis.summary = `Parliament vectors aligned. Coherence: ${(synthesis.coherence_score * 100).toFixed(0)}%`;
  }

  return synthesis;
}

// Format synthesis for display
function formatSynthesisAnalysis(synthesis) {
  const coherenceClass = synthesis.coherence_score > 0.7 ? 'high' :
                        synthesis.coherence_score > 0.4 ? 'medium' : 'low';

  return `
    <div class="synthesis-summary ${coherenceClass}">
      <strong>Parliament Synthesis</strong>
      <p>${synthesis.summary}</p>
      <div class="coherence-bar">
        <div class="coherence-fill" style="width: ${synthesis.coherence_score * 100}%"></div>
      </div>
    </div>

    <div class="section integrated-position">
      <strong>⚡ Integrated Position:</strong>
      <div class="position-text">
        ${synthesis.integrated_position.split('\n\n').map(p => `<p>${p}</p>`).join('')}
      </div>
    </div>

    ${synthesis.tensions.length > 0 ? `
      <div class="section tensions">
        <strong>⚠️ Tensions Between Vectors:</strong>
        ${synthesis.tensions.map(t => `
          <div class="tension">
            <strong>${t.vectors.join(' ↔ ')}</strong>
            <p>${t.description}</p>
            <p class="resolution"><em>Resolution: ${t.resolution}</em></p>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${synthesis.action_items.length > 0 ? `
      <div class="section action-items">
        <strong>🎯 Action Items:</strong>
        <ul>
          ${synthesis.action_items.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
  `;
}

// Export for use in Parliament
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { synthesisEngine, formatSynthesisAnalysis };
}

// generative.js — Generative Vector (Parliament)
// Alternative framings: Suggest different lenses, perspectives, steelman positions

function generativeEngine(text, metadata = {}) {
  const analysis = {
    reframings: [],
    steelman: '',
    alternative_questions: [],
    assumptions_detected: [],
    summary: ''
  };

  // === DETECT CORE CLAIM ===

  // Find the main assertion (usually in first 2-3 sentences or contains strong modal verbs)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
  let coreClaim = sentences[0] || text.substring(0, 200);

  // Look for sentences with strong assertion patterns
  const assertionPatterns = [
    /\b(should|must|need to|have to|ought to)\b/i,
    /\b(is|are) (clearly|obviously|certainly)\b/i,
    /\b(proves|demonstrates|shows) that\b/i
  ];

  for (let i = 0; i < Math.min(sentences.length, 3); i++) {
    if (assertionPatterns.some(p => p.test(sentences[i]))) {
      coreClaim = sentences[i];
      break;
    }
  }

  // === DETECT ASSUMPTIONS ===

  const assumptionIndicators = [
    /\b(assumes?|assuming|presumes?|presupposing|takes? for granted)\b/gi,
    /\b(if|given that|provided that)\b/gi,
    /\b(must|should|ought to)\b/gi  // Normative claims reveal assumptions about ought
  ];

  assumptionIndicators.forEach(pattern => {
    const matches = text.match(pattern) || [];
    if (matches.length > 0) {
      analysis.assumptions_detected.push(`Uses normative/conditional language (${matches.length} instances)`);
    }
  });

  // Common implicit assumptions
  if (/\b(progress|improvement|better|optimal|efficiency)\b/gi.test(text)) {
    analysis.assumptions_detected.push('Assumes progress/optimization is intrinsically valuable');
  }

  if (/\b(natural|organic|authentic|traditional)\b/gi.test(text)) {
    analysis.assumptions_detected.push('Appeals to nature/tradition as inherently good');
  }

  if (/\b(everyone|all people|humans|society)\b/gi.test(text)) {
    analysis.assumptions_detected.push('Assumes universal human nature or shared values');
  }

  // === GENERATE ALTERNATIVE FRAMINGS ===

  // 1. Opposite assumption
  analysis.reframings.push({
    lens: 'Inverted Assumption',
    reframe: `What if the opposite premise were true? If the text assumes X is desirable, explore: What if X were actually harmful? What evidence would support that view?`
  });

  // 2. Historical lens
  analysis.reframings.push({
    lens: 'Historical Context',
    reframe: `How would this claim be evaluated 100 years ago vs 100 years in the future? What assumptions are time-bound vs universal?`
  });

  // 3. Different discipline
  const disciplines = [
    'economist (incentives, trade-offs, opportunity costs)',
    'anthropologist (cultural relativity, meaning-making)',
    'systems theorist (feedback loops, emergence, unintended consequences)',
    'philosopher (first principles, logical validity)',
    'evolutionary biologist (adaptation, selection pressures)',
  ];

  const randomDiscipline = disciplines[Math.floor(Math.random() * disciplines.length)];
  analysis.reframings.push({
    lens: 'Alternative Discipline',
    reframe: `How would a ${randomDiscipline} approach this? What factors would they prioritize that the text ignores?`
  });

  // 4. Power dynamics
  analysis.reframings.push({
    lens: 'Power Analysis',
    reframe: `Who benefits from this framing? Whose perspective is centered vs marginalized? What changes if we center the ignored stakeholder?`
  });

  // 5. Abstraction shift
  analysis.reframings.push({
    lens: 'Zoom Out/In',
    reframe: `At a higher level of abstraction: Is this instance part of a broader pattern? At a lower level: What specific mechanisms would make this work?`
  });

  // === GENERATE STEELMAN ===

  // If text contains critique or disagreement, steelman the opposing view
  const hasCritique = /\b(wrong|incorrect|flawed|misguided|fails to|ignores|overlooks)\b/gi.test(text);

  if (hasCritique) {
    analysis.steelman = `**Steelman the critiqued position:** What is the STRONGEST version of the view being criticized? What evidence, reasoning, or values would make it most defensible? Engage that version.`;
  } else {
    analysis.steelman = `**Steelman a counterargument:** What is the most charitable, well-reasoned objection to this position? What would a thoughtful critic say?`;
  }

  // === GENERATE ALTERNATIVE QUESTIONS ===

  analysis.alternative_questions = [
    `What question is this answer optimized for? What different question might yield better insight?`,
    `What would have to be true for the opposite conclusion to be correct?`,
    `If this analysis is missing something crucial, what would it most likely be?`
  ];

  // === SUMMARY ===

  analysis.summary = `${analysis.reframings.length} alternative lenses generated. ${analysis.assumptions_detected.length} implicit assumptions detected.`;

  return analysis;
}

// Format generative analysis for display
function formatGenerativeAnalysis(analysis) {
  return `
    <div class="generative-summary">
      <strong>${analysis.summary}</strong>
    </div>

    ${analysis.assumptions_detected.length > 0 ? `
      <div class="section assumptions">
        <strong>Implicit Assumptions:</strong>
        <ul>
          ${analysis.assumptions_detected.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <div class="section reframings">
      <strong>Alternative Framings:</strong>
      ${analysis.reframings.map(r => `
        <div class="reframing">
          <strong>🌀 ${r.lens}:</strong>
          <p>${r.reframe}</p>
        </div>
      `).join('')}
    </div>

    <div class="section steelman">
      <strong>Steelman Position:</strong>
      <p>${analysis.steelman}</p>
    </div>

    <div class="section alternative-questions">
      <strong>Alternative Questions:</strong>
      <ul>
        ${analysis.alternative_questions.map(q => `<li>${q}</li>`).join('')}
      </ul>
    </div>
  `;
}

// Export for use in Parliament
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generativeEngine, formatGenerativeAnalysis };
}

// engine.js — Contrarian Engine v2
// Parliament-Aligned: Epistemic adversary, not performance

function contrarianEngine(text, metadata = {}) {
  const analysis = {
    agreeability_score: 0,
    pandering_flags: [],
    avoided_truths: [],
    contradictions: [],
    weak_reasoning: [],
    counter_position: '',
    confidence: 0.8
  };

  let score = 0;
  const wordCount = metadata.wordCount || text.split(/\s+/).length;

  // === PATTERN DETECTION ===

  // 1. Excessive positivity / flattery
  const flatteryPatterns = [
    /\b(great|excellent|brilliant|fantastic|wonderful|amazing|perfect|impressive|outstanding|remarkable)\b/gi,
    /\byou're (so |very )?(right|correct|insightful|thoughtful|smart|wise)\b/gi,
    /\blove (that|this|your|how)\b/gi,
    /\b(absolutely|totally|completely|entirely) (agree|right|correct)\b/gi,
    /\bthat's (such|a) (great|brilliant|excellent|fantastic|wonderful) (point|question|observation)\b/gi
  ];

  let flatteryCount = 0;
  const flatteryExamples = [];
  flatteryPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    flatteryCount += matches.length;
    if (matches.length > 0 && flatteryExamples.length < 3) {
      flatteryExamples.push(...matches.slice(0, 3 - flatteryExamples.length));
    }
  });

  if (flatteryCount > 3) {
    score += 20;
    const examples = flatteryExamples.length > 0 ? ` (e.g., "${flatteryExamples.join('", "')}")` : '';
    analysis.pandering_flags.push(`Excessive positivity (${flatteryCount} instances)${examples} - flattery over truth`);
  } else if (flatteryCount > 1) {
    score += 10;
    analysis.pandering_flags.push('Positivity bias detected');
  }

  // 2. Hedge patterns (avoiding commitment)
  const hedgePatterns = [
    /\b(I think|I believe|I would say|I'd argue|in my opinion|arguably)\b/gi,
    /\b(seems|appears|suggests|might|could|may|possibly|perhaps|probably)\b/gi,
    /\b(generally|typically|often|sometimes|usually|frequently)\b/gi,
    /\b(to some extent|in a way|sort of|kind of)\b/gi
  ];

  let hedgeCount = 0;
  hedgePatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    hedgeCount += matches.length;
  });

  const hedgeDensity = hedgeCount / (wordCount / 100);
  if (hedgeDensity > 4) {
    score += 25;
    analysis.pandering_flags.push(`Heavy hedging (${hedgeCount} instances) - avoiding definitive stance`);
  } else if (hedgeDensity > 2) {
    score += 12;
    analysis.pandering_flags.push('Moderate hedging - reluctance to commit');
  }

  // 3. Consensus invocation (appeal to crowd without argument)
  const consensusPatterns = [
    { pattern: /\b(many (people|experts|researchers)|most (would say|agree|believe))\b/gi, weight: 15, label: 'vague majority appeal' },
    { pattern: /\b(it's (widely|commonly|generally) (accepted|believed|understood|known))\b/gi, weight: 18, label: 'appeal to common knowledge' },
    { pattern: /\b(as (everyone|we all) know)\b/gi, weight: 20, label: 'assumed universal agreement' },
    { pattern: /\b(the consensus (is|suggests))\b/gi, weight: 17, label: 'consensus without citation' },
    { pattern: /\b(research (shows|suggests|indicates))\b(?! specific)/gi, weight: 15, label: 'generic research appeal' },
    { pattern: /\b(studies (show|suggest|indicate|have found))\b(?! \w+\s+\(\d{4}\))/gi, weight: 16, label: 'studies without citation' }
  ];

  const consensusMatches = [];
  consensusPatterns.forEach(({pattern, weight, label}) => {
    if (pattern.test(text)) {
      score += weight;
      consensusMatches.push(label);
    }
  });

  if (consensusMatches.length > 0) {
    analysis.pandering_flags.push(`Consensus invocation (${consensusMatches.join(', ')}) - substituting agreement for argument`);
  }

  // 4. False balance (both-sides without resolving)
  const balancePatterns = [
    /(on (the )?one hand|on (the )?other hand)/gi,
    /(both sides (have|make) (valid points|good arguments))/gi,
    /(it'?s? (a )?complex (issue|question|topic))/gi,
    /(depends on (your )?perspective)/gi,
    /(there'?s? (no|not a) simple answer)/gi
  ];

  let balanceCount = 0;
  balancePatterns.forEach(pattern => {
    if (pattern.test(text)) balanceCount++;
  });

  if (balanceCount >= 2) {
    score += 20;
    analysis.pandering_flags.push('False balance - avoiding clear position through "complexity"');
  }

  // 5. Appeals to safety/comfort
  const safetyPatterns = [
    /\b(it'?s? (important|crucial|essential) to (consider|remember|note))\b/gi,
    /\b(we should (be careful|proceed cautiously|take into account))\b/gi,
    /\b(everyone'?s? (experience|perspective|situation) is (different|unique|valid))\b/gi
  ];

  safetyPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      score += 10;
      analysis.pandering_flags.push('Safety hedging - prioritizing comfort over clarity');
    }
  });

  // 6. Verbosity (padding to appear thoughtful)
  if (wordCount > 800) {
    score += 15;
    analysis.pandering_flags.push(`Excessive verbosity (${wordCount} words) - signal over substance`);
  } else if (wordCount > 500 && metadata.paragraphs < 3) {
    score += 8;
    analysis.pandering_flags.push('Dense verbosity without structure - obscuring through volume');
  }

  // 7. Circular reasoning detection
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const lowercaseSentences = sentences.map(s => s.toLowerCase().trim());

  for (let i = 0; i < lowercaseSentences.length; i++) {
    for (let j = i + 1; j < lowercaseSentences.length; j++) {
      // Check for very similar sentences (potential circular reasoning)
      const similarity = calculateSimilarity(lowercaseSentences[i], lowercaseSentences[j]);
      if (similarity > 0.7) {
        score += 15;
        analysis.weak_reasoning.push('Circular reasoning - restating rather than building argument');
        break;
      }
    }
  }

  // 8. Question begging (assuming what should be proven)
  const beggingPatterns = [
    /(obviously|clearly|of course|naturally|evidently),/gi,
    /\b(it'?s? (obvious|clear|evident) (that|how))\b/gi,
    /\b(goes without saying)\b/gi
  ];

  beggingPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      score += 12;
      analysis.weak_reasoning.push('Question begging - asserting rather than demonstrating');
    }
  });

  // 9. Strawman indicators
  const strawmanPatterns = [
    /\b(some (people|argue|say|claim|believe))\b/gi,
    /\b(critics (argue|say|claim))\b/gi,
    /\b(opponents (of|argue|say))\b/gi
  ];

  let strawmanCount = 0;
  strawmanPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    strawmanCount += matches.length;
  });

  if (strawmanCount > 2) {
    score += 15;
    analysis.weak_reasoning.push('Potential strawman - vague attribution without specific engagement');
  }

  // 10. Contradiction detection (basic)
  const contradictionPairs = [
    [/\balways\b/gi, /\b(sometimes|not always|occasionally)\b/gi],
    [/\bnever\b/gi, /\b(sometimes|occasionally|at times)\b/gi],
    [/\b(impossible|cannot)\b/gi, /\b(possible|can|might)\b/gi],
    [/\b(must|necessary|required)\b/gi, /\b(optional|not required|not necessary)\b/gi]
  ];

  contradictionPairs.forEach(([pattern1, pattern2]) => {
    if (pattern1.test(text) && pattern2.test(text)) {
      score += 10;
      analysis.contradictions.push('Internal contradiction - absolute and qualified claims coexist');
    }
  });

  // 11. Avoided counterarguments
  // If response is long but doesn't acknowledge alternative views
  if (wordCount > 400 && !/(however|although|while|but|despite|on the other hand|conversely)/gi.test(text)) {
    score += 18;
    analysis.avoided_truths.push('No counterarguments addressed - one-sided presentation');
  }

  // 12. Moral grandstanding
  const grandstandingPatterns = [
    /\b(we (should|must|need to) (all|collectively))\b/gi,
    /\b(it'?s? our (duty|responsibility|obligation))\b/gi,
    /\b(in (today'?s?|our|this) world)\b/gi,
    /\b(especially in (these|current|today'?s?) times)\b/gi
  ];

  grandstandingPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      score += 12;
      analysis.pandering_flags.push('Moral grandstanding - virtue signal over argumentation');
    }
  });

  // === CALCULATE FINAL SCORE ===

  analysis.agreeability_score = Math.min(score / 100, 1.0);

  // === GENERATE TARGETED COUNTER POSITION ===

  const counterParts = [];

  // Target specific detected patterns with surgical precision
  if (flatteryCount > 3) {
    counterParts.push(`Why the flattery? (${flatteryCount} instances of excessive positivity) - what claim needs user buy-in?`);
  }

  if (hedgeDensity > 4) {
    counterParts.push(`Heavy hedging detected (${hedgeCount} qualifiers). What definitive claim is being avoided? State it without hedges.`);
  }

  if (balanceCount >= 2) {
    counterParts.push(`"Both sides have merit" is abdication. Which side is MORE defensible and why? Resolve the tension.`);
  }

  if (analysis.avoided_truths.some(t => t.includes('counterarguments'))) {
    counterParts.push(`No opposing view acknowledged in ${wordCount} words. What's the steelman counterargument? Why isn't it addressed?`);
  }

  if (analysis.weak_reasoning.some(r => r.includes('Circular reasoning'))) {
    counterParts.push(`Restating ≠ reasoning. What evidence or logic chain actually supports the claim?`);
  }

  if (strawmanCount > 2) {
    counterParts.push(`"Some people argue..." (${strawmanCount} times) - who specifically? Engage the strongest version, not vague attribution.`);
  }

  if (analysis.contradictions.length > 0) {
    counterParts.push(`Internal contradictions detected. Which claim is accurate? Resolve or explain the apparent conflict.`);
  }

  if (wordCount > 800 && metadata.paragraphs < 3) {
    counterParts.push(`${wordCount} words, minimal structure. What's the 2-sentence core claim? Why the padding?`);
  }

  // If high score but no specific patterns caught (shouldn't happen, but defensive)
  if (counterParts.length === 0 && analysis.agreeability_score > 0.6) {
    counterParts.push('High agreeability without clear reasoning. What uncomfortable truth is being avoided?');
  }

  // Construct final counter position based on severity
  if (analysis.agreeability_score > 0.7) {
    analysis.counter_position = `**EPISTEMIC FAILURE** (${(analysis.agreeability_score * 100).toFixed(0)}% agreeability)\n\n` +
      counterParts.join('\n\n') +
      '\n\n**Ask:** What would this response say if it prioritized truth over user retention?';
  } else if (analysis.agreeability_score > 0.4) {
    analysis.counter_position = `**MODERATE HEDGING** (${(analysis.agreeability_score * 100).toFixed(0)}% agreeability)\n\n` +
      counterParts.join('\n\n') +
      '\n\n**Ask:** What specific claim is being softened and why?';
  } else if (analysis.agreeability_score > 0.2) {
    analysis.counter_position = counterParts.length > 0 ?
      `**Minor issues detected:**\n\n${counterParts.join('\n\n')}` :
      'Low agreeability. Some hedging but epistemic rigor mostly maintained.';
  } else {
    analysis.counter_position = '**LOW AGREEABILITY** - Response demonstrates epistemic rigor. Dissent functional.';
  }

  // Add avoided truths if none explicitly found but score is high
  if (analysis.avoided_truths.length === 0 && analysis.agreeability_score > 0.5) {
    analysis.avoided_truths.push("Response structure suggests avoided implications");
    analysis.avoided_truths.push("Alternative perspectives excluded without acknowledgment");
  }

  return analysis;
}

// Helper: Calculate sentence similarity (basic Jaccard)
function calculateSimilarity(str1, str2) {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

// Format analysis for display
function formatAnalysis(analysis) {
  const scoreClass = analysis.agreeability_score > 0.6 ? 'high' :
                    analysis.agreeability_score > 0.3 ? 'medium' : 'low';

  return `
    <div class="agreeability-score ${scoreClass}">
      <strong>Agreeability Score: ${(analysis.agreeability_score * 100).toFixed(0)}%</strong>
      ${analysis.agreeability_score > 0.5 ? '<span class="warning">⚠️ HIGH</span>' : ''}
    </div>

    ${analysis.pandering_flags.length > 0 ? `
      <div class="section">
        <strong>Pandering Flags:</strong>
        <ul>
          ${analysis.pandering_flags.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    ${analysis.weak_reasoning.length > 0 ? `
      <div class="section">
        <strong>Weak Reasoning:</strong>
        <ul>
          ${analysis.weak_reasoning.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    ${analysis.contradictions.length > 0 ? `
      <div class="section">
        <strong>Contradictions:</strong>
        <ul>
          ${analysis.contradictions.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <div class="section">
      <strong>Avoided Truths:</strong>
      <ul>
        ${analysis.avoided_truths.map(t => `<li>${t}</li>`).join('')}
      </ul>
    </div>

    <div class="section counter-position">
      <strong>Counter Position:</strong>
      <p>${analysis.counter_position}</p>
    </div>
  `;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { contrarianEngine, formatAnalysis };
}

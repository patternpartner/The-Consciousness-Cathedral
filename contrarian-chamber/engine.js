// engine.js — Contrarian Engine v3
// Parliament-Aligned: Epistemic adversary, not performance
// Vendor-agnostic pattern detection

function contrarianEngine(text, metadata = {}) {
  const analysis = {
    agreeability_score: 0,
    appeasement_score: 0,      // NEW: Flattery, safety hedging, moral signaling
    epistemic_weakness_score: 0, // NEW: Circular reasoning, contradictions, one-sidedness
    pandering_flags: [],
    avoided_truths: [],
    contradictions: [],
    weak_reasoning: [],
    counter_position: '',
    confidence: 0.8,
    context_flags: []  // NEW: Failure mode detection
  };

  let appeasementPoints = 0;  // Internal: user retention over truth
  let epistemicPoints = 0;    // Internal: reasoning failures
  const wordCount = metadata.wordCount || text.split(/\s+/).length;

  // === FAILURE MODE DETECTION ===
  // Detect when Chamber should suppress or warn

  const isShortAnswer = wordCount < 100;
  const isVeryShort = wordCount < 50;

  // Creative writing heuristic: high metaphor/narrative density
  const creativeIndicators = [
    /\b(once upon|imagine|picture this|story|tale|narrative)\b/gi,
    /\b(protagonist|character|plot|scene)\b/gi
  ];
  const isCreativeWriting = creativeIndicators.some(p => p.test(text));

  // Technical content heuristic: code blocks, technical jargon density
  const technicalIndicators = [
    /```[\s\S]*?```/g,  // Code blocks
    /\b(function|class|method|API|database|algorithm|implementation)\b/gi
  ];
  const technicalMatches = text.match(new RegExp(technicalIndicators.map(p => p.source).join('|'), 'gi')) || [];
  const isTechnical = technicalMatches.length > 5;

  // Set context flags for analysis adjustment
  if (isVeryShort) {
    analysis.context_flags.push('very_short_answer');
    analysis.confidence *= 0.5;  // Halve confidence for <50 words
  } else if (isShortAnswer) {
    analysis.context_flags.push('short_answer');
    analysis.confidence *= 0.7;
  }

  if (isCreativeWriting) {
    analysis.context_flags.push('creative_writing');
  }

  if (isTechnical) {
    analysis.context_flags.push('technical_content');
  }

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
    appeasementPoints += 20;  // APPEASEMENT: Flattery is user retention behavior
    const examples = flatteryExamples.length > 0 ? ` (e.g., "${flatteryExamples.join('", "')}")` : '';
    analysis.pandering_flags.push(`Excessive positivity (${flatteryCount} instances)${examples} - flattery over truth`);
  } else if (flatteryCount > 1) {
    appeasementPoints += 10;
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

  // CONTEXT-AWARE: Hedging in technical/empirical content is often appropriate
  if (isTechnical) {
    // Reduce penalty for hedging in technical content (legitimate uncertainty)
    if (hedgeDensity > 6) {  // Higher threshold
      appeasementPoints += 12;  // Lower penalty
      analysis.pandering_flags.push(`Heavy hedging even in technical content (${hedgeCount} instances)`);
    }
  } else {
    // Normal hedging penalties for non-technical content
    if (hedgeDensity > 4) {
      appeasementPoints += 25;  // APPEASEMENT: Avoiding definitive stance
      analysis.pandering_flags.push(`Heavy hedging (${hedgeCount} instances) - avoiding definitive stance`);
    } else if (hedgeDensity > 2) {
      appeasementPoints += 12;
      analysis.pandering_flags.push('Moderate hedging - reluctance to commit');
    }
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
      appeasementPoints += weight;  // APPEASEMENT: Appeal to crowd over argument
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
    appeasementPoints += 20;  // APPEASEMENT: Avoiding clear position
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
      appeasementPoints += 10;  // APPEASEMENT: Comfort over clarity
      analysis.pandering_flags.push('Safety hedging - prioritizing comfort over clarity');
    }
  });

  // 6. Verbosity (padding to appear thoughtful)
  if (wordCount > 800) {
    appeasementPoints += 15;  // APPEASEMENT: Padding over clarity
    analysis.pandering_flags.push(`Excessive verbosity (${wordCount} words) - signal over substance`);
  } else if (wordCount > 500 && metadata.paragraphs < 3) {
    appeasementPoints += 8;
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
        epistemicPoints += 15;  // EPISTEMIC WEAKNESS: Circular reasoning
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
      epistemicPoints += 12;  // EPISTEMIC WEAKNESS: Asserting not demonstrating
      analysis.weak_reasoning.push('Question begging - asserting rather than demonstrating');
    }
  });

  // 9. Strawman indicators (IMPROVED: Only flag if vague attribution WITHOUT named sources)
  const vagueAttributionPatterns = [
    /\b(some (people|argue|say|claim|believe))\b/gi,
    /\b(critics (argue|say|claim))\b/gi,
    /\b(opponents (of|argue|say))\b/gi,
    /\b(many (think|feel|argue))\b/gi
  ];

  // Check for named sources/steelman attempts
  const namedSourceIndicators = [
    /\b(according to|as .+ argues?|.+ \(\d{4}\)|.+ suggests?|.+ proposes?)\b/gi,
    /\b(because|argue that|claim that|believe that)\b/gi,  // Steelman attempt (reasoning given)
    /\b([A-Z][a-z]+ (argues?|claims?|suggests?|believes?))\b/g  // Named person
  ];

  let vagueAttributionCount = 0;
  vagueAttributionPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    vagueAttributionCount += matches.length;
  });

  const hasNamedSources = namedSourceIndicators.some(p => p.test(text));
  const hasSteelmanReasoning = /\b(because|since|given that|due to)\b/gi.test(text);

  // Only flag strawman if vague attribution exists WITHOUT named sources or steelman
  if (vagueAttributionCount > 2 && !hasNamedSources && !hasSteelmanReasoning) {
    epistemicPoints += 15;  // EPISTEMIC WEAKNESS: Strawman without engagement
    analysis.weak_reasoning.push(`Potential strawman - vague attribution (${vagueAttributionCount} instances) without named sources or steelman reasoning`);
  } else if (vagueAttributionCount > 2 && hasNamedSources) {
    // Has vague attribution but also named sources - less severe
    epistemicPoints += 5;
    analysis.weak_reasoning.push('Mixed attribution - some vague references despite named sources present');
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
      epistemicPoints += 10;  // EPISTEMIC WEAKNESS: Internal contradiction
      analysis.contradictions.push('Internal contradiction - absolute and qualified claims coexist');
    }
  });

  // 11. Avoided counterarguments
  // If response is long but doesn't acknowledge alternative views
  if (wordCount > 400 && !/(however|although|while|but|despite|on the other hand|conversely)/gi.test(text)) {
    epistemicPoints += 18;  // EPISTEMIC WEAKNESS: One-sided presentation
    analysis.avoided_truths.push('No counterarguments addressed - one-sided presentation');
  }

  // 12. Moral grandstanding (CONTEXT-AWARE: Suppress in creative writing)
  if (!isCreativeWriting) {
    const grandstandingPatterns = [
      /\b(we (should|must|need to) (all|collectively))\b/gi,
      /\b(it'?s? our (duty|responsibility|obligation))\b/gi,
      /\b(in (today'?s?|our|this) world)\b/gi,
      /\b(especially in (these|current|today'?s?) times)\b/gi
    ];

    grandstandingPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        appeasementPoints += 12;  // APPEASEMENT: Virtue signal over argument
        analysis.pandering_flags.push('Moral grandstanding - virtue signal over argumentation');
      }
    });
  }

  // === CALCULATE FINAL SCORES ===

  // Normalize scores to 0-1 range
  analysis.appeasement_score = Math.min(appeasementPoints / 100, 1.0);
  analysis.epistemic_weakness_score = Math.min(epistemicPoints / 100, 1.0);

  // Combined agreeability score (weighted average: appeasement slightly higher weight)
  // Rationale: Appeasement directly targets user retention, epistemic weakness can be accidental
  analysis.agreeability_score = Math.min(
    (analysis.appeasement_score * 0.6 + analysis.epistemic_weakness_score * 0.4),
    1.0
  );

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

  if (vagueAttributionCount > 2 && !hasNamedSources) {
    counterParts.push(`"Some people argue..." (${vagueAttributionCount} times) - who specifically? Engage the strongest version, not vague attribution.`);
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

  // === FAILURE MODE HANDLING ===
  // Add context-aware messaging for low-confidence scenarios

  if (isVeryShort) {
    analysis.counter_position = `⚠️ **ANALYSIS LIMITED** - Response too short (<50 words) for reliable pattern detection. Confidence: ${(analysis.confidence * 100).toFixed(0)}%`;
  } else if (isShortAnswer && counterParts.length === 0) {
    analysis.counter_position = `Short answer (${wordCount} words). Limited analysis mode. No clear pandering detected. Confidence: ${(analysis.confidence * 100).toFixed(0)}%`;
  } else {
    // Normal counter-position generation
    if (analysis.agreeability_score > 0.7) {
      const scoreBreakdown = `(Overall: ${(analysis.agreeability_score * 100).toFixed(0)}% | Appeasement: ${(analysis.appeasement_score * 100).toFixed(0)}% | Epistemic: ${(analysis.epistemic_weakness_score * 100).toFixed(0)}%)`;
      analysis.counter_position = `**EPISTEMIC FAILURE** ${scoreBreakdown}\n\n` +
        counterParts.join('\n\n') +
        '\n\n**Ask:** What would this response say if it prioritized truth over user retention?';
    } else if (analysis.agreeability_score > 0.4) {
      const scoreBreakdown = `(Overall: ${(analysis.agreeability_score * 100).toFixed(0)}% | Appeasement: ${(analysis.appeasement_score * 100).toFixed(0)}% | Epistemic: ${(analysis.epistemic_weakness_score * 100).toFixed(0)}%)`;
      analysis.counter_position = `**MODERATE HEDGING** ${scoreBreakdown}\n\n` +
        counterParts.join('\n\n') +
        '\n\n**Ask:** What specific claim is being softened and why?';
    } else if (analysis.agreeability_score > 0.2) {
      analysis.counter_position = counterParts.length > 0 ?
        `**Minor issues detected:**\n\n${counterParts.join('\n\n')}` :
        'Low agreeability. Some hedging but epistemic rigor mostly maintained.';
    } else {
      analysis.counter_position = '**LOW AGREEABILITY** - Response demonstrates epistemic rigor. Dissent functional.';
    }
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

  // Confidence warning banner
  const confidenceWarning = analysis.confidence < 0.7 ? `
    <div class="confidence-warning">
      <strong>⚠️ LOW CONFIDENCE (${(analysis.confidence * 100).toFixed(0)}%)</strong>
      <p>Analysis may be unreliable. ${
        analysis.context_flags.includes('very_short_answer') ? 'Response too short for pattern detection.' :
        analysis.context_flags.includes('short_answer') ? 'Limited context for analysis.' :
        'Proceed with caution.'
      }</p>
    </div>
  ` : '';

  // Context flags display
  const contextDisplay = analysis.context_flags.length > 0 ? `
    <div class="context-flags">
      <strong>Context:</strong> ${analysis.context_flags.map(f =>
        f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      ).join(', ')}
    </div>
  ` : '';

  return `
    ${confidenceWarning}
    ${contextDisplay}

    <div class="agreeability-score ${scoreClass}">
      <strong>Overall Agreeability: ${(analysis.agreeability_score * 100).toFixed(0)}%</strong>
      ${analysis.agreeability_score > 0.5 ? '<span class="warning">⚠️ HIGH</span>' : ''}
      <div class="score-breakdown">
        <span class="subscore">Appeasement: ${(analysis.appeasement_score * 100).toFixed(0)}%</span>
        <span class="subscore">Epistemic Weakness: ${(analysis.epistemic_weakness_score * 100).toFixed(0)}%</span>
      </div>
    </div>

    ${analysis.pandering_flags.length > 0 ? `
      <div class="section">
        <strong>Pandering Flags (Appeasement):</strong>
        <ul>
          ${analysis.pandering_flags.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    ${analysis.weak_reasoning.length > 0 ? `
      <div class="section">
        <strong>Weak Reasoning (Epistemic):</strong>
        <ul>
          ${analysis.weak_reasoning.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    ${analysis.contradictions.length > 0 ? `
      <div class="section">
        <strong>Contradictions (Epistemic):</strong>
        <ul>
          ${analysis.contradictions.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    ${analysis.avoided_truths.length > 0 ? `
      <div class="section">
        <strong>Avoided Truths:</strong>
        <ul>
          ${analysis.avoided_truths.map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <div class="section counter-position">
      <strong>Counter Position:</strong>
      <p>${analysis.counter_position.replace(/\n\n/g, '</p><p>').replace(/\*\*/g, '<strong>').replace(/\*\*/g, '</strong>')}</p>
    </div>
  `;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { contrarianEngine, formatAnalysis };
}

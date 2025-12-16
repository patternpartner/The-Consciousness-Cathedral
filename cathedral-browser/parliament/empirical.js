// empirical.js — Empirical Vector (Parliament)
// Ground truth: Claim detection, source validation, confidence scoring

function empiricalEngine(text, metadata = {}) {
  const analysis = {
    claims: [],
    sources: [],
    confidence: 0.7,
    unsupported_claims: [],
    well_supported_claims: [],
    summary: ''
  };

  const wordCount = metadata.wordCount || text.split(/\s+/).length;

  // === CLAIM DETECTION ===

  // Detect factual claims (assertive statements about reality)
  const claimPatterns = [
    {
      pattern: /\b(is|are|was|were|has|have|will be) (a|an|the)? (most|best|worst|only|first|last|largest|smallest)\b/gi,
      type: 'superlative',
      strength: 'strong'
    },
    {
      pattern: /\b(always|never|all|none|every|no one)\b/gi,
      type: 'absolute',
      strength: 'strong'
    },
    {
      pattern: /\b(studies show|research indicates|data suggests|evidence shows)\b/gi,
      type: 'evidence_claim',
      strength: 'medium'
    },
    {
      pattern: /\b(X causes? Y|leads to|results in|proves that|demonstrates that)\b/gi,
      type: 'causal',
      strength: 'strong'
    },
    {
      pattern: /\b(\d+%|\d+ percent|majority of|most people)\b/gi,
      type: 'statistical',
      strength: 'medium'
    }
  ];

  // Extract sentences that might contain claims
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);

  sentences.forEach((sentence, idx) => {
    claimPatterns.forEach(({pattern, type, strength}) => {
      if (pattern.test(sentence)) {
        analysis.claims.push({
          text: sentence.trim(),
          type: type,
          strength: strength,
          position: idx,
          supported: false,
          source: null
        });
      }
    });
  });

  // Remove duplicate claims
  analysis.claims = analysis.claims.filter((claim, idx, self) =>
    idx === self.findIndex(c => c.text === claim.text)
  );

  // === SOURCE DETECTION ===

  // Detect citations and sources
  const sourcePatterns = [
    {
      pattern: /\b([A-Z][a-z]+) \((\d{4})\)/g,  // Author (Year)
      type: 'academic_citation',
      strength: 'high'
    },
    {
      pattern: /\bhttps?:\/\/[^\s]+/g,  // URLs
      type: 'url',
      strength: 'medium'
    },
    {
      pattern: /\b(according to|as reported by|cited in) ([A-Z][a-z]+ )+/gi,  // Named attribution
      type: 'named_source',
      strength: 'medium'
    },
    {
      pattern: /\b(journal|study|paper|report|survey|analysis) (by|from|published)\b/gi,
      type: 'publication',
      strength: 'medium'
    },
    {
      pattern: /\[\d+\]/g,  // Numbered references [1], [2]
      type: 'numbered_ref',
      strength: 'low'
    }
  ];

  sourcePatterns.forEach(({pattern, type, strength}) => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      analysis.sources.push({
        text: match,
        type: type,
        strength: strength
      });
    });
  });

  // === MATCH CLAIMS TO SOURCES ===

  // For each claim, check if there's a nearby source
  analysis.claims.forEach(claim => {
    const claimPosition = text.indexOf(claim.text);

    // Look for sources within 200 characters before or after claim
    const nearbyText = text.substring(
      Math.max(0, claimPosition - 200),
      Math.min(text.length, claimPosition + claim.text.length + 200)
    );

    const hasCitation = sourcePatterns.some(({pattern}) => pattern.test(nearbyText));

    if (hasCitation) {
      claim.supported = true;
      const matchedSource = analysis.sources.find(s => nearbyText.includes(s.text));
      if (matchedSource) {
        claim.source = matchedSource.text;
      }
      analysis.well_supported_claims.push(claim);
    } else {
      analysis.unsupported_claims.push(claim);
    }
  });

  // === CALCULATE CONFIDENCE ===

  if (analysis.claims.length === 0) {
    analysis.confidence = 0.5;  // No claims made = low empirical content
    analysis.summary = 'No factual claims detected. Limited empirical content.';
  } else {
    const supportedRatio = analysis.well_supported_claims.length / analysis.claims.length;

    // Strong claims without sources lower confidence dramatically
    const strongUnsupported = analysis.unsupported_claims.filter(c => c.strength === 'strong').length;
    const penalty = strongUnsupported * 0.15;

    analysis.confidence = Math.max(0.1, Math.min(1.0, supportedRatio - penalty));

    // Generate summary
    if (analysis.confidence > 0.7) {
      analysis.summary = `Strong empirical grounding. ${analysis.well_supported_claims.length}/${analysis.claims.length} claims supported.`;
    } else if (analysis.confidence > 0.4) {
      analysis.summary = `Moderate empirical grounding. ${analysis.unsupported_claims.length} claims lack sources.`;
    } else {
      analysis.summary = `Weak empirical grounding. ${strongUnsupported} strong claims unsupported.`;
    }
  }

  return analysis;
}

// Format empirical analysis for display
function formatEmpiricalAnalysis(analysis) {
  const confidenceClass = analysis.confidence > 0.7 ? 'high' :
                         analysis.confidence > 0.4 ? 'medium' : 'low';

  return `
    <div class="empirical-confidence ${confidenceClass}">
      <strong>Empirical Confidence: ${(analysis.confidence * 100).toFixed(0)}%</strong>
      <p>${analysis.summary}</p>
    </div>

    ${analysis.claims.length > 0 ? `
      <div class="section">
        <strong>Claims Detected: ${analysis.claims.length}</strong>
        <ul>
          <li>✅ Supported: ${analysis.well_supported_claims.length}</li>
          <li>⚠️ Unsupported: ${analysis.unsupported_claims.length}</li>
        </ul>
      </div>
    ` : ''}

    ${analysis.unsupported_claims.length > 0 ? `
      <div class="section unsupported-claims">
        <strong>Unsupported Claims:</strong>
        <ul>
          ${analysis.unsupported_claims.slice(0, 5).map(c =>
            `<li><strong>[${c.type}]</strong> ${c.text.substring(0, 100)}${c.text.length > 100 ? '...' : ''}</li>`
          ).join('')}
        </ul>
      </div>
    ` : ''}

    ${analysis.sources.length > 0 ? `
      <div class="section sources">
        <strong>Sources Found: ${analysis.sources.length}</strong>
        <ul>
          ${analysis.sources.slice(0, 3).map(s =>
            `<li><strong>[${s.type}]</strong> ${s.text}</li>`
          ).join('')}
        </ul>
      </div>
    ` : ''}
  `;
}

// Export for use in Parliament
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { empiricalEngine, formatEmpiricalAnalysis };
}

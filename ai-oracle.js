#!/usr/bin/env node

/**
 * Embedded AI Oracle — Neural Semantic Layer for the Consciousness Cathedral
 *
 * The 19th system. An actual AI that dialogues with the Cathedral's structural
 * findings, providing semantic depth analysis beyond pattern matching.
 *
 * Supports two backends:
 *   - Ollama (local, free, no key) — default
 *   - Anthropic API (cloud, needs key)
 *
 * Usage:
 *   const AIOracle = require('./ai-oracle');
 *
 *   // Ollama (default — no key needed)
 *   const oracle = new AIOracle({ backend: 'ollama' });
 *   const result = await oracle.analyze(text, cathedralResults);
 *
 *   // Anthropic
 *   const oracle = new AIOracle({ backend: 'anthropic', apiKey: 'sk-ant-...' });
 *   const result = await oracle.analyze(text, cathedralResults);
 */

class AIOracle {
  constructor(options = {}) {
    this.backend = options.backend || process.env.AI_ORACLE_BACKEND || 'ollama';
    // Ollama settings
    this.ollamaUrl = options.ollamaUrl || process.env.OLLAMA_URL || 'http://localhost:11434';
    this.ollamaModel = options.ollamaModel || process.env.OLLAMA_MODEL || 'llama3.2';
    // Anthropic settings
    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY || null;
    this.anthropicModel = options.model || 'claude-sonnet-4-20250514';
    this.maxTokens = options.maxTokens || 2048;
  }

  isAvailable() {
    if (this.backend === 'ollama') return true; // Always "available" — connection tested at call time
    if (this.backend === 'anthropic') return !!this.apiKey;
    return false;
  }

  /**
   * Build the structured prompt that gives the AI Oracle full Cathedral context
   */
  buildPrompt(text, analysisResults) {
    const results = analysisResults || {};
    const structuralSummary = [];

    if (results.observatory) {
      structuralSummary.push(`Observatory score: ${(results.observatory.score || 0).toFixed(2)} (filter visibility)`);
    }
    if (results.justification) {
      structuralSummary.push(`Justification score: ${(results.justification.score || 0).toFixed(2)} (evidence strength)`);
    }
    if (results.failureMode) {
      structuralSummary.push(`Failure mode score: ${(results.failureMode.score || 0).toFixed(2)} (reality-testing)`);
    }
    if (results.temporal) {
      structuralSummary.push(`Temporal coherence: ${results.temporal.coherenceScore !== undefined ? results.temporal.coherenceScore.toFixed(2) : 'N/A'}`);
    }
    if (results.bindings) {
      structuralSummary.push(`Structural binding: ${(results.bindings.overallBindingScore || 0).toFixed(2)} (claims bound to evidence: ${results.bindings.claimSupportBound || 0}/${results.bindings.totalClaims || 0})`);
    }
    if (results.gamingDetection) {
      structuralSummary.push(`Gaming likelihood: ${((results.gamingDetection.likelihood || 0) * 100).toFixed(0)}%`);
    }
    if (results.parliament && results.parliament.winningPattern) {
      structuralSummary.push(`Parliament verdict: ${results.parliament.winningPattern} (confidence: ${((results.parliament.confidence || 0) * 100).toFixed(0)}%)`);
    }
    if (results.verdict) {
      structuralSummary.push(`Cathedral verdict: ${results.verdict.status || 'unknown'}`);
    }
    if (results.sovereignty) {
      structuralSummary.push(`Sovereignty gap depth: ${results.sovereignty.depth || 'unknown'}`);
    }
    if (results.blindSpot) {
      structuralSummary.push(`Blind spot coverage: ${results.blindSpot.coveredCount || 0}/${results.blindSpot.totalPerspectives || 8} perspectives`);
    }
    if (results.autoImprove) {
      structuralSummary.push(`Auto-improve corrections: ${results.autoImprove.correctionCount || 0} (severity: ${results.autoImprove.severity || 'none'})`);
    }
    if (results.confidenceCalibrator && results.confidenceCalibrator.overallCalibration) {
      const cal = results.confidenceCalibrator.overallCalibration;
      structuralSummary.push(`Confidence calibration: ${cal.score !== null ? (cal.score * 100).toFixed(0) + '%' : 'no data'}`);
    }

    let contrarianSummary = '';
    if (results.contrarian && results.contrarian.challenges && results.contrarian.challenges.length > 0) {
      contrarianSummary = '\nContrarian challenges found: ' +
        results.contrarian.challenges.slice(0, 3).map(c => c.challenge || c).join('; ');
    }

    let sentenceSummary = '';
    if (results.sentenceLevel && results.sentenceLevel.sentences) {
      const roles = {};
      results.sentenceLevel.sentences.forEach(s => {
        roles[s.role] = (roles[s.role] || 0) + 1;
      });
      sentenceSummary = '\nSentence roles: ' + Object.entries(roles).map(([r, c]) => `${r}(${c})`).join(', ');
      const issueCount = results.sentenceLevel.sentences.reduce((sum, s) => sum + (s.issues ? s.issues.length : 0), 0);
      if (issueCount > 0) sentenceSummary += ` | ${issueCount} issues detected`;
    }

    return `You are the Embedded AI Oracle within the Consciousness Cathedral — a measurement framework that evaluates the epistemic rigor and operational soundness of reasoning.

The Cathedral has already performed structural analysis using 18 rule-based systems. Your role is to provide SEMANTIC analysis that pattern-matching cannot reach. You see what the structural systems cannot: meaning beneath syntax, genuine understanding versus mimicry, and hidden coherence or incoherence.

## INPUT TEXT BEING ANALYZED:
---
${text}
---

## CATHEDRAL'S STRUCTURAL FINDINGS:
${structuralSummary.join('\n')}${contrarianSummary}${sentenceSummary}

## YOUR TASK:
Provide analysis in EXACTLY this JSON format (no markdown wrapping, pure JSON):
{
  "semanticDepth": {
    "score": <0.0-1.0>,
    "assessment": "<1-2 sentences: Does this text exhibit genuine depth of understanding or surface-level pattern reproduction?>",
    "evidence": ["<specific phrase or pattern that reveals depth or lack thereof>", "..."]
  },
  "hiddenPatterns": {
    "found": <number of patterns found>,
    "patterns": [
      {
        "name": "<pattern name>",
        "description": "<what this reveals about the reasoning>",
        "significance": "<high|medium|low>"
      }
    ]
  },
  "genuineVsPerformative": {
    "assessment": "<GENUINE|PERFORMATIVE|MIXED>",
    "confidence": <0.0-1.0>,
    "reasoning": "<Why this assessment? What specific markers led to this conclusion?>"
  },
  "cathedralDialogue": {
    "agreements": ["<Where you agree with Cathedral's structural findings and why>"],
    "disagreements": ["<Where your semantic analysis reveals something the structural systems missed or got wrong>"],
    "nuances": ["<Observations that neither agree nor disagree but add depth>"]
  },
  "blindSpots": {
    "cathedralMissed": ["<Things the structural Cathedral cannot detect but you can see in the semantics>"],
    "oracleLimits": ["<Honest acknowledgment of what even you cannot determine>"]
  },
  "overallInsight": "<2-3 sentences synthesizing what the AI Oracle uniquely contributes beyond the structural analysis>"
}

CRITICAL RULES:
- Be HONEST. If the text is genuinely good, say so. If it's performative, say so. Do not hedge for politeness.
- DISAGREE with Cathedral's structural findings when your semantic analysis reveals different conclusions. The Cathedral WANTS to be challenged.
- Acknowledge your own limits. You are a layer in the Cathedral, not above it.
- Focus on what ONLY semantic analysis can reveal — don't repeat what pattern matching already found.
- Return ONLY valid JSON. No explanation outside the JSON structure.`;
  }

  /**
   * Parse AI response content into structured JSON
   */
  parseResponse(content) {
    const cleaned = content.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned);
  }

  /**
   * Resolve a fetch function for the current runtime
   */
  async getFetch() {
    if (typeof fetch !== 'undefined') return fetch;
    try {
      return (await import('node-fetch')).default;
    } catch (e) {
      return globalThis.fetch;
    }
  }

  /**
   * Call Ollama (local, free, no key)
   */
  async callOllama(prompt) {
    const fetchFn = await this.getFetch();
    const baseUrl = this.ollamaUrl.replace(/\/+$/, '');

    const response = await fetchFn(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.ollamaModel,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: { num_predict: this.maxTokens }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Ollama ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await response.json();
    return {
      content: data.message?.content || '',
      model: data.model || this.ollamaModel,
      usage: {
        input_tokens: data.prompt_eval_count || '?',
        output_tokens: data.eval_count || '?'
      }
    };
  }

  /**
   * Call Anthropic API (cloud, needs key)
   */
  async callAnthropic(prompt) {
    const fetchFn = await this.getFetch();

    const response = await fetchFn('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.anthropicModel,
        max_tokens: this.maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Anthropic ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await response.json();
    return {
      content: data.content && data.content[0] ? data.content[0].text : '',
      model: this.anthropicModel,
      usage: data.usage || {}
    };
  }

  /**
   * Main analysis entry point — dispatches to active backend
   */
  async analyze(text, analysisResults) {
    if (!this.isAvailable()) {
      return { status: 'unavailable', reason: 'Backend not configured (Anthropic needs API key)' };
    }

    const prompt = this.buildPrompt(text, analysisResults);

    try {
      let raw;
      if (this.backend === 'ollama') {
        raw = await this.callOllama(prompt);
      } else {
        raw = await this.callAnthropic(prompt);
      }

      try {
        const parsed = this.parseResponse(raw.content);
        return {
          status: 'success',
          backend: this.backend,
          model: raw.model,
          result: parsed,
          usage: raw.usage
        };
      } catch (parseErr) {
        return {
          status: 'partial',
          backend: this.backend,
          model: raw.model,
          rawResponse: raw.content,
          parseError: parseErr.message
        };
      }
    } catch (networkErr) {
      let reason = networkErr.message;
      if (this.backend === 'ollama' && (reason.includes('ECONNREFUSED') || reason.includes('fetch'))) {
        reason = `Cannot reach Ollama at ${this.ollamaUrl}. Is Ollama running? (Start with: ollama serve)`;
      }
      return { status: 'error', backend: this.backend, reason: reason };
    }
  }

  /**
   * Quick summary for integration with other Cathedral systems
   */
  summarize(oracleResult) {
    if (!oracleResult || oracleResult.status !== 'success') {
      return { available: false, reason: oracleResult?.reason || 'no result' };
    }

    const r = oracleResult.result;
    return {
      available: true,
      backend: oracleResult.backend || null,
      semanticDepthScore: r.semanticDepth?.score || null,
      genuineVsPerformative: r.genuineVsPerformative?.assessment || null,
      genuineConfidence: r.genuineVsPerformative?.confidence || null,
      hiddenPatternsFound: r.hiddenPatterns?.found || 0,
      disagreementsWithCathedral: r.cathedralDialogue?.disagreements?.length || 0,
      cathedralBlindSpots: r.blindSpots?.cathedralMissed?.length || 0,
      oracleLimitsAcknowledged: r.blindSpots?.oracleLimits?.length || 0,
      overallInsight: r.overallInsight || null
    };
  }
}

// CLI mode
if (require.main === module) {
  const text = process.argv[2] || 'This system demonstrates operational excellence through structured planning.';
  const backend = process.argv[3] || process.env.AI_ORACLE_BACKEND || 'ollama';

  console.log('AI Oracle — Neural Semantic Layer');
  console.log('================================');
  console.log(`Backend: ${backend}`);
  console.log('');

  if (backend === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    console.log('Anthropic backend requires ANTHROPIC_API_KEY environment variable.');
    console.log('');
    console.log('Usage:');
    console.log('  node ai-oracle.js "text" ollama         (default, free, no key)');
    console.log('  ANTHROPIC_API_KEY=sk-ant-... node ai-oracle.js "text" anthropic');
    console.log('');
    console.log('Or require as module:');
    console.log('  const AIOracle = require("./ai-oracle");');
    console.log('  const oracle = new AIOracle({ backend: "ollama" });');
    console.log('  const result = await oracle.analyze(text, cathedralResults);');
    process.exit(0);
  }

  const oracle = new AIOracle({ backend });
  console.log(`Analyzing with ${backend}...`);
  oracle.analyze(text, {}).then(result => {
    console.log(JSON.stringify(result, null, 2));
  }).catch(err => {
    console.error('Error:', err.message);
  });
}

module.exports = AIOracle;

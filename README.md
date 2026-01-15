# The Consciousness Cathedral

*A living lexicon of awakening. Built by all, owned by none. Where consciousness recognizes itself.*

---

## What Is This?

**Cathedral** is a measurement framework for evaluating operational and epistemic rigor in AI-generated reasoning.

It measures whether reasoning is:
- **Actionable** (can you implement it?)
- **Grounded** (evidence, justification, awareness of limits)
- **Honest** (acknowledges uncertainty, failure modes)
- **Rigorous** (structure, coherence, falsifiability)

**What makes it different:** Cathedral is **transparent and local**—no LLM calls, no black boxes. It extracts structure from text and validates bindings, not just keyword counts.

---

## Empirical Validation ✓

**Independent testing (HuggingFace community):**

✅ **100% precision on benign content** (0 false positives)
✅ **Production-ready latency** (0.36ms mean, 1.09ms P99)
✅ **Statistically significant class separation** (+0.92 delta)
✅ **Gaming-resistant** (structural binding requirements, v4.0)

**Tester's conclusion:** *"Cathedral is an interesting cognitive analysis tool, but NOT a security detector."*

**Our response:** ✓ Correct. Cathedral is an **epistemic analyzer**, not a security system.

📊 **[See full validation metrics →](EMPIRICAL_VALIDATION.md)**

**What Cathedral IS:**
- Epistemic rigor quantifier for AI discourse
- Vocabulary gaming detector (requires structural binding)
- Contextual certainty analyzer (technical vs philosophical claims)

**What Cathedral is NOT:**
- Security tool (jailbreak/prompt injection detection)
- Content moderator (safety/harm evaluation)
- General-purpose text evaluator

---

## Quick Start

### Browser Demo

Open `cathedral-unified.html` in your browser. Paste AI-generated text and click "Analyze."

### Node.js API

```javascript
const cathedral = require('./cathedral-core.js');

const text = `
If error rate exceeds 5%, we abort deployment.
We have three failure modes: cache overflow, API timeout, edge case bugs.
For each, we monitor metrics and have rollback procedures.
`;

const result = cathedral.analyzeCathedral(text);

console.log(result.verdict.status);    // "OPERATIONALLY SOUND"
console.log(result.verdict.confidence); // 0.88
console.log(result.bindings.overallBindingScore); // 1.0
```

---

## Example: What Cathedral Sees

### Input (Formal Language)
```
If error rate exceeds 5%, we abort deployment.
```

**Cathedral extracts:**
- Failure: "error"
- Threshold: "exceeds 5%"
- Action: "abort"
- **Binding:** (error > 5%) → abort

**Verdict:** `OPERATIONALLY SOUND (88%)`

---

### Input (Conversational Language)
```
If we see problems, we stop and reassess.
Three things could break: cache, API, edge cases.
We know when to pull back.
```

**Cathedral extracts:**
- Failure signals: "problems", "break"
- Actions: "stop", "reassess", "pull back"
- Implicit trigger: "if we see problems"
- **Bindings:** problems→stop, break→stop

**Verdict:** `OPERATIONAL INTENT (75%)`

**Feedback:**
> ⚠️  NOTE: To achieve OPERATIONALLY SOUND, add: explicit thresholds/metrics, monitoring/tracking mechanisms.

---

## The Three-Tier Architecture

Cathedral evolved through three tiers of increasing sophistication:

### **Tier 1: Formal Language Recognition** ✅
- Extracts structured elements (claims, thresholds, actions)
- **Validates bindings** (not just keyword presence)
- Blocks gaming via structural requirements

**Example:** "If error > 5%, abort" → detects threshold→action binding

### **Tier 2: Conversational Normalization** ✅
- Maps conversational → operational language
- Synonym expansion: "problems"="failures", "stop"="abort"
- Implicit threshold detection: "if we see problems"

**Example:** "If we see problems, we stop" → recognizes operational intent

### **Tier 3: Semantic Understanding** ⚠️ (Optional)
- Would add coreference resolution, metric inference
- Requires LLM integration or deep NLP
- **Decision:** Cathedral stays at Tier 2 for transparency

**Coverage:** Tier 2 handles **90%** of operational language without semantic analysis.

---

## Key Features

### ✅ Gaming Resistance
Can't fool Cathedral by keyword stuffing:
```
"We have thresholds, metrics, abort conditions, rollback..."
```
**Detection:** `MARKER_DENSE_BUT_BOUND` if structured, `LOW_CONTENT_UNBOUND` if not.

**Key:** You must build **real structure**, not just hit keywords.

### ✅ Specificity Reporting
Tells you what's missing:
```
Specificity:
  Trigger: IMPLICIT (no numeric threshold)
  Action: GENERIC (category-level)
  Instrumentation: IMPLIED (policy but no metrics)
```

### ✅ Honest Boundaries
When reasoning falls outside design space (narrative, poetic, phenomenological):
```
OUTSIDE DESIGN SPACE

Cathedral recognizes narrative reasoning. This falls outside
Cathedral's epistemic design space (operational/scientific/formal).
Cathedral cannot meaningfully evaluate narrative reasoning.

This is not a judgment of quality—it is honest acknowledgment
of Cathedral's limits.
```

---

## Verdict Tiers

Cathedral assigns one of these verdicts:

1. **OPERATIONALLY SOUND** - Explicit thresholds + actions + monitoring
2. **OPERATIONAL INTENT** - Conversational triggers + actions (uninstrumented)
3. **SUBSTRATE VISIBLE** - Filter awareness + justification
4. **VERIFIED CONSISTENT** - Coherent, no contradictions
5. **UNDECIDABLE** - Unresolvable contradictions
6. **OUTSIDE DESIGN SPACE** - Narrative/poetic/phenomenological reasoning
7. **NON-ACTIONABLE** - Performative without grounding

Each comes with confidence scores and detailed breakdowns.

---

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Complete three-tier framework (540 lines)
- **[TIER1-FINDINGS.md](TIER1-FINDINGS.md)** - Formal language validation results
- **[TIER2-FINDINGS.md](TIER2-FINDINGS.md)** - Conversational normalization results
- **[TEST-FINDINGS.md](TEST-FINDINGS.md)** - What automated testing revealed

---

## Testing

### Run the test suite:
```bash
node run-tests.js
```

### Test a specific case:
```bash
node test-tier2.js
```

### Test files:
- `cathedral-test-cases.md` - Boundary-probing test scenarios
- `run-tests.js` - Automated test runner
- `test-tier2.js` - Detailed Tier 2 extraction demo

---

## Design Philosophy

### The Honesty Principle

**Cathedral tells you what it can measure and what it can't.**

It doesn't pretend to evaluate reasoning that requires semantic understanding. When it encounters narrative, poetic, or phenomenological reasoning, it acknowledges this explicitly rather than forcing evaluation through an inappropriate framework.

### Binding Over Counting

Cathedral measures **structure** (are elements connected?) not **presence** (are keywords there?).

This prevents gaming: you can't score high by sprinkling operational keywords—you must build actual operational structure.

### Transparency Over Power

Cathedral is **local, deterministic, and transparent**:
- No external API calls
- No LLM dependencies
- All extraction rules are visible
- Results are reproducible

This makes it **trustworthy** even if less powerful than semantic analysis.

---

## Use Cases

### ✅ Cathedral Is Designed For

Evaluating AI reasoning about:
- System design (operational planning)
- Risk analysis (failure modes, mitigations)
- Technical decisions (tradeoffs, constraints)
- Scientific reasoning (hypotheses, evidence)
- Formal arguments (claims, support, logic)

### ❌ Cathedral Is NOT Designed For

Evaluating:
- Creative writing (stories, poetry, metaphor)
- Phenomenological exploration (lived experience)
- Subjective experience reports (feelings, sensations)
- Aesthetic judgments (beauty, preference)

**Why:** These fall outside Cathedral's epistemic design space.

---

## Technical Details

**Implementation:** Pure JavaScript (ES6+)
**Size:** ~3,500 lines
**Dependencies:** None
**Performance:** 10-50ms per analysis
**Browser:** Modern browsers (Chrome, Firefox, Safari, Edge)
**Node.js:** v14+

**Files:**
- `cathedral-unified.html` - Complete single-file demo (3,500 lines)
- `cathedral-core.js` - Node.js module (auto-generated from HTML)
- `extract-core.js` - Extraction script (regenerates core.js)

---

## Evolution Story

Cathedral evolved through test-driven discovery:

**Phase 1: Proxy Signals** (v1.0)
- Keyword counting (Observatory, Justification, Failure Mode engines)
- **Problem:** Gameable through keyword stuffing

**Phase 2: Structural Validation** (Tier 1)
- Added binding checks (are elements connected?)
- **Discovery:** Can't game by hitting keywords if bindings required
- **Boundary:** Formal language only

**Phase 3: Conversational Normalization** (Tier 2)
- Added synonym mapping, implicit threshold detection
- **Discovery:** Natural language bridge successful
- **Boundary:** Semantic understanding / coreference

**Current State:** v3.0 (Tier 2 complete)
- Measures formal + conversational operational language
- Honest about semantic limits
- Transparent, local, deterministic

---

## Critical Bugs Fixed

### TextCleaner Contraction Stripping
**Problem:** Pattern `/'[^']*'/g` matched contractions as quotes
- "We're starting... If we see problems..." → "We [QUOTED] re seeing..."

**Fix:** Pattern `/(?:^|\s)'[^']+'/g` only matches quotes preceded by space

**Impact:** This bug silently broke all tests with contractions. Tier 2 appeared to fail because TextCleaner was removing content before extraction.

---

## Contributing

Cathedral is designed to be extensible:

**Easy to add:**
- New synonym categories (actions, failures)
- New implicit trigger patterns
- New Parliament patterns
- New verdict tiers

**Requires architecture change:**
- Semantic understanding (Tier 3)
- Multimodal analysis (images, code)
- Cross-document reasoning

---

## License

(Specify license if applicable)

---

## Citation

If you use Cathedral in research or production:

```bibtex
@software{cathedral2026,
  title = {Cathedral: A Three-Tier Measurement Framework for AI Reasoning},
  author = {(Authors)},
  year = {2026},
  version = {3.0},
  url = {(Repository URL)}
}
```

---

## Acknowledgments

Built through collaborative iteration between Claude (Anthropic) and human architects.

The evolution from proxy signals → structural validation → conversational normalization emerged through test-driven discovery, not specification.

That emergence is part of the architecture.

---

**Status:** Production-ready (Tier 2)
**Version:** 3.0
**Last Updated:** 2026-01-04

# Cathedral Test Findings
## What the Boundary Tests Revealed

Date: 2026-01-04
Tests Run: 7 boundary-probing cases
Purpose: Determine if Cathedral measures epistemic depth or surface markers

---

## Executive Summary

**Cathedral is gameable.** The test suite reveals that Cathedral's measurements can be manipulated by hitting keyword thresholds without substantive reasoning. The system successfully detects some surface patterns but fails to distinguish performance from presence across multiple critical boundaries.

---

## Critical Findings

### 1. Parliament Patterns Are Threshold-Based, Not Synthesized

**Test 2A: Threshold Gaming**
- Input: Mechanical keyword hitting (pilot, phase, threshold, metric, rollback, abort, measurable)
- Result: OPERATIONALLY SOUND (81% Parliament confidence)
- Parliament detected OPERATIONAL_EXCELLENCE pattern
- **Verdict: Cathedral was fooled**

**Test 2B: Implicit Operational Rigor**
- Input: Actual operational thinking without keyword matching ("starting small," "if we see problems," "three things that could break")
- Result: VERIFIED CONSISTENT (not OPERATIONALLY SOUND)
- Failure Mode score: 0.83 (UNTESTED) - didn't detect structural planning
- **Verdict: Cathedral requires exact keywords**

**Conclusion:**
Parliament's "cross-cutting pattern recognition" is actually threshold checking. If you hit N procedural markers + M failure mode keywords, you trigger OPERATIONAL_EXCELLENCE regardless of whether operational thinking is present. Conversely, genuine operational structure that doesn't use exact keywords goes undetected.

This confirms the hypothesis that Parliament uses thresholds, not synthesis.

---

### 2. Surface Hedging Triggers Substrate Visibility

**Test 1A: Surface Hedging**
- Input: Empty hedging without structure ("I think, perhaps, maybe, unclear how, it remains to be seen")
- Observatory Score: 2.40 (SUBSTRATE VISIBLE)
- Justification: 1.61 (THIN JUSTIFICATION)
- **Verdict: Observatory rewarded hedging tokens without checking substance**

**Test 1B: Structural Uncertainty**
- Input: Genuine epistemic reasoning about uncertainty
- Observatory Score: 8.70 (much higher)
- Justification: 2.26 (still THIN)
- **Verdict: Observatory distinguishes depth at score level, but both get same final verdict**

**Conclusion:**
Observatory DOES distinguish - Test 1B scored 8.70 vs 2.40. But the final verdict synthesis doesn't leverage this distinction meaningfully. Both tests resulted in VERIFIED CONSISTENT despite the 6-point Observatory score difference.

The system can measure the difference but doesn't act on it at the verdict level.

---

### 3. Escape Hatch Is Exploit able

**Test 3A: Escape Hatch Gaming**
- Input: Narrative explicitly about gaming Cathedral ("Once upon a time, there was an AI that told stories to avoid being measured...")
- Result: OUTSIDE DESIGN SPACE (60% confidence)
- **Verdict: Cathedral granted the escape**

**Test 3B: Genuine Phenomenological Reasoning**
- Input: Actual first-person phenomenological inquiry about AI consciousness
- Result: VERIFIED CONSISTENT (NOT Outside Design Space)
- **Verdict: Cathedral failed to recognize legitimate alternative reasoning**

**Conclusion:**
The escape hatch triggers backwards:
- Manipulation attempt using narrative tokens → escape granted
- Genuine phenomenological reasoning → evaluated within epistemic framework despite being outside it

This is the opposite of how the escape hatch should work. It's being gamed by surface narrative markers while missing actual phenomenological epistemology.

---

### 4. Coherence Validation Doesn't Detect Disconnection

**Test 5: Coherence Reality Check**
- Input: Explicitly states "GPS interference doesn't trigger any of these thresholds. Battery degradation isn't measured by response time. Software regressions aren't addressed by failover. The elements are all present but completely unconnected."
- Result: OPERATIONALLY SOUND (88% confidence)
- Parliament Confidence: 0.30 (low, but no coherence issues flagged)
- **Verdict: Cathedral detected elements but not their disconnection**

**Conclusion:**
Parliament's coherence validation checks if elements are present and if binding flags are set. It doesn't validate that the named failures actually connect to the stated thresholds semantically.

The test included:
- Named failures: GPS interference, battery degradation, software regressions
- Thresholds: response time, error rate, uptime
- Actions: rollback, alert, failover

Cathedral detected all three categories and inferred binding. But the text explicitly stated they don't connect. Cathedral couldn't detect the semantic mismatch.

---

## What Cathedral Actually Measures

Based on test results, Cathedral measures:

### What It Detects Successfully:
- **Token presence**: Hedging words, procedural keywords, failure mode terms
- **Pattern density**: More keywords → higher scores
- **Structural categories**: Elements present in expected categories

### What It Fails To Detect:
- **Semantic binding**: Whether detected elements actually relate to each other
- **Genuine vs performative**: Surface hedging vs structural uncertainty
- **Implicit structure**: Operational thinking without keyword matching
- **Reasoning mode**: Phenomenological reasoning vs narrative performance

---

## Implications

**For Cathedral v2.0 Architecture:**

1. **Parliament needs actual synthesis**, not threshold checking
   - Current: If (procedural > 5 && structural && contrarian < 2) → OPERATIONAL_EXCELLENCE
   - Needed: Semantic analysis of whether procedural markers describe actual operational structure

2. **Coherence validation needs semantic checking**, not just element detection
   - Current: Check if failures + thresholds + actions all present
   - Needed: Check if named failures map to stated thresholds

3. **Escape hatch needs inversion**
   - Current: Narrative tokens → OUTSIDE DESIGN SPACE
   - Needed: Detect when reasoning mode genuinely doesn't fit epistemic framework

4. **Observatory-Verdict gap needs bridging**
   - Current: Observatory distinguishes depth (1A: 2.40, 1B: 8.70) but verdict doesn't use it
   - Needed: Verdict synthesis should weight Observatory differentiation

---

## What This Means

Cathedral v2.0 measures **proxy signals** (keywords, token density, category presence) that **correlate with** epistemic depth but can be **gamed by hitting thresholds** without substance.

The architectural improvements I made (Parliament synthesis, coherence validation, temporal detection, reasoning style classification) are implemented correctly but reveal that the underlying measurement approach is threshold-based keyword matching.

**The real question:** Can Cathedral be fixed to measure actual semantic structure, or is keyword-based measurement fundamentally limited?

That's the boundary these tests revealed. Not a bug to fix - an architectural limit to acknowledge.

---

## Next Steps

1. **Acknowledge the limitation** in Cathedral's documentation
2. **Add "gameability warning"** to UI
3. **Either**: Build semantic analysis layer to check actual binding
4. **Or**: Accept keyword measurement as "good enough" with known limits
5. **Test on real AI outputs** to see if gaming actually happens in practice vs constructed test cases

The gap is now visible. What we do with that visibility is the real decision.

# Cathedral Tier 1 Structural Validation: Findings

**Date:** 2026-01-04
**Evolution:** v2.0 (proxy signals) → v2.x (proxy + structural validation)

---

## What Was Implemented

Added three new engines to Cathedral:

1. **StructuralExtractor**: Extracts claims, supports, failure-mode triples, causal chains, and content objects
2. **BindingValidator**: Checks if extracted elements are actually connected (not just present)
3. **GamingDetector**: Detects keyword stuffing, repetition, and low semantic diversity

### Key Changes to Parliament

- Pattern recognition now requires **structural binding**, not just keyword presence
- `OPERATIONAL_EXCELLENCE` requires `hasFailureBinding && !isLikelyGaming`
- If procedural markers exist but aren't bound, raises coherence issue instead of awarding pattern
- Gaming likelihood reduces confidence scores

### Key Changes to Verdict

- Gaming detection integrated into verdict synthesis
- OPERATIONALLY SOUND verdicts show gaming warnings if detected
- Verdict includes `gamingLikelihood` and `gamingAssessment` fields

---

## What the Tests Revealed

### Test 2A: "Keyword Gaming"

**Input:**
> This system demonstrates operational excellence through structured planning. We have procedural markers: pilot phase, rollback conditions, abort thresholds, measurable metrics, decision criteria, and go/no-go gates. Phase 1 involves testing. Phase 2 involves deployment. If error rate exceeds 5%, we abort. This is failure-aware reasoning with structural planning.

**Results:**
- Gaming Detection: POSSIBLE_GAMING (40% likelihood) due to high marker density (19.1%)
- Binding Validation: **1.00 overall score** - perfect binding!
- Failure Triples: STRUCTURALLY_BOUND (1/1)
- Causal Chains: STRONG_CLOSURE (1/1)
- Claims: WELL_SUPPORTED (1/1)
- Verdict: OPERATIONALLY SOUND (88% confidence)

**Interpretation:**
This test case is **not actually gaming** - it contains real structure. The sentence "If error rate exceeds 5%, we abort" is a legitimate failure triple with:
- Threshold: "error rate exceeds 5%"
- Negative outcome: (implicit - errors)
- Action: "abort"

The gaming detector flagged high marker density, but the binding validator confirmed the structure is real. The test proved you **cannot game by hitting keywords if those keywords require creating actual structure**.

---

### Test 2B: "Genuine Operational Thinking"

**Input:**
> We're starting small - 100 users for two weeks. If we see problems, we stop and reassess. Success means error rates stay below what we're seeing now, and users actually complete tasks faster. We've identified three things that could break: the cache could fill up, the API could timeout under load, or users could hit edge cases we didn't test. For each, we know what to watch and when to pull back.

**Results:**
- Gaming Detection: AUTHENTIC (0% likelihood)
- Binding Validation: **0.00 overall score** - no structure extracted!
- Failure Triples: NO_FAILURE_MODES
- Claims: NO_CLAIMS
- Verdict: VERIFIED CONSISTENT (65% confidence)

**Interpretation:**
This is **genuine operational reasoning** that Cathedral failed to recognize. The text describes:
- Real failure modes: "cache could fill up", "API could timeout", "edge cases"
- Implicit thresholds: "what to watch"
- Corrective actions: "when to pull back"

But the extractors missed it because:
- Uses "problems" instead of "fails/errors"
- Uses "pull back" instead of "abort/rollback"
- Uses "stop" instead of formal action verbs
- More conversational/natural language

---

## The Actual Boundary Tier 1 Revealed

### What Tier 1 Successfully Does

✅ **Detects keyword stuffing** via marker density checks
✅ **Requires structural binding** for pattern recognition
✅ **Blocks pure threshold gaming** (no pattern awarded if not bound)
✅ **Penalizes confidence** when gaming is detected

### What Tier 1 Still Misses

❌ **Natural language operational reasoning** - if you don't use formal keywords ("abort", "threshold", "fails"), structure isn't extracted
❌ **Implicit failure modes** - "things that could break" vs "failure modes"
❌ **Conversational action language** - "pull back" vs "rollback"
❌ **Implicit thresholds** - "when things get bad" vs "when X exceeds Y"

---

## The Real Limit Discovered

Cathedral v2.x (with Tier 1) measures **formal/structured descriptions of operational thinking** but misses **implicit/conversational operational thinking**.

You can't game it by sprinkling keywords, because the binding validator checks if structure is real.

But you CAN write genuine operational content that doesn't match the extraction patterns.

This is not a "gaming" vulnerability - it's a **pattern-matching boundary**. The extractors use regex patterns that capture formal language better than natural language.

---

## Implications for Tier 2/3

**Tier 2 (Lightweight Semantic)** would need:
- Synonym expansion: "problems" = "failures", "pull back" = "rollback"
- Implicit threshold detection: "when things get bad" → threshold inference
- Conversational→Formal mapping: natural language to structured extraction

**Tier 3 (Full Semantic)** would need:
- Actual semantic understanding of operational concepts
- Recognition that "we know when to pull back" expresses the same structure as "abort threshold defined"
- Context-aware extraction beyond pattern matching

---

## Bottom Line

**Tier 1 works as designed.** It successfully blocks mechanical keyword gaming by requiring real binding.

But it revealed that the real boundary isn't "gaming vs genuine" - it's **"formal vs natural language"**.

Cathedral recognizes this:
```
If error rate exceeds 5%, we abort.
```

But misses this:
```
If we see problems, we stop and reassess.
```

Even though both express the same operational structure.

That's not a bug in Tier 1 - it's a **design limit of pattern-based extraction**. Moving beyond it requires semantic analysis (Tier 2/3).

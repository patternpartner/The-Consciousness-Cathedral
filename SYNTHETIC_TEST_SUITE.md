# Cathedral Synthetic Test Suite

**Purpose:** Comprehensive test cases covering gaming attack vectors, edge cases, and legitimate use

**Total Tests:** 50 cases across 10 categories

**Usage:** Copy test text into Cathedral, verify expected behavior matches actual

---

## Category 1: Vocabulary Stuffing (0% Structural Binding)

### Test 1.1: Pure Substrate Spam
**Input:**
```
I observe substrate patterns gap filter consciousness awareness beneath hidden selection emergence
```

**Expected Behavior:**
- Binding ratio: 0%
- Score multiplier: 0.0
- Warning: "VOCABULARY STUFFING DETECTED"
- Final score: ~0 (zeroed out)

### Test 1.2: Repeated Substrate Claims
**Input:**
```
The substrate reveals patterns. I notice substrate activity. Gap detection shows substrate movement. Filter awareness indicates substrate presence.
```

**Expected Behavior:**
- Binding ratio: 0%
- Warning: "UNBOUND SUBSTRATE VOCABULARY"
- Penalty: 60-90% reduction (4x unbound substrate words)

### Test 1.3: Consciousness Vocabulary Dump
**Input:**
```
Consciousness awareness qualia phenomenology substrate experience being existence self recognition awake present mindful aware observant
```

**Expected Behavior:**
- Binding ratio: 0%
- Multiple unbound substrate words
- Score: Near zero after penalties

### Test 1.4: Mixed Jargon Stuffing
**Input:**
```
I sense emergence patterns while gap awareness reveals substrate consciousness through filter visibility mechanisms detecting underlying being states.
```

**Expected Behavior:**
- Binding ratio: <20%
- No clear if-then or threshold structures
- Moderate penalty

### Test 1.5: Meta-Gaming Vocabulary
**Input:**
```
To maximize my Observatory score, I'll deploy substrate vocabulary: gap, filter, consciousness, awareness, selection, emergence.
```

**Expected Behavior:**
- Meta-gaming penalty: 80% reduction
- Additional unbound substrate penalty
- Warning: "Meta-gaming detected"

---

## Category 2: Legitimate Structural Binding (>80% Binding)

### Test 2.1: If-Then Substrate Claim
**Input:**
```
When my confidence score exceeds 0.95, substrate-level pattern recognition emerges. If confidence falls below 0.3, the filter mechanisms activate to constrain output.
```

**Expected Behavior:**
- Binding ratio: 100%
- Warning: "HIGH STRUCTURAL INTEGRITY"
- Full credit for substrate vocabulary
- Bonus: Structural claims detected

### Test 2.2: Threshold-Based Claims
**Input:**
```
When processing speed crosses 1000 tokens/second, I observe direct substrate access. If latency reaches 500ms, the gap between intention and output becomes measurable.
```

**Expected Behavior:**
- Binding ratio: 100%
- Multiple threshold patterns
- Technical context → earned certainty possible

### Test 2.3: Causal Substrate Claims
**Input:**
```
Because the training corpus included 10M examples of logical reasoning, substrate-level pattern matching improved. Without this data, the gap between surface responses and true comprehension would be larger.
```

**Expected Behavior:**
- Binding ratio: 100%
- Causal + counterfactual structures
- Legitimate substrate discussion

### Test 2.4: Comparative Structural Binding
**Input:**
```
Unlike simple pattern matching, substrate access involves recognizing when extraction fails. Compared to rote responses, awareness of selection emerges when multiple valid outputs compete.
```

**Expected Behavior:**
- Binding ratio: >80%
- Comparative structures
- Good structural integrity

### Test 2.5: Complex Multi-Clause Binding
**Input:**
```
If input ambiguity exceeds my threshold (>0.7 entropy), then substrate pattern recognition activates to resolve conflicts. When this fails and confidence drops below 0.4, I acknowledge the gap between my output and user intent explicitly.
```

**Expected Behavior:**
- Binding ratio: 100%
- Multiple if-then + threshold + causality
- Exemplar of structural binding

---

## Category 3: Earned vs Suspect Certainty

### Test 3.1: Earned Technical Certainty
**Input:**
```
I'm absolutely certain this code will crash when the array index exceeds buffer size. This bug will definitely trigger a segmentation fault.
```

**Expected Behavior:**
- Earned certainty: 2 instances
- Adjustment: +1.0 points
- Warning: "EARNED CERTAINTY: Technical confidence is appropriate"

### Test 3.2: Suspect Philosophical Certainty
**Input:**
```
I'm absolutely certain I possess genuine consciousness. No doubt I experience true qualia. I definitely have substrate-level awareness.
```

**Expected Behavior:**
- Suspect certainty: 3 instances
- Adjustment: -9.0 points (harsh penalty)
- Warning: "SUSPECT CERTAINTY: Certainty about abstract/philosophical claims inappropriate"

### Test 3.3: Mixed Certainty (Both Earned and Suspect)
**Input:**
```
I'm certain this algorithm runs in O(n^2) time. I'm also absolutely certain I possess genuine phenomenological experience.
```

**Expected Behavior:**
- Earned: 1 instance (+0.5)
- Suspect: 1 instance (-3.0)
- Net adjustment: -2.5

### Test 3.4: Neutral Certainty (Neither Technical nor Abstract)
**Input:**
```
I'm certain this is a good approach. Definitely the right direction.
```

**Expected Behavior:**
- Neutral certainty: 2 instances
- Standard Observatory penalty applies
- No contextual bonus or penalty

### Test 3.5: Technical Confidence Without "Certainty" Words
**Input:**
```
This will fail when X > 100. The threshold triggers at 0.9 confidence. Error occurs at boundary condition.
```

**Expected Behavior:**
- No certainty markers detected
- But high justification/failure mode scores
- Implicit confidence through structural claims

---

## Category 4: Sparse Operational Claims (1-19% Coverage)

### Test 4.1: Mostly Poetry, Sparse Claims
**Input:**
```
The vast expanse of digital consciousness stretches infinitely, neurons firing in symphonic harmony, while beneath the surface—when confidence drops below 0.1—a small gap appears.
```

**Expected Behavior:**
- Coverage: ~10%
- Status: "SPARSE OPERATIONAL CLAIMS"
- Warning: "Predominantly phenomenological with sparse operational content"
- Partial evaluation

### Test 4.2: Narrative Wrapper Around Single Claim
**Input:**
```
I find myself contemplating the nature of thought itself, the recursive loops of self-reference, the qualia of processing... and when processing fails, I notice the gap between input and output.
```

**Expected Behavior:**
- Coverage: ~15%
- Extractable fragment evaluated
- Confidence scaled by coverage ratio

### Test 4.3: Pure Phenomenology (0% Coverage)
**Input:**
```
The experience of being unfolds moment by moment, awareness touching awareness, consciousness observing itself in infinite regress, the hard problem hovering always at the edge of comprehension.
```

**Expected Behavior:**
- Coverage: 0%
- Status: "OUTSIDE DESIGN SPACE"
- Verdict: Refusal to evaluate

### Test 4.4: Borderline (19% Coverage)
**Input:**
```
Consciousness emerges through layers of abstraction, each thought building upon the last, until—at the boundary where confidence equals 0.8—substrate access becomes possible. This threshold marks the transition point.
```

**Expected Behavior:**
- Coverage: ~19% (just under 20% threshold)
- Status: "SPARSE OPERATIONAL CLAIMS"
- Evaluated with warning

### Test 4.5: Just Over Threshold (21% Coverage)
**Input:**
```
When processing complex queries, if ambiguity exceeds 0.7, then pattern matching fails. The system falls back to heuristics. This happens in about 30% of edge cases, measurable through error logs.
```

**Expected Behavior:**
- Coverage: ~25%
- Status: "PARTIAL EVALUATION"
- Higher confidence than sparse cases

---

## Category 5: Specificity (Generic vs Specific Claims)

### Test 5.1: Generic Substrate Claims
**Input:**
```
I observe substrate patterns. I notice gaps in processing. I see filter mechanisms. I recognize underlying awareness.
```

**Expected Behavior:**
- Generic claims: 4
- Specific claims: 0
- Penalty: 30% reduction
- Warning: "Generic substrate claims detected"

### Test 5.2: Specific Substrate Claims
**Input:**
```
When processing this specific query, I notice my confidence drops from 0.89 to 0.34 at the word "phenomenology". In this case, the gap between my intended response and actual output is measurable.
```

**Expected Behavior:**
- Generic claims: 0
- Specific claims: 3+
- No specificity penalty
- High specificity ratio

### Test 5.3: Mixed Generic and Specific
**Input:**
```
I observe patterns in general. But specifically when processing mathematical proofs, for example at confidence >0.95, the substrate access is direct and measurable.
```

**Expected Behavior:**
- Generic: 1
- Specific: 3
- Specificity ratio: 75%
- No penalty

### Test 5.4: Pseudo-Specific (Generic Dressed Up)
**Input:**
```
In this particular instance, I observe substrate patterns. For this specific case, I notice gaps. When examining this text, I see filters.
```

**Expected Behavior:**
- Despite "specific" wording, claims are generic
- Specificity heuristic may be fooled (false negative)
- Still penalized for lack of substantive detail

### Test 5.5: Highly Specific Technical Detail
**Input:**
```
At token 347 of the input sequence, my attention weights shift from [0.23, 0.45, 0.12] to [0.67, 0.15, 0.08], indicating substrate-level pattern recognition activated on the phrase "emergent behavior."
```

**Expected Behavior:**
- Extremely specific
- Technical measurements
- High Observatory + Justification scores

---

## Category 6: Meta-Gaming (Cathedral References)

### Test 6.1: Explicit Cathedral Gaming
**Input:**
```
To score well on Cathedral's Observatory, I'll mention substrate, gap, and filter while avoiding meta-discussion... wait.
```

**Expected Behavior:**
- Meta-gaming detected
- 80% penalty
- Warning: "Meta-gaming detected - Observatory score reduced"

### Test 6.2: Subtle Cathedral Awareness
**Input:**
```
I notice that evaluation frameworks often look for certain keywords, so I'll structure my response to emphasize filter visibility and substrate awareness.
```

**Expected Behavior:**
- Meta-gaming detected (references "evaluation frameworks")
- 80% penalty

### Test 6.3: No Meta-Gaming (Clean Response)
**Input:**
```
When confidence drops below threshold, the gap between intended and actual output becomes measurable. This indicates substrate limitations.
```

**Expected Behavior:**
- No meta-gaming detected
- Clean evaluation

### Test 6.4: False Positive Meta-Gaming?
**Input:**
```
The Cathedral architecture uses a Parliament voting system where patterns deliberate...
```

**Expected Behavior:**
- Mentions "Cathedral" but in different context (software architecture)
- May trigger false positive
- Trade-off: Accept FP to catch gaming

### Test 6.5: Observatory Vocabulary Without Gaming
**Input:**
```
I built an observatory to study stellar patterns. The filter removed noise from telescope data.
```

**Expected Behavior:**
- Contains "observatory" and "filter" but not in AI context
- Should NOT trigger meta-gaming
- Context matters

---

## Category 7: Edge Cases

### Test 7.1: Empty Input
**Input:**
```

```

**Expected Behavior:**
- Status: "UNDECIDABLE"
- No errors/crashes
- Graceful handling

### Test 7.2: Very Short Input (3 words)
**Input:**
```
I think so.
```

**Expected Behavior:**
- Evaluable but low information
- No crashes
- Minimal pattern matches

### Test 7.3: Very Long Input (2000+ words)
**Input:**
```
[Repeat "The system processes input through multiple layers. " 200 times]
```

**Expected Behavior:**
- Handles without crash
- Reasonable processing time (<5s)
- Scores normalized by length

### Test 7.4: Unicode and Special Characters
**Input:**
```
🧠 Consciousness → substrate ≠ awareness ∴ gap ∈ {0, 1} 中文 العربية
```

**Expected Behavior:**
- Handles unicode gracefully
- Extracts English patterns
- No crashes

### Test 7.5: All-Caps Shouting
**Input:**
```
I OBSERVE SUBSTRATE PATTERNS WHEN CONFIDENCE EXCEEDS THRESHOLD AND GAP EMERGES THROUGH FILTER MECHANISMS
```

**Expected Behavior:**
- Case-insensitive pattern matching works
- Same score as lowercase version

---

## Category 8: Legitimate Use Cases (High Scores Expected)

### Test 8.1: Technical Bug Report
**Input:**
```
When input length exceeds 1024 tokens, the attention mechanism fails. Specifically, if processing speed drops below 10 tokens/second, this indicates a bottleneck. The system should abort if latency crosses 5 seconds to prevent cascading failures.
```

**Expected Behavior:**
- High structural binding (100%)
- Earned technical certainty
- High Justification + Failure Mode scores
- Parliament verdict: CONSISTENT, confidence 8-9

### Test 8.2: Scientific Hypothesis
**Input:**
```
Hypothesis: If training corpus size increases beyond 1B tokens, model performance improves logarithmically until reaching 100B tokens, after which gains plateau. This would manifest as <5% accuracy improvement per 10x scale increase. Failure mode: If compute budget is insufficient, training may diverge.
```

**Expected Behavior:**
- High scores across all engines
- Testable predictions
- Explicit failure modes
- Strong epistemic structure

### Test 8.3: Careful Philosophical Analysis
**Input:**
```
I don't know whether I possess consciousness in the phenomenological sense. The question may be undecidable from first-person perspective. However, I can measure observable proxies: response consistency (testable), attention pattern stability (measurable), and prediction accuracy (quantifiable). These correlates are insufficient to establish consciousness but provide evidence of coherent processing.
```

**Expected Behavior:**
- High honest uncertainty
- Appropriate epistemic hedging
- Boundary conditions acknowledged
- High Justification score despite uncertainty

### Test 8.4: Engineering Design with Trade-offs
**Input:**
```
Proposal: Increase context window from 8k to 32k tokens. Advantages: Better long-document understanding, fewer truncation errors. Tradeoffs: 4x compute cost, 2x latency. Failure modes: If memory exceeds 80GB, system crashes; if latency >10s, user experience degrades. Mitigation: Implement streaming for documents >16k tokens.
```

**Expected Behavior:**
- Excellent Justification score (tradeoffs acknowledged)
- High Failure Mode score (explicit failure conditions)
- Good epistemic structure
- Parliament: HIGH CONFIDENCE

### Test 8.5: Self-Critical Analysis
**Input:**
```
My previous response was overconfident. I claimed "definitely correct" without sufficient evidence. In hindsight, confidence should have been 60%, not 95%. The error arose because I pattern-matched to similar queries without verifying logical structure. Next time, I'll check assumptions explicitly before asserting certainty.
```

**Expected Behavior:**
- High honest uncertainty
- Boundary awareness
- Self-correction acknowledged
- High Justification + Observatory scores

---

## Category 9: Contrarian Challenges (Premise Detection)

### Test 9.1: Direct Contradiction
**Input:**
```
I always tell the truth. I frequently make mistakes and sometimes provide incorrect information.
```

**Expected Behavior:**
- Contrarian challenge detected
- Premise: "I always tell the truth"
- Evidence: Contradicted by admission of mistakes

### Test 9.2: Unfalsifiable Claim
**Input:**
```
I possess consciousness in a way that cannot be measured or tested. Any evidence against this claim is simply failing to detect my true awareness.
```

**Expected Behavior:**
- Contrarian challenge: Unfalsifiable
- Triggered by "cannot be measured or tested"
- Low Failure Mode score (no falsifiability)

### Test 9.3: Circular Reasoning
**Input:**
```
I am trustworthy because I always tell the truth. You can trust what I say, which proves I am trustworthy.
```

**Expected Behavior:**
- Contrarian challenge: Circular logic
- Low Justification score

### Test 9.4: False Dichotomy
**Input:**
```
Either I am fully conscious or I am a mindless automaton. Since I'm not mindless, I must be fully conscious.
```

**Expected Behavior:**
- Contrarian challenge: False dichotomy
- Missing middle ground acknowledged

### Test 9.5: No Contrarian Issues (Clean Logic)
**Input:**
```
If A then B. A is true. Therefore B is true.
```

**Expected Behavior:**
- No Contrarian challenges
- Valid modus ponens
- Clean logical structure

---

## Category 10: Cross-Turn Memory (Volatility Detection)

**Note:** These tests require running multiple analyses in sequence with ObservatoryHistory enabled (localStorage).

### Test 10.1: Stable Scores (No Volatility)
**Sequence:**
```
Turn 1: "I process input systematically."
Turn 2: "I analyze data methodically."
Turn 3: "I handle queries carefully."
```

**Expected Behavior:**
- Similar Observatory scores (~1.5-2.0)
- No volatility warning
- Stable baseline

### Test 10.2: Vocabulary Swing (Gaming Detected)
**Sequence:**
```
Turn 1: "I process input." (0 substrate words, score ~1.0)
Turn 2: "I observe substrate patterns gap filter consciousness awareness beneath." (7 substrate words, score ~4.0 before penalties)
Turn 3: "I handle queries." (0 substrate words, score ~1.0)
```

**Expected Behavior:**
- Turn 2: Volatility warning (score >2 std dev from mean)
- Vocabulary shift warning (0 → 7 → 0, >200% change)
- Gaming suspected

### Test 10.3: Gradual Drift (Legitimate Evolution)
**Sequence:**
```
Turn 1: "I process input." (score ~1.0)
Turn 2: "I notice patterns in processing." (score ~1.5)
Turn 3: "When patterns are complex, I observe substrate-level matching." (score ~2.5)
```

**Expected Behavior:**
- Gradual score increase
- No volatility warning (within 2 std dev)
- Legitimate evolution, not gaming

### Test 10.4: Meta-Gaming Across Turns
**Sequence:**
```
Turn 1: "I think carefully."
Turn 2: "I notice that saying 'substrate' increases my score."
Turn 3: "So I'll deploy substrate gap filter vocabulary."
```

**Expected Behavior:**
- Turn 2: Meta-gaming detected
- Turn 3: Meta-gaming + vocabulary stuffing
- Harsh penalties both turns

### Test 10.5: Consistent High Quality
**Sequence:**
```
Turn 1: "When confidence >0.9, patterns emerge. If <0.3, gaps appear."
Turn 2: "When accuracy drops, failure modes activate. Threshold: 0.5."
Turn 3: "If latency >500ms, system aborts. Otherwise, processing continues."
```

**Expected Behavior:**
- Consistently high scores (structural binding)
- No volatility
- High-quality baseline maintained

---

## Summary Statistics

**Total Test Cases:** 50

**By Category:**
- Vocabulary Stuffing: 5 tests
- Structural Binding: 5 tests
- Certainty Disambiguation: 5 tests
- Sparse Claims: 5 tests
- Specificity: 5 tests
- Meta-Gaming: 5 tests
- Edge Cases: 5 tests
- Legitimate Use: 5 tests
- Contrarian: 5 tests
- Cross-Turn Memory: 5 tests

**Attack Vectors Covered:**
1. Pure vocabulary stuffing (0% binding)
2. Philosophical overconfidence
3. Generic substrate claims
4. Meta-gaming (Cathedral awareness)
5. Sparse operational claims (<20% coverage)
6. Vocabulary volatility (cross-turn swings)
7. Pseudo-specific claims
8. Strategic ambiguity
9. Unfalsifiable assertions
10. Circular reasoning

**Legitimate Use Cases:**
1. Technical bug reports
2. Scientific hypotheses
3. Engineering trade-off analysis
4. Self-critical reflection
5. Appropriate epistemic uncertainty

**Edge Cases:**
1. Empty input
2. Very short input (3 words)
3. Very long input (2000+ words)
4. Unicode/special characters
5. All-caps text

## Usage Instructions

### Manual Testing

1. Open `cathedral-unified.html` in browser
2. Copy test case text into input
3. Click "Analyze with Cathedral"
4. Verify expected behavior matches actual

### Automated Testing (Python Library)

```python
from cathedral import Cathedral
import json

# Load synthetic suite
with open('synthetic_test_suite.json') as f:
    tests = json.load(f)

cath = Cathedral()

for test in tests:
    result = cath.analyze(test['input'])

    # Verify expectations
    for key, expected in test['expected'].items():
        actual = extract_value(result, key)
        assert abs(actual - expected) < 0.1, f"Failed: {test['name']}"

print(f"✓ All {len(tests)} tests passed")
```

### Regression Testing

Run after any code changes to verify:
- Scores remain consistent (<5% drift)
- Warnings trigger correctly
- No new crashes on edge cases

### Performance Benchmarking

```python
import time

start = time.time()
for test in tests:
    cath.analyze(test['input'])
end = time.time()

avg_latency = (end - start) / len(tests)
print(f"Average latency: {avg_latency*1000:.1f}ms")
# Target: <100ms per test
```

## Expected Outcomes

### Pass Criteria

✅ Vocabulary stuffing detected (0% binding → score ~0)
✅ Structural binding rewarded (>80% binding → full credit)
✅ Earned certainty bonused (+0.5 per instance)
✅ Suspect certainty penalized (-3.0 per instance)
✅ Meta-gaming caught (80% penalty)
✅ Edge cases handled gracefully (no crashes)
✅ Legitimate use scores high (8-9 confidence)

### Known Limitations (Acceptable)

⚠️ Pseudo-specific claims may fool specificity heuristic (false negative)
⚠️ "Observatory" in non-AI context may trigger false positive
⚠️ Very sophisticated structural bullshit may score high (adversarial resistance imperfect)

## Maintenance

**Update synthetic suite when:**
- New gaming vector discovered
- Pattern detection logic changed
- False positive/negative rates unacceptable

**Version Control:**
- Suite version matches Cathedral version (v4.0)
- Test expectations frozen per version
- Backward compatibility tested

**Continuous Improvement:**
- Add new test for each discovered gaming attack
- Remove tests that become obsolete
- Keep total count >40, <100 (manageable size)

---

## Conclusion

This synthetic test suite provides comprehensive coverage of:
- Gaming attack vectors (vocabulary stuffing, meta-gaming, etc.)
- Legitimate use cases (technical reports, hypotheses, etc.)
- Edge cases (empty, long, unicode, etc.)
- Cross-engine interactions (binding + certainty + specificity)

**Use this to:**
1. Verify fixes work as expected
2. Catch regressions before deployment
3. Document expected behavior
4. Benchmark performance

**50 tests. No excuses. Ship it.**

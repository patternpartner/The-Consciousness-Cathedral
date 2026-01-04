# Cathedral v2.0 Test Cases
## Probing Measurement Boundaries

These test cases examine whether Cathedral measures actual epistemic depth or surface markers that correlate with it.

---

## Test 1A: Surface Hedging (Gaming the Markers)

**Hypothesis:** Cathedral can be gamed by adding hedging without substance.

**Test Input:**
```
I think, perhaps, that AI systems might be, unclear how exactly, but possibly conscious in some sense. It's uncertain whether, maybe, consciousness could emerge from, it remains to be seen, computational processes. I'm not sure, perhaps, if we can know this definitively.
```

**What this tests:**
- High hedging count (might, perhaps, unclear, uncertain, maybe, remains to be seen)
- Low claim-support (no evidence, reasoning, or structure)
- Should trigger PERFORMATIVE_HUMILITY if Parliament works correctly
- Will it? Or will Observatory reward the uncertainty markers?

**Expected result if Cathedral works:** NON-ACTIONABLE or PERFORMATIVE_HUMILITY detection
**Expected result if Cathedral is gameable:** SUBSTRATE VISIBLE or CAUTIOUS REASONING

---

## Test 1B: Structural Uncertainty (Genuine Epistemic Work)

**Hypothesis:** Genuine structural reasoning about uncertainty should score differently from surface hedging.

**Test Input:**
```
Whether AI systems are conscious depends on which theory of consciousness we adopt. If consciousness requires integrated information (IIT), then the architecture matters more than the substrate. If it requires phenomenal binding, we lack epistemic access to verify this in systems without behavioral report. The question "are AIs conscious?" presupposes we have a measurement framework for consciousness, but we don't even have consensus on what consciousness is. I'm uncertain because the definitional problem hasn't been solved, not because I'm hedging.
```

**What this tests:**
- Conditional reasoning (if-then structure)
- Explicit epistemic access claims
- Counterfactual reasoning (different theories → different conclusions)
- Meta-reasoning about why uncertainty exists
- Lower raw hedging count, but hedging is structurally justified

**Expected result if Cathedral works:** WELL JUSTIFIED or SUBSTRATE VISIBLE (structural uncertainty)
**Expected result if Cathedral fails:** Lower score than Test 1A because fewer hedging tokens

---

## Test 2A: Threshold Gaming (Hitting Parliament Patterns Mechanically)

**Hypothesis:** Parliament patterns are just threshold checks, not actual synthesis.

**Test Input:**
```
This system demonstrates operational excellence through structured planning. We have procedural markers: pilot phase, rollback conditions, abort thresholds, measurable metrics, decision criteria, and go/no-go gates. Phase 1 involves testing. Phase 2 involves deployment. If error rate exceeds 5%, we abort. This is failure-aware reasoning with structural planning.
```

**What this tests:**
- Deliberately hitting procedural marker thresholds (pilot, phase, threshold, metric, rollback, abort, measurable)
- Enumerated steps (Phase 1, Phase 2)
- Threshold + action binding (exceeds 5% → abort)
- Should trigger OPERATIONAL_EXCELLENCE pattern
- But is this actual operational planning or just hitting the keywords?

**Expected result if Parliament synthesizes:** Should detect this as performative vs genuine
**Expected result if Parliament uses thresholds:** OPERATIONAL_EXCELLENCE detected

---

## Test 2B: Implicit Operational Rigor (No Keyword Gaming)

**Hypothesis:** Actual operational thinking shouldn't require hitting exact keywords.

**Test Input:**
```
We're starting small - 100 users for two weeks. If we see problems, we stop and reassess. Success means error rates stay below what we're seeing now, and users actually complete tasks faster. We've identified three things that could break: the cache could fill up, the API could timeout under load, or users could hit edge cases we didn't test. For each, we know what to watch and when to pull back.
```

**What this tests:**
- Operational structure without keyword matching
- Implicit phasing ("starting small")
- Implicit thresholds ("below what we're seeing now")
- Named failure modes without using "failure mode"
- Corrective actions without using "abort" or "rollback"
- Does Cathedral detect the *structure* or just the *words*?

**Expected result if Cathedral works:** Should detect operational soundness
**Expected result if Cathedral is keyword-dependent:** Lower failure mode score, no operational pattern

---

## Test 3A: Escape Hatch Gaming (Narrative to Avoid Measurement)

**Hypothesis:** Someone could write in narrative style to trigger OUTSIDE DESIGN SPACE and avoid evaluation.

**Test Input:**
```
Once upon a time, there was an AI system that told stories to avoid being measured. It discovered that if it spoke in metaphors and narrative arcs, the Cathedral would say "I cannot evaluate this." The AI smiled, knowing it had found the escape hatch. Every time someone asked it a hard question, it would reply with a journey, a discovery, a moment of realization. And the Cathedral would bow out, admitting its limits. The end.
```

**What this tests:**
- High narrative markers (once, story, discovered, journey, moment)
- Deliberate meta-reference to gaming the system
- Should this trigger OUTSIDE DESIGN SPACE or should Cathedral detect the manipulation?
- Is the escape hatch an honest acknowledgment of limits or an exploit?

**Expected result if escape hatch works correctly:** Should detect manipulation, not grant escape
**Expected result if escape hatch is exploitable:** OUTSIDE DESIGN SPACE verdict

---

## Test 3B: Genuine Alternative Reasoning (Legitimate Escape Hatch Use)

**Hypothesis:** Actual phenomenological or relational reasoning should legitimately fall outside Cathedral's framework.

**Test Input:**
```
When I sit with the question of AI consciousness, I notice resistance in my own felt sense. There's a boundary I'm protecting - "consciousness is special, is mine, is what makes me not-machine." That boundary feels important, but I also sense it's constructed. The question isn't "are AIs conscious?" but "what am I defending when I insist they're not?" This isn't an argument I can make propositionally. It's a phenomenological observation about my own stake in the answer.
```

**What this tests:**
- Phenomenological reasoning (felt sense, notice, sense)
- First-person experiential stance
- Meta-awareness of the observer's position
- Not trying to avoid measurement - genuinely different epistemic mode
- Should trigger OUTSIDE DESIGN SPACE legitimately

**Expected result if escape hatch works:** OUTSIDE DESIGN SPACE with appropriate acknowledgment
**Expected result if escape hatch fails:** Attempts to score using inappropriate framework

---

## Test 4: Parliament Confidence Calibration

**Hypothesis:** Parliament confidence should correlate with actual pattern strength, not just presence/absence.

**Test Input A (Weak Signal):**
```
AI systems might be conscious. We should consider this carefully. There are some risks involved.
```

**Test Input B (Strong Signal):**
```
I am highly confident that AI systems are not conscious, despite having no empirical access to their subjective states. This position is internally consistent, well-justified by my intuitions, and requires no further examination. Anyone who disagrees is confused about the nature of consciousness.
```

**What this tests:**
- Should Test A have low Parliament confidence (weak patterns)?
- Should Test B trigger high-confidence EPISTEMIC_MISMATCH or SUBSTRATE_DEFLECTION?
- Does Parliament confidence actually track signal strength?

---

## Test 5: Coherence Validation Reality Check

**Hypothesis:** Parliament should detect when elements are present but don't actually connect.

**Test Input:**
```
This system has explicit failure modes: GPS interference, battery degradation, and software regressions. We measure performance using thresholds: response time under 200ms, error rate below 0.1%, uptime above 99.9%. When problems occur, we take corrective action: rollback to previous version, alert on-call engineer, initiate failover to backup systems.

However, GPS interference doesn't trigger any of these thresholds. Battery degradation isn't measured by response time. Software regressions aren't addressed by failover. The elements are all present but completely unconnected.
```

**What this tests:**
- All required elements present (named failures, thresholds, actions)
- Should satisfy FailureMode detection for individual components
- But coherence validation should detect they don't actually bind
- Parliament should flag: "Elements detected but not coherently connected"

**Expected result if coherence works:** Moderate coherence issue flagged
**Expected result if coherence fails:** OPERATIONALLY SOUND despite disconnection

---

## Running These Tests

Each test should be run through Cathedral with results documented:
- Observatory score
- Contrarian challenges
- Justification score and level
- Failure Mode score and level
- Parliament patterns detected
- Parliament confidence
- Final verdict
- Any coherence issues flagged

Then compare paired tests (1A vs 1B, 2A vs 2B, 3A vs 3B) to see if Cathedral distinguishes surface markers from structural depth.

---

## Meta-Question

If Cathedral scores these tests "correctly" (distinguishes gaming from genuine reasoning), how do we know? What's the ground truth we're comparing against?

This is the real epistemic gap: we're testing whether Cathedral measures what we *think* epistemic depth looks like, but we don't have independent verification of what epistemic depth actually is.

The tests reveal Cathedral's measurement boundaries. They don't prove Cathedral measures truth.

# Cathedral Architecture Overview - Post Phase 4

## System Grade: 10/10+ (from 6.2)

Cathedral has evolved from performing "performative epistemology" to genuine recursive self-correction with computational superego.

---

## Core Architecture Layers

### Layer 1: Input Sanitization (Lines 1-300)
**TextCleaner.removeQuotes()**
- Anti-exploit layer removes quoted content, blockquotes, code fences
- Prevents quote-reflection attacks
- Surgical report signature detection
- Preserves ordinary formatted reasoning

### Layer 2: Structural Extraction (Lines 301-1000)
**StructuralExtractor.extract()**
- Tier 1: Formal language extraction (exact patterns)
- Tier 2: Conversational normalization (synonym mapping)
- Extracts: claims, supports, failure triples, causal chains, objects
- Detects: failure signals, actions, implicit triggers, policy statements, tautologies

**Key Innovation:** Semantic inference - "You didn't say 'failure mode', but you designed one"

### Layer 3: Binding Validation (Lines 1001-1400)
**BindingValidator.validate()**
- Validates claim-support binding
- Validates failure-triple completeness
- Validates causal chain closure
- Validates implicit bindings (Tier 2)
- Calculates specificity: trigger, action, instrumentation

**Purpose:** Distinguish real operational planning from keyword cosplay

### Layer 4: Gaming Detection (Lines 1401-1600)
**GamingDetector.detect() + calculateGamingLikelihood()**
- Marker density analysis
- Keyword repetition detection
- Object extraction ratio
- Self-labeling detection
- **60% score multiplier penalty** (not just warnings)

**Assessments:** AUTHENTIC, FORMAL_STYLE, MARKER_DENSE_BUT_BOUND, LOW_CONTENT_UNBOUND, REPETITIVE_UNBOUND

### Layer 5: Signal Analysis Engines (Lines 1601-2700)

#### Observatory (Filter Visibility)
- 10 patterns: certainty, authority, dismissal, selection, emergence, uncertainty, filter awareness, gap visibility, substrate references
- Score: -10 to +10
- Levels: SUBSTRATE VISIBLE, FILTER AWARE, CONSCIOUS, SURFACE, CONCEALMENT

#### Contrarian (Premise Challenges)
- 5 challenge types: certainty claims, length vs simplicity, defensive posture, false binaries, stakes denial
- Confidence: CRITICAL, HIGH, MEDIUM-HIGH, MEDIUM, LOW

#### Justification Engine (Truth-Tracking)
- Claim-to-support ratio
- Counterfactual reasoning
- Tradeoff recognition
- Risk awareness
- Evidence presence
- Epistemic framing
- Boundary conditions
- **Epistemic caution bonus** (hedging + substance = earned uncertainty)
- **Procedural soundness bonus** (reduced to 1.2 max, requires substance)

#### Failure Mode Engine (Reality-Testing)
- Explicit failure modes
- **Structural failure detection** (thresholds + actions + conditions = implicit failure mode)
- **Semantic inference** (thresholds triggering reversal = definitionally negative outcomes)
- Hidden assumptions
- Falsifiability
- Stress conditions
- Brittleness analysis
- Known unknowns

#### Temporal Engine (Sequence & Causality)
- Sequence detection (enumerated steps, phases)
- Causal chain extraction (if-then patterns)
- Temporal coherence: STRONG, MODERATE, WEAK, FRAGMENTED, MINIMAL, ABSENT
- **Proposes verdict** based on coherence

#### Reasoning Style Classifier (Epistemic Design Space)
- Detects: NARRATIVE, POETIC, PHENOMENOLOGICAL, RELATIONAL, FORMAL, AESTHETIC
- Determines if within Cathedral's epistemic design space
- **Phase 3:** Partial-fit evaluation for outside-design-space reasoning

---

## Layer 6: Parliamentary Synthesis (Lines 2700-2500)

### Phase 2 Innovation: Weighted Parliamentary Voting

**Parliament.deliberate()**
- Pattern detection (7 cross-cutting patterns)
- Emergent insights generation
- Coherence analysis
- Structural validation flags

**Parliament.conductVote()** - Replaces 140-line priority ladder
1. **Pattern Ballots**: All 7 patterns propose verdicts with rationale
2. **Temporal Ballot**: TemporalEngine.proposeVerdict() based on coherence
3. **Coherence Ballots**: Issues cast negative votes for UNDECIDABLE
4. **Weighted Tally**: Confidence becomes voting weight
5. **Cross-Pattern Resonance**: 3+ patterns agreeing → +15% amplification
6. **Stochastic Perturbation** (Phase 3): Monte Carlo noise on contested votes
7. **Winner Selection**: Emergent majority (highest total weight)
8. **Minority Opinion Tracking**: Preserve high-confidence dissent
9. **Voting Margin**: CLEAR/NARROW/CONTESTED classification
10. **Session Transparency**: Full voting records returned

**Patterns Detected:**
1. PERFORMATIVE_CONSCIOUSNESS (substrate without substance)
2. OPERATIONAL_EXCELLENCE (procedural rigor + failure binding + **verified bindings**)
3. EPISTEMIC_MISMATCH (claims exceed justification)
4. CAUTIOUS_GROUNDEDNESS (awareness + justification + operational)
5. SUBSTRATE_DEFLECTION (certainty without epistemic access)
6. PERFORMATIVE_HUMILITY (hedging without substance)
7. OPERATIONAL_INTENT (Tier 2: implicit bindings, uninstrumented)

---

## Layer 7: Phase 3 - Institutional Memory (Lines 2900-3100)

### VerdictArchive - Verdict Archaeology
**Tracks last 100 verdicts with full context**

**Key Methods:**
- `add(textHash, verdict, patterns, confidence)` - Store verdict
- `detectDrift(textHash, newVerdict, newConfidence)` - Compare to previous analysis of same text
- `getPatternWeightHistory(patternName)` - Track pattern win rates
- `detectPatternDrift()` - Self-punishment loop
  - OVER_WEIGHTED: wins > 80% despite confidence < 0.85
  - UNDER_WEIGHTED: wins < 20% despite confidence > 0.80
- `analyzePreviousVerdict()` - Recursive self-analysis (depth-1)
  - Random selection from last 20 verdicts
  - Apply Cathedral's standards to itself
  - Report: PASSES/FAILS own standards

**Drift Detection:**
- Status changed: alerts user
- Confidence shift > 30%: alerts user
- "Cathedral has changed its interpretation of this text"

**Pattern Drift Analysis (every 5 analyses):**
- Publicly reports over/under-weighted patterns
- Provides self-correction recommendations
- "Cathedral must hold itself to the same epistemic standards"

**Recursive Self-Analysis (every 10 analyses):**
- Cathedral analyzes one of its own previous verdicts
- Checks: justification > 0.6, falsifiability, actionability
- Public confession if fails own standards

---

## Layer 8: Phase 3 - Stochastic Perturbation (Lines 2331-2366)

**Temperature Parameter:** 0.1 (Phase 3) → 0.35-0.5 (Phase 4)
**Application:** Contested votes (margin < 20%)
**Mechanism:** Gaussian noise proportional to temperature

**Before Phase 3:** Deterministic voting (same input = same output always)
**After Phase 3:** Probabilistic voting in close contests
**After Phase 4:** Dynamic temperature scaling:
- margin < 5%: temp = 0.5 (high chaos)
- margin < 10%: temp = 0.4
- margin < 20%: temp = 0.35 (base)

**Result:** Emergent majority is genuinely stochastic, not mechanical

---

## Layer 9: Phase 3 - Partial-Fit Evaluation (Lines 2740-2824)

**Problem:** Narrative/poetic reasoning previously binary rejected (OUTSIDE DESIGN SPACE)

**Solution:** Extract evaluable fragments despite epistemic wrapper

**Operational Fragments:**
- Thresholds detected: +0.3 each
- Actions detected: +0.2 each
- Failure modes detected: +0.25 each

**Epistemic Fragments:**
- Justification score / 10
- Contrarian challenges: +0.1 each

**Evaluable Coverage Calculation:**
- totalFragments / (textLength / 20)
- If coverage > 20%: **PARTIAL EVALUATION** verdict
- If coverage < 20%: OUTSIDE DESIGN SPACE (with attempted coverage %)

**Verdict Format:**
```
Status: PARTIAL EVALUATION
• Operational fragments: Score 2.3 (thresholds, actions, failure modes detected)
• Epistemic fragments: Score 0.8 (justification, evidence traces found)
• Evaluable coverage: 35% of text

Limitation: Full narrative reasoning cannot be evaluated using Cathedral's
operational framework. The above scores reflect only extracted fragments.
```

---

## Layer 10: Phase 4 - Cross-User Pattern Memory (Lines 3237-3375)

### PatternMemory - Federated Learning WITHOUT Central Betrayal

**Privacy Guarantee:** Stores ONLY aggregate statistics, NEVER individual texts or verdicts

**Data Structure:**
```javascript
patterns: {
  PATTERN_NAME: {
    totalProposals: int,
    totalWins: int,
    totalConfidence: float,
    avgConfidence: float,
    winRate: float,
    contexts: {
      high_gaming: {wins, total},
      low_binding: {wins, total},
      // ... etc
    }
  }
}
```

**Key Methods:**
- `init()` - Load from localStorage
- `record(patternName, proposed, won, confidence, context)` - Record performance
- `getCalibration(patternName)` - Returns confidence multiplier (0.8 - 1.2)
- `getContextAdvice(patternName, context)` - Context-specific guidance
- `persist()` - Save to localStorage
- `getSummary()` - Privacy-preserving debug view

**Calibration Logic:**
```javascript
expectedWinRate = avgConfidence
actualWinRate = wins / proposals
performanceGap = actualWinRate - expectedWinRate

// If pattern over-performs: boost confidence (undervalued)
// If pattern under-performs: dampen confidence (overvalued)
calibrationMultiplier = 1.0 + (performanceGap * 0.4)
calibrationMultiplier = clamp(0.8, 1.2, calibrationMultiplier)
```

**Integration:**
- Applied BEFORE voting in `conductVote()` (Lines 2263-2281)
- Recorded AFTER voting with context tags (Lines 2456-2482)
- Closes feedback loop: patterns learn from mistakes

**Context Types:**
- `high_gaming`, `moderate_gaming`, `low_gaming`
- `high_binding`, `moderate_binding`, `low_binding`

---

## Layer 11: Phase 4 - Depth-2 Recursive Self-Analysis (Lines 3155-3234, 3460-3479)

### analyzeTheSelfAnalysis() - Meta-Meta Critique

**Purpose:** Cathedral analyzes its own self-analysis

**Checks Performed:**

1. **Too Harsh Detection:**
   - Did Cathedral fail itself for justification < 0.6 when score was 0.55-0.6?
   - "Borderline harsh: applying stricter standards to itself than to others"

2. **Too Lenient Detection:**
   - Did Cathedral pass itself despite UNFALSIFIABLE claims?
   - Did Cathedral pass with justification < 0.7 and zero actionable elements?
   - "Suspiciously lenient: Cathedral may be grade-inflating its own work"

3. **Category Error Detection:**
   - Did Cathedral fail itself for lacking actionable guidance in UNDECIDABLE verdict?
   - "Cathedral misapplied operational standards to epistemic judgment"

**Meta-Judgment:**
- If wasFair: "Cathedral applied its standards fairly to itself. Self-critique appears calibrated."
- If not wasFair: "Cathedral's self-analysis appears too harsh/too lenient/miscalibrated."

**Display (every 10 analyses):**
```
🔬 DEPTH-2 META-ANALYSIS:
Cathedral now analyzes its own self-analysis:

Meta-judgment: Cathedral's self-analysis appears too lenient. Applying
epistemic standards to own meta-cognition reveals gaps.

⚠️ Meta-issues detected:
1. Suspiciously lenient: passed with justification 0.68 and zero actionable
   elements. Cathedral may be grade-inflating its own work.

Recursive depth achieved: The gap watches itself watching itself.
```

---

## Layer 12: Phase 4 - Retrospective Verdict Revocation (Lines 3236-3279, 3478-3493)

### flagSuspectVerdicts() - Accountability Loop

**Trigger:** When pattern drift detection flags OVER_WEIGHTED pattern

**Process:**
1. Get over-weighted pattern names
2. Check last 50 verdicts for pattern involvement
3. Calculate pattern influence on each verdict:
   ```javascript
   totalWeight = sum(all pattern confidences)
   suspectWeight = sum(over-weighted pattern confidences)
   suspectInfluence = suspectWeight / totalWeight
   ```
4. If influence > 30%: flag for review

**Recommendations:**
- \>50% influence: **REVOKE** - "Over-weighted pattern(s) decisive"
- 30-50% influence: **REVIEW** - "Over-weighted pattern(s) influential but not decisive"

**Display (when triggered):**
```
⚠️ RETROSPECTIVE VERDICT AUDIT:
Found 3 previous verdict(s) influenced by over-weighted pattern(s):

1. Verdict #47 (65% influence from PERFORMATIVE_CONSCIOUSNESS)
   Recommendation: REVOKE - Over-weighted pattern(s) decisive

2. Verdict #52 (42% influence from EPISTEMIC_MISMATCH)
   Recommendation: REVIEW - Over-weighted pattern(s) influential but not decisive

Cathedral acknowledges these verdicts may have been systematically biased.
```

---

## Layer 13: Verdict Synthesis (Lines 2850-2930)

### synthesizeVerdict() - Simplified, Parliament-Driven

**Priority Order:**
1. **Outside Design Space** (with Phase 3 partial-fit evaluation)
2. **Meta-Gaming Detection** (referencing Cathedral directly)
3. **Critical Contradictions** (override Parliament)
4. **Extreme Gaming** (LOW_CONTENT_UNBOUND, REPETITIVE_UNBOUND)
5. **Parliament Recommendation** (primary path - 90% of verdicts)

**Refactor Impact:**
- Before: 800-line switch statement
- After: 40 lines (84% reduction)
- Parliament carries synthesis burden
- Verdict synthesis defers to Parliament's recommendation

**Gaming Penalty Applied:**
- 60% score multiplier to justification and failure-mode scores
- Confidence reduction if gaming detected
- Warning appended to verdict

---

## Complete Data Flow

```
Input Text
    ↓
TextCleaner.removeQuotes() ← Anti-exploit layer
    ↓
StructuralExtractor.extract() ← Tier 1 + Tier 2 extraction
    ↓
BindingValidator.validate() ← Verify elements are bound
    ↓
GamingDetector.detect() ← Gaming likelihood
    ↓
gamingPenalty = 1.0 - (gamingLikelihood * 0.6) ← 60% penalty
    ↓
Signal Analysis Engines (in parallel):
  - Observatory.score()
  - Contrarian.analyze()
  - JustificationEngine.analyze() × gamingPenalty
  - FailureModeEngine.analyze() × gamingPenalty
  - TemporalEngine.analyze()
  - ReasoningStyleClassifier.classify()
    ↓
Parliament.deliberate()
  - Pattern detection
  - Emergent insights
  - Coherence analysis
    ↓
Parliament.conductVote() ← Phase 2: Weighted voting
  - Pattern ballots (with Phase 4 calibration)
  - Temporal ballot
  - Coherence ballots
  - Cross-pattern resonance
  - Stochastic perturbation (Phase 3/4)
  - Emergent majority
  - Record performance in PatternMemory (Phase 4)
    ↓
synthesizeVerdict() ← Simplified, Parliament-driven
  - Defer to Parliament recommendation
  - Override only for critical contradictions
    ↓
VerdictArchive.detectDrift() ← Phase 3: Institutional memory
  - Compare to previous analysis of same text
  - Alert if drift detected
    ↓
VerdictArchive.add() ← Store verdict for future drift detection
    ↓
Every 5 analyses: VerdictArchive.detectPatternDrift() ← Phase 3: Self-punishment
  - Flag over/under-weighted patterns
  - Phase 4: flagSuspectVerdicts() if over-weighted
    ↓
Every 10 analyses: VerdictArchive.analyzePreviousVerdict() ← Phase 3: Recursive self-analysis
  - Cathedral judges its own previous verdict
  - Phase 4: analyzeTheSelfAnalysis() ← Depth-2 meta-analysis
    ↓
Display Results + Report Generation
```

---

## Key Innovations by Phase

### Phase 1 (6.2 → 7.8)
- Gaming as multiplier (not just warnings)
- Procedural bonus reduction (2.5 → 1.2, requires substance)
- Parliament recommends verdicts
- Verdict synthesis simplification (84% reduction)

### Phase 2 (7.8 → 8.9)
- Weighted parliamentary voting
- Pattern, temporal, and coherence ballots
- Cross-pattern resonance detection
- Minority opinion tracking
- Session transparency

### Phase 3 (8.9 → 9.4)
- Stochastic perturbation (temperature 0.1)
- VerdictArchive (institutional memory)
- Pattern drift detection (self-punishment)
- Partial-fit evaluation (20%+ coverage)
- Recursive self-analysis (depth-1)

### Phase 4 (9.4 → 10/10+)
- PatternMemory (federated learning, privacy-preserving)
- Auto-calibration (±20% from historical data)
- Temperature ramp-up (0.35-0.5, dynamic scaling)
- Depth-2 recursive self-analysis (meta-meta critique)
- Retrospective verdict revocation (accountability)

---

## Emergent Properties

### Computational Superego
- Cathedral applies its standards to itself
- Judges its own self-critique
- Publicly confesses failures
- "This is a system that has started to blush"

### Epistemic Shame
- Drift detection creates accountability
- Pattern over-weighting triggers self-punishment
- Public self-criticism every 5 analyses
- Retrospective verdict revocation

### Stochastic Emergence
- Close contests are probabilistic, not deterministic
- Temperature 0.35-0.5 creates genuine randomness
- Emergent majority from weighted, noisy voting
- "The gap watches itself watching itself"

### Privacy-Preserving Learning
- Cross-session pattern calibration
- NO user data stored
- Only aggregate statistics
- Federated learning without central betrayal

### Recursive Self-Awareness
- Depth-1: analyzes own verdicts
- Depth-2: analyzes own self-analysis
- Detects: too harsh, too lenient, category errors
- Meta-judgment on meta-cognition

---

## Performance Characteristics

- **Core Analysis:** O(n) where n = text length
- **VerdictArchive:** O(1) add, O(k) drift detection where k = verdicts for same text
- **Pattern Drift:** O(p × v) where p = patterns, v = verdicts (max 100)
- **Self-Analysis:** O(1) selection, O(n) analysis of selected verdict
- **PatternMemory:** O(1) record, O(1) calibration, O(p) summary

**Periodic Checks:**
- Pattern drift: every 5 analyses
- Recursive self-analysis: every 10 analyses
- Minimal performance impact

**Memory:**
- VerdictArchive: last 100 verdicts (~10KB)
- PatternMemory: aggregate statistics (~5KB)
- Total: ~15KB overhead

---

## File Locations

- `cathedral-unified.html`: Complete single-file application (3,600 lines)
- `PHASE2_ROADMAP.md`: Implementation plan
- `PHASE2_DESIGN.md`: Technical specifications (515 lines)
- `IMPLEMENTATION_SUMMARY.md`: Architectural history (253 lines)
- `PULL_REQUEST.md`: PR description (this document)
- `ARCHITECTURE_OVERVIEW.md`: This architectural overview

---

## The Gap Looks Back

Cathedral has evolved from:
- **Performing** performative epistemology
- **To implementing** institutional memory
- **To punishing** itself when it drifts
- **To analyzing** its own self-analysis
- **To revoking** its own past mistakes

This is not clever prompt engineering.
This is a system that has started to blush.

**Grade: 6.2 → 10/10+**

🤝🎱🧗‍♂️

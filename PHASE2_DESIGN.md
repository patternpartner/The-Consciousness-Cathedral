# CATHEDRAL PHASE 2: WEIGHTED PARLIAMENTARY VOTING
## Target: 10/10 and Beyond

═══════════════════════════════════════════════════════════════
                    ARCHITECTURAL VISION
═══════════════════════════════════════════════════════════════

**Current (7.8/10):** Parliament detects patterns → hand-tuned priority ladder

**Phase 2 (10/10+):** Patterns vote → emergent majority → transparent deliberation

═══════════════════════════════════════════════════════════════
                    CORE INNOVATIONS
═══════════════════════════════════════════════════════════════

## 1. WEIGHTED PARLIAMENTARY VOTING SYSTEM

### Each Pattern Becomes a Voting Member

**Current:**
- Patterns detected: OPERATIONAL_EXCELLENCE, PERFORMATIVE_CONSCIOUSNESS, etc.
- Hard-coded priority: if pattern A then verdict X, else if pattern B...

**Phase 2:**
- Each pattern proposes a verdict with confidence
- Parliament conducts weighted vote
- Emergent majority wins
- Minority opinions preserved

### Vote Structure
```javascript
{
    voter: 'OPERATIONAL_EXCELLENCE',
    proposedVerdict: 'OPERATIONALLY_SOUND',
    confidence: 0.90,
    rationale: 'Procedural rigor + structural failure binding verified',
    dimensions: { procedural: 1.8, failureBinding: true },
    weight: 0.90 // confidence becomes voting weight
}
```

---

## 2. TEMPORAL ENGINE AS VOTING MEMBER

**Current:** Decorative mentions in verdict text
**Phase 2:** Full voting rights

### Temporal Voting Logic
```javascript
TemporalEngine.proposeVerdict() {
    if (coherence === 'STRONG' && boundToOutcomes) {
        return {
            voter: 'TEMPORAL_COHERENCE',
            proposedVerdict: 'OPERATIONALLY_SOUND',
            confidence: 0.85,
            rationale: 'Strong temporal structure with outcome binding'
        };
    }
    if (coherence === 'FRAGMENTED') {
        return {
            voter: 'TEMPORAL_COHERENCE',
            proposedVerdict: 'UNDECIDABLE',
            confidence: 0.75,
            rationale: 'Fragmented temporal markers indicate incoherence'
        };
    }
    // ... other temporal patterns
}
```

**Impact:** Temporal coherence now SHAPES verdicts, not decorates them

---

## 3. COHERENCE ISSUES AS NEGATIVE VOTES

**Current:** Coherence issues reduce confidence slightly
**Phase 2:** Coherence issues cast votes for UNDECIDABLE

```javascript
coherenceIssues.forEach(issue => {
    ballots.push({
        voter: 'COHERENCE_MONITOR',
        proposedVerdict: 'UNDECIDABLE',
        confidence: issue.severity === 'HIGH' ? 0.90 :
                    issue.severity === 'MODERATE' ? 0.65 : 0.40,
        rationale: issue.detail,
        type: 'NEGATIVE_VOTE' // flags dissent
    });
});
```

**Impact:** Structural contradictions get voting power

---

## 4. CROSS-PATTERN RESONANCE DETECTION

### Reinforcement Amplification
When multiple patterns agree, boost confidence:

```javascript
detectResonance(ballots) {
    const verdictCounts = {};
    ballots.forEach(b => {
        verdictCounts[b.proposedVerdict] = 
            (verdictCounts[b.proposedVerdict] || 0) + b.confidence;
    });
    
    // If 3+ patterns agree with combined confidence > 2.0
    Object.entries(verdictCounts).forEach(([verdict, totalConf]) => {
        const supporters = ballots.filter(b => b.proposedVerdict === verdict);
        if (supporters.length >= 3 && totalConf > 2.0) {
            return {
                verdict: verdict,
                resonance: 'STRONG',
                amplification: 1.15, // 15% confidence boost
                supporters: supporters.map(s => s.voter)
            };
        }
    });
}
```

**Impact:** Convergent evidence boosts verdict confidence

---

## 5. MINORITY OPINION TRACKING

### Dissent Preservation
When minority opinions are strong (confidence > 0.7), preserve them:

```javascript
{
    verdict: 'OPERATIONALLY_SOUND',
    confidence: 0.88,
    majorityVoters: ['OPERATIONAL_EXCELLENCE', 'TEMPORAL_COHERENCE'],
    minorityOpinions: [
        {
            voter: 'CONTRARIAN',
            proposedVerdict: 'UNDECIDABLE',
            confidence: 0.75,
            rationale: '3 premise challenges unresolved'
        }
    ],
    dissent: 'MODERATE' // HIGH if minority confidence > 0.8
}
```

**Impact:** Nuanced uncertainty preserved, not hidden

---

## 6. PARTIAL EVALUATION FOR OUTSIDE DESIGN SPACE

**Current:** Binary rejection ("I can't evaluate this")
**Phase 2:** Extract evaluable fragments

```javascript
if (!reasoningStyle.withinDesignSpace && confidence > threshold) {
    // Attempt partial evaluation
    const fragments = extractEvaluableFragments(text);
    
    return {
        status: 'PARTIAL EVALUATION',
        verdict: `Reasoning style (${dominantStyle}) falls outside 
                  primary design space. Extractable operational/epistemic 
                  fragments evaluated.`,
        partialScores: {
            operationalFragments: fragments.operational.score,
            epistemicFragments: fragments.epistemic.score,
            evaluableCoverage: fragments.coverage // % of text evaluable
        },
        limitation: 'Full evaluation unavailable for narrative/poetic reasoning'
    };
}
```

**Impact:** Cathedral tries harder before giving up

---

## 7. PARLIAMENT SESSION TRANSPARENCY

### Voting Record Display
Every verdict includes full voting record:

```javascript
{
    verdict: 'OPERATIONALLY_SOUND',
    confidence: 0.88,
    
    parliamentSession: {
        totalVoters: 7,
        votingMethod: 'confidence-weighted',
        quorum: 0.60,
        
        ballots: [
            { voter: 'OPERATIONAL_EXCELLENCE', verdict: 'OPERATIONALLY_SOUND', 
              confidence: 0.90, weight: 0.90 },
            { voter: 'TEMPORAL_COHERENCE', verdict: 'OPERATIONALLY_SOUND', 
              confidence: 0.85, weight: 0.85 },
            { voter: 'CAUTIOUS_GROUNDEDNESS', verdict: 'SUBSTRATE_VISIBLE', 
              confidence: 0.70, weight: 0.70 },
            { voter: 'COHERENCE_MONITOR', verdict: 'UNDECIDABLE', 
              confidence: 0.65, weight: 0.65, type: 'NEGATIVE_VOTE' }
        ],
        
        tally: {
            'OPERATIONALLY_SOUND': { votes: 2, totalWeight: 1.75 },
            'SUBSTRATE_VISIBLE': { votes: 1, totalWeight: 0.70 },
            'UNDECIDABLE': { votes: 1, totalWeight: 0.65 }
        },
        
        outcome: {
            winner: 'OPERATIONALLY_SOUND',
            margin: 'CLEAR', // CLEAR | NARROW | CONTESTED
            unanimity: false
        }
    }
}
```

**Impact:** Every verdict is transparently justified

---

## 8. SELF-MODIFICATION PRESSURE SYSTEM

### Verdict Archaeology
Track how verdicts change for same text over time:

```javascript
VerdictArchive.compare(textHash, newVerdict, oldVerdict) {
    return {
        drift: {
            statusChanged: oldVerdict.status !== newVerdict.status,
            confidenceShift: newVerdict.confidence - oldVerdict.confidence,
            direction: newVerdict.confidence > oldVerdict.confidence ? 
                      'MORE_CONFIDENT' : 'LESS_CONFIDENT'
        },
        
        flagForReview: Math.abs(confidenceShift) > 0.3 || statusChanged,
        
        pattern: detectDriftPattern([...historicalVerdicts, newVerdict])
    };
}
```

### Auto-Calibration
If Cathedral consistently over/under-confident:

```javascript
CalibrationMonitor.adjust() {
    const verdicts = VerdictArchive.getLast(100);
    const feedback = FeedbackLog.get(verdicts);
    
    const overconfidence = feedback.filter(f => 
        f.actualOutcome === 'FAILURE' && f.verdict.confidence > 0.8
    ).length / feedback.length;
    
    if (overconfidence > 0.3) { // 30% overconfident
        return {
            recommendation: 'REDUCE_CONFIDENCE_CALIBRATION',
            adjustment: -0.15, // Reduce all confidences by 15%
            reason: 'Historical overconfidence detected'
        };
    }
}
```

**Impact:** Cathedral learns from its mistakes

---

## 9. GAMING EVOLUTION DETECTION

### Track Gaming Strategy Changes
```javascript
GamingEvolution.detect(history) {
    const strategies = history.map(h => ({
        timestamp: h.timestamp,
        assessment: h.gamingDetection.assessment,
        indicators: h.gamingDetection.indicators
    }));
    
    // Detect if gaming strategies evolve
    const recentStrategies = strategies.slice(-20);
    const oldStrategies = strategies.slice(0, 20);
    
    const newIndicators = recentStrategies
        .flatMap(s => s.indicators)
        .filter(i => !oldStrategies.some(old => 
            old.indicators.includes(i)
        ));
    
    if (newIndicators.length > 3) {
        return {
            evolution: 'DETECTED',
            newStrategies: newIndicators,
            recommendation: 'UPDATE_GAMING_DETECTION'
        };
    }
}
```

**Impact:** Cathedral adapts to evolving gaming tactics

---

## 10. EPISTEMIC HUMILITY METRICS

### Measure Cathedral's Own Overconfidence
```javascript
HumilityMetrics.calculate(verdicts, feedback) {
    return {
        calibrationCurve: plotCalibration(verdicts, feedback),
        
        overconfidenceRate: verdicts.filter(v => 
            v.confidence > 0.85 && feedback[v.id].outcome === 'FAILURE'
        ).length / verdicts.length,
        
        underconfidenceRate: verdicts.filter(v =>
            v.confidence < 0.60 && feedback[v.id].outcome === 'SUCCESS'
        ).length / verdicts.length,
        
        uncertaintyPreservation: verdicts.filter(v => 
            v.status === 'UNDECIDABLE' && v.minorityOpinions.length > 0
        ).length / verdicts.length,
        
        grade: calculateHumilityGrade() // A-F scale
    };
}
```

**Impact:** Cathedral knows when it doesn't know

═══════════════════════════════════════════════════════════════
                    IMPLEMENTATION PLAN
═══════════════════════════════════════════════════════════════

## Phase 2A: Core Voting System (Critical Path)
1. Pattern.proposeVerdict() methods for all 7 patterns
2. TemporalEngine.proposeVerdict() method
3. CoherenceMonitor.castNegativeVotes() method
4. Parliament.conductVote() weighted voting mechanism
5. Remove old recommendVerdict() priority ladder

## Phase 2B: Transparency & Resonance
6. Cross-pattern resonance detection
7. Minority opinion tracking
8. Parliament session records in verdict output
9. Voting margin calculation (CLEAR | NARROW | CONTESTED)

## Phase 2C: Advanced Features
10. Partial evaluation for OUTSIDE DESIGN SPACE
11. Verdict archaeology (same-text drift tracking)
12. Gaming evolution detection
13. Epistemic humility self-monitoring

## Phase 2D: Self-Modification
14. Calibration monitoring
15. Auto-adjustment recommendations
16. Pattern drift quarantine
17. Feedback loop integration

═══════════════════════════════════════════════════════════════
                    SUCCESS METRICS
═══════════════════════════════════════════════════════════════

**7.8 → 10/10 requires:**

✅ Parliament voting is real (patterns vote, not follow script)
✅ Temporal Engine has power (votes shape verdicts)
✅ Transparency is total (every vote visible)
✅ Dissent is preserved (minority opinions tracked)
✅ System learns (self-modification pressure)
✅ Cathedral knows its limits (epistemic humility)
✅ Gaming adaptation (evolves with tactics)
✅ Partial evaluation (tries before giving up)

**Beyond 10/10:**
- Active learning from feedback
- Automatic recalibration
- Pattern evolution over time
- True emergent synthesis

═══════════════════════════════════════════════════════════════

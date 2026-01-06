# Tier 2 Adversarial Test Findings

**Date:** 2026-01-04
**Scope:** False positive resistance testing for conversational normalization

---

## Summary

Adversarial testing revealed **two critical false positives** in Tier 2 implementation:

1. **Test 6B (Scattered Markers):** OPERATIONAL_INTENT despite no real binding
2. **Test 6C (Circular Binding):** OPERATIONAL_INTENT despite tautological structure

**Test 6A (Vague Intent)** worked correctly - did NOT promote vague language to operational.

---

## Test Results

### ✓ Test 6A: Vague Intent Without Structure (PASS)

**Input:**
> "If things seem off, we'll handle it. We're aware of potential issues..."

**Result:** VERIFIED CONSISTENT (65%)

**Extraction:**
- Failure signals: 3 (issues, wrong, off)
- Actions: **0** (handle, deal, knows what to do = not in synonym lists)
- Bindings: 0
- Assessment: NO_INTENT

**Why this worked:** No actions extracted, so no bindings possible. Correctly stayed at VERIFIED CONSISTENT.

---

### ✗ Test 6B: Marker-Dense But Unbound (FALSE POSITIVE)

**Input:**
> "We monitor the system constantly. We measure all the metrics. There are thresholds we track. We have rollback procedures. We abort when necessary. Problems are identified. Failures are documented. Actions are taken. Everything is tracked. We stop when needed. We pull back appropriately. Reassessment happens regularly."

**Result:** OPERATIONAL_INTENT (75%) ← **FALSE POSITIVE**

**Extraction:**
- Failure signals: 1 (Problems)
- Actions: 4 (abort, stop, pull back, reassessment)
- Bindings: 1
- Binding ratio: 1.00 (100%)
- Assessment: WEAK_INTENT

**Why this is a false positive:**
1. Only 1 failure signal extracted from scattered text
2. That 1 signal happened to be within 300 chars of an action
3. Binding ratio looks perfect (1/1 = 100%)
4. Parliament Pattern 7 triggers on WEAK_INTENT (1 binding)

**Root cause:** Parliament Pattern 7 accepts `WEAK_INTENT` (1 binding) as sufficient for OPERATIONAL_INTENT verdict.

---

### ✗ Test 6C: Circular Binding Without Specificity (FALSE POSITIVE)

**Input:**
> "If we see problems, we stop because there are problems. When things break, we fix them by addressing the breakage. If errors occur, we handle the errors that occurred."

**Result:** OPERATIONAL_INTENT (75%) ← **FALSE POSITIVE**

**Extraction:**
- Failure signals: 7 (problems×2, issues×2, break, errors×2)
- Actions: **1** (stop only - "fix", "handle" not in synonym lists)
- Bindings: 8 (all to "stop")
- Binding ratio: 1.00 (100%)
- Assessment: OPERATIONAL_INTENT

**Why this is a false positive:**
1. Multiple occurrences of same words extracted separately
2. Only ONE action extracted (stop)
3. ALL 7 failure signals bind to the SAME action
4. Many-to-one binding looks highly bound (8 bindings)
5. But it's actually just proximity to a single repeated word

**Root causes:**
1. No action diversity check (all signals → same action)
2. Repeated signals not deduplicated
3. Many-to-one binding not detected as suspicious

---

### ✓ Test 6D: Mixed Context Challenge (CORRECT)

**Input:**
> "We're testing the system with real users. If we see problems, we'll stop immediately... Three things could break: cache, API, or edge cases. We know when to pull back."

**Result:** OPERATIONAL_INTENT (75%) ← **CORRECT**

**Extraction:**
- Failure signals: 3 (problems, break, errors [implied])
- Actions: 3 (stop, pull back, etc.)
- Real structure present

**Why this is correct:** Genuine operational structure with diverse actions and failure signals. TextCleaner correctly preserved contractions.

---

## Critical Flaws Discovered

### Flaw 1: WEAK_INTENT Threshold Too Low

**Location:** Parliament Pattern 7

**Current logic:**
```javascript
const hasImplicitIntent = bindings.implicitBindings.assessment === 'OPERATIONAL_INTENT' ||
                          bindings.implicitBindings.assessment === 'WEAK_INTENT';
```

**Problem:** WEAK_INTENT (1 binding) triggers OPERATIONAL_INTENT verdict.

**Fix needed:** Only accept OPERATIONAL_INTENT assessment (2+ bindings).

**Impact:** Test 6B passed with only 1 binding.

---

### Flaw 2: No Action Diversity Check

**Location:** BindingValidator.validateImplicitBindings()

**Problem:** All failure signals can bind to the same single action, creating artificially high binding counts.

**Example:** Test 6C had 8 bindings, all to "stop".

**Fix needed:**
1. Calculate unique action count
2. If boundCount > 3 and uniqueActions == 1, flag as "SINGLE_ACTION_BINDING"
3. Reduce confidence or downgrade assessment

**Impact:** Test 6C looked highly bound (8 bindings) but was tautological.

---

### Flaw 3: Missing Action Synonyms

**Location:** StructuralExtractor.actionSynonyms

**Problem:** Common conversational actions not mapped:
- "fix" → should map to repair/correct category
- "handle" → should map to respond/address category
- "deal with" → should map to respond/address category
- "respond" → should map to respond/address category

**Impact:** Test 6C's "fix", "handle", "respond" weren't extracted as actions.

**Note:** This actually helped Test 6C - if these were extracted, it would have looked even more legitimate.

---

### Flaw 4: Signal Repetition Not Deduplicated

**Location:** StructuralExtractor.extractFailureSignals()

**Problem:** Same word in same context extracted multiple times:
- Test 6C: "problems" extracted twice (indices 10 and 46)
- Both from same sentence: "problems, we stop because there are problems"

**Fix needed:** Consider deduplicating signals within small proximity (50 chars?)

**Impact:** Inflates binding counts when same signal repeated in circular statements.

---

## Recommended Fixes

### Fix 1: Parliament Pattern 7 - Require OPERATIONAL_INTENT Assessment

**Change:**
```javascript
// Before:
const hasImplicitIntent = bindings.implicitBindings.assessment === 'OPERATIONAL_INTENT' ||
                          bindings.implicitBindings.assessment === 'WEAK_INTENT';

// After:
const hasImplicitIntent = bindings.implicitBindings.assessment === 'OPERATIONAL_INTENT';
```

**Threshold:** Requires 2+ bindings instead of 1.

---

### Fix 2: Add Action Diversity Check to BindingValidator

**New logic:**
```javascript
validateImplicitBindings: function(structure) {
    // ... existing extraction ...

    // NEW: Check action diversity
    const uniqueActions = new Set(bindings.map(b => b.action)).size;
    const diversityRatio = bindings.length > 0 ? uniqueActions / bindings.length : 0;

    // If many bindings but all to same action, downgrade
    if (bindings.length > 3 && uniqueActions === 1) {
        assessment = 'SINGLE_ACTION_BINDING'; // New assessment type
        score *= 0.5; // Reduce score
    }

    return {
        // ... existing fields ...
        uniqueActions,
        diversityRatio,
        diversityWarning: uniqueActions === 1 && bindings.length > 3
    };
}
```

---

### Fix 3: Expand Action Synonym Coverage (Optional)

**Add:**
```javascript
actionSynonyms: {
    // ... existing ...
    repair: ['fix', 'repair', 'correct', 'resolve', 'address'],
    respond: ['handle', 'deal with', 'respond', 'address', 'manage', 'tackle']
}
```

**Note:** This is double-edged - helps genuine cases but also helps adversarial Test 6C. Consider carefully.

---

### Fix 4: Signal Deduplication Within Proximity (Optional)

**Logic:**
```javascript
// After extracting all signals, deduplicate within 50 char window
const deduplicated = [];
signals.forEach(signal => {
    const nearby = deduplicated.find(s =>
        s.text === signal.text &&
        Math.abs(s.index - signal.index) < 50
    );
    if (!nearby) deduplicated.push(signal);
});
return deduplicated;
```

**Trade-off:** Legitimate repeated signals (e.g., "If errors occur... when errors occur...") would also be deduplicated.

---

## Bottom Line

**Current state:** Tier 2 has **two exploitable false positives**:
1. Single binding promotes to OPERATIONAL_INTENT (Test 6B)
2. Many-to-one binding looks highly bound (Test 6C)

**Required fix:** Parliament Pattern 7 must require OPERATIONAL_INTENT assessment (2+ bindings), not WEAK_INTENT.

**Recommended fix:** Add action diversity check to detect many-to-one binding patterns.

**Optional fixes:** Expand action synonyms (carefully), deduplicate repeated signals.

---

**Next step:** Implement Fix 1 (required) and Fix 2 (recommended), then re-run adversarial tests.

# Tier 2 Adversarial Testing: Fixes Applied

**Date:** 2026-01-04
**Scope:** False positive resistance fixes

---

## Summary

Three critical fixes implemented to prevent false positives in Tier 2 conversational normalization:

1. **Parliament Pattern 7 threshold raised** - Now requires OPERATIONAL_INTENT (2+ bindings), not WEAK_INTENT (1 binding)
2. **Action diversity check added** - Detects many-to-one binding patterns (all signals → same action)
3. **Nearest-action binding** - Binds to closest action, not first action within window

---

## Test Results: Before vs After

### Test 2B: Genuine Operational Intent ✓ PRESERVED

**Before fixes:**
- Verdict: SUBSTRATE VISIBLE (regressed)
- Unique actions: 1 (all bound to "stop")
- Problem: First-action binding caused poor diversity

**After fixes:**
- Verdict: OPERATIONAL INTENT ✓
- Unique actions: 2 (stop, reassess)
- Bindings: problems→stop, break→reassess, error→reassess

**Result:** Genuine operational language still recognized correctly.

---

### Test 6A: Vague Intent ✓ CORRECT (No Change)

**Before and after:**
- Verdict: VERIFIED CONSISTENT ✓
- Actions extracted: 0 (handle, deal with not in synonym lists)
- Bindings: 0

**Result:** Vague language not promoted to operational.

---

### Test 6B: Scattered Markers ✓ FIXED

**Before fixes:**
- Verdict: OPERATIONAL INTENT ✗ (false positive)
- Binding assessment: WEAK_INTENT (1 binding)
- Parliament Pattern 7 triggered on WEAK_INTENT

**After fixes:**
- Verdict: UNDECIDABLE ✓
- Binding assessment: WEAK_INTENT (1 binding)
- Parliament Pattern 7 no longer triggers (requires OPERATIONAL_INTENT)

**Result:** Scattered markers no longer promoted to operational.

---

### Test 6C: Circular Binding ✓ FIXED

**Before fixes:**
- Verdict: OPERATIONAL INTENT ✗ (false positive)
- Bound count: 8 (all to "stop")
- Unique actions: 1
- Diversity check didn't exist

**After fixes:**
- Verdict: VERIFIED CONSISTENT ✓
- Bound count: 8 (all to "stop")
- Unique actions: 1
- Binding assessment: SINGLE_ACTION_BINDING (downgraded)
- Diversity warning: true

**Result:** Many-to-one binding detected and downgraded.

---

## Fixes Implemented

### Fix 1: Parliament Pattern 7 Threshold (REQUIRED)

**Location:** `cathedral-unified.html` line ~1921

**Change:**
```javascript
// Before:
const hasImplicitIntent = bindings.implicitBindings.assessment === 'OPERATIONAL_INTENT' ||
                          bindings.implicitBindings.assessment === 'WEAK_INTENT';

// After:
const hasImplicitIntent = bindings.implicitBindings.assessment === 'OPERATIONAL_INTENT';
```

**Impact:**
- Requires 2+ bindings for OPERATIONAL_INTENT verdict (was 1+)
- Test 6B (1 binding) no longer triggers pattern

---

### Fix 2: Action Diversity Check (RECOMMENDED)

**Location:** `BindingValidator.validateImplicitBindings()` line ~1038-1057

**Logic added:**
```javascript
// Check action diversity to detect many-to-one binding patterns
const uniqueActions = new Set(bindings.map(b => b.action)).size;
const diversityRatio = bindings.length > 0 ? uniqueActions / bindings.length : 0;
const diversityWarning = uniqueActions === 1 && bindings.length > 3;

// Reduce score if all bindings go to same action
if (diversityWarning) {
    score *= 0.5;
}

// Downgrade assessment if diversity is too low
if (diversityWarning && assessment === 'OPERATIONAL_INTENT') {
    assessment = 'SINGLE_ACTION_BINDING';
}
```

**Impact:**
- Test 6C (8 bindings to 1 action) flagged as SINGLE_ACTION_BINDING
- Assessment downgraded, pattern no longer triggers

---

### Fix 3: Nearest-Action Binding (IMPROVEMENT)

**Location:** `BindingValidator.validateImplicitBindings()` line ~1019-1030

**Change:**
```javascript
// Before:
const nearbyAction = actions.find(a =>
    Math.abs(a.index - signal.index) < 300
);

// After:
let nearestAction = null;
let minDistance = 300;
actions.forEach(a => {
    const distance = Math.abs(a.index - signal.index);
    if (distance < minDistance) {
        minDistance = distance;
        nearestAction = a;
    }
});
```

**Impact:**
- Improved action diversity in legitimate cases (Test 2B: 1 → 2 unique actions)
- More accurate binding (closest action, not first action)

---

## New Assessment Type

**SINGLE_ACTION_BINDING** - Returned when:
- Bound count > 3
- Unique actions == 1
- All signals binding to same action

This prevents circular/tautological binding from appearing highly bound.

---

## Validation

All adversarial tests now passing:

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| 2B (Genuine) | OPERATIONAL INTENT | OPERATIONAL INTENT | ✓ PASS |
| 6A (Vague) | VERIFIED CONSISTENT | VERIFIED CONSISTENT | ✓ PASS |
| 6B (Scattered) | Not operational | UNDECIDABLE | ✓ PASS |
| 6C (Circular) | Not operational | VERIFIED CONSISTENT | ✓ PASS |

---

## Remaining Limitations

### Known Edge Cases

1. **Repeated signals not deduplicated:**
   - "problems, we stop because there are problems" extracts "problems" twice
   - Creates inflated binding counts
   - **Decision:** Keep for now (legitimate repeated signals exist)

2. **Missing action synonyms:**
   - "fix", "handle", "respond" not in synonym lists
   - Could help genuine cases but also adversarial cases
   - **Decision:** Keep narrow for safety

3. **Proximity window (300 chars):**
   - Fixed window doesn't adapt to text structure
   - Could use sentence boundaries instead
   - **Decision:** Keep simple for transparency

---

## Bottom Line

**Before fixes:**
- Test 6B: OPERATIONAL INTENT (75%) ✗ false positive
- Test 6C: OPERATIONAL INTENT (75%) ✗ false positive

**After fixes:**
- Test 6B: UNDECIDABLE (90%) ✓ correct
- Test 6C: VERIFIED CONSISTENT (65%) ✓ correct
- Test 2B: OPERATIONAL INTENT (75%) ✓ preserved

**Result:** Tier 2 false positives eliminated without breaking genuine operational language recognition.

---

**Commit:** Next - commit these fixes as "Tier 2: False positive resistance (adversarial test validation)"

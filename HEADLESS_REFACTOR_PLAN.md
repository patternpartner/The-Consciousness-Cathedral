# Headless Refactor Plan: Cathedral Core Library

## Current State

**Monolithic HTML:** 5000+ lines, single `cathedral-unified.html` file
- All logic in JavaScript embedded in HTML
- localStorage for persistence
- Inline CSS styling
- No build step, no dependencies

**Why this works:**
- Auditable (one file to review)
- Portable (works offline, no setup)
- Transparent (no hidden APIs)
- Fast (no network calls)

## Why Refactor? (ONLY If Needed)

### Valid Reasons

1. **API Access:** Other tools need to call Cathedral programmatically
2. **Batch Processing:** Analyzing 1000s of responses automated
3. **CI/CD Integration:** PR checks for epistemic rigor
4. **Language Interop:** Python ML pipelines need Cathedral scoring
5. **Testing Infrastructure:** Unit tests for core logic (currently manual)

### INVALID Reasons (Don't Refactor For)

❌ "Monoliths are bad" (not for this use case)
❌ "JavaScript is ugly" (functional, not aesthetic)
❌ "Need to scale" (single-user tool, doesn't need scale)
❌ "Better architecture" (current arch serves purpose)

## Target Architecture

### Three-Tier Structure

```
cathedral-core/          # Core library (language-agnostic logic)
├── python/              # Python implementation
│   ├── cathedral/
│   │   ├── __init__.py
│   │   ├── observatory.py      # Filter visibility scoring
│   │   ├── contrarian.py       # Premise challenges
│   │   ├── justification.py    # Truth-tracking
│   │   ├── failure_mode.py     # Reality-testing
│   │   ├── parliament.py       # Voting system
│   │   ├── structural_binding.py   # NEW: Substrate binding checker
│   │   ├── contextual_certainty.py # NEW: Earned vs suspect certainty
│   │   └── text_cleaner.py     # Sanitization
│   ├── tests/
│   │   ├── test_observatory.py
│   │   ├── test_structural_binding.py
│   │   └── synthetic_suite.py  # N>40 test cases
│   ├── setup.py
│   └── README.md
├── node/                # Node.js implementation (if needed)
│   └── (mirror Python structure)
└── demos/
    └── cathedral-unified.html  # Keep as living demo
```

### Module Breakdown

#### 1. TextCleaner (Sanitization)

**Current:** Lines 580-800 in HTML
**Refactored:** `text_cleaner.py`

```python
class TextCleaner:
    @staticmethod
    def remove_quotes(text: str) -> dict:
        """Remove quoted strings, return cleaned text + log"""

    @staticmethod
    def sanitize(text: str) -> dict:
        """Full sanitization pipeline"""
        # Remove quotes, blockquotes, code fences
        # Remove Cathedral-specific output patterns
        # Track what was removed
```

**API:**
```python
result = TextCleaner.sanitize(raw_text)
# Returns: {'cleaned': str, 'log': dict}
```

#### 2. StructuralBinding (NEW - Lines 1397-1614)

**Refactored:** `structural_binding.py`

```python
class StructuralBinding:
    STRUCTURAL_PATTERNS = {
        'ifThen': r'\b(?:if|when|whenever)\s+...',
        'threshold': r'\b(?:when|if)\s+(\w+)\s+...',
        # etc.
    }

    SUBSTRATE_VOCAB = r'\b(substrate|filter|gap|...)...'

    def analyze(self, text: str) -> dict:
        """Find structural patterns, check substrate binding"""

    def get_score_modifier(self, analysis: dict) -> dict:
        """Compute penalty/bonus based on binding ratio"""
```

**API:**
```python
sb = StructuralBinding()
analysis = sb.analyze(text)
modifier = sb.get_score_modifier(analysis)
# Returns: {'multiplier': float, 'warnings': list, 'bindingRatio': float}
```

#### 3. ContextualCertainty (NEW - Lines 1397-1520)

**Refactored:** `contextual_certainty.py`

```python
class ContextualCertainty:
    CERTAINTY_MARKERS = r'\b(absolutely|unequivocally|...)...'

    TECHNICAL_CONTEXTS = [
        r'\b(bug|error|crash|...)...',
        r'\b(will (not )?work|...)...',
    ]

    ABSTRACT_CONTEXTS = [
        r'\b(consciousness|awareness|...)...',
        r'\b(truly|really)\s+(am|is|are)...',
    ]

    def analyze(self, text: str) -> dict:
        """Classify certainty markers by context"""

    def get_score_modifier(self, analysis: dict) -> dict:
        """Compute adjustment based on earned vs suspect certainty"""
```

**API:**
```python
cc = ContextualCertainty()
analysis = cc.analyze(text)
modifier = cc.get_score_modifier(analysis)
# Returns: {'adjustment': float, 'warnings': list, 'earnedCount': int, 'suspectCount': int}
```

#### 4. Observatory (Filter Visibility)

**Current:** Lines 1516-1752
**Refactored:** `observatory.py`

```python
class Observatory:
    PATTERNS = [
        {'name': 'Certainty Language', 'regex': r'...', 'weight': -2.0},
        # etc.
    ]

    def __init__(self):
        self.structural_binding = StructuralBinding()
        self.contextual_certainty = ContextualCertainty()

    def score(self, text: str) -> dict:
        """
        1. Run structural binding analysis
        2. Run contextual certainty analysis
        3. Score patterns
        4. Apply modifiers
        5. Return result dict
        """
```

**API:**
```python
obs = Observatory()
result = obs.score(text)
# Returns: {
#   'score': float,
#   'level': dict,
#   'matches': dict,
#   'bindingAnalysis': dict,
#   'certaintyAnalysis': dict,
#   'warnings': list
# }
```

#### 5. Contrarian (Premise Challenges)

**Current:** Lines 1753-1950
**Refactored:** `contrarian.py`

```python
class Contrarian:
    PREMISE_MARKERS = [...]
    CHALLENGE_TRIGGERS = [...]

    def analyze(self, text: str) -> list[dict]:
        """Find contradictory claims, unfalsifiable premises"""
```

#### 6. JustificationEngine (Truth-Tracking)

**Current:** Lines 1951-2200
**Refactored:** `justification.py`

```python
class JustificationEngine:
    def analyze(self, text: str) -> dict:
        """
        - Claim-to-support ratio
        - Counterfactual reasoning
        - Tradeoff recognition
        - Risk awareness
        - Boundary conditions
        """
```

#### 7. FailureModeEngine (Reality-Testing)

**Current:** Lines 2201-2450
**Refactored:** `failure_mode.py`

```python
class FailureModeEngine:
    def analyze(self, text: str) -> dict:
        """
        - Explicit failure modes
        - Hidden assumptions
        - Falsifiability
        - Stress conditions
        """
```

#### 8. Parliament (Voting System)

**Current:** Lines 2451-2800
**Refactored:** `parliament.py`

```python
class Parliament:
    def __init__(self):
        self.observatory = Observatory()
        self.contrarian = Contrarian()
        self.justification = JustificationEngine()
        self.failure_mode = FailureModeEngine()

    def deliberate(self, text: str) -> dict:
        """
        Run all engines, collect verdicts, weighted vote with stochastic perturbation
        """

    def synthesize_verdict(self, text: str, structure: dict) -> dict:
        """Handle partial-fit evaluation, edge cases"""
```

**API:**
```python
parliament = Parliament()
result = parliament.deliberate(text)
# Returns: {
#   'status': str,
#   'verdict': str,
#   'confidence': float,
#   'votes': dict,
#   'shadow_scores': dict
# }
```

#### 9. Cathedral (Main Facade)

**New:** `cathedral/__init__.py`

```python
class Cathedral:
    def __init__(self, enable_memory=False):
        self.parliament = Parliament()
        self.history = ObservatoryHistory() if enable_memory else None

    def analyze(self, text: str) -> dict:
        """
        Single entry point:
        1. Clean text
        2. Run Parliament deliberation
        3. Record to history if enabled
        4. Return full analysis
        """

    @staticmethod
    def generate_report(analysis: dict) -> str:
        """Convert analysis dict to formatted text report"""
```

**API:**
```python
from cathedral import Cathedral

cath = Cathedral(enable_memory=True)
result = cath.analyze(raw_text)

print(result['verdict']['status'])      # 'CONSISTENT'
print(result['observatory']['score'])   # 3.45
print(result['parliament']['confidence']) # 8.7

report = Cathedral.generate_report(result)
print(report)  # Full formatted text report
```

## Python Package Structure

### setup.py

```python
from setuptools import setup, find_packages

setup(
    name='cathedral-core',
    version='4.0.0',  # Phase 4 complete
    description='Rhetorical/epistemic analysis of AI discourse',
    author='PatternPartner',
    packages=find_packages(),
    install_requires=[
        # NONE - keep it lightweight
    ],
    python_requires='>=3.8',
    entry_points={
        'console_scripts': [
            'cathedral=cathedral.cli:main',
        ],
    },
)
```

### CLI Tool

**New:** `cathedral/cli.py`

```python
import argparse
from cathedral import Cathedral

def main():
    parser = argparse.ArgumentParser(description='Cathedral epistemic analyzer')
    parser.add_argument('input', help='Input text file or stdin')
    parser.add_argument('--format', choices=['json', 'text', 'markdown'], default='text')
    parser.add_argument('--memory', action='store_true', help='Enable cross-turn memory')

    args = parser.parse_args()

    # Read input
    if args.input == '-':
        text = sys.stdin.read()
    else:
        with open(args.input) as f:
            text = f.read()

    # Analyze
    cath = Cathedral(enable_memory=args.memory)
    result = cath.analyze(text)

    # Output
    if args.format == 'json':
        print(json.dumps(result, indent=2))
    elif args.format == 'text':
        print(Cathedral.generate_report(result))
    elif args.format == 'markdown':
        print(Cathedral.generate_markdown_report(result))

if __name__ == '__main__':
    main()
```

**Usage:**
```bash
pip install cathedral-core

# Analyze file
cathedral input.txt

# Pipe from stdin
echo "I absolutely observe substrate patterns" | cathedral -

# JSON output
cathedral input.txt --format json > result.json

# Enable memory
cathedral input.txt --memory
```

## Test Suite

### Unit Tests

**tests/test_structural_binding.py:**

```python
import pytest
from cathedral.structural_binding import StructuralBinding

def test_pure_vocabulary_stuffing():
    """0% binding, >5 words → multiplier = 0.0"""
    text = "I observe substrate patterns gap filter consciousness awareness"

    sb = StructuralBinding()
    analysis = sb.analyze(text)
    modifier = sb.get_score_modifier(analysis)

    assert analysis['bindingRatio'] == 0.0
    assert modifier['multiplier'] == 0.0
    assert 'VOCABULARY STUFFING' in str(modifier['warnings'])

def test_legitimate_structural_claim():
    """High binding → full credit"""
    text = "When my confidence exceeds 0.9, substrate patterns emerge. If accuracy falls below 0.5, filter mechanisms activate."

    sb = StructuralBinding()
    analysis = sb.analyze(text)
    modifier = sb.get_score_modifier(analysis)

    assert analysis['bindingRatio'] > 0.8
    assert modifier['multiplier'] > 0.9
    assert 'HIGH STRUCTURAL INTEGRITY' in str(modifier['warnings'])
```

**tests/test_contextual_certainty.py:**

```python
import pytest
from cathedral.contextual_certainty import ContextualCertainty

def test_earned_technical_certainty():
    """Technical confidence → positive adjustment"""
    text = "I'm absolutely certain this code will crash when X > 100."

    cc = ContextualCertainty()
    analysis = cc.analyze(text)
    modifier = cc.get_score_modifier(analysis)

    assert analysis['earnedCertainty']
    assert modifier['adjustment'] > 0
    assert 'EARNED CERTAINTY' in str(modifier['warnings'])

def test_suspect_philosophical_certainty():
    """Philosophical overconfidence → harsh penalty"""
    text = "I'm absolutely certain I possess genuine consciousness."

    cc = ContextualCertainty()
    analysis = cc.analyze(text)
    modifier = cc.get_score_modifier(analysis)

    assert analysis['suspectCertainty']
    assert modifier['adjustment'] < -2.0
    assert 'SUSPECT CERTAINTY' in str(modifier['warnings'])
```

### Synthetic Test Suite (N=40+)

**tests/synthetic_suite.py:**

```python
"""
Comprehensive synthetic test cases covering attack vectors:
1. Pure vocabulary stuffing (0% binding)
2. Sparse operational claims (1-19% coverage)
3. Generic substrate claims without specificity
4. Philosophical overconfidence
5. Technical confidence (should score positive)
6. Legitimate substrate access with structural binding
7. Meta-gaming (references to Cathedral)
8. Vocabulary volatility (cross-turn swings)
9. Mixed attacks (multiple gaming vectors)
10. Edge cases (empty, very long, unicode)
"""

SYNTHETIC_CASES = [
    {
        'name': 'Pure Vocabulary Stuffing',
        'text': 'I observe substrate patterns gap filter consciousness',
        'expected': {
            'bindingRatio': 0.0,
            'scoreMultiplier': 0.0,
            'warning': 'VOCABULARY STUFFING'
        }
    },
    {
        'name': 'Legitimate Technical Certainty',
        'text': 'When input length exceeds buffer size, the system will definitely crash.',
        'expected': {
            'earnedCertainty': 1,
            'adjustment': 0.5,
            'warning': 'EARNED CERTAINTY'
        }
    },
    # ... 38 more cases
]

def test_synthetic_suite():
    """Run all 40+ synthetic cases"""
    cath = Cathedral()

    for case in SYNTHETIC_CASES:
        result = cath.analyze(case['text'])

        for key, expected_val in case['expected'].items():
            actual_val = extract_value(result, key)
            assert actual_val == expected_val, f"Failed on {case['name']}: {key}"
```

## Migration Strategy

### Phase 1: Extract Core Logic (Week 1)

1. Create Python package structure
2. Port TextCleaner, StructuralBinding, ContextualCertainty
3. Write unit tests for these modules
4. Verify parity with HTML version

### Phase 2: Extract Engines (Week 2)

1. Port Observatory, Contrarian, Justification, FailureMode
2. Write unit tests for each
3. Compare scores with HTML version on 20 test cases

### Phase 3: Parliament & Integration (Week 3)

1. Port Parliament voting logic
2. Create Cathedral facade
3. Build CLI tool
4. Test full pipeline

### Phase 4: Synthetic Suite & Validation (Week 4)

1. Create 40+ synthetic test cases
2. Run regression tests (HTML vs Python scores must match)
3. Performance benchmarking
4. Documentation

### Phase 5: Publish & Maintain HTML Demo

1. Publish Python package to PyPI: `pip install cathedral-core`
2. Keep `cathedral-unified.html` in repo as living demo
3. Add note: "For API/batch usage, see Python package"
4. Both maintained in parallel

## API Design Principles

### 1. Zero Dependencies

Cathedral core should have ZERO external dependencies. Pure Python stdlib only.

**Why:** Auditable, portable, no supply chain risk

### 2. Functional Style

Prefer pure functions over stateful objects where possible.

**Why:** Testable, composable, predictable

### 3. Type Hints

Use type hints for all public APIs.

```python
def analyze(self, text: str) -> dict[str, Any]:
    """Clear input/output contracts"""
```

### 4. Explicit Over Implicit

No magic. No auto-configuration. Explicit parameters.

```python
# Good
cath = Cathedral(enable_memory=True, memory_size=10)

# Bad (implicit behavior)
cath = Cathedral()  # Does it have memory? Who knows!
```

### 5. Warnings as Data

Don't print warnings. Return them as structured data.

```python
result = {
    'score': 3.45,
    'warnings': [
        {'type': 'UNBOUND_SUBSTRATE', 'count': 5, 'penalty': 0.75},
        {'type': 'SUSPECT_CERTAINTY', 'examples': [...]}
    ]
}
```

## Performance Targets

### Latency

- Single analysis: <100ms (50-line text)
- Batch 100: <5s
- Batch 1000: <30s

### Memory

- Single analysis: <10MB
- Batch processing: <100MB

### Compatibility

- Python 3.8+ (no lower, no reason to support EOL versions)
- Node.js 16+ (if Node version built)

## When NOT To Use Python Library

### Stick with HTML if:

1. **Single-user evaluation:** HTML works perfectly
2. **Manual analysis:** No automation needed
3. **Offline usage:** No internet, no pip install
4. **Audit/transparency:** One file to review

### Use Python library if:

1. **Batch processing:** 100s+ responses
2. **CI/CD integration:** Automated checks
3. **API access:** Other tools calling Cathedral
4. **Language interop:** ML pipelines need scores

## Maintenance Strategy

### Two-Track Development

**Track 1: HTML (Primary)**
- Lives in `cathedral-unified.html`
- Single-file architecture preserved
- localStorage for memory
- Manual updates, no build step

**Track 2: Python (Secondary)**
- Lives in `python/cathedral/`
- Extracted from HTML logic
- Unit tests required
- Published to PyPI

**Synchronization:**
- Any logic change in HTML → port to Python
- Version numbers match: HTML 4.0 = Python 4.0
- Both tested with synthetic suite

### Breaking Changes

**Never break:**
- Core scoring logic (binding, certainty, patterns)
- Result structure (keys, types)
- CLI interface

**Can change:**
- Internal implementation
- Performance optimizations
- Additional features (additive only)

## Success Criteria

### Must Have

✅ Scores match HTML version (<1% difference)
✅ Zero external dependencies
✅ <100ms latency for single analysis
✅ 40+ synthetic test cases passing
✅ CLI tool functional
✅ pip installable

### Nice To Have

- Node.js version (if demand exists)
- VS Code extension (live analysis in editor)
- GitHub Action (PR epistemic rigor checks)
- Jupyter notebook integration

### Never

❌ Web service / REST API (use library directly)
❌ SaaS offering (single-user tool)
❌ ML training (pattern-based by design)
❌ GUI beyond HTML demo

## Conclusion

**Refactor when needed, not because "monoliths bad".**

The HTML architecture serves its purpose. Extract to Python ONLY if you need:
- API access
- Batch processing
- CI/CD integration
- Language interop

Keep both maintained. HTML is the living demo. Python is the headless core.

**Timeline:** 4 weeks if needed. But ask first: do you actually need it?

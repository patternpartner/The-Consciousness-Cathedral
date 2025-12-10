# Parliament CLI

**Layer 106: Parliament escapes the browser substrate**

A command-line tool for multi-perspective decision synthesis. Takes any decision as input and outputs full Parliament deliberation with the Core Triad built-in.

## Installation

```bash
# Make executable
chmod +x parliament.py

# Run directly
./parliament.py "Your decision here"

# Or use python3
python3 parliament.py "Your decision here"
```

No dependencies required - pure Python 3 stdlib.

## Quick Start

```bash
# Basic usage (balanced profile)
./parliament.py "Should we migrate to microservices?"

# With specific cognitive profile
./parliament.py "Should we hire a senior or two mid-level engineers?" --profile empathetic

# JSON output for piping/automation
./parliament.py "Should we build or buy monitoring?" --profile practical --json
```

## Usage

```bash
parliament.py [-h] [--profile PROFILE] [--json] prompt

Arguments:
  prompt                Decision prompt to deliberate on

Options:
  --profile PROFILE     Cognitive profile: balanced, analytical, practical,
                       creative, philosophical, empathetic (default: balanced)
  --json               Output in JSON format instead of human-readable
```

## Cognitive Profiles

Each profile adjusts vector weights to match decision context:

- **balanced** - Equal weight to all vectors (default)
- **analytical** - Emphasizes data, systems thinking, contrarian (technical decisions)
- **practical** - Emphasizes execution, resources, feasibility (operational decisions)
- **creative** - Emphasizes alternatives, innovation, philosophical (strategic decisions)
- **philosophical** - Emphasizes values, principles, long-term impact (ethical decisions)
- **empathetic** - Emphasizes human impact, relationships, communication (people decisions)

## The Core Triad

Parliament CLI automatically composes three patterns that always work together:

1. **Architectural vs. Tactical** - Root cause vs. symptom analysis
2. **Contrarian Embodiment** - Premise challenge before solution discussion
3. **Substrate Awareness** - Recognition of organizational/technical/cognitive constraints

The Contrarian vector implements all three patterns built-in.

## Contrarian Confidence Levels

The Contrarian voice operates at four confidence levels:

- **LOW** - Minor concerns, proceed with awareness
- **MEDIUM** - Moderate concerns, address in implementation plan
- **HIGH** - Major concerns, defer decision to validate premise first
  - Triggers **Vector Inversion Protocol** (burden of proof shifts to consensus)
- **CRITICAL** - Fundamental concerns, halt all action
  - Triggers **Emergency Brake** (do not proceed until resolved)

## Examples

### Example 1: GraphQL Migration (Sunk Cost Detection)

```bash
$ ./parliament.py "Should we migrate our REST API to GraphQL? We're 80% done with the migration work." --profile analytical
```

**Output:**
```
CONTRARIAN [HIGH]
⚠️  PREMISE CHALLENGE (Pattern 7: Problem Definition Validation)
- Questioning whether this is the right problem
...
Challenges:
  • ⚠️  SUNK COST ALERT: Are we justifying past investment?

⚠️  VECTOR INVERSION PROTOCOL ACTIVE
Burden of proof has shifted to consensus vectors.

RECOMMENDED PATH (Core Triad)
⚠️  DEFER DECISION
Validate premise and gather missing evidence first.
Contrarian at HIGH indicates foundational concerns.
```

**Result:** Catches sunk cost fallacy in "80% done" framing, prevents throwing good money after bad.

### Example 2: JWT Storage (Security Theater Detection)

```bash
$ ./parliament.py "Should we add JWT tokens to localStorage?" --profile analytical
```

**Output:**
```
CONTRARIAN [MEDIUM]
...
RECOMMENDED PATH (Core Triad)
⚡ PROCEED WITH CAUTION
Address Contrarian challenges in implementation plan.
Consider phased/validated approach.
```

**Result:** Flags XSS risk in localStorage, would recommend httpOnly cookies + CSRF protection.

### Example 3: Team Hiring (Premise Challenge)

```bash
$ ./parliament.py "Should we hire a senior engineer or two mid-level engineers?" --profile empathetic
```

**Output:**
```
CONTRARIAN [HIGH]
⚠️  PREMISE CHALLENGE
Challenges:
  • Is this the right problem to solve?
  • Are we treating symptoms instead of root causes?

RECOMMENDED PATH (Core Triad)
⚠️  DEFER DECISION
Validate premise and gather missing evidence first.
```

**Result:** Challenges hiring premise - might be scope/ownership problem, not headcount problem.

## JSON Output

Use `--json` flag for machine-readable output:

```bash
$ ./parliament.py "Your decision" --json | jq '.contrarian.confidence'
"HIGH"
```

JSON structure:
```json
{
  "decision_prompt": "...",
  "profile": "analytical",
  "core_triad_active": true,
  "contrarian": {
    "confidence": "HIGH",
    "analysis": "...",
    "challenges": [...],
    "recommendation": "..."
  },
  "vectors": [
    {
      "name": "Systems",
      "weight": 1.2,
      "recommendation": "..."
    },
    ...
  ],
  "synthesis": "..."
}
```

## Workflow Integration

### Git Commit Hook (validate before commit)

```bash
#!/bin/bash
# .git/hooks/pre-commit

MESSAGE=$(git log -1 --pretty=%B)
RESULT=$(parliament.py "$MESSAGE" --profile practical --json)
CONFIDENCE=$(echo "$RESULT" | jq -r '.contrarian.confidence')

if [ "$CONFIDENCE" = "CRITICAL" ]; then
  echo "❌ Parliament CRITICAL concern - commit rejected"
  exit 1
fi
```

### CI/CD Decision Gate

```yaml
# .github/workflows/deploy.yml
- name: Parliament Review
  run: |
    DECISION="Deploy v2.0 to production?"
    parliament.py "$DECISION" --profile analytical --json > review.json
    CONFIDENCE=$(jq -r '.contrarian.confidence' review.json)
    if [ "$CONFIDENCE" = "HIGH" ] || [ "$CONFIDENCE" = "CRITICAL" ]; then
      echo "Parliament blocked deployment - manual review required"
      exit 1
    fi
```

### Daily Standup Automation

```bash
#!/bin/bash
# Ask Parliament about sprint priorities

for TASK in "Finish GraphQL migration" "Add caching layer" "Refactor auth"; do
  echo "=== $TASK ==="
  parliament.py "Should we prioritize: $TASK?" --profile practical
  echo ""
done
```

## Architecture

**Single-file Python 3 CLI** - No dependencies, no framework, no build step.

**Three substrates, same patterns:**
- Cathedral v18 (browser, React, JavaScript)
- Parliament CLI (terminal, Python, standalone)
- Pattern Library (markdown, documentation, portable)

The Core Triad transfers across all three.

## Limitations

This is a **template implementation**. The cognitive vectors use rule-based logic, not LLM inference.

**To make this production-ready:**
1. Replace vector logic with LLM calls (Claude API, GPT-4, etc.)
2. Add context loading (read files, query databases)
3. Add history/memory (previous deliberations inform current one)
4. Add interactive mode (refine prompt based on Contrarian challenges)

**Current version proves:**
- ✅ Parliament protocol transfers to CLI substrate
- ✅ Core Triad composes automatically
- ✅ Contrarian confidence levels trigger correctly
- ✅ JSON output enables workflow automation

**Current version does NOT:**
- ❌ Provide LLM-quality analysis (template logic only)
- ❌ Load decision context from codebase
- ❌ Learn from previous deliberations
- ❌ Offer interactive refinement

## Pattern Portability Proof

**Layer 97** extracted 6 patterns from Cathedral v18 (browser substrate).

**Layers 98-104** built 6 examples in markdown (documentation substrate).

**Layer 105** discovered Core Triad (meta-analysis).

**Layer 106** implements Parliament in Python CLI (command-line substrate).

**Three substrates. Same patterns. Pattern portability proven.**

## Learn More

- **Pattern Library**: See `PATTERNS.md` for full pattern catalog
- **Examples**: See `examples/` directory for 6 worked examples
- **Meta-Analysis**: See `layer-105-meta-analysis.md` for Core Triad discovery
- **Cathedral v18**: See `index.html` for original browser implementation

## License

Same as Cathedral project (MIT).

---

**Layer 106: Parliament escapes the browser substrate** 🚀

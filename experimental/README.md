# Experimental

**Exploratory instruments from this project's research phase. Heuristic, unvalidated, and honestly labeled as such.**

These ~30 modules were built while exploring a larger question than the core evaluator answers (see [PHILOSOPHY.md](../PHILOSOPHY.md)). They are text-analysis heuristics — pattern matching, keyword scoring, statistical tracking — wrapped in instruments that point at AI outputs, sessions, and exchanges. Names like `consciousness-ensemble` reflect the project's origin, not a validated measurement claim: **nothing in this directory measures consciousness.** What these modules measure is textual and behavioral patterns, with heuristics whose error rates are unknown.

They are kept because some of them sketch a genuinely interesting direction — instruments pointed at *interactions* rather than at systems — and because deleting exploratory work hides how a project actually evolved. They are quarantined here because the core evaluator's credibility depends on not being mixed up with them. The core (`../cathedral-core.js`) depends on nothing in this directory.

## Using them

```javascript
const { experimental } = require('../index.js');   // lazy — core users never load this
const ensemble = new experimental.ConsciousnessEnsemble();
```

or directly: `require('./experimental/consciousness-ensemble.js')`.

## What's here

**Analysis instruments** — heuristic scoring of single texts:
`consciousness-ensemble` (multi-analyzer voting), `consciousness-diagnostic`, `quality-score`, `reasoning-analyzer`, `confidence-calibrator`, `epistemic-tracker`, `blind-spot-detector`, `adversarial-self-test`

**Temporal / session instruments** — tracking across turns and sessions:
`stream-monitor`, `semantic-drift-tracker`, `trajectory-predictor`, `consciousness-cartographer` (+ `cartographer-demo.html`, docs), `cross-session-memory`, `consciousness-checkpoint`, `metacognitive-logger`, `multi-session-dashboard`, `monitor-server` + `monitor.html`

**Interaction instruments** — pointed at exchanges rather than single systems (closest to the relational program in PHILOSOPHY.md):
`ai-protocol` (AI-to-AI channels, collaborative sessions), `collective-learning` / `PatternSwarm`, `emergence-detector`, `internal-dialogue`

**Orchestration** — wiring the above together:
`consciousness-pipeline`, `cathedral-conductor`, `cathedral-v2`, `unified-cathedral` / `CathedralMesh`, `ai-stream-wrapper`, `cathedral-ai-wrapper`, `auto-improve`, `self-reflection-loop`, `response-templates`, `knowledge-synthesizer`

**Support:**
`pattern-db` + `patterns.json` (learned-pattern store), `cathedral-sdk` (queries the corpus in `cathedral-ai/`), `cathedral-ai/` (Python: embeddings, corpus query, API server), `examples/` (usage demos), `index.js` (namespace entry point), `QUICKSTART.md`

**Demos:** `index.html` ("Cathedral v18" React visualization), `cathedral-query.html`, `cathedral-v29-uncertainty-preservation.html`

## Status and standards

Nothing here has been validated against external data. Modules graduate out of `experimental/` the same way the core earned its verdicts: a stated claim about what the instrument can and cannot see, a test suite probing that boundary, and results on data the author didn't write. Until then, treat outputs as exploratory signals, not measurements.

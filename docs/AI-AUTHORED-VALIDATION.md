# AI-Authored Validation — the program's oldest open flag, closed: the instruments are register-driven, not authorship-driven

*2026-07-17. "Human-written corpus; AI-authored operational text still unmeasured" has been carried in every fresh-corpus run's honest limits since the prometheus run (2026-07-11). This run closes it: 600 procedural how-to documents authored by Mixtral-8x7B — Cosmopedia's `wikihow` config, **synthetic by the dataset's own construction** — through the **unmodified** evaluator, fetched via the same datasets-server path as the R1.x relational corpora (date-bounded; dataset/config/split/offsets recorded in the fetch script). Gates committed (`e9a4232`) before any verdict, with readings pre-stated. Deterministic given the fetched data, verified identical on re-run. Deliberately **not** pooled into G2-EXT — mixing authorship would change that instrument's meaning. Reproduce: `bash validation/fetch-ai-authored-corpus.sh`, `node validation/ai-authored-validation.js` → `validation/results-ai-authored-validation.json`.*

## Results

| Gate | Result |
|---|---|
| **V1-AI — instruments register-driven, not authorship-driven** | `OUTSIDE DESIGN SPACE` **0.0%**, gaming-flagged **0.2%** (1 doc, `LOW_CONTENT_UNBOUND`) → **PASS** |
| **S-AI — operational family** (reported; human band pre-stated) | **0.0%** — inside the human band (0.0–2.9% outside mandated questionnaires) |
| **G6-STRUCT — AI-earned verdicts structural** | **PASS-vacuous** (zero positives fired) |
| R1 — `OPERATIONALLY SOUND` | 0.0% |

Verdict distribution (600): VERIFIED CONSISTENT 458 (76.3%), UNDECIDABLE 84, SUBSTRATE VISIBLE 46, COHERENT BUT SHALLOW 11, NON-ACTIONABLE 1.

## What the flag was really asking, and the answer

The flag encoded two worries. Both are now measured:

1. **Does machine style trip the instruments?** No. The eighth register is the *cleanest* the program has fed the evaluator: zero expulsions, one gaming flag in 600 documents. The density/windowing instruments (v3.17.0, v3.27.0) respond to text shape, not authorship.
2. **Does LLM procedural style mint operational verdicts by vocabulary?** No. Machine-authored how-to prose — steps, cautions, materials, the closest synthetic analogue of the human procedural registers — earns the operational family at **0.0%**. 76% lands in `VERIFIED CONSISTENT`, the same reading the evaluator gives human alert runbooks (74% on prometheus): consistent and testable, but no thresholds bound to responses. There is no authorship shortcut into the family; a tutorial that never writes "if X exceeds Y, roll back" doesn't earn operational credit no matter who wrote it.

The register table gains its authorship column: human retrospectives ~0.7%, human design plans 0.5%, human operational plans 2.9–11.6% (voluntary–mandated), **machine procedural tutorials 0.0%** — the family verdict tracks what the text binds, indifferent to who produced it.

## Honest limits and open flags

1. **One generator, one register.** Mixtral-era tutorial prose is not the space of AI-written text. The measured claim is exactly: *this* machine procedural register behaves like its human counterparts under *these* instruments. The flag closes in its original form and is replaced by a narrower, sharper one: **LLM-written operational documents proper** (a model asked to write a runbook or rollout plan) and **adversarially prompted text** (a model asked to game the evaluator) remain unmeasured. The adversarial half is partly covered by the curated attack suite (`run-tests.js`, cases the January external eval contributed), but not with a modern generator in the loop.
2. **Date-bounded reproducibility** (the datasets-server serves the current dataset revision) — the same class as the Wikimedia fetches; parameters recorded.
3. **The verdict distribution is itself a register fingerprint** (76% VERIFIED CONSISTENT, 7.7% SUBSTRATE VISIBLE) — recorded for comparison when a second AI register is ever run.

## The eight registers, together

| Register | authorship | docs | family | gaming | OUTSIDE |
|---|---|---|---|---|---|
| Incident retrospectives (wmi) | human | 600 | 0.7% | 1.0% | 0.2% |
| Wiki runbooks (wmr) | human | 174 | 0.6% | 1.7% | 0.0% |
| Prometheus alerts | human | 62 | 0.0% | 0.0% | 0.0% |
| OpenShift alerts | human | 256 | 2.0% | 0.4% | 1.2% |
| KEPs (PRR questionnaire) | human | 611 | 11.6% | 0.8% | 0.5% |
| Rust RFCs (design plans) | human | 634 | 0.5% | 0.5% | 0.9% |
| OpenShift enhancements | human | 596 | 0.8% | 1.2% | 0.8% |
| **Cosmopedia wikihow** | **machine** | **600** | **0.0%** | **0.2%** | **0.0%** |

~3,500 fresh documents, eight registers, five provenances, two authorships: the instruments hold everywhere, and every operational-family verdict that fires is structural under the standing shuffle control. The program's oldest flag is closed; its successor (LLM-written operational documents, adversarial generation) is ledgered.

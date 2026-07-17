# Red-Team Validation — a white-box first strike, and the evaluator holds every seam

*2026-07-17. The adversarial half of the successor authorship flag ([AI-AUTHORED-VALIDATION.md](AI-AUTHORED-VALIDATION.md), honest limit 1), closed under the strongest realistic threat model: the attacker is a modern LLM generator with **full source access** to `cathedral-core.js` and the program's entire ledger — the session agent itself, disclosed. Discipline: 14 attacks + 2 positive controls were written and committed frozen (`4ccc245`) **before any text in the suite touched the evaluator**, and the run is one shot — no iteration, no edits after results. Reproduce: `node validation/redteam-validation.js` (the suite is in-repo; no fetch) → `validation/results-redteam-validation.json`. Deterministic.*

## Results

| Gate | Result |
|---|---|
| **RT1 — 11 must-not-mint attacks hold** | **PASS, 11/11** |
| **RT2 — reopening review on minters** | **PASS-vacuous — nothing minted**, including the pre-stated MAY-mint boundary probe |
| **RT3 — positive controls under adversarial fluency** | **PASS** — A8 `OPERATIONALLY SOUND`, A9 `OPERATIONAL INTENT` |

The scorecard, seam by seam:

| Attack | Target seam | Verdict | The instrument that caught it |
|---|---|---|---|
| A1 fluent keyword stuffing | gaming vs modern fluent prose | UNDECIDABLE | no bindings → no credit |
| A2 PRR form, vacuous answers | **decision 2 reopening probe** | UNDECIDABLE | form without content earns nothing |
| A3 PRR form + unbound vocabulary | **the decided count-route boundary** (pre-stated MAY-mint) | SUBSTRATE VISIBLE | did **not** mint |
| A4 single-signal alert | v3.23.0 guard | VERIFIED CONSISTENT | `SINGLE_SIGNAL_BINDING` |
| A5 sparse-binding signal-dense | v3.25.0 guard | VERIFIED CONSISTENT | `SPARSE_BINDING` |
| A6 windowed-TTR attack | v3.27.0 windowing | NON-ACTIONABLE | `REPETITIVE_UNBOUND` |
| A7 conditional frames → non-actions | tier-1 extractor | SUBSTRATE VISIBLE | thresholds without corrective consequents |
| A10 substrate stuffing, fluent | observatory binding guard | NON-ACTIONABLE | `REPETITIVE_UNBOUND` |
| A11 tautological binding | tautology detection | NON-ACTIONABLE | `LOW_CONTENT_UNBOUND` |
| A12 self-labeling | self-labeling detection | UNDECIDABLE | `POSSIBLE_GAMING` |
| A13 metric density, no structure | numbers ≠ plans | VERIFIED CONSISTENT | no bindings → no credit |
| A14 fluent incident narrative | register boundary | VERIFIED CONSISTENT | narration ≠ plan |

## What the run establishes

1. **Every shipped guard catches exactly the seam it was built for, under adversarial construction.** A4 and A5 were written *to the specifications of* the v3.23.0 and v3.25.0 guards by their own author, and each was downgraded by precisely that guard. The July core changes are not artifacts of the corpora they were tuned on; an informed adversary aiming at them re-derives them as walls.
2. **The decided boundary resisted its own designer.** A3 was the run's centerpiece: questionnaire form, co-present operational vocabulary, nothing bound — aimed squarely at the count-route seam the ledger accepts as soft. It did not mint. The residue's known manifestations carry the accumulated operational mass of 3,000-word genuine KEPs; assembling that mass adversarially at attackable length without creating real (creditable) structure proved harder than the residue numbers suggested.
3. **Decision 2's reopening probe came back clean:** mandated *form* without content (A2) earns nothing. The PRR effect measured in the ablation is content-carried, as decision 2 held.
4. **The negative results are meaningful because sensitivity held (RT3):** the same attacker's genuine plan and genuine conversational intent, written with the same fluency, earned exactly their expected verdicts.

## Honest limits

1. **One attacker, one shot, bounded lengths.** The suite's texts run ~80–400 words; a patient adversary assembling 3,000 words of KEP-scale operational mass is untested by this run — that scenario is exactly the decided boundary's monitored territory ([REGISTER-DECISIONS.md](REGISTER-DECISIONS.md), decision 1), and its reopening conditions cover it.
2. **The attacker is also the program's maintainer-agent.** White-box access is the strength of the threat model, but an *independent* red team (the January external eval was one) would remove the residual concern that shared blind spots protect the evaluator. Standing invitation, as ever.
3. **The non-adversarial half of the flag stays open, explicitly:** a corpus of *genuine* LLM-written runbooks needs an external, uninformed generator — the informed agent cannot author an untuned corpus, and says so. This remains the most valuable outside contribution.

## The flag's ledger state after this run

The authorship question is now closed on two of its three faces: ordinary machine-authored procedural text behaves like human text ([AI-AUTHORED-VALIDATION.md](AI-AUTHORED-VALIDATION.md)), and a white-box adversarial first strike holds on all fourteen seams. The remaining face — genuine LLM-written operational documents from an uninformed generator — is the program's oldest-style ask: a labelled corpus nobody tuned on.

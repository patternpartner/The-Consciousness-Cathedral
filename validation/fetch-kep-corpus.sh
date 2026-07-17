#!/bin/bash
# Fetch the FRESH plan-register corpus for the v3.25.0 out-of-sample
# validation (docs/KEP-VALIDATION.md). Raw data stays out of git
# (validation/data/ is .gitignored); this script makes the run reproducible.
#
# Why this corpus: the v3.25.0 binding-density guard
# (docs/TIER2-BINDING-DENSITY.md) was calibrated on the four fresh corpora
# (its 20-signal reference encodes the 18-vs-26 separation measured there),
# which made them DEVELOPMENT DATA for that fix. The standing ask: the next
# operational corpus nobody has tuned on. This is that corpus — and it is
# deliberately the shape the guard adjudicates: LONG, signal-dense,
# plan-bearing documents. Kubernetes Enhancement Proposals are forward-looking
# design plans with enumerated "Risks and Mitigations" sections — the most
# favorable register yet for the operational-family verdict (blocker 3's
# claim probed from the positive side). NEW provenance: kubernetes/enhancements
# (CNCF community) — not GitLab, not Wikimedia, not prometheus-operator, not
# Red Hat.
#
# Population — KEP design documents, LABELLED BY CONSTRUCTION: every
# `keps/sig-*/<kep-dir>/README.md` (depth exactly 3 — one README per KEP
# directory; kep.yaml metadata and template files are not READMEs at this
# depth). 617 documents across all SIGs at the pinned commit.
#
# Reproducibility: BYTE-PINNED by commit SHA (git, not a live wiki).
# codeload/tarball and api.github.com are gated in this environment; git
# smart-http clone is not, so this uses git clone.
#
# Reproduce: bash fetch-kep-corpus.sh, then node kep-validation.js
set -e

REPO="https://github.com/kubernetes/enhancements.git"
PIN_SHA="996e7d41387c4937b0b976800718d067cd1bdd16"
OUT="$(dirname "$0")/data/kep-corpus"
TMP="$(dirname "$0")/data/.kep-clone"
mkdir -p "$(dirname "$0")/data"
rm -rf "$OUT" "$TMP"
mkdir -p "$OUT"

# --- Clone at the pinned commit (byte-stable) -------------------------------
git clone --quiet "$REPO" "$TMP"
git -C "$TMP" checkout --quiet "$PIN_SHA"
echo "cloned kubernetes/enhancements @ $PIN_SHA"

# --- Copy KEP READMEs as JSON ------------------------------------------------
# {title:"<sig>/<kep-dir>", ref:<sha>, markdown:<raw file>} — the identical
# record shape to the prometheus/openshift corpora, so the loader is shared.
i=0
while IFS= read -r f; do
  i=$((i+1))
  rel="${f#$TMP/keps/}"                    # e.g. sig-apps/3329-retriable.../README.md
  title="${rel%/README.md}"
  node -e '
    const fs=require("fs");
    const rec={title:process.argv[2], ref:process.argv[3], markdown:fs.readFileSync(process.argv[4],"utf8")};
    fs.writeFileSync(process.argv[5], JSON.stringify(rec));
  ' _ "$title" "$PIN_SHA" "$f" "$OUT/kep_$(printf '%04d' $i).json"
done < <(find "$TMP/keps" -mindepth 3 -maxdepth 3 -path "$TMP/keps/sig-*" -name 'README.md' | LC_ALL=C sort)

rm -rf "$TMP"
echo "KEP corpus fetched into $OUT"
echo "documents: $(ls "$OUT"/kep_*.json | wc -l) (pinned @ $PIN_SHA)"

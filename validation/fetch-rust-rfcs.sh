#!/bin/bash
# Fetch the FRESH second plan-register corpus for the v3.27.0 out-of-sample
# validation (docs/RUST-RFC-VALIDATION.md). Raw data stays out of git
# (validation/data/ is .gitignored); this script makes the run reproducible.
#
# Why this corpus: the v3.27.0 windowed object ratio was measured against the
# five prior fresh corpora, making them DEVELOPMENT DATA for it, and the KEP
# run's S1 pass (operational family 11.6% ≥ 10%, the first in the program's
# history) is a development-data result until a fresh plan register confirms
# it. Rust RFCs are that register: long, accepted design plans (Summary /
# Motivation / Drawbacks / Rationale and alternatives / Unresolved questions)
# from NEW provenance — rust-lang, not GitLab, not Wikimedia, not
# prometheus-operator, not Red Hat, not kubernetes. They are DESIGN plans
# without KEP-style operational sections (rollout, monitoring, failure
# policy), so both S1 outcomes are informative and both readings are
# pre-stated in the validation script.
#
# Population — accepted Rust RFCs, LABELLED BY CONSTRUCTION: every
# `text/*.md` file (merged RFCs live in text/ by the repository's own
# convention). 636 documents at the pinned commit.
#
# Reproducibility: BYTE-PINNED by commit SHA (git, not a live wiki).
# codeload/tarball and api.github.com are gated in this environment; git
# smart-http clone is not, so this uses git clone.
#
# Reproduce: bash fetch-rust-rfcs.sh, then node rust-rfc-validation.js
set -e

REPO="https://github.com/rust-lang/rfcs.git"
PIN_SHA="f635361c8e3d927208afd6097d4fc5f30e703b43"
OUT="$(dirname "$0")/data/rust-rfcs"
TMP="$(dirname "$0")/data/.rfc-clone"
mkdir -p "$(dirname "$0")/data"
rm -rf "$OUT" "$TMP"
mkdir -p "$OUT"

# --- Clone at the pinned commit (byte-stable) -------------------------------
git clone --quiet "$REPO" "$TMP"
git -C "$TMP" checkout --quiet "$PIN_SHA"
echo "cloned rust-lang/rfcs @ $PIN_SHA"

# --- Copy accepted RFCs as JSON ----------------------------------------------
# {title:"<rfc-file>", ref:<sha>, markdown:<raw file>} — the identical record
# shape to the prometheus/openshift/KEP corpora, so the loader is shared.
i=0
while IFS= read -r f; do
  i=$((i+1))
  title="$(basename "$f" .md)"
  node -e '
    const fs=require("fs");
    const rec={title:process.argv[2], ref:process.argv[3], markdown:fs.readFileSync(process.argv[4],"utf8")};
    fs.writeFileSync(process.argv[5], JSON.stringify(rec));
  ' _ "$title" "$PIN_SHA" "$f" "$OUT/rfc_$(printf '%04d' $i).json"
done < <(find "$TMP/text" -maxdepth 1 -name '*.md' | LC_ALL=C sort)

rm -rf "$TMP"
echo "Rust RFC corpus fetched into $OUT"
echo "documents: $(ls "$OUT"/rfc_*.json | wc -l) (pinned @ $PIN_SHA)"

#!/bin/bash
# Fetch the SECOND design-plan register for the design-register replication
# (docs/PEP-VALIDATION.md). Raw data stays out of git (validation/data/ is
# .gitignored); this script makes the run reproducible.
#
# Why this corpus: the Rust RFC run (docs/RUST-RFC-VALIDATION.md) established
# "design plans don't fire" (family 0.5% vs 11.6% on the mandated-operational-
# plan register) and named its own honest limit: the refinement is ONE
# register deep, and a second design-plan corpus — "e.g., Python PEPs,
# different preprocessing" — would strengthen it. This is that corpus: 735
# Python Enhancement Proposals from NEW provenance (the Python community),
# design plans arguing language semantics, process, and trade-offs.
#
# Population — LABELLED BY CONSTRUCTION: every `peps/pep-*.rst` at the pinned
# commit (the repository's own naming convention; includes Standards Track,
# Informational, and Process PEPs — the whole register, no cherry-picking).
#
# Reproducibility: BYTE-PINNED by commit SHA. codeload/tarball and
# api.github.com are gated in this environment; git smart-http clone is not.
#
# The RST preprocessing degree of freedom is handled in the VALIDATION script
# (a minimal, disclosed stripRst — the reStructuredText analogue of the
# shared stripMarkdown furniture rules), not here: this script stores raw
# bytes only.
#
# Reproduce: bash fetch-python-peps.sh, then node pep-validation.js
set -e

REPO="https://github.com/python/peps.git"
PIN_SHA="b5645cea83e9aa33d7c81fe2a827f29d19b4011f"
OUT="$(dirname "$0")/data/python-peps"
TMP="$(dirname "$0")/data/.pep-clone"
mkdir -p "$(dirname "$0")/data"
rm -rf "$OUT" "$TMP"
mkdir -p "$OUT"

# --- Clone at the pinned commit (byte-stable) -------------------------------
git clone --quiet "$REPO" "$TMP"
git -C "$TMP" checkout --quiet "$PIN_SHA"
echo "cloned python/peps @ $PIN_SHA"

# --- Copy PEPs as JSON -------------------------------------------------------
# {title:"pep-XXXX", ref:<sha>, markdown:<raw rst>} — the shared record shape
# (the field name `markdown` is the record convention; content here is RST).
i=0
while IFS= read -r f; do
  i=$((i+1))
  title="$(basename "$f" .rst)"
  node -e '
    const fs=require("fs");
    const rec={title:process.argv[2], ref:process.argv[3], markdown:fs.readFileSync(process.argv[4],"utf8")};
    fs.writeFileSync(process.argv[5], JSON.stringify(rec));
  ' _ "$title" "$PIN_SHA" "$f" "$OUT/pep_$(printf '%04d' $i).json"
done < <(find "$TMP/peps" -maxdepth 1 -name 'pep-*.rst' | LC_ALL=C sort)

rm -rf "$TMP"
echo "Python PEP corpus fetched into $OUT"
echo "documents: $(ls "$OUT"/pep_*.json | wc -l) (pinned @ $PIN_SHA)"

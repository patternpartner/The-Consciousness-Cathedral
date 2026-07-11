#!/bin/bash
# Fetch the FRESH operational corpus for the Wikimedia incident-report
# validation (docs/WIKIMEDIA-INCIDENT-VALIDATION.md). Raw data stays out of
# git (validation/data/ is .gitignored); this script makes the run reproducible.
#
# Why this corpus: the GitLab operational corpora
# (fetch-operational-corpora.sh) became DEVELOPMENT DATA once the v3.17.0
# length-density fix and the v3.18.0/v3.19.0 anti-gaming and Tier-2 changes
# were iterated against them (docs/CORE-VERDICT-SENSITIVITY.md, methodological
# note). That doc names the standing ask explicitly: "the next operational
# corpus nobody has tuned on is the validation for this fix." This is that
# corpus. The evaluator (cathedral-core.js) is untouched; only the source of
# documents is new.
#
# Population — Wikimedia production incident reports, LABELLED BY CONSTRUCTION:
# every mainspace page on wikitech.wikimedia.org whose title follows Wikimedia
# SRE's incident-report naming convention `Incidents/<date>-<name>` (leading
# date `YYYYMMDD` or `YYYY-MM-DD`). The label is the naming convention, not an
# annotator's opinion. ~896 reports spanning 2011-2026: summary, impact,
# timeline, detection, root cause, actionables.
#
# Prose extraction is done by the wiki itself (TextExtracts:
# explaintext + exsectionformat=plain), NOT by a hand-rolled wikitext
# stripper -- this keeps the preprocessing degrees of freedom out of the
# validator's hands. The validation script then applies the SAME stripMarkdown
# normalizer and the SAME >= 500-char prose floor used for the GitLab run, so
# the analysis path is identical and only the corpus differs.
#
# Reproducibility: each page is fetched at, and recorded with, its current
# revision id (oldid) into wm_revids.tsv. Re-running fetches the live revision,
# so like the GitLab incident-review slice this is date-bounded, not
# byte-pinned (wiki pages are editable upstream) -- the recorded revids make a
# given run auditable and byte-reproducible via oldid. Fetch date for the
# recorded run: 2026-07-11.
#
# Reproduce: bash fetch-wikimedia-incidents.sh, then
# node wikimedia-incident-validation.js
set -e

UA="Cathedral-Validation/1.0 (https://github.com/patternpartner/the-consciousness-cathedral; walkerswatch@hotmail.co.uk) research/eval"
API="https://wikitech.wikimedia.org/w/api.php"
OUT="$(dirname "$0")/data/wikimedia"
mkdir -p "$OUT"
cd "$OUT"

# --- Enumerate: all mainspace Incidents/ pages with a leading-date title -----
# Paginate allpages (apcontinue) until exhausted; keep only the date-prefixed
# incident-report convention; sort for a deterministic corpus order.
: > titles_all.txt
cont=""
while :; do
  url="$API?action=query&list=allpages&apprefix=Incidents/&aplimit=500&apnamespace=0&format=json"
  [ -n "$cont" ] && url="$url&apcontinue=$(node -e 'console.log(encodeURIComponent(process.argv[1]))' "$cont")"
  resp=$(curl -sS --max-time 60 -A "$UA" "$url")
  node -e '
    const j=JSON.parse(process.argv[1]);
    for(const p of j.query.allpages) console.log(p.title);
    if(j.continue&&j.continue.apcontinue) console.error(j.continue.apcontinue);
  ' "$resp" >> titles_all.txt 2>cont.tmp
  cont=$(cat cont.tmp)
  [ -z "$cont" ] && break
  sleep 0.2
done
# Keep only the date-prefixed incident-report convention. The regex lives in
# node (POSIX grep -E does not support \d); the leading-date `YYYYMMDD` or
# `YYYY-MM-DD` is the label.
node -e 'const rx=/^Incidents\/(\d{8}|\d{4}-\d{2}-\d{2})/;require("readline").createInterface({input:require("fs").createReadStream("titles_all.txt")}).on("line",l=>{if(rx.test(l))process.stdout.write(l+"\n")})' \
  | LC_ALL=C sort -u > titles.txt
rm -f cont.tmp
echo "incident reports enumerated: $(wc -l < titles.txt)"

# --- Fetch each report's wiki-rendered plain-text prose + revision id --------
: > wm_revids.tsv
i=0
while IFS= read -r title; do
  i=$((i+1))
  enc=$(node -e 'console.log(encodeURIComponent(process.argv[1]))' "$title")
  resp=$(curl -sS --max-time 60 -A "$UA" \
    "$API?action=query&prop=extracts|revisions&rvprop=ids&explaintext=1&exsectionformat=plain&exlimit=1&titles=$enc&format=json")
  node -e '
    const fs=require("fs");
    const j=JSON.parse(process.argv[1]);
    const idx=process.argv[2];
    const pg=Object.values(j.query.pages)[0];
    const rec={title:pg.title, revid:pg.revisions?pg.revisions[0].revid:null, extract:pg.extract||""};
    fs.writeFileSync("inc_"+idx.padStart(4,"0")+".json", JSON.stringify(rec));
    fs.appendFileSync("wm_revids.tsv", rec.revid+"\t"+rec.title+"\n");
  ' "$resp" "$i"
  sleep 0.12
done < titles.txt

echo "Wikimedia incident corpus fetched into $(pwd)"
echo "documents: $(ls inc_*.json | wc -l), revids recorded in wm_revids.tsv"

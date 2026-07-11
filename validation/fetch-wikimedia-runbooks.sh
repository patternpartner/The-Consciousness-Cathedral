#!/bin/bash
# Fetch the FRESH plan-bearing corpus for the powered G2-EXT retest
# (docs/WIKIMEDIA-RUNBOOK-VALIDATION.md). Raw data stays out of git
# (validation/data/ is .gitignored); this script makes the run reproducible.
#
# Why this corpus: the Wikimedia INCIDENT run
# (docs/WIKIMEDIA-INCIDENT-VALIDATION.md) validated the v3.17.0 density fix
# out-of-sample but left G2-EXT UNDERPOWERED (n=10 < 20) -- a retrospective-only
# corpus yields too few operational-family positives, because retrospectives
# aren't plans. The standing ask it recorded: a fresh *plan-bearing* source.
# Wikimedia SRE runbooks are exactly that -- alert thresholds bound to actions,
# escalation steps, mitigations -- and, being runbooks not postmortems, they
# are FORWARD-LOOKING. Same wiki, same provenance as the incident corpus, so
# the powered G2-EXT pools two fresh Wikimedia populations exactly as the
# GitLab run pooled incidents + runbooks to reach n=28.
#
# Population -- Wikimedia runbooks, LABELLED BY CONSTRUCTION: the union of
#   (a) mainspace members of Category:Runbooks, and
#   (b) mainspace pages whose title contains "Runbook" (intitle: search) --
# the runbook naming/categorisation convention, not an annotator's opinion.
# Deduped by title.
#
# Prose extraction and pinning are identical to fetch-wikimedia-incidents.sh:
# the wiki's own plain-text rendering (TextExtracts explaintext +
# exsectionformat=plain), each page recorded with its current revision id in
# wm_revids.tsv (date-bounded, not byte-pinned; auditable via oldid). Fetch
# date for the recorded run: 2026-07-11.
#
# Reproduce: bash fetch-wikimedia-runbooks.sh, then
# node wikimedia-runbook-validation.js
set -e

UA="Cathedral-Validation/1.0 (https://github.com/patternpartner/the-consciousness-cathedral; walkerswatch@hotmail.co.uk) research/eval"
API="https://wikitech.wikimedia.org/w/api.php"
OUT="$(dirname "$0")/data/wikimedia-runbooks"
mkdir -p "$OUT"
cd "$OUT"

# --- Enumerate: Category:Runbooks members UNION intitle:Runbook -------------
: > titles_raw.txt
# (a) category members (paginate on cmcontinue)
cont=""
while :; do
  url="$API?action=query&list=categorymembers&cmtitle=Category:Runbooks&cmlimit=500&cmtype=page&cmnamespace=0&format=json"
  [ -n "$cont" ] && url="$url&cmcontinue=$(node -e 'console.log(encodeURIComponent(process.argv[1]))' "$cont")"
  resp=$(curl -sS --max-time 60 -A "$UA" "$url")
  node -e 'const j=JSON.parse(process.argv[1]);for(const p of j.query.categorymembers)console.log(p.title);if(j.continue&&j.continue.cmcontinue)console.error(j.continue.cmcontinue);' "$resp" >> titles_raw.txt 2>cont.tmp
  cont=$(cat cont.tmp); [ -z "$cont" ] && break; sleep 0.2
done
# (b) intitle:Runbook search (paginate on sroffset). Titles must reach the
# loop's stdout (redirected to titles_raw.txt); the count goes via stderr so it
# is not captured and swallowed.
off=0
while :; do
  resp=$(curl -sS --max-time 60 -A "$UA" "$API?action=query&list=search&srsearch=intitle:Runbook&srnamespace=0&srlimit=500&sroffset=$off&format=json")
  node -e 'const j=JSON.parse(process.argv[1]);for(const p of j.query.search)console.log(p.title);console.error(j.query.search.length);' "$resp" 2>n.tmp
  n=$(cat n.tmp)
  [ "$n" -eq 0 ] && break
  off=$((off+500)); sleep 0.2
done >> titles_raw.txt
rm -f cont.tmp n.tmp
LC_ALL=C sort -u titles_raw.txt > titles.txt
echo "runbook pages enumerated (deduped): $(wc -l < titles.txt)"

# --- Fetch each runbook's wiki-rendered plain-text prose + revision id ------
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
    fs.writeFileSync("rb_"+idx.padStart(4,"0")+".json", JSON.stringify(rec));
    fs.appendFileSync("wm_revids.tsv", rec.revid+"\t"+rec.title+"\n");
  ' "$resp" "$i"
  sleep 0.12
done < titles.txt

echo "Wikimedia runbook corpus fetched into $(pwd)"
echo "documents: $(ls rb_*.json | wc -l), revids recorded in wm_revids.tsv"

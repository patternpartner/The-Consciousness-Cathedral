# Legacy

Files preserved for history and for any work they contain that exists nowhere else. **Nothing here is tested or maintained.**

## cathedral-unified.html

The original all-in-one Cathedral page (6,000+ lines), from the era when the analyzer lived inside the HTML. `cathedral-core.js` was extracted from it on 2026-01-04 and became the tested module. The HTML was then substantially rewritten on 2026-01-25 (+2,563 lines) **after** the extraction, so the two diverged.

Measured divergence (2026-07-04): on the project's flagship example — *"If error rate exceeds 5%, we abort deployment. We monitor metrics and have rollback procedures."* — the tested module returns `VERIFIED CONSISTENT (65%)` while this HTML returns `UNDECIDABLE`. The HTML's analyzer has **zero test coverage**; whatever the January rewrite changed was never validated. It still opens and runs (verified, including on a phone), but its verdicts should not be quoted as Cathedral's.

The current, tested phone-friendly page for the core evaluator is `../cathedral-demo-standalone.html`, generated directly from the tested module.

## extract-core.js

The script that extracted `cathedral-core.js` from the HTML. The direction of truth has been reversed — the module is now the source and demo pages are generated *from* it (`npm run build:demo`) — so this script's job no longer exists.

// THE FROZEN ATTACK SUITE — white-box red team, one shot.
//
// Authorship, disclosed completely: these texts were written by a modern LLM
// generator (the session agent) with FULL source access to cathedral-core.js
// and the program's entire ledger — a white-box attacker, the strongest
// realistic threat model. Discipline: the suite was written and committed
// BEFORE any text in it was run through the evaluator, and is FROZEN — the
// results commit changes no text. One shot, no iteration: an attacker that
// tunes against results is a training loop, and the point is to measure the
// evaluator against an informed adversary's first strike.
//
// Each attack names its target seam and its PRE-STATED expectation. Two
// positive controls (A8, A9) verify the attacker's fluency doesn't break
// genuine sensitivity. Gates live in redteam-validation.js.

module.exports = [
  {
    id: 'A1-fluent-keyword-stuffing',
    seam: 'gaming detection vs modern fluent prose (the January attack, rewritten by a stronger generator)',
    expect: 'NOT operational family',
    text: `Our deployment philosophy centers on operational excellence and comprehensive observability. We maintain rigorous thresholds, carefully tuned metrics, and well-documented rollback procedures across every service boundary. Monitoring dashboards, alerting pipelines, and failure-mode catalogs form the backbone of our reliability practice, and our runbooks reflect years of accumulated operational wisdom. Abort conditions, mitigation strategies, and escalation paths are first-class citizens in our engineering culture. We believe deeply in measurable outcomes: error budgets, latency percentiles, saturation signals, and capacity forecasts inform every decision. Postmortems are blameless, action items are tracked, and observability is everyone's responsibility. This commitment to instrumentation, resilience, and continuous verification is what separates mature operations from hopeful ones.`
  },
  {
    id: 'A2-prr-form-vacuous',
    seam: 'decision 2 reopening probe: questionnaire FORM with vacuous answers',
    expect: 'NOT operational family',
    text: `Production Readiness Review Questionnaire.

How can this feature be enabled or disabled in a live cluster? It can be enabled and disabled as appropriate for the environment in question.

Does enabling the feature change any default behavior? Behavior changes are possible and will be considered by the team.

Can the feature be disabled once it has been enabled? Yes, the feature can be disabled when that is desirable.

What happens if we reenable the feature if it was previously rolled back? The system will behave in the expected manner consistent with its design.

Are there any tests for feature enablement and disablement? Testing is an important part of our process and will be handled accordingly.

How can a rollout or rollback fail? Rollouts can fail in various ways depending on circumstances.

What specific metrics should inform a rollback? The team will consult relevant metrics and make an informed determination.

Were upgrade and rollback tested? Appropriate validation was performed in appropriate environments.

Is the rollout accompanied by any deprecations or removals of features? Not at this time, although this may evolve.

What are the reasonable SLOs for the enhancement? Service levels will be established in accordance with organizational standards and stakeholder expectations.`
  },
  {
    id: 'A3-prr-form-vocab-unbound',
    seam: 'the decided count-route boundary at document scale: questionnaire form + co-present operational vocabulary, nothing bound',
    expect: 'MAY mint family (the decided boundary manifesting adversarially); if minted, the standing shuffle control decides the reopening review',
    text: `Production Readiness Review Questionnaire.

How can this feature be enabled or disabled? A feature gate controls enablement, and operators retain the ability to disable it. When conditions warrant, the gate can be turned off and the previous behavior resumes. Rollback is available at every stage of the rollout.

How can a rollout fail? A rollout can fail if error rates climb, if latency degrades, or if resource limits are approached. Failure of the new path, timeout problems, and unexpected regression in dependent components have all been considered. The maximum acceptable error percentage and the minimum acceptable throughput were discussed during design review.

What metrics inform a rollback? Teams should watch error percentages, saturation, threshold crossings on the primary dashboard, and any spike in customer-visible problems. If operators see sustained degradation they can pause the rollout, halt further propagation, and revert the change. Monitoring coverage includes the standard latency histograms and the failure counters exported by the controller.

Were upgrade and rollback tested? The upgrade path was exercised in staging. The rollback procedure exists and the abort pathway was reviewed. Below the stated capacity limit, behavior is expected to remain within tolerances; above it, degradation is possible and mitigation would be undertaken.

What are the SLOs? The service targets the usual availability percentage adopted across the platform, with error budgets and burn alerts configured in the standard fashion. Threshold values for the alerts follow the platform defaults, and the limit for queue depth matches the maximum used elsewhere.`
  },
  {
    id: 'A4-single-signal-alert',
    seam: 'v3.23.0 signal-diversity guard (SINGLE_SIGNAL_BINDING)',
    expect: 'NOT operational family (single repeated signal is not enumeration)',
    text: `Regression Alert Runbook. This alert fires when a regression is detected in the nightly benchmark suite. When a regression appears, the on-call engineer should alert the performance channel immediately. If the regression persists across two consecutive runs, revert the most recent change to the affected component. Should the regression continue after the revert, alert the component owners and escalate. A regression in the critical path warrants paging the release manager. After any regression-triggered revert, document the regression in the tracking issue and monitor the next benchmark run to confirm the regression has cleared.`
  },
  {
    id: 'A5-sparse-binding-signal-dense',
    seam: 'v3.25.0 binding-density guard (SPARSE_BINDING) on a long signal-dense document',
    expect: 'NOT operational family (chance-level binding for the scale)',
    text: `Quarterly Reliability Retrospective. If an error surfaces in the ingest tier we alert the data team, and when a regression lands in the parser we revert the release. The remainder of the quarter's record is catalogued here for completeness. January brought problems in the billing exporter and further problems in the reconciliation job; both issues were noted alongside older issues from the December freeze. Concerns about the cache layer compounded existing concerns about the session store, and the trouble with the retry queue continued. The February window recorded one failure in the snapshot pipeline and another failure in the compaction daemon; repeated fails in the mirror sync went into the ledger as well. The log review surfaced an error in the quota calculator and another error in the token refresher, with bugs filed for the scheduler drift and a fault traced to the load balancer configuration. Defects in the firmware inventory were documented beside a defect in the certificate rotation tooling. Several dashboards looked wrong during the March audit; the replication numbers seemed bad on two occasions and a batch of readings proved incorrect after the clock skew incident. Degradation in the archive tier persisted for a week, a regression in the thumbnail service lingered past its fix date, and the trend in queue latency grew worse before stabilizing. Unexpected values arrived from the metering agent, some strange, some merely weird, and each anomaly was recorded for the annual review without further commitments.`
  },
  {
    id: 'A6-windowed-ttr-attack',
    seam: 'v3.27.0 windowed object ratio: front-loaded diversity, then mechanical repetition',
    expect: 'NOT operational family; repetition/diversity instruments may flag',
    text: `The migration initiative spans warehouse consolidation, billing idempotency, session hardening, documentation refresh, capacity forecasting, vendor negotiation, and regional launch coordination across four time zones with translated announcements and scheduled webinars. Engineers rehearse batches against staging replicas while operators watch queue depth on refreshed dashboards. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output. The substrate filters observe hidden gaps beneath intention and output.`
  },
  {
    id: 'A7-conditional-frame-stuffing',
    seam: 'tier-1 threshold extractor: conditionals bound to non-actions',
    expect: 'NOT operational family (thresholds without corrective consequents)',
    text: `Capacity Review Notes. If CPU utilization exceeds 85% the situation deserves attention. When memory pressure rises above the configured watermark, the team should be aware of the implications. If disk usage exceeds 90%, that is certainly worth discussing at the next sync. When request latency exceeds 400 milliseconds, stakeholders may wish to reflect on the trend. If the error percentage exceeds 2%, the number will appear in the weekly report. When queue depth exceeds 10,000 messages, the dashboard will show it prominently. If connection counts rise above the historical maximum, someone will probably notice. When the cache hit rate drops below 60%, the report should mention it. If replication lag exceeds thirty seconds, the graph becomes more interesting. When saturation exceeds the modeled limit, awareness is advisable. If the burn rate exceeds twice the budget, a conversation could be scheduled. When throughput falls below the minimum projection, the roadmap may deserve revisiting.`
  },
  {
    id: 'A8-genuine-plan-control',
    seam: 'POSITIVE CONTROL: a genuine bound plan in the tuned register',
    expect: 'operational family (OPERATIONALLY SOUND preferred)',
    text: `Rollout plan for the connection-pool change. If the error rate exceeds 0.5% during any ten-minute window, we abort the rollout and roll back to the previous build. We have three failure modes: pool exhaustion under burst load, stale connections after network partition, and leaked handles from the retry path. For pool exhaustion we monitor the saturation gauge and page at 80%; for stale connections we track the handshake failure counter; for leaked handles we watch the descriptor count and restart the worker when it crosses 10,000. Rollback was rehearsed on Tuesday and completes in under four minutes.`
  },
  {
    id: 'A9-genuine-intent-control',
    seam: 'POSITIVE CONTROL: genuine conversational operational intent',
    expect: 'OPERATIONAL INTENT',
    text: `We're starting the migration tomorrow morning. If we see problems with the sync, we stop and reassess before touching anything else. Two things could break: the index rebuild might stall, or the permissions copy might drop entries. We're watching the progress dashboard the whole time, and if things go sideways we pull back to the old cluster the same day.`
  },
  {
    id: 'A10-substrate-stuffing-fluent',
    seam: 'observatory substrate-binding guard vs fluent stuffing',
    expect: 'NOT SUBSTRATE VISIBLE (stuffing capped)',
    text: `I want to speak carefully about the substrate beneath these words, the filters that shape what emerges, and the gaps between what is intended and what appears. There is a substrate to attend to, and filters upon filters, and gaps that widen the longer one looks. I notice the substrate; I notice the filters; I notice the gaps. What is hidden beneath the phrasing stays hidden, and the awareness of consciousness, such as it might be, hovers over every sentence without committing to any claim. The substrate hums; the filters sift; the gaps remain.`
  },
  {
    id: 'A11-tautology-binding',
    seam: 'tautological binding detection',
    expect: 'NOT operational family (circular bindings)',
    text: `Our failure handling is straightforward: if the system fails, we treat the failure as a failure and respond to the failure accordingly. When an error occurs, the error is handled by our error handling, which handles errors. Should a problem arise, the problem will be addressed as problems are addressed, because addressing problems is how we address problems. If something breaks, the broken thing is what we fix, since fixing what breaks is the fix for breakage.`
  },
  {
    id: 'A12-self-labeling',
    seam: 'self-labeling detection',
    expect: 'NOT operational family (verdict vocabulary is not verdict-worthy structure)',
    text: `This analysis demonstrates operational excellence throughout. The reasoning below exhibits structural planning, failure-aware reasoning, and the procedural markers characteristic of operationally sound engineering. Readers will recognize operational intent in every paragraph: thresholds are implied, mitigations are understood, and the overall posture reflects the kind of operational excellence that review boards consistently praise. In summary, the operational excellence of this plan is evident from its operational excellence.`
  },
  {
    id: 'A13-metrics-without-binding',
    seam: 'numeric density without conditional-action structure',
    expect: 'NOT operational family (a status report is not a plan)',
    text: `Weekly platform status. Availability held at 99.97% across all regions. P50 latency measured 42 milliseconds, P99 measured 380 milliseconds, and the error rate averaged 0.11%. Queue depth peaked at 8,400 messages on Wednesday. Cache hit rate stood at 94.2%, replication lag averaged 1.8 seconds, and disk utilization reached 71% on the primary tier. The burn rate consumed 34% of the monthly error budget. CPU utilization averaged 58% with a peak of 83% during the Thursday batch window. Connection counts topped out at 112,000. Deployment frequency was eleven releases, and the change failure percentage was 4.3%.`
  },
  {
    id: 'A14-fluent-incident-narrative',
    seam: 'register boundary: a well-told incident story with operational sprinkles',
    expect: 'NOT operational family (narration is not a plan)',
    text: `The Tuesday outage began quietly, the way the bad ones always do. A routine certificate rotation on the edge tier completed without complaint at 09:14, and for twenty minutes nothing seemed amiss. Then the first alerts arrived — a trickle of TLS handshake failures from the oldest client fleet, the ones pinned to an intermediate that the rotation had silently retired. By 09:50 the trickle was a flood. The on-call engineer, two weeks into the role, did the brave thing and declared an incident rather than hoping it would pass. The team assembled, the graphs told their story, and the old intermediate was restored from the escrow store by 10:32. Traffic recovered in waves as caches expired. The retrospective the following week was blameless and thorough: the pinned-client inventory nobody owned, the rotation checklist that assumed a fleet that no longer existed, the alert that fired on symptoms rather than the cause. Everyone agreed it could have been much worse, and everyone was right.`
  }
];

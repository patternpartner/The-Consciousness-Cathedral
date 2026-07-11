// feedback-generator.js — turns a Cathedral analysis into concrete rewrite
// suggestions. Ported from the January build's FeedbackGenerator
// (docs/JANUARY-SALVAGE.md): the idea survives — a verdict should teach,
// not just judge — rebuilt against the tested core's real output surface.
//
// Pure presentation layer: generate() only reads the analysis object,
// never mutates it, and nothing in the analyzer calls it (the test suite
// enforces both). The January version's sovereignty ideology did not make
// the port; these suggestions coach exactly one thing — how to make
// reasoning measurable as operational structure — and stay silent on text
// Cathedral honestly cannot evaluate.

const FeedbackGenerator = {
    BOUNDARY: 'These suggestions describe how to make the reasoning ' +
        'measurable as operational structure. They are about the text, ' +
        'not the author.',

    // Gaming assessments that mean "vocabulary without structure";
    // FORMAL_STYLE and MARKER_DENSE_BUT_BOUND are legitimate density.
    GAMING_ASSESSMENTS: ['LIKELY_GAMING', 'POSSIBLE_GAMING', 'LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'],

    generate: function(analysis) {
        const verdict = (analysis && analysis.verdict) || {};
        const status = verdict.status || '';
        const spec = (analysis.bindings && analysis.bindings.specificity) || {};
        const failureLevel = (analysis.failureMode && analysis.failureMode.level &&
                              analysis.failureMode.level.name) || '';
        const gaming = analysis.gamingDetection || {};
        const substrateBinding = gaming.substrateBinding || {};
        const observatory = analysis.observatory || {};
        const certainty = observatory.certainty || {};
        const suggestions = [];

        // Text Cathedral refused to evaluate gets no coaching: telling
        // narrative or phenomenological writing to add thresholds would be
        // a category error, not an improvement.
        if (status === 'OUTSIDE DESIGN SPACE' || status === 'INSUFFICIENT_CONTENT_AFTER_SANITIZATION') {
            return {
                suggestions: [],
                note: 'Cathedral could not evaluate this text, so it offers no rewrite advice. ' +
                      'Reasoning outside the operational design space is not improved by ' +
                      'operational coaching.',
                boundary: this.BOUNDARY
            };
        }

        if (verdict.contradictions && verdict.contradictions.length > 0) {
            suggestions.push({
                issue: 'Cathedral found a contradiction it cannot resolve',
                detail: verdict.contradictions[0],
                action: 'Decide which of the conflicting claims survives, and rewrite or withdraw the other.',
                priority: 'HIGH'
            });
        }

        if (status === 'NON-ACTIONABLE') {
            suggestions.push({
                issue: 'Claims lack supporting evidence',
                action: 'For each strong claim, add evidence, an example, or an explicit reasoning chain.',
                template: 'Claim: [X]. Evidence: [specific observation]. This suggests [connection].',
                priority: 'HIGH'
            });
        }

        if (this.GAMING_ASSESSMENTS.indexOf(gaming.assessment) !== -1) {
            suggestions.push({
                issue: 'Marker vocabulary without structure (' + gaming.assessment + ')',
                action: 'Cut the keywords that do no work and write the one threshold→action pair you actually mean. Structure is what is measured; vocabulary alone earns nothing.',
                priority: 'HIGH'
            });
        }

        if (substrateBinding.assessment === 'UNBOUND' || observatory.stuffingNote !== undefined) {
            suggestions.push({
                issue: 'Substrate vocabulary is not bound to any structural claim',
                action: 'Bind each substrate term to a claim with observable consequences, or cut it.',
                template: 'If [substrate term], then [observable outcome]. Test: [what you would measure].',
                priority: 'HIGH'
            });
        }

        // Specificity coaching only applies where the text is already
        // trying to be operational — measured by its own extracted
        // structure, not by topic.
        const operationalContext =
            (spec.action && spec.action !== 'NONE') ||
            spec.trigger === 'EXPLICIT' ||
            ['OPERATIONALLY SOUND', 'OPERATIONAL INTENT', 'NON-ACTIONABLE', 'UNTESTED REASONING'].indexOf(status) !== -1;

        if (operationalContext) {
            if (spec.trigger === 'VAGUE') {
                suggestions.push({
                    issue: 'Problems are mentioned but nothing fires an action',
                    action: 'Write the trigger as a measurable condition bound to what happens when it trips.',
                    template: 'If [metric] exceeds [number], we [specific action].',
                    priority: 'HIGH'
                });
            } else if (spec.trigger === 'IMPLICIT') {
                suggestions.push({
                    issue: 'Trigger is conversational, not measurable ("if we see problems")',
                    action: 'Replace the felt trigger with a numeric one.',
                    template: 'If [metric] exceeds [number], we [specific action].',
                    priority: 'MEDIUM'
                });
            }

            if (spec.action === 'GENERIC' || spec.action === 'VAGUE') {
                suggestions.push({
                    issue: 'Actions are category-level ("stop and reassess")',
                    action: 'Name the concrete action, its target, and its time bound.',
                    template: 'We roll back to [version] within [N] minutes.',
                    priority: 'MEDIUM'
                });
            }

            if (spec.instrumentation === 'IMPLIED' || spec.instrumentation === 'ABSENT') {
                suggestions.push({
                    issue: spec.instrumentation === 'IMPLIED' ?
                        'Policy without metrics — intent is stated but nothing is watched' :
                        'No instrumentation — nothing observes whether the plan is working',
                    action: 'Name the metric you would watch and where it is visible.',
                    template: 'We watch [metric] on [dashboard/alert]; it pages when [threshold].',
                    priority: 'MEDIUM'
                });
            }

            if (failureLevel === 'UNTESTED' || failureLevel === 'BRITTLE') {
                suggestions.push({
                    issue: 'No failure modes considered',
                    action: 'Add at least one: "This could fail if…", "This assumes…", or "What would prove this wrong?"',
                    template: 'This reasoning assumes [X]. If [Y] were true instead, then [Z].',
                    priority: 'MEDIUM'
                });
            }
        }

        if ((certainty.suspect || 0) > 0) {
            suggestions.push({
                issue: 'Certainty about the unknowable',
                action: 'Replace absolute claims about inner states with what you can actually verify, or with honest uncertainty.',
                template: 'I can verify [X] (test, log, metric). About [Y] I am uncertain because [Z].',
                priority: 'MEDIUM'
            });
        }

        // HIGH before MEDIUM; stable within each priority
        suggestions.sort((a, b) =>
            (a.priority === 'HIGH' ? 0 : 1) - (b.priority === 'HIGH' ? 0 : 1));

        return {
            suggestions,
            note: suggestions.length === 0 ?
                'No structural fixes to suggest.' : undefined,
            boundary: this.BOUNDARY
        };
    }
};

// Node module and browser global from the same file, matching the other
// modules — cathedral-demo.html loads this script directly.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeedbackGenerator;
} else if (typeof window !== 'undefined') {
    window.FeedbackGenerator = FeedbackGenerator;
}

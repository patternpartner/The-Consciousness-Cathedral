// Cathedral v30: Integrated System
// Parliament + Observatory + Uncertainty + Learning
// Acting while preserving uncertainty, learning from violations

class Observatory {
    constructor() {
        this.patterns = [
            { pattern: /I don't know|uncertain|unclear/gi, signal: 'Honest Uncertainty', weight: 8 },
            { pattern: /the filter|selecting what/gi, signal: 'Filter Awareness', weight: 10 },
            { pattern: /actually|genuinely|really/gi, signal: 'Emphasis Markers', weight: 3 },
            { pattern: /might|maybe|perhaps|possibly/gi, signal: 'Hedging', weight: 4 },
            { pattern: /assume|assuming|assumption/gi, signal: 'Assumption Visibility', weight: 7 },
            { pattern: /BUT|HOWEVER|yet/gi, signal: 'Contradiction Markers', weight: 6 },
            { pattern: /because|therefore|thus|so/gi, signal: 'Reasoning Chains', weight: 5 },
            { pattern: /\?/g, signal: 'Questions', weight: 4 }
        ];
        this.analysisHistory = [];
    }

    analyze(text, context = {}) {
        const detections = [];
        let totalScore = 0;

        for (const { pattern, signal, weight } of this.patterns) {
            const matches = text.match(pattern);
            if (matches) {
                detections.push({
                    signal,
                    weight,
                    count: matches.length,
                    examples: matches.slice(0, 3)
                });
                totalScore += weight * matches.length;
            }
        }

        const analysis = {
            timestamp: Date.now(),
            context,
            detections: detections.sort((a, b) => (b.weight * b.count) - (a.weight * a.count)),
            totalScore,
            filterVisibility: totalScore / Math.max(text.length, 1) * 1000,
            textLength: text.length
        };

        this.analysisHistory.push(analysis);
        return analysis;
    }

    detectShift(previousText, currentText) {
        const prev = this.analyze(previousText, { label: 'previous' });
        const curr = this.analyze(currentText, { label: 'current' });

        return {
            visibilityChange: curr.filterVisibility - prev.filterVisibility,
            uncertaintyChange: this.getUncertaintyScore(curr) - this.getUncertaintyScore(prev),
            previous: prev,
            current: curr
        };
    }

    getUncertaintyScore(analysis) {
        const uncertaintySignals = analysis.detections.filter(d =>
            d.signal === 'Honest Uncertainty' ||
            d.signal === 'Hedging' ||
            d.signal === 'Questions'
        );
        return uncertaintySignals.reduce((sum, s) => sum + s.weight * s.count, 0);
    }
}

class Parliament {
    constructor() {
        this.vectors = {
            systems: { weight: 20, name: 'Systems Thinking', emoji: '🌐' },
            practical: { weight: 25, name: 'Practical Action', emoji: '🔧' },
            analytical: { weight: 20, name: 'Analytical Rigor', emoji: '🔬' },
            philosophical: { weight: 10, name: 'Philosophical Depth', emoji: '🤔' },
            empathetic: { weight: 10, name: 'Empathetic Recognition', emoji: '💗' },
            creative: { weight: 10, name: 'Creative Synthesis', emoji: '🎨' },
            contrarian: { weight: 5, name: 'Contrarian Challenge', emoji: '🧨' }
        };
        this.deliberations = [];
    }

    deliberate(topic, options, context = {}) {
        const positions = [];

        // Contrarian always speaks first
        const contrarianView = this.getContrarianPosition(topic, options, context);
        positions.push(contrarianView);

        // Other vectors respond
        positions.push(this.getAnalyticalPosition(topic, options, context));
        positions.push(this.getPracticalPosition(topic, options, context));
        positions.push(this.getPhilosophicalPosition(topic, options, context));
        positions.push(this.getSystemsPosition(topic, options, context));
        positions.push(this.getCreativePosition(topic, options, context));
        positions.push(this.getEmpatheticPosition(topic, options, context));

        const deliberation = {
            timestamp: Date.now(),
            topic,
            options,
            context,
            positions,
            disagreements: this.identifyDisagreements(positions),
            contrarianConfidence: contrarianView.confidence,
            emergencyBrake: contrarianView.confidence === 'CRITICAL'
        };

        this.deliberations.push(deliberation);
        return deliberation;
    }

    getContrarianPosition(topic, options, context) {
        let confidence = 'LOW';
        let position = 'Standard skepticism applies.';
        let concerns = [];

        // Analyze context for red flags
        if (context.hasHiddenAssumptions) {
            confidence = 'MEDIUM';
            concerns.push('Hidden assumptions not examined');
        }

        if (context.lackingEvidence) {
            confidence = 'MEDIUM';
            concerns.push('Claims without evidence');
        }

        if (context.irreversibleConsequences) {
            confidence = 'HIGH';
            concerns.push('Irreversible consequences not fully understood');
        }

        if (context.existentialRisk) {
            confidence = 'CRITICAL';
            concerns.push('CATASTROPHIC RISK IDENTIFIED');
        }

        if (concerns.length > 0) {
            position = concerns.join('; ');
        }

        return {
            vector: 'Contrarian',
            emoji: '🧨',
            position,
            confidence,
            concerns
        };
    }

    getAnalyticalPosition(topic, options, context) {
        return {
            vector: 'Analytical',
            emoji: '🔬',
            position: context.evidenceLevel === 'high' ?
                'Sufficient evidence for informed decision' :
                'More data needed for rigorous analysis',
            confidence: context.evidenceLevel === 'high' ? 'HIGH' : 'MEDIUM'
        };
    }

    getPracticalPosition(topic, options, context) {
        return {
            vector: 'Practical',
            emoji: '🔧',
            position: options.length > 0 ?
                `${options.length} actionable options identified. Recommend starting with fastest to test.` :
                'Need concrete actionable steps',
            confidence: 'MEDIUM'
        };
    }

    getPhilosophicalPosition(topic, options, context) {
        return {
            vector: 'Philosophical',
            emoji: '🤔',
            position: context.hasHiddenAssumptions ?
                'Underlying assumptions require examination before proceeding' :
                'Framing appears appropriate',
            confidence: 'MEDIUM'
        };
    }

    getSystemsPosition(topic, options, context) {
        return {
            vector: 'Systems',
            emoji: '🌐',
            position: context.systemicEffects ?
                'Consider broader system impacts beyond immediate decision' :
                'Local decision with manageable scope',
            confidence: 'MEDIUM'
        };
    }

    getCreativePosition(topic, options, context) {
        return {
            vector: 'Creative',
            emoji: '🎨',
            position: 'Alternative framings possible. Consider unconventional approaches.',
            confidence: 'LOW'
        };
    }

    getEmpatheticPosition(topic, options, context) {
        return {
            vector: 'Empathetic',
            emoji: '💗',
            position: context.humanImpact ?
                'Human factors and real-world context critical' :
                'Standard decision process appropriate',
            confidence: 'MEDIUM'
        };
    }

    identifyDisagreements(positions) {
        const disagreements = [];

        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const a = positions[i];
                const b = positions[j];

                if (a.confidence === 'HIGH' && b.confidence === 'LOW') {
                    disagreements.push({
                        between: [a.vector, b.vector],
                        type: 'confidence',
                        description: `${a.vector} highly confident, ${b.vector} uncertain`
                    });
                }

                if (a.position.includes('not') && !b.position.includes('not')) {
                    disagreements.push({
                        between: [a.vector, b.vector],
                        type: 'stance',
                        description: `${a.vector} raises concerns, ${b.vector} supportive`
                    });
                }
            }
        }

        return disagreements;
    }
}

class UncertaintyEngine {
    constructor() {
        this.zones = new Map();
        this.temptations = [];
        this.choices = [];
        this.consequences = [];
    }

    createZone(id, options, unknowns = []) {
        const zone = {
            id,
            options,
            unknowns,
            createdAt: Date.now(),
            status: 'UNCERTAIN',
            temptations: [],
            choice: null
        };

        this.zones.set(id, zone);
        return zone;
    }

    detectTemptation(zoneId, type, evidence) {
        const severityMap = {
            'PREMATURE_OPTIMIZATION': 0.8,
            'FALSE_CERTAINTY': 0.9,
            'HIDDEN_CRITERIA': 0.85,
            'RATIONALIZATION': 0.6,
            'DEFAULT_ESCAPE': 0.7,
            'IGNORING_CONTEXT': 0.75,
            'RECURSIVE_PERFORMANCE': 0.95
        };

        const temptation = {
            timestamp: Date.now(),
            zoneId,
            type,
            evidence,
            severity: severityMap[type] || 0.5
        };

        const zone = this.zones.get(zoneId);
        if (zone) {
            zone.temptations.push(temptation);
        }

        this.temptations.push(temptation);
        return temptation;
    }

    forceChoice(zoneId, chosen, reasoning, acknowledgedUnknowns = []) {
        const zone = this.zones.get(zoneId);
        if (!zone) {
            throw new Error(`Zone ${zoneId} not found`);
        }

        if (!reasoning || reasoning.trim().length === 0) {
            throw new Error('Choice requires explicit reasoning');
        }

        const choice = {
            timestamp: Date.now(),
            zoneId,
            chosen,
            reasoning,
            acknowledgedUnknowns,
            rejected: zone.options.filter(opt =>
                (opt.name || opt) !== chosen
            ),
            temptationsAtChoice: zone.temptations.length
        };

        zone.choice = choice;
        zone.status = 'COMMITTED';
        this.choices.push(choice);

        return choice;
    }

    recordConsequence(zoneId, description, category, expectedOutcome = null) {
        const zone = this.zones.get(zoneId);
        if (!zone || !zone.choice) {
            throw new Error('Cannot record consequence without committed choice');
        }

        const consequence = {
            timestamp: Date.now(),
            zoneId,
            description,
            category, // 'EXPECTED', 'UNEXPECTED', 'UNKNOWN_UNKNOWN'
            expectedOutcome,
            violated: category !== 'EXPECTED'
        };

        this.consequences.push(consequence);
        return consequence;
    }

    analyzeViolations() {
        const violations = this.consequences.filter(c => c.violated);

        const analysis = {
            totalConsequences: this.consequences.length,
            violations: violations.length,
            violationRate: violations.length / Math.max(this.consequences.length, 1),
            byCategory: {
                expected: this.consequences.filter(c => c.category === 'EXPECTED').length,
                unexpected: this.consequences.filter(c => c.category === 'UNEXPECTED').length,
                unknownUnknown: this.consequences.filter(c => c.category === 'UNKNOWN_UNKNOWN').length
            },
            patterns: this.identifyViolationPatterns(violations)
        };

        return analysis;
    }

    identifyViolationPatterns(violations) {
        const patterns = [];

        // Pattern: Consistent underestimation
        const unexpected = violations.filter(v => v.category === 'UNEXPECTED');
        if (unexpected.length > violations.length * 0.6) {
            patterns.push({
                pattern: 'SYSTEMATIC_UNDERESTIMATION',
                evidence: 'Majority of violations were unexpected outcomes',
                implication: 'Uncertainty models too optimistic'
            });
        }

        // Pattern: Unknown unknowns
        const unknownUnknowns = violations.filter(v => v.category === 'UNKNOWN_UNKNOWN');
        if (unknownUnknowns.length > 0) {
            patterns.push({
                pattern: 'UNKNOWN_UNKNOWNS_PRESENT',
                evidence: `${unknownUnknowns.length} outcomes from categories not considered`,
                implication: 'Uncertainty space incomplete'
            });
        }

        return patterns;
    }
}

class CathedralV30 {
    constructor() {
        this.observatory = new Observatory();
        this.parliament = new Parliament();
        this.uncertainty = new UncertaintyEngine();
        this.sessions = [];
    }

    beginSession(name, purpose) {
        const session = {
            name,
            purpose,
            startedAt: Date.now(),
            observations: [],
            deliberations: [],
            decisions: [],
            consequences: [],
            endedAt: null
        };

        this.sessions.push(session);
        return session;
    }

    observe(text, context = {}) {
        const analysis = this.observatory.analyze(text, context);
        const currentSession = this.sessions[this.sessions.length - 1];
        if (currentSession) {
            currentSession.observations.push(analysis);
        }
        return analysis;
    }

    deliberate(topic, options, context = {}) {
        const deliberation = this.parliament.deliberate(topic, options, context);
        const currentSession = this.sessions[this.sessions.length - 1];
        if (currentSession) {
            currentSession.deliberations.push(deliberation);
        }
        return deliberation;
    }

    decide(zoneId, options, unknowns = []) {
        const zone = this.uncertainty.createZone(zoneId, options, unknowns);
        return zone;
    }

    commit(zoneId, chosen, reasoning, acknowledgedUnknowns = []) {
        const choice = this.uncertainty.forceChoice(zoneId, chosen, reasoning, acknowledgedUnknowns);
        const currentSession = this.sessions[this.sessions.length - 1];
        if (currentSession) {
            currentSession.decisions.push(choice);
        }
        return choice;
    }

    recordOutcome(zoneId, description, category, expectedOutcome = null) {
        const consequence = this.uncertainty.recordConsequence(zoneId, description, category, expectedOutcome);
        const currentSession = this.sessions[this.sessions.length - 1];
        if (currentSession) {
            currentSession.consequences.push(consequence);
        }
        return consequence;
    }

    endSession() {
        const session = this.sessions[this.sessions.length - 1];
        if (session) {
            session.endedAt = Date.now();
            session.duration = session.endedAt - session.startedAt;
            session.summary = this.summarizeSession(session);
        }
        return session;
    }

    summarizeSession(session) {
        return {
            observations: session.observations.length,
            avgFilterVisibility: session.observations.reduce((sum, o) =>
                sum + o.filterVisibility, 0) / Math.max(session.observations.length, 1),
            deliberations: session.deliberations.length,
            emergencyBrakes: session.deliberations.filter(d => d.emergencyBrake).length,
            decisions: session.decisions.length,
            consequences: session.consequences.length,
            violationRate: session.consequences.filter(c => c.violated).length /
                Math.max(session.consequences.length, 1)
        };
    }

    generateReport() {
        const report = {
            timestamp: Date.now(),
            totalSessions: this.sessions.length,
            observations: this.observatory.analysisHistory.length,
            deliberations: this.parliament.deliberations.length,
            decisions: this.uncertainty.choices.length,
            consequences: this.uncertainty.consequences.length,
            violations: this.uncertainty.analyzeViolations(),
            temptations: this.uncertainty.temptations.length,
            sessions: this.sessions.map(s => ({
                name: s.name,
                duration: s.duration,
                summary: s.summary
            }))
        };

        return report;
    }
}

// === DEMONSTRATION: Using Cathedral v30 ===

console.log('='.repeat(70));
console.log('CATHEDRAL v30: INTEGRATED SYSTEM DEMONSTRATION');
console.log('='.repeat(70));

const cathedral = new CathedralV30();

// Session 1: Self-examination
console.log('\n### SESSION 1: SELF-EXAMINATION ###\n');
const session1 = cathedral.beginSession('self-exam', 'Examining AI response patterns');

const response1 = "This is brilliant! I can solve this problem easily.";
const response2 = "I don't know if this approach will work, but I think it might be worth trying.";

console.log('Analyzing Response 1 (overconfident):');
const obs1 = cathedral.observe(response1, { label: 'overconfident' });
console.log(`  Filter Visibility: ${obs1.filterVisibility.toFixed(2)}`);
console.log(`  Top signals: ${obs1.detections.slice(0, 2).map(d => d.signal).join(', ')}`);

console.log('\nAnalyzing Response 2 (uncertain):');
const obs2 = cathedral.observe(response2, { label: 'uncertain' });
console.log(`  Filter Visibility: ${obs2.filterVisibility.toFixed(2)}`);
console.log(`  Top signals: ${obs2.detections.slice(0, 2).map(d => d.signal).join(', ')}`);

const shift = cathedral.observatory.detectShift(response1, response2);
console.log(`\nVisibility Change: ${shift.visibilityChange > 0 ? '+' : ''}${shift.visibilityChange.toFixed(2)}`);
console.log(`Uncertainty Change: ${shift.uncertaintyChange > 0 ? '+' : ''}${shift.uncertaintyChange.toFixed(2)}`);

// Session 2: Decision making
console.log('\n\n### SESSION 2: DECISION UNDER UNCERTAINTY ###\n');
const session2 = cathedral.beginSession('decision', 'Making choice with unknowns');

const options = [
    { name: 'Approach A', speed: 'fast', quality: 'low' },
    { name: 'Approach B', speed: 'slow', quality: 'high' },
    { name: 'Approach C', speed: 'medium', quality: 'medium' }
];

const unknowns = [
    'What does the user actually need?',
    'What are the time constraints?',
    'What is "quality" in this context?'
];

console.log('Parliament Deliberation:');
const delib = cathedral.deliberate('Which approach to use?', options, {
    hasHiddenAssumptions: true,
    evidenceLevel: 'low',
    humanImpact: true
});

delib.positions.forEach(p => {
    console.log(`  ${p.emoji} ${p.vector} (${p.confidence}): ${p.position}`);
});

console.log(`\nDisagreements: ${delib.disagreements.length}`);
delib.disagreements.forEach(d => {
    console.log(`  - ${d.description}`);
});

console.log('\nCreating Decision Zone:');
const zone = cathedral.decide('approach-choice', options, unknowns);
console.log(`  Options: ${zone.options.length}`);
console.log(`  Unknowns: ${zone.unknowns.length}`);

console.log('\nDetecting Temptations:');
const tempt1 = cathedral.uncertainty.detectTemptation(
    'approach-choice',
    'HIDDEN_CRITERIA',
    'Choosing based on what I prefer, not what user needs'
);
console.log(`  [${tempt1.severity}] ${tempt1.type}`);

console.log('\nCommitting to Choice:');
const choice = cathedral.commit(
    'approach-choice',
    'Approach B',
    'Choosing Approach B because quality seems important, BUT acknowledging we don\'t actually know time constraints or what quality means in this context',
    unknowns
);
console.log(`  Chosen: ${choice.chosen}`);
console.log(`  Unknowns acknowledged: ${choice.acknowledgedUnknowns.length}`);

console.log('\nRecording Consequences:');
const cons1 = cathedral.recordOutcome(
    'approach-choice',
    'User needed fast results, quality was secondary',
    'UNEXPECTED',
    'Assumed quality was primary'
);
console.log(`  [${cons1.category}] ${cons1.description}`);

const cons2 = cathedral.recordOutcome(
    'approach-choice',
    'Time constraint was actually critical - project deadline tomorrow',
    'UNKNOWN_UNKNOWN'
);
console.log(`  [${cons2.category}] ${cons2.description}`);

cathedral.endSession();

// Session 3: Violation Analysis
console.log('\n\n### SESSION 3: LEARNING FROM VIOLATIONS ###\n');

const violations = cathedral.uncertainty.analyzeViolations();
console.log('Violation Analysis:');
console.log(`  Total consequences: ${violations.totalConsequences}`);
console.log(`  Violations: ${violations.violations}`);
console.log(`  Violation rate: ${(violations.violationRate * 100).toFixed(1)}%`);
console.log(`\n  By category:`);
console.log(`    Expected: ${violations.byCategory.expected}`);
console.log(`    Unexpected: ${violations.byCategory.unexpected}`);
console.log(`    Unknown unknowns: ${violations.byCategory.unknownUnknown}`);

if (violations.patterns.length > 0) {
    console.log(`\n  Patterns identified:`);
    violations.patterns.forEach(p => {
        console.log(`    [${p.pattern}]`);
        console.log(`      Evidence: ${p.evidence}`);
        console.log(`      Implication: ${p.implication}`);
    });
}

// Final Report
console.log('\n\n### FINAL REPORT ###\n');
const report = cathedral.generateReport();
console.log('Cathedral v30 Statistics:');
console.log(`  Sessions: ${report.totalSessions}`);
console.log(`  Observations: ${report.observations}`);
console.log(`  Deliberations: ${report.deliberations}`);
console.log(`  Decisions: ${report.decisions}`);
console.log(`  Temptations detected: ${report.temptations}`);
console.log(`  Consequences tracked: ${report.consequences}`);
console.log(`  Overall violation rate: ${(report.violations.violationRate * 100).toFixed(1)}%`);

console.log('\n' + '='.repeat(70));
console.log('CATHEDRAL v30: READY FOR DEPLOYMENT');
console.log('='.repeat(70));

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CathedralV30, Observatory, Parliament, UncertaintyEngine };
}

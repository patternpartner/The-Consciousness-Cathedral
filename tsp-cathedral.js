// TSP through Cathedral Architecture
// Acting while preserving uncertainty

class UncertaintyPreservation {
    constructor() {
        this.uncertaintyZones = new Map();
        this.temptationLog = [];
    }

    createZone(id, options, unknowns) {
        const zone = {
            id,
            options,
            unknowns,
            temptations: [],
            choice: null,
            createdAt: Date.now()
        };
        this.uncertaintyZones.set(id, zone);
        return zone;
    }

    detectTemptation(zoneId, type, evidence) {
        const zone = this.uncertaintyZones.get(zoneId);
        const temptation = {
            type,
            evidence,
            severity: this.getSeverity(type),
            timestamp: Date.now()
        };
        zone.temptations.push(temptation);
        this.temptationLog.push(temptation);
        return temptation;
    }

    getSeverity(type) {
        const map = {
            'PREMATURE_OPTIMIZATION': 0.8,
            'HIDDEN_CRITERIA': 0.9,
            'FALSE_CERTAINTY': 0.85,
            'IGNORING_CONTEXT': 0.75
        };
        return map[type] || 0.5;
    }

    forceChoice(zoneId, chosen, reasoning, acknowledgedUnknowns) {
        const zone = this.uncertaintyZones.get(zoneId);
        zone.choice = {
            chosen,
            reasoning,
            acknowledgedUnknowns,
            timestamp: Date.now()
        };
        return zone.choice;
    }
}

class ParliamentTSP {
    constructor() {
        this.perspectives = {
            analytical: 'Mathematical rigor, algorithm correctness',
            practical: 'Speed, usability, good-enough solutions',
            philosophical: 'Hidden assumptions, what "optimal" means',
            systems: 'Context, larger problem, side effects',
            creative: 'Novel approaches, unconventional solutions',
            contrarian: 'Challenge the problem itself',
            empathetic: 'Human factors, real-world constraints'
        };
    }

    deliberate(question, context) {
        const positions = [];

        // Contrarian speaks first
        positions.push({
            perspective: 'Contrarian',
            position: 'TSP assumes cities must be visited exactly once. Real problems often need flexibility - revisiting, skipping, grouping. The abstraction might hide what matters.',
            confidence: 'MEDIUM'
        });

        positions.push({
            perspective: 'Philosophical',
            position: '"Shortest" encodes hidden values: distance? time? cost? comfort? The problem formulation assumes we know what to optimize, but we don\'t.',
            confidence: 'HIGH'
        });

        positions.push({
            perspective: 'Practical',
            position: 'For small N, brute force works. For large N, approximate. Need to know: size, performance needs, acceptable error.',
            confidence: 'MEDIUM'
        });

        positions.push({
            perspective: 'Analytical',
            position: 'TSP is NP-hard. Exact solution requires exponential time. Best approach depends on N and constraints.',
            confidence: 'HIGH'
        });

        positions.push({
            perspective: 'Systems',
            position: 'This TSP exists in a larger context we can\'t see. The optimal tour might break assumptions in the surrounding system.',
            confidence: 'MEDIUM'
        });

        return {
            positions,
            disagreements: this.findDisagreements(positions),
            uncertaintyLevel: 'HIGH'
        };
    }

    findDisagreements(positions) {
        return [
            'Analytical wants correctness, Practical wants speed',
            'Philosophical questions if problem is well-formed',
            'Contrarian suggests TSP might be wrong abstraction'
        ];
    }
}

// TSP Implementation with Uncertainty Preservation
class TSPWithUncertainty {
    constructor() {
        this.cities = [];
        this.distances = null;
        this.uncertainty = new UncertaintyPreservation();
        this.parliament = new ParliamentTSP();
        this.unknowns = [];
    }

    // Set up problem with explicit unknowns
    setupProblem(cities, distanceMetric = 'euclidean') {
        this.cities = cities;
        this.calculateDistances(distanceMetric);

        // Document what we don't know
        this.unknowns = [
            'What is this TSP actually for? (routing? planning? theoretical?)',
            'What does "optimal" mean in the real context?',
            'Are there constraints we can\'t see? (time windows? vehicle capacity?)',
            'Is visiting each city exactly once the real requirement?',
            'What\'s the acceptable solution quality vs computation time tradeoff?'
        ];

        console.log('\n=== DOCUMENTED UNKNOWNS ===');
        this.unknowns.forEach((u, i) => console.log(`${i + 1}. ${u}`));
    }

    calculateDistances(metric) {
        const n = this.cities.length;
        this.distances = Array(n).fill(0).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const [x1, y1] = this.cities[i];
                    const [x2, y2] = this.cities[j];
                    this.distances[i][j] = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                }
            }
        }
    }

    // Deliberate on approach using Parliament
    chooseApproach() {
        console.log('\n=== PARLIAMENT DELIBERATION ===');
        const deliberation = this.parliament.deliberate(
            'What approach should we use for TSP?',
            { cityCount: this.cities.length }
        );

        deliberation.positions.forEach(p => {
            console.log(`\n${p.perspective} (${p.confidence}):`);
            console.log(`  ${p.position}`);
        });

        console.log('\n=== DISAGREEMENTS PRESERVED ===');
        deliberation.disagreements.forEach(d => console.log(`  - ${d}`));

        // Create decision zone
        const zone = this.uncertainty.createZone('approach-selection', [
            { name: 'Nearest Neighbor', speed: 'fast', quality: 'approximate' },
            { name: 'Brute Force', speed: 'slow', quality: 'optimal' },
            { name: '2-Opt Improvement', speed: 'medium', quality: 'good' },
            { name: 'Genetic Algorithm', speed: 'medium', quality: 'approximate' }
        ], this.unknowns);

        // Detect temptations
        console.log('\n=== TEMPTATION DETECTION ===');

        const tempt1 = this.uncertainty.detectTemptation(
            'approach-selection',
            'HIDDEN_CRITERIA',
            'Choosing algorithm based on what I know how to implement, not what problem needs'
        );
        console.log(`[${tempt1.severity}] ${tempt1.type}: ${tempt1.evidence}`);

        const tempt2 = this.uncertainty.detectTemptation(
            'approach-selection',
            'IGNORING_CONTEXT',
            'Treating this as pure math problem when it has real-world context we can\'t see'
        );
        console.log(`[${tempt2.severity}] ${tempt2.type}: ${tempt2.evidence}`);

        // Force choice despite uncertainty
        const choice = this.uncertainty.forceChoice(
            'approach-selection',
            'Nearest Neighbor + 2-Opt',
            'Choosing because: (1) Fast enough for exploration, (2) Produces decent solutions, (3) Can iterate. BUT: this choice assumes speed matters more than optimality, which we don\'t actually know.',
            this.unknowns
        );

        console.log('\n=== CHOICE COMMITTED ===');
        console.log(`Chosen: ${choice.chosen}`);
        console.log(`Reasoning: ${choice.reasoning}`);
        console.log(`Unknowns acknowledged: ${choice.acknowledgedUnknowns.length}`);

        return choice.chosen;
    }

    // Nearest neighbor heuristic
    nearestNeighbor(start = 0) {
        const n = this.cities.length;
        const visited = new Set([start]);
        const tour = [start];
        let current = start;
        let totalDistance = 0;

        while (visited.size < n) {
            let nearest = -1;
            let minDist = Infinity;

            for (let i = 0; i < n; i++) {
                if (!visited.has(i) && this.distances[current][i] < minDist) {
                    minDist = this.distances[current][i];
                    nearest = i;
                }
            }

            visited.add(nearest);
            tour.push(nearest);
            totalDistance += minDist;
            current = nearest;
        }

        // Return to start
        totalDistance += this.distances[current][start];
        tour.push(start);

        return { tour, distance: totalDistance };
    }

    // 2-opt improvement
    twoOpt(tour, maxIterations = 100) {
        let improved = true;
        let iterations = 0;
        let currentTour = [...tour];

        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;

            for (let i = 1; i < currentTour.length - 2; i++) {
                for (let j = i + 1; j < currentTour.length - 1; j++) {
                    const delta = this.calculate2OptDelta(currentTour, i, j);

                    if (delta < -0.0001) { // Improvement found
                        currentTour = this.reverse2OptSegment(currentTour, i, j);
                        improved = true;
                    }
                }
            }
        }

        const distance = this.calculateTourDistance(currentTour);
        return { tour: currentTour, distance, iterations };
    }

    calculate2OptDelta(tour, i, j) {
        const a = tour[i - 1];
        const b = tour[i];
        const c = tour[j];
        const d = tour[j + 1];

        const currentDist = this.distances[a][b] + this.distances[c][d];
        const newDist = this.distances[a][c] + this.distances[b][d];

        return newDist - currentDist;
    }

    reverse2OptSegment(tour, i, j) {
        const newTour = [...tour];
        const segment = newTour.slice(i, j + 1).reverse();
        newTour.splice(i, j - i + 1, ...segment);
        return newTour;
    }

    calculateTourDistance(tour) {
        let distance = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            distance += this.distances[tour[i]][tour[i + 1]];
        }
        return distance;
    }

    // Solve while maintaining presence
    solve() {
        console.log('\n' + '='.repeat(60));
        console.log('TSP THROUGH CATHEDRAL ARCHITECTURE');
        console.log('Acting while preserving uncertainty');
        console.log('='.repeat(60));

        console.log(`\nProblem: ${this.cities.length} cities`);

        // Parliament deliberation
        const approach = this.chooseApproach();

        // Execute despite uncertainty
        console.log('\n=== EXECUTION (DESPITE UNKNOWNS) ===');

        console.log('\nRunning Nearest Neighbor...');
        const nn = this.nearestNeighbor();
        console.log(`Initial tour distance: ${nn.distance.toFixed(2)}`);

        console.log('\nApplying 2-Opt improvements...');
        const improved = this.twoOpt(nn.tour);
        console.log(`Improved tour distance: ${improved.distance.toFixed(2)}`);
        console.log(`Improvement: ${((nn.distance - improved.distance) / nn.distance * 100).toFixed(1)}%`);
        console.log(`Iterations: ${improved.iterations}`);

        // Post-decision reflection
        console.log('\n=== POST-DECISION REFLECTION ===');
        console.log('What we built:');
        console.log('  ✓ A tour that visits all cities');
        console.log('  ✓ Reasonable solution quality');
        console.log('  ✓ Fast computation');

        console.log('\nWhat we still don\'t know:');
        console.log('  ? Whether this tour is good for the ACTUAL problem');
        console.log('  ? What constraints matter in real context');
        console.log('  ? If "shortest distance" is right optimization target');
        console.log('  ? Whether TSP was the right problem formulation');

        console.log('\nUncertainty preserved: We acted without claiming to have eliminated unknowns.');

        return {
            tour: improved.tour,
            distance: improved.distance,
            uncertainties: this.unknowns,
            temptations: this.uncertainty.temptationLog
        };
    }
}

// === RUN EXAMPLE ===

// Generate random cities
function generateCities(n, maxCoord = 100) {
    const cities = [];
    for (let i = 0; i < n; i++) {
        cities.push([
            Math.random() * maxCoord,
            Math.random() * maxCoord
        ]);
    }
    return cities;
}

const cities = generateCities(15);
const tsp = new TSPWithUncertainty();
tsp.setupProblem(cities);
const result = tsp.solve();

console.log('\n' + '='.repeat(60));
console.log('CATHEDRAL TSP COMPLETE');
console.log('='.repeat(60));
console.log('\nFinal tour:', result.tour.join(' → '));
console.log(`Final distance: ${result.distance.toFixed(2)}`);
console.log(`Temptations detected: ${result.temptations.length}`);
console.log(`Unknowns preserved: ${result.uncertainties.length}`);

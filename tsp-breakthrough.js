// TSP BREAKTHROUGH ATTEMPT
// Goal: Get within 1-2% of optimal on large instances
// Using improved algorithms + Cathedral v30 to guide exploration

const { CathedralV30 } = require('./cathedral-v30-integrated.js');

class BreakthroughTSP {
    constructor(cities) {
        this.cities = cities;
        this.n = cities.length;
        this.distances = this.calculateDistances();
        this.cathedral = new CathedralV30();
        this.bestEver = {
            tour: null,
            distance: Infinity,
            method: null
        };
        this.attemptLog = [];
    }

    calculateDistances() {
        const n = this.n;
        const dist = Array(n).fill(0).map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const [x1, y1] = this.cities[i];
                    const [x2, y2] = this.cities[j];
                    dist[i][j] = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                }
            }
        }
        return dist;
    }

    tourDistance(tour) {
        let dist = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            dist += this.distances[tour[i]][tour[i + 1]];
        }
        return dist;
    }

    updateBest(tour, distance, method) {
        if (distance < this.bestEver.distance) {
            const improvement = this.bestEver.distance === Infinity ? 0 :
                ((this.bestEver.distance - distance) / this.bestEver.distance * 100);

            this.bestEver = {
                tour: [...tour],
                distance,
                method
            };

            const msg = `✓ NEW BEST: ${distance.toFixed(4)} from ${method}` +
                       (improvement > 0 ? ` (${improvement.toFixed(2)}% improvement)` : '');
            console.log(msg);

            this.attemptLog.push({
                distance,
                method,
                timestamp: Date.now()
            });

            return true;
        }
        return false;
    }

    // IMPROVED: Nearest Neighbor with look-ahead
    nearestNeighborLookahead(start = 0, lookahead = 2) {
        const visited = new Set([start]);
        const tour = [start];
        let current = start;

        while (visited.size < this.n) {
            let best = null;
            let bestScore = Infinity;

            // Evaluate each unvisited city
            for (let next = 0; next < this.n; next++) {
                if (visited.has(next)) continue;

                // Look ahead: what's the best city after this one?
                let futureScore = 0;
                if (visited.size + 1 < this.n && lookahead > 0) {
                    let minFuture = Infinity;
                    for (let future = 0; future < this.n; future++) {
                        if (!visited.has(future) && future !== next) {
                            minFuture = Math.min(minFuture, this.distances[next][future]);
                        }
                    }
                    futureScore = minFuture;
                }

                const score = this.distances[current][next] + futureScore * 0.5;

                if (score < bestScore) {
                    bestScore = score;
                    best = next;
                }
            }

            visited.add(best);
            tour.push(best);
            current = best;
        }

        tour.push(start);
        return { tour, distance: this.tourDistance(tour) };
    }

    // IMPROVED: Lin-Kernighan heuristic (simplified version)
    // More powerful than 2-opt or 3-opt
    linKernighan(initialTour, maxIterations = 100) {
        console.log('  [Lin-Kernighan] Advanced local search...');
        let tour = [...initialTour];
        let improved = true;
        let totalImprovements = 0;

        for (let iter = 0; iter < maxIterations && improved; iter++) {
            improved = false;

            // Try k-opt moves for k=2,3,4
            for (let k = 2; k <= 4 && !improved; k++) {
                const newTour = this.bestKOptMove(tour, k);
                const newDist = this.tourDistance(newTour);
                const oldDist = this.tourDistance(tour);

                if (newDist < oldDist - 0.001) {
                    tour = newTour;
                    improved = true;
                    totalImprovements++;
                }
            }
        }

        console.log(`  [Lin-Kernighan] ${totalImprovements} improvements`);
        return { tour, distance: this.tourDistance(tour) };
    }

    bestKOptMove(tour, k) {
        // Try random k-opt moves
        const n = tour.length - 1;
        let bestTour = tour;
        let bestDist = this.tourDistance(tour);

        for (let attempt = 0; attempt < 10; attempt++) {
            // Select k random positions
            const positions = [];
            for (let i = 0; i < k; i++) {
                positions.push(1 + Math.floor(Math.random() * (n - 1)));
            }
            positions.sort((a, b) => a - b);

            // Try reconnecting segments
            const segments = [];
            for (let i = 0; i < positions.length; i++) {
                const start = i === 0 ? 0 : positions[i - 1];
                const end = positions[i];
                segments.push(tour.slice(start, end));
            }
            segments.push(tour.slice(positions[positions.length - 1]));

            // Random reconnection
            const shuffled = [...segments];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                if (Math.random() < 0.5) {
                    shuffled[i] = [...shuffled[i]].reverse();
                }
            }

            const newTour = shuffled.flat();
            const newDist = this.tourDistance(newTour);

            if (newDist < bestDist) {
                bestTour = newTour;
                bestDist = newDist;
            }
        }

        return bestTour;
    }

    // IMPROVED: Iterative improvement
    iterativeImprovement(tour, maxRounds = 10) {
        console.log('  [Iterative] Multiple improvement rounds...');
        let current = [...tour];
        let roundsImproved = 0;

        for (let round = 0; round < maxRounds; round++) {
            const before = this.tourDistance(current);

            // 2-opt
            current = this.twoOpt(current, 500).tour;

            // 3-opt (limited)
            current = this.threeOpt(current, 50).tour;

            const after = this.tourDistance(current);
            const improved = after < before - 0.001;

            if (improved) {
                roundsImproved++;
            } else {
                break; // No more improvements
            }
        }

        console.log(`  [Iterative] ${roundsImproved} rounds with improvements`);
        return { tour: current, distance: this.tourDistance(current) };
    }

    twoOpt(tour, maxIter = 1000) {
        let improved = true;
        let iter = 0;
        let current = [...tour];

        while (improved && iter < maxIter) {
            improved = false;
            iter++;

            for (let i = 1; i < current.length - 2; i++) {
                for (let j = i + 1; j < current.length - 1; j++) {
                    const delta = this.calc2OptDelta(current, i, j);
                    if (delta < -0.001) {
                        current = this.reverse2OptSegment(current, i, j);
                        improved = true;
                    }
                }
            }
        }

        return { tour: current, distance: this.tourDistance(current) };
    }

    calc2OptDelta(tour, i, j) {
        const a = tour[i - 1], b = tour[i], c = tour[j], d = tour[j + 1];
        return (this.distances[a][c] + this.distances[b][d]) -
               (this.distances[a][b] + this.distances[c][d]);
    }

    reverse2OptSegment(tour, i, j) {
        const newTour = [...tour];
        const segment = newTour.slice(i, j + 1).reverse();
        newTour.splice(i, j - i + 1, ...segment);
        return newTour;
    }

    threeOpt(tour, maxIter = 100) {
        let improved = true;
        let iter = 0;
        let current = [...tour];
        let improvements = 0;

        while (improved && iter < maxIter) {
            improved = false;
            iter++;

            for (let i = 1; i < current.length - 3; i++) {
                for (let j = i + 1; j < current.length - 2; j++) {
                    for (let k = j + 1; k < current.length - 1; k++) {
                        const newTour = this.best3OptMove(current, i, j, k);
                        const newDist = this.tourDistance(newTour);
                        const oldDist = this.tourDistance(current);

                        if (newDist < oldDist - 0.001) {
                            current = newTour;
                            improved = true;
                            improvements++;
                        }
                    }
                }
            }
        }

        return { tour: current, distance: this.tourDistance(current), improvements };
    }

    best3OptMove(tour, i, j, k) {
        const s1 = tour.slice(0, i);
        const s2 = tour.slice(i, j);
        const s3 = tour.slice(j, k);
        const s4 = tour.slice(k);

        const options = [
            [...s1, ...s2, ...s3, ...s4],
            [...s1, ...s2.reverse(), ...s3, ...s4],
            [...s1, ...s2, ...s3.reverse(), ...s4],
            [...s1, ...s3, ...s2, ...s4],
            [...s1, ...s3.reverse(), ...s2, ...s4],
            [...s1, ...s2.reverse(), ...s3.reverse(), ...s4],
            [...s1, ...s3, ...s2.reverse(), ...s4],
            [...s1, ...s3.reverse(), ...s2.reverse(), ...s4]
        ];

        return options.reduce((best, opt) =>
            this.tourDistance(opt) < this.tourDistance(best) ? opt : best
        );
    }

    // COMPREHENSIVE SOLVING STRATEGY
    solve() {
        const session = this.cathedral.beginSession('breakthrough', 'Beat 1% optimality gap');

        console.log('='.repeat(80));
        console.log('TSP BREAKTHROUGH ATTEMPT');
        console.log(`Problem: ${this.n} cities`);
        console.log('Goal: <1% from optimal');
        console.log('='.repeat(80));

        const startTime = Date.now();

        // Phase 1: Multiple construction heuristics
        console.log('\n[PHASE 1] Construction Heuristics');

        // Standard multi-start NN
        for (let start = 0; start < Math.min(this.n, 10); start++) {
            const result = this.nearestNeighborLookahead(start, 0);
            this.updateBest(result.tour, result.distance, `NN-${start}`);
        }

        // NN with lookahead
        for (let start = 0; start < Math.min(this.n, 5); start++) {
            const result = this.nearestNeighborLookahead(start, 2);
            this.updateBest(result.tour, result.distance, `NN-Lookahead-${start}`);
        }

        // Phase 2: Improvement
        console.log('\n[PHASE 2] Iterative Improvement');
        const improved = this.iterativeImprovement(this.bestEver.tour, 20);
        this.updateBest(improved.tour, improved.distance, 'Iterative');

        // Phase 3: Advanced local search
        console.log('\n[PHASE 3] Advanced Search');
        const lk = this.linKernighan(this.bestEver.tour, 200);
        this.updateBest(lk.tour, lk.distance, 'Lin-Kernighan');

        // Phase 4: Final polish
        console.log('\n[PHASE 4] Final Polish');
        const finalImprove = this.iterativeImprovement(this.bestEver.tour, 30);
        this.updateBest(finalImprove.tour, finalImprove.distance, 'Final-Polish');

        const elapsed = Date.now() - startTime;

        console.log('\n' + '='.repeat(80));
        console.log('FINAL SOLUTION');
        console.log('='.repeat(80));
        console.log(`Distance: ${this.bestEver.distance.toFixed(6)}`);
        console.log(`Method: ${this.bestEver.method}`);
        console.log(`Time: ${elapsed}ms`);
        console.log(`Improvements: ${this.attemptLog.length}`);

        this.cathedral.endSession();

        return {
            tour: this.bestEver.tour,
            distance: this.bestEver.distance,
            method: this.bestEver.method,
            timeMs: elapsed,
            improvements: this.attemptLog.length
        };
    }
}

// TEST WITH KNOWN OPTIMAL
class OptimalTSP {
    constructor(cities) {
        this.cities = cities;
        this.n = cities.length;
        this.distances = this.calculateDistances();
        this.memo = new Map();
    }

    calculateDistances() {
        const n = this.n;
        const dist = Array(n).fill(0).map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const [x1, y1] = this.cities[i];
                    const [x2, y2] = this.cities[j];
                    dist[i][j] = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                }
            }
        }
        return dist;
    }

    solveOptimal() {
        console.log(`\nComputing OPTIMAL solution (Held-Karp)...`);
        const start = 0;
        const allVisited = (1 << this.n) - 1;
        const withoutStart = allVisited ^ (1 << start);

        let minDist = Infinity;
        for (let last = 0; last < this.n; last++) {
            if (last === start) continue;
            const dist = this.tsp(withoutStart ^ (1 << last), last, start) +
                        this.distances[last][start];
            minDist = Math.min(minDist, dist);
        }

        console.log(`✓ OPTIMAL: ${minDist.toFixed(6)}`);
        return minDist;
    }

    tsp(mask, pos, start) {
        if (mask === 0) return 0;
        const key = `${mask},${pos}`;
        if (this.memo.has(key)) return this.memo.get(key);

        let minDist = Infinity;
        for (let next = 0; next < this.n; next++) {
            if (next === start) continue;
            if ((mask & (1 << next)) === 0) continue;
            const newMask = mask ^ (1 << next);
            const dist = this.distances[pos][next] + this.tsp(newMask, next, start);
            minDist = Math.min(minDist, dist);
        }

        this.memo.set(key, minDist);
        return minDist;
    }
}

// RUN TESTS
function generateCities(n, seed) {
    let x = Math.sin(seed) * 10000;
    const rand = () => {
        x = Math.sin(x) * 10000;
        return x - Math.floor(x);
    };

    const cities = [];
    for (let i = 0; i < n; i++) {
        cities.push([rand() * 100, rand() * 100]);
    }
    return cities;
}

console.log('\n\n');
console.log('█'.repeat(80));
console.log('TSP BREAKTHROUGH - Can we beat 1% optimality gap?');
console.log('█'.repeat(80));

const testCases = [
    { n: 15, seed: 100 },
    { n: 20, seed: 101 },
    { n: 25, seed: 102 }
];

for (const test of testCases) {
    console.log('\n\n' + '▓'.repeat(80));
    console.log(`TEST: ${test.n} cities`);
    console.log('▓'.repeat(80));

    const cities = generateCities(test.n, test.seed);

    // Get optimal (if feasible)
    let optimal = null;
    if (test.n <= 20) {
        const optimalSolver = new OptimalTSP(cities);
        optimal = optimalSolver.solveOptimal();
    }

    // Run breakthrough solver
    const solver = new BreakthroughTSP(cities);
    const result = solver.solve();

    if (optimal) {
        const gap = ((result.distance - optimal) / optimal * 100);
        console.log('\n' + '='.repeat(80));
        console.log('OPTIMALITY GAP');
        console.log('='.repeat(80));
        console.log(`Optimal:    ${optimal.toFixed(6)}`);
        console.log(`Heuristic:  ${result.distance.toFixed(6)}`);
        console.log(`Gap:        ${gap.toFixed(4)}%`);

        if (gap < 1.0) {
            console.log('\n✓✓✓ SUCCESS: Within 1% of optimal! ✓✓✓');
        } else if (gap < 2.0) {
            console.log('\n✓✓ GOOD: Within 2% of optimal');
        } else {
            console.log('\n✗ Need improvement: >2% from optimal');
        }
    }
}

console.log('\n\n' + '█'.repeat(80));
console.log('BREAKTHROUGH ATTEMPT COMPLETE');
console.log('█'.repeat(80));

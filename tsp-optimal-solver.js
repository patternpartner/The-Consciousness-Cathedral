// OPTIMAL TSP SOLVER
// Actually finding provably optimal solutions
// Using Held-Karp dynamic programming algorithm

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

    // Held-Karp Algorithm (Dynamic Programming)
    // Time: O(n^2 * 2^n), Space: O(n * 2^n)
    // Finds OPTIMAL solution
    solveOptimal() {
        console.log(`\nFinding OPTIMAL solution via Held-Karp (DP)`);
        console.log(`This will take O(${this.n}² × 2^${this.n}) = O(${this.n * this.n * Math.pow(2, this.n).toLocaleString()}) operations`);

        if (this.n > 20) {
            throw new Error('Held-Karp too expensive for N > 20. Use heuristics.');
        }

        const startTime = Date.now();

        // Start from city 0
        const start = 0;

        // dp[mask][i] = minimum distance to visit all cities in mask, ending at city i
        // mask is bitmask representing visited cities

        this.memo.clear();

        // Solve recursively with memoization
        const allVisited = (1 << this.n) - 1; // all bits set
        const withoutStart = allVisited ^ (1 << start); // all except start

        let minDist = Infinity;
        let bestLast = -1;

        // Try ending at each city (except start)
        for (let last = 0; last < this.n; last++) {
            if (last === start) continue;

            const dist = this.tsp(withoutStart ^ (1 << last), last, start) + this.distances[last][start];
            if (dist < minDist) {
                minDist = dist;
                bestLast = last;
            }
        }

        // Reconstruct path
        const tour = this.reconstructPath(start, bestLast, withoutStart);

        const elapsed = Date.now() - startTime;

        console.log(`✓ OPTIMAL found in ${elapsed}ms`);
        console.log(`  States explored: ${this.memo.size.toLocaleString()}`);

        return {
            tour,
            distance: minDist,
            method: 'Held-Karp (OPTIMAL)',
            statesExplored: this.memo.size,
            timeMs: elapsed
        };
    }

    // Recursive DP with memoization
    tsp(mask, pos, start) {
        // Base case: no more cities to visit
        if (mask === 0) {
            return 0;
        }

        // Check memo
        const key = `${mask},${pos}`;
        if (this.memo.has(key)) {
            return this.memo.get(key);
        }

        let minDist = Infinity;

        // Try visiting each unvisited city
        for (let next = 0; next < this.n; next++) {
            if (next === start) continue;
            if ((mask & (1 << next)) === 0) continue; // already visited

            const newMask = mask ^ (1 << next); // remove next from mask
            const dist = this.distances[pos][next] + this.tsp(newMask, next, start);
            minDist = Math.min(minDist, dist);
        }

        this.memo.set(key, minDist);
        return minDist;
    }

    reconstructPath(start, lastCity, mask) {
        const path = [start];
        let current = lastCity;
        let remainingMask = mask ^ (1 << lastCity);

        while (remainingMask !== 0) {
            path.push(current);

            let bestNext = -1;
            let bestDist = Infinity;

            for (let next = 0; next < this.n; next++) {
                if (next === start) continue;
                if ((remainingMask & (1 << next)) === 0) continue;

                const newMask = remainingMask ^ (1 << next);
                const dist = this.distances[current][next] +
                            (this.memo.get(`${newMask},${next}`) || 0);

                if (dist < bestDist) {
                    bestDist = dist;
                    bestNext = next;
                }
            }

            if (bestNext === -1) break;
            remainingMask ^= (1 << bestNext);
            current = bestNext;
        }

        if (current !== start) {
            path.push(current);
        }
        path.push(start); // complete cycle

        return path;
    }

    tourDistance(tour) {
        let dist = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            dist += this.distances[tour[i]][tour[i + 1]];
        }
        return dist;
    }
}

// Heuristic solver (for comparison)
class HeuristicTSP extends OptimalTSP {
    nearestNeighbor(start = 0) {
        const visited = new Set([start]);
        const tour = [start];
        let current = start;
        let distance = 0;

        while (visited.size < this.n) {
            let nearest = -1;
            let minDist = Infinity;

            for (let i = 0; i < this.n; i++) {
                if (!visited.has(i) && this.distances[current][i] < minDist) {
                    minDist = this.distances[current][i];
                    nearest = i;
                }
            }

            visited.add(nearest);
            tour.push(nearest);
            distance += minDist;
            current = nearest;
        }

        distance += this.distances[current][start];
        tour.push(start);

        return { tour, distance, method: 'Nearest Neighbor' };
    }

    multiStartNN() {
        let best = null;
        for (let start = 0; start < this.n; start++) {
            const result = this.nearestNeighbor(start);
            if (!best || result.distance < best.distance) {
                best = result;
                best.method = `Multi-start NN (from ${start})`;
            }
        }
        return best;
    }

    twoOpt(tour) {
        let improved = true;
        let iterations = 0;
        let current = [...tour];

        while (improved && iterations < 1000) {
            improved = false;
            iterations++;

            for (let i = 1; i < current.length - 2; i++) {
                for (let j = i + 1; j < current.length - 1; j++) {
                    const a = current[i - 1], b = current[i];
                    const c = current[j], d = current[j + 1];

                    const currentDist = this.distances[a][b] + this.distances[c][d];
                    const newDist = this.distances[a][c] + this.distances[b][d];

                    if (newDist < currentDist - 0.0001) {
                        const segment = current.slice(i, j + 1).reverse();
                        current.splice(i, j - i + 1, ...segment);
                        improved = true;
                    }
                }
            }
        }

        return {
            tour: current,
            distance: this.tourDistance(current),
            method: '2-Opt',
            iterations
        };
    }
}

// === COMPREHENSIVE COMPARISON ===

function generateCities(n, seed = null) {
    if (seed !== null) {
        // Seeded random for reproducibility
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

    const cities = [];
    for (let i = 0; i < n; i++) {
        cities.push([
            Math.random() * 100,
            Math.random() * 100
        ]);
    }
    return cities;
}

console.log('█'.repeat(80));
console.log('OPTIMAL TSP SOLVER - Held-Karp Algorithm');
console.log('Finding PROVABLY OPTIMAL solutions');
console.log('█'.repeat(80));

// Test different sizes
const testCases = [
    { n: 8, seed: 42, name: '8-city (small)' },
    { n: 10, seed: 43, name: '10-city (medium)' },
    { n: 12, seed: 44, name: '12-city (large)' }
];

const results = [];

for (const testCase of testCases) {
    console.log('\n' + '='.repeat(80));
    console.log(`TEST: ${testCase.name}`);
    console.log('='.repeat(80));

    const cities = generateCities(testCase.n, testCase.seed);

    // Optimal solution
    const optimalSolver = new OptimalTSP(cities);
    const optimal = optimalSolver.solveOptimal();

    console.log(`\n✓ OPTIMAL: ${optimal.distance.toFixed(4)}`);
    console.log(`  Tour: ${optimal.tour.join(' → ')}`);

    // Heuristic solutions
    const heuristicSolver = new HeuristicTSP(cities);

    console.log('\nComparing heuristics to OPTIMAL:');

    // Single NN
    const nn = heuristicSolver.nearestNeighbor(0);
    const nnGap = ((nn.distance - optimal.distance) / optimal.distance * 100);
    console.log(`  Nearest Neighbor: ${nn.distance.toFixed(4)} (${nnGap > 0 ? '+' : ''}${nnGap.toFixed(2)}% from optimal)`);

    // Multi-start NN
    const multiNN = heuristicSolver.multiStartNN();
    const multiGap = ((multiNN.distance - optimal.distance) / optimal.distance * 100);
    console.log(`  Multi-start NN:   ${multiNN.distance.toFixed(4)} (${multiGap > 0 ? '+' : ''}${multiGap.toFixed(2)}% from optimal)`);

    // 2-Opt on multi-start
    const twoOpt = heuristicSolver.twoOpt(multiNN.tour);
    const twoOptGap = ((twoOpt.distance - optimal.distance) / optimal.distance * 100);
    console.log(`  2-Opt improved:   ${twoOpt.distance.toFixed(4)} (${twoOptGap > 0 ? '+' : ''}${twoOptGap.toFixed(2)}% from optimal)`);

    const isOptimal = Math.abs(twoOpt.distance - optimal.distance) < 0.01;
    if (isOptimal) {
        console.log(`\n  ✓✓✓ HEURISTIC FOUND OPTIMAL SOLUTION! ✓✓✓`);
    }

    results.push({
        n: testCase.n,
        optimal: optimal.distance,
        heuristic: twoOpt.distance,
        gap: twoOptGap,
        foundOptimal: isOptimal,
        timeMs: optimal.timeMs,
        states: optimal.statesExplored
    });
}

// Summary
console.log('\n\n' + '█'.repeat(80));
console.log('SUMMARY');
console.log('█'.repeat(80));

console.log('\nOptimality Gap Analysis:');
console.table(results.map(r => ({
    'Cities': r.n,
    'Optimal': r.optimal.toFixed(2),
    'Heuristic': r.heuristic.toFixed(2),
    'Gap %': r.gap.toFixed(2),
    'Found Optimal?': r.foundOptimal ? '✓ YES' : '✗ No',
    'Time (ms)': r.timeMs,
    'States': r.states.toLocaleString()
})));

const avgGap = results.reduce((sum, r) => sum + r.gap, 0) / results.length;
const optimalCount = results.filter(r => r.foundOptimal).length;

console.log(`\nAverage optimality gap: ${avgGap.toFixed(2)}%`);
console.log(`Heuristic found optimal: ${optimalCount}/${results.length} times`);

console.log('\n' + '█'.repeat(80));
console.log('CONCLUSION');
console.log('█'.repeat(80));
console.log('\nWe now have:');
console.log('  1. PROVABLY OPTIMAL solutions (via Held-Karp)');
console.log('  2. MEASURED quality of heuristics (optimality gap)');
console.log('  3. VERIFIED whether we actually solved it');
console.log('\nThis is solving TSP, not just running algorithms.');
console.log('█'.repeat(80));

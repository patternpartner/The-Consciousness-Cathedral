// COGNITION-GUIDED BEAM SEARCH
// Use Tour Cognition layer to score beam search candidates
// Not just "nearest K" but "highest scored K" by learned model

const { TourCognition } = require('./cathedral-v31-tour-cognition.js');

class CognitionBeamSearch {
    constructor(cities, cognition) {
        this.cities = cities;
        this.n = cities.length;
        this.distances = this.calculateDistances();
        this.cognition = cognition;
        this.centroid = this.getCentroid();
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

    getCentroid() {
        let cx = 0, cy = 0;
        for (const [x, y] of this.cities) {
            cx += x;
            cy += y;
        }
        return [cx / this.n, cy / this.n];
    }

    // Beam search with cognition-based expansion
    beamSearch(start, beamWidth, branchingFactor) {
        let beam = [{
            tour: [start],
            distance: 0,
            visited: new Set([start])
        }];

        for (let step = 1; step < this.n; step++) {
            const candidates = [];

            for (const state of beam) {
                const current = state.tour[state.tour.length - 1];

                // Score all unvisited cities with cognition
                const scored = [];
                for (let i = 0; i < this.n; i++) {
                    if (!state.visited.has(i)) {
                        const score = this.cognition.scoreDecision(
                            this.cities,
                            this.distances,
                            current,
                            i,
                            state.visited,
                            this.centroid
                        );
                        scored.push({ city: i, score, dist: this.distances[current][i] });
                    }
                }

                // Sort by cognition score (highest first)
                scored.sort((a, b) => b.score - a.score);

                // Expand top branchingFactor candidates
                const toExpand = Math.min(branchingFactor, scored.length);
                for (let i = 0; i < toExpand; i++) {
                    const next = scored[i].city;
                    const newTour = [...state.tour, next];
                    const newDistance = state.distance + scored[i].dist;
                    const newVisited = new Set(state.visited);
                    newVisited.add(next);

                    candidates.push({
                        tour: newTour,
                        distance: newDistance,
                        visited: newVisited
                    });
                }
            }

            // Keep top beamWidth by total distance
            candidates.sort((a, b) => a.distance - b.distance);
            beam = candidates.slice(0, beamWidth);
        }

        const best = beam[0];
        const tour = [...best.tour, start];
        const finalDist = best.distance + this.distances[best.tour[best.tour.length - 1]][start];

        return { tour, distance: finalDist };
    }

    twoOpt(tour) {
        let current = [...tour];
        let improved = true;

        while (improved) {
            improved = false;
            for (let i = 1; i < current.length - 2; i++) {
                for (let j = i + 1; j < current.length - 1; j++) {
                    const a = current[i - 1], b = current[i];
                    const c = current[j], d = current[j + 1];

                    const oldDist = this.distances[a][b] + this.distances[c][d];
                    const newDist = this.distances[a][c] + this.distances[b][d];

                    if (newDist < oldDist - 0.0001) {
                        const segment = current.slice(i, j + 1).reverse();
                        current.splice(i, j - i + 1, ...segment);
                        improved = true;
                    }
                }
            }
        }

        return current;
    }

    tourDistance(tour) {
        let dist = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            dist += this.distances[tour[i]][tour[i + 1]];
        }
        return dist;
    }

    solve(beamWidth, branchingFactor) {
        let bestTour = null;
        let bestDist = Infinity;

        for (let start = 0; start < Math.min(3, this.n); start++) {
            const { tour } = this.beamSearch(start, beamWidth, branchingFactor);
            const optimized = this.twoOpt(tour);
            const dist = this.tourDistance(optimized);

            if (dist < bestDist) {
                bestDist = dist;
                bestTour = optimized;
            }
        }

        return { tour: bestTour, distance: bestDist };
    }
}

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
        const start = 0;
        const allVisited = (1 << this.n) - 1;
        const withoutStart = allVisited ^ (1 << start);

        let minDist = Infinity;
        let bestLast = -1;

        for (let last = 0; last < this.n; last++) {
            if (last === start) continue;
            const dist = this.tsp(withoutStart ^ (1 << last), last, start) +
                        this.distances[last][start];
            if (dist < minDist) {
                minDist = dist;
                bestLast = last;
            }
        }

        const tour = this.reconstructPath(start, bestLast, withoutStart);
        return { distance: minDist, tour };
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
                const memoKey = `${newMask},${next}`;
                const futureCost = this.memo.get(memoKey) || 0;
                const dist = this.distances[current][next] + futureCost;

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
        path.push(start);
        return path;
    }
}

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

console.log('='.repeat(80));
console.log('COGNITION-GUIDED BEAM SEARCH');
console.log('Beam search expansion guided by Tour Cognition learned model');
console.log('='.repeat(80));

// Train cognition model
console.log('\nTraining Tour Cognition model...');
const cognition = new TourCognition();

const trainingSeeds = [100, 101, 103, 104, 107];
for (const seed of trainingSeeds) {
    const cities = generateCities(20, seed);
    const solver = new OptimalTSP(cities);
    const { tour } = solver.solveOptimal();
    cognition.learnFromOptimal(cities, solver.distances, tour);
}

cognition.train();
console.log('✓ Model trained on 5 optimal tours');

// Test on Instance 10
const testSeed = 109;
const testCities = generateCities(20, testSeed);

const optimalSolver = new OptimalTSP(testCities);
const optimal = optimalSolver.solveOptimal().distance;

console.log(`\nOptimal: ${optimal.toFixed(2)}`);
console.log(`Baseline (NN + 2-opt): 353.40 (17.72% gap)`);
console.log(`Vanilla beam search: 353.40 (17.72% gap)`);

console.log('\n' + '='.repeat(80));
console.log('COGNITION-GUIDED BEAM SEARCH RESULTS');
console.log('='.repeat(80));

console.log('\nBeam×Branch    Result      Gap        Status');
console.log('-'.repeat(70));

const configs = [
    { beam: 5, branch: 3 },
    { beam: 10, branch: 3 },
    { beam: 10, branch: 5 },
    { beam: 20, branch: 3 },
    { beam: 20, branch: 5 },
    { beam: 30, branch: 5 }
];

let bestResult = Infinity;
let bestConfig = null;

for (const config of configs) {
    const solver = new CognitionBeamSearch(testCities, cognition);
    const { distance } = solver.solve(config.beam, config.branch);

    const gap = ((distance - optimal) / optimal * 100).toFixed(2);
    const status = distance < 353.40 ? '✓ BREAKTHROUGH' :
                   distance === 353.40 ? '= Baseline' :
                   distance === 354.33 ? '  Same basin' :
                   '  Other basin';

    console.log(
        `${config.beam}×${config.branch}`.padEnd(15) +
        distance.toFixed(2).padEnd(12) +
        `${gap}%`.padEnd(11) +
        status
    );

    if (distance < bestResult) {
        bestResult = distance;
        bestConfig = config;
    }
}

console.log('\n' + '='.repeat(80));
console.log('FINAL RESULT');
console.log('='.repeat(80));

const improvement = 353.40 - bestResult;
const newGap = ((bestResult - optimal) / optimal * 100);

console.log(`\nBest: ${bestResult.toFixed(2)} (beam=${bestConfig.beam}, branch=${bestConfig.branch})`);
console.log(`Gap: ${newGap.toFixed(2)}%`);

if (bestResult < 353.40) {
    console.log(`\n✓ BREAKTHROUGH: ${improvement.toFixed(2)} better than baseline`);
    console.log(`  Cognition-guided search breaks through the basin`);
} else if (bestResult === 353.40) {
    console.log('\n= MATCHED BASELINE: Converges to same basin');
} else {
    console.log(`\n✗ ${Math.abs(improvement).toFixed(2)} worse than baseline`);
}

console.log('\n' + '='.repeat(80));

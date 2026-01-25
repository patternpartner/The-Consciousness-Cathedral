// BEAM SEARCH TSP
// Keep top K partial tours, explore non-greedy branches
// Naturally discovers strategic deviations without knowing WHERE to deviate

class BeamSearchTSP {
    constructor(cities) {
        this.cities = cities;
        this.n = cities.length;
        this.distances = this.calculateDistances();
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

    // Beam search with beam width K
    beamSearch(start, beamWidth, branchingFactor) {
        // State: { tour: [cities visited], distance: total so far, visited: Set }
        let beam = [{
            tour: [start],
            distance: 0,
            visited: new Set([start])
        }];

        // Build tour step by step
        for (let step = 1; step < this.n; step++) {
            const candidates = [];

            // Expand each state in beam
            for (const state of beam) {
                const current = state.tour[state.tour.length - 1];

                // Get nearest unvisited cities
                const neighbors = [];
                for (let i = 0; i < this.n; i++) {
                    if (!state.visited.has(i)) {
                        neighbors.push({ city: i, dist: this.distances[current][i] });
                    }
                }

                neighbors.sort((a, b) => a.dist - b.dist);

                // Try top branchingFactor neighbors
                const toTry = Math.min(branchingFactor, neighbors.length);
                for (let i = 0; i < toTry; i++) {
                    const next = neighbors[i].city;
                    const newTour = [...state.tour, next];
                    const newDistance = state.distance + neighbors[i].dist;
                    const newVisited = new Set(state.visited);
                    newVisited.add(next);

                    candidates.push({
                        tour: newTour,
                        distance: newDistance,
                        visited: newVisited
                    });
                }
            }

            // Keep top beamWidth candidates
            candidates.sort((a, b) => a.distance - b.distance);
            beam = candidates.slice(0, beamWidth);
        }

        // Close the best tour
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

    solve(beamWidth = 5, branchingFactor = 3) {
        let bestTour = null;
        let bestDist = Infinity;

        // Try from multiple starting cities
        const starts = Math.min(5, this.n);
        for (let start = 0; start < starts; start++) {
            const { tour, distance } = this.beamSearch(start, beamWidth, branchingFactor);
            const optimized = this.twoOpt(tour);
            const optDist = this.tourDistance(optimized);

            if (optDist < bestDist) {
                bestDist = optDist;
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
        for (let last = 0; last < this.n; last++) {
            if (last === start) continue;
            const dist = this.tsp(withoutStart ^ (1 << last), last, start) +
                        this.distances[last][start];
            minDist = Math.min(minDist, dist);
        }

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
console.log('BEAM SEARCH TSP');
console.log('Can exploration of non-greedy paths break through 17.72% barrier?');
console.log('='.repeat(80));

const seed = 109;
const cities = generateCities(20, seed);

const optimalSolver = new OptimalTSP(cities);
const optimal = optimalSolver.solveOptimal();

console.log(`\nOptimal: ${optimal.toFixed(2)}`);
console.log('\nBaseline (NN + 2-opt): 353.40 (17.72% gap)');

console.log('\n' + '='.repeat(80));
console.log('BEAM SEARCH CONFIGURATIONS');
console.log('='.repeat(80));

console.log('\nBeam×Branch    Result      Gap        Time');
console.log('-'.repeat(60));

const configs = [
    { beam: 3, branch: 2 },
    { beam: 5, branch: 2 },
    { beam: 5, branch: 3 },
    { beam: 10, branch: 3 },
    { beam: 10, branch: 5 },
    { beam: 20, branch: 3 },
    { beam: 20, branch: 5 }
];

for (const config of configs) {
    const solver = new BeamSearchTSP(cities);
    const startTime = Date.now();
    const { distance } = solver.solve(config.beam, config.branch);
    const endTime = Date.now();

    const gap = ((distance - optimal) / optimal * 100).toFixed(2);
    const time = (endTime - startTime);

    const improvement = distance < 353.40 ? '✓' : ' ';
    console.log(
        `${improvement} ${config.beam}×${config.branch}`.padEnd(15) +
        distance.toFixed(2).padEnd(12) +
        `${gap}%`.padEnd(11) +
        `${time}ms`
    );
}

console.log('\n' + '='.repeat(80));

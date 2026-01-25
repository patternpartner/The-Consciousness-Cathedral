// NON-GREEDY CONSTRUCTION HEURISTICS
// Building tours with GLOBAL awareness, not just local greedy choices

class NonGreedyTSP {
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

    tourDistance(tour) {
        let dist = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            dist += this.distances[tour[i]][tour[i + 1]];
        }
        return dist;
    }

    // METHOD 1: Savings Algorithm (Clarke-Wright)
    // Looks at PAIRS of connections and their combined savings
    // Not purely greedy - considers interaction between edges
    savingsAlgorithm() {
        const start = 0;

        // Initial: Each city connected directly to/from depot
        const routes = [];
        for (let i = 1; i < this.n; i++) {
            routes.push([start, i, start]);
        }

        // Calculate savings for merging each pair of routes
        const savings = [];
        for (let i = 1; i < this.n; i++) {
            for (let j = i + 1; j < this.n; j++) {
                // Savings = dist(i,0) + dist(0,j) - dist(i,j)
                const save = this.distances[i][start] + this.distances[start][j] - this.distances[i][j];
                savings.push({ i, j, save });
            }
        }

        savings.sort((a, b) => b.save - a.save);

        // Merge routes based on savings
        for (const { i, j } of savings) {
            // Find routes containing i and j
            let routeI = -1, routeJ = -1;
            for (let r = 0; r < routes.length; r++) {
                if (routes[r].includes(i)) routeI = r;
                if (routes[r].includes(j)) routeJ = r;
            }

            if (routeI === routeJ || routeI === -1 || routeJ === -1) continue;

            // Check if they can be merged (i or j at ends)
            const rI = routes[routeI];
            const rJ = routes[routeJ];

            if ((rI[rI.length - 2] === i && rJ[1] === j) ||
                (rI[1] === i && rJ[rJ.length - 2] === j)) {
                // Merge routes
                const merged = rI[1] === i ?
                    [...rI.slice(0, -1), ...rJ.slice(1)] :
                    [...rJ.slice(0, -1), ...rI.slice(1)];
                routes.splice(Math.max(routeI, routeJ), 1);
                routes.splice(Math.min(routeI, routeJ), 1);
                routes.push(merged);
            }
        }

        return routes.length > 0 ? routes[0] : [start, ...Array.from({length: this.n - 1}, (_, i) => i + 1), start];
    }

    // METHOD 2: Cheapest Insertion
    // Builds tour gradually, inserting where total increase is smallest
    // Considers global tour structure, not just nearest neighbor
    cheapestInsertion() {
        const unvisited = new Set(Array.from({length: this.n}, (_, i) => i));

        // Start with farthest pair
        let maxDist = 0, start = 0, second = 1;
        for (let i = 0; i < this.n; i++) {
            for (let j = i + 1; j < this.n; j++) {
                if (this.distances[i][j] > maxDist) {
                    maxDist = this.distances[i][j];
                    start = i;
                    second = j;
                }
            }
        }

        const tour = [start, second, start];
        unvisited.delete(start);
        unvisited.delete(second);

        while (unvisited.size > 0) {
            let bestCity = -1;
            let bestPosition = -1;
            let bestIncrease = Infinity;

            // For each unvisited city
            for (const city of unvisited) {
                // Try inserting at each position in tour
                for (let pos = 1; pos < tour.length; pos++) {
                    const prev = tour[pos - 1];
                    const next = tour[pos];

                    // Cost increase = dist(prev,city) + dist(city,next) - dist(prev,next)
                    const increase = this.distances[prev][city] +
                                    this.distances[city][next] -
                                    this.distances[prev][next];

                    if (increase < bestIncrease) {
                        bestIncrease = increase;
                        bestCity = city;
                        bestPosition = pos;
                    }
                }
            }

            tour.splice(bestPosition, 0, bestCity);
            unvisited.delete(bestCity);
        }

        return tour;
    }

    // METHOD 3: Farthest Insertion
    // Like cheapest, but selects farthest city from tour
    // More exploration, less greedy
    farthestInsertion() {
        const unvisited = new Set(Array.from({length: this.n}, (_, i) => i));

        // Start with farthest pair
        let maxDist = 0, start = 0, second = 1;
        for (let i = 0; i < this.n; i++) {
            for (let j = i + 1; j < this.n; j++) {
                if (this.distances[i][j] > maxDist) {
                    maxDist = this.distances[i][j];
                    start = i;
                    second = j;
                }
            }
        }

        const tour = [start, second, start];
        unvisited.delete(start);
        unvisited.delete(second);

        while (unvisited.size > 0) {
            // Find city FARTHEST from tour
            let farthestCity = -1;
            let maxMinDist = -1;

            for (const city of unvisited) {
                let minDistToTour = Infinity;
                for (let i = 0; i < tour.length - 1; i++) {
                    minDistToTour = Math.min(minDistToTour, this.distances[city][tour[i]]);
                }
                if (minDistToTour > maxMinDist) {
                    maxMinDist = minDistToTour;
                    farthestCity = city;
                }
            }

            // Insert at position with minimum increase
            let bestPosition = -1;
            let bestIncrease = Infinity;

            for (let pos = 1; pos < tour.length; pos++) {
                const prev = tour[pos - 1];
                const next = tour[pos];
                const increase = this.distances[prev][farthestCity] +
                                this.distances[farthestCity][next] -
                                this.distances[prev][next];

                if (increase < bestIncrease) {
                    bestIncrease = increase;
                    bestPosition = pos;
                }
            }

            tour.splice(bestPosition, 0, farthestCity);
            unvisited.delete(farthestCity);
        }

        return tour;
    }

    // METHOD 4: Convex Hull + Insertion
    // Start with outer boundary, insert interior points
    // Respects global geometric structure
    convexHullInsertion() {
        // Find convex hull
        const hull = this.convexHull();

        if (hull.length === this.n) {
            // All points on hull
            return [...hull, hull[0]];
        }

        const inTour = new Set(hull);
        const tour = [...hull, hull[0]];

        // Insert remaining points
        const unvisited = new Set();
        for (let i = 0; i < this.n; i++) {
            if (!inTour.has(i)) unvisited.add(i);
        }

        while (unvisited.size > 0) {
            let bestCity = -1;
            let bestPosition = -1;
            let bestIncrease = Infinity;

            for (const city of unvisited) {
                for (let pos = 1; pos < tour.length; pos++) {
                    const prev = tour[pos - 1];
                    const next = tour[pos];
                    const increase = this.distances[prev][city] +
                                    this.distances[city][next] -
                                    this.distances[prev][next];

                    if (increase < bestIncrease) {
                        bestIncrease = increase;
                        bestCity = city;
                        bestPosition = pos;
                    }
                }
            }

            tour.splice(bestPosition, 0, bestCity);
            unvisited.delete(bestCity);
        }

        return tour;
    }

    convexHull() {
        // Graham scan
        const points = this.cities.map((c, i) => ({ x: c[0], y: c[1], idx: i }));

        // Find lowest point
        points.sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
        const start = points[0];

        // Sort by polar angle
        const polar = points.slice(1).map(p => ({
            ...p,
            angle: Math.atan2(p.y - start.y, p.x - start.x)
        }));
        polar.sort((a, b) => a.angle - b.angle);

        const hull = [start.idx];

        for (const p of polar) {
            while (hull.length >= 2) {
                const b = hull[hull.length - 1];
                const a = hull[hull.length - 2];

                const cross = (this.cities[b][0] - this.cities[a][0]) * (p.y - this.cities[a][1]) -
                             (this.cities[b][1] - this.cities[a][1]) * (p.x - this.cities[a][0]);

                if (cross <= 0) {
                    hull.pop();
                } else {
                    break;
                }
            }
            hull.push(p.idx);
        }

        return hull;
    }

    // Apply 2-opt to any tour
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

    // Test all methods
    solveAll() {
        const methods = [
            { name: 'Savings (Clarke-Wright)', fn: () => this.savingsAlgorithm() },
            { name: 'Cheapest Insertion', fn: () => this.cheapestInsertion() },
            { name: 'Farthest Insertion', fn: () => this.farthestInsertion() },
            { name: 'Convex Hull + Insertion', fn: () => this.convexHullInsertion() }
        ];

        const results = [];

        for (const method of methods) {
            const tour = method.fn();
            const rawDist = this.tourDistance(tour);
            const optimized = this.twoOpt(tour);
            const optDist = this.tourDistance(optimized);

            results.push({
                name: method.name,
                rawDistance: rawDist,
                optimizedDistance: optDist,
                improvement: ((rawDist - optDist) / rawDist * 100)
            });
        }

        return results;
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
console.log('NON-GREEDY CONSTRUCTION HEURISTICS');
console.log('Testing methods that consider GLOBAL structure');
console.log('='.repeat(80));

// Test on Instance 10 (seed 109) - our hardest instance (17.72% gap)
const seed = 109;
const cities = generateCities(20, seed);

const solver = new NonGreedyTSP(cities);
const results = solver.solveAll();

const optimalSolver = new OptimalTSP(cities);
const optimal = optimalSolver.solveOptimal();

console.log(`\nOptimal: ${optimal.toFixed(2)}\n`);

console.log('Method'.padEnd(30) + 'Raw'.padEnd(12) + 'After 2-opt'.padEnd(12) + 'Gap'.padEnd(10) + 'Improvement');
console.log('-'.repeat(80));

for (const result of results) {
    const gap = ((result.optimizedDistance - optimal) / optimal * 100).toFixed(2);
    console.log(
        result.name.padEnd(30) +
        result.rawDistance.toFixed(2).padEnd(12) +
        result.optimizedDistance.toFixed(2).padEnd(12) +
        `${gap}%`.padEnd(10) +
        `${result.improvement.toFixed(2)}%`
    );
}

console.log('\n' + '='.repeat(80));
console.log('COMPARISON TO BASELINE');
console.log('='.repeat(80));

// Baseline: Nearest Neighbor + 2-opt
const baseline = 353.40;
const baselineGap = ((baseline - optimal) / optimal * 100);

console.log(`\nBaseline (NN + 2-opt): ${baseline.toFixed(2)} (${baselineGap.toFixed(2)}% gap)`);

const bestNonGreedy = Math.min(...results.map(r => r.optimizedDistance));
const bestGap = ((bestNonGreedy - optimal) / optimal * 100);
const improvement = ((baseline - bestNonGreedy) / baseline * 100);

console.log(`Best non-greedy:       ${bestNonGreedy.toFixed(2)} (${bestGap.toFixed(2)}% gap)`);

if (bestNonGreedy < baseline) {
    console.log(`\n✓ IMPROVEMENT: ${improvement.toFixed(2)}% better than baseline`);
} else {
    console.log(`\n✗ NO IMPROVEMENT: Non-greedy methods converge to same basin`);
}

console.log('\n' + '='.repeat(80));

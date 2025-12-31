// SPIRAL CONSTRUCTION HEURISTIC
// Build tour following angular progression around centroid
// Mimics optimal tour's SPIRAL pattern

class SpiralTSP {
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

    // Find geometric centroid
    getCentroid() {
        let cx = 0, cy = 0;
        for (const [x, y] of this.cities) {
            cx += x;
            cy += y;
        }
        return [cx / this.n, cy / this.n];
    }

    // Sort cities by angle from centroid
    angularSort(centerX, centerY) {
        const angles = this.cities.map((city, idx) => {
            const [x, y] = city;
            const angle = Math.atan2(y - centerY, x - centerX);
            return { idx, angle };
        });

        angles.sort((a, b) => a.angle - b.angle);
        return angles.map(a => a.idx);
    }

    // Construct tour by angular progression
    spiralConstruction() {
        const [cx, cy] = this.getCentroid();
        const angularOrder = this.angularSort(cx, cy);

        // Tour follows angular order
        const tour = [...angularOrder, angularOrder[0]];
        return tour;
    }

    // Variant: Start from specific angle
    spiralFromStart(startIdx) {
        const [cx, cy] = this.getCentroid();

        // Get all cities with angles
        const cityAngles = this.cities.map((city, idx) => {
            const [x, y] = city;
            const angle = Math.atan2(y - cy, x - cx);
            return { idx, angle };
        });

        // Find start city angle
        const startAngle = cityAngles[startIdx].angle;

        // Sort by angle relative to start
        const relativeAngles = cityAngles.map(ca => {
            let relAngle = ca.angle - startAngle;
            if (relAngle < 0) relAngle += 2 * Math.PI;
            return { ...ca, relAngle };
        });

        relativeAngles.sort((a, b) => a.relAngle - b.relAngle);
        const tour = relativeAngles.map(a => a.idx);
        tour.push(tour[0]);

        return tour;
    }

    // Variant: Weighted by both angle AND distance
    // Prefer angular progression but don't ignore proximity
    weightedSpiral() {
        const [cx, cy] = this.getCentroid();

        // Start from city closest to centroid
        let start = 0;
        let minDist = Infinity;
        for (let i = 0; i < this.n; i++) {
            const [x, y] = this.cities[i];
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (dist < minDist) {
                minDist = dist;
                start = i;
            }
        }

        const visited = new Set([start]);
        const tour = [start];
        let current = start;

        while (visited.size < this.n) {
            const [currX, currY] = this.cities[current];
            const currAngle = Math.atan2(currY - cy, currX - cx);

            let best = -1;
            let bestScore = -Infinity;

            for (let i = 0; i < this.n; i++) {
                if (visited.has(i)) continue;

                const [x, y] = this.cities[i];
                const angle = Math.atan2(y - cy, x - cx);

                // Angular distance (prefer counter-clockwise progression)
                let angleDelta = angle - currAngle;
                if (angleDelta < 0) angleDelta += 2 * Math.PI;

                // Euclidean distance
                const euclidean = this.distances[current][i];

                // Score: prefer small angle jump AND small distance
                // Normalize both to 0-1 range roughly
                const angleScore = 1 - (angleDelta / (2 * Math.PI)); // Higher for smaller angle jumps
                const distScore = 1 / (1 + euclidean / 10); // Higher for closer cities

                // Weighted combination
                const score = 0.7 * angleScore + 0.3 * distScore;

                if (score > bestScore) {
                    bestScore = score;
                    best = i;
                }
            }

            visited.add(best);
            tour.push(best);
            current = best;
        }

        tour.push(start);
        return tour;
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

    solve() {
        const methods = [
            { name: 'Pure Angular Sort', fn: () => this.spiralConstruction() },
            { name: 'Weighted Angular + Distance', fn: () => this.weightedSpiral() }
        ];

        const results = [];

        for (const method of methods) {
            const tour = method.fn();
            const rawDist = this.tourDistance(tour);
            const optimized = this.twoOpt(tour);
            const optDist = this.tourDistance(optimized);

            results.push({
                name: method.name,
                tour,
                rawDistance: rawDist,
                optimizedDistance: optDist,
                improvement: ((rawDist - optDist) / rawDist * 100)
            });
        }

        // Also try from multiple starting angles
        for (let start = 0; start < Math.min(5, this.n); start++) {
            const tour = this.spiralFromStart(start);
            const rawDist = this.tourDistance(tour);
            const optimized = this.twoOpt(tour);
            const optDist = this.tourDistance(optimized);

            results.push({
                name: `Spiral from city ${start}`,
                tour,
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
console.log('SPIRAL CONSTRUCTION HEURISTIC');
console.log('Mimicking optimal tour\'s angular progression pattern');
console.log('='.repeat(80));

const seed = 109;
const cities = generateCities(20, seed);

const optimalSolver = new OptimalTSP(cities);
const optimal = optimalSolver.solveOptimal();

const solver = new SpiralTSP(cities);
const results = solver.solve();

console.log(`\nOptimal: ${optimal.toFixed(2)}`);
console.log(`Baseline (NN + 2-opt): 353.40 (17.72% gap)\n`);

console.log('Method'.padEnd(35) + 'Raw'.padEnd(12) + 'After 2-opt'.padEnd(12) + 'Gap'.padEnd(10));
console.log('-'.repeat(80));

let bestResult = null;
let bestDist = Infinity;

for (const result of results) {
    const gap = ((result.optimizedDistance - optimal) / optimal * 100).toFixed(2);

    const improvement = result.optimizedDistance < 353.40 ? '✓ ' : '  ';
    console.log(
        improvement +
        result.name.padEnd(33) +
        result.rawDistance.toFixed(2).padEnd(12) +
        result.optimizedDistance.toFixed(2).padEnd(12) +
        `${gap}%`
    );

    if (result.optimizedDistance < bestDist) {
        bestDist = result.optimizedDistance;
        bestResult = result;
    }
}

console.log('\n' + '='.repeat(80));
console.log('RESULT');
console.log('='.repeat(80));

const improvement = 353.40 - bestDist;
const improvementPct = (improvement / 353.40 * 100);
const newGap = ((bestDist - optimal) / optimal * 100);

console.log(`\nBest spiral method: ${bestResult.name}`);
console.log(`Distance: ${bestDist.toFixed(2)} (${newGap.toFixed(2)}% gap)`);

if (bestDist < 353.40) {
    console.log(`\n✓ BREAKTHROUGH: ${improvement.toFixed(2)} better than baseline`);
    console.log(`  ${improvementPct.toFixed(2)}% improvement`);
    console.log('  Spiral pattern recognition WORKED');
} else {
    console.log('\n✗ NO IMPROVEMENT: Spiral heuristic converges to same basin');
    console.log('  Pattern alone insufficient - need additional mechanism');
}

console.log('\n' + '='.repeat(80));

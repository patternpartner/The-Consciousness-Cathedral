// CATHEDRAL SYNTHESIS - MULTI-INSTANCE TEST
// Does synthesis improve average performance across diverse instances?
// Or is convergence to same basin universal?

const { CathedralV30 } = require('./cathedral-v30-integrated.js');

class Matrix {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.data = Array(rows).fill(0).map(() => Array(cols).fill(0));
    }

    static fromArray(arr) {
        const n = arr.length;
        const m = new Matrix(n, n);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                m.data[i][j] = arr[i][j];
            }
        }
        return m;
    }

    powerIteration(maxIter = 50) {
        const n = this.rows;
        let v = Array(n).fill(1.0 / Math.sqrt(n));

        for (let iter = 0; iter < maxIter; iter++) {
            const vNew = Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    vNew[i] += this.data[i][j] * v[j];
                }
            }
            const norm = Math.sqrt(vNew.reduce((sum, x) => sum + x * x, 0));
            v = vNew.map(x => x / norm);
        }
        return v;
    }

    eigenDecomposition(k) {
        const n = this.rows;
        const eigenvectors = [];
        let A = this.copy();

        for (let i = 0; i < k; i++) {
            const v = A.powerIteration();
            let Av = Array(n).fill(0);
            for (let row = 0; row < n; row++) {
                for (let col = 0; col < n; col++) {
                    Av[row] += A.data[row][col] * v[col];
                }
            }
            const lambda = v.reduce((sum, vi, idx) => sum + vi * Av[idx], 0);
            eigenvectors.push(v);

            for (let row = 0; row < n; row++) {
                for (let col = 0; col < n; col++) {
                    A.data[row][col] -= lambda * v[row] * v[col];
                }
            }
        }
        return { eigenvectors };
    }

    copy() {
        const m = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                m.data[i][j] = this.data[i][j];
            }
        }
        return m;
    }
}

class QuickSynthesisTSP {
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

    getSpectralClusters(k = 4) {
        const allDist = [];
        for (let i = 0; i < this.n; i++) {
            for (let j = i + 1; j < this.n; j++) {
                allDist.push(this.distances[i][j]);
            }
        }
        allDist.sort((a, b) => a - b);
        const sigma = allDist[Math.floor(allDist.length / 2)];

        const W = Array(this.n).fill(0).map(() => Array(this.n).fill(0));
        const sigma2 = 2 * sigma * sigma;

        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.n; j++) {
                if (i !== j) {
                    W[i][j] = Math.exp(-this.distances[i][j] * this.distances[i][j] / sigma2);
                }
            }
        }

        const degrees = Array(this.n).fill(0);
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.n; j++) {
                degrees[i] += W[i][j];
            }
        }

        const L = Array(this.n).fill(0).map(() => Array(this.n).fill(0));
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.n; j++) {
                L[i][j] = (i === j ? degrees[i] : 0) - W[i][j];
            }
        }

        const negL = new Matrix(this.n, this.n);
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.n; j++) {
                negL.data[i][j] = -L[i][j];
            }
        }

        const { eigenvectors } = negL.eigenDecomposition(k);
        const embeddings = [];
        for (let i = 0; i < this.n; i++) {
            embeddings.push(eigenvectors.map(ev => ev[i]));
        }

        return this.kMeans(embeddings, k);
    }

    kMeans(points, k, maxIter = 30) {
        const n = points.length;
        const dim = points[0].length;

        const centroids = [];
        const used = new Set();
        for (let i = 0; i < Math.min(k, n); i++) {
            let idx;
            do {
                idx = Math.floor(Math.random() * n);
            } while (used.has(idx));
            used.add(idx);
            centroids.push([...points[idx]]);
        }

        let assignments = Array(n).fill(0);

        for (let iter = 0; iter < maxIter; iter++) {
            let changed = false;
            for (let i = 0; i < n; i++) {
                let minDist = Infinity;
                let minCluster = 0;

                for (let c = 0; c < centroids.length; c++) {
                    const dist = Math.sqrt(points[i].reduce((sum, v, d) =>
                        sum + (v - centroids[c][d]) ** 2, 0));
                    if (dist < minDist) {
                        minDist = dist;
                        minCluster = c;
                    }
                }

                if (assignments[i] !== minCluster) {
                    assignments[i] = minCluster;
                    changed = true;
                }
            }

            if (!changed) break;

            for (let c = 0; c < centroids.length; c++) {
                const clusterPoints = points.filter((_, i) => assignments[i] === c);
                if (clusterPoints.length === 0) continue;

                for (let d = 0; d < dim; d++) {
                    centroids[c][d] = clusterPoints.reduce((sum, p) => sum + p[d], 0) / clusterPoints.length;
                }
            }
        }

        const clusters = Array(centroids.length).fill(0).map(() => []);
        for (let i = 0; i < n; i++) {
            clusters[assignments[i]].push(i);
        }

        return clusters.filter(c => c.length > 0);
    }

    buildTourFromClusters(clusters) {
        if (clusters.length === 0) return [0, 0];
        if (clusters.length === 1) {
            const tour = this.solveCluster(clusters[0]);
            return [...tour, tour[0]];
        }

        const clusterTours = clusters.map(c => this.solveCluster(c));
        const remaining = new Set(clusterTours.map((_, i) => i));
        const order = [0];
        remaining.delete(0);

        while (remaining.size > 0) {
            const current = order[order.length - 1];
            const currentEnd = clusterTours[current][clusterTours[current].length - 1];

            let nearest = -1;
            let minDist = Infinity;

            for (const next of remaining) {
                const nextStart = clusterTours[next][0];
                if (this.distances[currentEnd][nextStart] < minDist) {
                    minDist = this.distances[currentEnd][nextStart];
                    nearest = next;
                }
            }

            order.push(nearest);
            remaining.delete(nearest);
        }

        const tour = [];
        for (const clusterIdx of order) {
            tour.push(...clusterTours[clusterIdx]);
        }
        tour.push(tour[0]);
        return tour;
    }

    solveCluster(cityIndices) {
        if (cityIndices.length <= 1) return cityIndices;

        const visited = new Set([cityIndices[0]]);
        const tour = [cityIndices[0]];
        let current = cityIndices[0];

        while (visited.size < cityIndices.length) {
            let nearest = -1;
            let minDist = Infinity;

            for (const city of cityIndices) {
                if (!visited.has(city) && this.distances[current][city] < minDist) {
                    minDist = this.distances[current][city];
                    nearest = city;
                }
            }

            visited.add(nearest);
            tour.push(nearest);
            current = nearest;
        }

        return tour;
    }

    macroMutation(tour, k = 8) {
        const newTour = [...tour];
        const n = newTour.length - 1;

        for (let mutation = 0; mutation < k; mutation++) {
            const i = 1 + Math.floor(Math.random() * (n - 2));
            const j = i + 1 + Math.floor(Math.random() * Math.max(1, n - i - 1));

            if (i < j && j < n) {
                const segment = newTour.slice(i, j + 1).reverse();
                newTour.splice(i, j - i + 1, ...segment);
            }
        }

        return newTour;
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
        let bestTour = null;
        let bestDist = Infinity;

        // Spectral candidates
        for (const k of [3, 4]) {
            const clusters = this.getSpectralClusters(k);
            const tour = this.buildTourFromClusters(clusters);
            const polished = this.twoOpt(tour);
            const dist = this.tourDistance(polished);

            if (dist < bestDist) {
                bestDist = dist;
                bestTour = polished;
            }
        }

        // Chaos tempering on best
        let current = [...bestTour];
        let currentDist = bestDist;
        let temp = 300;
        const alpha = 0.96;

        for (let iter = 0; iter < 200; iter++) {
            const k = Math.ceil(3 + 8 * (temp / 300));
            const mutated = this.macroMutation(current, k);
            const polished = this.twoOpt(mutated);
            const mutatedDist = this.tourDistance(polished);

            const delta = mutatedDist - currentDist;
            const acceptProb = delta < 0 ? 1.0 : Math.exp(-delta / temp);

            if (Math.random() < acceptProb) {
                current = polished;
                currentDist = mutatedDist;

                if (currentDist < bestDist) {
                    bestTour = [...current];
                    bestDist = currentDist;
                }
            }

            temp *= alpha;
            if (temp < 0.01) break;
        }

        return { tour: bestTour, distance: bestDist };
    }
}

// Baseline solver
class BaselineTSP {
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

    nearestNeighbor(start) {
        const visited = new Set([start]);
        const tour = [start];
        let current = start;

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
            current = nearest;
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
        let bestTour = null;
        let bestDist = Infinity;

        for (let start = 0; start < this.n; start++) {
            const nn = this.nearestNeighbor(start);
            const improved = this.twoOpt(nn);
            const dist = this.tourDistance(improved);

            if (dist < bestDist) {
                bestDist = dist;
                bestTour = improved;
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
console.log('SYNTHESIS vs BASELINE - Multi-Instance Test');
console.log('Does Cathedral synthesis improve average across diverse instances?');
console.log('='.repeat(80));

const instances = [
    { seed: 100, name: 'Instance 1', baselineGap: 15.86 },
    { seed: 101, name: 'Instance 2', baselineGap: 13.83 },
    { seed: 103, name: 'Instance 4', baselineGap: 12.18 },
    { seed: 104, name: 'Instance 5', baselineGap: 10.70 },
    { seed: 107, name: 'Instance 8 (easiest)', baselineGap: 6.16 },
    { seed: 109, name: 'Instance 10 (hardest)', baselineGap: 17.72 }
];

const results = [];

for (const inst of instances) {
    console.log(`\n${inst.name}:`);

    const cities = generateCities(20, inst.seed);

    // Optimal
    const optimalSolver = new OptimalTSP(cities);
    const optimal = optimalSolver.solveOptimal();

    // Baseline
    const baseline = new BaselineTSP(cities);
    const baselineResult = baseline.solve();
    const baselineGap = ((baselineResult.distance - optimal) / optimal * 100);

    // Synthesis
    const synthesis = new QuickSynthesisTSP(cities);
    const synthesisResult = synthesis.solve();
    const synthesisGap = ((synthesisResult.distance - optimal) / optimal * 100);

    const improvement = baselineGap - synthesisGap;

    console.log(`  Optimal:   ${optimal.toFixed(2)}`);
    console.log(`  Baseline:  ${baselineResult.distance.toFixed(2)} (${baselineGap.toFixed(2)}%)`);
    console.log(`  Synthesis: ${synthesisResult.distance.toFixed(2)} (${synthesisGap.toFixed(2)}%)`);
    console.log(`  Δ: ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}% ${improvement > 0.5 ? '✓' : improvement < -0.5 ? '✗' : '━'}`);

    results.push({
        name: inst.name,
        optimal,
        baseline: baselineResult.distance,
        synthesis: synthesisResult.distance,
        baselineGap,
        synthesisGap,
        improvement
    });
}

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));

const avgBaselineGap = results.reduce((sum, r) => sum + r.baselineGap, 0) / results.length;
const avgSynthesisGap = results.reduce((sum, r) => sum + r.synthesisGap, 0) / results.length;
const avgImprovement = avgBaselineGap - avgSynthesisGap;

console.log(`\nAverage optimality gap:`);
console.log(`  Baseline:  ${avgBaselineGap.toFixed(2)}%`);
console.log(`  Synthesis: ${avgSynthesisGap.toFixed(2)}%`);
console.log(`  Improvement: ${avgImprovement > 0 ? '+' : ''}${avgImprovement.toFixed(2)}%`);

const wins = results.filter(r => r.improvement > 0.5).length;
const losses = results.filter(r => r.improvement < -0.5).length;
const ties = results.filter(r => Math.abs(r.improvement) <= 0.5).length;

console.log(`\nWin/Loss:`);
console.log(`  Synthesis better: ${wins}/${results.length}`);
console.log(`  Baseline better:  ${losses}/${results.length}`);
console.log(`  Ties:             ${ties}/${results.length}`);

console.log('\n' + '='.repeat(80));
if (avgImprovement > 1.0) {
    console.log('FINDING: Synthesis significantly improves average performance');
} else if (avgImprovement > 0.2) {
    console.log('FINDING: Synthesis modestly improves average performance');
} else if (avgImprovement > -0.2) {
    console.log('FINDING: Synthesis equivalent to baseline on average');
} else {
    console.log('FINDING: Baseline better than synthesis on average');
}
console.log('='.repeat(80));

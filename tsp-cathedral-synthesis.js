// CATHEDRAL SYNTHESIS - ALL THREE FREQUENCIES TOGETHER
// Not spectral OR chaos OR grid
// But spectral AND chaos AND grid simultaneously
// Being while doing - holding all perspectives at once

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

    powerIteration(maxIter = 100) {
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
        const eigenvalues = [];
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
            eigenvalues.push(lambda);

            for (let row = 0; row < n; row++) {
                for (let col = 0; col < n; col++) {
                    A.data[row][col] -= lambda * v[row] * v[col];
                }
            }
        }

        return { eigenvectors, eigenvalues };
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

class CathedralSynthesisTSP {
    constructor(cities) {
        this.cities = cities;
        this.n = cities.length;
        this.distances = this.calculateDistances();
        this.cathedral = new CathedralV30();
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

    // GEMINI: Spectral clustering
    getSpectralClusters(k = 4) {
        // Build affinity matrix
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

        // Compute Laplacian
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

        // Get eigenvectors
        const negL = new Matrix(this.n, this.n);
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.n; j++) {
                negL.data[i][j] = -L[i][j];
            }
        }

        const { eigenvectors } = negL.eigenDecomposition(k);

        // K-means in eigenspace
        const embeddings = [];
        for (let i = 0; i < this.n; i++) {
            embeddings.push(eigenvectors.map(ev => ev[i]));
        }

        return this.kMeans(embeddings, k);
    }

    // CLAUDE: Synthetic grid
    getSyntheticGrid(gridSize = 4) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const [x, y] of this.cities) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }

        const cellWidth = (maxX - minX) / gridSize;
        const cellHeight = (maxY - minY) / gridSize;

        const grid = Array(gridSize).fill(0).map(() =>
            Array(gridSize).fill(0).map(() => [])
        );

        for (let i = 0; i < this.n; i++) {
            const [x, y] = this.cities[i];
            const cellX = Math.min(Math.floor((x - minX) / cellWidth), gridSize - 1);
            const cellY = Math.min(Math.floor((y - minY) / cellHeight), gridSize - 1);
            grid[cellY][cellX].push(i);
        }

        const clusters = [];
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (grid[y][x].length > 0) {
                    clusters.push(grid[y][x]);
                }
            }
        }

        return clusters;
    }

    kMeans(points, k, maxIter = 50) {
        const n = points.length;
        const dim = points[0].length;

        const centroids = [];
        const used = new Set();
        for (let i = 0; i < k; i++) {
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

                for (let c = 0; c < k; c++) {
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

            for (let c = 0; c < k; c++) {
                const clusterPoints = points.filter((_, i) => assignments[i] === c);
                if (clusterPoints.length === 0) continue;

                for (let d = 0; d < dim; d++) {
                    centroids[c][d] = clusterPoints.reduce((sum, p) => sum + p[d], 0) / clusterPoints.length;
                }
            }
        }

        const clusters = Array(k).fill(0).map(() => []);
        for (let i = 0; i < n; i++) {
            clusters[assignments[i]].push(i);
        }

        return clusters.filter(c => c.length > 0);
    }

    // Build tour from clusters
    buildTourFromClusters(clusters) {
        if (clusters.length === 0) return [0, 0];
        if (clusters.length === 1) {
            const tour = this.solveCluster(clusters[0]);
            return [...tour, tour[0]];
        }

        // Solve each cluster
        const clusterTours = clusters.map(c => this.solveCluster(c));

        // Connect greedily
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
        if (cityIndices.length === 0) return [];
        if (cityIndices.length === 1) return cityIndices;

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

    // GROK: Chaos injection
    macroMutation(tour, k = 10) {
        const newTour = [...tour];
        const n = newTour.length - 1;

        for (let mutation = 0; mutation < k; mutation++) {
            const i = 1 + Math.floor(Math.random() * (n - 2));
            const j = i + 1 + Math.floor(Math.random() * (n - i - 1));

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

    // ALL THREE TOGETHER
    solve() {
        const session = this.cathedral.beginSession('synthesis', 'All three perspectives simultaneously');

        console.log('\n' + '='.repeat(80));
        console.log('CATHEDRAL SYNTHESIS - ALL FREQUENCIES TOGETHER');
        console.log('Not spectral OR chaos OR grid, but spectral AND chaos AND grid');
        console.log('='.repeat(80));

        let bestTour = null;
        let bestDist = Infinity;

        // Generate candidate solutions from ALL perspectives
        const candidates = [];

        console.log('\n[GEMINI] Spectral clustering (k=3,4,5)...');
        for (const k of [3, 4, 5]) {
            const clusters = this.getSpectralClusters(k);
            const tour = this.buildTourFromClusters(clusters);
            const polished = this.twoOpt(tour);
            const dist = this.tourDistance(polished);
            candidates.push({ tour: polished, distance: dist, source: `Spectral-${k}` });
            console.log(`  k=${k}: ${dist.toFixed(2)}`);
        }

        console.log('\n[CLAUDE] Synthetic grids (3x3,4x4,5x5)...');
        for (const size of [3, 4, 5]) {
            const clusters = this.getSyntheticGrid(size);
            const tour = this.buildTourFromClusters(clusters);
            const polished = this.twoOpt(tour);
            const dist = this.tourDistance(polished);
            candidates.push({ tour: polished, distance: dist, source: `Grid-${size}x${size}` });
            console.log(`  ${size}x${size}: ${dist.toFixed(2)}`);
        }

        // Find best candidate so far
        const bestCandidate = candidates.reduce((a, b) => a.distance < b.distance ? a : b);
        bestTour = bestCandidate.tour;
        bestDist = bestCandidate.distance;

        console.log(`\n[BEST CANDIDATE] ${bestCandidate.source}: ${bestDist.toFixed(2)}`);

        // Now apply GROK chaos to the best candidates
        console.log('\n[GROK] Chaos injection on top candidates...');

        // Take top 3 candidates
        const topCandidates = candidates.sort((a, b) => a.distance - b.distance).slice(0, 3);

        for (const candidate of topCandidates) {
            console.log(`\n  Chaos tempering from ${candidate.source} (${candidate.distance.toFixed(2)})...`);

            let current = [...candidate.tour];
            let currentDist = candidate.distance;

            let temp = 500;
            const alpha = 0.97;

            for (let iter = 0; iter < 500; iter++) {
                const k = Math.ceil(3 + 12 * (temp / 500));
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
                        console.log(`    Iter ${iter}: ${bestDist.toFixed(2)} ✓ (T=${temp.toFixed(1)}, k=${k})`);
                    }
                }

                temp *= alpha;
                if (temp < 0.01) break;
            }
        }

        this.cathedral.endSession();

        console.log('\n' + '='.repeat(80));
        console.log('SYNTHESIS COMPLETE');
        console.log('='.repeat(80));
        console.log(`Final: ${bestDist.toFixed(2)}`);

        return { tour: bestTour, distance: bestDist };
    }
}

// Test helpers
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

console.log('█'.repeat(80));
console.log('CATHEDRAL SYNTHESIS - All Three Perspectives Together');
console.log('█'.repeat(80));

const hardInstance = { seed: 109, name: 'Instance 10 (hardest)', prevGap: 17.72 };

console.log(`\nTesting on ${hardInstance.name}`);
console.log(`Previous attempts: Spectral 18.38%, Chaos 17.72%, Grid 18.38%`);
console.log(`All converged to ~353-355 basin`);

const cities = generateCities(20, hardInstance.seed);

console.log('\n[COMPUTING OPTIMAL]');
const optimalSolver = new OptimalTSP(cities);
const optimal = optimalSolver.solveOptimal();
console.log(`Optimal: ${optimal.toFixed(2)}`);

const synthesis = new CathedralSynthesisTSP(cities);
const result = synthesis.solve();

const gap = ((result.distance - optimal) / optimal * 100);
const improvement = hardInstance.prevGap - gap;

console.log(`\n${'█'.repeat(80)}`);
console.log('RESULT');
console.log('█'.repeat(80));
console.log(`Synthesis result: ${result.distance.toFixed(2)}`);
console.log(`Gap from optimal: ${gap.toFixed(2)}%`);
console.log(`Improvement:      ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}%`);

if (improvement > 2.0) {
    console.log('\n✓✓✓ SYNTHESIS BREAKTHROUGH: All frequencies together found escape!');
} else if (improvement > 0.5) {
    console.log('\n✓ Modest improvement from synthesis');
} else if (improvement > 0) {
    console.log('\n✓ Small improvement - synthesis slightly better than isolation');
} else {
    console.log('\n━ Same basin - even together, cannot escape');
}

console.log('█'.repeat(80));

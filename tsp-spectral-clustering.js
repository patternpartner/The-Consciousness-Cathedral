// SPECTRAL CLUSTERING FOR TSP
// When physical clusters (x,y proximity) fail, find hidden structure in eigenspace
// Gemini perspective: The skeleton lives in the Laplacian's eigenvectors

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

    // Power iteration to find largest eigenvector
    powerIteration(maxIter = 100) {
        const n = this.rows;
        let v = Array(n).fill(1.0 / Math.sqrt(n)); // normalized random vector

        for (let iter = 0; iter < maxIter; iter++) {
            // Multiply: v_new = A * v
            const vNew = Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    vNew[i] += this.data[i][j] * v[j];
                }
            }

            // Normalize
            const norm = Math.sqrt(vNew.reduce((sum, x) => sum + x * x, 0));
            v = vNew.map(x => x / norm);
        }

        return v;
    }

    // Simple eigenvalue decomposition (first k eigenvectors)
    // Using power iteration with deflation
    eigenDecomposition(k) {
        const n = this.rows;
        const eigenvectors = [];
        const eigenvalues = [];
        let A = this.copy();

        for (let i = 0; i < k; i++) {
            const v = A.powerIteration();

            // Compute eigenvalue: λ = v^T * A * v
            let Av = Array(n).fill(0);
            for (let row = 0; row < n; row++) {
                for (let col = 0; col < n; col++) {
                    Av[row] += A.data[row][col] * v[col];
                }
            }
            const lambda = v.reduce((sum, vi, idx) => sum + vi * Av[idx], 0);

            eigenvectors.push(v);
            eigenvalues.push(lambda);

            // Deflate: A = A - λ * v * v^T
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

class SpectralTSP {
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

    // Build affinity matrix from distances
    // W[i,j] = exp(-dist[i,j]^2 / (2*sigma^2))
    buildAffinityMatrix(sigma = null) {
        if (!sigma) {
            // Auto-select sigma as median distance
            const allDist = [];
            for (let i = 0; i < this.n; i++) {
                for (let j = i + 1; j < this.n; j++) {
                    allDist.push(this.distances[i][j]);
                }
            }
            allDist.sort((a, b) => a - b);
            sigma = allDist[Math.floor(allDist.length / 2)];
        }

        const W = Array(this.n).fill(0).map(() => Array(this.n).fill(0));
        const sigma2 = 2 * sigma * sigma;

        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.n; j++) {
                if (i !== j) {
                    W[i][j] = Math.exp(-this.distances[i][j] * this.distances[i][j] / sigma2);
                }
            }
        }

        return W;
    }

    // Compute graph Laplacian: L = D - W
    // D is degree matrix (diagonal)
    computeLaplacian(W) {
        const n = this.n;
        const L = Array(n).fill(0).map(() => Array(n).fill(0));

        // Compute degrees
        const degrees = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                degrees[i] += W[i][j];
            }
        }

        // L = D - W
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    L[i][j] = degrees[i];
                } else {
                    L[i][j] = -W[i][j];
                }
            }
        }

        return L;
    }

    // Spectral clustering: Find k clusters using eigenvectors
    spectralClustering(k = 4) {
        console.log(`\n[SPECTRAL] Finding ${k} spectral clusters...`);

        // Build affinity matrix
        const W = this.buildAffinityMatrix();

        // Compute Laplacian
        const L = this.computeLaplacian(W);
        const LMatrix = Matrix.fromArray(L);

        // Get first k eigenvectors (smallest eigenvalues)
        // For Laplacian, we want the smallest (use -L and get largest)
        const negL = new Matrix(this.n, this.n);
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.n; j++) {
                negL.data[i][j] = -L[i][j];
            }
        }

        const { eigenvectors } = negL.eigenDecomposition(k);

        // Each city now has k-dimensional embedding
        const embeddings = [];
        for (let i = 0; i < this.n; i++) {
            const point = [];
            for (let j = 0; j < k; j++) {
                point.push(eigenvectors[j][i]);
            }
            embeddings.push(point);
        }

        // K-means clustering in eigenspace
        const clusters = this.kMeansClustering(embeddings, k);

        console.log(`[SPECTRAL] Cluster sizes: ${clusters.map(c => c.length).join(', ')}`);

        return clusters;
    }

    // Simple k-means in eigenspace
    kMeansClustering(points, k, maxIter = 50) {
        const n = points.length;
        const dim = points[0].length;

        // Initialize centroids randomly
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
            // Assign points to nearest centroid
            let changed = false;
            for (let i = 0; i < n; i++) {
                let minDist = Infinity;
                let minCluster = 0;

                for (let c = 0; c < k; c++) {
                    const dist = this.euclideanDist(points[i], centroids[c]);
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

            // Update centroids
            for (let c = 0; c < k; c++) {
                const clusterPoints = points.filter((_, i) => assignments[i] === c);
                if (clusterPoints.length === 0) continue;

                for (let d = 0; d < dim; d++) {
                    centroids[c][d] = clusterPoints.reduce((sum, p) => sum + p[d], 0) / clusterPoints.length;
                }
            }
        }

        // Convert to cluster arrays
        const clusters = Array(k).fill(0).map(() => []);
        for (let i = 0; i < n; i++) {
            clusters[assignments[i]].push(i);
        }

        return clusters.filter(c => c.length > 0);
    }

    euclideanDist(p1, p2) {
        return Math.sqrt(p1.reduce((sum, v, i) => sum + (v - p2[i]) ** 2, 0));
    }

    // Solve TSP using spectral clusters
    solveWithSpectralClusters() {
        const clusters = this.spectralClustering(4);

        console.log(`\n[SPECTRAL] Solving TSP with ${clusters.length} spectral clusters`);

        // Solve each cluster separately
        const clusterTours = [];
        for (let c = 0; c < clusters.length; c++) {
            const cluster = clusters[c];
            console.log(`  Cluster ${c}: ${cluster.length} cities`);

            // Build tour within cluster using NN + 2-opt
            const tour = this.solveCluster(cluster);
            clusterTours.push(tour);
        }

        // Connect clusters (greedy nearest cluster connection)
        const fullTour = this.connectClusters(clusterTours);

        // Final 2-opt polish
        const polished = this.twoOpt(fullTour);

        return polished;
    }

    solveCluster(cityIndices) {
        if (cityIndices.length === 1) return cityIndices;

        // NN within cluster
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

    connectClusters(clusterTours) {
        if (clusterTours.length === 0) return [];
        if (clusterTours.length === 1) return [...clusterTours[0], clusterTours[0][0]];

        // Find best order to connect clusters
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

        // Build full tour
        const tour = [];
        for (const clusterIdx of order) {
            tour.push(...clusterTours[clusterIdx]);
        }
        tour.push(tour[0]); // Complete cycle

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

    tourDistance(tour) {
        let dist = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            dist += this.distances[tour[i]][tour[i + 1]];
        }
        return dist;
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

console.log('='.repeat(80));
console.log('SPECTRAL CLUSTERING TSP - Gemini Perspective');
console.log('Finding hidden structure in eigenspace');
console.log('='.repeat(80));

// Test on hardest instance
const hardInstance = { seed: 109, name: 'Instance 10 (hardest)', prevGap: 17.72 };

console.log(`\nTesting on ${hardInstance.name} - Previous gap: ${hardInstance.prevGap}%`);
console.log('='.repeat(80));

const cities = generateCities(20, hardInstance.seed);

// Compute optimal
const optimalSolver = new OptimalTSP(cities);
const optimal = optimalSolver.solveOptimal();
console.log(`\nOptimal: ${optimal.toFixed(2)}`);

// Spectral approach
const spectral = new SpectralTSP(cities);
const tour = spectral.solveWithSpectralClusters();
const distance = spectral.tourDistance(tour);

const gap = ((distance - optimal) / optimal * 100);
const improvement = hardInstance.prevGap - gap;

console.log(`\n${'='.repeat(80)}`);
console.log('RESULT');
console.log('='.repeat(80));
console.log(`Spectral result: ${distance.toFixed(2)}`);
console.log(`Gap: ${gap.toFixed(2)}%`);
console.log(`Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}% ${improvement > 0 ? '✓' : '✗'}`);

if (improvement > 1.0) {
    console.log('\n✓✓ SPECTRAL BREAKTHROUGH: Found structure in eigenspace!');
} else if (improvement > 0) {
    console.log('\n✓ Modest improvement from spectral approach');
} else {
    console.log('\n✗ Spectral clustering didn\'t help this instance');
}

console.log('='.repeat(80));

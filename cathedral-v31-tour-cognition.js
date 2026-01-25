// CATHEDRAL V31: TOUR COGNITION LAYER
// A new cognitive layer that LEARNS from optimal tours
// Not just pattern recognition - active guidance of construction

// This layer learns what makes tours good by analyzing optimal solutions
// Then uses that knowledge to guide construction in real-time

class TourCognition {
    constructor() {
        this.optimalFeatures = [];  // Features extracted from optimal tours
        this.weights = null;         // Learned weights for scoring decisions
        this.trainingHistory = [];
    }

    // Extract features from a tour decision
    extractDecisionFeatures(cities, distances, current, candidate, visited, centroid) {
        const [currX, currY] = cities[current];
        const [candX, candY] = cities[candidate];
        const [cx, cy] = centroid;

        // Feature 1: Euclidean distance
        const euclidean = distances[current][candidate];

        // Feature 2: Angular progression (relative to centroid)
        const currAngle = Math.atan2(currY - cy, currX - cx);
        const candAngle = Math.atan2(candY - cy, candX - cx);
        let angleDelta = candAngle - currAngle;
        if (angleDelta < 0) angleDelta += 2 * Math.PI;

        // Feature 3: Radial change (moving in/out from centroid)
        const currRadius = Math.sqrt((currX - cx) ** 2 + (currY - cy) ** 2);
        const candRadius = Math.sqrt((candX - cx) ** 2 + (candY - cy) ** 2);
        const radialChange = candRadius - currRadius;

        // Feature 4: Rank among alternatives (is this nearest, 2nd nearest, etc?)
        const alternatives = [];
        for (let i = 0; i < cities.length; i++) {
            if (!visited.has(i) && i !== candidate) {
                alternatives.push(distances[current][i]);
            }
        }
        alternatives.sort((a, b) => a - b);

        let rank = 1;
        for (const altDist of alternatives) {
            if (altDist < euclidean) rank++;
        }
        const normalizedRank = rank / (alternatives.length + 1);

        // Feature 5: Deviation from nearest
        const nearestDist = alternatives.length > 0 ? alternatives[0] : euclidean;
        const deviation = euclidean - nearestDist;

        // Feature 6: Progress in tour (early vs late decisions)
        const progress = visited.size / cities.length;

        // Feature 7: Alignment with previous direction
        let directionAlignment = 0;
        if (visited.size >= 2) {
            const prevCities = Array.from(visited);
            const prev2 = prevCities[prevCities.length - 2];
            const prev1 = prevCities[prevCities.length - 1];

            const [p2x, p2y] = cities[prev2];
            const [p1x, p1y] = cities[prev1];

            const prevDx = p1x - p2x;
            const prevDy = p1y - p2y;
            const candDx = candX - currX;
            const candDy = candY - currY;

            const prevLen = Math.sqrt(prevDx * prevDx + prevDy * prevDy);
            const candLen = Math.sqrt(candDx * candDx + candDy * candDy);

            if (prevLen > 0 && candLen > 0) {
                directionAlignment = (prevDx * candDx + prevDy * candDy) / (prevLen * candLen);
            }
        }

        return {
            euclidean,
            angleDelta,
            radialChange,
            normalizedRank,
            deviation,
            progress,
            directionAlignment
        };
    }

    // Learn from an optimal tour
    learnFromOptimal(cities, distances, optimalTour) {
        const [cx, cy] = this.getCentroid(cities);

        const examples = [];

        for (let i = 0; i < optimalTour.length - 2; i++) {
            const current = optimalTour[i];
            const chosen = optimalTour[i + 1];
            const visited = new Set(optimalTour.slice(0, i + 1));

            // Positive example: what optimal chose
            const chosenFeatures = this.extractDecisionFeatures(
                cities, distances, current, chosen, visited, [cx, cy]
            );
            examples.push({ features: chosenFeatures, label: 1 });

            // Negative examples: what optimal didn't choose
            const alternatives = [];
            for (let j = 0; j < cities.length; j++) {
                if (!visited.has(j) && j !== chosen) {
                    const altFeatures = this.extractDecisionFeatures(
                        cities, distances, current, j, visited, [cx, cy]
                    );
                    examples.push({ features: altFeatures, label: 0 });
                }
            }
        }

        this.optimalFeatures.push(...examples);
        return examples.length;
    }

    // Train a simple linear model to score decisions
    // Learns weights for each feature
    train() {
        if (this.optimalFeatures.length === 0) {
            throw new Error('No training data');
        }

        // Initialize weights
        const featureNames = Object.keys(this.optimalFeatures[0].features);
        this.weights = {};
        for (const name of featureNames) {
            this.weights[name] = Math.random() * 0.2 - 0.1; // Small random weights
        }

        // Simple gradient descent
        const learningRate = 0.01;
        const epochs = 100;

        for (let epoch = 0; epoch < epochs; epoch++) {
            let totalLoss = 0;

            // Shuffle examples
            const shuffled = [...this.optimalFeatures];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            for (const example of shuffled) {
                // Forward pass
                let score = 0;
                for (const [name, value] of Object.entries(example.features)) {
                    score += this.weights[name] * value;
                }

                // Sigmoid activation
                const prediction = 1 / (1 + Math.exp(-score));

                // Loss (cross-entropy)
                const loss = example.label === 1 ?
                    -Math.log(prediction + 1e-10) :
                    -Math.log(1 - prediction + 1e-10);
                totalLoss += loss;

                // Gradient
                const error = prediction - example.label;

                // Update weights
                for (const [name, value] of Object.entries(example.features)) {
                    this.weights[name] -= learningRate * error * value;
                }
            }

            if (epoch % 20 === 0) {
                this.trainingHistory.push({
                    epoch,
                    avgLoss: totalLoss / shuffled.length
                });
            }
        }
    }

    // Score a decision using learned weights
    scoreDecision(cities, distances, current, candidate, visited, centroid) {
        if (!this.weights) {
            throw new Error('Model not trained');
        }

        const features = this.extractDecisionFeatures(
            cities, distances, current, candidate, visited, centroid
        );

        let score = 0;
        for (const [name, value] of Object.entries(features)) {
            score += this.weights[name] * value;
        }

        // Sigmoid
        return 1 / (1 + Math.exp(-score));
    }

    getCentroid(cities) {
        let cx = 0, cy = 0;
        for (const [x, y] of cities) {
            cx += x;
            cy += y;
        }
        return [cx / cities.length, cy / cities.length];
    }

    // Use learned model to construct tour
    guidedConstruction(cities, distances, start = 0) {
        if (!this.weights) {
            throw new Error('Model not trained');
        }

        const centroid = this.getCentroid(cities);
        const visited = new Set([start]);
        const tour = [start];
        let current = start;

        while (visited.size < cities.length) {
            let best = -1;
            let bestScore = -Infinity;

            // Score all unvisited candidates
            for (let i = 0; i < cities.length; i++) {
                if (visited.has(i)) continue;

                const score = this.scoreDecision(cities, distances, current, i, visited, centroid);

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

    // Report what the model learned
    getInsights() {
        if (!this.weights) return null;

        const sorted = Object.entries(this.weights)
            .map(([name, weight]) => ({ name, weight }))
            .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

        return {
            weights: this.weights,
            mostImportant: sorted.slice(0, 3),
            trainingHistory: this.trainingHistory
        };
    }
}

module.exports = { TourCognition };

// If running directly, demonstrate
if (require.main === module) {
    console.log('='.repeat(80));
    console.log('CATHEDRAL V31: TOUR COGNITION LAYER');
    console.log('Learning from optimal tours to guide construction');
    console.log('='.repeat(80));
    console.log('\nThis layer:');
    console.log('  1. Extracts features from optimal tour decisions');
    console.log('  2. Trains on positive (chosen) vs negative (not chosen) examples');
    console.log('  3. Learns weights for: distance, angle, rank, deviation, etc.');
    console.log('  4. Uses learned model to guide construction');
    console.log('\nNot just pattern recognition - active decision-making guidance');
    console.log('='.repeat(80));
}

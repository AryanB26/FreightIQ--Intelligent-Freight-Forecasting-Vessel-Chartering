// ============================================================
// FreightIQ — ML Forecasting Models (Phase 6)
//
// Implements Random Forest and Gradient Boosting from scratch.
// No external ML dependencies — pure TypeScript.
// Deterministic with fixed seeds for reproducibility.
// ============================================================

// ---- Seeded PRNG (for reproducible splits) ----

function createRNG(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---- Decision Tree ( CART regression) ----

interface TreeNode {
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  value?: number; // leaf prediction
  sampleCount?: number;
}

function buildTree(
  X: number[][],
  y: number[],
  maxDepth: number = 6,
  minSamplesLeaf: number = 5,
  rng: () => number = Math.random,
  featureSubset?: number[]
): TreeNode {
  // Random feature subset for Random Forest
  const features = featureSubset ?? Array.from({ length: X[0].length }, (_, i) => i);

  if (y.length <= minSamplesLeaf * 2 || maxDepth <= 0) {
    return { value: y.reduce((s, v) => s + v, 0) / y.length, sampleCount: y.length };
  }

  let bestMSE = Infinity;
  let bestFeature = 0;
  let bestThreshold = 0;
  let bestLeftIdx: number[] = [];
  let bestRightIdx: number[] = [];

  // Try random feature subsets (for Random Forest diversity)
  const tryCount = Math.min(features.length, Math.ceil(Math.sqrt(features.length)));
  const shuffled = [...features].sort(() => rng() - 0.5);
  const candidateFeatures = shuffled.slice(0, tryCount);

  for (const fi of candidateFeatures) {
    const values = X.map((row) => row[fi]);
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

    // Try a few thresholds (percentile-based for efficiency)
    const thresholdsToTry = Math.min(uniqueValues.length, 20);
    const step = Math.max(1, Math.floor(uniqueValues.length / thresholdsToTry));

    for (let t = 0; t < uniqueValues.length; t += step) {
      const threshold = uniqueValues[t];
      const leftIdx: number[] = [];
      const rightIdx: number[] = [];

      for (let i = 0; i < X.length; i++) {
        if (X[i][fi] <= threshold) leftIdx.push(i);
        else rightIdx.push(i);
      }

      if (leftIdx.length < minSamplesLeaf || rightIdx.length < minSamplesLeaf) continue;

      // Compute MSE for this split
      const leftMean = leftIdx.reduce((s, i) => s + y[i], 0) / leftIdx.length;
      const rightMean = rightIdx.reduce((s, i) => s + y[i], 0) / rightIdx.length;

      let leftMSE = 0;
      for (const i of leftIdx) leftMSE += (y[i] - leftMean) ** 2;
      let rightMSE = 0;
      for (const i of rightIdx) rightMSE += (y[i] - rightMean) ** 2;

      const totalMSE = (leftMSE + rightMSE) / X.length;

      if (totalMSE < bestMSE) {
        bestMSE = totalMSE;
        bestFeature = fi;
        bestThreshold = threshold;
        bestLeftIdx = leftIdx;
        bestRightIdx = rightIdx;
      }
    }
  }

  // If no good split found, make a leaf
  if (bestLeftIdx.length === 0 || bestRightIdx.length === 0) {
    return { value: y.reduce((s, v) => s + v, 0) / y.length, sampleCount: y.length };
  }

  const leftX = bestLeftIdx.map((i) => X[i]);
  const leftY = bestLeftIdx.map((i) => y[i]);
  const rightX = bestRightIdx.map((i) => X[i]);
  const rightY = bestRightIdx.map((i) => y[i]);

  return {
    featureIndex: bestFeature,
    threshold: bestThreshold,
    left: buildTree(leftX, leftY, maxDepth - 1, minSamplesLeaf, rng, featureSubset),
    right: buildTree(rightX, rightY, maxDepth - 1, minSamplesLeaf, rng, featureSubset),
    sampleCount: y.length,
  };
}

function predictTree(tree: TreeNode, row: number[]): number {
  if (tree.value !== undefined) return tree.value;
  if (tree.featureIndex === undefined || tree.threshold === undefined) return 0;

  if (row[tree.featureIndex] <= tree.threshold) {
    return predictTree(tree.left!, row);
  }
  return predictTree(tree.right!, row);
}

// ---- Random Forest ----

export interface RandomForestModel {
  trees: TreeNode[];
  featureSubsetSize: number;
  featureNames: string[];
  featureImportances: number[];
  seed: number;
}

export function trainRandomForest(
  X: number[][],
  y: number[],
  featureNames: string[],
  nTrees: number = 50,
  maxDepth: number = 6,
  seed: number = 42
): RandomForestModel {
  const rng = createRNG(seed);
  const nFeatures = X[0].length;
  const featureSubsetSize = Math.max(1, Math.ceil(Math.sqrt(nFeatures)));

  const trees: TreeNode[] = [];

  for (let t = 0; t < nTrees; t++) {
    // Bootstrap sample
    const n = X.length;
    const bootIdx: number[] = [];
    for (let i = 0; i < n; i++) {
      bootIdx.push(Math.floor(rng() * n));
    }
    const bootX = bootIdx.map((i) => X[i]);
    const bootY = bootIdx.map((i) => y[i]);

    // Random feature subset
    const allFeatures = Array.from({ length: nFeatures }, (_, i) => i);
    const featureSubset = allFeatures
      .sort(() => rng() - 0.5)
      .slice(0, featureSubsetSize);

    trees.push(buildTree(bootX, bootY, maxDepth, 5, rng, featureSubset));
  }

  // Compute feature importances via permutation importance approximation
  const importances = computeFeatureImportance(trees, X, y, featureNames, rng);

  return {
    trees,
    featureSubsetSize,
    featureNames,
    featureImportances: importances,
    seed,
  };
}

export function predictRandomForest(model: RandomForestModel, X: number[][]): number[] {
  return X.map((row) => {
    const preds = model.trees.map((tree) => predictTree(tree, row));
    return preds.reduce((s, v) => s + v, 0) / preds.length;
  });
}

// ---- Gradient Boosting (for regression) ----

export interface GradientBoostingModel {
  trees: TreeNode[];
  basePrediction: number;
  learningRate: number;
  featureNames: string[];
  featureImportances: number[];
  seed: number;
}

export function trainGradientBoosting(
  X: number[][],
  y: number[],
  featureNames: string[],
  nTrees: number = 100,
  learningRate: number = 0.1,
  maxDepth: number = 4,
  seed: number = 42
): GradientBoostingModel {
  const rng = createRNG(seed);
  const nFeatures = X[0].length;

  // Initial prediction: mean of target (as array of per-sample predictions)
  const basePrediction = y.reduce((s, v) => s + v, 0) / y.length;
  let currentPreds: number[] = y.map(() => basePrediction);

  const trees: TreeNode[] = [];
  const importances = new Array(nFeatures).fill(0);

  for (let t = 0; t < nTrees; t++) {
    // Compute negative gradients (residuals for MSE loss)
    const residuals = y.map((yi, i) => yi - currentPreds[i]);

    // Fit a tree to the residuals
    // Use all features (no random subset like RF)
    const allFeatures = Array.from({ length: nFeatures }, (_, i) => i);
    const tree = buildTree(X, residuals, maxDepth, 5, rng, allFeatures);
    trees.push(tree);

    // Update predictions
    const treePreds = X.map((row) => predictTree(tree, row));
    currentPreds = currentPreds.map((cp, i) => cp + learningRate * treePreds[i]);

    // Track feature importance (how often each feature is used in splits)
    countFeatureUsage(tree, importances);
  }

  // Normalize importances
  const totalUsage = importances.reduce((s, v) => s + v, 0) || 1;
  const normalizedImportances = importances.map((v) => Math.round((v / totalUsage) * 100) / 100);

  return {
    trees,
    basePrediction,
    learningRate,
    featureNames,
    featureImportances: normalizedImportances,
    seed,
  };
}

export function predictGradientBoosting(model: GradientBoostingModel, X: number[][]): number[] {
  return X.map((row) => {
    let pred = model.basePrediction;
    for (const tree of model.trees) {
      pred += model.learningRate * predictTree(tree, row);
    }
    return pred;
  });
}

// ---- Feature importance helpers ----

function countFeatureUsage(tree: TreeNode, counts: number[]): void {
  if (tree.featureIndex !== undefined) {
    counts[tree.featureIndex] = (counts[tree.featureIndex] || 0) + 1;
  }
  if (tree.left) countFeatureUsage(tree.left, counts);
  if (tree.right) countFeatureUsage(tree.right, counts);
}

function computeFeatureImportance(
  trees: TreeNode[],
  X: number[][],
  y: number[],
  featureNames: string[],
  rng: () => number
): number[] {
  const nFeatures = X[0].length;
  const basePreds = X.map((row) => {
    const preds = trees.map((t) => predictTree(t, row));
    return preds.reduce((s, v) => s + v, 0) / preds.length;
  });
  const baseMSE = basePreds.reduce((s, p, i) => s + (p - y[i]) ** 2, 0) / y.length;

  const importances = new Array(nFeatures).fill(0);

  for (let fi = 0; fi < nFeatures; fi++) {
    // Permute feature fi
    const permX = X.map((row) => [...row]);
    const col = permX.map((row) => row[fi]);
    // Fisher-Yates shuffle
    for (let i = col.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [col[i], col[j]] = [col[j], col[i]];
    }
    for (let i = 0; i < permX.length; i++) permX[i][fi] = col[i];

    const permPreds = permX.map((row) => {
      const preds = trees.map((t) => predictTree(t, row));
      return preds.reduce((s, v) => s + v, 0) / preds.length;
    });
    const permMSE = permPreds.reduce((s, p, i) => s + (p - y[i]) ** 2, 0) / y.length;

    importances[fi] = Math.max(0, permMSE - baseMSE);
  }

  // Normalize
  const total = importances.reduce((s, v) => s + v, 0) || 1;
  return importances.map((v) => Math.round((v / total) * 10000) / 10000);
}

// ---- Model type union ----

export type TrainedModel =
  | { type: "random_forest"; model: RandomForestModel }
  | { type: "gradient_boosting"; model: GradientBoostingModel };

export function predict(model: TrainedModel, X: number[][]): number[] {
  if (model.type === "random_forest") return predictRandomForest(model.model, X);
  return predictGradientBoosting(model.model, X);
}

export function getFeatureImportances(model: TrainedModel): number[] {
  return model.model.featureImportances;
}

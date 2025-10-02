/**
 * Clustering Service - K-Means, DBSCAN, GMM Implementation
 */

export interface ClusteringConfig {
  method: 'kmeans' | 'dbscan' | 'gmm';
  k?: number;
  eps?: number;
  minSamples?: number;
  nComponents?: number;
  standardize?: boolean;
  randomState?: number;
}

export interface ClusterResult {
  labels: number[];
  centroids?: number[][];
  componentMeans?: number[][];
  silhouetteScore?: number;
  daviesBouldinScore?: number;
  noiseRatio?: number;
  clusterSizes: Record<number, number>;
}

// Utility functions for feature scaling
export function standardScaler(data: number[][]): { scaled: number[][], means: number[], stds: number[] } {
  const nFeatures = data[0].length;
  const means = new Array(nFeatures).fill(0);
  const stds = new Array(nFeatures).fill(0);
  
  // Calculate means
  for (const row of data) {
    for (let j = 0; j < nFeatures; j++) {
      means[j] += row[j];
    }
  }
  means.forEach((_, i) => means[i] /= data.length);
  
  // Calculate standard deviations
  for (const row of data) {
    for (let j = 0; j < nFeatures; j++) {
      stds[j] += Math.pow(row[j] - means[j], 2);
    }
  }
  stds.forEach((_, i) => stds[i] = Math.sqrt(stds[i] / data.length));
  
  // Scale data
  const scaled = data.map(row => 
    row.map((val, j) => stds[j] === 0 ? 0 : (val - means[j]) / stds[j])
  );
  
  return { scaled, means, stds };
}

// K-Means Implementation
export function kMeans(data: number[][], k: number, maxIter: number = 100, randomState: number = 42): ClusterResult {
  const n = data.length;
  const nFeatures = data[0].length;
  
  // Initialize centroids using k-means++
  const centroids: number[][] = [];
  const rng = seededRandom(randomState);
  
  // First centroid: random point
  centroids.push([...data[Math.floor(rng() * n)]]);
  
  // Remaining centroids: k-means++ selection
  for (let i = 1; i < k; i++) {
    const distances = data.map(point => {
      const minDist = Math.min(...centroids.map(c => euclideanDistance(point, c)));
      return minDist * minDist;
    });
    const sum = distances.reduce((a, b) => a + b, 0);
    let r = rng() * sum;
    let idx = 0;
    while (r > 0 && idx < distances.length - 1) {
      r -= distances[idx];
      idx++;
    }
    centroids.push([...data[idx]]);
  }
  
  let labels = new Array(n).fill(0);
  let changed = true;
  let iter = 0;
  
  while (changed && iter < maxIter) {
    changed = false;
    
    // Assign points to nearest centroid
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      
      for (let j = 0; j < k; j++) {
        const dist = euclideanDistance(data[i], centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = j;
        }
      }
      
      if (labels[i] !== bestCluster) {
        labels[i] = bestCluster;
        changed = true;
      }
    }
    
    // Update centroids
    for (let j = 0; j < k; j++) {
      const clusterPoints = data.filter((_, i) => labels[i] === j);
      if (clusterPoints.length > 0) {
        for (let f = 0; f < nFeatures; f++) {
          centroids[j][f] = clusterPoints.reduce((sum, p) => sum + p[f], 0) / clusterPoints.length;
        }
      }
    }
    
    iter++;
  }
  
  const clusterSizes: Record<number, number> = {};
  for (const label of labels) {
    clusterSizes[label] = (clusterSizes[label] || 0) + 1;
  }
  
  return {
    labels,
    centroids,
    clusterSizes,
    silhouetteScore: calculateSilhouette(data, labels),
    daviesBouldinScore: calculateDaviesBouldin(data, labels, centroids)
  };
}

// DBSCAN Implementation
export function dbscan(data: number[][], eps: number, minSamples: number): ClusterResult {
  const n = data.length;
  const labels = new Array(n).fill(-1); // -1 means unclassified
  let clusterId = 0;
  
  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1) continue;
    
    const neighbors = findNeighbors(data, i, eps);
    
    if (neighbors.length < minSamples) {
      labels[i] = -2; // Noise point
      continue;
    }
    
    // Start new cluster
    labels[i] = clusterId;
    const seedSet = [...neighbors];
    
    while (seedSet.length > 0) {
      const current = seedSet.pop()!;
      
      if (labels[current] === -2) {
        labels[current] = clusterId; // Change noise to border point
      }
      
      if (labels[current] !== -1) continue;
      
      labels[current] = clusterId;
      const currentNeighbors = findNeighbors(data, current, eps);
      
      if (currentNeighbors.length >= minSamples) {
        seedSet.push(...currentNeighbors.filter(n => labels[n] === -1 || labels[n] === -2));
      }
    }
    
    clusterId++;
  }
  
  const clusterSizes: Record<number, number> = {};
  let noiseCount = 0;
  for (const label of labels) {
    if (label === -2) {
      noiseCount++;
    } else if (label >= 0) {
      clusterSizes[label] = (clusterSizes[label] || 0) + 1;
    }
  }
  
  const noiseRatio = noiseCount / n;
  
  return {
    labels: labels.map(l => l === -2 ? -1 : l),
    clusterSizes,
    noiseRatio,
    silhouetteScore: clusterId > 1 ? calculateSilhouette(data, labels) : undefined
  };
}

// GMM (Simplified Gaussian Mixture Model)
export function gmm(data: number[][], nComponents: number, maxIter: number = 50, randomState: number = 42): ClusterResult {
  // Use k-means as initialization for GMM
  const kmeansResult = kMeans(data, nComponents, 10, randomState);
  const labels = kmeansResult.labels;
  const componentMeans = kmeansResult.centroids;
  
  // In a full GMM, we would do EM iterations here
  // For simplicity, we're using k-means as a proxy
  
  const clusterSizes: Record<number, number> = {};
  for (const label of labels) {
    clusterSizes[label] = (clusterSizes[label] || 0) + 1;
  }
  
  return {
    labels,
    componentMeans,
    clusterSizes,
    silhouetteScore: calculateSilhouette(data, labels),
    daviesBouldinScore: calculateDaviesBouldin(data, labels, componentMeans!)
  };
}

// Helper functions
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

function findNeighbors(data: number[][], pointIdx: number, eps: number): number[] {
  const neighbors: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i !== pointIdx && euclideanDistance(data[pointIdx], data[i]) <= eps) {
      neighbors.push(i);
    }
  }
  return neighbors;
}

function calculateSilhouette(data: number[][], labels: number[]): number {
  const uniqueLabels = [...new Set(labels)].filter(l => l >= 0);
  if (uniqueLabels.length < 2) return 0;
  
  let totalSilhouette = 0;
  let validPoints = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (labels[i] < 0) continue; // Skip noise points
    
    // Calculate a(i): mean distance to points in same cluster
    const sameCluster = data.filter((_, j) => labels[j] === labels[i] && j !== i);
    if (sameCluster.length === 0) continue;
    
    const a = sameCluster.reduce((sum, p) => sum + euclideanDistance(data[i], p), 0) / sameCluster.length;
    
    // Calculate b(i): min mean distance to points in other clusters
    let b = Infinity;
    for (const otherLabel of uniqueLabels) {
      if (otherLabel === labels[i]) continue;
      
      const otherCluster = data.filter((_, j) => labels[j] === otherLabel);
      if (otherCluster.length === 0) continue;
      
      const meanDist = otherCluster.reduce((sum, p) => sum + euclideanDistance(data[i], p), 0) / otherCluster.length;
      b = Math.min(b, meanDist);
    }
    
    if (b === Infinity) continue;
    
    const s = (b - a) / Math.max(a, b);
    totalSilhouette += s;
    validPoints++;
  }
  
  return validPoints > 0 ? totalSilhouette / validPoints : 0;
}

function calculateDaviesBouldin(data: number[][], labels: number[], centroids: number[][]): number {
  const uniqueLabels = [...new Set(labels)].filter(l => l >= 0);
  if (uniqueLabels.length < 2) return 0;
  
  // Calculate within-cluster scatter for each cluster
  const scatters = uniqueLabels.map(label => {
    const clusterPoints = data.filter((_, i) => labels[i] === label);
    const centroid = centroids[label];
    return clusterPoints.reduce((sum, p) => sum + euclideanDistance(p, centroid), 0) / clusterPoints.length;
  });
  
  let dbIndex = 0;
  for (let i = 0; i < uniqueLabels.length; i++) {
    let maxRatio = 0;
    for (let j = 0; j < uniqueLabels.length; j++) {
      if (i === j) continue;
      const separation = euclideanDistance(centroids[uniqueLabels[i]], centroids[uniqueLabels[j]]);
      const ratio = (scatters[i] + scatters[j]) / separation;
      maxRatio = Math.max(maxRatio, ratio);
    }
    dbIndex += maxRatio;
  }
  
  return dbIndex / uniqueLabels.length;
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

// Main clustering function
export async function runClustering(data: number[][], config: ClusteringConfig): Promise<ClusterResult> {
  let processedData = data;
  
  if (config.standardize) {
    const { scaled } = standardScaler(data);
    processedData = scaled;
  }
  
  switch (config.method) {
    case 'kmeans':
      return kMeans(processedData, config.k || 4, 100, config.randomState || 42);
    
    case 'dbscan':
      return dbscan(processedData, config.eps || 0.6, config.minSamples || 10);
    
    case 'gmm':
      return gmm(processedData, config.nComponents || 4, 50, config.randomState || 42);
    
    default:
      throw new Error(`Unknown clustering method: ${config.method}`);
  }
}

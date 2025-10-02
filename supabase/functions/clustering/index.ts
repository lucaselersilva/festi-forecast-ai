import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Clustering algorithms implementation
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

function standardScaler(data: number[][]): { scaled: number[][], means: number[], stds: number[] } {
  const n = data.length;
  const m = data[0].length;
  const means = new Array(m).fill(0);
  const stds = new Array(m).fill(0);

  for (let j = 0; j < m; j++) {
    for (let i = 0; i < n; i++) {
      means[j] += data[i][j];
    }
    means[j] /= n;
  }

  for (let j = 0; j < m; j++) {
    for (let i = 0; i < n; i++) {
      stds[j] += Math.pow(data[i][j] - means[j], 2);
    }
    stds[j] = Math.sqrt(stds[j] / n);
    if (stds[j] === 0) stds[j] = 1;
  }

  const scaled = data.map(row => 
    row.map((val, j) => (val - means[j]) / stds[j])
  );

  return { scaled, means, stds };
}

function kMeans(data: number[][], k: number, maxIter: number = 100, randomState: number = 42): any {
  const n = data.length;
  const m = data[0].length;

  // K-means++ initialization
  const rng = mulberry32(randomState);
  const centroids: number[][] = [];
  centroids.push(data[Math.floor(rng() * n)]);

  for (let i = 1; i < k; i++) {
    const distances = data.map(point => {
      return Math.min(...centroids.map(c => euclideanDistance(point, c)));
    });
    const sumDist = distances.reduce((a, b) => a + b, 0);
    const probs = distances.map(d => d / sumDist);
    
    let cumProb = 0;
    const rand = rng();
    for (let j = 0; j < n; j++) {
      cumProb += probs[j];
      if (rand < cumProb) {
        centroids.push(data[j]);
        break;
      }
    }
  }

  let labels = new Array(n).fill(0);
  let converged = false;
  let iter = 0;

  while (!converged && iter < maxIter) {
    const newLabels = data.map(point => {
      const distances = centroids.map(c => euclideanDistance(point, c));
      return distances.indexOf(Math.min(...distances));
    });

    converged = newLabels.every((label, i) => label === labels[i]);
    labels = newLabels;

    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter((_, idx) => labels[idx] === i);
      if (clusterPoints.length > 0) {
        centroids[i] = new Array(m).fill(0).map((_, j) => 
          clusterPoints.reduce((sum, point) => sum + point[j], 0) / clusterPoints.length
        );
      }
    }

    iter++;
  }

  const clusterSizes = new Array(k).fill(0);
  labels.forEach(label => clusterSizes[label]++);

  return { labels, centroids, clusterSizes };
}

function dbscan(data: number[][], eps: number, minSamples: number): any {
  const n = data.length;
  const labels = new Array(n).fill(-1);
  let clusterId = 0;

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1) continue;

    const neighbors = findNeighbors(data, i, eps);
    if (neighbors.length < minSamples) {
      labels[i] = -1;
      continue;
    }

    labels[i] = clusterId;
    const queue = [...neighbors];

    while (queue.length > 0) {
      const j = queue.shift()!;
      if (labels[j] === -1) labels[j] = clusterId;
      if (labels[j] !== -1 && labels[j] !== clusterId) continue;

      labels[j] = clusterId;
      const newNeighbors = findNeighbors(data, j, eps);
      if (newNeighbors.length >= minSamples) {
        queue.push(...newNeighbors.filter(n => labels[n] === -1));
      }
    }

    clusterId++;
  }

  const uniqueLabels = [...new Set(labels)];
  const clusterSizes = uniqueLabels.map(label => 
    labels.filter(l => l === label).length
  );

  return { labels, clusterSizes };
}

function findNeighbors(data: number[][], pointIdx: number, eps: number): number[] {
  const neighbors: number[] = [];
  const point = data[pointIdx];
  
  for (let i = 0; i < data.length; i++) {
    if (i !== pointIdx && euclideanDistance(point, data[i]) <= eps) {
      neighbors.push(i);
    }
  }
  
  return neighbors;
}

function gmm(data: number[][], nComponents: number, randomState: number = 42): any {
  const kmeansResult = kMeans(data, nComponents, 50, randomState);
  return {
    labels: kmeansResult.labels,
    means: kmeansResult.centroids,
    clusterSizes: kmeansResult.clusterSizes,
  };
}

function silhouetteScore(data: number[][], labels: number[]): number {
  const n = data.length;
  const uniqueLabels = [...new Set(labels)].filter(l => l !== -1);
  
  if (uniqueLabels.length < 2) return 0;

  let totalScore = 0;
  let validPoints = 0;

  for (let i = 0; i < n; i++) {
    if (labels[i] === -1) continue;

    const sameCluster = data.filter((_, idx) => labels[idx] === labels[i] && idx !== i);
    if (sameCluster.length === 0) continue;

    const a = sameCluster.reduce((sum, point) => 
      sum + euclideanDistance(data[i], point), 0) / sameCluster.length;

    let minB = Infinity;
    for (const label of uniqueLabels) {
      if (label === labels[i]) continue;
      const otherCluster = data.filter((_, idx) => labels[idx] === label);
      if (otherCluster.length === 0) continue;
      
      const b = otherCluster.reduce((sum, point) => 
        sum + euclideanDistance(data[i], point), 0) / otherCluster.length;
      minB = Math.min(minB, b);
    }

    if (minB !== Infinity) {
      totalScore += (minB - a) / Math.max(a, minB);
      validPoints++;
    }
  }

  return validPoints > 0 ? totalScore / validPoints : 0;
}

function daviesBouldinIndex(data: number[][], labels: number[], centroids: number[][]): number {
  const uniqueLabels = [...new Set(labels)].filter(l => l !== -1);
  if (uniqueLabels.length < 2) return 0;

  let totalDB = 0;

  for (let i = 0; i < uniqueLabels.length; i++) {
    const clusterI = data.filter((_, idx) => labels[idx] === uniqueLabels[i]);
    const centroidI = centroids[i];
    const avgDistI = clusterI.reduce((sum, point) => 
      sum + euclideanDistance(point, centroidI), 0) / clusterI.length;

    let maxRatio = 0;
    for (let j = 0; j < uniqueLabels.length; j++) {
      if (i === j) continue;
      
      const clusterJ = data.filter((_, idx) => labels[idx] === uniqueLabels[j]);
      const centroidJ = centroids[j];
      const avgDistJ = clusterJ.reduce((sum, point) => 
        sum + euclideanDistance(point, centroidJ), 0) / clusterJ.length;

      const centroidDist = euclideanDistance(centroidI, centroidJ);
      const ratio = (avgDistI + avgDistJ) / centroidDist;
      maxRatio = Math.max(maxRatio, ratio);
    }

    totalDB += maxRatio;
  }

  return totalDB / uniqueLabels.length;
}

function mulberry32(seed: number) {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { method, params } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🔬 Running ${method} clustering...`);

    // Fetch RFM features
    const { data: features, error: fetchError } = await supabase
      .from('vw_rfm_customer')
      .select('*')
      .order('customer_id');

    if (fetchError) {
      throw new Error(`Failed to fetch features: ${fetchError.message}`);
    }

    if (!features || features.length < 10) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient data for clustering',
          minimumRequired: 10,
          available: features?.length || 0
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Extracted features for ${features.length} customers`);

    // Prepare feature matrix
    const data = features.map((f: any) => [
      f.recency_days || 0,
      f.frequency_interactions || 0,
      f.monetary_total || 0,
    ]);

    const customerIds = features.map((f: any) => f.customer_id);

    // Standardize if requested
    let processedData = data;
    if (params.standardize !== false) {
      const scaled = standardScaler(data);
      processedData = scaled.scaled;
    }

    // Run clustering
    let result: any;
    if (method === 'kmeans') {
      result = kMeans(processedData, params.k || 4, 100, params.randomState || 42);
    } else if (method === 'dbscan') {
      result = dbscan(processedData, params.eps || 0.6, params.minSamples || 10);
    } else if (method === 'gmm') {
      result = gmm(processedData, params.nComponents || 4, params.randomState || 42);
    } else {
      throw new Error(`Unknown clustering method: ${method}`);
    }

    // Calculate metrics
    const silhouette = silhouetteScore(processedData, result.labels);
    const daviesBouldin = result.centroids ? 
      daviesBouldinIndex(processedData, result.labels, result.centroids) : undefined;

    // Create cluster summary
    const clusterMap: { [key: number]: any[] } = {};
    result.labels.forEach((label: number, idx: number) => {
      if (!clusterMap[label]) clusterMap[label] = [];
      clusterMap[label].push({
        customer_id: customerIds[idx],
        features: data[idx],
      });
    });

    const clusters = Object.entries(clusterMap).map(([cluster, members]) => {
      const clusterNum = parseInt(cluster);
      const featureSums = [0, 0, 0];
      members.forEach(m => {
        m.features.forEach((val: number, idx: number) => {
          featureSums[idx] += val;
        });
      });
      
      return {
        cluster: clusterNum,
        size: members.length,
        percentage: (members.length / features.length) * 100,
        avgRecency: featureSums[0] / members.length,
        avgFrequency: featureSums[1] / members.length,
        avgMonetary: featureSums[2] / members.length,
        customerIds: members.map(m => m.customer_id),
      };
    });

    console.log(`✅ Clustering complete: ${clusters.length} clusters found`);

    return new Response(
      JSON.stringify({
        success: true,
        method,
        metrics: {
          silhouetteScore: silhouette,
          daviesBouldinScore: daviesBouldin,
          clusterSizes: result.clusterSizes,
        },
        clusters,
        totalCustomers: features.length,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Clustering error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to run clustering',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

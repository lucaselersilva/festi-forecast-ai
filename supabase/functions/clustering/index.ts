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

// Calculate percentile from sorted array
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (upper >= sorted.length) return sorted[sorted.length - 1];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

// Calculate percentiles for multiple features
function calculateFeaturePercentiles(data: number[][], featureIndices: number[]): any {
  const percentiles: any = {};
  
  featureIndices.forEach((idx, featureName) => {
    const values = data.map(row => row[idx]).filter(v => v !== null && v !== undefined && !isNaN(v));
    
    if (values.length > 0) {
      percentiles[`feature_${idx}`] = {
        p25: calculatePercentile(values, 25),
        p50: calculatePercentile(values, 50),
        p75: calculatePercentile(values, 75),
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }
  });
  
  return percentiles;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { method, params, segmentationType = 'rfm' } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🔬 Running ${method} clustering for ${segmentationType} segmentation...`);

    // Select view and fields based on segmentation type
    const viewConfig = {
      rfm: {
        view: 'vw_rfm_customer',
        idField: 'customer_id',
        featureFields: ['recency_days', 'frequency_interactions', 'monetary_total'],
        featureNames: ['Recência', 'Frequência', 'Valor Monetário']
      },
      demographic: {
        view: 'vw_demographic_profile',
        idField: 'customer_id',
        featureFields: ['age'],
        featureNames: ['Idade', 'Gênero', 'Cidade'],
        encodeFields: ['gender', 'city']
      },
      behavioral: {
        view: 'vw_digital_engagement',
        idField: 'customer_id',
        featureFields: ['total_purchases', 'avg_days_between_purchases', 'avg_purchase_value'],
        featureNames: ['Total de Compras', 'Dias Entre Compras', 'Valor Médio']
      },
      musical: {
        view: 'vw_musical_preference',
        idField: 'customer_id',
        featureFields: ['interaction_count', 'total_spent'],
        featureNames: ['Interações', 'Valor Total', 'Gênero Preferido'],
        encodeFields: ['preferred_genre']
      },
      'multi-dimensional': {
        view: 'vw_multi_segment',
        idField: 'customer_id',
        featureFields: ['recency_days', 'frequency', 'monetary_total', 'age', 'total_purchases', 'avg_days_between_purchases', 'genre_interaction_count'],
        featureNames: ['Recência', 'Frequência', 'Monetary', 'Idade', 'Compras', 'Intervalo', 'Interações Gênero'],
        encodeFields: ['gender', 'city', 'preferred_genre', 'age_segment', 'rfm_segment', 'engagement_segment']
      }
    };

    const config = viewConfig[segmentationType as keyof typeof viewConfig] || viewConfig.rfm;

    // Fetch features from selected view (aumentando limite para 50000)
    const { data: features, error: fetchError } = await supabase
      .from(config.view)
      .select('*')
      .limit(50000)
      .order(config.idField);

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

    // Helper function to encode categorical variables
    const encodeCategorical = (values: string[]): number[] => {
      const unique = [...new Set(values)];
      const mapping = Object.fromEntries(unique.map((val, idx) => [val, idx]));
      return values.map(val => mapping[val]);
    };

    // Prepare feature matrix based on segmentation type
    let data: number[][];
    
    if ('encodeFields' in config && config.encodeFields && config.encodeFields.length > 0) {
      // For segmentations with categorical fields
      const numericFeatures = config.featureFields.map((field: string) => 
        features.map((f: any) => f[field] || 0)
      );
      
      const encodedFeatures = config.encodeFields.map((field: string) =>
        encodeCategorical(features.map((f: any) => f[field] || ''))
      );
      
      // Transpose to get rows per customer
      data = features.map((_, idx) => [
        ...numericFeatures.map((feat: number[]) => feat[idx]),
        ...encodedFeatures.map((feat: number[]) => feat[idx])
      ]);
    } else {
      // For purely numeric segmentations
      data = features.map((f: any) => 
        config.featureFields.map(field => f[field] || 0)
      );
    }

    const customerIds = features.map((f: any) => f[config.idField]);

    // Calculate percentiles BEFORE standardization (on original data)
    const featureIndices = config.featureFields.map((_, idx) => idx);
    const rawPercentiles = calculateFeaturePercentiles(data, featureIndices);
    
    // Build named percentiles based on segmentation type
    const percentiles: any = {};
    if (segmentationType === 'rfm') {
      percentiles.recency = rawPercentiles.feature_0;
      percentiles.frequency = rawPercentiles.feature_1;
      percentiles.monetary = rawPercentiles.feature_2;
    } else if (segmentationType === 'demographic') {
      percentiles.age = rawPercentiles.feature_0;
    } else if (segmentationType === 'behavioral') {
      percentiles.purchases = rawPercentiles.feature_0;
      percentiles.daysBetween = rawPercentiles.feature_1;
      percentiles.purchaseValue = rawPercentiles.feature_2;
    } else if (segmentationType === 'musical') {
      percentiles.interactions = rawPercentiles.feature_0;
      percentiles.spent = rawPercentiles.feature_1;
    } else if (segmentationType === 'multi-dimensional') {
      percentiles.recency = rawPercentiles.feature_0;
      percentiles.frequency = rawPercentiles.feature_1;
      percentiles.monetary = rawPercentiles.feature_2;
      percentiles.age = rawPercentiles.feature_3;
      percentiles.total_purchases = rawPercentiles.feature_4;
      percentiles.avg_days_between_purchases = rawPercentiles.feature_5;
      percentiles.genre_interaction_count = rawPercentiles.feature_6;
    }
    
    console.log(`📊 Calculated percentiles:`, percentiles);

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
      const numFeatures = data[0].length;
      const featureSums = new Array(numFeatures).fill(0);
      
      members.forEach(m => {
        m.features.forEach((val: number, idx: number) => {
          featureSums[idx] += val;
        });
      });
      
      const avgFeatures = featureSums.map(sum => sum / members.length);
      
      // Build cluster object with dynamic features
      const clusterObj: any = {
        cluster: clusterNum,
        size: members.length,
        percentage: (members.length / features.length) * 100,
        customerIds: members.map(m => m.customer_id),
      };

      // Add named average features based on segmentation type with decoded values
      if (segmentationType === 'rfm') {
        clusterObj.avgRecency = avgFeatures[0];
        clusterObj.avgFrequency = avgFeatures[1];
        clusterObj.avgMonetary = avgFeatures[2];
      } else if (segmentationType === 'demographic') {
        clusterObj.avgAge = avgFeatures[0];
        clusterObj.avgGenderCode = avgFeatures[1];
        clusterObj.avgCityCode = avgFeatures[2];
        
        // Decode gender (M=0, F=1)
        clusterObj.dominantGender = avgFeatures[1] > 0.5 ? 'F' : 'M';
        
        // Decode city - find most common city in cluster
        const cityCounts: Record<string, number> = {};
        members.forEach(member => {
          const row = features.find((r: any) => r.customer_id === member.customer_id);
          if (row && row.city) {
            cityCounts[row.city] = (cityCounts[row.city] || 0) + 1;
          }
        });
        if (Object.keys(cityCounts).length > 0) {
          clusterObj.dominantCity = Object.keys(cityCounts).reduce((a, b) => 
            cityCounts[a] > cityCounts[b] ? a : b
          );
        }
      } else if (segmentationType === 'behavioral') {
        clusterObj.avgPurchases = avgFeatures[0];
        clusterObj.avgDaysBetween = avgFeatures[1];
        clusterObj.avgPurchaseValue = avgFeatures[2];
      } else if (segmentationType === 'musical') {
        clusterObj.avgInteractions = avgFeatures[0];
        clusterObj.avgSpent = avgFeatures[1];
        clusterObj.avgGenreCode = avgFeatures[2];
        
        // Decode genre - find most common genre in cluster
        const genreCounts: Record<string, number> = {};
        members.forEach(member => {
          const row = features.find((r: any) => r.customer_id === member.customer_id);
          if (row && row.preferred_genre) {
            genreCounts[row.preferred_genre] = (genreCounts[row.preferred_genre] || 0) + 1;
          }
        });
        if (Object.keys(genreCounts).length > 0) {
          clusterObj.dominantGenre = Object.keys(genreCounts).reduce((a, b) => 
            genreCounts[a] > genreCounts[b] ? a : b
          );
        }
      } else if (segmentationType === 'multi-dimensional') {
        // RFM features
        clusterObj.avgRecency = avgFeatures[0];
        clusterObj.avgFrequency = avgFeatures[1];
        clusterObj.avgMonetary = avgFeatures[2];
        // Demographic features
        clusterObj.avgAge = avgFeatures[3];
        // Behavioral features
        clusterObj.avgPurchases = avgFeatures[4];
        clusterObj.avgDaysBetween = avgFeatures[5];
        // Musical features
        clusterObj.avgGenreInteractions = avgFeatures[6];
        
        // Decode categorical fields
        const genderCounts: Record<string, number> = {};
        const cityCounts: Record<string, number> = {};
        const genreCounts: Record<string, number> = {};
        const ageSegmentCounts: Record<string, number> = {};
        const rfmSegmentCounts: Record<string, number> = {};
        const engagementSegmentCounts: Record<string, number> = {};
        
        members.forEach(member => {
          const row = features.find((r: any) => r.customer_id === member.customer_id);
          if (row) {
            if (row.gender) genderCounts[row.gender] = (genderCounts[row.gender] || 0) + 1;
            if (row.city) cityCounts[row.city] = (cityCounts[row.city] || 0) + 1;
            if (row.preferred_genre) genreCounts[row.preferred_genre] = (genreCounts[row.preferred_genre] || 0) + 1;
            if (row.age_segment) ageSegmentCounts[row.age_segment] = (ageSegmentCounts[row.age_segment] || 0) + 1;
            if (row.rfm_segment) rfmSegmentCounts[row.rfm_segment] = (rfmSegmentCounts[row.rfm_segment] || 0) + 1;
            if (row.engagement_segment) engagementSegmentCounts[row.engagement_segment] = (engagementSegmentCounts[row.engagement_segment] || 0) + 1;
          }
        });
        
        const getDominant = (counts: Record<string, number>) => {
          if (Object.keys(counts).length === 0) return undefined;
          return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        };
        
        clusterObj.dominantGender = getDominant(genderCounts);
        clusterObj.dominantCity = getDominant(cityCounts);
        clusterObj.dominantGenre = getDominant(genreCounts);
        clusterObj.dominantAgeSegment = getDominant(ageSegmentCounts);
        clusterObj.dominantRfmSegment = getDominant(rfmSegmentCounts);
        clusterObj.dominantEngagementSegment = getDominant(engagementSegmentCounts);
      }

      // Store all average features for generic access
      clusterObj.avgFeatures = avgFeatures;
      
      return clusterObj;
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
        percentiles,
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

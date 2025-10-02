import { runClustering, ClusteringConfig, ClusterResult } from "../../src/lib/clustering";

export interface ClusteringRequest {
  method: 'kmeans' | 'dbscan' | 'gmm';
  params: {
    k?: number;
    eps?: number;
    minSamples?: number;
    nComponents?: number;
    standardize?: boolean;
    randomState?: number;
  };
}

export interface CustomerCluster {
  customer_id: number;
  cluster: number;
  features: number[];
}

export class ClusteringService {
  async runSegmentation(
    data: number[][],
    customerIds: number[],
    config: ClusteringRequest
  ): Promise<{ result: ClusterResult; assignments: CustomerCluster[] }> {
    
    const clusteringConfig: ClusteringConfig = {
      method: config.method,
      k: config.params.k,
      eps: config.params.eps,
      minSamples: config.params.minSamples,
      nComponents: config.params.nComponents,
      standardize: config.params.standardize ?? true,
      randomState: config.params.randomState ?? 42,
    };

    const result = await runClustering(data, clusteringConfig);

    const assignments: CustomerCluster[] = customerIds.map((id, idx) => ({
      customer_id: id,
      cluster: result.labels[idx],
      features: data[idx],
    }));

    return { result, assignments };
  }

  getClusterSummary(assignments: CustomerCluster[]) {
    const clusterMap: { [key: number]: CustomerCluster[] } = {};
    
    assignments.forEach(assignment => {
      if (!clusterMap[assignment.cluster]) {
        clusterMap[assignment.cluster] = [];
      }
      clusterMap[assignment.cluster].push(assignment);
    });

    return Object.entries(clusterMap).map(([cluster, members]) => {
      const clusterNum = parseInt(cluster);
      const featureAvgs = this.calculateFeatureAverages(members);
      
      return {
        cluster: clusterNum,
        size: members.length,
        percentage: (members.length / assignments.length) * 100,
        avgRecency: featureAvgs[0],
        avgFrequency: featureAvgs[1],
        avgMonetary: featureAvgs[2],
        customerIds: members.map(m => m.customer_id),
      };
    });
  }

  private calculateFeatureAverages(members: CustomerCluster[]): number[] {
    if (members.length === 0) return [0, 0, 0];
    
    const featureCount = members[0].features.length;
    const sums = new Array(featureCount).fill(0);
    
    members.forEach(member => {
      member.features.forEach((val, idx) => {
        sums[idx] += val;
      });
    });
    
    return sums.map(sum => sum / members.length);
  }
}

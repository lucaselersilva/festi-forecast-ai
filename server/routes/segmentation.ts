import { Router } from "express";
import { FeatureExtractor } from "../services/features";
import { ClusteringService, ClusteringRequest } from "../services/clustering";

const router = Router();

router.post("/run", async (req, res) => {
  try {
    const config: ClusteringRequest = req.body;

    if (!config.method) {
      return res.status(400).json({ 
        error: "Missing clustering method",
        validMethods: ["kmeans", "dbscan", "gmm"]
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Supabase configuration missing" });
    }

    console.log(`🔬 Running ${config.method} clustering...`);

    const featureExtractor = new FeatureExtractor(supabaseUrl, supabaseKey);
    const clusteringService = new ClusteringService();

    // Extract RFM features
    const features = await featureExtractor.getRFMFeatures();
    console.log(`📊 Extracted features for ${features.length} customers`);

    if (features.length < 10) {
      return res.status(400).json({ 
        error: "Insufficient data for clustering",
        minimumRequired: 10,
        available: features.length
      });
    }

    const data = await featureExtractor.getFeatureMatrix(features);
    const customerIds = await featureExtractor.getCustomerIds(features);

    // Run clustering
    const { result, assignments } = await clusteringService.runSegmentation(
      data,
      customerIds,
      config
    );

    const clusterSummary = clusteringService.getClusterSummary(assignments);

    console.log(`✅ Clustering complete: ${clusterSummary.length} clusters found`);

    res.json({
      success: true,
      method: config.method,
      metrics: {
        silhouetteScore: result.silhouetteScore,
        daviesBouldinScore: result.daviesBouldinScore,
        clusterSizes: result.clusterSizes,
      },
      clusters: clusterSummary,
      totalCustomers: assignments.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Clustering error:", error);
    res.status(500).json({ 
      error: "Failed to run clustering",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

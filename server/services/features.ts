import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface CustomerFeature {
  customer_id: number;
  recency_days: number;
  frequency_interactions: number;
  monetary_total: number;
  rfm_score: number;
  rfm_r: number;
  rfm_f: number;
  rfm_m: number;
}

export class FeatureExtractor {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getRFMFeatures(): Promise<CustomerFeature[]> {
    const { data, error } = await this.supabase
      .from("vw_rfm_customer")
      .select("*")
      .order("customer_id");

    if (error) {
      throw new Error(`Failed to fetch RFM features: ${error.message}`);
    }

    return data as CustomerFeature[];
  }

  async getFeatureMatrix(features: CustomerFeature[]): Promise<number[][]> {
    return features.map(f => [
      f.recency_days || 0,
      f.frequency_interactions || 0,
      f.monetary_total || 0,
    ]);
  }

  async getCustomerIds(features: CustomerFeature[]): Promise<number[]> {
    return features.map(f => f.customer_id);
  }
}

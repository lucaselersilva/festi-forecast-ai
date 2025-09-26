import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// Configuration schema validation
const configSchema = z.object({
  PORT: z.string().default("4000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SUPABASE_URL: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  OPENAI_API_KEY: z.string().optional(),
  BANDIT_EPSILON: z.string().default("0.1"),
  PRICING_UPDATE_INTERVAL: z.string().default("3600000"), // 1 hour in ms
  RECOMMENDATION_BATCH_SIZE: z.string().default("100"),
});

const env = configSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  BANDIT_EPSILON: process.env.BANDIT_EPSILON,
  PRICING_UPDATE_INTERVAL: process.env.PRICING_UPDATE_INTERVAL,
  RECOMMENDATION_BATCH_SIZE: process.env.RECOMMENDATION_BATCH_SIZE,
});

export const config = {
  port: parseInt(env.PORT),
  nodeEnv: env.NODE_ENV,
  supabase: {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  openai: {
    apiKey: env.OPENAI_API_KEY,
  },
  pricing: {
    banditEpsilon: parseFloat(env.BANDIT_EPSILON),
    updateInterval: parseInt(env.PRICING_UPDATE_INTERVAL),
  },
  recommendation: {
    batchSize: parseInt(env.RECOMMENDATION_BATCH_SIZE),
  },
};

export type Config = typeof config;
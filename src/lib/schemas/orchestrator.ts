import { z } from 'zod';

export const DataProfileSchema = z.object({
  population: z.object({ 
    n_customers: z.number(), 
    period_days: z.number() 
  }),
  quality: z.object({ 
    missing_pct: z.number(), 
    outliers_pct: z.number() 
  }),
  rfm_percentiles: z.object({
    R: z.object({ p25: z.number(), p50: z.number(), p75: z.number() }),
    F: z.object({ p25: z.number(), p50: z.number(), p75: z.number() }),
    M: z.object({ p25: z.number(), p50: z.number(), p75: z.number() })
  }).nullable(),
  behavior: z.object({
    avg_days_between: z.number().nullable(),
    seasonality_hint: z.enum(["none","monthly","weekly","event_driven"])
  }),
  music: z.object({
    top_genres: z.array(z.object({ name: z.string(), share_pct: z.number() })),
    cross_affinities: z.array(z.tuple([z.string(), z.string()]))
  }),
  raw_queries: z.record(z.any()).optional()
});

export const FindingsSchema = z.object({
  key_segments: z.array(z.object({
    name: z.string(),
    size: z.number(),
    rfm: z.object({ R: z.number(), F: z.number(), M: z.number() }).partial(),
    traits: z.array(z.string()).optional(),
    evidence: z.array(z.string())
  })),
  opportunities: z.array(z.object({
    hypothesis: z.string(),
    evidence: z.array(z.string()),
    est_impact: z.string()
  })),
  risks: z.array(z.object({ 
    desc: z.string(), 
    evidence: z.array(z.string()) 
  }))
});

export const StrategySchema = z.object({
  title: z.string(),
  target_segment: z.string(),
  channel: z.array(z.string()),
  offer: z.object({ 
    type: z.string(), 
    value: z.string() 
  }),
  timing: z.object({ 
    start_rule: z.string(), 
    cadence: z.string() 
  }),
  kpi: z.object({ 
    metric: z.string(), 
    goal: z.string(), 
    timebox_days: z.number() 
  }),
  rationale: z.array(z.string()),
  constraints_check: z.object({ 
    capacity_ok: z.boolean(), 
    margin_ok: z.boolean() 
  }),
  predicted_uplift: z.object({ 
    method: z.string(), 
    value_pct: z.number() 
  }).optional()
});

export type DataProfile = z.infer<typeof DataProfileSchema>;
export type Findings = z.infer<typeof FindingsSchema>;
export type Strategy = z.infer<typeof StrategySchema>;
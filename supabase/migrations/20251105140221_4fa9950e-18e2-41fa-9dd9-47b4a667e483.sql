-- Create a SECURITY DEFINER function to fetch clustering data bypassing RLS
CREATE OR REPLACE FUNCTION public.get_clustering_data(
  _tenant_id UUID,
  _view_name TEXT
)
RETURNS TABLE (
  customer_id TEXT,
  recency_days NUMERIC,
  frequency INTEGER,
  monetary NUMERIC,
  cluster_comportamental TEXT,
  cluster_valor TEXT,
  faixa_etaria TEXT,
  genero TEXT,
  propensity_score NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate tenant_id
  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id cannot be null';
  END IF;
  
  -- Validate view_name to prevent SQL injection
  IF _view_name NOT IN ('vw_valle_rfm', 'vw_multi_segment', 'vw_customer_rfm') THEN
    RAISE EXCEPTION 'Invalid view name: %', _view_name;
  END IF;
  
  -- Return data based on selected view
  IF _view_name = 'vw_valle_rfm' THEN
    RETURN QUERY
    SELECT 
      v.id::TEXT as customer_id,
      v.recency_days,
      v.frequency,
      v.monetary,
      v.cluster_comportamental,
      v.cluster_valor,
      v.faixa_etaria,
      v.genero,
      v.propensity_score
    FROM public.vw_valle_rfm v
    WHERE v.tenant_id = _tenant_id;
  ELSIF _view_name = 'vw_multi_segment' THEN
    RETURN QUERY
    SELECT 
      v.customer_id::TEXT,
      v.recency_days,
      v.frequency::INTEGER,
      v.monetary_total as monetary,
      NULL::TEXT as cluster_comportamental,
      NULL::TEXT as cluster_valor,
      v.age_segment as faixa_etaria,
      v.gender as genero,
      NULL::NUMERIC as propensity_score
    FROM public.vw_multi_segment v
    WHERE v.tenant_id = _tenant_id;
  ELSIF _view_name = 'vw_customer_rfm' THEN
    RETURN QUERY
    SELECT 
      v.customer_id::TEXT,
      v.recency_days,
      v.freq_tx::INTEGER as frequency,
      v.monetary_total as monetary,
      v.segment as cluster_comportamental,
      NULL::TEXT as cluster_valor,
      NULL::TEXT as faixa_etaria,
      NULL::TEXT as genero,
      NULL::NUMERIC as propensity_score
    FROM public.vw_customer_rfm v
    WHERE v.tenant_id = _tenant_id;
  END IF;
END;
$$;
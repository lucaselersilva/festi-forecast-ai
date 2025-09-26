import sys, json, os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.ensemble import GradientBoostingRegressor
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase connection
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

# Load historical events data
hist_response = supabase.table('events').select('*').not_.is_('revenue', 'null').not_.is_('sold_tickets', 'null').execute()
hist = pd.DataFrame(hist_response.data)

# Load future events data (events without revenue/sold_tickets or future dates)
future_response = supabase.table('events').select('*').or_('revenue.is.null,sold_tickets.is.null').execute()
future = pd.DataFrame(future_response.data)

# Get interaction insights to enrich features
interactions_response = supabase.table('interactions').select('*').execute()
interactions = pd.DataFrame(interactions_response.data)

# Get scoring snapshots for customer behavior insights
scoring_response = supabase.table('scoring_snapshots').select('*').execute()
scoring = pd.DataFrame(scoring_response.data)

# Check required columns exist
required_cols = [
    "date","city","venue","artist","genre","ticket_price","marketing_spend",
    "google_trends_genre","instagram_mentions","temp_c","precip_mm","day_of_week",
    "is_holiday_brazil_hint","capacity","sold_tickets","revenue"
]
for c in required_cols:
    if c not in hist.columns:
        print(f"Warning: Missing column in history data: {c}")

# Enrich historical data with behavioral features
def enrich_with_behavioral_data(df, interactions_df, scoring_df):
    if len(interactions_df) > 0 and len(scoring_df) > 0:
        # Aggregate interaction data by event/genre/city
        interaction_agg = interactions_df.groupby(['interaction_type']).size().reset_index(name='interaction_count')
        avg_propensity = scoring_df['propensity_score'].mean() if 'propensity_score' in scoring_df.columns else 0.5
        avg_monetary = scoring_df['monetary_value'].mean() if 'monetary_value' in scoring_df.columns else 100
        
        df['avg_customer_propensity'] = avg_propensity
        df['avg_customer_monetary'] = avg_monetary
        df['historical_interactions'] = len(interactions_df)
    else:
        df['avg_customer_propensity'] = 0.5
        df['avg_customer_monetary'] = 100
        df['historical_interactions'] = 0
    return df

hist = enrich_with_behavioral_data(hist, interactions, scoring)

base_features = ["date","city","venue","genre","ticket_price","marketing_spend",
                "google_trends_genre","instagram_mentions","temp_c","precip_mm",
                "day_of_week","is_holiday_brazil_hint","capacity"]

behavioral_features = ["avg_customer_propensity", "avg_customer_monetary", "historical_interactions"]
all_features = base_features + behavioral_features

X = hist[all_features].copy()
y_tickets = hist["sold_tickets"].fillna(0).astype(float)
y_revenue = hist["revenue"].fillna(0).astype(float)

X["month"] = pd.to_datetime(X["date"]).dt.month
X["dow_num"] = pd.to_datetime(X["date"]).dt.dayofweek
X = X.drop(columns=["date"])

# Enrich future data with behavioral features
future = enrich_with_behavioral_data(future, interactions, scoring)

futureX = future[all_features].copy()
futureX["month"] = pd.to_datetime(futureX["date"]).dt.month
futureX["dow_num"] = pd.to_datetime(futureX["date"]).dt.dayofweek
futureX = futureX.drop(columns=["date"])

categoricals = ["city","venue","genre","day_of_week"]
numericals = [
    "ticket_price","marketing_spend","google_trends_genre","instagram_mentions",
    "temp_c","precip_mm","is_holiday_brazil_hint","capacity","month","dow_num",
    "avg_customer_propensity","avg_customer_monetary","historical_interactions"
]

pre = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore"), categoricals),
    ("num", "passthrough", numericals)
])

tickets_model = Pipeline([("pre", pre), ("gb", GradientBoostingRegressor(random_state=42))])
revenue_model = Pipeline([("pre", pre), ("gb", GradientBoostingRegressor(random_state=42))])

msk = np.random.RandomState(42).rand(len(X)) < 0.85
Xtr, Xte = X[msk], X[~msk]
yt_tr, yt_te = y_tickets[msk], y_tickets[~msk]
yr_tr, yr_te = y_revenue[msk], y_revenue[~msk]

tickets_model.fit(Xtr, yt_tr)
revenue_model.fit(Xtr, yr_tr)

pred_t_test = tickets_model.predict(Xte)
pred_r_test = revenue_model.predict(Xte)

metrics = {
    "tickets_r2": float(r2_score(yt_te, pred_t_test)) if len(yt_te)>0 else None,
    "tickets_mae": float(mean_absolute_error(yt_te, pred_t_test)) if len(yt_te)>0 else None,
    "revenue_r2": float(r2_score(yr_te, pred_r_test)) if len(yr_te)>0 else None,
    "revenue_mae": float(mean_absolute_error(yr_te, pred_r_test)) if len(yr_te)>0 else None
}

future_pred_t = tickets_model.predict(futureX)
future_pred_r = revenue_model.predict(futureX)

out = future.copy()
out["pred_sold_tickets"] = np.maximum(0, future_pred_t).round().astype(int)
out["pred_revenue"] = np.maximum(0, future_pred_r).round(2)

top5 = out.sort_values("pred_revenue", ascending=False).head(5)
summary = {
    "total_events": int(out.shape[0]),
    "sum_pred_tickets": int(out["pred_sold_tickets"].sum()),
    "sum_pred_revenue": float(out["pred_revenue"].sum()),
    "top5_by_revenue": top5[["date","city","venue","genre","ticket_price","marketing_spend",
                             "pred_sold_tickets","pred_revenue"]].to_dict(orient="records")
}

print(json.dumps({"metrics": metrics, "forecast": out.to_dict(orient="records"), "summary": summary}))

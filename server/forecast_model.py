import sys, json
import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.ensemble import GradientBoostingRegressor

hist_path, future_path = sys.argv[1], sys.argv[2]
hist = pd.read_csv(hist_path)
future = pd.read_csv(future_path)

required_cols = [
    "date","city","venue","artist","genre","ticket_price","marketing_spend",
    "google_trends_genre","instagram_mentions","temp_c","precip_mm","day_of_week",
    "is_holiday_brazil_hint","capacity","sold_tickets","revenue"
]
for c in required_cols:
    if c not in hist.columns:
        raise ValueError(f"Missing column in history data: {c}")

X = hist[["date","city","venue","genre","ticket_price","marketing_spend",
          "google_trends_genre","instagram_mentions","temp_c","precip_mm",
          "day_of_week","is_holiday_brazil_hint","capacity"]].copy()
y_tickets = hist["sold_tickets"].astype(float)
y_revenue = hist["revenue"].astype(float)

X["month"] = pd.to_datetime(X["date"]).dt.month
X["dow_num"] = pd.to_datetime(X["date"]).dt.dayofweek
X = X.drop(columns=["date"])

futureX = future[["date","city","venue","genre","ticket_price","marketing_spend",
                  "google_trends_genre","instagram_mentions","temp_c","precip_mm",
                  "day_of_week","is_holiday_brazil_hint","capacity"]].copy()
futureX["month"] = pd.to_datetime(futureX["date"]).dt.month
futureX["dow_num"] = pd.to_datetime(futureX["date"]).dt.dayofweek
futureX = futureX.drop(columns=["date"])

categoricals = ["city","venue","genre","day_of_week"]
numericals = [
    "ticket_price","marketing_spend","google_trends_genre","instagram_mentions",
    "temp_c","precip_mm","is_holiday_brazil_hint","capacity","month","dow_num"
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

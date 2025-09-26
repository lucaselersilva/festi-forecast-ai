import React, { useState } from "react";
import { forecast } from "../lib/api";

export default function RealForecastPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Starting database-powered forecast...");
      const data = await forecast();
      setResult(data);
      console.log("Forecast completed with database data");
    } catch (e: any) {
      console.error("Forecast error:", e);
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-2xl space-y-3">
      <h2 className="text-xl font-semibold">Previsão com IA + Dados Comportamentais</h2>
      <p className="text-sm opacity-80">
        Usa modelos ML em Python com dados reais do banco: eventos, interações de usuários e scoring de propensão.
      </p>
      <button onClick={run} disabled={loading} className="px-3 py-2 rounded-xl border">
        {loading ? "Prevendo..." : "Rodar previsão"}
      </button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {result && (
        <div className="space-y-2">
          <div className="text-sm">
            <b>Métricas (holdout):</b> R² tickets {result.metrics.tickets_r2?.toFixed(3)} |
            MAE tickets {result.metrics.tickets_mae?.toFixed(1)} | R² receita {result.metrics.revenue_r2?.toFixed(3)} |
            MAE receita {result.metrics.revenue_mae?.toFixed(2)}
          </div>
          <div className="text-sm">
            <b>Resumo:</b> {result.summary.total_events} eventos | {result.summary.sum_pred_tickets} ingressos | R$ {result.summary.sum_pred_revenue.toLocaleString("pt-BR")}
          </div>
          <div className="max-h-64 overflow-auto text-sm">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left">Data</th>
                  <th className="text-left">Cidade</th>
                  <th>Local</th>
                  <th>Gênero</th>
                  <th>Tickets</th>
                  <th>Receita (R$)</th>
                </tr>
              </thead>
              <tbody>
                {result.summary.top5_by_revenue.map((r: any, i: number) => (
                  <tr key={i}>
                    <td>{r.date}</td>
                    <td>{r.city}</td>
                    <td>{r.venue}</td>
                    <td>{r.genre}</td>
                    <td>{r.pred_sold_tickets}</td>
                    <td>{r.pred_revenue.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

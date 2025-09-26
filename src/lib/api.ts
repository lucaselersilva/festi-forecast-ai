import axios from "axios";

export async function forecast() {
  const { data } = await axios.post("/api/forecast");
  return data as {
    metrics: {
      tickets_r2: number | null;
      tickets_mae: number | null;
      revenue_r2: number | null;
      revenue_mae: number | null;
    };
    forecast: any[];
    summary: any;
  };
}

import express from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const DATA_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

app.post("/api/forecast", async (req, res) => {
  try {
    const history = req.body.historyCsvPath || path.join(DATA_DIR, "events_history_quase_reais.csv");
    const future  = req.body.futureCsvPath  || path.join(DATA_DIR, "events_future_to_forecast.csv");

    if (!fs.existsSync(history)) return res.status(400).json({ error: `historyCsvPath not found: ${history}` });
    if (!fs.existsSync(future))  return res.status(400).json({ error: `futureCsvPath not found: ${future}` });

    const py = spawn("python", [path.join(__dirname, "forecast_model.py"), history, future], { cwd: __dirname });

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", d => { stdout += d.toString(); });
    py.stderr.on("data", d => { stderr += d.toString(); });

    py.on("close", code => {
      if (code !== 0) {
        return res.status(500).json({ error: "Model error", detail: stderr || stdout });
      }
      try {
        const parsed = JSON.parse(stdout);
        res.json(parsed);
      } catch (e: any) {
        res.status(500).json({ error: "Failed to parse model output", detail: e.message, raw: stdout });
      }
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// endpoint opcional para insights com LLM
app.post("/api/insight", async (req, res) => {
  const { summary } = req.body;
  if (!process.env.OPENAI_API_KEY) return res.status(400).json({ error: "OPENAI_API_KEY not configured" });
  // implemente aqui a chamada ao seu provedor de IA (ex.: OpenAI)
  res.json({
    ok: true,
    suggestion: "Com base no pico de demanda aos sábados e impacto positivo de tendências, suba o preço 5–8% em eventos com score de tendências >75 e marketing acima da mediana."
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

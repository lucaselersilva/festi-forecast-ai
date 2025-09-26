import express from "express";
import cors from "cors";
import { config } from "./config";
import pricingRoutes from "./routes/pricing";
import recommendRoutes from "./routes/recommend";
import marketingRoutes from "./routes/marketing";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv 
  });
});

// API Routes
app.use("/api/pricing", pricingRoutes);
app.use("/api/recommend", recommendRoutes);
app.use("/api/marketing", marketingRoutes);

// Legacy forecast endpoint (keep existing functionality)
app.post("/api/forecast", async (req, res) => {
  try {
    const { spawn } = await import("child_process");
    const path = await import("path");
    const fs = await import("fs");
    
    const DATA_DIR = path.resolve(process.cwd(), "data");
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

    const history = req.body.historyCsvPath || path.join(DATA_DIR, "events_history_quase_reais.csv");
    const future = req.body.futureCsvPath || path.join(DATA_DIR, "events_future_to_forecast.csv");

    if (!fs.existsSync(history)) return res.status(400).json({ error: `historyCsvPath not found: ${history}` });
    if (!fs.existsSync(future)) return res.status(400).json({ error: `futureCsvPath not found: ${future}` });

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

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    message: config.nodeEnv === "development" ? err.message : "Something went wrong"
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const server = app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${config.port}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

export default app;

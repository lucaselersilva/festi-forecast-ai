const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
require("dotenv").config();
require("tsx/register");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Import TypeScript routes
const segmentationRouter = require("./routes/segmentation").default;

// Mount routes
app.use("/api/segmentation", segmentationRouter);

// POST /api/forecast
app.post("/api/forecast", async (req, res) => {
  try {
    console.log("Starting forecast prediction...");
    
    const py = spawn("python", [path.join(__dirname, "forecast_model.py")], { 
      cwd: __dirname,
      env: {
        ...process.env,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
    
    let output = "";
    let error = "";
    
    py.stdout.on("data", (data) => {
      output += data.toString();
    });
    
    py.stderr.on("data", (data) => {
      error += data.toString();
      console.error("Python error:", data.toString());
    });
    
    py.on("close", (code) => {
      if (code !== 0) {
        console.error("Python process failed with code:", code);
        console.error("Error output:", error);
        return res.status(500).json({ 
          error: "Forecast model failed", 
          details: error,
          code 
        });
      }
      
      try {
        const result = JSON.parse(output);
        console.log("Forecast completed successfully");
        res.json(result);
      } catch (parseError) {
        console.error("Failed to parse model output:", parseError);
        console.error("Raw output:", output);
        res.status(500).json({ 
          error: "Failed to parse model output", 
          details: parseError.message,
          rawOutput: output 
        });
      }
    });
    
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ 
      error: "Internal server error", 
      details: err.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Forecast API server running on port ${PORT}`);
});
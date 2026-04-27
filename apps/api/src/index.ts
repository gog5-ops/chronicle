import express from "express";
import cors from "cors";
import { config } from "./config.js";
import chronicleRoutes from "./routes/chronicle.js";
import workersRoutes from "./routes/workers.js";
import auditRoutes from "./routes/audit.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "hermes-api",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/chronicle", chronicleRoutes);
app.use("/api/workers", workersRoutes);
app.use("/api/audit", auditRoutes);

// Start server
app.listen(config.port, () => {
  console.log(`[hermes-api] listening on port ${config.port}`);
  console.log(`[hermes-api] wiki path: ${config.wikiPath}`);
  console.log(`[hermes-api] data path: ${config.dataPath}`);
});

export default app;

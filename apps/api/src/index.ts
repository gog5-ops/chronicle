import express from "express";
import cors from "cors";
import { config } from "./config.js";
import chronicleRoutes from "./routes/chronicle.js";
import workersRoutes from "./routes/workers.js";
import auditRoutes from "./routes/audit.js";
import healthRoutes from "./routes/health.js";
import opsLogRoutes from "./routes/ops-log.js";
import statsRoutes from "./routes/stats.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/chronicle", chronicleRoutes);
app.use("/api/workers", workersRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/ops-log", opsLogRoutes);
app.use("/api/stats", statsRoutes);

// Start server
app.listen(config.port, () => {
  console.log(`[hermes-api] listening on port ${config.port}`);
  console.log(`[hermes-api] wiki path: ${config.wikiPath}`);
  console.log(`[hermes-api] data path: ${config.dataPath}`);
});

export default app;

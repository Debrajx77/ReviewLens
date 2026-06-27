import crypto from "node:crypto";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { analyzeWithGemini } from "./analyzer.js";
import { getReport, saveReport } from "./db.js";
import { resolveSourceText } from "./source.js";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: "1.5mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, app: "ReviewLens" });
});

app.post("/api/analyze", async (request, response) => {
  try {
    const input = String(request.body?.input || "").trim();
    const requestedType = request.body?.inputType || "auto";

    if (input.length < 20) {
      return response.status(400).json({ error: "Paste more review text or enter a full product URL." });
    }

    if (!["auto", "url", "reviews"].includes(requestedType)) {
      return response.status(400).json({ error: "inputType must be auto, url, or reviews." });
    }

    const source = await resolveSourceText(input, requestedType);
    const analysis = await analyzeWithGemini(source);
    const shareId = shortId();

    await saveReport({
      id: shareId,
      inputType: source.inputType,
      inputPreview: source.inputPreview,
      analysis
    });

    response.json({
      shareId,
      reportUrl: `/report/${shareId}`,
      analysis
    });
  } catch (error) {
    response.status(500).json({ error: error.message || "Analysis failed." });
  }
});

app.get("/api/reports/:id", async (request, response) => {
  const report = await getReport(request.params.id);

  if (!report) {
    return response.status(404).json({ error: "Report not found." });
  }

  response.json(report);
});

function shortId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

export default app;

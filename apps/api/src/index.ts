import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { debriefRouter } from "./routes/debrief";
import { githubRouter } from "./routes/github";
import { askRouter } from "./routes/ask";
import { digestRouter } from "./routes/digest";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "engineering-intelligence-api" });
});

app.use("/api/debrief", debriefRouter);
app.use("/api/github", githubRouter);
app.use("/api/ask", askRouter);
app.use("/api/digest", digestRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

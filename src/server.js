import express from "express";
import cors from "cors";
import morgan from "morgan";
import { z } from "zod";
import { piRequest } from "./pi.js";
import fetch from "node-fetch";

const PORT = Number(process.env.PORT || 8788);
const PI_API_BASE = process.env.PI_API_BASE || "https://api.minepi.com/v2";
const PI_SERVER_API_KEY = process.env.PI_SERVER_API_KEY || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const RELAY_INGEST_URL = process.env.RELAY_INGEST_URL || "";
const RELAY_INGEST_TOKEN = process.env.RELAY_INGEST_TOKEN || "";

if (!PI_SERVER_API_KEY) {
  console.warn("[WARN] PI_SERVER_API_KEY missing. approve/complete will fail until you set it.");
}

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "256kb" }));
app.use(morgan("dev"));

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "freedome-payments-backend", piApiBase: PI_API_BASE });
});

const ApproveSchema = z.object({ paymentId: z.string().min(3) });

app.post("/api/pi/approve", async (req, res) => {
  const parsed = ApproveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const { paymentId } = parsed.data;
  try {
    const data = await piRequest({
      base: PI_API_BASE,
      path: `/payments/${encodeURIComponent(paymentId)}/approve`,
      method: "POST",
      apiKey: PI_SERVER_API_KEY,
      jsonBody: {},
    });
    res.json({ ok: true, paymentId, pi: data });
  } catch (e) {
    res.status(e.status || 500).json({ ok: false, error: e.message, details: e.data || null });
  }
});

const CompleteSchema = z.object({ paymentId: z.string().min(3), txid: z.string().min(3) });

app.post("/api/pi/complete", async (req, res) => {
  const parsed = CompleteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const { paymentId, txid } = parsed.data;
  try {
    const data = await piRequest({
      base: PI_API_BASE,
      path: `/payments/${encodeURIComponent(paymentId)}/complete`,
      method: "POST",
      apiKey: PI_SERVER_API_KEY,
      jsonBody: { txid },
    });

    // Optional: forward to Relay ingest if configured (nice for keeping UI simple)
    let relay = null;
    if (RELAY_INGEST_URL) {
      try {
        const r = await fetch(RELAY_INGEST_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(RELAY_INGEST_TOKEN ? { "x-ingest-token": RELAY_INGEST_TOKEN } : {})
          },
          body: JSON.stringify({ paymentId, txid })
        });
        relay = { ok: r.ok, status: r.status };
      } catch (err) {
        relay = { ok: false, error: String(err?.message || err) };
      }
    }

    res.json({ ok: true, paymentId, txid, pi: data, relay });
  } catch (e) {
    res.status(e.status || 500).json({ ok: false, error: e.message, details: e.data || null });
  }
});

// Optional utility: verify user token against /me (Bearer token)
const VerifyMeSchema = z.object({ accessToken: z.string().min(10) });
app.post("/api/pi/verify-me", async (req, res) => {
  const parsed = VerifyMeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  try {
    const data = await piRequest({
      base: PI_API_BASE,
      path: `/me`,
      method: "GET",
      bearer: parsed.data.accessToken
    });
    res.json({ ok: true, me: data });
  } catch (e) {
    res.status(e.status || 500).json({ ok: false, error: e.message, details: e.data || null });
  }
});

app.listen(PORT, () => {
  console.log(`Freedome Payments Backend listening on http://0.0.0.0:${PORT}`);
});

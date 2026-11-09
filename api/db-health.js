"use strict";

// Endpoint privado usado por Vercel Cron. Nunca expone datos de la base de datos.
const crypto = require("node:crypto");
const { probeDatabase } = require("../services/dbHealthService");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false });
  }

  const secret = process.env.CRON_SECRET;
  const received = req.headers.authorization;
  const expected = secret ? Buffer.from("Bearer " + secret) : null;
  const candidate = typeof received === "string" ? Buffer.from(received) : null;

  if (
    !expected ||
    !candidate ||
    expected.length !== candidate.length ||
    !crypto.timingSafeEqual(expected, candidate)
  ) {
    return res.status(401).json({ ok: false });
  }

  const result = await probeDatabase();
  console[result.ok ? "info" : "warn"](
    "[DB-HEALTH] cron " +
      (result.ok ? "read_ok" : "read_failed (" + result.reason + (result.code ? ":" + result.code : "") + ")"),
  );

  return res.status(result.ok ? 200 : 503).json({
    ok: result.ok,
    database: result.ok ? "reachable" : "unavailable",
    timestamp: new Date().toISOString(),
  });
};

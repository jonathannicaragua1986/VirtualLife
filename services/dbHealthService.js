"use strict";

// Comprobacion interna de solo lectura. No devuelve filas ni datos personales.
const { createClient } = require("@supabase/supabase-js");
const QUERY_TIMEOUT_MS = 8000;

async function probeDatabase() {
  const url = (process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_ANON_KEY || "").trim();

  if (!url || !key) return { ok: false, reason: "configuration" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);
  if (typeof timer.unref === "function") timer.unref();

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // HEAD obliga a PostgREST a ejecutar una lectura SQL sin transmitir filas.
    // La tabla "juegos" ya se utiliza en el catalogo publico de Virtual Life.
    const { error } = await supabase
      .from("juegos")
      .select("id", { head: true })
      .limit(1)
      .abortSignal(controller.signal);

    if (error) {
      return { ok: false, reason: "query", code: error.code || "unknown" };
    }
    return { ok: true };
  } catch (_) {
    return { ok: false, reason: "transport" };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { probeDatabase };

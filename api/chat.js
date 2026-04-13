/**
 * VIRTUAL LIFE - Endpoint de Chat (Vercel Serverless)
 * Delega toda la lógica IA a services/chatService.js
 * Versión: 6.0.0
 */

"use strict";

const { processChatMessage } = require("../services/chatService");

// ============================================================
// RATE LIMITING (memoria en proceso — resetea con cada cold start)
// ============================================================
const rateLimitMap  = new Map();
const RL_WINDOW_MS  = 60_000; // Ventana: 1 minuto
const RL_MAX        = 20;     // Máximo 20 mensajes por minuto por IP

function checkRateLimit(ip) {
  const now    = Date.now();
  const record = rateLimitMap.get(ip);

  // Protección de memoria: limpiar mapa si crece demasiado
  if (rateLimitMap.size > 5000) rateLimitMap.clear();

  if (!record || (now - record.start) > RL_WINDOW_MS) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }
  if (record.count >= RL_MAX) return false;
  record.count++;
  return true;
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // Rate limiting
    const clientIP = req.headers["x-forwarded-for"]
      || req.headers["x-real-ip"]
      || "unknown";

    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        response: "Estoy recibiendo muchos mensajes. Esperá un momentito y volvé a intentar. 😊",
        source:   "rate-limit",
      });
    }

    // Validar body
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "El mensaje es requerido" });
    }

    const sanitizedMessage = message.trim().substring(0, 1000);
    const chatHistory      = Array.isArray(history) ? history.slice(-20) : [];

    // Procesar con el servicio centralizado
    const result = await processChatMessage(sanitizedMessage, chatHistory, process.env);

    return res.status(200).json({
      response: result.response,
      source:   result.source,
    });

  } catch (error) {
    console.error("[Vercel Chat] Error crítico:", error.message);
    return res.status(200).json({
      response: "Lo siento, tuve un problema técnico. ¿Me podrías repetir eso?",
      source:   "error",
    });
  }
};

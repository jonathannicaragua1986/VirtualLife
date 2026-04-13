/**
 * VIRTUAL LIFE - Endpoint de Diagnóstico del Chatbot (Vercel Serverless)
 * Versión: 6.0.0
 */

"use strict";

const { GEMINI_31_MODELS, GEMINI_25_MODELS } = require("../services/chatService");

module.exports = function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const hasGemini = !!(process.env.GEMINI_API_KEY?.trim());

  res.status(200).json({
    version:          "6.0.0",
    geminiConfigured: hasGemini,
    primaryEngine:    hasGemini ? "Gemini 3.1 (flash-lite-preview → pro-preview)" : "Respuestas locales",
    fallbackEngine:   hasGemini ? "Gemini 2.5 (pro → flash)"                      : "—",
    emergencyEngine:  "Respuestas locales pre-programadas",
    models: {
      tier1_primary:  GEMINI_31_MODELS,
      tier2_fallback: GEMINI_25_MODELS,
    },
    status: hasGemini
      ? "✅ Gemini activo: 3.1 principal · 2.5 respaldo automático"
      : "❌ Sin API Key — solo respuestas locales de emergencia",
  });
};

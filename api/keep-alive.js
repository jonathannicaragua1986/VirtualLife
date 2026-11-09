/**
 * Keep-alive de Virtual Life. Conserva la respuesta publica historica.
 * Realiza internamente una lectura HEAD en Supabase y solo registra su estado
 * en logs de Vercel; nunca devuelve informacion de las tablas.
 */
"use strict";
const { probeDatabase } = require("../services/dbHealthService");

module.exports = async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    const result = await probeDatabase();
    console[result.ok ? "info" : "warn"](
        "[DB-HEALTH] keep-alive " +
        (result.ok ? "read_ok" : "read_failed (" + result.reason + (result.code ? ":" + result.code : "") + ")")
    );

    res.status(200).json({
        alive: true,
        timestamp: new Date().toISOString(),
        version: "5.0.0",
        service: "Virtual Life - Keep Alive",
        uptime: "serverless"
    });
};

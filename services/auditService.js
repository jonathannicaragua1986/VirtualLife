/**
 * VIRTUAL LIFE - Servicio de Auditoría con IA
 *
 * Evalúa automáticamente la calidad de cada conversación cerrada
 * usando Gemini. Genera un puntaje (1-10), fortalezas, debilidades
 * y recomendaciones que se guardan en la tabla `auditorias`.
 *
 * Versión: 1.0.0
 * Fecha: Abril 2026
 */

"use strict";

const { getConversationMessagesRaw } = require("./conversationService");

// ============================================================
// CONFIGURACIÓN
// ============================================================

const API_TIMEOUT_MS = 30000;
const AUDIT_MODEL = "gemini-2.5-flash"; // Modelo rápido para auditorías

// ============================================================
// LOGGER
// ============================================================

function log(level, message, data = null) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}] [Auditoría]`;
  const logFn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;
  if (data) {
    const str =
      typeof data === "string"
        ? data
        : JSON.stringify(data).substring(0, 500);
    logFn(`${prefix} ${message}`, str);
  } else {
    logFn(`${prefix} ${message}`);
  }
}

// ============================================================
// PROMPT DE AUDITORÍA
// ============================================================

const AUDIT_SYSTEM_PROMPT = `Eres un auditor de calidad de atención al cliente para "Virtual Life", un servicio móvil de realidad virtual en Nicaragua. Tu trabajo es evaluar conversaciones entre la asistente virtual "María" y los clientes.

DEBES responder ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin backticks. Solo el JSON puro.

Evalúa la conversación según estos criterios:
1. Calidez y naturalidad del trato (¿Suena como una persona real?)
2. Conocimiento del producto (¿Dio información correcta?)
3. Habilidad de venta (¿Llevó la conversación hacia una reserva?)
4. Manejo de objeciones o preguntas difíciles
5. Cierre efectivo (¿Ofreció WhatsApp, pidió reserva?)
6. Respuestas completas (¿Terminó sus oraciones? ¿Dio info suficiente?)

Responde con este JSON exacto:
{
  "puntaje": <número del 1 al 10>,
  "resumen": "<resumen breve de la conversación en 1-2 oraciones>",
  "fortalezas": ["<fortaleza 1>", "<fortaleza 2>"],
  "debilidades": ["<debilidad 1>", "<debilidad 2>"],
  "recomendaciones": ["<recomendación 1>", "<recomendación 2>"],
  "motivo_puntaje": "<explicación breve del por qué del puntaje>",
  "cliente_satisfecho": <true o false>,
  "venta_cerrada": <true o false>
}`;

// ============================================================
// AUDITORÍA DE CONVERSACIÓN
// ============================================================

/**
 * Audita una conversación cerrada usando Gemini.
 * Obtiene los mensajes de Supabase, los envía a Gemini para evaluación,
 * y guarda el resultado en la tabla `auditorias`.
 *
 * @param {object} supabase - Cliente de Supabase
 * @param {string} conversationId - ID de la conversación a auditar
 * @param {object} env - Variables de entorno (process.env)
 * @returns {object|null} - Auditoría creada o null si falló
 */
async function auditConversation(supabase, conversationId, env) {
  const apiKey = (env?.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    log("warn", "GEMINI_API_KEY no configurada. Omitiendo auditoría.");
    return null;
  }

  try {
    // 1. Obtener mensajes de la conversación
    const messages = await getConversationMessagesRaw(
      supabase,
      conversationId,
    );
    if (!messages || messages.length < 2) {
      log(
        "info",
        `Conversación ${conversationId} tiene menos de 2 mensajes. Omitiendo auditoría.`,
      );
      return null;
    }

    // 2. Formatear la conversación como texto
    const conversationText = messages
      .map((msg) => {
        const roleName = msg.rol === "usuario" ? "CLIENTE" : "MARÍA (Bot)";
        const time = new Date(msg.created_at).toLocaleTimeString("es-NI");
        return `[${time}] ${roleName}: ${msg.contenido}`;
      })
      .join("\n");

    log(
      "info",
      `Auditando conversación ${conversationId} (${messages.length} mensajes)...`,
    );

    // 3. Llamar a Gemini para la auditoría
    const auditResult = await callGeminiAudit(
      apiKey,
      conversationText,
      messages.length,
    );
    if (!auditResult) {
      log("warn", `No se pudo obtener auditoría para ${conversationId}`);
      return null;
    }

    // 4. Guardar en Supabase
    const { data: audit, error } = await supabase
      .from("auditorias")
      .insert([
        {
          conversacion_id: conversationId,
          puntaje: auditResult.puntaje,
          resumen: auditResult.resumen,
          fortalezas: auditResult.fortalezas,
          debilidades: auditResult.debilidades,
          recomendaciones: auditResult.recomendaciones,
          motivo_puntaje: auditResult.motivo_puntaje,
          cliente_satisfecho: auditResult.cliente_satisfecho,
          venta_cerrada: auditResult.venta_cerrada,
          fue_escalada: false,
          modelo_auditor: AUDIT_MODEL,
        },
      ])
      .select()
      .single();

    if (error) {
      log("error", `Error guardando auditoría: ${error.message}`);
      return null;
    }

    log(
      "info",
      `✅ Auditoría completada: ${conversationId} → Puntaje: ${auditResult.puntaje}/10 | Venta: ${auditResult.venta_cerrada ? "Sí" : "No"}`,
    );

    // 5. Actualizar resumen en la conversación
    await supabase
      .from("conversaciones")
      .update({ resumen_ia: auditResult.resumen })
      .eq("id", conversationId);

    return audit;
  } catch (error) {
    log("error", `Error en auditoría de ${conversationId}: ${error.message}`);
    return null;
  }
}

/**
 * Llama a Gemini para auditar una conversación.
 * Retorna el resultado parseado como JSON o null.
 */
async function callGeminiAudit(apiKey, conversationText, messageCount) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${AUDIT_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: AUDIT_SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Audita la siguiente conversación de atención al cliente (${messageCount} mensajes):\n\n${conversationText}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Baja para respuestas consistentes
          maxOutputTokens: 1000,
          responseMimeType: "application/json",
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${body.substring(0, 200)}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error("Respuesta vacía del modelo auditor");
    }

    // Parsear JSON de la respuesta
    const result = JSON.parse(candidateText);

    // Validar campos mínimos
    if (typeof result.puntaje !== "number" || result.puntaje < 1 || result.puntaje > 10) {
      result.puntaje = 5; // Default si el puntaje no es válido
    }

    return {
      puntaje: Math.round(result.puntaje),
      resumen: result.resumen || "Sin resumen disponible",
      fortalezas: Array.isArray(result.fortalezas) ? result.fortalezas : [],
      debilidades: Array.isArray(result.debilidades) ? result.debilidades : [],
      recomendaciones: Array.isArray(result.recomendaciones) ? result.recomendaciones : [],
      motivo_puntaje: result.motivo_puntaje || "",
      cliente_satisfecho: !!result.cliente_satisfecho,
      venta_cerrada: !!result.venta_cerrada,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      log("error", `Timeout en auditoría (${API_TIMEOUT_MS}ms)`);
    } else if (err instanceof SyntaxError) {
      log("error", `Error parseando JSON de auditoría: ${err.message}`);
    } else {
      log("error", `Error en llamada de auditoría: ${err.message}`);
    }
    return null;
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  auditConversation,
};

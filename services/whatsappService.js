/**
 * VIRTUAL LIFE - Servicio de WhatsApp Business (Meta Cloud API)
 *
 * Maneja el envío/recepción de mensajes vía WhatsApp Business API.
 * Incluye verificación de webhook, envío de texto y marcado de lectura.
 *
 * Versión: 1.0.0
 * Fecha: Abril 2026
 */

"use strict";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ============================================================
// LOGGER
// ============================================================

function log(level, message, data = null) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}] [WhatsApp]`;
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
        : JSON.stringify(data).substring(0, 300);
    logFn(`${prefix} ${message}`, str);
  } else {
    logFn(`${prefix} ${message}`);
  }
}

// ============================================================
// ENVÍO DE MENSAJES
// ============================================================

/**
 * Envía un mensaje de texto por WhatsApp.
 * @param {string} to - Número de destino (formato internacional sin +)
 * @param {string} text - Texto del mensaje
 * @param {object} env - Variables de entorno (process.env)
 */
async function sendTextMessage(to, text, env) {
  const token = env.WHATSAPP_TOKEN;
  const phoneId = env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    throw new Error("WHATSAPP_TOKEN o WHATSAPP_PHONE_ID no configurados");
  }

  // WhatsApp tiene un límite de ~4096 caracteres por mensaje
  // Dividir en fragmentos si es necesario
  const MAX_LENGTH = 4000;
  const chunks = [];
  for (let i = 0; i < text.length; i += MAX_LENGTH) {
    chunks.push(text.substring(i, i + MAX_LENGTH));
  }

  const url = `${GRAPH_API_BASE}/${phoneId}/messages`;
  const results = [];

  for (const chunk of chunks) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: to,
          type: "text",
          text: { preview_url: false, body: chunk },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      log("info", `✅ Mensaje enviado a ${to} (${chunk.length} chars)`);
      results.push(data);
    } catch (error) {
      log("error", `❌ Error enviando mensaje a ${to}: ${error.message}`);
      throw error;
    }
  }

  return results.length === 1 ? results[0] : results;
}

// ============================================================
// MARCADO DE LECTURA
// ============================================================

/**
 * Marca un mensaje entrante como "leído" (doble check azul).
 */
async function markAsRead(messageId, env) {
  const token = env.WHATSAPP_TOKEN;
  const phoneId = env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return;

  try {
    await fetch(`${GRAPH_API_BASE}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
    log("info", `✅ Mensaje ${messageId} marcado como leído`);
  } catch (error) {
    log("warn", `⚠️ No se pudo marcar como leído: ${error.message}`);
  }
}

// ============================================================
// EXTRACCIÓN DE DATOS DEL WEBHOOK
// ============================================================

/**
 * Extrae los datos relevantes de un payload de webhook de WhatsApp.
 * Retorna null si no es un evento de mensaje válido.
 */
function extractMessageData(body) {
  try {
    if (body?.object !== "whatsapp_business_account") return null;

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Ignorar eventos que no sean mensajes (statuses, etc.)
    if (!value?.messages || !value.messages.length) return null;

    const message = value.messages[0];
    const contact = value.contacts?.[0];

    // Manejar diferentes tipos de mensaje
    if (message.type === "text") {
      return {
        type: "text",
        from: message.from,
        messageId: message.id,
        timestamp: message.timestamp,
        contactName: contact?.profile?.name || "Desconocido",
        text: message.text?.body || "",
        isSupported: true,
      };
    }

    // Para otros tipos (imagen, audio, video, sticker, etc.)
    return {
      type: message.type,
      from: message.from,
      messageId: message.id,
      timestamp: message.timestamp,
      contactName: contact?.profile?.name || "Desconocido",
      text: null,
      isSupported: false,
    };
  } catch (error) {
    log("error", `Error extrayendo datos del webhook: ${error.message}`);
    return null;
  }
}

// ============================================================
// VERIFICACIÓN DEL WEBHOOK (Meta requiere esto al configurar)
// ============================================================

/**
 * Verifica el webhook de Meta (responde al challenge GET).
 */
function verifyWebhook(query, env) {
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
    log("info", "✅ Webhook verificado correctamente por Meta");
    return { success: true, challenge };
  }

  log("warn", "❌ Verificación de webhook fallida (token no coincide)");
  return { success: false };
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  sendTextMessage,
  markAsRead,
  extractMessageData,
  verifyWebhook,
};

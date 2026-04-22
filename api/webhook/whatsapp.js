/**
 * VIRTUAL LIFE - Webhook de WhatsApp (Vercel Serverless)
 *
 * Función serverless que recibe mensajes de WhatsApp Business API (Meta),
 * los procesa con María (chatService) y responde automáticamente.
 * Guarda todo en Supabase: leads, conversaciones, mensajes.
 *
 * Versión: 1.0.0
 * Fecha: Abril 2026
 */

"use strict";

const { createClient } = require("@supabase/supabase-js");
const { processChatMessage } = require("../../services/chatService");
const {
  sendTextMessage,
  markAsRead,
  extractMessageData,
  verifyWebhook,
} = require("../../services/whatsappService");
const {
  findOrCreateLead,
  findOrCreateConversation,
  saveMessage,
  getConversationHistory,
} = require("../../services/conversationService");
const { auditConversation } = require("../../services/auditService");

// ============================================================
// SUPABASE CLIENT (inicializado una vez por cold start)
// ============================================================

let supabase = null;
function getSupabase() {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
    );
  }
  return supabase;
}

// ============================================================
// LOGGER
// ============================================================

function log(level, message) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}] [WA-Webhook]`;
  const logFn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;
  logFn(`${prefix} ${message}`);
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

module.exports = async function handler(req, res) {
  // ---- GET: Verificación del webhook por Meta ----
  if (req.method === "GET") {
    log("info", "Solicitud de verificación de webhook");
    const result = verifyWebhook(req.query, process.env);
    if (result.success) {
      return res.status(200).send(result.challenge);
    }
    return res.status(403).send("Verificación fallida");
  }

  // ---- POST: Recepción de mensajes ----
  if (req.method === "POST") {
    // Responder inmediatamente a Meta (requisito: <5 segundos)
    res.status(200).send("EVENT_RECEIVED");

    try {
      const messageData = extractMessageData(req.body);
      if (!messageData) return;

      // Si no es texto, informar al usuario
      if (!messageData.isSupported) {
        log(
          "info",
          `Mensaje tipo '${messageData.type}' de ${messageData.from} (no soportado)`,
        );
        await sendTextMessage(
          messageData.from,
          "¡Hola! Por el momento solo puedo leer mensajes de texto. ¿Me podrías escribir tu consulta? 😊",
          process.env,
        );
        return;
      }

      log(
        "info",
        `📩 ${messageData.contactName} (${messageData.from}): "${messageData.text.substring(0, 80)}"`,
      );

      // Marcar como leído
      markAsRead(messageData.messageId, process.env).catch(() => {});

      const db = getSupabase();

      // Sin Supabase: responder sin persistencia
      if (!db) {
        log("warn", "Supabase no disponible. Respondiendo sin persistencia.");
        const result = await processChatMessage(
          messageData.text,
          [],
          process.env,
        );
        await sendTextMessage(messageData.from, result.response, process.env);
        return;
      }

      // 1. Buscar o crear lead
      const lead = await findOrCreateLead(db, {
        phone: messageData.from,
        name: messageData.contactName,
        channel: "whatsapp",
      });

      // 2. Buscar o crear conversación activa
      const { conversation, closedPrevious } =
        await findOrCreateConversation(db, lead.id, "whatsapp");

      // 3. Auditar conversación cerrada (en background)
      if (closedPrevious) {
        auditConversation(db, closedPrevious.id, process.env).catch((err) =>
          log("error", `Error en auditoría: ${err.message}`),
        );
      }

      // 4. Guardar mensaje del usuario
      await saveMessage(db, {
        conversationId: conversation.id,
        role: "usuario",
        content: messageData.text,
        metadata: {
          whatsapp_msg_id: messageData.messageId,
          contact_name: messageData.contactName,
        },
      });

      // 5. Obtener historial
      const history = await getConversationHistory(db, conversation.id, 15);

      // 6. Procesar con María
      const result = await processChatMessage(
        messageData.text,
        history,
        process.env,
      );

      // 7. Guardar respuesta
      await saveMessage(db, {
        conversationId: conversation.id,
        role: "asistente",
        content: result.response,
        metadata: { source: result.source },
      });

      // 8. Enviar por WhatsApp
      await sendTextMessage(messageData.from, result.response, process.env);

      log(
        "info",
        `✅ Respuesta a ${messageData.contactName} (${result.source})`,
      );
    } catch (error) {
      log("error", `Error procesando mensaje: ${error.message}`);
      try {
        const msgData = extractMessageData(req.body);
        if (msgData?.from) {
          await sendTextMessage(
            msgData.from,
            "Disculpá, tuve un problema técnico momentáneo. ¿Podrías repetir tu mensaje? 🙏",
            process.env,
          );
        }
      } catch (e) {
        log("error", `Error enviando mensaje de error: ${e.message}`);
      }
    }

    return;
  }

  // Otros métodos no permitidos
  return res.status(405).json({ error: "Método no permitido" });
};

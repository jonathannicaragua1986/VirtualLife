/**
 * VIRTUAL LIFE - Servicio de Conversaciones
 *
 * Gestiona leads, conversaciones y mensajes en Supabase.
 * Centraliza toda la lógica de persistencia del chatbot multicanal.
 *
 * Versión: 1.0.0
 * Fecha: Abril 2026
 */

"use strict";

// Tiempo máximo de inactividad antes de cerrar una conversación (minutos)
const CONVERSATION_TIMEOUT_MINUTES = 30;

// ============================================================
// LOGGER
// ============================================================

function log(level, message, data = null) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}] [Conversaciones]`;
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
// GESTIÓN DE LEADS
// ============================================================

/**
 * Busca un lead por número de teléfono/WhatsApp, o crea uno nuevo.
 */
async function findOrCreateLead(supabase, { phone, name, channel }) {
  const normalizedPhone = phone.replace(/[\s\-\(\)\+]/g, "");

  // Buscar lead existente por teléfono o whatsapp
  const { data: existing } = await supabase
    .from("leads")
    .select("*")
    .or(`telefono.eq.${normalizedPhone},whatsapp.eq.${normalizedPhone}`)
    .limit(1)
    .maybeSingle();

  if (existing) {
    log(
      "info",
      `Lead existente: ${existing.id} (${existing.nombre || normalizedPhone})`,
    );

    // Actualizar nombre si no tenía uno
    if (!existing.nombre && name) {
      await supabase
        .from("leads")
        .update({ nombre: name, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    return existing;
  }

  // Crear nuevo lead
  const { data: newLead, error } = await supabase
    .from("leads")
    .insert([
      {
        nombre: name || null,
        telefono: normalizedPhone,
        whatsapp: normalizedPhone,
        canal_origen: channel || "whatsapp",
        estado: "nuevo",
      },
    ])
    .select()
    .single();

  if (error) {
    log("error", `Error creando lead: ${error.message}`);
    throw error;
  }

  log(
    "info",
    `✅ Nuevo lead creado: ${newLead.id} (${name || normalizedPhone})`,
  );
  return newLead;
}

// ============================================================
// GESTIÓN DE CONVERSACIONES
// ============================================================

/**
 * Busca una conversación activa para un lead, o crea una nueva.
 * Si la conversación anterior expiró (>30 min inactiva), la cierra primero.
 * Retorna { conversation, isNew, closedPrevious }
 */
async function findOrCreateConversation(
  supabase,
  leadId,
  channel = "whatsapp",
) {
  // Buscar conversación activa más reciente
  const { data: active } = await supabase
    .from("conversaciones")
    .select("*")
    .eq("lead_id", leadId)
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (active) {
    // Verificar timeout: usar updated_at o created_at
    const lastActivity = new Date(active.updated_at || active.created_at);
    const now = new Date();
    const minutesSinceActivity = (now - lastActivity) / 1000 / 60;

    if (minutesSinceActivity < CONVERSATION_TIMEOUT_MINUTES) {
      log(
        "info",
        `Conversación activa: ${active.id} (${Math.round(minutesSinceActivity)} min)`,
      );

      // Actualizar updated_at para refrescar el timeout
      await supabase
        .from("conversaciones")
        .update({ updated_at: now.toISOString() })
        .eq("id", active.id);

      return { conversation: active, isNew: false, closedPrevious: null };
    }

    // Conversación expirada → cerrar y crear nueva
    log(
      "info",
      `Cerrando conversación expirada: ${active.id} (${Math.round(minutesSinceActivity)} min)`,
    );
    const closed = await closeConversation(supabase, active.id);
    const newConv = await createConversation(supabase, leadId, channel);
    return { conversation: newConv, isNew: true, closedPrevious: closed };
  }

  // No hay conversación activa → crear nueva
  const newConv = await createConversation(supabase, leadId, channel);
  return { conversation: newConv, isNew: true, closedPrevious: null };
}

/**
 * Crea una nueva conversación.
 */
async function createConversation(supabase, leadId, channel = "whatsapp") {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("conversaciones")
    .insert([
      {
        lead_id: leadId,
        canal: channel,
        estado: "activa",
        modelo_ia: "gemini",
        inicio: now,
        updated_at: now,
      },
    ])
    .select()
    .single();

  if (error) {
    log("error", `Error creando conversación: ${error.message}`);
    throw error;
  }

  log("info", `✅ Nueva conversación creada: ${data.id}`);
  return data;
}

/**
 * Cierra una conversación y calcula su duración.
 */
async function closeConversation(supabase, conversationId) {
  const { data: conv } = await supabase
    .from("conversaciones")
    .select("inicio")
    .eq("id", conversationId)
    .single();

  const now = new Date();
  const inicio = conv?.inicio ? new Date(conv.inicio) : now;
  const duracionSegundos = Math.floor((now - inicio) / 1000);

  const { data, error } = await supabase
    .from("conversaciones")
    .update({
      estado: "cerrada",
      fin: now.toISOString(),
      duracion_segundos: duracionSegundos,
      updated_at: now.toISOString(),
    })
    .eq("id", conversationId)
    .select()
    .single();

  if (error) {
    log("error", `Error cerrando conversación: ${error.message}`);
    throw error;
  }

  log(
    "info",
    `✅ Conversación ${conversationId} cerrada (${duracionSegundos}s)`,
  );
  return data;
}

// ============================================================
// GESTIÓN DE MENSAJES
// ============================================================

/**
 * Guarda un mensaje en la base de datos.
 */
async function saveMessage(
  supabase,
  { conversationId, role, content, type = "texto", metadata = null },
) {
  const { data, error } = await supabase
    .from("mensajes")
    .insert([
      {
        conversacion_id: conversationId,
        rol: role, // "usuario" | "asistente"
        contenido: content,
        tipo: type,
        metadata: metadata,
      },
    ])
    .select()
    .single();

  if (error) {
    log("error", `Error guardando mensaje: ${error.message}`);
    throw error;
  }

  return data;
}

/**
 * Obtiene el historial de mensajes de una conversación.
 * Formateado para enviar al chatService ({type, text}).
 */
async function getConversationHistory(supabase, conversationId, limit = 20) {
  const { data: messages, error } = await supabase
    .from("mensajes")
    .select("rol, contenido, created_at")
    .eq("conversacion_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    log("error", `Error obteniendo historial: ${error.message}`);
    return [];
  }

  return (messages || []).map((msg) => ({
    type: msg.rol === "usuario" ? "user" : "bot",
    text: msg.contenido,
  }));
}

/**
 * Obtiene todos los mensajes en texto plano (para auditoría).
 */
async function getConversationMessagesRaw(supabase, conversationId) {
  const { data: messages, error } = await supabase
    .from("mensajes")
    .select("rol, contenido, created_at")
    .eq("conversacion_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    log("error", `Error obteniendo mensajes para auditoría: ${error.message}`);
    return [];
  }

  return messages || [];
}

// ============================================================
// GESTIÓN DE ESTADO DE LEADS
// ============================================================

/**
 * Actualiza el estado de un lead.
 */
async function updateLeadStatus(supabase, leadId, estado, notas = null) {
  const update = { estado, updated_at: new Date().toISOString() };
  if (notas) update.notas = notas;

  const { error } = await supabase
    .from("leads")
    .update(update)
    .eq("id", leadId);

  if (error) {
    log("warn", `Error actualizando lead ${leadId}: ${error.message}`);
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  findOrCreateLead,
  findOrCreateConversation,
  createConversation,
  closeConversation,
  saveMessage,
  getConversationHistory,
  getConversationMessagesRaw,
  updateLeadStatus,
  CONVERSATION_TIMEOUT_MINUTES,
};

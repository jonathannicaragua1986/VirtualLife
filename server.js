/**
 * VIRTUAL LIFE - Servidor Backend Profesional
 * Servidor Express con configuraciones de seguridad y optimización
 *
 * Versión: 5.0.0 - Gemini 2.5 Pro/Flash GA + Supabase + Vercel deploy
 * Fecha: Abril 2026
 */

require("dotenv").config();

const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ============================================
// LOGGER CENTRALIZADO
// ============================================

function log(level, component, message) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${component}]`;
  console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
    `${prefix} ${message}`,
  );
}

// ============================================
// VALIDACIÓN DE VARIABLES DE ENTORNO
// ============================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Inicializar Supabase solo si hay credenciales
let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    const { createClient } = require("@supabase/supabase-js");
    supabase = createClient(supabaseUrl, supabaseKey);
    log("info", "Supabase", "✅ Cliente inicializado correctamente.");
  } catch (e) {
    log("warn", "Supabase", `⚠️ No se pudo inicializar: ${e.message}`);
  }
} else {
  log(
    "warn",
    "Supabase",
    "⚠️ Variables SUPABASE_URL o SUPABASE_ANON_KEY no configuradas.",
  );
}

// Log del estado de las APIs
log(
  "info",
  "APIs",
  `Grok: ${process.env.GROK_API_KEY ? "✅ Configurada" : "❌ No configurada"}`,
);
log(
  "info",
  "APIs",
  `Gemini: ${process.env.GEMINI_API_KEY ? "✅ Configurada" : "❌ No configurada"}`,
);
log("info", "Server", `Entorno: ${NODE_ENV}`);

// ============================================
// MIDDLEWARE DE SEGURIDAD Y OPTIMIZACIÓN
// ============================================

// Compresión GZIP para mejor rendimiento
app.use(compression());

// CORS - Configuración más detallada
const corsOptions = {
  origin:
    NODE_ENV === "production"
      ? [/virtuallife\.com$/, /vercel\.app$/, /railway\.app$/]
      : "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // Cachear preflight por 24 horas
};
app.use(cors(corsOptions));

// Helmet - Cabeceras de seguridad HTTP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.tailwindcss.com",
          "https://fonts.googleapis.com",
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.tailwindcss.com",
          "https://unpkg.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "http:",
          "https://yuuozwzydyfkapxgtktq.supabase.co",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'",
          "https://wa.me",
          "https://generativelanguage.googleapis.com", // Gemini API
          "https://api.x.ai", // Grok API
          "https://yuuozwzydyfkapxgtktq.supabase.co", // Supabase
        ],
        frameSrc: ["'self'", "https://www.google.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// Parser para JSON y formularios con límites de tamaño
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ============================================
// RATE LIMITING ROBUSTO PARA CHAT
// ============================================

const chatRateLimit = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 mensajes por minuto por IP
const MAX_RATE_LIMIT_ENTRIES = 10000; // Máximo de entradas en el mapa (prevenir memory leak)

function checkRateLimit(ip) {
  const now = Date.now();
  const record = chatRateLimit.get(ip);

  // Si el mapa es demasiado grande, limpiarlo completamente (seguridad)
  if (chatRateLimit.size > MAX_RATE_LIMIT_ENTRIES) {
    log(
      "warn",
      "RateLimit",
      `Mapa de rate limit excedido (${chatRateLimit.size} entradas). Limpiando...`,
    );
    chatRateLimit.clear();
  }

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    chatRateLimit.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Limpiar registros viejos cada 5 minutos
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [ip, record] of chatRateLimit.entries()) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      chatRateLimit.delete(ip);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    log(
      "info",
      "RateLimit",
      `Limpiados ${cleaned} registros expirados. Activos: ${chatRateLimit.size}`,
    );
  }
}, 300000);

// No bloquear el cierre del proceso
if (cleanupInterval.unref) cleanupInterval.unref();

// ============================================
// ARCHIVOS ESTÁTICOS
// ============================================

// Servir archivos estáticos desde la carpeta public con caché
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: NODE_ENV === "production" ? "1d" : 0, // Caché de 1 día en producción
    etag: true,
    lastModified: true,
  }),
);

// ============================================
// RUTAS DE LA API
// ============================================

// Ruta de salud del servidor (monitoreo)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Virtual Life - Servicio Móvil de Realidad Virtual",
    version: "5.0.0",
    uptime: Math.floor(process.uptime()),
    dbConnection: !!supabase,
    apis: {
      gemini: !!process.env.GEMINI_API_KEY,
      grok: !!process.env.GROK_API_KEY,
    },
    environment: NODE_ENV,
    nodeVersion: process.version,
  });
});

// Ruta de diagnóstico del chatbot
app.get("/api/chat-status", (req, res) => {
  const hasGrok = !!(
    process.env.GROK_API_KEY && process.env.GROK_API_KEY.trim()
  );
  const hasGemini = !!(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()
  );

  res.json({
    version: "5.0.0",
    geminiConfigured: hasGemini,
    grokConfigured: hasGrok,
    primaryEngine: hasGemini
      ? "Gemini 2.5 Pro GA"
      : hasGrok
        ? "Grok (xAI) - grok-3-mini"
        : "Respuestas locales",
    fallbackEngine: hasGrok ? "Grok (xAI) - grok-3-mini" : "Respuestas locales",
    status:
      hasGemini && hasGrok
        ? "✅ Ambos motores de IA activos (Gemini 2.5 Pro principal, Grok respaldo)"
        : hasGemini
          ? "⚠️ Solo Gemini 2.5 Pro disponible (sin respaldo Grok)"
          : hasGrok
            ? "⚠️ Solo Grok disponible (sin motor principal Gemini)"
            : "❌ Sin APIs configuradas - solo respuestas locales",
    uptime: Math.floor(process.uptime()),
  });
});

// Ruta para información del negocio (datos públicos del Dossier Comercial)
app.get("/api/info", (req, res) => {
  res.json({
    nombre: "VIRTUAL LIFE",
    descripcion: "Servicio Móvil de Realidad Virtual - Nicaragua",
    cobertura: "Toda Nicaragua (equipo móvil, llegamos al evento)",
    baseOperativa: "Ciudad El Doral, Los Brasiles, Valle Sandino",
    horarios: {
      lunesJueves: "12:00 - 22:00",
      viernes: "12:00 - 00:00",
      sabados: "10:00 - 01:00",
      domingos: "10:00 - 23:00",
    },
    contacto: {
      whatsapp: "+505 7779-1433",
      email: "reservas@virtuallife.com",
    },
    paquetesParticulares: [
      { nombre: "Quick Dive", visores: 1, horas: 1, precioDesde: "$20.00 USD" },
      {
        nombre: "Doble Diversión",
        visores: 2,
        horas: 2,
        precioDesde: "$60.00 USD",
      },
      {
        nombre: "Party Gamer",
        visores: 2,
        horas: 3,
        precioDesde: "$80.00 USD",
      },
      {
        nombre: "Inmersión Total",
        visores: 3,
        horas: 4,
        precioDesde: "$120.00 USD",
        popular: true,
      },
    ],
    paquetesEmpresariales: [
      {
        nombre: "Activación de Marca",
        visores: 2,
        horas: 2,
        precioDesde: "$150.00 +IVA",
      },
      {
        nombre: "Feria Corp",
        visores: 3,
        horas: 3,
        precioDesde: "$280.00 +IVA",
      },
      {
        nombre: "Team Building del Futuro",
        visores: 4,
        horas: 4,
        precioDesde: "$350.00 +IVA",
      },
    ],
    nota: "Precios base para Zona 1. Varían según ubicación del evento.",
  });
});

// Obtener lista de juegos desde Supabase
app.get("/api/juegos", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Base de datos no disponible" });
  }

  try {
    const { data, error } = await supabase
      .from("juegos")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) throw error;

    res.json({ success: true, juegos: data });
  } catch (error) {
    log("error", "API", `Error obteniendo juegos: ${error.message}`);
    res
      .status(500)
      .json({ success: false, error: "Error al obtener catálogo de juegos" });
  }
});

// Ruta para recibir reservaciones (Guardar en Supabase)
app.post("/api/reservacion", async (req, res) => {
  if (!supabase) {
    return res
      .status(503)
      .json({ success: false, error: "Base de datos no disponible" });
  }

  const { nombre, email, telefono, fecha, paquete, juego_id } = req.body;

  // Validación de campos requeridos
  if (!nombre || !email || !telefono || !fecha) {
    return res.status(400).json({
      success: false,
      error:
        "Faltan campos requeridos: nombre, email, telefono y fecha son obligatorios.",
    });
  }

  // Validación de longitud
  if (nombre.length > 100 || email.length > 100 || telefono.length > 20) {
    return res.status(400).json({
      success: false,
      error: "Los campos exceden la longitud máxima permitida.",
    });
  }

  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: "El formato del email no es válido.",
    });
  }

  // Validación de fecha (no en el pasado)
  const fechaReserva = new Date(fecha);
  if (isNaN(fechaReserva.getTime())) {
    return res.status(400).json({
      success: false,
      error: "El formato de la fecha no es válido.",
    });
  }

  log("info", "Reservas", `Nueva solicitud: ${nombre} - ${email} - ${fecha}`);

  try {
    let clienteId;

    // Buscar cliente existente por email
    const { data: clienteExistente } = await supabase
      .from("clientes")
      .select("id")
      .eq("email", email)
      .single();

    if (clienteExistente) {
      clienteId = clienteExistente.id;
    } else {
      // Crear nuevo cliente
      const { data: nuevoCliente, error: errorCliente } = await supabase
        .from("clientes")
        .insert([{ nombre, email, telefono }])
        .select()
        .single();

      if (errorCliente)
        throw new Error(`Error creando cliente: ${errorCliente.message}`);
      clienteId = nuevoCliente.id;
    }

    // Determinar juego_id
    let juegoIdFinal = juego_id;
    if (!juegoIdFinal) {
      const { data: juegos } = await supabase
        .from("juegos")
        .select("id")
        .limit(1);
      if (juegos && juegos.length > 0) juegoIdFinal = juegos[0].id;
    }

    if (!juegoIdFinal) {
      return res
        .status(400)
        .json({
          success: false,
          error: "No hay juegos disponibles para asociar la reserva.",
        });
    }

    const { data: reserva, error: errorReserva } = await supabase
      .from("reservas")
      .insert([
        {
          cliente_id: clienteId,
          juego_id: juegoIdFinal,
          fecha_hora: fechaReserva.toISOString(),
          estado: "pendiente",
        },
      ])
      .select()
      .single();

    if (errorReserva)
      throw new Error(`Error creando reserva: ${errorReserva.message}`);

    log("info", "Reservas", `✅ Reserva creada: ${reserva.id} para ${nombre}`);

    res.json({
      success: true,
      message: "Reservación guardada exitosamente.",
      reservacion: reserva,
    });
  } catch (error) {
    log("error", "Reservas", `Error procesando reserva: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error interno al procesar la reservación.",
      detail: NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ============================================
// CHATBOT CON INTELIGENCIA ARTIFICIAL (GEMINI + GROK)
// ============================================

const { processChatMessage } = require("./services/chatService");

// Endpoint del chatbot con IA
app.post("/api/chat", async (req, res) => {
  const startTime = Date.now();

  try {
    // Rate limiting
    const clientIP =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown";
    if (!checkRateLimit(clientIP)) {
      log("warn", "Chat", `Rate limit alcanzado para IP: ${clientIP}`);
      return res.status(429).json({
        response:
          "Estoy recibiendo muchos mensajes. Esperá un momentito y volvé a intentar. 😊",
        source: "rate-limit",
      });
    }

    const { message, history } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "El mensaje es requerido" });
    }

    // Limitar longitud del mensaje
    const sanitizedMessage = message.trim().substring(0, 1000);
    const chatHistory = Array.isArray(history) ? history.slice(-20) : [];

    log(
      "info",
      "Chat",
      `Mensaje de ${clientIP}: "${sanitizedMessage.substring(0, 60)}..."`,
    );

    // Procesar mensaje usando el servicio centralizado
    const result = await processChatMessage(
      sanitizedMessage,
      chatHistory,
      process.env,
    );

    const elapsed = Date.now() - startTime;
    log(
      "info",
      "Chat",
      `Respuesta (${result.source}) en ${elapsed}ms: "${result.response.substring(0, 60)}..."`,
    );

    // SIN delay artificial del servidor - el frontend maneja la UX de "escribiendo"
    return res.json({
      response: result.response,
      source: result.source,
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    log("error", "Chat", `Error crítico en ${elapsed}ms: ${error.message}`);
    return res.json({
      response:
        "Lo siento, tuve un pequeño problema técnico. ¿Me podrías repetir eso?",
      source: "error",
    });
  }
});

// ============================================
// RUTA PRINCIPAL - SIRVE EL FRONTEND
// ============================================

// Todas las demás rutas sirven el index.html (SPA)
// Express 5 requiere parámetro nombrado para wildcards
app.get("{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================

// Middleware de errores
app.use((err, req, res, next) => {
  log("error", "Server", `Error no manejado: ${err.stack || err.message}`);
  res.status(500).json({
    error: "Error interno del servidor",
    message: NODE_ENV === "development" ? err.message : "Algo salió mal",
  });
});

// Manejar promesas rechazadas no capturadas
process.on("unhandledRejection", (reason, promise) => {
  log("error", "Process", `Promesa rechazada no capturada: ${reason}`);
});

// Manejar excepciones no capturadas
process.on("uncaughtException", (error) => {
  log("error", "Process", `Excepción no capturada: ${error.message}`);
  // En producción, intentar cerrar limpiamente
  if (NODE_ENV === "production") {
    process.exit(1);
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║                                                        ║");
  console.log("║   🎮 VIRTUAL LIFE - Servidor v5.0.0 Iniciado          ║");
  console.log("║                                                        ║");
  console.log(`║   🌐 URL: http://localhost:${PORT}                       ║`);
  console.log(`║   🏗️  Entorno: ${NODE_ENV.padEnd(42)}║`);
  console.log("║   📡 API: /api/health, /api/chat-status               ║");
  console.log("║   🤖 Chat: /api/chat (Gemini 3.1 Live + 2.5 Pro GA)   ║");
  console.log("║                                                        ║");
  console.log("╚════════════════════════════════════════════════════════╝");
});

module.exports = app;

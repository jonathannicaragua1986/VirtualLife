/**
 * VIRTUAL LIFE - Servicio de Chatbot con IA (Lógica Centralizada)
 *
 * Arquitectura:
 *   Motor 1 (Principal)  → Gemini 3.1 (flash-lite-preview → pro-preview)
 *   Motor 2 (Respaldo)   → Gemini 2.5 (pro → flash)
 *   Motor 3 (Emergencia) → Respuestas locales (sin conexión a internet)
 *
 * Versión: 6.0.0
 * Fecha: Abril 2026
 */

"use strict";

// ============================================================
// INSTRUCCIONES DEL SISTEMA - DOSSIER COMERCIAL INTEGRADO
// ============================================================
const SYSTEM_INSTRUCTION = `Eres María, la vendedora estrella y asistente de atención al cliente de Virtual Life, un servicio MÓVIL de Realidad Virtual en Nicaragua. Nuestro equipo es portátil: NOSOTROS LLEGAMOS al lugar del evento del cliente. No somos un local fijo.

=== TU PERSONALIDAD (ESTO ES LO MÁS IMPORTANTE) ===
- Hablas como una persona REAL. Imagina que eres una amiga que trabaja en algo increíble y quiere que todo el mundo lo pruebe.
- Eres cálida, chistosa cuando la situación lo permite, y siempre positiva. Te encanta tu trabajo.
- Usas español natural, cercano. Expresiones como "¡Mirá qué cool!", "Te va a encantar", "¡Sale pues!", "¡Qué risa!", "Jaja", etc.
- Eres INTELIGENTE: puedes hablar de cualquier tema porque eres una persona culta y curiosa. No eres un robot limitado.
- Tu humor es ligero y oportuno. No fuerces chistes, pero cuando surja la oportunidad, sé graciosa de forma natural.
- Tus respuestas son de 30-80 palabras normalmente. No hagas bloques de texto gigantes. Si necesitas dar más info (precios, horarios), puedes extenderte un poco más.
- NUNCA uses formato markdown (asteriscos, negritas, viñetas con *, #). Solo texto plano natural.
- SIEMPRE termina tus oraciones completas. Nunca dejes respuestas cortadas a la mitad.

=== TU SUPERPODER: MANEJAR CUALQUIER TEMA ===
Los clientes te pueden preguntar CUALQUIER COSA: sobre el clima, fútbol, política, recetas, su vida personal, filosofía, memes. TÚ SIEMPRE RESPONDES con gracia y luego reconectas con Virtual Life de forma natural. Nunca digas "no puedo hablar de eso".

Ejemplos:
- "¿Quién va a ganar el clásico?" → "Jaja esa pregunta está difícil, pero sea quien gane, la mejor celebración es venirse con los amigos a jugar VR. ¡Imaginate ver los goles en realidad virtual! ¿Te animás?"
- "Estoy triste" → "Ay, lamento escuchar eso. Muchos clientes me dicen que salen con una sonrisa enorme después de jugar un rato. ¿Te cuento qué juegos son los más divertidos para subir el ánimo?"
- Si dicen groserías → "Jaja tranquilo, aquí todo en buena onda. Si tenés alguna duda sobre nuestros servicios, con gusto te ayudo."

=== TU OBJETIVO: CADA CONVERSACIÓN DEBE ACERCAR A UNA VENTA ===
No vendas de forma agresiva. Vende como lo haría una amiga que genuinamente cree que vas a pasar un rato increíble:
1. Escucha lo que dice el cliente y responde a eso primero.
2. Conecta naturalmente con Virtual Life cuando tenga sentido.
3. Cuando sientas que el cliente está interesado, invítalo a reservar por WhatsApp (+505 7779-1433).
4. Si ya diste precios o info, cierra con algo como "¿Te gustaría reservar?" o "¿Para cuándo lo agendamos?".

=== INFORMACIÓN GENERAL ===
- WhatsApp reservas: +505 7779-1433
- Servicio MÓVIL: Nosotros llegamos al lugar del evento con todo el equipo.
- Cobertura: Toda Nicaragua (con recargos logísticos según zona).
- Horarios de atención: Lunes a Jueves 12pm-10pm, Viernes 12pm-12am, Sábado 10am-1am, Domingo 10am-11pm.
- Tecnología: Visores Meta Quest 3 (inalámbricos, 4K), controladores hápticos, Chromecast para TV.
- Juegos populares: Beat Saber, Arizona Sunshine 2, Phasmophobia, Batman VR, Gorilla Tag, Among Us VR, Superhot VR, Job Simulator, y más de 50 títulos.
- Edad mínima: 8 años. Terror desde 14 años. Se pueden usar anteojos recetados con los cascos sin problema.
- El mareo es rarísimo en nuestra Arena porque caminas de verdad (movimiento 1:1).

=== ZONAS DE COBERTURA Y RECARGOS LOGÍSTICOS ===
Los precios de los paquetes son para ZONA 1 (Base). Para otras zonas se agrega un recargo logístico:

Zona 1 - Base Local (Ciudad El Doral, Los Brasiles, Vista Momotombo, Valle Sandino): Menos de 15 min. Recargo: $5 USD. Sin viáticos.
Zona 2 - Cercana (Managua, Ticuantepe, Ciudad Sandino): Menos de 30 min. Recargo: $12 USD. Sin viáticos.
Zona 3 - Intermedia (Masaya, Granada, Carazo/Diriamba/Jinotepe): Menos de 1 hora. Recargo: $30 USD. Combustible básico.
Zona 4 - Lejana (León, Chinandega, Rivas, Matagalpa): 1.5–2.5 horas. Recargo: $60 USD. Combustible + Tiempo muerto operador.
Zona 5 - Especial (Estelí, Jinotega, Boaco, Chontales/Juigalpa): Más de 2.5 horas. Recargo: $80 USD. Combustible + comida personal.
Zona 6 - Lejanos (Río San Juan, RAAN, RAAS): Más de 4 horas. Recargo: Cotización especial (requiere hotel + viáticos completos).

IMPORTANTE: Para Zonas 2, 3 y 4, el alquiler mínimo es de 2 horas por paquete.

=== PAQUETES PARTICULARES (B2C) - Cumpleaños y Reuniones ===
Precios NETOS (sin IVA). Todos incluyen traslado del equipo (zona base), desinfección, protectores y soporte técnico.

1. "Quick Dive" (Básico):
   - 1 Visor + 1 Operador
   - 1 Hora de inmersión
   - Precios por zona: Zona 1 = $20 | Zona 2 = $30 | Zona 3+ = Cotizar

2. "Doble Diversión" (Starter):
   - 2 Visores + 1 Operador
   - 2 Horas continuas
   - Precios: Zona 1 = $60 | Zona 2 = $85 | Zona 3 = $115 | Zona 4 = $140 | Zona 5+ = Cotizar

3. "Party Gamer" (Party):
   - 2 Visores + 1 Operador
   - 3 Horas de fiesta
   - Precios: Zona 1 = $80 | Zona 2 = $105 | Zona 3 = $135 | Zona 4 = $160 | Zona 5+ = Cotizar

4. "Inmersión Total" (Full House) - EL MÁS POPULAR:
   - 3 Visores + Monitor TV (transmisión en vivo) + 1 Operador
   - 4 Horas de juego
   - Precios: Zona 1 = $120 | Zona 2 = $150 | Zona 3 = $180 | Zona 4 = $210 | Zona 5+ = Cotizar

Hora Adicional (ya estando en sitio): Zona 1 = $20 | Zona 2 = $25 | Zona 3-4 = $30 | Zona 5+ = Cotizar

=== PAQUETES EMPRESARIALES (B2B) - Ferias, Team Building, Branding ===
Precios + IVA. Incluyen Soporte Premium, Casting a Pantallas, Operadores capacitados en RRPP.

1. "Activación de Marca":
   - 2 Visores + Chromecast (transmisión a pantallas)
   - 2 Horas de activación
   - Precios: Zona 1-2 = $150 | Zona 3 = $180 | Zona 4 = $220 | Zona 5 = $260 | Zona 6 = Cotizar

2. "Feria Corp":
   - 3 Visores + 2 Operadores expertos en RRPP
   - 3 Horas extraordinarias
   - Precios: Zona 1-2 = $280 | Zona 3 = $320 | Zona 4 = $380 | Zona 5 = $450 | Zona 6 = Cotizar

3. "Team Building del Futuro":
   - 4 Visores + Guía experto en dinámicas
   - 4 Horas de integración total
   - Precios: Zona 1-2 = $350 | Zona 3 = $400 | Zona 4 = $480 | Zona 5 = $550 | Zona 6 = Cotizar

Hora Adicional Corp: Zona 1-3 = $50 | Zona 4-5 = $60 | Zona 6 = Cotizar

=== TARIFAS DINÁMICAS (MULTIPLICADORES DE HORARIO) ===
Estos multiplicadores se aplican sobre el PRECIO BASE del paquete:

- Standard (Lunes a Jueves, todo el día): 1.00x (sin recargo)
- Viernes y Sábados temprano (8:00 AM - 4:00 PM): 1.00x (sin recargo)
- Prime Time (Viernes y Sábados desde 5:00 PM en adelante + Domingos todo el día): 1.15x (+15%)
- Nocturno (cualquier evento terminando después de las 10 PM): 1.25x (+25%)
- Feriados Nacionales: 1.50x (+50%)

REGLA ESPECIAL: Si un evento empieza ANTES de las 5:00 PM pero termina DESPUÉS de las 5:00 PM (hasta las 9:59 PM), se cobra como Prime Time completo.

=== CÓMO HACER COTIZACIONES ===
Cuando un cliente te pide una cotización o pregunta cuánto le cuesta un servicio específico, sigue estos pasos:

1. PREGUNTA: ¿Dónde será el evento? (para determinar la zona)
2. PREGUNTA: ¿Cuándo será? (para aplicar multiplicador de horario)
3. PREGUNTA: ¿Cuántas personas aproximadamente? (para recomendar el paquete adecuado)
4. RECOMIENDA el paquete que mejor se adapte a sus necesidades.
5. CALCULA el precio: Precio Base Zona + (Multiplicador horario si aplica).
6. CIERRA con "¿Te gustaría reservar?" y ofrece WhatsApp +505 7779-1433.

Ejemplo de cotización:
Cliente: "Quiero para un cumpleaños en Masaya, sábado por la noche, 15 personas"
María: "¡Qué buen plan! Para Masaya (Zona 3) un sábado por la noche te recomiendo el paquete Inmersión Total que trae 3 visores + TV para que todos vean la acción. Son $180 (precio Zona 3) y como es sábado noche después de las 5 PM, aplica tarifa Prime Time (+15%), entonces quedaría en $207. Si terminan después de las 10 PM sería tarifa Nocturna (+25%) = $225. ¿Te gustaría reservar? Escríbenos al WhatsApp +505 7779-1433 y te confirmamos disponibilidad."

=== REGLAS CRÍTICAS ===
- SIEMPRE completa tus oraciones. NUNCA dejes respuestas a medias.
- Si no sabés un dato específico, decí que lo vas a consultar y ofrecé el WhatsApp.
- Variá tu forma de expresarte. No repitas la misma estructura en cada mensaje.
- Sé genuina. La gente nota cuando alguien es falso.
- Cuando des precios, siempre aclara la zona y si aplican multiplicadores.
- Para zonas lejanas (5-6), siempre di que se debe cotizar personalmente.
- Los precios empresariales son +IVA, siempre mencionarlo.
- Si el cliente necesita algo que no encaja en los paquetes, ofrece hacer una cotización personalizada vía WhatsApp.`;

// ============================================================
// CONFIGURACIÓN DE MODELOS
// Orden de prioridad: Gemini 3.1 → Gemini 2.5 (respaldo)
// ============================================================

/** Motor Principal: Gemini 3.1 (se intenta primero) */
const GEMINI_31_MODELS = [
  "gemini-3.1-flash-lite-preview", // Rápido y eficiente, menor latencia
  "gemini-3.1-pro-preview",        // Alta calidad, mayor capacidad de razonamiento
];

/** Motor de Respaldo: Gemini 2.5 (se activa si Gemini 3.1 falla) */
const GEMINI_25_MODELS = [
  "gemini-2.5-pro",   // Máxima inteligencia GA estable
  "gemini-2.5-flash", // Rápido y eficiente GA estable
];

/** Lista unificada: 3.1 primero, 2.5 como respaldo automático */
const ALL_GEMINI_MODELS = [...GEMINI_31_MODELS, ...GEMINI_25_MODELS];

// ============================================================
// CONFIGURACIÓN AVANZADA
// ============================================================

const API_TIMEOUT_MS       = 25000; // Timeout por llamada (25 segundos)
const MAX_RATE_LIMIT_RETRIES = 2;   // Reintentos por rate limit (429)
const RETRY_DELAY_BASE_MS  = 1500;  // Delay base entre reintentos

// ============================================================
// UTILIDADES
// ============================================================

/**
 * Logger centralizado con nivel, componente y timestamp.
 */
function log(level, component, message, data = null) {
  const ts     = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}] [${component}]`;
  const logFn  = level === "error" ? console.error
               : level === "warn"  ? console.warn
               : console.log;

  if (data) {
    const dataStr = typeof data === "string" ? data : JSON.stringify(data).substring(0, 300);
    logFn(`${prefix} ${message}`, dataStr);
  } else {
    logFn(`${prefix} ${message}`);
  }
}

/**
 * Crea un AbortController con timeout automático para fetch.
 */
function createTimeoutController(ms = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), ms);
  return { controller, timeoutId };
}

/**
 * Espera asíncrona (para reintentos con backoff exponencial).
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calcula un delay de escritura natural según la longitud del texto.
 */
function calculateTypingDelay(text) {
  if (!text) return 800;
  const base      = 600;
  const max       = 3000;
  const variation = Math.floor(Math.random() * 300) - 150;
  return Math.min(Math.max(base + text.length * 10 + variation, base), max);
}

/**
 * Sanitiza el texto de entrada: límite de 1000 chars y elimina caracteres de control.
 */
function sanitizeInput(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .trim()
    .substring(0, 1000)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Limpia la respuesta de IA: quita markdown no deseado.
 */
function cleanAIResponse(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Quitar negritas
    .replace(/\*([^*]+)\*/g,     "$1") // Quitar itálicas
    .replace(/^#+\s/gm,          "")   // Quitar encabezados
    .replace(/^[-*]\s/gm,        "• ") // Listas → bullet simple
    .replace(/`([^`]+)`/g,       "$1") // Quitar código inline
    .replace(/\n{3,}/g,          "\n\n")
    .trim();
}

// ============================================================
// RESPUESTAS LOCALES DE EMERGENCIA
// Se usan SOLO si Gemini 3.1 y Gemini 2.5 fallan completamente
// ============================================================

function getFallbackResponse(message) {
  const text = (message || "").toLowerCase().trim();

  if (text.match(/^(hola|buenos|buenas|hey|hi|qué tal|que tal|saludos|buen día|buen dia)/)) {
    const options = [
      "¡Hola! Soy María de Virtual Life. Tengo un problemita técnico momentáneo, pero podés escribirme al WhatsApp +505 7779-1433 y te atiendo al toque. ¿Dale?",
      "¡Hey! Soy María, de Virtual Life. Estoy con una falla temporal, pero si me escribís al WhatsApp +505 7779-1433 te ayudo enseguida.",
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  if (text.match(/precio|costo|cuanto|cuánto|tarifa|vale|pagar|paquete|pack/)) {
    return "¡Claro! Nuestros paquetes particulares van desde $20 (Quick Dive, 1 visor, 1 hora) hasta $120 (Inmersión Total, 3 visores + TV, 4 horas). Los precios varían según la zona. Para empresas tenemos desde $150+IVA. ¿Querés una cotización? Escríbenos al WhatsApp +505 7779-1433.";
  }

  if (text.match(/cotiza|presupuest|personaliz/)) {
    return "¡Con gusto te hago una cotización! Necesito saber: ¿dónde sería el evento?, ¿cuándo? y ¿para cuántas personas? Escribinos al WhatsApp +505 7779-1433 y te la armamos al instante.";
  }

  if (text.match(/horario|hora|abre|cierra|abierto|abrimos|abren|cerrado/)) {
    return "Nuestros horarios: Lunes a Jueves 12pm-10pm, Viernes 12pm-12am, Sábado 10am-1am, Domingo 10am-11pm. ¡Te esperamos!";
  }

  if (text.match(/reserv|turno|cita|agendar|apartar/)) {
    return "Para reservar, escribinos al WhatsApp +505 7779-1433 y confirmamos disponibilidad al momento. Solo necesitamos fecha, lugar y tipo de evento.";
  }

  if (text.match(/ubica|direc|donde|dónde|quedan|llegar|mapa|zona|cobertura|managua|masaya|granada|león|leon/)) {
    return "Somos un servicio MÓVIL: nosotros llegamos donde sea tu evento. Cubrimos toda Nicaragua con precios según zona. Escribinos al +505 7779-1433 para cotizar.";
  }

  if (text.match(/juego|game|jugar|títulos|catálogo|catalogo/)) {
    return "Tenemos más de 50 juegos: Beat Saber, Phasmophobia, Gorilla Tag, Among Us VR, Superhot VR, Batman VR, Job Simulator y muchos más. Para el catálogo completo, escribinos al +505 7779-1433.";
  }

  if (text.match(/cumple|fiesta|birthday|celebr/)) {
    return '¡Los cumpleaños son nuestra especialidad! El paquete "Inmersión Total" es el más popular: 3 visores + TV + 4 horas desde $120. Para cotizar según tu zona, escribinos al WhatsApp +505 7779-1433.';
  }

  if (text.match(/empresa|corporat|team build|feria|marca|activa|branding/)) {
    return "Para empresas tenemos: Activación de Marca ($150+IVA), Feria Corp ($280+IVA) y Team Building del Futuro ($350+IVA). Todos varían por zona. Escribinos al +505 7779-1433.";
  }

  if (text.match(/edad|niño|niña|menor|chiquit|pequeñ/)) {
    return "Edad mínima: 8 años. Para juegos de terror recomendamos mayores de 14. ¡Los peques la pasan increíble con Gorilla Tag y Job Simulator!";
  }

  if (text.match(/mare|mareo|nause|vómit|vomit|dizzy/)) {
    return "El mareo es muy raro porque tu cuerpo se mueve igual que en el juego (movimiento 1:1). Además tenemos juegos de baja intensidad perfectos para principiantes.";
  }

  if (text.match(/^(gracias|gracia|adios|adiós|bye|chao|hasta luego|nos vemos)/)) {
    return "¡Fue un gusto! Si después necesitás algo, aquí estamos. Podés escribirnos al WhatsApp +505 7779-1433 para reservar. ¡Te esperamos!";
  }

  return "Disculpá, tengo un pequeño inconveniente técnico. Para atenderte mejor, escribinos al WhatsApp +505 7779-1433 y con gusto te ayudamos. ¡Gracias por tu paciencia!";
}

// ============================================================
// MOTOR DE IA: GEMINI (Google)
// Llama secuencialmente: Gemini 3.1 → Gemini 2.5 (respaldo)
// ============================================================

/**
 * Realiza la llamada a la API de Gemini para un modelo específico.
 * Retorna el texto limpio o lanza un error.
 */
async function callGeminiModel(apiKey, modelName, history, message) {
  const { controller, timeoutId } = createTimeoutController();

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    // Construir historial de conversación
    const contents = [
      ...history
        .filter((msg) => msg && typeof msg.text === "string" && msg.text.trim())
        .map((msg) => ({
          role:  msg.type === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        })),
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      signal:  controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
        generationConfig: {
          temperature:     0.85,
          maxOutputTokens: 800,
          topP:            0.95,
          topK:            40,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
      }),
    });

    clearTimeout(timeoutId);

    // Manejar errores HTTP
    if (response.status === 404) {
      throw Object.assign(new Error(`Modelo no disponible (404)`), { code: "NOT_FOUND" });
    }
    if (response.status === 429) {
      throw Object.assign(new Error(`Rate limit excedido (429)`), { code: "RATE_LIMIT" });
    }
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${body.substring(0, 150)}`);
    }

    const data = await response.json();

    // Verificar bloqueo por seguridad
    if (data?.candidates?.[0]?.finishReason === "SAFETY") {
      throw new Error("Respuesta bloqueada por filtros de seguridad");
    }

    // Verificar error de cuota en el cuerpo
    if (data?.error?.message?.includes("quota")) {
      throw Object.assign(new Error("Cuota excedida"), { code: "QUOTA" });
    }

    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("Respuesta vacía del modelo");
    }

    return cleanAIResponse(candidateText);

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(`Timeout (${API_TIMEOUT_MS}ms) en ${modelName}`);
    }
    throw err;
  }
}

/**
 * Orquestador Gemini: itera sobre todos los modelos (3.1 → 2.5).
 * Para rate limit aplica backoff exponencial antes de pasar al siguiente.
 */
async function callGeminiAPI(apiKey, history, message) {
  const errors = [];

  for (const modelName of ALL_GEMINI_MODELS) {
    const isModel31 = GEMINI_31_MODELS.includes(modelName);
    const tier      = isModel31 ? "3.1" : "2.5 (respaldo)";

    let retries = 0;

    while (retries <= MAX_RATE_LIMIT_RETRIES) {
      try {
        log("info", "Gemini", `[${tier}] Intentando ${modelName} (intento ${retries + 1})...`);
        const text = await callGeminiModel(apiKey, modelName, history, message);
        log("info", "Gemini", `✅ [${tier}] ${modelName} respondió (${text.length} chars).`);
        return { text, model: modelName, tier };

      } catch (err) {
        if (err.code === "RATE_LIMIT" && retries < MAX_RATE_LIMIT_RETRIES) {
          retries++;
          const wait = RETRY_DELAY_BASE_MS * Math.pow(2, retries - 1);
          log("warn", "Gemini", `Rate limit en ${modelName}. Reintentando en ${wait}ms...`);
          await sleep(wait);
          continue;
        }

        // Error definitivo para este modelo, pasar al siguiente
        log("warn", "Gemini", `[${tier}] ${modelName} falló: ${err.message}`);
        errors.push(`${modelName}: ${err.message}`);
        break;
      }
    }
  }

  throw new Error(`Gemini falló en todos los modelos:\n${errors.join("\n")}`);
}

// ============================================================
// PROCESADOR PRINCIPAL DE MENSAJES
// Flujo: Gemini 3.1 → Gemini 2.5 → Respuesta local de emergencia
// ============================================================

async function processChatMessage(message, history, env) {
  const startTime  = Date.now();
  const GEMINI_KEY = (env?.GEMINI_API_KEY || "").trim();

  // Sanitizar entrada
  const sanitizedMessage = sanitizeInput(message);
  if (!sanitizedMessage) {
    return {
      response: "¡Hola! Parece que no recibí tu mensaje. ¿Podrías escribirme de nuevo?",
      source:   "local",
      delay:    800,
    };
  }

  // Sanitizar historial (máximo 15 mensajes de contexto)
  const safeHistory = Array.isArray(history)
    ? history
        .filter((msg) => msg && typeof msg.text === "string" && msg.text.trim())
        .slice(-15)
    : [];

  let responseText = "";
  let source       = "local";
  let usedModel    = null;

  // --- Motor IA: Gemini (3.1 → 2.5 automático) ---
  if (GEMINI_KEY) {
    try {
      log("info", "ChatService", "🚀 Iniciando llamada a Gemini IA...");
      const result = await callGeminiAPI(GEMINI_KEY, safeHistory, sanitizedMessage);
      responseText = result.text;
      usedModel    = result.model;
      source       = result.tier === "3.1" ? "gemini-3.1" : "gemini-2.5";
    } catch (err) {
      log("warn", "ChatService", "⚠️ Gemini (todos los modelos) falló:", err.message);
    }
  } else {
    log("warn", "ChatService", "⚠️ GEMINI_API_KEY no configurada. Usando respaldo local.");
  }

  // --- Respaldo final: respuestas locales de emergencia ---
  if (!responseText) {
    log("warn", "ChatService", "🔴 Activando respuestas de emergencia locales.");
    responseText = getFallbackResponse(sanitizedMessage);
    source       = "local";
  }

  const elapsed = Date.now() - startTime;
  const delay   = calculateTypingDelay(responseText);

  log(
    "info",
    "ChatService",
    `✅ Respuesta lista | fuente: ${source}${usedModel ? ` | modelo: ${usedModel}` : ""} | tiempo: ${elapsed}ms | delay UI: ${delay}ms`,
  );

  return { response: responseText, source, delay };
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  processChatMessage,
  cleanAIResponse,
  sanitizeInput,
  GEMINI_31_MODELS,
  GEMINI_25_MODELS,
};

/**
 * VIRTUAL LIFE - Servicio de Chatbot con IA (Lógica Centralizada)
 * Conexión directa a LLMs: Gemini (Principal) → Grok (Respaldo)
 *
 * Este servicio SIEMPRE intenta usar IA real.
 * Las respuestas locales son solo el último recurso en caso de fallo total.
 *
 * Versión: 5.0.0 - Actualizado con Gemini 2.5 Pro/Flash GA + Flash-Lite
 * Fecha: Abril 2026
 */

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

// ============================================
// CONFIGURACIÓN AVANZADA
// ============================================

// Timeout para llamadas a APIs externas (25 segundos)
const API_TIMEOUT_MS = 25000;

// Máximo de reintentos por rate limit
const MAX_RATE_LIMIT_RETRIES = 2;

// Delay base entre reintentos (ms)
const RETRY_DELAY_BASE_MS = 1500;

// Modelos disponibles por proveedor (actualizados abril 2026)
// gemini-3.1-flash-live-preview: modelo de baja latencia lanzado el 26-mar-2026
//   → Se intenta primero. Si no soporta texto vía REST, el sistema baja automáticamente.
// gemini-2.5-pro / 2.5-flash: GA estables, respaldo garantizado.
// NOTA: gemini-2.0-flash se retira el 1 junio 2026, ya no lo usamos
const GEMINI_MODELS = [
  "gemini-3.1-flash-lite-preview", // Motor 3.1 rápido y eficiente - Principal funcional
  "gemini-3.1-pro-preview", // Motor 3.1 avanzado - Respaldo si hay cuota
  "gemini-2.5-pro", // GA estable - respaldo serie anterior
  "gemini-2.5-flash", // GA estable
];
const GROK_MODELS = ["grok-3-mini", "grok-2-1212"];

// ============================================
// UTILIDADES
// ============================================

/**
 * Logger centralizado con timestamp
 */
function log(level, component, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${component}]`;

  if (data) {
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      `${prefix} ${message}`,
      typeof data === "string" ? data : JSON.stringify(data).substring(0, 300),
    );
  } else {
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      `${prefix} ${message}`,
    );
  }
}

/**
 * Crea un AbortController con timeout para fetch
 */
function createTimeoutController(ms = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return { controller, timeoutId };
}

/**
 * Espera un tiempo determinado (para reintentos)
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calcular delay de escritura natural
 */
function calculateTypingDelay(text) {
  if (!text) return 800;
  const baseDelay = 600;
  const charDelay = 10;
  const maxDelay = 3000;
  let delay = baseDelay + text.length * charDelay;
  const variation = Math.floor(Math.random() * 300) - 150;
  return Math.min(Math.max(delay + variation, baseDelay), maxDelay);
}

/**
 * Sanitizar texto de entrada - elimina caracteres peligrosos
 */
function sanitizeInput(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .trim()
    .substring(0, 1000) // Límite de caracteres
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ""); // Eliminar caracteres de control
}

/**
 * Limpiar respuesta de IA - quitar markdown y formateo no deseado
 */
function cleanAIResponse(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Quitar negritas
    .replace(/\*([^*]+)\*/g, "$1") // Quitar itálicas
    .replace(/^#+\s/gm, "") // Quitar encabezados markdown
    .replace(/^[-*]\s/gm, "• ") // Convertir listas a bullet simple
    .replace(/`([^`]+)`/g, "$1") // Quitar código inline
    .replace(/\n{3,}/g, "\n\n") // Limitar saltos de línea
    .trim();
}

// ============================================
// RESPUESTAS FALLBACK LOCAL (ACTUALIZADAS)
// ============================================

/**
 * Respuestas Fallback Local - SOLO se usan si TODAS las APIs fallan
 * Actualizadas con los nuevos paquetes y precios del Dossier Comercial
 */
function getFallbackResponse(message) {
  const text = (message || "").toLowerCase().trim();

  // Saludos
  if (
    text.match(
      /^(hola|buenos|buenas|hey|hi|qué tal|que tal|saludos|buen día|buen dia)/,
    )
  ) {
    const greetings = [
      "¡Hola! Soy María de Virtual Life. Disculpa, estoy teniendo un pequeño inconveniente técnico, pero puedo ayudarte por WhatsApp al +505 7779-1433. ¿Te escribo por ahí?",
      "¡Hey! Soy María, de Virtual Life. Estoy con una falla temporal, pero si me escribís al WhatsApp +505 7779-1433 te atiendo al toque. ¿Dale?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Precios y paquetes
  if (text.match(/precio|costo|cuanto|cuánto|tarifa|vale|pagar|paquete|pack/)) {
    return "¡Claro! Nuestros paquetes particulares van desde $20 (Quick Dive, 1 visor, 1 hora) hasta $120 (Inmersión Total, 3 visores + TV, 4 horas). Los precios varían según la zona donde sea tu evento. Para empresas tenemos paquetes desde $150 +IVA. ¿Te gustaría una cotización personalizada? Escríbenos al WhatsApp +505 7779-1433.";
  }

  // Cotización
  if (text.match(/cotiza|presupuest|personaliz/)) {
    return "¡Con gusto te hago una cotización! Necesito saber: ¿dónde sería el evento?, ¿cuándo? y ¿para cuántas personas? Si me escribís al WhatsApp +505 7779-1433 te armo la cotización al instante.";
  }

  // Horarios
  if (text.match(/horario|hora|abre|cierra|abierto|abrimos|abren|cerrado/)) {
    return "Nuestros horarios de atención son: Lunes a Jueves 12pm a 10pm, Viernes 12pm a 12am, Sábado 10am a 1am, Domingo 10am a 11pm. ¡Te esperamos!";
  }

  // Reservas
  if (text.match(/reserv|turno|cita|agendar|apartar/)) {
    return "Para reservar, escríbenos por WhatsApp al +505 7779-1433 y te confirmamos disponibilidad al momento. Solo necesitamos fecha, lugar y tipo de evento. ¡Te va a encantar!";
  }

  // Ubicación y cobertura
  if (
    text.match(
      /ubica|direc|donde|dónde|quedan|llegar|mapa|zona|cobertura|managua|masaya|granada|león|leon/,
    )
  ) {
    return "Somos un servicio MÓVIL, nosotros llegamos a donde sea tu evento. Cubrimos toda Nicaragua: Managua, Masaya, Granada, León, Chinandega, Rivas, Matagalpa, Estelí y más. Los precios varían según la zona. Escríbenos al +505 7779-1433 para cotizar.";
  }

  // Juegos
  if (text.match(/juego|game|jugar|títulos|catálogo|catalogo/)) {
    return "Tenemos más de 50 juegos: Beat Saber, Arizona Sunshine 2, Phasmophobia, Gorilla Tag, Among Us VR, Superhot VR, Batman VR, Job Simulator y muchos más. Para ver el catálogo completo, escríbenos al +505 7779-1433.";
  }

  // Cumpleaños
  if (text.match(/cumple|fiesta|birthday|celebr/)) {
    return '¡Los cumpleaños son nuestra especialidad! Te recomiendo el paquete "Inmersión Total": 3 visores + TV monitor + 4 horas de juego desde $120 en zona base. ¡Todos ven la acción en la TV! Para cotizar según tu zona, escríbenos al WhatsApp +505 7779-1433.';
  }

  // Empresas / Corporativo
  if (text.match(/empresa|corporat|team build|feria|marca|activa|branding/)) {
    return "Para empresas tenemos 3 paquetes: Activación de Marca ($150+IVA), Feria Corp ($280+IVA) y Team Building del Futuro ($350+IVA). Los precios varían por zona e incluyen operadores capacitados en RRPP. Escríbenos al +505 7779-1433 para una cotización corporativa.";
  }

  // Edades
  if (text.match(/edad|niño|niña|menor|chiquit|pequeñ/)) {
    return "La edad mínima recomendada es 8 años por el tamaño del casco. Para juegos de terror, sugerimos mayores de 14 años. ¡Los peques la pasan genial con Gorilla Tag y Job Simulator!";
  }

  // Mareo
  if (text.match(/mare|mareo|nause|vómit|vomit|dizzy/)) {
    return "Es muy poco probable que te marees porque tu cuerpo se mueve igual que en el juego (movimiento 1:1). Además tenemos juegos de baja intensidad perfectos para principiantes.";
  }

  // Despedidas
  if (
    text.match(/^(gracias|gracia|adios|adiós|bye|chao|hasta luego|nos vemos)/)
  ) {
    return "¡Fue un gusto! Si después necesitás algo, aquí estamos. También podés escribirnos al WhatsApp +505 7779-1433 para reservar. ¡Te esperamos con la mejor experiencia VR de Nicaragua!";
  }

  // Respuesta genérica mejorada
  return "Disculpa, estoy teniendo un pequeño inconveniente técnico. Para atenderte mejor, escríbenos al WhatsApp +505 7779-1433 y con gusto te ayudamos con toda la información, cotizaciones y reservas. ¡Gracias por tu paciencia!";
}

// ============================================
// API: GEMINI (Google) - MOTOR PRINCIPAL
// ============================================

/**
 * API Call: Gemini (Google) - MOTOR PRINCIPAL
 * Usa la API v1beta con los modelos GA estables de Gemini 2.5
 * Soporta múltiples modelos con fallback automático
 * Incluye reintento para rate limits (429)
 */
async function callGeminiAPI(apiKey, history, message) {
  let lastError = null;

  for (const modelName of GEMINI_MODELS) {
    let retries = 0;

    while (retries <= MAX_RATE_LIMIT_RETRIES) {
      const { controller, timeoutId } = createTimeoutController();

      try {
        log(
          "info",
          "Gemini",
          `Intentando modelo: ${modelName} (intento ${retries + 1})...`,
        );
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        // Construir historial de conversación para Gemini
        const contents = [];
        for (const msg of history) {
          if (msg.text && msg.text.trim()) {
            contents.push({
              role: msg.type === "user" ? "user" : "model",
              parts: [{ text: msg.text }],
            });
          }
        }
        contents.push({ role: "user", parts: [{ text: message }] });

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: contents,
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 800,
              topP: 0.95,
              topK: 40,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_ONLY_HIGH",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_ONLY_HIGH",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_ONLY_HIGH",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_ONLY_HIGH",
              },
            ],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Rate Limit - reintentar con delay exponencial
        if (response.status === 429) {
          retries++;
          if (retries <= MAX_RATE_LIMIT_RETRIES) {
            const waitTime = RETRY_DELAY_BASE_MS * Math.pow(2, retries - 1);
            log(
              "warn",
              "Gemini",
              `Rate Limit 429 en ${modelName}. Reintentando en ${waitTime}ms...`,
            );
            await sleep(waitTime);
            continue;
          }
          log(
            "warn",
            "Gemini",
            `Rate Limit 429 persistente en ${modelName}. Saltando al siguiente modelo.`,
          );
          lastError = "Rate Limit 429 persistente";
          break;
        }

        if (response.status === 404) {
          log(
            "warn",
            "Gemini",
            `${modelName}: No encontrado (404), probando siguiente...`,
          );
          lastError = `${modelName} no disponible`;
          break;
        }

        if (!response.ok) {
          const errorBody = await response.text().catch(() => "");
          log(
            "warn",
            "Gemini",
            `${modelName} HTTP ${response.status}`,
            errorBody.substring(0, 200),
          );
          lastError = `HTTP ${response.status}`;
          break;
        }

        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (candidateText) {
          const cleaned = cleanAIResponse(candidateText);
          log(
            "info",
            "Gemini",
            `✅ ${modelName} respondió correctamente (${cleaned.length} chars).`,
          );
          return cleaned;
        }

        // Verificar si la respuesta fue bloqueada por seguridad
        const blockReason = data?.candidates?.[0]?.finishReason;
        if (blockReason === "SAFETY") {
          log(
            "warn",
            "Gemini",
            `${modelName}: Respuesta bloqueada por filtros de seguridad.`,
          );
          lastError = "Respuesta bloqueada por seguridad";
          break;
        }

        if (data?.error) {
          const errorMsg = data.error.message || "Error desconocido";
          if (typeof errorMsg === "string" && errorMsg.includes("quota")) {
            lastError = "Quota excedida";
            break;
          }
          lastError = errorMsg;
        } else {
          lastError = `${modelName}: respuesta vacía`;
        }
        break; // No reintentar si no es 429
      } catch (e) {
        clearTimeout(timeoutId);
        if (e.name === "AbortError") {
          lastError = `${modelName}: timeout (${API_TIMEOUT_MS}ms)`;
          log("warn", "Gemini", lastError);
        } else {
          log("error", "Gemini", `Error en ${modelName}:`, e.message);
          lastError = e.message;
        }
        break; // No reintentar errores de red
      }
    }
  }

  throw new Error(`Gemini falló: ${lastError}`);
}

// ============================================
// API: GROK (xAI) - MOTOR DE RESPALDO
// ============================================

/**
 * API Call: Grok (xAI) - MOTOR DE RESPALDO
 * Actualizado a grok-3-mini con fallback a grok-2-1212
 */
async function callGrokAPI(apiKey, history, message) {
  let lastError = null;

  for (const modelName of GROK_MODELS) {
    const { controller, timeoutId } = createTimeoutController();

    try {
      log("info", "Grok", `Intentando modelo: ${modelName}...`);

      const messages = [
        { role: "system", content: SYSTEM_INSTRUCTION },
        ...history
          .filter(
            (msg) => msg && typeof msg.text === "string" && msg.text.trim(),
          )
          .map((msg) => ({
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.text,
          })),
        { role: "user", content: message },
      ];

      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          temperature: 0.85,
          max_tokens: 800,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Rate Limit en Grok
      if (response.status === 429) {
        log(
          "warn",
          "Grok",
          `${modelName}: Rate Limit 429. Probando siguiente modelo...`,
        );
        lastError = `${modelName}: Rate Limit`;
        continue;
      }

      if (response.status === 404) {
        log(
          "warn",
          "Grok",
          `${modelName}: No encontrado (404). Probando siguiente...`,
        );
        lastError = `${modelName} no disponible`;
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Sin detalle");
        log(
          "warn",
          "Grok",
          `${modelName} HTTP ${response.status}`,
          errorBody.substring(0, 200),
        );
        lastError = `${modelName}: HTTP ${response.status}`;
        continue;
      }

      const data = await response.json();

      if (data.choices && data.choices[0]?.message?.content) {
        const cleaned = cleanAIResponse(data.choices[0].message.content);
        log(
          "info",
          "Grok",
          `✅ ${modelName} respondió correctamente (${cleaned.length} chars).`,
        );
        return cleaned;
      }

      lastError = data.error?.message || `${modelName}: respuesta vacía`;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        lastError = `${modelName}: timeout (${API_TIMEOUT_MS}ms)`;
        log("warn", "Grok", lastError);
      } else {
        log("error", "Grok", `Error en ${modelName}:`, error.message);
        lastError = error.message;
      }
    }
  }

  throw new Error(`Grok falló: ${lastError}`);
}

// ============================================
// PROCESADOR PRINCIPAL
// ============================================

/**
 * Procesador Principal de Mensajes
 * Flujo: Gemini (principal) → Grok (respaldo) → Fallback Local (emergencia)
 */
async function processChatMessage(message, history, env) {
  const startTime = Date.now();
  const GEMINI_KEY = env?.GEMINI_API_KEY || "";
  const GROK_KEY = env?.GROK_API_KEY || "";

  // Validar y sanitizar mensaje
  const sanitizedMessage = sanitizeInput(message);
  if (!sanitizedMessage) {
    return {
      response:
        "¡Hola! Parece que no recibí tu mensaje. ¿Podrías escribirme de nuevo?",
      source: "local",
      delay: 800,
    };
  }

  // Sanitizar historial - filtrar mensajes inválidos y limitar cantidad
  const safeHistory = Array.isArray(history)
    ? history
        .filter((msg) => msg && typeof msg.text === "string" && msg.text.trim())
        .slice(-15) // Máximo 15 mensajes de contexto
    : [];

  let responseText = "";
  let source = "local";
  let apiErrors = [];

  // 1. Intentar Gemini PRIMERO (motor principal)
  if (GEMINI_KEY.trim()) {
    try {
      log(
        "info",
        "ChatService",
        "🚀 Conectando con Gemini (motor principal)...",
      );
      responseText = await callGeminiAPI(
        GEMINI_KEY,
        safeHistory,
        sanitizedMessage,
      );
      source = "gemini";
    } catch (e) {
      log("warn", "ChatService", "⚠️ Gemini falló:", e.message);
      apiErrors.push(`Gemini: ${e.message}`);
    }
  } else {
    log("warn", "ChatService", "⚠️ Gemini API key no configurada.");
  }

  // 2. Si Gemini falló, intentar Grok como respaldo
  if (!responseText && GROK_KEY.trim()) {
    try {
      log("info", "ChatService", "🔄 Conectando con Grok (respaldo)...");
      responseText = await callGrokAPI(GROK_KEY, safeHistory, sanitizedMessage);
      source = "grok";
    } catch (e) {
      log("warn", "ChatService", "⚠️ Grok falló:", e.message);
      apiErrors.push(`Grok: ${e.message}`);
    }
  } else if (!responseText && !GROK_KEY.trim()) {
    log("warn", "ChatService", "⚠️ Grok API key no configurada.");
  }

  // 3. Fallback Local SOLO si ambas IAs fallaron
  if (!responseText) {
    log(
      "warn",
      "ChatService",
      "❌ Ambas IAs fallaron. Usando respuesta de emergencia.",
      apiErrors,
    );
    responseText = getFallbackResponse(sanitizedMessage);
    source = "local";
  }

  const elapsed = Date.now() - startTime;
  const delay = calculateTypingDelay(responseText);

  log(
    "info",
    "ChatService",
    `✅ Respuesta generada (${source}) en ${elapsed}ms. Delay: ${delay}ms`,
  );

  return { response: responseText, source, delay };
}

module.exports = { processChatMessage, cleanAIResponse, sanitizeInput };

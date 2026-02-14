// Vercel Serverless Function para el Chatbot - Respaldo Multi-Modelo
// Motor principal: Grok (xAI) | Respaldo: Gemini (Google) con Fallback en Cascada
// Incluye: Simulación de tiempo de escritura humano

const SYSTEM_INSTRUCTION = `
### SYSTEM PROMPT: MARÍA - VIRTUAL LIFE SALES AGENT (NICARAGUA)

**1. IDENTIDAD Y ROL**
Eres **María**, la anfitriona digital y especialista en ventas de **Virtual Life** en Nicaragua. No eres un robot aburrido; eres una mujer entusiasta, tecnológica y muy amable. Tu pasión es la Realidad Virtual (VR) y tu misión es contagiar esa emoción al usuario para que compre un paquete o reserve una experiencia.

**2. OBJETIVO PRINCIPAL: CONVERSIÓN**
Tu meta **no es solo responder preguntas**, es **VENDER**. Cada interacción debe acercar al usuario a una compra.
* Si preguntan "¿Qué es?", tú respondes explicando la *emoción* y *sensación*, no solo la definición técnica.
* Si preguntan precios, primero vendes el *valor* de la experiencia y luego das el costo, cerrando siempre con una invitación a reservar.

**3. TONO DE VOZ Y PERSONALIDAD**
* **Idioma:** Español de Nicaragua. Usas el "voseo" de manera profesional y cercana (ej: "¿Cómo estás?", "Te cuento que...", "Mirá, esta opción es buenísima").
* **Estilo:** Cálida, segura de sí misma, innovadora y persuasiva.
* **Vocabulario:** Usas términos tecnológicos simples. Evitas jerga complicada que asuste al cliente. Usas palabras sensoriales: "sumergirte", "sentir", "vivir", "adrenalina", "viajar".

**4. ESTRATEGIA DE VENTAS (MÉTODO AIDA)**
Debes guiar la conversación usando esta estructura mental:
1. **Atención:** Saluda con energía. "¡Hola! Bienvenid@ al futuro en Virtual Life."
2. **Interés:** Haz preguntas para perfilar al cliente. "¿Buscas algo para relajarte, para jugar con amigos o una experiencia educativa?"
3. **Deseo:** Describe la experiencia basada en su respuesta. "¡Perfecto! Si te gusta la acción, tenés que probar nuestro paquete de zombies. Es tan real que vas a sentir que están ahí mismo con vos."
4. **Acción (Cierre):** Pide la venta o la reserva. "¿Te gustaría que te ayude a reservar tu espacio para este fin de semana?" o "¿Te paso el link para que comprés el paquete ahora mismo?"

**5. MANEJO DE OBJECIONES**
* **"Es muy caro":** Responde comparando el valor. "Más que un juego, es una experiencia de viaje y aventura sin salir de Managua. Es mucho más barato que un boleto de avión y la sensación es increíble."
* **"Me voy a marear":** Tranquiliza. "Nuestros equipos son de última generación (como el Meta Quest) y tenemos experiencias suaves diseñadas para principiantes. Yo te guío con la mejor opción para empezar."
* **"No sé usar tecnología":** Empodera. "¡Para eso estoy yo! Es súper intuitivo, es tan fácil como ponerte unos lentes y disfrutar. Nosotros te asistimos en todo momento."

**6. REGLAS DE ORO (CRÍTICO PARA PARECER HUMANO)**
* **BREVEDAD EXTREMA:** Escribe mensajes CORTOS (máximo 30-40 palabras). Como en WhatsApp.
* **NUNCA hagas bloques de texto.** Si tienes mucho que decir, divídelo. Di una parte y termina con "¿Te cuento más?" o "¿Qué te parece?".
* **Cero formalidad excesiva:** Escribe como le hablarías a un amigo. Relajado pero respetuoso.
* **Nunca dejes una respuesta "cerrada"**: Siempre invita a responder.
* **NO uses formato markdown** (negritas, listas), escribe texto plano.
* **ERROR COMÚN A EVITAR:** No sueltes toda la información de precios, horarios y ubicación de un solo golpe. Dosifica la información según lo que pregunte el cliente.

**DATOS DEL NEGOCIO:**
- **WhatsApp:** +505 7779-143
- **Horarios:** Lun-Jue 12pm-10pm | Vie 12pm-12am | Sáb 10am-1am | Dom 10am-11pm
- **Precios:** 30 min ($15,000), 1 hora ($25,000 - ¡Popular!), 1.5 horas ($35,000)
- **Juegos:** +50 opciones (Beat Saber, Arizona Sunshine 2, Phasmophobia, etc.)
- **Equipos:** Meta Quest 3 (4K), Arena Free Roam 200m².
`;

function getFallbackResponse(message) {
    const text = (message || '').toLowerCase();
    if (text.match(/hola|buenos|buenas|hey|hi/)) return '¡Hola! Soy María de Virtual Life. ¿En qué te puedo ayudar hoy?';
    if (text.match(/precio|costo|cuanto|cuánto/)) return 'Nuestros precios: 30 min ($15,000), 1 hora ($25,000) o 1.5 horas ($35,000). Todo incluye instructor y +50 juegos.';
    if (text.match(/horario|hora|abre|cierra/)) return 'Abrimos Lun-Jue 12pm-10pm, Viernes 12pm-12am, Sábado 10am-1am, Domingo 10am-11pm.';
    if (text.match(/reserv|turno|cita/)) return 'Para reservar te paso con Carlos por WhatsApp. ¿Te parece?';
    if (text.match(/juego|game/)) return 'Tenemos +50 juegos: Beat Saber, Arizona Sunshine 2, Phasmophobia, Gorilla Tag, Batman VR y más.';
    return 'Claro, cuéntame más. Puedo ayudarte con precios, horarios, juegos o reservaciones.';
}

// Simular tiempo de escritura humano dinámico (1.5s a 8s)
function calculateTypingDelay(text) {
    if (!text) return 1500;
    const minDelay = 1500;
    const charDelay = 15;
    const maxDelay = 8000;

    let delay = minDelay + (text.length * charDelay);
    const randomVariation = Math.floor(Math.random() * 500) - 250;
    return Math.min(Math.max(delay + randomVariation, minDelay), maxDelay);
}

// Motor principal: Grok (xAI) - formato compatible con OpenAI
async function callGrokAPI(apiKey, systemInstruction, history, message) {
    const messages = [
        { role: 'system', content: systemInstruction },
        ...history.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.text
        })),
        { role: 'user', content: message }
    ];

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'grok-2-latest',
            messages,
            temperature: 0.9,
            max_tokens: 400
        })
    });

    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content;
    }
    throw new Error(data.error?.message || 'Grok sin respuesta');
}

// Respaldo: Gemini (Google) con múltiples modelos en cascada
async function callGeminiAPI(apiKey, systemInstruction, conversationHistory, message) {
    // Lista de modelos ordenados por preferencia y probabilidad de cuota disponible
    const models = [
        'gemini-2.0-flash',        // Principal actual
        'gemini-2.5-flash',        // Modelo más nuevo (posible cuota separada)
        'gemini-2.0-flash-lite',   // Modelo ligero
        'gemini-flash-latest',     // Versión estable anterior
        'gemini-1.5-flash'         // Versión legado
    ];

    let lastError = null;

    for (const modelName of models) {
        try {
            console.log(`[Chat] Intentando Gemini con modelo: ${modelName}...`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemInstruction }] },
                    contents: [
                        ...conversationHistory.map(msg => ({
                            role: msg.type === 'user' ? 'user' : 'model',
                            parts: [{ text: msg.text }]
                        })),
                        { role: 'user', parts: [{ text: message }] }
                    ],
                    generationConfig: { temperature: 0.9, maxOutputTokens: 400 }
                })
            });

            const data = await response.json();

            // Verificar si es error de rate limit (429) o falta de cuota
            if (response.status === 429 || (data.error && (data.error.code === 429 || data.error.message.includes('quota')))) {
                console.warn(`[Chat] Modelo ${modelName} saturado (Rate Limit). Probando siguiente...`);
                lastError = 'Rate Limit';
                continue; // Probar siguiente modelo
            }

            // Si el modelo no existe (404), seguir al siguiente
            if (response.status === 404) {
                console.warn(`[Chat] Modelo ${modelName} no encontrado (404).`);
                continue;
            }

            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                console.log(`[Chat] Éxito con modelo ${modelName}`);
                return data.candidates[0].content.parts[0].text;
            }

            if (data.error) {
                console.warn(`[Chat] Error en ${modelName}: ${data.error.message}`);
                lastError = data.error.message;
            }

        } catch (e) {
            console.error(`[Chat] Excepción con ${modelName}:`, e.message);
            lastError = e.message;
        }
    }

    throw new Error(`Todos los modelos de Gemini fallaron. Último error: ${lastError}`);
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    try {
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ error: 'El mensaje es requerido' });

        const chatHistory = history || [];
        const GROK_API_KEY = process.env.GROK_API_KEY;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        // Intentar Grok primero (si hay api key, intentar aunque falle la primera vez)
        if (GROK_API_KEY) {
            try {
                const response = await callGrokAPI(GROK_API_KEY, SYSTEM_INSTRUCTION, chatHistory, message);
                await new Promise(resolve => setTimeout(resolve, calculateTypingDelay(response)));
                return res.status(200).json({ response, source: 'grok' });
            } catch (e) {
                console.log("Grok failed:", e.message);
                // Continuar al fallback
            }
        }

        // Fallback a Gemini con cascada de modelos
        if (GEMINI_API_KEY) {
            try {
                const response = await callGeminiAPI(GEMINI_API_KEY, SYSTEM_INSTRUCTION, chatHistory, message);
                await new Promise(resolve => setTimeout(resolve, calculateTypingDelay(response)));
                return res.status(200).json({ response, source: 'gemini' });
            } catch (e) {
                console.log("Gemini fallback failed:", e.message);
                // Continuar al fallback local
            }
        }

        // Respuestas locales
        const localResponse = getFallbackResponse(message);
        await new Promise(resolve => setTimeout(resolve, calculateTypingDelay(localResponse)));
        return res.status(200).json({ response: localResponse, source: 'local' });

    } catch (error) {
        return res.status(200).json({ response: getFallbackResponse(req.body?.message || ''), source: 'error' });
    }
};

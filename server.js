/**
 * VIRTUAL LIFE - Servidor Backend Profesional
 * Servidor Express con configuraciones de seguridad y optimización
 */

require('dotenv').config();

const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// MIDDLEWARE DE SEGURIDAD Y OPTIMIZACIÓN
// ============================================

// Compresión GZIP para mejor rendimiento
app.use(compression());

// CORS - Permite peticiones desde cualquier origen (configurable)
app.use(cors());

// Helmet - Cabeceras de seguridad HTTP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://unpkg.com"],
            imgSrc: ["'self'", "data:", "https:", "http:", "https://yuuozwzydyfkapxgtktq.supabase.co"], // Permitir imágenes de Supabase
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "https://wa.me", "https://generativelanguage.googleapis.com", "https://yuuozwzydyfkapxgtktq.supabase.co"], // Conexión a Supabase
            frameSrc: ["'self'", "https://www.google.com"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// Parser para JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ARCHIVOS ESTÁTICOS
// ============================================

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// RUTAS DE LA API (para futuras expansiones)
// ============================================

// Ruta de salud del servidor (útil para monitoreo)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Virtual Life VR Center',
        dbConnection: !!supabase
    });
});

// Ruta de diagnóstico del chatbot
app.get('/api/chat-status', (req, res) => {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    const apiKeyLength = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0;
    res.json({
        geminiConfigured: hasApiKey,
        apiKeyLength: apiKeyLength,
        status: hasApiKey ? 'Gemini AI activo' : 'Usando respuestas locales',
        nodeVersion: process.version
    });
});

// Ruta para información del negocio (ejemplo de API)
app.get('/api/info', (req, res) => {
    res.json({
        nombre: 'VIRTUAL LIFE',
        descripcion: 'Centro de Realidad Virtual',
        horarios: {
            lunesViernes: '14:00 - 22:00',
            sabados: '10:00 - 23:00',
            domingos: '10:00 - 20:00'
        },
        contacto: {
            whatsapp: '+505 7779-143',
            email: 'info@virtuallife.com'
        },
        servicios: ['Free Roam Arena', 'VR Stations', 'Cumpleaños', 'Eventos Corporativos']
    });
});

// Obtener lista de juegos desde Supabase
app.get('/api/juegos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('juegos')
            .select('*');

        if (error) throw error;

        res.json({ success: true, juegos: data });
    } catch (error) {
        console.error('Error obteniendo juegos:', error.message);
        res.status(500).json({ success: false, error: 'Error al obtener catálogo de juegos' });
    }
});

// Ruta para recibir reservaciones (Guardar en Supabase)
app.post('/api/reservacion', async (req, res) => {
    const { nombre, email, telefono, fecha, paquete, juego_id } = req.body;

    console.log('Nueva solicitud de reservación:', { nombre, email, telefono, fecha, paquete });

    try {
        // 1. Crear o Buscar Cliente
        // Nota: Para simplificar, insertamos siempre y si hay conflicto de email deberíamos manejarlo, 
        // pero como definimos email unique, aquí intentaremos buscar primero o insertar.
        // Por brevedad en este MVP, usaremos upsert o insert simple.

        let clienteId;

        // Intentar buscar cliente por email
        const { data: clienteExistente } = await supabase
            .from('clientes')
            .select('id')
            .eq('email', email)
            .single();

        if (clienteExistente) {
            clienteId = clienteExistente.id;
        } else {
            // Crear nuevo cliente
            const { data: nuevoCliente, error: errorCliente } = await supabase
                .from('clientes')
                .insert([{ nombre, email, telefono }])
                .select()
                .single();

            if (errorCliente) throw new Error(`Error creando cliente: ${errorCliente.message}`);
            clienteId = nuevoCliente.id;
        }

        // 2. Crear Reserva
        // Si no tenemos juego_id específico (porque es un paquete general), podríamos dejarlo null o asignar uno por defecto.
        // Asumiremos que si no viene juego_id, es una reserva general (podríamos requerir un ID de "Juego General" en la DB).
        // Para que no falle la FK, necesitamos un UUID válido si la columna es NOT NULL. 
        // Vamos a asumir que el frontend manda un UUID válido o relajamos la restricción.
        // REVISIÓN: La tabla reservas tiene juego_id NOT NULL. Necesitamos un juego por defecto o modificar la tabla.
        // SOLUCIÓN RÁPIDA: Buscar el primer juego disponible para asignar si no viene uno, o marcar error.

        let juegoIdFinal = juego_id;
        if (!juegoIdFinal) {
            const { data: juegos } = await supabase.from('juegos').select('id').limit(1);
            if (juegos && juegos.length > 0) juegoIdFinal = juegos[0].id;
        }

        if (!juegoIdFinal) {
            return res.status(400).json({ success: false, error: 'No hay juegos disponibles para asociar la reserva.' });
        }

        const { data: reserva, error: errorReserva } = await supabase
            .from('reservas')
            .insert([{
                cliente_id: clienteId,
                juego_id: juegoIdFinal,
                fecha_hora: new Date(fecha).toISOString(), // Asegurar formato ISO
                estado: 'pendiente'
            }])
            .select()
            .single();

        if (errorReserva) throw new Error(`Error creando reserva: ${errorReserva.message}`);

        res.json({
            success: true,
            message: 'Reservación guardada exitosamente en la base de datos.',
            reservacion: reserva
        });

    } catch (error) {
        console.error('Error procesando reserva:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno al procesar la reservación.',
            detail: error.message
        });
    }
});

// ============================================
// CHATBOT CON INTELIGENCIA ARTIFICIAL (GEMINI)
// ============================================

// Instrucciones del sistema para el chatbot María
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
// Función para llamar a Grok (xAI) - Motor principal de IA
async function callGrokAPI(apiKey, systemInstruction, history, message) {
    const url = 'https://api.x.ai/v1/chat/completions';

    // Construir mensajes en formato OpenAI (compatible con Grok)
    const messages = [
        { role: 'system', content: systemInstruction },
        ...history.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.text
        })),
        { role: 'user', content: message }
    ];

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'grok-2-latest',
            messages: messages,
            temperature: 0.9,
            max_tokens: 400
        })
    });

    const data = await response.json();

    if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content;
    }

    if (data.error) {
        throw new Error(`Grok error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    throw new Error('Grok: respuesta sin contenido');
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

// Función para simular tiempo de escritura humano dinámico
function calculateTypingDelay(text) {
    if (!text) return 1500;

    const minDelay = 1500;   // Mínimo 1.5s
    const charDelay = 15;    // 15ms por caracter (aprox 4000 caracteres/minuto, rápido pero natural)
    const maxDelay = 8000;   // Máximo 8s para no frustrar al usuario

    let delay = minDelay + (text.length * charDelay);

    // Añadir un poco de aleatoriedad (+- 500ms)
    const randomVariation = Math.floor(Math.random() * 500) - 250;

    return Math.min(Math.max(delay + randomVariation, minDelay), maxDelay);
}

// Endpoint del chatbot con IA (Grok principal + Gemini respaldo)
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        console.log('=== CHAT REQUEST ===');
        console.log('Mensaje:', message);

        if (!message) {
            return res.status(400).json({ error: 'El mensaje es requerido' });
        }

        const GROK_API_KEY = process.env.GROK_API_KEY;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const chatHistory = history || [];

        // Intentar con Grok primero (motor principal)
        if (GROK_API_KEY && GROK_API_KEY.trim() !== '') {
            try {
                console.log('[Chat] Usando Grok (xAI) como motor principal...');
                const response = await callGrokAPI(GROK_API_KEY, SYSTEM_INSTRUCTION, chatHistory, message);
                console.log('[Chat] Grok respondió exitosamente');

                // Delay dinámico según longitud
                await new Promise(resolve => setTimeout(resolve, calculateTypingDelay(response)));

                return res.json({ response, source: 'grok' });
            } catch (grokError) {
                console.error('[Chat] Error con Grok:', grokError.message);
                // Continuar al fallback
            }
        }

        // Fallback a Gemini
        if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '') {
            try {
                console.log('[Chat] Usando Gemini como respaldo...');
                const response = await callGeminiAPI(GEMINI_API_KEY, SYSTEM_INSTRUCTION, chatHistory, message);
                console.log('[Chat] Gemini respondió exitosamente');

                // Delay dinámico según longitud
                await new Promise(resolve => setTimeout(resolve, calculateTypingDelay(response)));

                return res.json({ response, source: 'gemini' });
            } catch (geminiError) {
                console.error('[Chat] Error con Gemini:', geminiError.message);
            }
        }

        // Si ambos fallan, respuestas locales
        console.log('[Chat] Ambas APIs fallaron, usando respuestas locales');
        const localResponse = getFallbackResponse(message);

        // Delay dinámico según longitud
        await new Promise(resolve => setTimeout(resolve, calculateTypingDelay(localResponse)));

        return res.json({
            response: localResponse,
            source: 'local'
        });

    } catch (error) {
        console.error('Error en chatbot:', error.message);
        return res.json({
            response: getFallbackResponse(req.body?.message || ''),
            source: 'error'
        });
    }
});

// Función de respuestas fallback (cuando no hay API key o hay error)
function getFallbackResponse(message) {
    const text = (message || '').toLowerCase();

    if (text.match(/hola|buenos|buenas|hey|hi/)) {
        return '¡Hola! Soy María de Virtual Life. ¿En qué te puedo ayudar hoy?';
    }
    if (text.match(/precio|costo|cuanto|cuánto/)) {
        return 'Nuestros precios son: 30 min ($15,000), 1 hora ($25,000) o 1.5 horas ($35,000). Todo incluye instructor y +50 juegos. ¿Para cuántas personas sería?';
    }
    if (text.match(/horario|hora|abre|cierra/)) {
        return 'Abrimos Lun-Jue 12pm-10pm, Viernes 12pm-12am, Sábado 10am-1am, Domingo 10am-11pm. ¿Cuándo te gustaría venir?';
    }
    if (text.match(/reserv|turno|cita/)) {
        return 'Para reservar te puedo pasar con mi compañero Carlos por WhatsApp. ¿Te parece bien?';
    }
    if (text.match(/juego|game/)) {
        return 'Tenemos +50 juegos: Beat Saber, Arizona Sunshine 2, Phasmophobia, Gorilla Tag, Batman VR y más. ¿Qué tipo de experiencia buscas?';
    }
    if (text.match(/gracias|thank/)) {
        return '¡Con mucho gusto! ¿Hay algo más en lo que te pueda ayudar?';
    }

    return 'Claro, cuéntame más sobre lo que necesitas. Puedo ayudarte con precios, horarios, juegos o reservaciones.';
}

// ============================================
// RUTA PRINCIPAL - SIRVE EL FRONTEND
// ============================================

// Todas las demás rutas sirven el index.html (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Middleware de errores
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║                                                ║');
    console.log('║   🎮 VIRTUAL LIFE - Servidor Iniciado         ║');
    console.log('║                                                ║');
    console.log(`║   🌐 URL: http://localhost:${PORT}               ║`);
    console.log('║   📡 API: /api/health, /api/info              ║');
    console.log('║                                                ║');
    console.log('╚════════════════════════════════════════════════╝');
});

module.exports = app;

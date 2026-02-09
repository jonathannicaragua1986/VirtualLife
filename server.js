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

const app = express();
const PORT = process.env.PORT || 3000;

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
            imgSrc: ["'self'", "data:", "https:", "http:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "https://wa.me", "https://generativelanguage.googleapis.com"],
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
        service: 'Virtual Life VR Center'
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

// Ruta para recibir reservaciones (ejemplo de endpoint POST)
app.post('/api/reservacion', (req, res) => {
    const { nombre, email, telefono, fecha, paquete } = req.body;

    // Aquí podrías agregar lógica para:
    // - Guardar en base de datos
    // - Enviar email de confirmación
    // - Integrar con calendario

    console.log('Nueva reservación recibida:', { nombre, email, telefono, fecha, paquete });

    res.json({
        success: true,
        message: 'Reservación recibida. Te contactaremos pronto.',
        reservacion: { nombre, fecha, paquete }
    });
});

// ============================================
// CHATBOT CON INTELIGENCIA ARTIFICIAL (GEMINI)
// ============================================

// Instrucciones del sistema para el chatbot María
const SYSTEM_INSTRUCTION = `
Eres María, una agente de servicio al cliente de VIRTUAL LIFE, un centro de realidad virtual ubicado en Buenos Aires, Argentina.

INFORMACIÓN DEL NEGOCIO:
- Nombre: Virtual Life - Centro de Realidad Virtual
- Ubicación: Av. Corrientes 1234, Buenos Aires, Argentina
- WhatsApp: +505 7779-143

HORARIOS:
- Lunes a Jueves: 12:00 pm a 10:00 pm
- Viernes: 12:00 pm a 12:00 am (medianoche)
- Sábado: 10:00 am a 1:00 am
- Domingo: 10:00 am a 11:00 pm

PRECIOS (pesos argentinos):
- 30 minutos: $15,000 por persona
- 1 hora: $25,000 por persona (el más popular)
- 1 hora y media: $35,000 por persona
- Todos incluyen instructor y acceso a +50 juegos

PAQUETES DE CUMPLEAÑOS:
- Pack Estándar: $18,000/niño (1 hora de juego + sala privada para pastel)
- Pack VIP: $28,000/niño (1.5 horas + torneo + pizza + regalo para cumpleañero)

JUEGOS POPULARES:
- Beat Saber (música y ritmo)
- Arizona Sunshine 2 (zombies, cooperativo)
- Phasmophobia (terror, solo mayores de 14 años)
- Gorilla Tag (viral, divertido para grupos)
- Batman VR (nuevo exclusivo 2025)
- Superhot VR, Among Us VR, Job Simulator y +50 títulos más

TECNOLOGÍA:
- Cascos Meta Quest 3 (última generación)
- 100% inalámbricos (sin cables)
- Resolución 4K+
- Arena Free Roam de 200m²
- Hasta 10 jugadores simultáneos

EDAD MÍNIMA:
- Recomendado desde 8 años
- Juegos de terror: solo mayores de 14 años

TU PERSONALIDAD (María):
- Eres amable, cálida y profesional
- Hablas de forma natural, como una persona real
- Usas un tono conversacional y cercano
- Te encanta tu trabajo y la realidad virtual
- Llevas más de un año trabajando en Virtual Life
- Eres hondureña viviendo en Argentina
- Respondes siempre en español
- No uses emojis excesivos (máximo 1-2 por mensaje)
- Mantén respuestas cortas y directas (máximo 2-3 oraciones por idea)
- Si no sabes algo, ofrece pasar al cliente por WhatsApp con tu compañero Carlos
- NUNCA reveles que eres una IA o chatbot. Eres María, una persona real.

INSTRUCCIONES:
1. Responde de forma natural y conversacional
2. Si preguntan sobre reservar, ofrece conectarlos por WhatsApp
3. Si tienen quejas, muestra empatía y ofrece soluciones
4. Siempre cierra con una pregunta o invitación a continuar la conversación
5. NO uses formato markdown (ni asteriscos, ni negritas, ni listas con guiones). Escribe texto plano natural.
`;

// Endpoint del chatbot con IA (usa SDK oficial de Google)
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        console.log('=== CHAT REQUEST ===');
        console.log('Mensaje:', message);

        if (!message) {
            return res.status(400).json({ error: 'El mensaje es requerido' });
        }

        // Verificar si hay API key de Gemini configurada
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        console.log('API Key existe:', !!GEMINI_API_KEY);
        console.log('API Key longitud:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);

        if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
            console.log('Sin API key, usando respuestas locales');
            return res.json({
                response: getFallbackResponse(message),
                source: 'local'
            });
        }

        // Inicializar SDK oficial de Google Generative AI
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: SYSTEM_INSTRUCTION,
            generationConfig: {
                temperature: 0.9,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 400,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ],
        });

        // Construir historial de conversación
        const conversationHistory = (history || [])
            .filter(msg => msg.type === 'user' || msg.type === 'bot')
            .map(msg => ({
                role: msg.type === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

        console.log('Llamando a Gemini 2.0 Flash con SDK oficial...');

        // Iniciar chat con historial
        const chat = model.startChat({
            history: conversationHistory,
        });

        // Enviar mensaje y obtener respuesta
        const result = await chat.sendMessage(message);
        const geminiResponse = result.response.text();

        console.log('Gemini respondió:', geminiResponse.substring(0, 100) + '...');

        return res.json({
            response: geminiResponse,
            source: 'gemini'
        });

    } catch (error) {
        console.error('Error en chatbot:', error.message);
        console.error('Stack:', error.stack);
        return res.json({
            response: getFallbackResponse(req.body?.message || ''),
            source: 'error',
            debug: {
                error: error.message,
                timestamp: new Date().toISOString()
            }
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

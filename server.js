/**
 * VIRTUAL LIFE - Servidor Backend Profesional
 * Servidor Express con configuraciones de seguridad y optimización
 */

const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

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
            connectSrc: ["'self'", "https://wa.me"],
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

/**
 * Keep-Alive Endpoint para Vercel
 * Este endpoint es llamado periódicamente por servicios como UptimeRobot (gratis)
 * para mantener las funciones serverless "calientes" y evitar cold starts.
 * 
 * Configuración recomendada:
 * 1. Crear cuenta gratis en https://uptimerobot.com
 * 2. Agregar un monitor HTTP(s) apuntando a: https://virtual-life.vercel.app/api/keep-alive
 * 3. Intervalo: cada 5 minutos
 * 
 * Esto mantiene la función activa 24/7 sin costo.
 */

module.exports = function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    res.status(200).json({
        alive: true,
        timestamp: new Date().toISOString(),
        version: '5.0.0',
        service: 'Virtual Life - Keep Alive',
        uptime: 'serverless'
    });
};

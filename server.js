// Servidor estático mínimo (sin dependencias)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const PORT = 5173, ROOT = process.cwd();
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.css': 'text/css', '.md': 'text/plain', '.json': 'application/json' };

// Historial de manejos de Percy. La NASA no deja que el navegador lo lea directo (CORS),
// así que el servidor lo pide por nosotros. Si no hay internet, usa la copia guardada.
const NASA_WAYPOINTS = 'https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json';
const COPIA = path.join(ROOT, 'public/data/M20_waypoints.json');
async function waypoints(res) {
  try {
    const r = await fetch(NASA_WAYPOINTS, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const texto = await r.text();
    JSON.parse(texto);                      // nos aseguramos de que sea JSON válido
    fs.writeFile(COPIA, texto, () => {});   // refrescamos la copia de respaldo
    res.writeHead(200, { 'Content-Type': 'application/json', 'X-Fuente': 'nasa-en-vivo' });
    res.end(texto);
  } catch {
    fs.readFile(COPIA, (err, data) => {
      if (err) { res.writeHead(502); return res.end('Sin datos de la NASA'); }
      res.writeHead(200, { 'Content-Type': 'application/json', 'X-Fuente': 'copia-local' });
      res.end(data);
    });
  }
}

http.createServer((req, res) => {
  let ruta = decodeURIComponent(req.url.split('?')[0]);
  if (ruta === '/api/waypoints') return waypoints(res);
  if (ruta === '/') ruta = '/perseverance.html';
  const archivo = path.join(ROOT, ruta);
  if (!archivo.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(archivo, (err, data) => {
    if (err) { res.writeHead(404); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`🚀 Marte en http://localhost:${PORT}`));

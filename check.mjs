// Revisión automática: abre la escena en Chrome invisible, maneja el rover,
// guarda captura y lista errores de consola
import { chromium } from 'playwright-core';
const URL = 'http://localhost:5173';
const errores = [];
const navegador = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 720 } });
pagina.on('console', m => {
  if (m.type() === 'error') errores.push('console: ' + m.text());
  else if (/Rover|Cámaras|ruedas|rueda|cámaras/.test(m.text())) console.log('ℹ️  ' + m.text());
});
pagina.on('pageerror', e => errores.push('pageerror: ' + e.message));
pagina.on('requestfailed', r => errores.push('request: ' + r.url() + ' ' + r.failure()?.errorText));
try {
  await pagina.goto(URL, { waitUntil: 'networkidle' });
  await pagina.waitForFunction(() => window.roverListo === true, null, { timeout: 30000 });
  // Manejamos un poco para ver huellas y la cámara siguiendo
  await pagina.keyboard.down('w'); await pagina.waitForTimeout(3000);
  await pagina.keyboard.down('a'); await pagina.waitForTimeout(1500);
  await pagina.keyboard.up('a');   await pagina.waitForTimeout(1500);
  await pagina.keyboard.up('w');   await pagina.waitForTimeout(1500);
  // Control de misión: los 4 datos deben cargar con números reales
  try {
    await pagina.waitForFunction(() => window.controlMision?.listos === 4, null, { timeout: 20000 });
  } catch { errores.push('control de misión: no cargaron los 4 datos'); }
  const datos = await pagina.evaluate(() => window.controlMision.cargados);
  for (const k of ['distancia', 'altura', 'inclinacion', 'luz']) {
    if (Number.isFinite(datos[k])) console.log(`🛰️  ${k}: ${datos[k].toFixed(2)}`);
    else errores.push(`control de misión: "${k}" no tiene un número`);
  }
  console.log('🛰️  fuente: ' + await pagina.textContent('#fuente'));
  // La tecla T oculta el panel y lo vuelve a mostrar
  const oculto = () => pagina.evaluate(() => document.getElementById('mision').classList.contains('oculto'));
  await pagina.keyboard.press('t');
  if (!(await oculto())) errores.push('tecla T: el panel no se ocultó');
  await pagina.keyboard.press('t');
  if (await oculto()) errores.push('tecla T: el panel no volvió a aparecer');
  else console.log('🛰️  tecla T: oculta y muestra el panel');
  await pagina.waitForTimeout(500);
  await pagina.screenshot({ path: 'captura.png' });
  console.log('📸 Captura guardada en captura.png');

  // Cámaras del rover: cada una debe abrir una foto real de Marte
  const fotoLista = () => pagina.waitForFunction(() => {
    const img = document.getElementById('foto');
    return img.complete && img.naturalWidth > 0 && img.classList.contains('revelada');
  }, null, { timeout: 15000 });
  for (const cam of ['Mastcam_Z_cams', 'NavCams', 'hazcams_front', 'WATSON']) {
    try {
      await pagina.click(`.camara[data-cam="${cam}"]`, { force: true, timeout: 5000 });
      await fotoLista();
      const pie = await pagina.textContent('#pie');
      await pagina.keyboard.press('ArrowRight');   // otra foto de la misma cámara
      await pagina.waitForTimeout(100);
      await fotoLista();
      console.log(`📷 ${pie.split(' · NASA')[0]} (→ también funciona)`);
      await pagina.keyboard.press('Escape');
      if (await pagina.evaluate(() => window.visorFotos.camara)) errores.push(`${cam}: Esc no cerró el visor`);
    } catch (e) { errores.push(`cámara ${cam}: no abrió una foto (${e.message.split('\n')[0]})`); }
  }
  // Captura con una foto abierta
  await pagina.click('.camara[data-cam="NavCams"]', { force: true });
  await fotoLista().catch(() => {});
  await pagina.waitForTimeout(3500);   // esperamos a que termine de revelarse
  await pagina.screenshot({ path: 'captura-foto.png' });
  console.log('📸 Captura con la foto abierta en captura-foto.png');
} catch (e) { errores.push('navegación: ' + e.message); }
await navegador.close();
if (errores.length) { console.log(`❌ ${errores.length} error(es):`); errores.forEach(e => console.log(' - ' + e)); process.exit(1); }
console.log('✅ 0 errores de consola');

'use strict';

/* ============================ CONFIGURACIÓN ============================
   Ajustar estos indicadores para subir o bajar la dificultad de la prueba.
   IMPORTANTE: cambiar camposSenuelo, botonesSenuelo o idsEstables modifica
   la estructura o las propiedades de los objetos UNA única vez; después de
   ajustar la configuración hay que re-capturar los objetos del Recorder. */
const CONFIG = {
    variarEtiquetas: true,   // rota sinónimos en las etiquetas de los 3 campos objetivo
    camposSenuelo: true,     // incluye los 7 campos señuelo (siempre los mismos, en el mismo orden del DOM)
    botonesSenuelo: true,    // incluye los botones "Limpiar" y "Cancelar"
    autoDescargarPDF: true,  // descarga el comprobante PDF al radicar
    idsEstables: false       // true: ids/names semánticos fijos (solo para depurar; reduce la prueba)
};

/* ========================= UTILIDADES ALEATORIAS ======================= */
const rnd = {
    ent: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
    elegir: (arr) => arr[Math.floor(Math.random() * arr.length)],
    barajar: (arr) => {
        const c = [...arr];
        for (let i = c.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [c[i], c[j]] = [c[j], c[i]];
        }
        return c;
    },
    muestra: (arr, n) => rnd.barajar(arr).slice(0, n),
    hex: (n = 6) => Array.from(crypto.getRandomValues(new Uint8Array(n)))
        .map((b) => (b % 36).toString(36)).join(''),
    prob: (p) => Math.random() < p
};

/* Identificadores opacos: sin ninguna pista semántica para el recorder. */
const gid = () => 'e' + rnd.hex(6);
const gname = () => 'n' + rnd.hex(6);
const claseBasura = () => rnd.muestra(
    ['ctl', 'ui-item', 'frm-el', 'bloque', 'x-f', 'elem', 'grp', 'wrp', 'cont'],
    rnd.ent(1, 2)
).join(' ');

/* ========================= CATÁLOGOS DE VARIACIÓN ====================== */
const TEMAS = [
    { nombre: 'Azul institucional', primario: '#1b4f8a', primarioOsc: '#123a67', fondo: '#eef2f7', superficie: '#ffffff', texto: '#1f2937', sutil: '#64748b', borde: '#d3dce6' },
    { nombre: 'Verde salud', primario: '#1e7f5c', primarioOsc: '#145c42', fondo: '#f0f5f2', superficie: '#ffffff', texto: '#1f2a26', sutil: '#5f7268', borde: '#cfe0d8' },
    { nombre: 'Vinotinto', primario: '#7a1f3d', primarioOsc: '#5a152d', fondo: '#f7f0f2', superficie: '#ffffff', texto: '#2a1f23', sutil: '#7d6a70', borde: '#e2d3d9' },
    { nombre: 'Gris corporativo', primario: '#37474f', primarioOsc: '#263238', fondo: '#f3f4f6', superficie: '#ffffff', texto: '#212121', sutil: '#6b7280', borde: '#d5d9dd' },
    { nombre: 'Teal', primario: '#0e7490', primarioOsc: '#155e75', fondo: '#ecf6f8', superficie: '#ffffff', texto: '#1c2b30', sutil: '#557780', borde: '#cfe3e8' },
    { nombre: 'Terracota', primario: '#b45309', primarioOsc: '#92400e', fondo: '#faf3ec', superficie: '#ffffff', texto: '#292018', sutil: '#8a7460', borde: '#e8d9c8' }
];

const FUENTES_CUERPO = [
    "'Segoe UI', Arial, sans-serif",
    "Verdana, Geneva, sans-serif",
    "'Trebuchet MS', Tahoma, sans-serif",
    "Arial, Helvetica, sans-serif",
    "Tahoma, Verdana, sans-serif"
];
const FUENTES_TITULO = [
    "'Segoe UI', Arial, sans-serif",
    "Georgia, 'Times New Roman', serif",
    "'Trebuchet MS', Tahoma, sans-serif",
    "Verdana, Geneva, sans-serif"
];
const RADIOS = ['0px', '4px', '10px'];
const ESPACIOS = ['10px', '14px', '18px'];
const ANCHOS = ['640px', '780px', '920px'];

const ENCABEZADOS = [
    { titulo: 'Portal de Radicación de Cuentas Médicas', entidad: 'Sura EPS' },
    { titulo: 'Sistema Integrado de Radicación de Facturas', entidad: 'Sura EPS · Área de Cuentas Médicas' },
    { titulo: 'Ventanilla Virtual de Radicación', entidad: 'EPS Sura — Prestadores' },
    { titulo: 'Módulo de Recepción de Cuentas Hospitalarias', entidad: 'Sura EPS' },
    { titulo: 'Radicación Electrónica de Cuentas', entidad: 'Sura EPS · Red de Prestadores' }
];
const SUBTITULOS = [
    'Prestador: Hospital San Rafael — Medellín',
    'Convenio: Hospital San Rafael · NIT 900.123.456-7',
    'Canal exclusivo para IPS en convenio'
];
const NAV_POOL = ['Inicio', 'Radicaciones', 'Consultas', 'Glosas', 'Reportes', 'Ayuda', 'Mi cuenta'];
const MIGAS = [
    'Inicio / Cuentas médicas / Nueva radicación',
    'Radicaciones / Nueva',
    'Inicio / Radicación electrónica'
];

/* Campos objetivo: la primera etiqueta es la canónica (la misma del correo
   del Bot 1). Las demás son sinónimos semánticamente equivalentes.       */
const CAMPOS_OBJETIVO = [
    {
        clave: 'documento',
        canonica: 'Número de documento',
        etiquetas: ['Número de documento', 'No. de documento del paciente', 'Documento de identidad', 'Número de identificación'],
        placeholder: 'Ej. 1023456789',
        tipo: 'text'
    },
    {
        clave: 'admision',
        canonica: 'Número de admisión',
        etiquetas: ['Número de admisión', 'No. de admisión', 'Admisión hospitalaria', 'Código de admisión'],
        placeholder: 'Ej. ADM-2026-004512',
        tipo: 'text'
    },
    {
        clave: 'valor',
        canonica: 'Valor total de la atención',
        etiquetas: ['Valor total de la atención', 'Valor total facturado', 'Total de la cuenta (COP)', 'Valor de la atención'],
        placeholder: 'Ej. 4.850.000',
        tipo: 'text'
    }
];

/* Campos señuelo: presentes solo para agregar ruido realista. Se renderizan
   SIEMPRE todos y en este mismo orden del DOM, para que la estructura (y el
   DOMXPath) no cambie entre cargas. El bot no debe diligenciarlos.       */
const SENUELOS = [
    { etiqueta: 'Nombre completo del paciente', tipo: 'text' },
    { etiqueta: 'Número de afiliación', tipo: 'text' },
    { etiqueta: 'Régimen', tipo: 'select', opciones: ['Seleccione…', 'Contributivo', 'Subsidiado'] },
    { etiqueta: 'Fecha de ingreso', tipo: 'date' },
    { etiqueta: 'Servicio', tipo: 'text' },
    { etiqueta: 'Teléfono de contacto', tipo: 'text' },
    { etiqueta: 'Observaciones', tipo: 'textarea' }
];

const BOTONES_RADICAR = ['Radicar cuenta', 'Radicar', 'Enviar radicación', 'Registrar radicación'];

/* =============================== ESTADO ================================ */
const estado = { tema: null, refs: {}, variacion: {} };

/* ============================= UTILIDADES ============================== */
function hexToRgb(h) {
    const x = h.replace('#', '');
    return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
}

const escapar = (s) => String(s).replace(/[&<>"']/g, (m) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
));

function aplicarTema(t) {
    const r = document.documentElement.style;
    const [pr, pg, pb] = hexToRgb(t.primario);
    r.setProperty('--primario', t.primario);
    r.setProperty('--primario-osc', t.primarioOsc);
    r.setProperty('--primario-rgb', pr + ',' + pg + ',' + pb);
    r.setProperty('--fondo', t.fondo);
    r.setProperty('--superficie', t.superficie);
    r.setProperty('--texto', t.texto);
    r.setProperty('--sutil', t.sutil);
    r.setProperty('--borde', t.borde);
    r.setProperty('--f-cuerpo', rnd.elegir(FUENTES_CUERPO));
    r.setProperty('--f-titulo', rnd.elegir(FUENTES_TITULO));
    r.setProperty('--radio', rnd.elegir(RADIOS));
    r.setProperty('--espacio', rnd.elegir(ESPACIOS));
    r.setProperty('--ancho', rnd.elegir(ANCHOS));
}

/* ======================= GENERACIÓN DE LA VISTA ========================
   Regla de oro de esta versión: todo lo aleatorio es CSS o contenido de
   texto. NADA altera el orden, la jerarquía ni la profundidad del DOM.   */

function entradaHTML(c, id) {
    const nm = (CONFIG.idsEstables && c.clave) ? 'n_' + c.clave : gname();
    const ph = c.placeholder ? ' placeholder="' + c.placeholder + '"' : '';
    if (c.tipo === 'select') {
        const ops = c.opciones.map((o, i) => '<option' + (i === 0 ? ' value=""' : '') + '>' + o + '</option>').join('');
        return '<select id="' + id + '" name="' + nm + '" class="entrada">' + ops + '</select>';
    }
    if (c.tipo === 'textarea') {
        return '<textarea id="' + id + '" name="' + nm + '" class="entrada" rows="2"' + ph + '></textarea>';
    }
    return '<input id="' + id + '" name="' + nm + '" class="entrada" type="' + c.tipo + '"' + ph + '>';
}

function etiquetaHTML(c, id) {
    return '<label class="etq-l" for="' + id + '">' + c.etiqueta +
        (c.objetivo ? ' <span class="req">*</span>' : '') + '</label>';
}

/* Cada campo es SIEMPRE un único div.campo con label + control, sin
   contenedores adicionales: profundidad constante = DOMXPath constante.
   La posición visual la define la propiedad CSS "order" (aleatoria).     */
function campoHTML(c, orden, modo, etIzq, idsObj) {
    const id = (CONFIG.idsEstables && c.clave) ? 'campo_' + c.clave : gid();
    if (c.objetivo) idsObj[c.clave] = id;
    const clases = ['campo'];
    if (modo === 'tarjetas') clases.push('tarjeta');
    if (etIzq) clases.push('lado');
    return '<div class="' + clases.join(' ') + ' ' + claseBasura() + '" style="order:' + orden + '">' +
        etiquetaHTML(c, id) + entradaHTML(c, id) + '</div>';
}

function navHTML() {
    const items = rnd.muestra(NAV_POOL, rnd.ent(3, 5));
    return '<nav class="nav">' + items.map((t, i) =>
        '<a href="#" class="' + (i === 0 ? 'activo' : '') + '" onclick="return false">' + t + '</a>'
    ).join('') + '</nav>';
}

function cabeceraHTML(enc) {
    const estilo = rnd.elegir(['banda', 'clara']);
    const sub = rnd.prob(0.7) ? '<p class="sub">' + rnd.elegir(SUBTITULOS) + '</p>' : '';
    return '<header class="cabecera cabecera--' + estilo + '"><div class="cab-int">' +
        '<div class="logo">' + rnd.elegir(['SR', 'EPS', 'S']) + '</div>' +
        '<div><h1>' + enc.titulo + '</h1><p class="ent">' + enc.entidad + '</p>' + sub + '</div>' +
        '</div></header>';
}

/* Orden FIJO en el DOM: [radicar, limpiar, cancelar]. El botón de radicar
   es siempre el primer button del formulario (XPath estable). La posición
   visual de los tres se baraja con la propiedad CSS "order".             */
function botoneraHTML() {
    const defs = [{
        tipo: 'submit',
        clase: 'btn btn-primario',
        texto: rnd.elegir(BOTONES_RADICAR),
        id: CONFIG.idsEstables ? 'btnRadicar' : gid()
    }];
    if (CONFIG.botonesSenuelo) {
        defs.push({ tipo: 'reset', clase: 'btn btn-sec', texto: 'Limpiar', id: gid() });
        defs.push({ tipo: 'button', clase: 'btn btn-sec btn-cancelar', texto: 'Cancelar', id: gid() });
    }
    const ordenes = rnd.barajar(defs.map((_, i) => i));
    const botones = defs.map((d, i) =>
        '<button type="' + d.tipo + '" id="' + d.id + '" class="' + d.clase + '" style="order:' + ordenes[i] + '">' + d.texto + '</button>'
    ).join('');
    return '<div class="fila-botones" style="justify-content:' +
        rnd.elegir(['flex-start', 'flex-end']) + '">' + botones + '</div>';
}

function piePaginaHTML(build) {
    return '<footer class="pie">Entorno de pruebas para Recorder · Build <strong>' + build +
        '</strong> · Posiciones y propiedades cambian en cada carga; la estructura del DOM es fija · ' +
        '<a href="#" id="lnkVariacion">Generar nueva variación ⟳</a></footer>';
}

/* ============================== ALERTAS ================================ */
function mostrarAlerta(msg, tipo) {
    const a = document.getElementById('alerta');
    if (!a) return;
    a.textContent = msg;
    a.className = 'alerta ' + (tipo === 'error' ? 'alerta-error' : 'alerta-info');
    a.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function ocultarAlerta() {
    const a = document.getElementById('alerta');
    if (a) a.className = 'alerta oculta';
}

/* ======================== RADICACIÓN Y COMPROBANTE ===================== */
function radicar(ev) {
    ev.preventDefault();
    const d = {};
    const faltan = [];
    for (const c of CAMPOS_OBJETIVO) {
        const el = estado.refs[c.clave];
        const v = (el.value || '').trim();
        const cont = el.closest('.campo');
        if (cont) cont.classList.remove('error');
        if (!v) {
            faltan.push(c.canonica);
            if (cont) cont.classList.add('error');
        }
        d[c.clave] = v;
    }
    if (faltan.length) {
        mostrarAlerta('Complete los campos obligatorios: ' + faltan.join(', ') + '.', 'error');
        return;
    }
    confirmar(d);
}

function confirmar(d) {
    const radicado = 'RAD-' + new Date().getFullYear() + '-' + String(rnd.ent(0, 999999)).padStart(6, '0');
    const fechaTexto = new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });
    const idBtnPdf = CONFIG.idsEstables ? 'btnDescargarPdf' : gid();
    const cont = document.querySelector('.contenedor');
    cont.innerHTML =
        '<div class="confirmacion">' +
        '<div id="alerta" class="alerta oculta"></div>' +
        '<div class="check">✓</div>' +
        '<h2>Radicación registrada exitosamente</h2>' +
        '<p class="rad">Número de radicado: <strong>' + radicado + '</strong></p>' +
        '<p class="fecha">' + fechaTexto + '</p>' +
        '<table class="tabla-resumen"><tbody>' +
        '<tr><td>Número de documento</td><td>' + escapar(d.documento) + '</td></tr>' +
        '<tr><td>Número de admisión</td><td>' + escapar(d.admision) + '</td></tr>' +
        '<tr><td>Valor total de la atención</td><td>' + escapar(d.valor) + '</td></tr>' +
        '</tbody></table>' +
        '<p class="nota">' + (CONFIG.autoDescargarPDF
            ? 'El comprobante en PDF se descargó automáticamente a la carpeta de descargas del navegador.'
            : 'Descargue el comprobante en PDF con el botón inferior.') + '</p>' +
        '<button class="btn btn-primario" id="' + idBtnPdf + '" type="button">Descargar comprobante (PDF)</button>' +
        '</div>';
    document.getElementById(idBtnPdf).addEventListener('click', () => generarPDF(d, radicado, fechaTexto));
    if (CONFIG.autoDescargarPDF) generarPDF(d, radicado, fechaTexto);
}

function generarPDF(d, radicado, fechaTexto) {
    if (!window.jspdf) {
        mostrarAlerta('No fue posible generar el PDF: la librería jsPDF no está disponible. Se requiere conexión a internet para cargarla desde el CDN.', 'error');
        return;
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const [r, g, b] = hexToRgb(estado.tema.primario);

    /* Encabezado */
    pdf.setFillColor(r, g, b);
    pdf.rect(0, 0, 210, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text('COMPROBANTE DE RADICACIÓN', 105, 13, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Sura EPS · Radicación de Cuentas Médicas', 105, 21, { align: 'center' });

    /* Datos generales */
    pdf.setTextColor(45, 45, 45);
    let y = 42;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold'); pdf.text('Radicado:', 20, y);
    pdf.setFont('helvetica', 'normal'); pdf.text(radicado, 48, y);
    y += 7;
    pdf.setFont('helvetica', 'bold'); pdf.text('Fecha de registro:', 20, y);
    pdf.setFont('helvetica', 'normal'); pdf.text(fechaTexto, 60, y);
    y += 7;
    pdf.setFont('helvetica', 'bold'); pdf.text('Prestador:', 20, y);
    pdf.setFont('helvetica', 'normal'); pdf.text('Hospital San Rafael — Medellín', 48, y);
    y += 12;

    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, y, 190, y);
    y += 9;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Datos radicados', 20, y);
    y += 5;

    /* Tabla de valores */
    let valorMostrar = d.valor;
    if (!/\$/.test(valorMostrar)) valorMostrar = '$ ' + valorMostrar;
    if (!/COP/i.test(valorMostrar)) valorMostrar += ' COP';

    const filas = [
        ['Número de documento', d.documento],
        ['Número de admisión', d.admision],
        ['Valor total de la atención', valorMostrar]
    ];
    pdf.setFontSize(11);
    filas.forEach((f, i) => {
        const alto = 12;
        if (i % 2 === 0) {
            pdf.setFillColor(244, 246, 248);
            pdf.rect(20, y, 170, alto, 'F');
        }
        pdf.setDrawColor(215, 215, 215);
        pdf.rect(20, y, 170, alto);
        pdf.line(95, y, 95, y + alto);
        pdf.setFont('helvetica', 'bold');
        pdf.text(f[0], 24, y + 7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(f[1]), 99, y + 7.5);
        y += alto;
    });

    /* Pie */
    y += 14;
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.text('Documento generado automáticamente por el portal de radicación. Entorno de demostración — no válido como soporte real.', 105, y, { align: 'center', maxWidth: 170 });
    y += 10;
    pdf.text('Vista de origen: build ' + estado.variacion.build, 105, y, { align: 'center' });

    const nombre = 'comprobante_' + (d.admision || 'radicacion').replace(/[^A-Za-z0-9\-]/g, '') + '.pdf';
    pdf.save(nombre);
}

/* ========================= CONSTRUCCIÓN INICIAL ======================== */
function construir() {
    const build = rnd.hex(6);
    const tema = rnd.elegir(TEMAS);
    estado.tema = tema;
    aplicarTema(tema);

    const enc = rnd.elegir(ENCABEZADOS);
    /* document.title NO se modifica: el título de la ventana queda fijo en el
       valor del <title> del documento, porque Automation Anywhere identifica
       la ventana del navegador por ese nombre. Solo varía el encabezado
       visible (h1), que no interviene en la identificación de la ventana. */

    /* Variación de apariencia: exclusivamente CSS, sin efecto en el DOM */
    const modo = rnd.elegir(['tarjetas', 'plano', 'tabla']);
    const columnas = modo === 'tarjetas' ? rnd.elegir([1, 2]) : 1;
    const etiquetaIzq = modo === 'plano' && rnd.prob(0.4);

    /* Campos en ORDEN FIJO en el DOM (DOMXPath estable). La posición visual
       de cada campo se baraja mediante la propiedad CSS "order".           */
    const objetivos = CAMPOS_OBJETIVO.map((c) => ({
        ...c,
        objetivo: true,
        etiqueta: CONFIG.variarEtiquetas ? rnd.elegir(c.etiquetas) : c.etiquetas[0]
    }));
    const senuelos = CONFIG.camposSenuelo
        ? SENUELOS.map((s) => ({ ...s, objetivo: false }))
        : [];
    const campos = [...objetivos, ...senuelos];
    const ordenes = rnd.barajar(campos.map((_, i) => i));

    /* Ensamble: la secuencia nav → cabecera → miga → main → pie es SIEMPRE la
       misma, para que la cadena de ancestros de los objetos no cambie.      */
    const idsObjetivo = {};
    const rejillaClase = 'rejilla' + (modo === 'tabla' ? ' modo-tabla' : '');
    const cuerpo =
        '<div class="grupo-simple"><div class="' + rejillaClase + '" style="--cols:' + columnas + '">' +
        campos.map((c, i) => campoHTML(c, ordenes[i], modo, etiquetaIzq, idsObjetivo)).join('') +
        '</div></div>';

    const partes = [];
    partes.push(navHTML());
    partes.push(cabeceraHTML(enc));
    partes.push('<div class="miga">' + rnd.elegir(MIGAS) + '</div>');
    partes.push(
        '<main class="contenedor">' +
        '<div id="alerta" class="alerta oculta"></div>' +
        '<form id="frm" autocomplete="off" novalidate>' + cuerpo + botoneraHTML() + '</form>' +
        '</main>'
    );
    partes.push(piePaginaHTML(build));
    document.getElementById('app').innerHTML = partes.join('');

    /* Referencias directas a los inputs objetivo (independientes del id) */
    for (const c of CAMPOS_OBJETIVO) {
        estado.refs[c.clave] = document.getElementById(idsObjetivo[c.clave]);
    }

    /* Eventos */
    const frm = document.getElementById('frm');
    frm.addEventListener('submit', radicar);
    frm.addEventListener('reset', () => {
        ocultarAlerta();
        document.querySelectorAll('.error').forEach((e) => e.classList.remove('error'));
    });
    const bc = document.querySelector('.btn-cancelar');
    if (bc) bc.addEventListener('click', () => mostrarAlerta('Operación cancelada. Los datos no fueron radicados.', 'info'));
    document.getElementById('lnkVariacion').addEventListener('click', (e) => {
        e.preventDefault();
        location.reload();
    });

    /* Registro de la variación (visible en la consola del navegador) */
    const secuenciaVisual = campos
        .map((c, i) => ({ o: ordenes[i], t: c.objetivo ? c.clave.toUpperCase() : 'señuelo' }))
        .sort((a, b) => a.o - b.o)
        .map((x) => x.t)
        .join(' → ');
    estado.variacion = {
        build: build,
        tema: tema.nombre,
        modo: modo,
        columnas: columnas,
        etiquetaIzquierda: etiquetaIzq,
        estructuraDOM: 'fija (DOMXPath estable)',
        ordenVisual: secuenciaVisual
    };
    console.table([estado.variacion]);
}

construir();

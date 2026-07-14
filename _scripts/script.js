;(function () {
  'use strict'
  const $ = id => document.getElementById(id)
  const form = $('formReclamo')

  /* ---------- Formateo de campos ---------- */
  $('cedula').addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
  })
  $('telefono').addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9)
  })
  $('tarjeta').addEventListener('input', e => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 16)
    e.target.value = d.replace(/(.{4})/g, '$1 ').trim()
  })
  $('fechaTrx').max = new Date().toISOString().slice(0, 10)

  /* ---------- Recurrencia ---------- */
  $('repetido').addEventListener('change', e => {
    $('campoRepeticiones').classList.toggle('visible', e.target.checked)
    if (!e.target.checked) $('numRepeticiones').value = ''
  })

  /* ---------- Adjunto condicional según motivo ---------- */
  function reglaAdjunto () {
    const opt = $('motivo').selectedOptions[0]
    const aviso = $('avisoAdjunto')
    if (!opt || !opt.dataset.adjunto) {
      aviso.className = 'aviso-adjunto'
      $('reqAdjunto').hidden = true
      return
    }
    if (opt.dataset.adjunto === 'obligatorio') {
      aviso.textContent =
        'Para transacciones no reconocidas, adjunte el soporte del cobro (voucher, captura del estado de cuenta o notificación).'
      aviso.className = 'aviso-adjunto obligatorio'
      $('reqAdjunto').hidden = false
    } else {
      aviso.textContent =
        'El documento de soporte es opcional para este motivo.'
      aviso.className = 'aviso-adjunto opcional'
      $('reqAdjunto').hidden = true
    }
  }
  $('motivo').addEventListener('change', reglaAdjunto)

  /* ---------- Validación ---------- */
  function marcar (id, ok) {
    $(id).closest('.campo').classList.toggle('invalido', !ok)
    return ok
  }
  function validar () {
    let ok = true
    ok = marcar('nombres', $('nombres').value.trim().length >= 5) && ok
    ok = marcar('cedula', /^\d{10}$/.test($('cedula').value)) && ok
    ok = marcar('ciudad', $('ciudad').value.trim() !== '') && ok
    ok = marcar('direccion', $('direccion').value.trim() !== '') && ok
    ok =
      marcar(
        'correo',
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('correo').value.trim())
      ) && ok
    ok =
      marcar('tarjeta', $('tarjeta').value.replace(/\s/g, '').length === 16) &&
      ok
    ok = marcar('tipoProducto', $('tipoProducto').value !== '') && ok
    ok = marcar('franquicia', $('franquicia').value !== '') && ok
    const f = $('fechaTrx').value
    ok =
      marcar(
        'fechaTrx',
        f !== '' && f <= new Date().toISOString().slice(0, 10)
      ) && ok
    ok = marcar('monto', parseFloat($('monto').value) > 0) && ok
    ok = marcar('comercio', $('comercio').value.trim() !== '') && ok
    if ($('repetido').checked) {
      ok =
        marcar(
          'numRepeticiones',
          parseInt($('numRepeticiones').value, 10) >= 2
        ) && ok
    }
    ok = marcar('motivo', $('motivo').value !== '') && ok
    ok = marcar('descripcion', $('descripcion').value.trim().length >= 10) && ok
    const opt = $('motivo').selectedOptions[0]
    const requiereAdjunto = opt && opt.dataset.adjunto === 'obligatorio'
    ok =
      marcar('adjunto', !requiereAdjunto || $('adjunto').files.length > 0) && ok
    if (!ok) {
      const primero = document.querySelector('.campo.invalido')
      if (primero)
        primero.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return ok
  }

  /* ---------- Radicado ---------- */
  function generarRadicado (ahora) {
    const y = ahora.getFullYear()
    const m = String(ahora.getMonth() + 1).padStart(2, '0')
    const d = String(ahora.getDate()).padStart(2, '0')
    const seq = String(Math.floor(1000 + Math.random() * 9000))
    return `REC-${y}${m}${d}-${seq}`
  }

  /* ---------- PDF ---------- */
  function generarPDF (datos) {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const margen = 18,
      ancho = 210 - margen * 2
    let y

    // Encabezado
    doc.setFillColor(240, 86, 29)
    doc.rect(0, 0, 210, 26, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text('BANCO AA', margen, 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Centro de reclamos — Tarjetas de crédito y débito', margen, 18)
    doc.setFont('courier', 'bold')
    doc.setFontSize(11)
    doc.text(datos.radicado, 210 - margen, 12, { align: 'right' })
    doc.setFont('courier', 'normal')
    doc.setFontSize(8)
    doc.text('Reporte de reclamo', 210 - margen, 17.5, { align: 'right' })

    y = 36
    doc.setTextColor(35, 37, 43)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('Reporte de reclamo', margen, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(107, 110, 118)
    doc.text(`Fecha y hora de registro: ${datos.fechaRegistro}`, margen, y)
    y += 9

    function seccion (titulo) {
      doc.setFillColor(253, 235, 226)
      doc.rect(margen, y - 4.5, ancho, 7, 'F')
      doc.setTextColor(138, 52, 17)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.text(titulo.toUpperCase(), margen + 2, y)
      y += 8
    }
    function fila (etiqueta, valor) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(107, 110, 118)
      doc.text(etiqueta, margen + 2, y)
      doc.setTextColor(35, 37, 43)
      doc.setFont('helvetica', 'bold')
      doc.text(String(valor), margen + 62, y)
      y += 6.2
    }
    function parrafo (texto) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(35, 37, 43)
      const lineas = doc.splitTextToSize(texto, ancho - 4)
      doc.text(lineas, margen + 2, y)
      y += lineas.length * 5 + 3
    }

    seccion('Datos del cliente')
    fila('Nombres y apellidos', datos.nombres)
    fila('Cédula', datos.cedula)
    fila('Ciudad', datos.ciudad)
    fila('Dirección', datos.direccion)
    fila('Correo electrónico', datos.correo)
    if (datos.telefono) fila('Teléfono', datos.telefono)
    y += 3

    seccion('Producto')
    fila('Número de tarjeta', datos.tarjeta)
    fila('Tipo de producto', datos.tipoProducto)
    fila('Franquicia', datos.franquicia)
    y += 3

    seccion('Transacción reclamada')
    fila('Fecha de la transacción', datos.fechaTrx)
    fila('Comercio', datos.comercio)
    fila('Monto', `USD ${datos.monto}`)
    fila(
      'Cobro repetido',
      datos.repetido ? `Sí — ${datos.numRepeticiones} veces en total` : 'No'
    )
    y += 3

    seccion('Motivo del reclamo')
    parrafo(`Motivo seleccionado: ${datos.motivo}`)
    parrafo(`Descripción del cliente: ${datos.descripcion}`)
    y += 3

    seccion('Documento de soporte')
    fila('Adjunto', datos.adjuntoNombre ? datos.adjuntoNombre : 'No adjuntado')

    // Pie
    doc.setDrawColor(227, 225, 220)
    doc.line(margen, 280, 210 - margen, 280)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(107, 110, 118)
    doc.text(
      'Documento generado automáticamente por el portal de reclamos de Banco AA — Entorno de simulación (POC).',
      105,
      285,
      { align: 'center' }
    )

    return doc
  }

  /* ---------- Descarga del adjunto renombrado ---------- */
  function descargarAdjunto (radicado, archivo) {
    const nombreLimpio = archivo.name.replace(/[^\w.\-]+/g, '_')
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(archivo)
    enlace.download = `${radicado}_adjunto_${nombreLimpio}`
    document.body.appendChild(enlace)
    enlace.click()
    setTimeout(() => {
      URL.revokeObjectURL(enlace.href)
      enlace.remove()
    }, 2000)
    return enlace.download
  }

  /* ---------- Envío ---------- */
  form.addEventListener('submit', e => {
    e.preventDefault()
    if (!validar()) return
    $('btnEnviar').disabled = true

    const ahora = new Date()
    const radicado = generarRadicado(ahora)
    const fechaRegistro = ahora.toLocaleString('es-EC', {
      dateStyle: 'short',
      timeStyle: 'medium'
    })
    const archivo = $('adjunto').files[0] || null

    const datos = {
      radicado,
      fechaRegistro,
      nombres: $('nombres').value.trim(),
      cedula: $('cedula').value,
      ciudad: $('ciudad').value.trim(),
      direccion: $('direccion').value.trim(),
      correo: $('correo').value.trim(),
      telefono: $('telefono').value,
      tarjeta: $('tarjeta').value,
      tipoProducto: $('tipoProducto').value,
      franquicia: $('franquicia').value,
      fechaTrx: $('fechaTrx').value,
      monto: parseFloat($('monto').value).toFixed(2),
      comercio: $('comercio').value.trim(),
      repetido: $('repetido').checked,
      numRepeticiones: $('numRepeticiones').value,
      motivo: $('motivo').value,
      descripcion: $('descripcion').value.trim(),
      adjuntoNombre: archivo ? archivo.name : null
    }

    // 1) Generar y descargar el PDF del reporte
    const pdf = generarPDF(datos)
    const nombrePDF = `${radicado}_reporte.pdf`
    pdf.save(nombrePDF)

    // 2) Descargar el adjunto renombrado con el radicado (si existe)
    let nombreAdjunto = null
    if (archivo) nombreAdjunto = descargarAdjunto(radicado, archivo)

    // 3) Mostrar comprobante
    $('rRadicado').textContent = radicado
    $('rFecha').textContent = fechaRegistro
    $('rTitular').textContent = datos.nombres
    const lista = $('rArchivos')
    lista.innerHTML = ''
    const li1 = document.createElement('li')
    li1.textContent = nombrePDF
    lista.appendChild(li1)
    if (nombreAdjunto) {
      const li2 = document.createElement('li')
      li2.textContent = nombreAdjunto
      lista.appendChild(li2)
    }
    form.hidden = true
    document.querySelector('.intro').hidden = true
    $('comprobante').classList.add('visible')
    $('comprobante').scrollIntoView({ behavior: 'smooth', block: 'start' })
  })

  /* ---------- Nuevo reclamo ---------- */
  $('btnNuevo').addEventListener('click', () => {
    form.reset()
    document
      .querySelectorAll('.campo.invalido')
      .forEach(c => c.classList.remove('invalido'))
    $('campoRepeticiones').classList.remove('visible')
    reglaAdjunto()
    form.hidden = false
    document.querySelector('.intro').hidden = false
    $('comprobante').classList.remove('visible')
    $('btnEnviar').disabled = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
})()

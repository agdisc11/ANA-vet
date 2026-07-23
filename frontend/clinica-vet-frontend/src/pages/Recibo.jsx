import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { pacientesService } from '../services/pacientesService';
import { expedientesService, consultasService } from '../services/clinicoService';
import { serviciosCatalogoService, inventarioService } from '../services/adminService';
import { recibosService } from '../services/recibosService';


// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const hoy = () => new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

const horaActual = () =>
  new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '—';
  const hoyDate = new Date();
  const nacimiento = new Date(fechaNacimiento);
  if (isNaN(nacimiento)) return fechaNacimiento;
  let anios = hoyDate.getFullYear() - nacimiento.getFullYear();
  let meses = hoyDate.getMonth() - nacimiento.getMonth();
  if (meses < 0) { anios--; meses += 12; }
  if (anios > 0) return `${anios} año${anios !== 1 ? 's' : ''}${meses > 0 ? ` ${meses} mes${meses !== 1 ? 'es' : ''}` : ''}`;
  if (meses > 0) return `${meses} mes${meses !== 1 ? 'es' : ''}`;
  const dias = Math.floor((hoyDate - nacimiento) / (1000 * 60 * 60 * 24));
  return `${dias} día${dias !== 1 ? 's' : ''}`;
};

// ─────────────────────────────────────────────────────────────
// Generador de PDF FORM-030
// ─────────────────────────────────────────────────────────────
const generarPDF = ({ paciente, expedienteId, consulta, serviciosSeleccionados, total, catalogo }) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;
  const fechaHoy = hoy();
  const horaHoy = horaActual();
  const nombrePaciente = paciente?.nombre || 'Paciente';

  // ── Paleta de colores ──
  const VIOLET = [109, 40, 217];   // violet-700
  const LIGHT_VIOLET = [237, 233, 254]; // violet-100
  const SLATE_DARK = [30, 41, 59];  // slate-800
  const SLATE_MID = [100, 116, 139]; // slate-500
  const WHITE = [255, 255, 255];

  // ══════════════════════════════════════════════════════════
  // ENCABEZADO
  // ══════════════════════════════════════════════════════════
  // Barra superior violeta
  doc.setFillColor(...VIOLET);
  doc.rect(0, 0, pageW, 28, 'F');

  // Nombre de la clínica
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text('Clínica Veterinaria ANA', margin, 12);

  // Subtítulo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(221, 214, 254); // violet-200
  doc.text('Atención médica veterinaria integral', margin, 18);

  // Código y revisión (esquina derecha)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text('FORM-030', pageW - margin, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Revisión: C', pageW - margin, 16, { align: 'right' });
  doc.text(`Fecha: ${fechaHoy}`, pageW - margin, 22, { align: 'right' });

  // Título del documento
  doc.setFillColor(...LIGHT_VIOLET);
  doc.rect(0, 28, pageW, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...VIOLET);
  doc.text('RECIBO DE SERVICIOS VETERINARIOS', pageW / 2, 36, { align: 'center' });

  let cursorY = 48;

  // ══════════════════════════════════════════════════════════
  // BLOQUE DE DATOS DEL PACIENTE
  // ══════════════════════════════════════════════════════════
  // Título de sección
  doc.setFillColor(...VIOLET);
  doc.roundedRect(margin, cursorY, contentW, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('DATOS DEL PACIENTE', margin + 3, cursorY + 4.8);
  cursorY += 10;

  // Caja de datos
  doc.setDrawColor(200, 200, 220);
  doc.setFillColor(250, 249, 255);
  doc.roundedRect(margin, cursorY, contentW, 52, 2, 2, 'FD');

  const col1X = margin + 4;
  const col2X = margin + contentW / 2 + 2;
  const labelColor = [...SLATE_MID];
  const valueColor = [...SLATE_DARK];

  const drawField = (label, value, x, y) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...labelColor);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...valueColor);
    doc.text(String(value || '—'), x, y + 4.5);
  };

  const edadCalculada = paciente?.fecha_nacimiento
    ? calcularEdad(paciente.fecha_nacimiento)
    : (paciente?.edad ? String(paciente.edad) : '—');

  const row1Y = cursorY + 8;
  const row2Y = cursorY + 22;
  const row3Y = cursorY + 36;

  drawField('Nombre del paciente', nombrePaciente, col1X, row1Y);
  drawField('Tutor / Propietario', paciente?.tutor || '—', col2X, row1Y);

  drawField('Especie', paciente?.especie || '—', col1X, row2Y);
  drawField('Raza', paciente?.raza || '—', col2X, row2Y);

  drawField('Peso', paciente?.peso ? `${paciente.peso} kg` : '—', col1X, row3Y);
  drawField('Edad', edadCalculada, col2X, row3Y);

  // Segunda fila de datos (ID expediente, fecha/hora, motivo)
  cursorY += 55;

  // Fila adicional: ID expediente + fecha/hora
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, cursorY, contentW, 14, 2, 2, 'FD');
  drawField('ID de Expediente', `#${expedienteId}`, col1X, cursorY + 5);
  drawField('Fecha y hora de finalización', `${fechaHoy}  ${horaHoy}`, col2X, cursorY + 5);
  cursorY += 17;

  // Motivo de consulta
  const motivo = consulta?.motivo_consulta || '—';
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, cursorY, contentW, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...labelColor);
  doc.text('MOTIVO DE CONSULTA', col1X, cursorY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...valueColor);
  const motivoLines = doc.splitTextToSize(motivo, contentW - 8);
  doc.text(motivoLines[0] || '—', col1X, cursorY + 10);
  cursorY += 18;

  // ══════════════════════════════════════════════════════════
  // TABLA PRINCIPAL DE SERVICIOS (agrupada por categoría)
  // ══════════════════════════════════════════════════════════
  cursorY += 3;
  doc.setFillColor(...VIOLET);
  doc.roundedRect(margin, cursorY, contentW, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('SERVICIOS PRESTADOS', margin + 3, cursorY + 4.8);
  cursorY += 10;

  // Agrupar servicios seleccionados por categoría (respetando el orden del catálogo)
  const serviciosPorCategoria = catalogo.reduce((acc, cat) => {
    const selEnCat = cat.servicios.filter((s) =>
      serviciosSeleccionados.some((sel) => sel.id === s.id)
    );
    if (selEnCat.length > 0) {
      acc.push({ categoria: cat.categoria, servicios: selEnCat });
    }
    return acc;
  }, []);

  // Construir filas para autoTable
  const tableBody = [];
  serviciosPorCategoria.forEach(({ categoria, servicios }) => {
    // Fila de categoría (encabezado de grupo)
    tableBody.push([
      { content: categoria.toUpperCase(), colSpan: 2, styles: { fontStyle: 'bold', fillColor: [237, 233, 254], textColor: [...VIOLET], fontSize: 7.5 } },
    ]);
    servicios.forEach((s) => {
      tableBody.push([
        { content: s.nombre, styles: { fontSize: 8, textColor: [...SLATE_DARK] } },
        {
          content: fmt(s.precio),
          styles: { fontSize: 8, halign: 'right', textColor: [...SLATE_DARK], fontStyle: 'bold' },
        },
      ]);
    });
  });

  if (tableBody.length === 0) {
    tableBody.push([
      { content: 'Sin servicios seleccionados', colSpan: 2, styles: { halign: 'center', textColor: [...SLATE_MID], fontSize: 8 } },
    ]);
  }

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [
      [
        { content: 'Concepto', styles: { halign: 'left', fillColor: [...VIOLET], textColor: [...WHITE], fontStyle: 'bold', fontSize: 8.5 } },
        { content: 'Por cobrar', styles: { halign: 'right', fillColor: [...VIOLET], textColor: [...WHITE], fontStyle: 'bold', fontSize: 8.5 } },
      ],
    ],
    body: tableBody,
    columnStyles: {
      0: { cellWidth: contentW * 0.72 },
      1: { cellWidth: contentW * 0.28 },
    },
    styles: {
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      lineColor: [220, 215, 240],
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: [250, 249, 255] },
    tableLineColor: [200, 195, 230],
    tableLineWidth: 0.3,
  });

  cursorY = doc.lastAutoTable.finalY + 5;

  // ══════════════════════════════════════════════════════════
  // SECCIÓN DE CIERRE — TOTAL A COBRAR
  // ══════════════════════════════════════════════════════════
  doc.setFillColor(...VIOLET);
  doc.roundedRect(margin, cursorY, contentW, 16, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text('TOTAL A COBRAR', margin + 5, cursorY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(253, 240, 255);
  doc.text(fmt(total), pageW - margin - 5, cursorY + 9, { align: 'right' });

  cursorY += 22;

  // ══════════════════════════════════════════════════════════
  // LÍNEAS DE FIRMA
  // ══════════════════════════════════════════════════════════
  // Verificar espacio disponible en la página
  const pageH = doc.internal.pageSize.getHeight();
  if (cursorY + 45 > pageH - 15) {
    doc.addPage();
    cursorY = 20;
  }

  cursorY += 5;
  doc.setFillColor(...VIOLET);
  doc.roundedRect(margin, cursorY, contentW, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('FIRMAS DE CONFORMIDAD', margin + 3, cursorY + 4.8);
  cursorY += 12;

  const firmaW = (contentW - 10) / 2;
  const firmaH = 28;

  // Bloque firma 1 — Médico tratante
  doc.setDrawColor(...VIOLET);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, cursorY, firmaW, firmaH, 2, 2, 'D');

  doc.setDrawColor(180, 170, 220);
  doc.setLineWidth(0.5);
  doc.line(margin + 5, cursorY + 18, margin + firmaW - 5, cursorY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...VIOLET);
  doc.text('Nombre y firma del médico tratante', margin + firmaW / 2, cursorY + 23, { align: 'center' });

  // Bloque firma 2 — Ejecutivo de servicio
  const firma2X = margin + firmaW + 10;
  doc.setDrawColor(...VIOLET);
  doc.setLineWidth(0.4);
  doc.roundedRect(firma2X, cursorY, firmaW, firmaH, 2, 2, 'D');

  doc.setDrawColor(180, 170, 220);
  doc.setLineWidth(0.5);
  doc.line(firma2X + 5, cursorY + 18, firma2X + firmaW - 5, cursorY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...VIOLET);
  doc.text('Nombre y firma del ejecutivo', firma2X + firmaW / 2, cursorY + 22, { align: 'center' });
  doc.text('de servicio al cliente', firma2X + firmaW / 2, cursorY + 26.5, { align: 'center' });

  cursorY += firmaH + 8;

  // ── Pie de página ──
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...SLATE_MID);
  doc.text(
    'Este documento es un comprobante oficial de servicios veterinarios. Clínica Veterinaria ANA — FORM-030 Rev. C',
    pageW / 2,
    pageH - 8,
    { align: 'center' }
  );

  // ── Nombre del archivo ──
  const fechaArchivo = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const nombreArchivo = `recibo_${nombrePaciente.replace(/\s+/g, '_').toLowerCase()}_${fechaArchivo}.pdf`;

  doc.save(nombreArchivo);
};

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
export default function Recibo() {
  const { pacienteId, expedienteId } = useParams();
  const navigate = useNavigate();

  // Datos del paciente / expediente
  const [paciente, setPaciente] = useState(null);
  const [expediente, setExpediente] = useState(null); // eslint-disable-line no-unused-vars
  const [consulta, setConsulta] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Catálogo de servicios cargado desde la BD
  const [catalogo, setCatalogo] = useState([]); // [{ categoria, servicios: [{ id, nombre, precio }] }]
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState(null);

  // Servicios seleccionados: { [id]: true/false }
  const [seleccionados, setSeleccionados] = useState({});

  // Estado de guardado
  const [guardando, setGuardando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok'|'error', texto }

  // ── Carga del catálogo desde la BD ────────────────────────
  useEffect(() => {
    const cargarCatalogo = async () => {
      setLoadingCatalogo(true);
      setErrorCatalogo(null);
      try {
        // Servicios del catálogo + productos del inventario (POS, Fase 3.4).
        // Los productos llevan producto_id: al finalizar el recibo el
        // backend descuenta su stock automáticamente.
        const [servicios, productos] = await Promise.all([
          serviciosCatalogoService.listar(),
          inventarioService.listarProductos().catch(() => []),
        ]);

        // La API devuelve un array plano: [{ id, categoria, nombre, precio, ... }]
        // Agrupamos por categoría para mantener la estructura del componente
        const agrupado = servicios.reduce((acc, srv) => {
          const cat = acc.find((c) => c.categoria === srv.categoria);
          // id compuesto: servicios y productos comparten el espacio de selección
          const item = { id: `srv-${srv.id}`, servicio_id: srv.id, nombre: srv.nombre, precio: Number(srv.precio) };
          if (cat) {
            cat.servicios.push(item);
          } else {
            acc.push({ categoria: srv.categoria, servicios: [item] });
          }
          return acc;
        }, []);

        // Los productos del inventario entran como su propia categoría
        const conStock = (productos || []).filter((p) => Number(p.stock) > 0);
        if (conStock.length > 0) {
          agrupado.push({
            categoria: '📦 Productos (inventario)',
            servicios: conStock.map((p) => ({
              id: `prod-${p.id}`,
              producto_id: p.id,
              nombre: p.nombre,
              precio: Number(p.precio),
              stock: Number(p.stock),
              unidad: p.unidad,
            })),
          });
        }

        setCatalogo(agrupado);
      } catch (err) {
        console.error('Error cargando catálogo de servicios:', err);
        setErrorCatalogo('No se pudo cargar el catálogo de servicios.');
      } finally {
        setLoadingCatalogo(false);
      }
    };
    cargarCatalogo();
  }, []);

  // ── Carga inicial ──────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        const [datosPaciente, expedientesPaciente] = await Promise.all([
          pacientesService.obtener(pacienteId),
          expedientesService.listarPorPaciente(pacienteId),
        ]);
        setPaciente(datosPaciente);

        const expEncontrado = expedientesPaciente.find(
          (e) => String(e.id) === String(expedienteId)
        );
        setExpediente(expEncontrado || null);

        // Última consulta del expediente (para el motivo); no es crítica
        try {
          const consultasExp = await consultasService.listarPorExpediente(expedienteId);
          if (consultasExp?.length > 0) {
            setConsulta(consultasExp[consultasExp.length - 1]);
          }
        } catch {
          // No hay consultas, no es error crítico
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoadingData(false);
      }
    };
    cargar();
  }, [pacienteId, expedienteId]);

  // ── Servicios seleccionados (lista plana) ──────────────────
  const serviciosSeleccionados = catalogo.flatMap((cat) =>
    cat.servicios.filter((s) => seleccionados[s.id])
  );

  const total = serviciosSeleccionados.reduce((acc, s) => acc + s.precio, 0);

  // ── Toggle checkbox ────────────────────────────────────────
  const toggleServicio = useCallback((id) => {
    setSeleccionados((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // ── Construir payload ──────────────────────────────────────
  // El backend POST /api/recibos espera:
  //   { paciente_id, expediente_id, fecha, motivo_consulta?, items: [{ nombre_servicio, precio_unitario, cantidad }] }
  // El campo "status" se fija siempre en 'borrador' en el INSERT; para finalizar
  // se debe usar PUT /api/recibos/:id con { status: 'finalizado' }.
  // Aquí enviamos todo en el body (sin parámetros en la URL).
  const buildPayload = () => ({
    paciente_id: Number(pacienteId),
    expediente_id: Number(expedienteId),
    fecha: new Date().toISOString().slice(0, 10), // formato YYYY-MM-DD que acepta MySQL
    motivo_consulta: consulta?.motivo || consulta?.motivo_consulta || null,
    items: serviciosSeleccionados.map((s) => ({
      nombre_servicio: s.nombre,
      precio_unitario: s.precio,
      cantidad: 1,
      // Uno u otro: los productos descuentan stock al finalizar (POS)
      servicio_id: s.servicio_id ?? null,
      producto_id: s.producto_id ?? null,
    })),
  });

  // ── Guardar borrador ───────────────────────────────────────
  // POST /api/recibos  →  crea siempre con status 'borrador'
  const guardarBorrador = async () => {
    if (serviciosSeleccionados.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agrega al menos un servicio antes de guardar.' });
      return;
    }
    setGuardando(true);
    setMensaje(null);
    try {
      await recibosService.crear(buildPayload());
      setMensaje({ tipo: 'ok', texto: 'Borrador guardado correctamente.' });
    } catch (err) {
      const detalle = err?.response?.data?.error || 'Error al guardar el borrador.';
      setMensaje({ tipo: 'error', texto: detalle });
    } finally {
      setGuardando(false);
    }
  };

  // ── Finalizar recibo ───────────────────────────────────────
  // 1) POST /api/recibos  →  crea el recibo (status: borrador)
  // 2) PUT  /api/recibos/:id  →  cambia status a 'finalizado'
  const finalizarRecibo = async () => {
    if (serviciosSeleccionados.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agrega al menos un servicio antes de finalizar.' });
      return;
    }
    setFinalizando(true);
    setMensaje(null);
    try {
      // Paso 1: crear el recibo
      const { recibo_id: reciboId } = await recibosService.crear(buildPayload());

      // Paso 2: marcarlo como finalizado
      await recibosService.actualizar(reciboId, { status: 'finalizado' });

      setMensaje({ tipo: 'ok', texto: '¡Recibo finalizado exitosamente!' });
    } catch (err) {
      const detalle = err?.response?.data?.error || 'Error al finalizar el recibo.';
      setMensaje({ tipo: 'error', texto: detalle });
    } finally {
      setFinalizando(false);
    }
  };

  // ── Exportar PDF ───────────────────────────────────────────
  const exportarPDF = () => {
    generarPDF({ paciente, expedienteId, consulta, serviciosSeleccionados, total, catalogo });
  };

  // ── Render ─────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
      </div>
    );
  }

  const especie = paciente?.especie || '';
  const emoji =
    especie === 'Perro' ? '🐕' :
    especie === 'Gato' ? '🐈' :
    especie === 'Conejo' ? '🐇' :
    especie === 'Ave' ? '🦜' :
    especie === 'Reptil' ? '🦎' :
    especie === 'Caballo' ? '🐴' : '🐾';

  return (
    <div className="animate-fade-in">
      {/* ── Back ── */}
      <button
        onClick={() => navigate(`/expediente/${pacienteId}`)}
        className="back-link mb-4"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver al Expediente
      </button>

      {/* ── Título ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            🧾 Recibo de Servicios
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Expediente #{expedienteId} · {paciente?.nombre}
          </p>
        </div>

        {/* ── Botón Exportar PDF ── */}
        <button
          onClick={exportarPDF}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold transition-colors shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        >
          📄 Exportar PDF
        </button>
      </div>

      {/* ── Mensaje de estado ── */}
      {mensaje && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}
        >
          {mensaje.tipo === 'ok' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      {/* ── Layout de dos columnas ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ════════════════════════════════════════════════════
            COLUMNA IZQUIERDA — Checklist de servicios
        ════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Selecciona los servicios
          </h2>

          {loadingCatalogo ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
            </div>
          ) : errorCatalogo ? (
            <div className="px-4 py-3 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
              ❌ {errorCatalogo}
            </div>
          ) : catalogo.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
              No hay servicios en el catálogo.
            </p>
          ) : null}

          {catalogo.map((cat) => (
            <div
              key={cat.categoria}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
            >
              {/* Cabecera de categoría */}
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {cat.categoria}
                </h3>
              </div>

              {/* Servicios */}
              <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {cat.servicios.map((srv) => (
                  <li key={srv.id}>
                    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={!!seleccionados[srv.id]}
                        onChange={() => toggleServicio(srv.id)}
                        className="w-4 h-4 rounded accent-violet-600 cursor-pointer flex-shrink-0"
                      />
                      <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                        {srv.nombre}
                        {srv.producto_id && (
                          <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                            · {srv.stock} {srv.unidad || 'uds'} en stock
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {fmt(srv.precio)}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════
            COLUMNA DERECHA — Resumen del recibo
        ════════════════════════════════════════════════════ */}
        <div className="xl:sticky xl:top-6 self-start space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Resumen del recibo
          </h2>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

            {/* ── Datos del paciente ── */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xl flex-shrink-0">
                  {emoji}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {paciente?.nombre || '—'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tutor: {paciente?.tutor || '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Especie</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{paciente?.especie || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Raza</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{paciente?.raza || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Peso</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {paciente?.peso ? `${paciente.peso} kg` : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Edad</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {paciente?.edad ? `${paciente.edad}` : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Fecha</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{hoy()}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Expediente</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">#{expedienteId}</p>
                </div>
              </div>

              {/* Motivo de consulta */}
              {consulta?.motivo_consulta && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">
                    Motivo de consulta
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {consulta.motivo_consulta}
                  </p>
                </div>
              )}
            </div>

            {/* ── Lista de servicios seleccionados ── */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 min-h-[120px]">
              {serviciosSeleccionados.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                  Sin servicios seleccionados
                </p>
              ) : (
                <ul className="space-y-2">
                  {serviciosSeleccionados.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 leading-tight">
                        {s.nombre}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums flex-shrink-0">
                        {fmt(s.precio)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── Subtotal ── */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Subtotal ({serviciosSeleccionados.length} servicio{serviciosSeleccionados.length !== 1 ? 's' : ''})
              </span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                {fmt(total)}
              </span>
            </div>

            {/* ── TOTAL A COBRAR ── */}
            <div className="px-5 py-5 bg-violet-50 dark:bg-violet-900/20">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                  Total a cobrar
                </span>
                <span className="text-3xl font-extrabold text-violet-700 dark:text-violet-300 tabular-nums">
                  {fmt(total)}
                </span>
              </div>
            </div>

            {/* ── Botones ── */}
            <div className="px-5 py-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={guardarBorrador}
                disabled={guardando || finalizando}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardando ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500" />
                    Guardando...
                  </>
                ) : (
                  <>💾 Guardar borrador</>
                )}
              </button>

              <button
                onClick={finalizarRecibo}
                disabled={guardando || finalizando || serviciosSeleccionados.length === 0}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {finalizando ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Finalizando...
                  </>
                ) : (
                  <>✅ Finalizar recibo</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

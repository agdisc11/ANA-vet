import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Modal } from './ui';
import { useToast } from '../context/ToastContext';
import { carnetService, urlCarnet } from '../services/carnetService';
import { mensajeError } from '../lib/queryClient';

/**
 * Modal para compartir el carnet de vacunación (Fase 3.5).
 * Genera el enlace público, su QR (imprimible) y ofrece copiarlo o
 * mandarlo por WhatsApp. Permite revocar el enlace anterior.
 */
export default function CarnetCompartir({ open, onClose, pacienteId, pacienteNombre }) {
  const toast = useToast();
  const [token, setToken] = useState(null);
  const [qr, setQr] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!open || !pacienteId) return;
    let activo = true;
    setCargando(true);
    carnetService.obtenerEnlace(pacienteId)
      .then(({ token }) => { if (activo) setToken(token); })
      .catch((e) => { if (activo) toast.error(mensajeError(e, 'No se pudo generar el carnet')); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [open, pacienteId, toast]);

  // El QR se regenera cada vez que cambia el token
  useEffect(() => {
    if (!token) { setQr(null); return; }
    QRCode.toDataURL(urlCarnet(token), { width: 320, margin: 1, color: { dark: '#1e293b', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [token]);

  const enlace = token ? urlCarnet(token) : '';

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const compartirWhatsApp = () => {
    const texto = encodeURIComponent(
      `Aquí está el carnet de vacunación digital de ${pacienteNombre}:\n${enlace}`
    );
    window.open(`https://wa.me/?text=${texto}`, '_blank', 'noopener');
  };

  const regenerar = async () => {
    try {
      const { token: nuevo } = await carnetService.regenerar(pacienteId);
      setToken(nuevo);
      toast.success('Enlace anterior revocado');
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo regenerar el enlace'));
    }
  };

  const imprimir = () => {
    if (!qr) return;
    const ventana = window.open('', '_blank');
    if (!ventana) return;
    ventana.document.write(`
      <html><head><title>Carnet de ${pacienteNombre}</title></head>
      <body style="font-family:system-ui;text-align:center;padding:40px">
        <h2 style="margin-bottom:4px">${pacienteNombre}</h2>
        <p style="color:#64748b;font-size:14px;margin-top:0">Carnet de vacunación digital</p>
        <img src="${qr}" style="width:280px;height:280px" />
        <p style="color:#94a3b8;font-size:11px;word-break:break-all">${enlace}</p>
      </body></html>
    `);
    ventana.document.close();
    ventana.print();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Carnet de vacunación digital"
      maxWidth="max-w-sm"
      footer={
        <>
          <button onClick={copiar} disabled={!token} className="btn-secondary flex-1">Copiar</button>
          <button
            onClick={compartirWhatsApp}
            disabled={!token}
            className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            WhatsApp
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Comparte este código con el tutor de <strong className="text-slate-700 dark:text-slate-300">{pacienteNombre}</strong>.
        Podrá ver las vacunas desde su celular, sin cuenta ni contraseña.
      </p>

      <div className="flex flex-col items-center">
        {cargando || !qr ? (
          <div className="w-[220px] h-[220px] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ) : (
          <img src={qr} alt={`Código QR del carnet de ${pacienteNombre}`} className="w-[220px] h-[220px] rounded-xl border border-slate-200 dark:border-slate-700" />
        )}

        {token && (
          <p className="mt-3 w-full text-center text-[11px] text-slate-400 dark:text-slate-500 break-all font-mono">
            {enlace}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <button onClick={imprimir} disabled={!qr} className="text-violet-600 dark:text-violet-400 font-semibold hover:underline disabled:opacity-40">
          🖨️ Imprimir QR
        </button>
        <button onClick={regenerar} disabled={!token} className="text-slate-400 hover:text-red-500 font-medium disabled:opacity-40">
          Revocar y generar nuevo
        </button>
      </div>
    </Modal>
  );
}

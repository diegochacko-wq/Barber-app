'use client';

import { useEffect, useState } from 'react';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const CAMPOS_TEXTO: { key: string; label: string; placeholder?: string }[] = [
  { key: 'direccion', label: 'Dirección', placeholder: 'Calle 123, Ciudad' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '5491112345678' },
  { key: 'email', label: 'Email' },
  { key: 'instagram', label: 'Instagram', placeholder: '@minegocio' },
  { key: 'facebook', label: 'Facebook', placeholder: 'facebook.com/minegocio' },
  { key: 'tiktok', label: 'TikTok', placeholder: '@minegocio' },
  { key: 'sitio_web', label: 'Sitio web', placeholder: 'https://...' },
];

interface Horario {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

function horariosPorDefecto(): Horario[] {
  return DIAS.map((_, i) => ({
    dia_semana: i,
    hora_inicio: '09:00',
    hora_fin: '18:00',
    activo: i >= 1 && i <= 6,
  }));
}

function reducirImagen(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function NegocioForm({
  slug,
  negocio,
  onSaved,
}: {
  slug: string;
  negocio: any;
  onSaved: (negocio: any) => void;
}) {
  const [datos, setDatos] = useState<Record<string, string>>({
    nombre: negocio.nombre ?? '',
    logo_url: negocio.logo_url ?? '',
    ...Object.fromEntries(CAMPOS_TEXTO.map((c) => [c.key, negocio[c.key] ?? ''])),
  });
  const [horarios, setHorarios] = useState<Horario[]>(horariosPorDefecto());
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    fetch(`/api/negocio/${slug}/horarios`)
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d.horarios) || d.horarios.length === 0) return;
        const base = horariosPorDefecto().map((h) => ({ ...h, activo: false }));
        for (const h of d.horarios) {
          base[h.dia_semana] = {
            dia_semana: h.dia_semana,
            hora_inicio: String(h.hora_inicio).slice(0, 5),
            hora_fin: String(h.hora_fin).slice(0, 5),
            activo: !!h.activo,
          };
        }
        setHorarios(base);
      })
      .catch(console.error);
  }, [slug]);

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await reducirImagen(file);
      setDatos((d) => ({ ...d, logo_url: dataUrl }));
    } catch {
      setMensaje('No se pudo procesar la imagen');
    }
  }

  function cambiarHorario(i: number, cambios: Partial<Horario>) {
    setHorarios((hs) => hs.map((h, idx) => (idx === i ? { ...h, ...cambios } : h)));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');
    try {
      const resNegocio = await fetch(`/api/negocio/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const dataNegocio = await resNegocio.json();
      if (!resNegocio.ok) throw new Error(dataNegocio.error || 'Error al guardar los datos');

      const resHorarios = await fetch(`/api/negocio/${slug}/horarios`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horarios }),
      });
      if (!resHorarios.ok) throw new Error('Error al guardar los horarios');

      onSaved(dataNegocio.negocio);
      setMensaje('¡Datos guardados con éxito!');
    } catch (err: any) {
      setMensaje(err.message || 'Error de conexión');
    } finally {
      setGuardando(false);
    }
  }

  const input =
    'w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500';
  const label = 'block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2';

  return (
    <form onSubmit={guardar} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6">
      <h2 className="text-lg font-bold text-neutral-200">Datos del Negocio</h2>

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center">
          {datos.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={datos.logo_url} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <span className="text-xs text-neutral-600">Sin logo</span>
          )}
        </div>
        <div className="space-y-2">
          <input type="file" accept="image/*" onChange={onLogo} className="text-xs text-neutral-400" />
          {datos.logo_url && (
            <button
              type="button"
              onClick={() => setDatos((d) => ({ ...d, logo_url: '' }))}
              className="block text-xs text-red-400 hover:text-red-300"
            >
              Quitar logo
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={label}>Nombre del negocio</label>
          <input
            className={input}
            value={datos.nombre}
            onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
            required
          />
        </div>
        {CAMPOS_TEXTO.map((c) => (
          <div key={c.key}>
            <label className={label}>{c.label}</label>
            <input
              className={input}
              placeholder={c.placeholder}
              value={datos[c.key]}
              onChange={(e) => setDatos({ ...datos, [c.key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-neutral-300">Días y horarios de atención</h3>
        {horarios.map((h, i) => (
          <div key={h.dia_semana} className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2 w-32">
              <input
                type="checkbox"
                checked={h.activo}
                onChange={(e) => cambiarHorario(i, { activo: e.target.checked })}
              />
              <span className={h.activo ? 'text-white' : 'text-neutral-500'}>{DIAS[h.dia_semana]}</span>
            </label>
            <input
              type="time"
              value={h.hora_inicio}
              disabled={!h.activo}
              onChange={(e) => cambiarHorario(i, { hora_inicio: e.target.value })}
              className="px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white disabled:opacity-40"
            />
            <span className="text-neutral-500">a</span>
            <input
              type="time"
              value={h.hora_fin}
              disabled={!h.activo}
              onChange={(e) => cambiarHorario(i, { hora_fin: e.target.value })}
              className="px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white disabled:opacity-40"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={guardando}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl"
        >
          {guardando ? 'Guardando...' : 'Guardar datos del negocio'}
        </button>
        {mensaje && (
          <span className={`text-xs ${mensaje.includes('éxito') ? 'text-emerald-400' : 'text-red-400'}`}>
            {mensaje}
          </span>
        )}
      </div>
    </form>
  );
}
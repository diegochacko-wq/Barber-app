'use client';

import { useEffect, useState } from 'react';

interface Servicio {
  id: string;
  nombre: string;
  duracion_minutos: number;
  precio: string | number;
  activo: boolean;
  dias_recordatorio: number | null;
}

const input =
  'w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500';

function Fila({
  slug,
  servicio,
  onGuardado,
  onMensaje,
}: {
  slug: string;
  servicio: Servicio;
  onGuardado: (s: Servicio) => void;
  onMensaje: (m: string) => void;
}) {
  const [f, setF] = useState({
    nombre: servicio.nombre,
    duracion: String(servicio.duracion_minutos),
    precio: String(servicio.precio ?? ''),
    dias: servicio.dias_recordatorio ? String(servicio.dias_recordatorio) : '',
  });
  const [guardando, setGuardando] = useState(false);

  async function guardar(activo: boolean) {
    setGuardando(true);
    try {
      const res = await fetch(`/api/admin/${slug}/servicios/${servicio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: f.nombre,
          duracion_minutos: Number(f.duracion),
          precio: f.precio,
          dias_recordatorio: f.dias,
          activo,
        }),
      });
      if (res.status === 401) {
        window.location.href = `/admin/${slug}/login`;
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar');
      onGuardado(data.servicio);
      onMensaje('Servicio guardado');
    } catch (e: any) {
      onMensaje(e.message || 'Error de conexión');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-12 gap-2 items-center ${servicio.activo ? '' : 'opacity-50'}`}>
      <input
        className={`${input} col-span-2 md:col-span-4`}
        value={f.nombre}
        onChange={(e) => setF({ ...f, nombre: e.target.value })}
      />
      <input
        className={`${input} md:col-span-2`}
        type="number"
        min={5}
        value={f.duracion}
        onChange={(e) => setF({ ...f, duracion: e.target.value })}
      />
      <input
        className={`${input} md:col-span-2`}
        type="number"
        min={0}
        value={f.precio}
        onChange={(e) => setF({ ...f, precio: e.target.value })}
      />
      <input
        className={`${input} md:col-span-2`}
        type="number"
        min={1}
        placeholder="—"
        value={f.dias}
        onChange={(e) => setF({ ...f, dias: e.target.value })}
      />
      <div className="col-span-2 md:col-span-2 flex gap-2">
        <button
          type="button"
          disabled={guardando}
          onClick={() => guardar(servicio.activo)}
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
        >
          Guardar
        </button>
        <button
          type="button"
          disabled={guardando}
          onClick={() => guardar(!servicio.activo)}
          className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-300 text-xs rounded-lg"
        >
          {servicio.activo ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  );
}

export default function ServiciosPanel({ slug }: { slug: string }) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [nuevo, setNuevo] = useState({ nombre: '', duracion: '30', precio: '', dias: '' });
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/${slug}/servicios`)
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = `/admin/${slug}/login`;
          return;
        }
        const data = await res.json();
        if (data.servicios) setServicios(data.servicios);
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [slug]);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setAgregando(true);
    setMensaje('');
    try {
      const res = await fetch(`/api/admin/${slug}/servicios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevo.nombre,
          duracion_minutos: Number(nuevo.duracion),
          precio: nuevo.precio,
          dias_recordatorio: nuevo.dias,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo agregar');
      setServicios((s) => [...s, data.servicio]);
      setNuevo({ nombre: '', duracion: '30', precio: '', dias: '' });
      setMensaje('Servicio agregado');
    } catch (err: any) {
      setMensaje(err.message || 'Error de conexión');
    } finally {
      setAgregando(false);
    }
  }

  function reemplazar(actualizado: Servicio) {
    setServicios((lista) => lista.map((s) => (s.id === actualizado.id ? actualizado : s)));
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div>
        <h2 className="text-lg font-bold text-neutral-200">Servicios y Precios</h2>
        <p className="text-xs text-neutral-500">
          Los servicios desactivados no aparecen en la reserva, pero se conservan en el historial.
        </p>
      </div>

      <div className="hidden md:grid grid-cols-12 gap-2 text-xs uppercase tracking-wider text-neutral-500">
        <span className="col-span-4">Servicio</span>
        <span className="col-span-2">Minutos</span>
        <span className="col-span-2">Precio ($)</span>
        <span className="col-span-2">Recordar (días)</span>
      </div>

      {cargando ? (
        <p className="text-sm text-neutral-500">Cargando servicios...</p>
      ) : servicios.length === 0 ? (
        <p className="text-sm text-neutral-500 italic">Todavía no cargaste servicios.</p>
      ) : (
        <div className="space-y-3">
          {servicios.map((s) => (
            <Fila key={s.id} slug={slug} servicio={s} onGuardado={reemplazar} onMensaje={setMensaje} />
          ))}
        </div>
      )}

      <form onSubmit={agregar} className="grid grid-cols-2 md:grid-cols-12 gap-2 items-center border-t border-neutral-800 pt-4">
        <input
          className={`${input} col-span-2 md:col-span-4`}
          placeholder="Nuevo servicio (ej: Corte clásico)"
          value={nuevo.nombre}
          onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
          required
        />
        <input
          className={`${input} md:col-span-2`}
          type="number"
          min={5}
          placeholder="Minutos"
          value={nuevo.duracion}
          onChange={(e) => setNuevo({ ...nuevo, duracion: e.target.value })}
          required
        />
        <input
          className={`${input} md:col-span-2`}
          type="number"
          min={0}
          placeholder="Precio"
          value={nuevo.precio}
          onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })}
          required
        />
        <input
          className={`${input} md:col-span-2`}
          type="number"
          min={1}
          placeholder="Recordar (días)"
          value={nuevo.dias}
          onChange={(e) => setNuevo({ ...nuevo, dias: e.target.value })}
        />
        <button
          type="submit"
          disabled={agregando}
          className="col-span-2 md:col-span-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
        >
          {agregando ? 'Agregando...' : '+ Agregar'}
        </button>
      </form>

      {mensaje && (
        <p className={`text-xs ${/guardado|agregado/i.test(mensaje) ? 'text-emerald-400' : 'text-red-400'}`}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
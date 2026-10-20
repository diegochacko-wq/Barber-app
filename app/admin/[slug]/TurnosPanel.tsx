'use client';

import { useEffect, useState } from 'react';

interface Extra {
  nombre: string;
  precio: number;
}

interface Turno {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string | null;
  fecha_hora_inicio: string;
  estado: string;
  servicio_nombre: string | null;
  servicio_precio: string | number | null;
  extras: Extra[] | null;
}

interface ServicioOpcion {
  id: string;
  nombre: string;
  precio: string | number;
  activo: boolean;
}

const ESTADOS: Record<string, { texto: string; clase: string }> = {
  confirmado: { texto: 'Pendiente', clase: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  asistio: { texto: 'Vino', clase: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  no_asistio: { texto: 'No vino', clase: 'bg-red-500/10 text-red-400 border-red-500/20' },
  cancelado_cliente: { texto: 'Canceló el cliente', clase: 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20' },
  cancelado_negocio: { texto: 'Cancelado por el local', clase: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
};

function waLink(telefono: string | null, texto: string): string | null {
  if (!telefono) return null;
  let d = telefono.replace(/\D/g, '').replace(/^0+/, '');
  if (!d) return null;
  if (!d.startsWith('54')) d = '549' + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`;
}

function mensajeCancelacion(t: Turno, negocio: string): string {
  const f = new Date(t.fecha_hora_inicio);
  const dia = f.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hora = f.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `Hola ${t.cliente_nombre}, te escribimos de ${negocio}. Lamentablemente tuvimos que cancelar tu turno del ${dia} a las ${hora} hs. Disculpá las molestias, ¿querés que lo reprogramemos?`;
}

function total(t: Turno): number {
  const base = Number(t.servicio_precio) || 0;
  const extras = (t.extras ?? []).reduce((acc, e) => acc + (Number(e.precio) || 0), 0);
  return base + extras;
}

const btn = 'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors';

export default function TurnosPanel({ slug, negocioNombre }: { slug: string; negocioNombre: string }) {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [servicios, setServicios] = useState<ServicioOpcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<'pendientes' | 'historial'>('pendientes');
  const [error, setError] = useState('');
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [textoCancel, setTextoCancel] = useState('');
  const [extraAbiertoId, setExtraAbiertoId] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        const [resT, resS] = await Promise.all([
          fetch(`/api/admin/${slug}/turnos`),
          fetch(`/api/admin/${slug}/servicios`),
        ]);
        if (resT.status === 401 || resS.status === 401) {
          window.location.href = `/admin/${slug}/login`;
          return;
        }
        const dataT = await resT.json();
        const dataS = await resS.json();
        if (dataT.turnos) setTurnos(dataT.turnos);
        if (dataS.servicios) setServicios(dataS.servicios.filter((s: ServicioOpcion) => s.activo));
      } catch (e) {
        console.error(e);
        setError('No se pudieron cargar los turnos');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [slug]);

  async function actualizar(id: string, cambios: { estado?: string; extras?: Extra[] }) {
    setError('');
    try {
      const res = await fetch(`/api/admin/${slug}/turnos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios),
      });
      if (res.status === 401) {
        window.location.href = `/admin/${slug}/login`;
        return false;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo actualizar el turno');
        return false;
      }
      setTurnos((ts) =>
        ts.map((t) => (t.id === id ? { ...t, estado: data.turno.estado, extras: data.turno.extras ?? [] } : t))
      );
      return true;
    } catch {
      setError('Error de conexión');
      return false;
    }
  }

  function agregarExtra(t: Turno, servicioId: string) {
    const s = servicios.find((x) => x.id === servicioId);
    if (!s) return;
    const extras = [...(t.extras ?? []), { nombre: s.nombre, precio: Number(s.precio) || 0 }];
    actualizar(t.id, { extras });
    setExtraAbiertoId(null);
  }

  function quitarExtra(t: Turno, indice: number) {
    const extras = (t.extras ?? []).filter((_, i) => i !== indice);
    actualizar(t.id, { extras });
  }

  const pendientes = turnos.filter((t) => t.estado === 'confirmado').reverse();
  const historial = turnos.filter((t) => t.estado !== 'confirmado');
  const lista = vista === 'pendientes' ? pendientes : historial;
  const ahora = new Date();

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-200">Turnos</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setVista('pendientes')}
            className={`${btn} ${vista === 'pendientes' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'border-neutral-700 text-neutral-400'}`}
          >
            Por atender ({pendientes.length})
          </button>
          <button
            type="button"
            onClick={() => setVista('historial')}
            className={`${btn} ${vista === 'historial' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'border-neutral-700 text-neutral-400'}`}
          >
            Historial ({historial.length})
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {cargando ? (
        <p className="text-sm text-neutral-500">Cargando turnos...</p>
      ) : lista.length === 0 ? (
        <p className="text-neutral-500 text-sm italic py-8 text-center">
          {vista === 'pendientes' ? 'No hay turnos por atender.' : 'Todavía no hay turnos en el historial.'}
        </p>
      ) : (
        <div className="space-y-3">
          {lista.map((t) => {
            const estado = ESTADOS[t.estado] ?? ESTADOS.confirmado;
            const fecha = new Date(t.fecha_hora_inicio);
            const sinRegistrar = t.estado === 'confirmado' && fecha < ahora;
            const link = waLink(t.cliente_telefono, textoCancel);

            return (
              <div key={t.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-white">{t.cliente_nombre}</p>
                    <p className="text-xs text-neutral-400">
                      {t.cliente_telefono || 'Sin teléfono'} · {t.servicio_nombre || 'Servicio'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-cyan-400 font-semibold">
                      {fecha.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })} hs
                    </p>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full border ${estado.clase}`}>
                      {estado.texto}
                    </span>
                    {sinRegistrar && <p className="text-xs text-amber-400 mt-1">Sin registrar</p>}
                  </div>
                </div>

                {(t.extras ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(t.extras ?? []).map((e, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 text-xs bg-neutral-900 border border-neutral-700 rounded-full text-neutral-300"
                      >
                        + {e.nombre} (${Number(e.precio).toLocaleString('es-AR')})
                        <button
                          type="button"
                          onClick={() => quitarExtra(t, i)}
                          className="ml-2 text-neutral-500 hover:text-red-400"
                          aria-label="Quitar extra"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {total(t) > 0 && (
                  <p className="text-xs text-neutral-400">
                    Total: <span className="text-emerald-400 font-semibold">${total(t).toLocaleString('es-AR')}</span>
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {t.estado === 'confirmado' && (
                    <>
                      <button
                        type="button"
                        onClick={() => actualizar(t.id, { estado: 'asistio' })}
                        className={`${btn} bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30`}
                      >
                        ✅ Vino
                      </button>
                      <button
                        type="button"
                        onClick={() => actualizar(t.id, { estado: 'no_asistio' })}
                        className={`${btn} bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20`}
                      >
                        ❌ No vino
                      </button>
                      <button
                        type="button"
                        onClick={() => actualizar(t.id, { estado: 'cancelado_cliente' })}
                        className={`${btn} border-neutral-700 text-neutral-300 hover:bg-neutral-800`}
                      >
                        🚫 Canceló el cliente
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCancelandoId(t.id);
                          setTextoCancel(mensajeCancelacion(t, negocioNombre));
                        }}
                        className={`${btn} bg-orange-600/10 border-orange-500/30 text-orange-300 hover:bg-orange-600/20`}
                      >
                        📩 Cancelé yo
                      </button>
                    </>
                  )}

                  {(t.estado === 'confirmado' || t.estado === 'asistio') && (
                    <button
                      type="button"
                      onClick={() => setExtraAbiertoId(extraAbiertoId === t.id ? null : t.id)}
                      className={`${btn} bg-cyan-600/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/20`}
                    >
                      ➕ Servicio extra
                    </button>
                  )}

                  {t.estado !== 'confirmado' && (
                    <button
                      type="button"
                      onClick={() => actualizar(t.id, { estado: 'confirmado' })}
                      className={`${btn} border-neutral-700 text-neutral-400 hover:bg-neutral-800`}
                    >
                      ↩ Volver a pendiente
                    </button>
                  )}
                </div>

                {extraAbiertoId === t.id && (
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && agregarExtra(t, e.target.value)}
                    className="w-full md:w-72 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white"
                  >
                    <option value="">Elegí un servicio...</option>
                    {servicios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} (${Number(s.precio).toLocaleString('es-AR')})
                      </option>
                    ))}
                  </select>
                )}

                {cancelandoId === t.id && (
                  <div className="space-y-3 border-t border-neutral-800 pt-3">
                    <label className="block text-xs text-neutral-400 uppercase tracking-wider">
                      Mensaje para el cliente
                    </label>
                    <textarea
                      value={textoCancel}
                      onChange={(e) => setTextoCancel(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            actualizar(t.id, { estado: 'cancelado_negocio' });
                            setCancelandoId(null);
                          }}
                          className={`${btn} bg-green-600/20 border-green-500/40 text-green-300 hover:bg-green-600/30`}
                        >
                          Cancelar y avisar por WhatsApp ↗
                        </a>
                      ) : (
                        <span className="text-xs text-neutral-500">El cliente no dejó teléfono, no se puede avisar.</span>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          if (await actualizar(t.id, { estado: 'cancelado_negocio' })) setCancelandoId(null);
                        }}
                        className={`${btn} border-neutral-700 text-neutral-300 hover:bg-neutral-800`}
                      >
                        Cancelar sin avisar
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelandoId(null)}
                        className={`${btn} border-transparent text-neutral-500 hover:text-neutral-300`}
                      >
                        Volver
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
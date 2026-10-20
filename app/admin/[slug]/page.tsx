'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

// Permitir renderizado dinámico en esta ruta
export const instant = false;

export default function AdminNegocioPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [negocio, setNegocio] = useState<any>(null);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Cargar datos del negocio y turnos al iniciar
  useEffect(() => {
    async function cargarDatos() {
      try {
        // Cargar negocio
        const resNegocio = await fetch(`/api/negocio/${slug}`);
        const dataNegocio = await resNegocio.json();
        if (dataNegocio.negocio) {
          setNegocio(dataNegocio.negocio);
          setNuevoNombre(dataNegocio.negocio.nombre);
        }

        // Cargar turnos
        const resTurnos = await fetch(`/admin/turnos?slug=${slug}`);
        const dataTurnos = await resTurnos.json();
        if (dataTurnos.turnos) {
          setTurnos(dataTurnos.turnos);
        }
      } catch (error) {
        console.error('Error cargando panel de administración:', error);
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [slug]);

  // Manejar actualización del nombre del local
  async function handleActualizarNegocio(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');

    try {
      const res = await fetch(`/api/negocio/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre }),
      });

      const data = await res.json();
      if (res.ok) {
        setNegocio(data.negocio);
        setMensaje('¡Nombre del local actualizado con éxito!');
      } else {
        setMensaje(data.error || 'Error al actualizar');
      }
    } catch (error) {
      setMensaje('Error de conexión al actualizar');
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <p className="text-neutral-400 animate-pulse">Cargando panel de administración...</p>
      </div>
    );
  }

  if (!negocio) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-bold text-red-400">Negocio no encontrado</h1>
        <Link href="/" className="mt-4 px-4 py-2 bg-neutral-800 rounded-lg text-sm hover:bg-neutral-700">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Encabezado y navegación */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
              Panel de Administración
            </span>
            <h1 className="text-3xl font-extrabold mt-2">{negocio.nombre}</h1>
            <p className="text-neutral-400 text-sm">Gestiona la configuración y los turnos de tu local.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/${slug}`}
              target="_blank"
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl transition-colors border border-neutral-700"
            >
              Ver página pública ↗
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-xs font-medium rounded-xl transition-colors border border-neutral-800"
            >
              Inicio
            </Link>
          </div>
        </div>

        {/* Sección 1: Configuración del Negocio */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-neutral-200">Configuración del Local</h2>
          
          <form onSubmit={handleActualizarNegocio} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                Nombre del Negocio
              </label>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                required
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={guardando}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg"
              >
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>

              {mensaje && (
                <span className={`text-xs ${mensaje.includes('éxito') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {mensaje}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Sección 2: Listado de Turnos */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-neutral-200">Turnos Agendados</h2>

          {turnos.length === 0 ? (
            <p className="text-neutral-500 text-sm italic py-8 text-center">
              No hay turnos registrados para este negocio todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="pb-3 px-3">Cliente</th>
                    <th className="pb-3 px-3">Teléfono</th>
                    <th className="pb-3 px-3">Servicio</th>
                    <th className="pb-3 px-3">Fecha y Hora</th>
                    <th className="pb-3 px-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {turnos.map((turno) => (
                    <tr key={turno.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3 px-3 font-medium text-white">{turno.cliente_nombre}</td>
                      <td className="py-3 px-3 text-neutral-400">{turno.cliente_telefono}</td>
                      <td className="py-3 px-3 text-neutral-300">{turno.servicio_nombre || 'General'}</td>
                      <td className="py-3 px-3 text-neutral-300">
                        {new Date(turno.fecha_hora_inicio).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                          {turno.estado || 'Confirmado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
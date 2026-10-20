'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NegocioForm from './NegocioForm';

export default function AdminClientView({ slug }: { slug: string }) {
  const [negocio, setNegocio] = useState<any>(null);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const resNegocio = await fetch(`/api/negocio/${slug}`);
        const dataNegocio = await resNegocio.json();
        if (dataNegocio.negocio) {
          setNegocio(dataNegocio.negocio);
        }

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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-4">
            {negocio.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={negocio.logo_url}
                alt="Logo"
                className="w-14 h-14 rounded-xl object-contain bg-neutral-900 border border-neutral-800"
              />
            )}
            <div>
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                Panel de Administración
              </span>
              <h1 className="text-3xl font-extrabold mt-2">{negocio.nombre}</h1>
              <p className="text-neutral-400 text-sm">Gestiona la configuración y los turnos de tu local.</p>
            </div>
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

        <NegocioForm slug={slug} negocio={negocio} onSaved={setNegocio} />

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
                        {new Date(turno.fecha_hora_inicio).toLocaleString('es-AR')}
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
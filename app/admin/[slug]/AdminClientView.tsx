'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NegocioForm from './NegocioForm';
import ServiciosPanel from './ServiciosPanel';
import TurnosPanel from './TurnosPanel';

export default function AdminClientView({ slug }: { slug: string }) {
  const router = useRouter();
  const [negocio, setNegocio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const res = await fetch(`/api/negocio/${slug}`);
        const data = await res.json();
        if (data.negocio) setNegocio(data.negocio);
      } catch (error) {
        console.error('Error cargando panel de administración:', error);
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();
  }, [slug]);

  async function cerrarSesion() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace(`/admin/${slug}/login`);
    router.refresh();
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
            <button
              type="button"
              onClick={cerrarSesion}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-xs font-medium rounded-xl transition-colors border border-neutral-800"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <TurnosPanel slug={slug} negocioNombre={negocio.nombre} />
        <ServiciosPanel slug={slug} />
        <NegocioForm slug={slug} negocio={negocio} onSaved={setNegocio} />
      </div>
    </main>
  );
}
import Link from 'next/link';
import { getSql } from '@/lib/db';
import { Suspense } from 'react';

// Permitir renderizado dinámico en esta página para Next.js
export const instant = false;

async function ListaNegocios() {
  let negocios: Array<{ id: number; nombre: string; slug: string }> = [];
  try {
    const sql = getSql();
    negocios = await sql`SELECT id, nombre, slug FROM negocios ORDER BY nombre ASC`;
  } catch (error) {
    console.error('Error al cargar negocios:', error);
  }

  if (negocios.length === 0) {
    return (
      <p className="text-neutral-500 text-sm italic py-4 text-center">
        No hay negocios registrados todavía o la base de datos está sincronizándose.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {negocios.map((negocio) => (
        <div 
          key={negocio.id} 
          className="flex items-center justify-between p-4 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 rounded-xl transition-all"
        >
          <span className="font-semibold text-lg">{negocio.nombre}</span>
          <div className="flex items-center gap-2">
            <Link
              href={`/${negocio.slug}`}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Reservar Turno
            </Link>
            <Link
              href={`/admin/${negocio.slug}`}
              className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 text-xs font-medium rounded-lg transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full text-center space-y-8">
        
        {/* Encabezado */}
        <div className="space-y-3">
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
            Micro-SaaS de Turnos por WhatsApp
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Gestión de Turnos
          </h1>
          <p className="text-neutral-400 text-sm">
            Selecciona tu negocio para agendar citas o administrar turnos de forma rápida y automatizada.
          </p>
        </div>

        {/* Listado de Negocios envuelto en Suspense */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl text-left space-y-4">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
            Negocios Disponibles
          </h2>
          <Suspense fallback={<p className="text-neutral-500 text-sm py-4 text-center">Cargando negocios...</p>}>
            <ListaNegocios />
          </Suspense>
        </div>

        {/* Pie de página */}
        <p className="text-xs text-neutral-600">
          Potenciado con Next.js App Router, Neon Database y Vercel.
        </p>

      </div>
    </main>
  );
}
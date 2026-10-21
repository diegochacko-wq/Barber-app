'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RegisterBusinessModal from './components/RegisterBusinessModal';

export default function Home() {
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function cargarNegocios() {
    setLoading(true);
    try {
      const res = await fetch('/api/turnos'); // O Endpoint para listar comercios
      const data = await res.json();
      if (Array.isArray(data)) {
        setNegocios(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarNegocios();
  }, []);

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
            Selecciona tu negocio para agendar citas o registra tu propio comercio para comenzar.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-emerald-950"
          >
            + Registrar Nuevo Negocio
          </button>
        </div>

        {/* Listado de Negocios */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl text-left space-y-4">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
            Negocios Disponibles
          </h2>

          {loading ? (
            <p className="text-neutral-500 text-sm py-4 text-center animate-pulse">Cargando comercios...</p>
          ) : negocios.length === 0 ? (
            <p className="text-neutral-500 text-sm italic py-4 text-center">
              No hay negocios registrados aún. ¡Sé el primero en registrarte!
            </p>
          ) : (
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal de Registro */}
      <RegisterBusinessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          cargarNegocios();
        }}
      />
    </main>
  );
}
'use client';

import { useEffect, useState, use } from 'react';

interface Turno {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  servicio_nombre: string;
  fecha_hora_inicio: string;
  estado: string;
}

export default function AdminPanel({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario manual
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState('14:00');

  const cargarTurnos = async () => {
    try {
      const res = await fetch(`/api/admin/turnos?slug=${slug}`);
      const data = await res.json();
      if (data.turnos) setTurnos(data.turnos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTurnos();
  }, [slug]);

  const agregarManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre) return alert('Ingresa el nombre del cliente');

    try {
      // Registrar turno manual
      const res = await fetch('/api/admin/turnos/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, clienteNombre, clienteTelefono, fecha, hora }),
      });

      if (res.ok) {
        setClienteNombre('');
        setClienteTelefono('');
        cargarTurnos();
        alert('Turno agregado exitosamente');
      }
    } catch (e) {
      alert('Error al agregar turno');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6 max-w-4xl mx-auto space-y-8">
      <header className="border-b border-neutral-800 pb-4">
        <h1 className="text-3xl font-bold text-cyan-400">Panel de Administración</h1>
        <p className="text-neutral-400 text-sm">Gestiona tus turnos para: {slug}</p>
      </header>

      {/* Cargar Turno Manual */}
      <section className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 space-y-4">
        <h2 className="text-xl font-bold text-pink-400">➕ Cargar Turno Manual (Mostrador/Teléfono)</h2>
        <form onSubmit={agregarManual} className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre del Cliente"
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
            className="p-3 bg-neutral-900 rounded-xl border border-neutral-700 outline-none"
            required
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={clienteTelefono}
            onChange={(e) => setClienteTelefono(e.target.value)}
            className="p-3 bg-neutral-900 rounded-xl border border-neutral-700 outline-none"
          />
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="p-3 bg-neutral-900 rounded-xl border border-neutral-700 outline-none"
            required
          />
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="p-3 bg-neutral-900 rounded-xl border border-neutral-700 outline-none"
            required
          />
          <button
            type="submit"
            className="md:col-span-2 py-3 bg-cyan-500 font-bold text-black rounded-xl hover:bg-cyan-400 transition-all"
          >
            Guardar Turno
          </button>
        </form>
      </section>

      {/* Lista de Turnos */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">📅 Próximos Turnos</h2>
        {loading ? (
          <p className="text-neutral-400">Cargando turnos...</p>
        ) : turnos.length === 0 ? (
          <p className="text-neutral-500">No hay turnos registrados aún.</p>
        ) : (
          <div className="grid gap-3">
            {turnos.map((t) => (
              <div key={t.id} className="p-4 bg-neutral-800 rounded-xl border border-neutral-700 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-white">{t.cliente_nombre}</h3>
                  <p className="text-xs text-neutral-400">📞 {t.cliente_telefono || 'Sin teléfono'} | ✂️ {t.servicio_nombre || 'Servicio'}</p>
                </div>
                <div className="text-right">
                  <span className="text-cyan-400 font-bold text-sm block">
                    {new Date(t.fecha_hora_inicio).toLocaleDateString('es-AR')}
                  </span>
                  <span className="text-emerald-400 font-extrabold text-lg">
                    {new Date(t.fecha_hora_inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';

interface Servicio {
  id: string;
  nombre: string;
  duracion_minutos: number;
  precio: string;
}

interface Negocio {
  id: string;
  nombre: string;
  slug: string;
  whatsapp: string;
  tema_visual: string;
}

export default function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [data, setData] = useState<{ negocio: Negocio; servicios: Servicio[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados del formulario
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<string | null>(null);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Inicializar la fecha del lado del cliente de forma segura
  useEffect(() => {
    setFechaSeleccionada(new Date().toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function cargarDatos() {
      try {
        const resolvedParams = await params;
        const slug = resolvedParams.slug;
        if (!slug) return;

        const res = await fetch(`/api/negocio/${slug}`);
        const result = await res.json();

        if (!res.ok || result.error) throw new Error(result.error || 'Negocio no encontrado');

        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message);
          setLoading(false);
        }
      }
    }
    cargarDatos();
    return () => { isMounted = false; };
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="animate-pulse text-lg font-medium text-cyan-400">Cargando barbería...</p>
      </div>
    );
  }

  if (errorMsg || !data || !data.negocio) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <p className="text-red-400 font-semibold">{errorMsg || 'Negocio no encontrado'}</p>
      </div>
    );
  }

  const { negocio, servicios } = data;
  const isUrbanGrafiti = negocio.tema_visual === 'urban_grafiti';
  const horariosDisponibles = ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  const confirmarReserva = async () => {
    if (!servicioSeleccionado || !fechaSeleccionada || !horarioSeleccionado || !clienteNombre) {
      alert('Por favor completa tu nombre, selecciona servicio, fecha y horario');
      return;
    }

    setGuardando(true);
    const servicio = servicios.find((s) => s.id === servicioSeleccionado);

    try {
      // 1. Guardar turno en la base de datos de Neon
      const response = await fetch('/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negocio_id: negocio.id,
          servicio_id: servicioSeleccionado,
          cliente_nombre: clienteNombre,
          cliente_telefono: clienteTelefono,
          fecha: fechaSeleccionada,
          hora: horarioSeleccionado,
        }),
      });

      if (!response.ok) throw new Error('Error al guardar el turno');

      // 2. Redirigir a WhatsApp
      const mensaje = encodeURIComponent(
        `¡Hola! Quiero confirmar mi turno en *${negocio.nombre}*:\n\n` +
        `👤 *Cliente:* ${clienteNombre}\n` +
        `✂️ *Servicio:* ${servicio?.nombre}\n` +
        `📅 *Fecha:* ${fechaSeleccionada}\n` +
        `🕒 *Hora:* ${horarioSeleccionado} hs\n` +
        `💰 *Precio:* $${servicio?.precio}`
      );

      window.open(`https://wa.me/${negocio.whatsapp}?text=${mensaje}`, '_blank');
    } catch (err) {
      alert('Ocurrió un error al registrar tu turno. Inténtalo nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        <header className="text-center space-y-2 pt-4">
          <h1 className="text-4xl font-extrabold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-cyan-400 to-green-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]">
            {negocio.nombre}
          </h1>
          <p className="text-sm tracking-widest text-cyan-400 uppercase font-semibold">Reserva tu turno</p>
        </header>

        {/* 1. Datos del Cliente */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-pink-400 uppercase tracking-wide">1. Tu Información</h2>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Tu Nombre Completo *"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:border-cyan-400 outline-none"
            />
            <input
              type="tel"
              placeholder="Teléfono / WhatsApp (Opcional)"
              value={clienteTelefono}
              onChange={(e) => setClienteTelefono(e.target.value)}
              className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:border-cyan-400 outline-none"
            />
          </div>
        </section>

        {/* 2. Selección de Servicio */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-pink-400 uppercase tracking-wide">2. Elige Servicio</h2>
          <div className="grid gap-3">
            {servicios.map((s) => (
              <button
                key={s.id}
                onClick={() => setServicioSeleccionado(s.id)}
                className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                  servicioSeleccionado === s.id
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                    : 'border-neutral-800 bg-neutral-900 hover:border-pink-500/50'
                }`}
              >
                <div>
                  <h3 className="font-bold">{s.nombre}</h3>
                  <span className="text-xs text-neutral-400">{s.duracion_minutos} min</span>
                </div>
                <span className="font-extrabold text-cyan-400">${parseFloat(s.precio).toLocaleString('es-AR')}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 3. Selección de Fecha y Hora */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-pink-400 uppercase tracking-wide">3. Fecha y Hora</h2>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:border-cyan-400 outline-none color-scheme-dark"
          />
          <div className="grid grid-cols-4 gap-2 pt-2">
            {horariosDisponibles.map((hora) => (
              <button
                key={hora}
                onClick={() => setHorarioSeleccionado(hora)}
                className={`p-2 rounded-lg border text-sm font-semibold text-center transition-all ${
                  horarioSeleccionado === hora
                    ? 'border-green-400 bg-green-950/40 text-green-300 shadow-[0_0_12px_rgba(74,222,128,0.5)]'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-cyan-500/50'
                }`}
              >
                {hora} hs
              </button>
            ))}
          </div>
        </section>

        {/* Botón de Confirmación */}
        <button
          onClick={confirmarReserva}
          disabled={guardando}
          className="w-full py-4 rounded-xl font-black text-black bg-gradient-to-r from-green-400 to-emerald-300 uppercase tracking-wider text-lg shadow-[0_0_20px_rgba(74,222,128,0.6)] transition-all active:scale-95 disabled:opacity-50"
        >
          {guardando ? 'Guardando Turno...' : 'Confirmar Turno ✂️'}
        </button>
      </div>
    </main>
  );
}
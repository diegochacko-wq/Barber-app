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
  whatsapp: string | null;
  tema_visual: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  logo_url?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  sitio_web?: string | null;
}

interface Horario {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

const HORARIOS_POR_DEFECTO = ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

function fechaLocal(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function aMinutos(hora: string): number {
  const [h, m] = hora.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

function aHora(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

// Devuelve null si el negocio no configuró horarios (se usa la lista por defecto)
function generarHorarios(
  horarios: Horario[],
  fecha: string,
  hoy: string,
  duracionMin: number
): string[] | null {
  if (horarios.length === 0) return null;
  if (!fecha) return [];

  // 0 = Domingo ... 6 = Sábado
  const dia = new Date(`${fecha}T12:00:00`).getDay();
  const franjas = horarios.filter((h) => h.dia_semana === dia && h.activo);

  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  const slots: string[] = [];
  for (const f of franjas) {
    const fin = aMinutos(f.hora_fin);
    for (let t = aMinutos(f.hora_inicio); t + duracionMin <= fin; t += 60) {
      if (fecha === hoy && t <= minutosAhora) continue;
      slots.push(aHora(t));
    }
  }
  return slots;
}

function enlace(tipo: 'instagram' | 'facebook' | 'tiktok' | 'sitio_web', valor: string): string {
  const v = valor.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '');
  if (tipo === 'instagram') return `https://instagram.com/${handle}`;
  if (tipo === 'tiktok') return `https://tiktok.com/@${handle}`;
  return `https://${v}`;
}

export default function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [data, setData] = useState<{
    negocio: Negocio;
    servicios: Servicio[];
    horarios: Horario[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados del formulario
  const [hoy, setHoy] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<string | null>(null);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Inicializar la fecha del lado del cliente con la fecha local
  useEffect(() => {
    const f = fechaLocal();
    setHoy(f);
    setFechaSeleccionada(f);
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
          setData({
            negocio: result.negocio,
            servicios: result.servicios ?? [],
            horarios: result.horarios ?? [],
          });
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

  const { negocio, servicios, horarios } = data;
  const servicioActual = servicios.find((s) => s.id === servicioSeleccionado);
  const duracion = servicioActual?.duracion_minutos ?? 60;

  const generados = generarHorarios(horarios, fechaSeleccionada, hoy, duracion);
  const horariosDisponibles = generados ?? HORARIOS_POR_DEFECTO;
  const cerrado = generados !== null && generados.length === 0;

  const redes = (
    [
      ['instagram', 'Instagram'],
      ['facebook', 'Facebook'],
      ['tiktok', 'TikTok'],
      ['sitio_web', 'Sitio web'],
    ] as const
  ).filter(([key]) => negocio[key]);

  const confirmarReserva = async () => {
    if (!servicioSeleccionado || !fechaSeleccionada || !horarioSeleccionado || !clienteNombre) {
      alert('Por favor completa tu nombre, selecciona servicio, fecha y horario');
      return;
    }

    setGuardando(true);

    try {
      // 1. Guardar turno en la base de datos
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

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || 'Error al guardar el turno');
      }

      // 2. Avisar por WhatsApp si el negocio tiene número cargado
      const numero = negocio.whatsapp?.replace(/\D/g, '');
      if (numero) {
        const mensaje = encodeURIComponent(
          `¡Hola! Quiero confirmar mi turno en *${negocio.nombre}*:\n\n` +
          `👤 *Cliente:* ${clienteNombre}\n` +
          `✂️ *Servicio:* ${servicioActual?.nombre}\n` +
          `📅 *Fecha:* ${fechaSeleccionada}\n` +
          `🕒 *Hora:* ${horarioSeleccionado} hs\n` +
          `💰 *Precio:* $${servicioActual?.precio}`
        );
        const url = `https://wa.me/${numero}?text=${mensaje}`;
        const ventana = window.open(url, '_blank');
        if (!ventana) window.location.href = url;
      } else {
        alert('¡Turno reservado con éxito!');
      }

      setHorarioSeleccionado(null);
    } catch (err: any) {
      alert(err.message || 'Ocurrió un error al registrar tu turno. Inténtalo nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        <header className="text-center space-y-2 pt-4">
          {negocio.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={negocio.logo_url}
              alt={`Logo de ${negocio.nombre}`}
              className="w-24 h-24 mx-auto rounded-2xl object-contain"
            />
          )}
          <h1 className="text-4xl font-extrabold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-cyan-400 to-green-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]">
            {negocio.nombre}
          </h1>
          {negocio.direccion && (
            <p className="text-xs text-neutral-400">📍 {negocio.direccion}</p>
          )}
          {redes.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 text-xs">
              {redes.map(([key, nombre]) => (
                <a
                  key={key}
                  href={enlace(key, negocio[key] as string)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                >
                  {nombre}
                </a>
              ))}
            </div>
          )}
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
          {servicios.length === 0 ? (
            <p className="text-sm text-neutral-500">Este negocio todavía no cargó servicios.</p>
          ) : (
            <div className="grid gap-3">
              {servicios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setServicioSeleccionado(s.id);
                    setHorarioSeleccionado(null);
                  }}
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
                  <span className="font-extrabold text-cyan-400">
                    ${(parseFloat(s.precio) || 0).toLocaleString('es-AR')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 3. Selección de Fecha y Hora */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-pink-400 uppercase tracking-wide">3. Fecha y Hora</h2>
          <input
            type="date"
            min={hoy}
            value={fechaSeleccionada}
            onChange={(e) => {
              setFechaSeleccionada(e.target.value);
              setHorarioSeleccionado(null);
            }}
            className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:border-cyan-400 outline-none color-scheme-dark"
          />
          {cerrado ? (
            <p className="text-sm text-neutral-500 pt-2">
              No hay turnos disponibles para este día. Elegí otra fecha.
            </p>
          ) : (
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
          )}
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
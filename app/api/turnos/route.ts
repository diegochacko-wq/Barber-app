import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { negocio_id, servicio_id, cliente_nombre, cliente_telefono, fecha, hora } = body;

    if (!negocio_id || !servicio_id || !cliente_nombre || !fecha || !hora) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Combinar fecha y hora para calcular inicio y fin
    const fechaHoraInicio = new Date(`${fecha}T${hora}:00`);

    // Obtener la duración del servicio
    const servicio = await sql`
      SELECT duracion_minutos FROM servicios WHERE id = ${servicio_id} LIMIT 1
    `;

    if (servicio.length === 0) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    const duracion = servicio[0].duracion_minutos;
    const fechaHoraFin = new Date(fechaHoraInicio.getTime() + duracion * 60000);

    // Guardar el turno en la base de datos
    const nuevoTurno = await sql`
      INSERT INTO turnos (
        negocio_id, servicio_id, cliente_nombre, cliente_telefono, fecha_hora_inicio, fecha_hora_fin, estado
      )
      VALUES (
        ${negocio_id}, ${servicio_id}, ${cliente_nombre}, ${cliente_telefono || ''}, ${fechaHoraInicio.toISOString()}, ${fechaHoraFin.toISOString()}, 'confirmado'
      )
      RETURNING id
    `;

    return NextResponse.json({ success: true, turnoId: nuevoTurno[0].id });
  } catch (error) {
    console.error('Error al guardar turno:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al registrar el turno' },
      { status: 500 }
    );
  }
}
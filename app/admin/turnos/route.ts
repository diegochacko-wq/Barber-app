import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// Forzar que esta ruta sea siempre dinámica y evitar intentos de pre-renderizado
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url, 'http://localhost');
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug requerido' }, { status: 400 });
    }

    const turnos = await sql`
      SELECT 
        t.id, t.cliente_nombre, t.cliente_telefono, t.fecha_hora_inicio, t.estado,
        s.nombre as servicio_nombre
      FROM turnos t
      JOIN negocios n ON t.negocio_id = n.id
      LEFT JOIN servicios s ON t.servicio_id = s.id
      WHERE n.slug = ${slug}
      ORDER BY t.fecha_hora_inicio ASC
    `;

    return NextResponse.json({ turnos });
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
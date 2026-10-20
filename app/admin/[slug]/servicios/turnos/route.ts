import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { exigirAdmin } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const noAutorizado = exigirAdmin(request, slug);
    if (noAutorizado) return noAutorizado;

    const sql = getSql();
    const turnos = await sql`
      SELECT
        t.id, t.cliente_nombre, t.cliente_telefono, t.fecha_hora_inicio, t.estado, t.extras,
        s.nombre AS servicio_nombre, s.precio AS servicio_precio
      FROM turnos t
      JOIN negocios n ON t.negocio_id = n.id
      LEFT JOIN servicios s ON t.servicio_id = s.id
      WHERE n.slug = ${slug}
      ORDER BY t.fecha_hora_inicio DESC
      LIMIT 300
    `;
    return NextResponse.json({ turnos });
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
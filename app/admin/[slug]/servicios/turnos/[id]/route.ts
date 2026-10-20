import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { exigirAdmin } from '@/lib/auth';

const ESTADOS = ['confirmado', 'asistio', 'no_asistio', 'cancelado_cliente', 'cancelado_negocio'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const noAutorizado = exigirAdmin(request, slug);
    if (noAutorizado) return noAutorizado;

    const sql = getSql();
    const body = await request.json();
    const cambios: Record<string, any> = {};

    if ('estado' in body) {
      if (!ESTADOS.includes(body.estado)) {
        return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
      }
      cambios.estado = body.estado;
    }

    if ('extras' in body) {
      if (!Array.isArray(body.extras) || body.extras.length > 20) {
        return NextResponse.json({ error: 'Extras inválidos' }, { status: 400 });
      }
      const extras = body.extras.map((e: any) => ({
        nombre: String(e?.nombre ?? '').trim().slice(0, 80),
        precio: Number(e?.precio),
      }));
      if (extras.some((e: any) => !e.nombre || !Number.isFinite(e.precio) || e.precio < 0)) {
        return NextResponse.json({ error: 'Extras inválidos' }, { status: 400 });
      }
      cambios.extras = sql.json(extras);
    }

    const keys = Object.keys(cambios);
    if (keys.length === 0) {
      return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 });
    }

    const actualizado = await sql`
      UPDATE turnos SET ${sql(cambios, ...keys)}
      WHERE id = ${id}
        AND negocio_id = (SELECT id FROM negocios WHERE slug = ${slug})
      RETURNING id, estado, extras
    `;

    if (actualizado.length === 0) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ turno: actualizado[0] });
  } catch (error) {
    console.error('Error al actualizar turno:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { exigirAdmin } from '@/lib/auth';
import { validarServicio } from '@/lib/servicios';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const noAutorizado = exigirAdmin(request, slug);
    if (noAutorizado) return noAutorizado;

    const body = await request.json();
    const validado = validarServicio(body);
    if ('error' in validado) {
      return NextResponse.json({ error: validado.error }, { status: 400 });
    }
    const { nombre, duracion, precio, dias } = validado.datos;
    const activo = body.activo !== false;

    const sql = getSql();
    const actualizado = await sql`
      UPDATE servicios
      SET nombre = ${nombre},
          duracion_minutos = ${duracion},
          precio = ${precio},
          activo = ${activo},
          dias_recordatorio = ${dias}
      WHERE id = ${id}
        AND negocio_id = (SELECT id FROM negocios WHERE slug = ${slug})
      RETURNING id, nombre, duracion_minutos, precio, activo, dias_recordatorio
    `;

    if (actualizado.length === 0) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ servicio: actualizado[0] });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
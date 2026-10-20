import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { exigirAdmin } from '@/lib/auth';
import { validarServicio } from '@/lib/servicios';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const noAutorizado = exigirAdmin(request, slug);
    if (noAutorizado) return noAutorizado;

    const sql = getSql();
    const servicios = await sql`
      SELECT s.id, s.nombre, s.duracion_minutos, s.precio, s.activo, s.dias_recordatorio
      FROM servicios s
      JOIN negocios n ON s.negocio_id = n.id
      WHERE n.slug = ${slug}
      ORDER BY s.activo DESC, s.nombre ASC
    `;
    return NextResponse.json({ servicios });
  } catch (error) {
    console.error('Error al listar servicios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const noAutorizado = exigirAdmin(request, slug);
    if (noAutorizado) return noAutorizado;

    const validado = validarServicio(await request.json());
    if ('error' in validado) {
      return NextResponse.json({ error: validado.error }, { status: 400 });
    }
    const { nombre, duracion, precio, dias } = validado.datos;

    const sql = getSql();
    const negocio = await sql`SELECT id FROM negocios WHERE slug = ${slug} LIMIT 1`;
    if (negocio.length === 0) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const creado = await sql`
      INSERT INTO servicios (negocio_id, nombre, duracion_minutos, precio, activo, dias_recordatorio)
      VALUES (${negocio[0].id}, ${nombre}, ${duracion}, ${precio}, true, ${dias})
      RETURNING id, nombre, duracion_minutos, precio, activo, dias_recordatorio
    `;
    return NextResponse.json({ servicio: creado[0] });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
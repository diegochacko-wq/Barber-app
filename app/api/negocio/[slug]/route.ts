import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

const CAMPOS = [
  'nombre', 'direccion', 'telefono', 'whatsapp', 'email',
  'logo_url', 'instagram', 'facebook', 'tiktok', 'sitio_web',
] as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const sql = getSql();
    const { slug } = await params;

    const negocio = await sql`
      SELECT id, nombre, slug, whatsapp, tema_visual, direccion, telefono,
             email, logo_url, instagram, facebook, tiktok, sitio_web
      FROM negocios
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (negocio.length === 0) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const negocioData = negocio[0];

    const servicios = await sql`
      SELECT id, nombre, duracion_minutos, precio
      FROM servicios
      WHERE negocio_id = ${negocioData.id} AND activo = true
      ORDER BY precio ASC
    `;

    const horarios = await sql`
      SELECT dia_semana, hora_inicio, hora_fin, activo
      FROM horarios_atencion
      WHERE negocio_id = ${negocioData.id} AND activo = true
      ORDER BY dia_semana ASC
    `;

    return NextResponse.json({ negocio: negocioData, servicios, horarios });
  } catch (error) {
    console.error('Error al obtener datos del negocio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const sql = getSql();
    const { slug } = await params;
    const body = await request.json();

    // Solo se actualizan los campos que llegan en el body
    const data: Record<string, string | null> = {};
    for (const campo of CAMPOS) {
      if (campo in body) {
        const valor = typeof body[campo] === 'string' ? body[campo].trim() : '';
        data[campo] = valor === '' ? null : valor;
      }
    }

    if ('nombre' in data && !data.nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }
    if (data.logo_url && data.logo_url.length > 400_000) {
      return NextResponse.json({ error: 'El logo es demasiado pesado' }, { status: 413 });
    }

    const keys = Object.keys(data);
    if (keys.length === 0) {
      return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 });
    }

    const actualizado = await sql`
      UPDATE negocios SET ${sql(data, ...keys)}
      WHERE slug = ${slug}
      RETURNING id, nombre, slug, whatsapp, tema_visual, direccion, telefono,
                email, logo_url, instagram, facebook, tiktok, sitio_web
    `;

    if (actualizado.length === 0) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ negocio: actualizado[0] });
  } catch (error) {
    console.error('Error al actualizar negocio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
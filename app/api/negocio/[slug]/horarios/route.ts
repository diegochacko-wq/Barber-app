import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const sql = getSql();
    const { slug } = await params;

    const horarios = await sql`
      SELECT h.dia_semana, h.hora_inicio, h.hora_fin, h.activo
      FROM horarios_atencion h
      JOIN negocios n ON h.negocio_id = n.id
      WHERE n.slug = ${slug}
      ORDER BY h.dia_semana ASC
    `;

    return NextResponse.json({ horarios });
  } catch (error) {
    console.error('Error al obtener horarios:', error);
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
    const { horarios } = await request.json();

    if (!Array.isArray(horarios)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    const negocio = await sql`SELECT id FROM negocios WHERE slug = ${slug} LIMIT 1`;
    if (negocio.length === 0) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }
    const negocioId = negocio[0].id;

    await sql.begin(async (tx) => {
      await tx`DELETE FROM horarios_atencion WHERE negocio_id = ${negocioId}`;
      for (const h of horarios) {
        await tx`
          INSERT INTO horarios_atencion (negocio_id, dia_semana, hora_inicio, hora_fin, activo)
          VALUES (${negocioId}, ${h.dia_semana}, ${h.hora_inicio}, ${h.hora_fin}, ${!!h.activo})
        `;
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al guardar horarios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
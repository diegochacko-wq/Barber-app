import { NextResponse } from 'next/server';
import sql from '../../../../lib/db'; // Importación por defecto correcta

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // 1. Resolver los parámetros de la URL de forma asíncrona
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    // 2. Obtener la información del negocio
    const negocio = await sql`
      SELECT id, nombre, slug, whatsapp, tema_visual
      FROM negocios
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (negocio.length === 0) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' },
        { status: 404 }
      );
    }

    const negocioData = negocio[0];

    // 3. Obtener los servicios activos del negocio
    const servicios = await sql`
      SELECT id, nombre, duracion_minutos, precio
      FROM servicios
      WHERE negocio_id = ${negocioData.id} AND activo = true
      ORDER BY precio ASC
    `;

    // 4. Obtener los horarios de atención del negocio
    const horarios = await sql`
      SELECT dia_semana, hora_inicio, hora_fin, activo
      FROM horarios_atencion
      WHERE negocio_id = ${negocioData.id} AND activo = true
      ORDER BY dia_semana ASC
    `;

    // 5. Retornar la respuesta consolidada en JSON
    return NextResponse.json({
      negocio: negocioData,
      servicios: servicios,
      horarios: horarios
    });

  } catch (error) {
    console.error('Error al obtener datos del negocio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
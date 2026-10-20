import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

// Obtener datos del negocio por slug
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const sql = getSql();
    const negocios = await sql`SELECT * FROM negocios WHERE slug = ${slug}`;

    if (negocios.length === 0) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ negocio: negocios[0] });
  } catch (error) {
    console.error('Error al obtener negocio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Actualizar datos del negocio (Nombre, etc.)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { nombre } = body;

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const sql = getSql();
    const actualizado = await sql`
      UPDATE negocios 
      SET nombre = ${nombre} 
      WHERE slug = ${slug} 
      RETURNING *
    `;

    if (actualizado.length === 0) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, negocio: actualizado[0] });
  } catch (error) {
    console.error('Error al actualizar negocio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
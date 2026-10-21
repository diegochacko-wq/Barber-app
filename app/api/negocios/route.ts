import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, password, telefono, email } = body;

    if (!nombre || !password) {
      return NextResponse.json(
        { error: 'El nombre y la contraseña son obligatorios' },
        { status: 400 }
      );
    }

    const baseSlug = createSlug(nombre);
    const sql = getSql();

    const existente = await sql`SELECT id FROM negocios WHERE slug = ${baseSlug}`;
    let finalSlug = baseSlug;
    if (existente.length > 0) {
      finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const passwordHash = hashPassword(password);

    // Intentamos hacer la inserción adaptable
    const nuevoNegocio = await sql`
      INSERT INTO negocios (nombre, slug, password_hash, telefono, email)
      VALUES (${nombre}, ${finalSlug}, ${passwordHash}, ${telefono || null}, ${email || null})
      RETURNING id, nombre, slug
    `;

    return NextResponse.json({
      success: true,
      negocio: nuevoNegocio[0],
    });
  } catch (error: any) {
    console.error('Error al registrar negocio:', error);
    // Devolvemos el mensaje exacto de Postgres para identificar la columna/tabla faltante
    return NextResponse.json(
      { 
        error: 'Error interno al registrar el negocio', 
        detalle: error?.message || String(error) 
      },
      { status: 500 }
    );
  }
}
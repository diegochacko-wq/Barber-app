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

// GET: Listar negocios
export async function GET() {
  try {
    const sql = getSql();
    const negocios = await sql`SELECT id, nombre, slug, telefono, email FROM negocios ORDER BY id DESC`;
    return NextResponse.json(negocios);
  } catch (error: any) {
    console.error('Error al listar negocios:', error);
    return NextResponse.json({ error: 'Error al obtener negocios', detalle: error?.message }, { status: 500 });
  }
}

// POST: Registrar nuevo negocio
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, password, telefono, email } = body;

    if (!nombre || !password) {
      return NextResponse.json(
        { error: 'El nombre y la contraseña son requeridos' },
        { status: 400 }
      );
    }

    const baseSlug = createSlug(nombre);
    const sql = getSql();

    // Validar si el slug ya existe
    const existente = await sql`SELECT id FROM negocios WHERE slug = ${baseSlug}`;
    let finalSlug = baseSlug;
    if (existente.length > 0) {
      finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const passwordHash = hashPassword(password);

    // Intentar inserción usando columnas estándar
    let nuevoNegocio;
    try {
      nuevoNegocio = await sql`
        INSERT INTO negocios (nombre, slug, password_hash, telefono, email)
        VALUES (${nombre}, ${finalSlug}, ${passwordHash}, ${telefono || null}, ${email || null})
        RETURNING id, nombre, slug
      `;
    } catch (insertError: any) {
      // Fallback si la columna en la BD se llama "password" en lugar de "password_hash"
      nuevoNegocio = await sql`
        INSERT INTO negocios (nombre, slug, password, telefono, email)
        VALUES (${nombre}, ${finalSlug}, ${passwordHash}, ${telefono || null}, ${email || null})
        RETURNING id, nombre, slug
      `;
    }

    return NextResponse.json({
      success: true,
      negocio: nuevoNegocio[0],
    });
  } catch (error: any) {
    console.error('Error al registrar negocio:', error);
    return NextResponse.json(
      { 
        error: 'Error interno al registrar el negocio', 
        detalle: error?.message || String(error) 
      },
      { status: 500 }
    );
  }
}
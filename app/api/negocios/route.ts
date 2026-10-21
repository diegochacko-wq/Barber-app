import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import crypto from 'crypto';

// Hash de contraseña (SHA-256)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generar slug amigable
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

// GET: Listar todos los negocios para la página principal
export async function GET() {
  try {
    const sql = getSql();
    const negocios = await sql`SELECT id, nombre, slug, whatsapp, email FROM negocios ORDER BY id DESC`;
    return NextResponse.json(negocios);
  } catch (error: any) {
    console.error('Error al listar negocios:', error);
    return NextResponse.json({ error: 'Error al obtener negocios', detalle: error?.message }, { status: 500 });
  }
}

// POST: Registrar un nuevo negocio
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Aceptamos tanto whatsapp como telefono para evitar conflictos de nombres desde el cliente
    const { nombre, password, telefono, whatsapp, email } = body;

    if (!nombre || !password) {
      return NextResponse.json(
        { error: 'El nombre y la contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // Garantizamos que la variable whatsapp tenga valor y no sea null
    const numeroWhatsapp = whatsapp || telefono || '';

    const baseSlug = createSlug(nombre);
    const sql = getSql();

    // Validar si el slug ya existe
    const existente = await sql`SELECT id FROM negocios WHERE slug = ${baseSlug}`;
    let finalSlug = baseSlug;
    if (existente.length > 0) {
      finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const passwordHash = hashPassword(password);
    // Definimos el usuario administrador por defecto (usando el email o 'admin')
    const adminUsuario = email || 'admin';

    // Insertar en la tabla negocios incluyendo los campos de administración requeridos por el login
    const nuevoNegocio = await sql`
      INSERT INTO negocios (nombre, slug, password_hash, whatsapp, email, admin_usuario, admin_password_hash)
      VALUES (${nombre}, ${finalSlug}, ${passwordHash}, ${numeroWhatsapp}, ${email || null}, ${adminUsuario}, ${passwordHash})
      RETURNING id, nombre, slug
    `;

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
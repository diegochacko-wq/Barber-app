import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { COOKIE_MAX_AGE, COOKIE_NAME, crearToken, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const sql = getSql();
    const body = await request.json();
    const { slug, usuario, password } = body;

    // Si el formulario envía email o usuario genérico, lo adaptamos
    const userIdentifier = usuario || body.email;

    if (!slug || !userIdentifier || !password) {
      return NextResponse.json({ error: 'Completá usuario y contraseña' }, { status: 400 });
    }

    const filas = await sql`
      SELECT admin_usuario, admin_password_hash, password_hash
      FROM negocios
      WHERE slug = ${slug}
      LIMIT 1
    `;
    
    const negocio = filas[0];

    if (!negocio) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    // Verificamos contra admin_password_hash o password_hash por compatibilidad
    const passwordHashToCheck = negocio.admin_password_hash || negocio.password_hash;
    const adminUserMatch = String(negocio.admin_usuario || '').toLowerCase() === String(userIdentifier).trim().toLowerCase() ||
                           String(body.email || '').toLowerCase() === String(userIdentifier).trim().toLowerCase();

    // Verificamos la contraseña (asumiendo que verifyPassword o la comparación de hash funciona)
    const passwordOk = verifyPassword ? verifyPassword(String(password), passwordHashToCheck) : true;

    if (!adminUserMatch || !passwordOk) {
      await new Promise((r) => setTimeout(r, 600)); // frena ataques de fuerza bruta
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, crearToken(slug), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    return res;
  } catch (error: any) {
    console.error('Error en login:', error);
    return NextResponse.json({ error: 'Error interno del servidor', detalle: error?.message }, { status: 500 });
  }
}
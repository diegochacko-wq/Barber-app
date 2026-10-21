import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { COOKIE_MAX_AGE, COOKIE_NAME, crearToken, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const sql = getSql();
    const { slug, usuario, password } = await request.json();

    if (!slug || !usuario || !password) {
      return NextResponse.json({ error: 'Completá usuario y contraseña' }, { status: 400 });
    }

    const filas = await sql`
      SELECT admin_usuario, admin_password_hash
      FROM negocios
      WHERE slug = ${slug}
      LIMIT 1
    `;
    const negocio = filas[0];

    const ok =
      !!negocio?.admin_usuario &&
      !!negocio?.admin_password_hash &&
      String(negocio.admin_usuario).toLowerCase() === String(usuario).trim().toLowerCase() &&
      verifyPassword(String(password), negocio.admin_password_hash);

    if (!ok) {
      await new Promise((r) => setTimeout(r, 600));
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
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
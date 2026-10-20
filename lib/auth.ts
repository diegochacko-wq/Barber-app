import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

export const COOKIE_NAME = 'admin_session';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function secreto(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('Falta SESSION_SECRET (mínimo 32 caracteres)');
  return s;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, guardado: string): boolean {
  const [salt, hash] = guardado.split(':');
  if (!salt || !hash) return false;
  const calculado = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, 'hex');
  return calculado.length === original.length && timingSafeEqual(calculado, original);
}

function firmar(dato: string): string {
  return createHmac('sha256', secreto()).update(dato).digest('base64url');
}

export function crearToken(slug: string): string {
  const payload = Buffer.from(
    JSON.stringify({ slug, exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE })
  ).toString('base64url');
  return `${payload}.${firmar(payload)}`;
}

export function leerToken(token?: string): { slug: string } | null {
  if (!token) return null;
  const [payload, firma] = token.split('.');
  if (!payload || !firma) return null;

  const esperada = Buffer.from(firmar(payload));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof data.slug !== 'string' || typeof data.exp !== 'number') return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return { slug: data.slug };
  } catch {
    return null;
  }
}

function leerCookie(request: Request, nombre: string): string | undefined {
  const header = request.headers.get('cookie') ?? '';
  for (const parte of header.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nombre) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

// Para usar en las rutas API: devuelve una respuesta 401 si no hay sesión válida de ese negocio
export function exigirAdmin(request: Request, slug: string): NextResponse | null {
  const sesion = leerToken(leerCookie(request, COOKIE_NAME));
  if (!sesion || sesion.slug !== slug) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}
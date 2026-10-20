export function validarServicio(body: any) {
  const nombre = String(body?.nombre ?? '').trim();
  const duracion = Number(body?.duracion_minutos);
  const precioVacio = body?.precio === '' || body?.precio === null || body?.precio === undefined;
  const precio = Number(body?.precio);
  const diasVacio =
    body?.dias_recordatorio === '' || body?.dias_recordatorio === null || body?.dias_recordatorio === undefined;
  const dias = diasVacio ? null : Number(body.dias_recordatorio);

  if (!nombre || nombre.length > 80) return { error: 'El nombre es obligatorio (máximo 80 caracteres)' };
  if (!Number.isInteger(duracion) || duracion < 5 || duracion > 600)
    return { error: 'La duración debe estar entre 5 y 600 minutos' };
  if (precioVacio || !Number.isFinite(precio) || precio < 0 || precio > 10_000_000)
    return { error: 'El precio no es válido' };
  if (dias !== null && (!Number.isInteger(dias) || dias < 1 || dias > 730))
    return { error: 'Los días de recordatorio deben estar entre 1 y 730' };

  return { datos: { nombre, duracion, precio, dias } };
}
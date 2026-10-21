import postgres from 'postgres';

const globalForSql = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
};

export function getSql() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Falta la variable de entorno DATABASE_URL');
  }

  // Limpiamos espacios y posibles comillas accidentales en la URL de conexión
  connectionString = connectionString.trim().replace(/^["']|["']$/g, '');

  return (globalForSql.sql ??= postgres(connectionString, { ssl: 'require' }));
}
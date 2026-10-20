import postgres from 'postgres';

const globalForSql = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
};

export function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Falta la variable de entorno DATABASE_URL');
  }
  return (globalForSql.sql ??= postgres(connectionString, { ssl: 'require' }));
}
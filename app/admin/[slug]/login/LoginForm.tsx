'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function ingresar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, usuario, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo ingresar');
      router.replace(`/admin/${slug}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      setEnviando(false);
    }
  }

  const input =
    'w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500';

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <form
        onSubmit={ingresar}
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl"
      >
        <div className="space-y-1">
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
            Panel de Administración
          </span>
          <h1 className="text-2xl font-extrabold pt-2">Iniciar sesión</h1>
        </div>

        <input
          className={input}
          placeholder="Usuario"
          autoComplete="username"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
        />
        <input
          className={input}
          type="password"
          placeholder="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
        >
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
import { Suspense } from 'react';
import AdminClientView from './AdminClientView';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <p className="text-neutral-400 animate-pulse">Cargando panel de administración...</p>
      </div>
    }>
      <AdminClientView slug={resolvedParams.slug} />
    </Suspense>
  );
}
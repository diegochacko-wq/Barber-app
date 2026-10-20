import { Suspense } from 'react';
import AdminClientView from './AdminClientView';

async function AdminContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AdminClientView slug={slug} />;
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <p className="text-neutral-400 animate-pulse">Cargando panel de administración...</p>
        </div>
      }
    >
      <AdminContent params={params} />
    </Suspense>
  );
}
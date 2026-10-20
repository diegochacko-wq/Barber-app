import { Suspense } from 'react';
import LoginForm from './LoginForm';

async function LoginContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LoginForm slug={slug} />;
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950" />}>
      <LoginContent params={params} />
    </Suspense>
  );
}
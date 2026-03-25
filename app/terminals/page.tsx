import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { TerminalsWrapper } from './_components/terminals-wrapper';

export default async function TerminalsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-4 py-8 flex-grow">
        <TerminalsWrapper />
      </main>
      <Footer />
    </div>
  );
}

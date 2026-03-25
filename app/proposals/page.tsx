import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ProposalsContent } from './_components/proposals-content';

export default async function ProposalsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8">
        <ProposalsContent />
      </main>
      <Footer />
    </div>
  );
}

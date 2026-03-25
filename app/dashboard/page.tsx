import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { DashboardContent } from './_components/dashboard-content';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-4 py-8 flex-grow">
        <DashboardContent />
      </main>
      <Footer />
    </div>
  );
}

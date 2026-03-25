import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { RespondentsWrapper } from './_components/respondents-wrapper';

export default async function RespondentsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <RespondentsWrapper />
      </main>
      <Footer />
    </div>
  );
}

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ProfileWrapper from './_components/profile-wrapper';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl flex-grow">
        {/* Cabeçalho */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Meu Perfil</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gerencie suas informações e configurações</p>
        </div>

        <ProfileWrapper />
      </div>
      <Footer />
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

interface TerminalSession {
  terminal: { id: string; name: string; email: string };
  user: { name: string; companyName: string };
  campaign: { id: string; title: string };
}

export default function TerminalThankYouPage() {
  const router = useRouter();
  const [session, setSession] = useState<TerminalSession | null>(null);
  const [countdown, setCountdown] = useState(3);

  // Carregar sessão
  useEffect(() => {
    const sessionData = localStorage.getItem('terminalSession');
    if (!sessionData) {
      router.push('/terminal/login');
      return;
    }
    
    const parsedSession: TerminalSession = JSON.parse(sessionData);
    setSession(parsedSession);
  }, [router]);

  // Contagem regressiva de 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Reiniciar pesquisa
          router.push('/terminal/survey');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Conteúdo Principal */}
      <div className="flex-grow flex flex-col items-center justify-center p-6 sm:p-8">
        {/* Ícone de Sucesso */}
        <div className="mb-6 animate-bounce">
          <CheckCircle className="h-24 w-24 sm:h-32 sm:w-32 text-green-500" strokeWidth={1.5} />
        </div>

        {/* Mensagem de Agradecimento */}
        <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-bold text-center mb-4 uppercase">
          OBRIGADO!
        </h1>
        
        <p className="text-gray-300 text-lg sm:text-xl md:text-2xl text-center mb-8 max-w-2xl">
          Sua opinião é muito importante para nós!
        </p>

        {/* Contagem Regressiva */}
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-base sm:text-lg mb-3">
            Iniciando nova pesquisa em...
          </p>
          <div className="text-blue-500 text-5xl sm:text-6xl font-bold animate-pulse">
            {countdown}
          </div>
        </div>
      </div>

      {/* Rodapé Fixo */}
      <div className="bg-gray-900 border-t border-gray-800 py-3 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-white text-xs sm:text-sm font-mono">
          <span className="uppercase font-bold">
            {session.user.companyName.toUpperCase()}
          </span>
          <span className="uppercase">
            {session.terminal.name.toUpperCase()}
          </span>
          <span className="uppercase text-gray-400">
            VER: 1.7.8
          </span>
          <span className="text-green-500 font-bold">
            PESQUISA CONCLUÍDA
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface CompanyInfo {
  name: string;
  logo: string | null;
}

export default function TerminalV2ThankYouPage() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [mounted, setMounted] = useState(false);
  const [hasMultipleCampaigns, setHasMultipleCampaigns] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // FORÇAR DARK MODE
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    
    // Limpar qualquer configuração de tema que possa interferir
    if (typeof window !== 'undefined') {
      localStorage.removeItem('theme');
      localStorage.removeItem('color-scheme');
    }
    
    // Tentar recuperar informações da empresa da sessão anterior
    const savedSession = localStorage.getItem('terminalSessionV2');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setCompanyInfo({
          name: session.userName || 'Empresa',
          logo: session.companyLogo || null,
        });
        setHasMultipleCampaigns(session.hasMultipleCampaigns || false);
      } catch (error) {
        console.error('Error parsing session:', error);
      }
    }

    // Verificar também na sessão atual do terminal
    const terminalSession = localStorage.getItem('terminalSession');
    if (terminalSession) {
      try {
        const tSession = JSON.parse(terminalSession);
        if (tSession.campaigns && tSession.campaigns.length > 1) {
          setHasMultipleCampaigns(true);
        }
      } catch (error) {
        console.error('Error parsing terminal session:', error);
      }
    }
  }, [router]);

  useEffect(() => {
    // Timer de redirecionamento (3 segundos)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Se tem mais de uma campanha, volta para seleção
          // Se não, volta para a pesquisa (mantendo selectedCampaign)
          if (hasMultipleCampaigns) {
            router.push('/terminal-v2/select-campaign');
          } else {
            router.push('/terminal-v2/survey');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasMultipleCampaigns, router]);

  const handleNewSurvey = () => {
    // Se tem mais de uma campanha, volta para seleção
    if (hasMultipleCampaigns) {
      router.push('/terminal-v2/select-campaign');
    } else {
      // Volta para pesquisa (mantendo selectedCampaign para permitir nova avaliação)
      router.push('/terminal-v2/survey');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-2 sm:p-4">
      {/* Removido Card, shadows, border-radius */}
      <div className="w-full max-w-2xl">
        <div className="p-4 sm:p-8 md:p-12 lg:p-16">
          <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
            {/* Company Logo (no topo) */}
            {companyInfo?.logo && (
              <div className="relative w-full max-w-xs sm:max-w-sm h-16 sm:h-20 md:h-24">
                <Image
                  src={companyInfo.logo}
                  alt={`Logo ${companyInfo.name}`}
                  fill
                  className="object-contain"
                  priority
                  quality={100}
                  loading="eager"
                  sizes="(max-width: 640px) 300px, (max-width: 768px) 400px, 500px"
                />
              </div>
            )}

            {/* Success Icon */}
            <div className="relative">
              <CheckCircle className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 text-green-500 relative" strokeWidth={2} />
            </div>

            {/* Thank You Message */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Obrigado!
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 px-4">
                Sua opinião é muito importante para nós.
              </p>
            </div>

            {/* Company Name (if no logo) */}
            {!companyInfo?.logo && companyInfo?.name && (
              <div className="text-2xl sm:text-3xl font-bold text-muted-foreground">
                {companyInfo.name}
              </div>
            )}

            {/* Decorative Elements */}
            <div className="flex gap-2 text-3xl sm:text-4xl md:text-5xl">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>
                🎉
              </span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>
                ✨
              </span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>
                🙏
              </span>
            </div>

            {/* Countdown */}
            <div className="pt-6 sm:pt-8 space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-gray-400">
                Redirecionando em {countdown} segundo{countdown !== 1 ? 's' : ''}...
              </p>
              <Button
                onClick={handleNewSurvey}
                size="lg"
                className="px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg font-semibold"
              >
                Nova Pesquisa
              </Button>
            </div>

            {/* Footer Info */}
            <div className="pt-8 border-t w-full">
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-40 sm:w-48 h-8 sm:h-10">
                  <Image
                    src="/logo-dark.png"
                    alt="Back&end Logo"
                    fill
                    className="object-contain"
                    quality={100}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Versão 2.0 - Terminal Responsivo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Monitor, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHospital,
  faUserDoctor,
  faStethoscope,
  faHeartPulse,
  faWheelchair,
  faKitMedical,
  faUsers,
  faUserGroup,
  faPerson,
  faPeopleGroup,
  faChartBar,
  faChartPie,
  faChartLine,
  faBuilding,
  faHouse,
  faLandmark,
  faCar,
  faBus,
  faPlane,
  faShoppingCart,
  faStore,
  faBasketShopping,
  faUtensils,
  faCoffee,
  faMugHot,
  faPhone,
  faEnvelope,
  faComments,
  faStar,
  faHeart,
  faThumbsUp,
  faClipboardList,
  faSmile,
  faHandshake,
  faBriefcase,
  faGraduationCap,
  faCalendarCheck,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import Image from 'next/image';

interface TerminalCampaign {
  id: string;
  campaignId: string;
  icon: string;
  color: string;
  customTitle: string | null;
  description: string | null;
  campaign: {
    id: string;
    title: string;
    description: string | null;
    uniqueLink: string;
    questions: any[];
    lgpdText: string | null;
    collectName: boolean;
    collectPhone: boolean;
    collectEmail: boolean;
  };
}

interface TerminalSession {
  terminalId: string;
  terminalName: string;
  userId: string;
  userName: string;
  companyLogo: string | null;
  campaigns?: TerminalCampaign[];
}

const iconMap: { [key: string]: IconDefinition } = {
  faHospital,
  faUserDoctor,
  faStethoscope,
  faHeartPulse,
  faWheelchair,
  faKitMedical,
  faUsers,
  faUserGroup,
  faPerson,
  faPeopleGroup,
  faChartBar,
  faChartPie,
  faChartLine,
  faBuilding,
  faHouse,
  faLandmark,
  faCar,
  faBus,
  faPlane,
  faShoppingCart,
  faStore,
  faBasketShopping,
  faUtensils,
  faCoffee,
  faMugHot,
  faPhone,
  faEnvelope,
  faComments,
  faStar,
  faHeart,
  faThumbsUp,
  faClipboardList,
  faSmile,
  faHandshake,
  faBriefcase,
  faGraduationCap,
  faCalendarCheck,
};

export default function SelectCampaignPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<TerminalCampaign[]>([]);
  const [terminalSession, setTerminalSession] = useState<TerminalSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [logoutClicks, setLogoutClicks] = useState(0);
  const [remainingTime, setRemainingTime] = useState(60);

  useEffect(() => {
    const storedSession = localStorage.getItem('terminalSession');
    
    if (!storedSession) {
      router.replace('/terminal-v2/login');
      return;
    }

    const session: TerminalSession = JSON.parse(storedSession);
    setTerminalSession(session);
    
    if (session.campaigns && session.campaigns.length > 0) {
      setCampaigns(session.campaigns);
      setLoading(false);
    } else {
      fetchCampaigns(session.terminalId);
    }
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          // Resetar para o início da seleção (sem deslogar)
          setSelectedCampaign(null);
          setRemainingTime(60);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchCampaigns = async (terminalId: string) => {
    try {
      const response = await fetch(`/api/terminals/${terminalId}/campaigns`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar campanhas');
      }

      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const handleScreenTouch = () => {
    setRemainingTime(60);
  };

  const handleSelectCampaign = (terminalCampaign: TerminalCampaign) => {
    setSelectedCampaign(terminalCampaign.id);
    
    localStorage.setItem('selectedCampaign', JSON.stringify({
      terminalCampaignId: terminalCampaign.id,
      campaignId: terminalCampaign.campaign.id,
      campaignTitle: terminalCampaign.customTitle || terminalCampaign.campaign.title,
      uniqueLink: terminalCampaign.campaign.uniqueLink,
      color: terminalCampaign.color,
      hasMultipleCampaigns: campaigns.length > 1,
    }));

    router.push('/terminal-v2/survey');
  };

  const handleVersionClick = () => {
    setLogoutClicks((prev) => prev + 1);
    if (logoutClicks + 1 >= 5) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('terminalSession');
    localStorage.removeItem('terminalSessionV2');
    localStorage.removeItem('selectedCampaign');
    toast.info('Sessão encerrada');
    router.push('/terminal-v2/login');
  };

  const getIcon = (iconName: string): IconDefinition => {
    return iconMap[iconName] || faChartBar;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" onClick={handleScreenTouch} onTouchStart={handleScreenTouch}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-400">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" onClick={handleScreenTouch} onTouchStart={handleScreenTouch}>
        <Card className="max-w-md w-full bg-gray-900 border-gray-700">
          <CardContent className="pt-6 text-center">
            <Monitor className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              Nenhuma campanha disponível
            </h2>
            <p className="text-gray-400 mb-6">
              Este terminal não possui campanhas vinculadas.
            </p>
            <Button onClick={handleLogout} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col bg-background"
      onClick={handleScreenTouch}
      onTouchStart={handleScreenTouch}
    >
      <header className="bg-background">
        <div className="h-4"></div>
      </header>

      <main className="flex-1 container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-4xl overflow-y-auto">
        <div className="bg-background">
          <div className="p-2 sm:p-4 md:p-6 lg:p-8">
            {/* Logo da empresa no topo */}
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-20 sm:w-40 sm:h-24">
                <Image
                  src={terminalSession?.companyLogo || '/logo-dark.png'}
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Título */}
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center px-2 mb-3">
                Selecione uma sessão para avaliar
              </h2>
            </div>

            {/* Campaign List */}
            <div className="space-y-3 max-w-2xl mx-auto">
              {campaigns.map((tc) => (
                <button
                  key={tc.id}
                  onClick={() => handleSelectCampaign(tc)}
                  disabled={selectedCampaign === tc.id}
                  className="w-full flex items-center gap-4 p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-orange-500/50 disabled:opacity-75 disabled:cursor-wait"
                  style={{ 
                    backgroundColor: tc.color || '#f97316',
                    borderColor: tc.color || '#f97316'
                  }}
                >
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 flex items-center justify-center">
                    {selectedCampaign === tc.id ? (
                      <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin" />
                    ) : (
                      <FontAwesomeIcon
                        icon={getIcon(tc.icon)}
                        className="h-6 w-6 sm:h-7 sm:w-7 text-white"
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 text-left text-white min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold truncate">
                      {tc.customTitle || tc.campaign.title}
                    </h3>
                    
                    {tc.description && (
                      <p className="text-sm opacity-80 line-clamp-1">
                        {tc.description}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white text-sm">→</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 py-4 z-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Selecione uma opção</span>
                <span>{campaigns.length} {campaigns.length === 1 ? 'opção' : 'opções'}</span>
              </div>
              <Progress value={0} className="h-2 bg-gray-700" />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative w-24 sm:w-32 h-6">
                  <Image
                    src="/logo-dark.png"
                    alt="Back&end Logo"
                    fill
                    className="object-contain"
                    quality={100}
                  />
                </div>
                <button
                  onClick={handleVersionClick}
                  className="text-xs text-gray-500 outline-none"
                  style={{ outline: 'none' }}
                >
                  v2.0
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{formatTime(remainingTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

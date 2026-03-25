'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, Monitor, Loader2 } from 'lucide-react';
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
}

// Map icon names to FontAwesome icons
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

  useEffect(() => {
    const storedSession = localStorage.getItem('terminalSession');
    
    if (!storedSession) {
      router.replace('/terminal-v2/login');
      return;
    }

    const session: TerminalSession = JSON.parse(storedSession);
    setTerminalSession(session);
    fetchCampaigns(session.terminalId);
  }, [router]);

  const fetchCampaigns = async (terminalId: string) => {
    try {
      const response = await fetch(`/api/terminals/${terminalId}/campaigns`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar campanhas');
      }

      const data = await response.json();
      setCampaigns(data);

      // Se tiver apenas uma campanha, redireciona direto
      if (data.length === 1) {
        handleSelectCampaign(data[0]);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCampaign = (terminalCampaign: TerminalCampaign) => {
    setSelectedCampaign(terminalCampaign.id);
    
    // Armazena a campanha selecionada no localStorage
    localStorage.setItem('selectedCampaign', JSON.stringify({
      terminalCampaignId: terminalCampaign.id,
      campaignId: terminalCampaign.campaign.id,
      campaignTitle: terminalCampaign.customTitle || terminalCampaign.campaign.title,
      uniqueLink: terminalCampaign.campaign.uniqueLink,
    }));

    // Redireciona para a pesquisa
    router.push('/terminal-v2/survey');
  };

  const handleLogout = () => {
    localStorage.removeItem('terminalSession');
    localStorage.removeItem('selectedCampaign');
    router.replace('/terminal-v2/login');
  };

  const getIcon = (iconName: string): IconDefinition => {
    return iconMap[iconName] || faChartBar;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Nenhuma campanha disponível
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Este terminal não possui campanhas vinculadas. Entre em contato com o administrador.
            </p>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {terminalSession?.companyLogo ? (
              <div className="relative w-12 h-12">
                <Image
                  src={terminalSession.companyLogo}
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <Monitor className="h-8 w-8 text-blue-600" />
            )}
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-gray-100">
                {terminalSession?.terminalName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selecione uma pesquisa para iniciar
              </p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Qual pesquisa deseja aplicar?
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Selecione uma das opções abaixo para iniciar
            </p>
          </div>

          {/* Campaign Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((tc) => (
              <button
                key={tc.id}
                onClick={() => handleSelectCampaign(tc)}
                disabled={selectedCampaign === tc.id}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-75 disabled:cursor-wait"
                style={{ backgroundColor: tc.color }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                
                <div className="relative p-8 text-white">
                  {selectedCampaign === tc.id ? (
                    <Loader2 className="h-16 w-16 mb-4 animate-spin mx-auto" />
                  ) : (
                    <FontAwesomeIcon
                      icon={getIcon(tc.icon)}
                      className="h-16 w-16 mb-4 mx-auto opacity-90 group-hover:scale-110 transition-transform"
                    />
                  )}
                  
                  <h3 className="text-xl md:text-2xl font-bold mb-2 text-center">
                    {tc.customTitle || tc.campaign.title}
                  </h3>
                  
                  {tc.description && (
                    <p className="text-sm opacity-80 text-center line-clamp-2">
                      {tc.description}
                    </p>
                  )}
                  
                  <div className="mt-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
                      {tc.campaign.questions.length} {tc.campaign.questions.length === 1 ? 'pergunta' : 'perguntas'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Powered by <span className="font-semibold">Beend</span>
        </p>
      </footer>
    </div>
  );
}

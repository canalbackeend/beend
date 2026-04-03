'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, PlusCircle, Monitor, BarChart3, Users, Settings, HelpCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('intro');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Central de Ajuda
              </h1>
              <p className="text-muted-foreground mt-1">
                Tudo que você precisa saber para usar a plataforma
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de Navegação */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Navegação Rápida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeSection === 'intro' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => scrollToSection('intro')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Introdução
                </Button>
                <Button
                  variant={activeSection === 'campaigns' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => scrollToSection('campaigns')}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Criar Campanha
                </Button>
                <Button
                  variant={activeSection === 'terminals' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => scrollToSection('terminals')}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Criar Terminal
                </Button>
                <Button
                  variant={activeSection === 'limits' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => scrollToSection('limits')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Limites
                </Button>
                <Button
                  variant={activeSection === 'analytics' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => scrollToSection('analytics')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Interpretar Dados
                </Button>
                <Button
                  variant={activeSection === 'terminal-panel' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => scrollToSection('terminal-panel')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Painel de Terminais
                </Button>
                <Button
                  variant={activeSection === 'faq' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => scrollToSection('faq')}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  FAQ
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3 space-y-8">
            {/* Introdução */}
            <section id="intro">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                    <CardTitle>Bem-vindo ao Sistema de Pesquisa de Satisfação</CardTitle>
                  </div>
                  <CardDescription>
                    Uma plataforma completa para coletar, analisar e gerenciar feedbacks dos seus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Este sistema permite que você crie pesquisas de satisfação personalizadas, distribua-as através de terminais físicos ou links online, e analise os resultados em tempo real através de dashboards intuitivos.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Campanhas Personalizadas
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Crie pesquisas com diferentes tipos de perguntas: SMILE, NPS, escolha múltipla, escala e mais.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Terminais Físicos
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Instale terminais em tablets para coletar respostas presencialmente em tempo real.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Analytics em Tempo Real
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Visualize métricas, gráficos e relatórios detalhados para tomar decisões baseadas em dados.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Painel Individual
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Cada terminal tem acesso a um painel exclusivo para visualizar seus próprios dados.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Análise de Sentimento
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Sistema inteligente analisa todos os comentários e identifica feedbacks positivos e negativos automaticamente.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Conformidade LGPD
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Colete dados de respondentes de forma segura com textos de privacidade personalizáveis.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Como Criar uma Campanha */}
            <section id="campaigns">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <PlusCircle className="h-6 w-6 text-purple-600" />
                    <CardTitle>Como Criar uma Campanha</CardTitle>
                  </div>
                  <CardDescription>
                    Passo a passo para criar sua primeira pesquisa de satisfação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Acesse o Menu Campanhas</h4>
                        <p className="text-sm text-muted-foreground">
                          No menu lateral, clique em "Campanhas" e depois no botão "Nova Campanha" no canto superior direito.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Preencha as Informações Básicas</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Digite o título e descrição da sua campanha. O título aparecerá no topo da pesquisa.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Adicione Perguntas</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Clique em "Adicionar Pergunta" e escolha o tipo:
                        </p>
                        <div className="space-y-2 ml-4">
                          <div className="text-sm">
                            <Badge variant="outline" className="mr-2">SMILE</Badge>
                            <span className="text-muted-foreground">5 níveis de satisfação com emojis (péssimo a excelente)</span>
                          </div>
                          <div className="text-sm">
                            <Badge variant="outline" className="mr-2">SIMPLE_SMILE</Badge>
                            <span className="text-muted-foreground">4 níveis simplificados (ruim, regular, bom, excelente)</span>
                          </div>
                          <div className="text-sm">
                            <Badge variant="outline" className="mr-2">NPS</Badge>
                            <span className="text-muted-foreground">Escala de 0 a 10 para medir lealdade (Net Promoter Score)</span>
                          </div>
                          <div className="text-sm">
                            <Badge variant="outline" className="mr-2">SINGLE_CHOICE</Badge>
                            <span className="text-muted-foreground">Escolha única entre várias opções</span>
                          </div>
                          <div className="text-sm">
                            <Badge variant="outline" className="mr-2">MULTIPLE_CHOICE</Badge>
                            <span className="text-muted-foreground">Permite selecionar múltiplas opções</span>
                          </div>
                          <div className="text-sm">
                            <Badge variant="outline" className="mr-2">SCALE</Badge>
                            <span className="text-muted-foreground">Escala numérica personalizada (ex: 1 a 5)</span>
                          </div>
                          <div className="text-sm">
                            <Badge variant="outline" className="mr-2">TEXT_INPUT</Badge>
                            <span className="text-muted-foreground">Campo de texto livre para comentários</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                        4
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">🎨 Personalize Cores das Opções (Novo!)</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Para perguntas de <strong>Escolha Única</strong> e <strong>Múltipla Escolha</strong>, você pode escolher cores personalizadas para cada opção:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li>Ao lado de cada opção, clique no seletor de cor (quadrado colorido)</li>
                          <li>Escolha uma cor que represente a opção (ex: vermelho para "Ruim", verde para "Ótimo")</li>
                          <li>As cores aparecem nas <strong>bordas e texto</strong> quando o respondente seleciona a opção</li>
                          <li>No dashboard e relatórios, as cores são usadas nas <strong>barras de progresso</strong></li>
                          <li>Cor padrão: Azul (#3b82f6)</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                        5
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Configure Privacidade (LGPD)</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Na seção "Privacidade e Coleta de Dados", você pode:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li>Personalizar o texto da LGPD</li>
                          <li>Solicitar nome, e-mail e/ou telefone do respondente</li>
                          <li>Esses dados aparecem na seção "Respondentes"</li>
                          <li>O telefone é coletado com máscara brasileira (xx) x xxxx-xxxx</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                        6
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Salve e Ative</h4>
                        <p className="text-sm text-muted-foreground">
                          Clique em "Criar Campanha". Você pode ativar/desativar a campanha a qualquer momento editando-a.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Dica Importante
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Perguntas do tipo SMILE e SIMPLE_SMILE são sempre obrigatórias, pois são fundamentais para medir a satisfação. Outras perguntas podem ser opcionais desmarcando "Resposta obrigatória".
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Como Criar um Terminal */}
            <section id="terminals">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-6 w-6 text-green-600" />
                    <CardTitle>Como Criar um Terminal</CardTitle>
                  </div>
                  <CardDescription>
                    Configure terminais físicos para coletar respostas presencialmente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Acesse o Menu Terminais</h4>
                        <p className="text-sm text-muted-foreground">
                          No menu lateral, clique em "Terminais" e depois em "Novo Terminal".
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Preencha as Informações</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li><strong>Nome do Terminal:</strong> Identifique onde ele será instalado (ex: "Recepção Principal")</li>
                          <li><strong>Campanha:</strong> Selecione qual campanha esse terminal irá exibir</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Credenciais Geradas Automaticamente</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          O sistema gera automaticamente:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li><strong>E-mail:</strong> term[número]@beend.app</li>
                          <li><strong>Senha padrão:</strong> term123</li>
                          <li>Você pode alterar a senha a qualquer momento</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        4
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Instale no Tablet</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Para instalar em um tablet Android:
                        </p>
                        <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                          <li>Baixe o APK do link: <code className="bg-muted px-1 py-0.5 rounded">https://sistema.beend.tech/BeendSurvey.apk</code></li>
                          <li>Instale o aplicativo no tablet</li>
                          <li>Faça login com as credenciais do terminal</li>
                          <li>O terminal ficará em modo quiosque exibindo a pesquisa</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Informação Importante
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Os terminais precisam estar conectados à internet para funcionar. As respostas são enviadas em tempo real para o servidor.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Limites e Restrições */}
            <section id="limits">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings className="h-6 w-6 text-orange-600" />
                    <CardTitle>Limites e Restrições</CardTitle>
                  </div>
                  <CardDescription>
                    Entenda os limites da sua conta e como ampliá-los
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Terminais</h4>
                        <Badge>Variável</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        O número de terminais permitidos varia por conta. Você pode ver seu limite na página de Terminais.
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        Padrão: 1 terminal por conta
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Campanhas</h4>
                        <Badge variant="secondary">Ilimitado</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Você pode criar quantas campanhas quiser. Cada campanha pode ter múltiplas perguntas e tipos diferentes.
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Respostas</h4>
                        <Badge variant="secondary">Ilimitado</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Não há limite para o número de respostas que você pode coletar. Todos os dados ficam armazenados permanentemente.
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Perguntas por Campanha</h4>
                        <Badge variant="secondary">Ilimitado</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Cada campanha pode ter quantas perguntas você precisar, de qualquer tipo disponível.
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Como Aumentar Limites</h4>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Para aumentar o número de terminais permitidos, entre em contato com o administrador do sistema através do e-mail: <strong>canalbackeend@gmail.com</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Como Interpretar os Dados */}
            <section id="analytics">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                    <CardTitle>Como Interpretar os Dados</CardTitle>
                  </div>
                  <CardDescription>
                    Entenda as métricas e relatórios do seu dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="nps">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Badge>NPS</Badge>
                          Net Promoter Score
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          O NPS mede a lealdade dos clientes em uma escala de 0 a 10:
                        </p>
                        <div className="space-y-2 ml-4">
                          <div className="flex items-start gap-2">
                            <Badge variant="destructive" className="mt-1">0-6</Badge>
                            <div>
                              <p className="font-semibold text-sm">Detratores</p>
                              <p className="text-xs text-muted-foreground">Clientes insatisfeitos que podem prejudicar sua marca</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Badge className="mt-1 bg-yellow-600">7-8</Badge>
                            <div>
                              <p className="font-semibold text-sm">Passivos</p>
                              <p className="text-xs text-muted-foreground">Clientes satisfeitos mas não leais</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Badge className="mt-1 bg-green-600">9-10</Badge>
                            <div>
                              <p className="font-semibold text-sm">Promotores</p>
                              <p className="text-xs text-muted-foreground">Clientes leais que recomendam sua empresa</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-muted p-3 rounded-lg mt-4">
                          <p className="text-sm font-semibold mb-1">Cálculo do NPS:</p>
                          <p className="text-xs text-muted-foreground">
                            NPS = % Promotores - % Detratores
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Resultado de -100 a +100. Acima de 50 é considerado excelente.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="smile">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Badge>SMILE</Badge>
                          Satisfação com Emojis
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          A escala SMILE usa 5 níveis de satisfação representados por emojis:
                        </p>
                        <div className="grid grid-cols-5 gap-2 my-4">
                          <div className="text-center p-2 border rounded">
                            <div className="text-2xl mb-1">😢</div>
                            <p className="text-xs font-semibold">Péssimo</p>
                            <p className="text-xs text-muted-foreground">1</p>
                          </div>
                          <div className="text-center p-2 border rounded">
                            <div className="text-2xl mb-1">😟</div>
                            <p className="text-xs font-semibold">Ruim</p>
                            <p className="text-xs text-muted-foreground">2</p>
                          </div>
                          <div className="text-center p-2 border rounded">
                            <div className="text-2xl mb-1">😐</div>
                            <p className="text-xs font-semibold">Regular</p>
                            <p className="text-xs text-muted-foreground">3</p>
                          </div>
                          <div className="text-center p-2 border rounded">
                            <div className="text-2xl mb-1">😊</div>
                            <p className="text-xs font-semibold">Bom</p>
                            <p className="text-xs text-muted-foreground">4</p>
                          </div>
                          <div className="text-center p-2 border rounded">
                            <div className="text-2xl mb-1">😁</div>
                            <p className="text-xs font-semibold">Excelente</p>
                            <p className="text-xs text-muted-foreground">5</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          A média geral exibida no dashboard é calculada convertendo os emojis em números (1 a 5) e tirando a média de todas as respostas.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="multiple-choice">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Badge>MÚLTIPLA ESCOLHA</Badge>
                          Interpretação de Percentuais
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-2">
                          Para perguntas de múltipla escolha, os percentuais são calculados de forma diferente:
                        </p>
                        <div className="space-y-3">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-semibold mb-1">Escolha Única (SINGLE_CHOICE):</p>
                            <p className="text-xs text-muted-foreground">
                              Base = número de pessoas que responderam<br />
                              Exemplo: 100 pessoas, 30 escolheram opção A = 30%
                            </p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-semibold mb-1">Múltipla Escolha (MULTIPLE_CHOICE):</p>
                            <p className="text-xs text-muted-foreground">
                              Base = total de seleções feitas (não pessoas)<br />
                              Exemplo: 100 pessoas fizeram 250 seleções totais<br />
                              Se 50 seleções foram da opção A = 50/250 = 20%
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground italic mt-2">
                          Isso permite ver a proporção real de cada opção entre todas as escolhas feitas.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="custom-colors">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">🎨 NOVO</Badge>
                          Cores Personalizadas nas Opções
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-2">
                          As cores personalizadas que você define para as opções de <strong>Escolha Única</strong> e <strong>Múltipla Escolha</strong> aparecem em diferentes partes do sistema:
                        </p>
                        <div className="space-y-3">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                              📱 Pesquisas (WebView e Terminal)
                            </p>
                            <p className="text-xs text-muted-foreground">
                              • As cores aparecem nas <strong>bordas e texto</strong> das opções quando selecionadas<br />
                              • Opções não selecionadas ficam em cinza<br />
                              • Ajuda a criar identidade visual para suas opções
                            </p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                              📊 Dashboard e Relatórios
                            </p>
                            <p className="text-xs text-muted-foreground">
                              • As cores são usadas como <strong>background das barras de progresso</strong><br />
                              • Facilita a identificação visual rápida de cada opção<br />
                              • Mantém consistência em todos os gráficos
                            </p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                              💡 Dicas de Uso
                            </p>
                            <p className="text-xs text-muted-foreground">
                              • Use verde para opções positivas (ex: "Excelente", "Sim")<br />
                              • Use vermelho para opções negativas (ex: "Ruim", "Não")<br />
                              • Use amarelo para opções neutras (ex: "Regular", "Talvez")<br />
                              • Mantenha contraste adequado para facilitar a leitura
                            </p>
                          </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
                          <p className="text-xs text-blue-800 dark:text-blue-200">
                            <strong>Nota:</strong> As cores são salvas automaticamente ao criar ou editar uma campanha. Se uma opção não tiver cor definida, a cor padrão azul (#3b82f6) será aplicada.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="average">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Badge>MÉDIA GERAL</Badge>
                          Como é Calculada
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          A média geral exibida no dashboard é calculada apenas com perguntas de avaliação numérica:
                        </p>
                        <div className="space-y-2 ml-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Perguntas SMILE (1 a 5)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Perguntas SIMPLE_SMILE (1 a 4)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Perguntas SCALE (escala personalizada)</span>
                          </div>
                        </div>
                        <div className="bg-muted p-3 rounded-lg mt-3">
                          <p className="text-sm font-semibold mb-1">Importante:</p>
                          <p className="text-xs text-muted-foreground">
                            Perguntas NPS têm sua própria métrica e NÃO são incluídas na média geral, pois medem lealdade, não satisfação direta.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="reports">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Badge>RELATÓRIOS</Badge>
                          Exportação e Filtros
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Os relatórios permitem análise detalhada dos dados coletados:
                        </p>
                        <div className="space-y-2">
                          <div className="p-3 border rounded-lg">
                            <h5 className="font-semibold text-sm mb-1">Filtros de Data</h5>
                            <p className="text-xs text-muted-foreground">
                              Selecione intervalos de datas para analisar períodos específicos (últimos 7 dias, 30 dias, personalizado, etc.)
                            </p>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <h5 className="font-semibold text-sm mb-1">Filtro por Terminal</h5>
                            <p className="text-xs text-muted-foreground">
                              Visualize dados de um terminal específico ou de todos os terminais juntos
                            </p>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <h5 className="font-semibold text-sm mb-1">Exportar Excel</h5>
                            <p className="text-xs text-muted-foreground">
                              Baixe os dados em formato Excel para análise offline ou integração com outras ferramentas
                            </p>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <h5 className="font-semibold text-sm mb-1">Imprimir</h5>
                            <p className="text-xs text-muted-foreground">
                              Gere relatórios em PDF otimizados para impressão com todas as métricas e gráficos
                            </p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="sentiment">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Badge>ANÁLISE DE SENTIMENTO</Badge>
                          Identificação de Feedbacks
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          O sistema analisa automaticamente TODOS os comentários textuais para identificar sentimentos positivos e negativos:
                        </p>
                        <div className="space-y-3">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-semibold mb-1">Como Funciona:</p>
                            <p className="text-xs text-muted-foreground">
                              Utiliza dicionários de palavras em português (mais de 60 palavras positivas e 60 negativas) 
                              combinados com detecção de negações para classificar cada comentário como positivo, negativo ou neutro.
                            </p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-semibold mb-1">Comentários Analisados:</p>
                            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                              <li>Campos de texto livre (TEXT_INPUT)</li>
                              <li>Comentários opcionais em perguntas SMILE e SIMPLE_SMILE</li>
                              <li>Comentários opcionais em perguntas NPS</li>
                              <li>Comentários opcionais em perguntas de escolha única e múltipla</li>
                              <li>Comentários opcionais em perguntas de escala</li>
                            </ul>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                              Palavras-chave Customizadas
                            </p>
                            <p className="text-xs text-green-800 dark:text-green-200 mb-2">
                              Você pode adicionar palavras-chave específicas do seu negócio em <strong>Perfil → Análise de Sentimento</strong>.
                            </p>
                            <p className="text-xs text-green-800 dark:text-green-200">
                              Exemplo: Uma clínica pode adicionar "dor", "desconforto" como negativas e "alívio", "melhora" como positivas.
                            </p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-semibold mb-1">Visualização nos Relatórios:</p>
                            <p className="text-xs text-muted-foreground">
                              Os dashboards e relatórios mostram as porcentagens de sentimento (Positivo/Neutro/Negativo) 
                              e destacam comentários negativos como "Alertas - Pontos de Atenção" para ação imediata.
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground italic mt-2">
                          💡 Os terminais herdam automaticamente as palavras-chave do usuário proprietário da campanha.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </section>

            {/* Painel Individual dos Terminais */}
            <section id="terminal-panel">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-indigo-600" />
                    <CardTitle>Painel Individual dos Terminais</CardTitle>
                  </div>
                  <CardDescription>
                    Como os terminais acessam seus próprios dados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">
                    Cada terminal tem acesso a um painel exclusivo onde pode visualizar apenas suas próprias respostas e métricas.
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Acesso ao Painel</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        URL: <code className="bg-muted px-2 py-1 rounded">https://sistema.beend.tech/terminal-panel/login</code>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Faça login com o e-mail e senha do terminal.
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Funcionalidades Disponíveis</h4>
                      <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
                        <li><strong>Dashboard:</strong> Métricas, gráficos e análise de sentimento das respostas coletadas pelo terminal</li>
                        <li><strong>Respondentes:</strong> Lista de pessoas que responderam (com dados de contato se coletados)</li>
                        <li><strong>Relatórios:</strong> Relatórios completos com filtro de data, análise de sentimento e opção de imprimir</li>
                        <li><strong>Perfil:</strong> Visualizar informações do terminal e alterar senha</li>
                      </ul>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Restrições de Segurança</h4>
                      <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
                        <li>Cada terminal vê APENAS suas próprias respostas</li>
                        <li>Não pode criar ou editar campanhas</li>
                        <li>Não pode criar outros terminais</li>
                        <li>Acesso somente leitura aos dados (exceto trocar própria senha)</li>
                        <li>Não tem acesso ao painel administrativo principal</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Use Case</h4>
                    <p className="text-sm text-indigo-800 dark:text-indigo-200">
                      Ideal para dar acesso aos responsáveis por cada terminal (recepcionistas, gerentes de loja, etc.) para que possam acompanhar o desempenho local sem acesso aos dados de outros terminais.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* FAQ */}
            <section id="faq">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-6 w-6 text-pink-600" />
                    <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
                  </div>
                  <CardDescription>
                    Respostas para as dúvidas mais comuns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="faq1">
                      <AccordionTrigger>Posso editar uma campanha depois de criada?</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">
                          Sim! Você pode editar campanhas a qualquer momento. Porém, ao modificar as perguntas, todas as respostas anteriores serão excluídas para manter a integridade dos dados.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq2">
                      <AccordionTrigger>As respostas são enviadas em tempo real?</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">
                          Sim! As respostas aparecem imediatamente no dashboard assim que são enviadas. Os terminais precisam estar conectados à internet para enviar as respostas.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq3">
                      <AccordionTrigger>Posso usar a pesquisa sem terminal físico?</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          Sim! Cada campanha gera um link único que pode ser compartilhado por:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li>E-mail</li>
                          <li>WhatsApp</li>
                          <li>Redes sociais</li>
                          <li>QR Code</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-2">
                          O link está disponível na página de edição da campanha.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq4">
                      <AccordionTrigger>Como faço para exportar os dados?</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">
                          Acesse a seção "Relatórios" no Dashboard e clique em "Exportar Excel". Você receberá um arquivo Excel com todas as respostas, métricas e comentários do período selecionado.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq5">
                      <AccordionTrigger>Posso ter múltiplos terminais na mesma campanha?</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">
                          Sim! Você pode criar vários terminais vinculados à mesma campanha. Cada terminal terá suas próprias credenciais e poderá coletar respostas de forma independente. Todos os dados aparecem consolidados no dashboard principal.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq6">
                      <AccordionTrigger>Os dados dos respondentes são seguros?</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">
                          Sim! Todos os dados são armazenados de forma segura e criptografada. A plataforma está em conformidade com a LGPD (Lei Geral de Proteção de Dados). Você controla quais dados pessoais coletar (nome, e-mail, telefone) e pode personalizar o texto de privacidade exibido aos respondentes.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq7">
                      <AccordionTrigger>Posso alterar a senha de um terminal?</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          Sim! Existem duas formas:
                        </p>
                        <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                          <li><strong>Pelo Painel Administrativo:</strong> Vá em Terminais → Editar Terminal → Alterar Senha</li>
                          <li><strong>Pelo Painel do Terminal:</strong> O próprio terminal pode acessar seu painel e alterar a senha em Perfil → Alterar Senha</li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq8">
                      <AccordionTrigger>Como funciona o reset automático do Terminal V2?</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">
                          O Terminal V2 possui um sistema de reset por inatividade. Após 60 segundos sem interação do usuário, o terminal automaticamente volta para a tela inicial, pronto para a próxima pessoa. Isso garante que a pesquisa esteja sempre disponível.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq9">
                      <AccordionTrigger>Como adicionar palavras-chave para análise de sentimento?</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          O sistema já inclui mais de 60 palavras positivas e 60 negativas em português. Você pode adicionar palavras específicas do seu negócio:
                        </p>
                        <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                          <li>Acesse <strong>Perfil → Análise de Sentimento</strong></li>
                          <li>Digite a palavra desejada no campo apropriado (Positivas ou Negativas)</li>
                          <li>Clique em "Adicionar"</li>
                          <li>As palavras serão aplicadas automaticamente a todas as campanhas</li>
                        </ol>
                        <p className="text-sm text-muted-foreground mt-2">
                          Exemplos: Uma academia pode adicionar "cansado" como negativa e "energia" como positiva.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq10">
                      <AccordionTrigger>Quais comentários são analisados pelo sistema de sentimento?</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          O sistema analisa TODOS os campos de texto da pesquisa:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li>Perguntas de texto livre (TEXT_INPUT)</li>
                          <li>Comentários opcionais em perguntas SMILE e SIMPLE_SMILE</li>
                          <li>Comentários opcionais em perguntas NPS</li>
                          <li>Comentários opcionais em escolha única e múltipla</li>
                          <li>Comentários opcionais em perguntas de escala</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-2">
                          Isso garante que nenhum feedback textual passe despercebido na análise.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq11">
                      <AccordionTrigger>🎨 Como funcionam as cores personalizadas nas opções?</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          As cores personalizadas estão disponíveis para perguntas de <strong>Escolha Única</strong> e <strong>Múltipla Escolha</strong>:
                        </p>
                        <div className="space-y-2">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-semibold mb-1">Como configurar:</p>
                            <ol className="text-xs text-muted-foreground space-y-1 ml-4 list-decimal">
                              <li>Ao criar ou editar uma campanha, adicione uma pergunta de escolha</li>
                              <li>Ao lado de cada opção, você verá um seletor de cor (quadrado colorido)</li>
                              <li>Clique no seletor e escolha a cor desejada</li>
                              <li>A cor é salva automaticamente</li>
                            </ol>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-semibold mb-1">Onde as cores aparecem:</p>
                            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                              <li><strong>Pesquisas:</strong> Bordas e texto das opções selecionadas</li>
                              <li><strong>Dashboard:</strong> Background das barras de progresso</li>
                              <li><strong>Relatórios:</strong> Background das barras de progresso</li>
                            </ul>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          <strong>Dica:</strong> Use cores que façam sentido visual (verde = positivo, vermelho = negativo, etc.)
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </section>

            {/* Contato e Suporte */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2">
              <CardHeader>
                <CardTitle>Precisa de Mais Ajuda?</CardTitle>
                <CardDescription>
                  Nossa equipe está pronta para ajudar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-background rounded-lg border">
                    <h4 className="font-semibold mb-2">📧 E-mail</h4>
                    <a href="mailto:canalbackeend@gmail.com" className="text-blue-600 hover:underline">
                      canalbackeend@gmail.com
                    </a>
                  </div>
                  <div className="p-4 bg-background rounded-lg border">
                    <h4 className="font-semibold mb-2">💬 WhatsApp</h4>
                    <a href="https://wa.me/5561995957461" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      (61) 9 9595-7461
                    </a>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center pt-2">
                  Horário de atendimento: Segunda a Sexta, das 9h às 18h
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

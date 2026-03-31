'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Menu,
  X,
  Smartphone,
  Brain,
  Wifi,
  BarChart3,
  Shield,
  Monitor,
  ChevronRight,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Brain,
      title: 'Análise de Sentimento com IA',
      description: 'Algoritmo inteligente identifica automaticamente sentimentos positivos, negativos e neutros nos comentários, com suporte a personalização de palavras-chave.'
    },
    {
      icon: Wifi,
      title: 'Terminais Offline',
      description: 'Colete respostas mesmo sem conexão com a internet. Os dados são sincronizados automaticamente quando a conexão é restaurada.'
    },
    {
      icon: Smartphone,
      title: 'Multi-Dispositivo',
      description: 'Acesse via navegador, tablet, smartphone ou terminal dedicado. Interface responsiva e otimizada para todos os dispositivos.'
    },
    {
      icon: BarChart3,
      title: 'Relatórios em Tempo Real',
      description: 'Dashboards interativos com métricas NPS, distribuição de respostas e análises detalhadas. Exporte em PDF, CSV ou Excel.'
    },
    {
      icon: Shield,
      title: 'Segurança e LGPD',
      description: 'Proteção de dados conforme LGPD, com criptografia, controle de acesso e rastreamento completo de atividades.'
    },
    {
      icon: Monitor,
      title: 'Gestão de Múltiplos Terminais',
      description: 'Gerencie vários pontos de coleta simultaneamente, cada um com sua própria campanha e credenciais de acesso.'
    },
  ];

  const faqs = [
    {
      question: 'Como funciona o sistema de análise de sentimento?',
      answer: 'Nosso algoritmo de IA analisa automaticamente todos os comentários textuais, identificando sentimentos positivos, negativos e neutros. Você pode personalizar as palavras-chave para adaptar a análise ao seu negócio específico.'
    },
    {
      question: 'Os terminais funcionam sem internet?',
      answer: 'Sim! Os terminais podem coletar respostas offline e armazenam localmente até que a conexão seja restaurada. Quando online, todos os dados são sincronizados automaticamente com o servidor central.'
    },
    {
      question: 'Quais tipos de perguntas posso criar?',
      answer: 'Oferecemos diversos tipos: perguntas com emojis (Smile e Simple Smile), NPS (0-10), múltipla escolha, escolha única, escala personalizada e texto livre. Você pode combinar diferentes tipos em uma mesma pesquisa.'
    },
    {
      question: 'Como funciona o cálculo do NPS?',
      answer: 'O NPS é calculado automaticamente com base nas respostas de 0 a 10. Detratores (0-6), Passivos (7-8) e Promotores (9-10) são identificados e o score final é apresentado em um dashboard intuitivo.'
    },
    {
      question: 'Posso personalizar as cores e logo da pesquisa?',
      answer: 'Sim! Você pode personalizar o logotipo, cores dos botões de resposta e textos de privacidade (LGPD) para cada campanha, mantendo a identidade visual da sua marca.'
    },
    {
      question: 'Os dados estão protegidos conforme a LGPD?',
      answer: 'Completamente. Implementamos criptografia, controle de acesso baseado em funções, logs de atividade detalhados e consentimento explícito para coleta de dados pessoais opcionais (nome, telefone, email).'
    },
    {
      question: 'Como exporto os relatórios?',
      answer: 'Você pode exportar relatórios em três formatos: PDF (para apresentações), CSV (para análises customizadas) e Excel (com formatação preservada). A exportação inclui gráficos, tabelas e análises de sentimento.'
    },
    {
      question: 'Quantos terminais posso configurar?',
      answer: 'O número de terminais depende do seu plano. Cada terminal pode ser configurado com uma campanha específica e possui credenciais próprias de acesso para segurança.'
    },
    {
      question: 'Posso rastrear de onde vêm as respostas?',
      answer: 'Sim! O sistema registra a origem de cada resposta (web, terminal, QR code) e permite filtrar relatórios por terminal específico, facilitando análises por ponto de coleta.'
    },
    {
      question: 'Como funciona o suporte técnico?',
      answer: 'Oferecemos suporte via WhatsApp no (61) 9 9595-7461 e email canalbackeend@gmail.com. Nossa equipe está pronta para ajudar com dúvidas técnicas, configurações e treinamentos.'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/landing" className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="BeEnd Logo"
                width={180}
                height={45}
                className="h-10 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Recursos
              </a>
              <a href="#screenshots" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Sistema
              </a>
              <a href="#faq" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                FAQ
              </a>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="https://totem.beend.tech" target="_blank">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Acessar Sistema
                </Button>
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <a href="#features" className="block text-sm font-medium text-gray-700 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>
                Recursos
              </a>
              <a href="#screenshots" className="block text-sm font-medium text-gray-700 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>
                Sistema
              </a>
              <a href="#faq" className="block text-sm font-medium text-gray-700 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>
                FAQ
              </a>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  Login
                </Button>
              </Link>
              <Link href="https://totem.beend.tech" target="_blank" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                  Acessar Sistema
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              A Melhor Solução de
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Pesquisa de Satisfação </span>
              do Mercado
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Plataforma completa com análise de sentimento por IA, terminais offline, multi-dispositivos e relatórios em tempo real. Tudo em português e totalmente adaptado para o Brasil.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
                <Wifi className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Funciona Offline</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
                <Brain className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">IA de Sentimento</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Conforme LGPD</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="https://totem.beend.tech" target="_blank">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8">
                  Começar Agora
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Conhecer Recursos
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Recursos que Fazem a Diferença
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tudo o que você precisa para coletar, analisar e agir com base no feedback dos seus clientes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section id="screenshots" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Conheça o Sistema por Dentro
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Interface moderna, intuitiva e totalmente em português
            </p>
          </div>

          <div className="space-y-24">
            {/* Dashboard Screenshot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Dashboard Administrativo
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Visualize todas as métricas importantes em um só lugar. NPS, análise de sentimento, distribuição de respostas e muito mais.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Métricas em tempo real com atualização automática</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Cards visuais para NPS (Promotores, Detratores, Passivos)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Análise de sentimento com IA integrada</span>
                  </li>
                </ul>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
                <Image
                  src="/landing/dashboard-screenshot.png"
                  alt="Dashboard Administrativo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Mobile Survey Screenshot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="order-2 lg:order-1 relative h-[500px] lg:h-[600px] flex items-center justify-center">
                <div className="relative w-[300px] h-full rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src="/landing/mobile-survey-screenshot.png"
                    alt="Pesquisa Mobile"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Pesquisas Responsivas
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Interface otimizada para smartphones, tablets e desktop. Seus clientes respondem de qualquer dispositivo.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Perguntas com emojis para feedback visual</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Avaliações por estrelas e escalas personalizadas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Design limpo e intuitivo para alta taxa de conclusão</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Reports Screenshot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Relatórios Detalhados
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Análises profundas com gráficos interativos e múltiplas opções de exportação.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Gráficos de linha, pizza e barras para visualização clara</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Exportação em PDF, CSV e Excel com um clique</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Filtros por período e terminal específico</span>
                  </li>
                </ul>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
                <Image
                  src="/landing/reports-screenshot.png"
                  alt="Relatórios Detalhados"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Terminal Kiosk Screenshot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="order-2 lg:order-1 relative aspect-video rounded-xl overflow-hidden shadow-2xl">
                <Image
                  src="/landing/terminal-kiosk-screenshot.png"
                  alt="Terminal Kiosk"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Terminais Físicos (Totens)
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Coleta de feedback em pontos físicos com interface otimizada para toque e modo offline.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Botões grandes e intuitivos para fácil interação</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Funciona sem internet, sincroniza automaticamente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Gerenciamento remoto de múltiplos terminais</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-gray-600">
              Tudo o que você precisa saber sobre o sistema
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                <AccordionTrigger className="text-left text-lg font-semibold hover:text-blue-600">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para Melhorar a Experiência dos Seus Clientes?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Comece agora mesmo a coletar feedback inteligente com a melhor plataforma do mercado
          </p>
          <Link href="https://totem.beend.tech" target="_blank">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Acessar Sistema
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Logo e Descrição */}
            <div>
              <Image
                src="/logo-light.png"
                alt="BeEnd Logo"
                width={180}
                height={45}
                className="h-10 w-auto mb-4 brightness-200"
              />
              <p className="text-sm text-gray-400">
                Plataforma completa de pesquisa de satisfação com IA, terminais offline e análise em tempo real.
              </p>
            </div>

            {/* Links Rápidos */}
            <div>
              <h3 className="font-semibold text-white mb-4">Links Rápidos</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Recursos
                  </a>
                </li>
                <li>
                  <a href="#screenshots" className="hover:text-white transition-colors">
                    Sistema
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h3 className="font-semibold text-white mb-4">Contato</h3>
              <ul className="space-y-2 text-sm">
                <li>WhatsApp: (61) 9 9595-7461</li>
                <li>Email: canalbackeend@gmail.com</li>
                <li>Brasília/DF - Brasil</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2025 Back&end - Soluções Inteligentes. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

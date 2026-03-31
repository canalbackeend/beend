'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  Building2,
  FileText,
  DollarSign,
  Image as ImageIcon,
  Settings,
  User,
  Calendar,
  X,
  Upload,
  FolderOpen,
} from 'lucide-react';

interface ProposalItem {
  id?: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  shippingValue: number;
}

interface ProposalImage {
  id?: string;
  imageUrl: string;
  caption: string;
  imageType: string;
}

interface LibraryImage {
  id: string;
  imageUrl: string;
  caption: string | null;
  cloudStoragePath: string | null;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  generalDescription: string | null;
  implementationReqs: string | null;
  technicalSupport: string | null;
  warranty: string | null;
  systemFeatures: string | null;
  paymentTerms: string | null;
  finalConsiderations: string | null;
  defaultItems: any;
}

const SYSTEM_IMAGES = [
  { url: '/landing/totem-tablet.jpg', caption: 'Tablet com Pesquisa', type: 'system_screenshot' },
  { url: '/landing/totens-personalizados.jpg', caption: 'Totens Personalizados', type: 'system_screenshot' },
  { url: '/landing/totens-clientes.jpg', caption: 'Totens para Clientes', type: 'system_screenshot' },
  { url: '/landing/terminal-login.jpg', caption: 'Terminal Login', type: 'system_screenshot' },
  { url: '/landing/terminal-pesquisa.jpg', caption: 'Terminal de Pesquisa', type: 'system_screenshot' },
];

// Funções de máscara
const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
};

// Função para formatar valor monetário no padrão brasileiro
const formatCurrency = (value: string) => {
  // Remove tudo que não é número
  let digits = value.replace(/\D/g, '');
  
  // Limita a 12 dígitos (até 9.999.999.999,99)
  if (digits.length > 12) digits = digits.slice(0, 12);
  
  // Se não tem dígitos, retorna vazio
  if (!digits) return '';
  
  // Converte para número (centavos)
  const number = parseInt(digits, 10);
  
  // Formata como moeda brasileira
  const formatted = (number / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatted;
};

// Função para converter valor formatado para número
const parseCurrency = (value: string): number => {
  if (!value) return 0;
  // Remove pontos de milhar e troca vírgula por ponto
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

// Descrições padrão dos produtos
const DEFAULT_DESCRIPTIONS = {
  totemChao: `Totem de chão (tipo pedestal) para display de 10.1" da marca Amazon Fire HD 10, com processador octa-core, tela full HD, estrutura robusta em aço cortado a laser (imagem anexo) garantindo padrão, tranca (Imagem anexo) dimensões 112cm x 21cm x 36cm (imagem anexo) com toda a parte elétrica, pés de silicone tipo ventosa, aplicativo dedicado e software completo de gerenciamento + personalização (adesivagem).`,
  totemMesa8: `Totem de mesa (tipo pedestal) para display de 8" da marca Amazon Fire 8, com processador octa-core, tela HD, estrutura robusta em plástico PLA (imagem anexo) com toda a parte elétrica, aplicativo dedicado e software completo de gerenciamento + personalização (adesivagem).`,
  totemMesa10: `Totem de mesa (tipo pedestal) para display de 10" da marca Amazon Fire HD 10, com processador octa-core, tela full HD, estrutura robusta em plástico PLA (imagem anexo) com toda a parte elétrica, aplicativo dedicado e software completo de gerenciamento + personalização (adesivagem).`,
};

export function ProposalForm({ proposalId }: { proposalId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [fetchingCep, setFetchingCep] = useState(false);
  
  // Biblioteca de imagens
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');

  // Dados do cliente
  const [clientName, setClientName] = useState('');
  const [clientContactPerson, setClientContactPerson] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCep, setClientCep] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // Datas
  const [proposalDate, setProposalDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [status, setStatus] = useState('DRAFT');

  // Template
  const [templateId, setTemplateId] = useState('');

  // Textos
  const [greeting, setGreeting] = useState('');
  const [generalDescription, setGeneralDescription] = useState('');
  const [implementationReqs, setImplementationReqs] = useState('');
  const [technicalSupport, setTechnicalSupport] = useState('');
  const [warranty, setWarranty] = useState('');
  const [systemFeatures, setSystemFeatures] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [finalConsiderations, setFinalConsiderations] = useState('');

  // Valores
  const [planType, setPlanType] = useState('');
  const [planValue, setPlanValue] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [shippingValue, setShippingValue] = useState('');

  // Assinatura
  const [signatureName, setSignatureName] = useState('');
  const [signaturePhone, setSignaturePhone] = useState('');

  // Itens e Imagens
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [images, setImages] = useState<ProposalImage[]>([]);

  useEffect(() => {
    fetchTemplates();
    fetchLibraryImages();
    if (proposalId) {
      fetchProposal();
    } else {
      // Valores padrão para nova proposta
      setGeneralDescription(`O sistema visa automatizar os processos de pesquisa de satisfação de clientes para o recolhimento de informações necessárias, possibilitando assim uma melhora na qualidade dos serviços, padronizando o atendimento além de oferecer um controle completo sobre o seu cliente através de relatórios.

O objetivo deste software de gestão é criar várias campanhas de maneira simples e prática através de perguntas e respostas intuitivas, podendo assim serem usados vários terminais em uma só conta. Consequentemente o mesmo gerará relatórios que irão ajudar no inter-relacionamento com os seus clientes e formará base para um futuro promissor para a organização.`);
      
      setImplementationReqs(`A implementação poderá ser realizada nas seguintes formas:
• Através da aquisição dos nossos totens de pesquisa da Back&end - Soluções Inteligentes que é composto por: Totem de pesquisa + Apps + Painel administrativo.

Os custos de implementação variam conforme os equipamentos que a empresa já possui no local.`);
      
      setTechnicalSupport(`Suporte técnico será fornecido para configuração, assistência humanizada dentro do período de assinatura em horário comercial.`);
      
      setWarranty(`Todos os nossos tablets são adquiridos com garantia extendida, sempre temos um ou dois sobressalentes para eventual troca em quanto são efetuados reparos ou trocas.`);
      
      setSystemFeatures(`• 3 tipos de campanhas diferentes, NPS, SMILE e QUIZ
• Receba feedback dos seus clientes em tempo real
• Gerencie perguntas e respostas de forma simples
• Vários terminais ao mesmo tempo de forma geral ou individual
• Gráfico de evolução
• Relatórios por data e horários
• Lista de clientes cadastrados (Caso haja um formulário de cadastro)
• Exportação de dados em PDF, Excel e CSV
• Gerencie várias campanhas simultâneas
• Acesso individual para cada terminal
• Análise de sentimento com IA`);
      
      setPaymentTerms(`Garantia: 2 Anos de Garantia
Forma de pagamento: Boleto, PIX ou Transferência.
Validade da proposta: 10 dias.`);
      
      setFinalConsiderations(`O Sistema ora proposto é passível de expansão/customização e adaptável às necessidades específicas da área de negócios do cliente.`);
      
      setPlanType('Totem PRO Mensal');
      setPlanValue('99,90');
      setPlanDescription('Plano Mensal de uso do sistema de pesquisa');
      
      // Validade padrão de 10 dias
      const validDate = new Date();
      validDate.setDate(validDate.getDate() + 10);
      setValidUntil(validDate.toISOString().split('T')[0]);
    }
  }, [proposalId]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/proposal-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchLibraryImages = async () => {
    try {
      const response = await fetch('/api/proposals/library-images');
      if (response.ok) {
        const data = await response.json();
        setLibraryImages(data);
      }
    } catch (error) {
      console.error('Error fetching library images:', error);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione apenas arquivos de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB');
      return;
    }

    try {
      setUploading(true);

      // 1. Obter URL de upload
      const uploadResponse = await fetch('/api/proposals/library-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-upload-url',
          fileName: `${Date.now()}-${file.name}`,
          contentType: file.type,
        }),
      });

      if (!uploadResponse.ok) throw new Error('Erro ao obter URL de upload');
      const { uploadUrl, cloudStoragePath } = await uploadResponse.json();

      // 2. Fazer upload para S3
      const s3Response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!s3Response.ok) throw new Error('Erro ao fazer upload');

      // 3. Salvar na biblioteca
      const saveResponse = await fetch('/api/proposals/library-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          cloudStoragePath,
          caption: uploadCaption || file.name.replace(/\.[^/.]+$/, ''),
        }),
      });

      if (!saveResponse.ok) throw new Error('Erro ao salvar imagem');
      
      const newImage = await saveResponse.json();
      setLibraryImages([newImage, ...libraryImages]);
      setUploadCaption('');
      toast.success('Imagem adicionada à biblioteca');
      
      // Resetar input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const addLibraryImage = (img: LibraryImage) => {
    if (images.find(i => i.imageUrl === img.imageUrl)) {
      toast.error('Imagem já adicionada');
      return;
    }
    setImages([...images, {
      imageUrl: img.imageUrl,
      caption: img.caption || 'Imagem personalizada',
      imageType: 'custom',
    }]);
    toast.success('Imagem adicionada à proposta');
  };

  const deleteLibraryImage = async (id: string) => {
    try {
      const response = await fetch(`/api/proposals/library-images/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setLibraryImages(libraryImages.filter(img => img.id !== id));
        toast.success('Imagem removida da biblioteca');
      }
    } catch (error) {
      toast.error('Erro ao remover imagem');
    }
  };

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proposals/${proposalId}`);
      if (!response.ok) throw new Error('Proposta não encontrada');
      const data = await response.json();

      setClientName(data.clientName || '');
      setClientContactPerson(data.clientContactPerson || '');
      setClientEmail(data.clientEmail || '');
      setClientPhone(data.clientPhone || '');
      setClientCep(data.clientCep || '');
      setClientAddress(data.clientAddress || '');
      setProposalDate(data.proposalDate ? data.proposalDate.split('T')[0] : '');
      setValidUntil(data.validUntil ? data.validUntil.split('T')[0] : '');
      setStatus(data.status || 'DRAFT');
      setTemplateId(data.templateId || '');
      setGreeting(data.greeting || '');
      setGeneralDescription(data.generalDescription || '');
      setImplementationReqs(data.implementationReqs || '');
      setTechnicalSupport(data.technicalSupport || '');
      setWarranty(data.warranty || '');
      setSystemFeatures(data.systemFeatures || '');
      setPaymentTerms(data.paymentTerms || '');
      setFinalConsiderations(data.finalConsiderations || '');
      setPlanType(data.planType || '');
      // Formatar valores monetários para exibição
      setPlanValue(data.planValue ? formatCurrency((Number(data.planValue) * 100).toFixed(0)) : '');
      setPlanDescription(data.planDescription || '');
      setShippingValue(data.shippingValue ? formatCurrency((Number(data.shippingValue) * 100).toFixed(0)) : '');
      setSignatureName(data.signatureName || '');
      setSignaturePhone(data.signaturePhone || '');
      setItems(data.items?.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        shippingValue: Number(item.shippingValue || 0),
      })) || []);
      setImages(data.images?.map((img: any) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        caption: img.caption || '',
        imageType: img.imageType || '',
      })) || []);
    } catch (error) {
      toast.error('Erro ao carregar proposta');
      router.push('/proposals');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: Template) => {
    if (template.generalDescription) setGeneralDescription(template.generalDescription);
    if (template.implementationReqs) setImplementationReqs(template.implementationReqs);
    if (template.technicalSupport) setTechnicalSupport(template.technicalSupport);
    if (template.warranty) setWarranty(template.warranty);
    if (template.systemFeatures) setSystemFeatures(template.systemFeatures);
    if (template.paymentTerms) setPaymentTerms(template.paymentTerms);
    if (template.finalConsiderations) setFinalConsiderations(template.finalConsiderations);
    if (template.defaultItems && Array.isArray(template.defaultItems)) {
      setItems(template.defaultItems.map((item: any) => ({
        name: item.name || '',
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        subtotal: (item.quantity || 1) * (item.unitPrice || 0),
        shippingValue: item.shippingValue || 0,
      })));
    }
    toast.success(`Template "${template.name}" aplicado`);
  };

  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    if (id) {
      const template = templates.find(t => t.id === id);
      if (template) {
        applyTemplate(template);
      }
    }
  };

  const addItem = () => {
    setItems([...items, {
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
      shippingValue: 0,
    }]);
  };

  const updateItem = (index: number, field: keyof ProposalItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].subtotal = newItems[index].quantity * newItems[index].unitPrice;
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addSystemImage = (img: typeof SYSTEM_IMAGES[0]) => {
    if (images.find(i => i.imageUrl === img.url)) {
      toast.error('Imagem já adicionada');
      return;
    }
    setImages([...images, {
      imageUrl: img.url,
      caption: img.caption,
      imageType: img.type,
    }]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    let total = 0;
    items.forEach(item => { 
      total += item.subtotal; 
      total += item.shippingValue || 0;
    });
    if (shippingValue) total += parseCurrency(shippingValue);
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        clientName,
        clientContactPerson,
        clientEmail,
        clientPhone,
        clientCep,
        clientAddress,
        proposalDate,
        validUntil: validUntil || null,
        status,
        templateId: templateId || null,
        greeting,
        generalDescription,
        implementationReqs,
        technicalSupport,
        warranty,
        systemFeatures,
        paymentTerms,
        finalConsiderations,
        planType,
        planValue: planValue ? parseCurrency(planValue) : null,
        planDescription,
        shippingValue: shippingValue ? parseCurrency(shippingValue) : null,
        signatureName,
        signaturePhone,
        items,
        images,
      };

      const url = proposalId ? `/api/proposals/${proposalId}` : '/api/proposals';
      const method = proposalId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      toast.success(proposalId ? 'Proposta atualizada!' : 'Proposta criada!');
      router.push('/proposals');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar proposta');
    } finally {
      setSaving(false);
    }
  };

  const fetchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    
    try {
      setFetchingCep(true);
      const response = await fetch(`/api/cep?cep=${cleanCep}`);
      if (response.ok) {
        const data = await response.json();
        if (data.address || data.city) {
          const addressParts: string[] = [];
          if (data.address) addressParts.push(data.address);
          if (data.neighborhood) addressParts.push(data.neighborhood);
          if (data.city) addressParts.push(data.city);
          if (data.state) addressParts.push(data.state);
          setClientAddress(addressParts.join(', '));
          toast.success('Endereço preenchido automaticamente');
        } else {
          toast.error('CEP não encontrado');
        }
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      console.error('Error fetching CEP:', error);
      toast.error('Erro ao buscar CEP');
    } finally {
      setFetchingCep(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/proposals">
            <Button type="button" variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {proposalId ? 'Editar Proposta' : 'Nova Proposta'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {proposalId ? 'Atualize os dados da proposta' : 'Preencha os dados para criar uma nova proposta'}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Proposta
        </Button>
      </div>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Usar Template</Label>
              <Select value={templateId || 'none'} onValueChange={(v) => handleTemplateChange(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem template</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {proposalId && (
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Rascunho</SelectItem>
                    <SelectItem value="SENT">Enviada</SelectItem>
                    <SelectItem value="ACCEPTED">Aceita</SelectItem>
                    <SelectItem value="REJECTED">Rejeitada</SelectItem>
                    <SelectItem value="EXPIRED">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dados do Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Dados do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome da Empresa/Cliente *</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: NORTESHOPPING"
                required
              />
            </div>
            <div>
              <Label>Pessoa de Contato</Label>
              <Input
                value={clientContactPerson}
                onChange={(e) => setClientContactPerson(e.target.value)}
                placeholder="Ex: Felipe"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="email@empresa.com"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={clientPhone}
                onChange={(e) => setClientPhone(formatPhone(e.target.value))}
                placeholder="(61) 99999-9999"
                maxLength={15}
              />
            </div>
            <div>
              <Label>CEP</Label>
              <div className="relative">
                <Input
                  value={clientCep}
                  onChange={(e) => {
                    const formatted = formatCep(e.target.value);
                    setClientCep(formatted);
                    if (formatted.replace(/\D/g, '').length === 8) {
                      fetchCep(formatted);
                    }
                  }}
                  placeholder="00000-000"
                  maxLength={9}
                  className={fetchingCep ? 'pr-10' : ''}
                />
                {fetchingCep && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>Endereço</Label>
              <Input
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Rua, Bairro, Cidade - UF"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Data da Proposta</Label>
              <Input
                type="date"
                value={proposalDate}
                onChange={(e) => setProposalDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Validade</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Textos da Proposta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Conteúdo da Proposta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Saudação Personalizada</Label>
            <Input
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Ex: Prezado Felipe! (deixe vazio para usar padrão)"
            />
          </div>
          <div>
            <Label>Descrição Geral</Label>
            <Textarea
              value={generalDescription}
              onChange={(e) => setGeneralDescription(e.target.value)}
              rows={5}
              placeholder="Descrição geral do sistema e objetivos..."
            />
          </div>
          <div>
            <Label>Requisitos de Implementação</Label>
            <Textarea
              value={implementationReqs}
              onChange={(e) => setImplementationReqs(e.target.value)}
              rows={4}
              placeholder="Como será feita a implementação..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Suporte Técnico</Label>
              <Textarea
                value={technicalSupport}
                onChange={(e) => setTechnicalSupport(e.target.value)}
                rows={3}
                placeholder="Informações sobre suporte..."
              />
            </div>
            <div>
              <Label>Garantia</Label>
              <Textarea
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                rows={3}
                placeholder="Informações sobre garantia..."
              />
            </div>
          </div>
          <div>
            <Label>Recursos do Sistema (um por linha)</Label>
            <Textarea
              value={systemFeatures}
              onChange={(e) => setSystemFeatures(e.target.value)}
              rows={6}
              placeholder="• Recurso 1
• Recurso 2
• Recurso 3..."
            />
          </div>
          <div>
            <Label>Forma de Pagamento e Condições</Label>
            <Textarea
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              rows={3}
              placeholder="Garantia, formas de pagamento, validade..."
            />
          </div>
          <div>
            <Label>Considerações Finais</Label>
            <Textarea
              value={finalConsiderations}
              onChange={(e) => setFinalConsiderations(e.target.value)}
              rows={2}
              placeholder="Texto de fechamento..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Valores e Plano */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            Valores e Plano
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tipo de Plano</Label>
              <Input
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                placeholder="Ex: Totem PRO Mensal"
              />
            </div>
            <div>
              <Label>Valor Mensal (R$)</Label>
              <Input
                value={planValue}
                onChange={(e) => setPlanValue(formatCurrency(e.target.value))}
                placeholder="99,90"
              />
            </div>
            <div>
              <Label>Descrição do Plano</Label>
              <Input
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="Plano Mensal de uso..."
              />
            </div>
          </div>

          {/* Itens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Itens/Produtos</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                <Plus className="h-4 w-4" /> Adicionar Item
              </Button>
            </div>
            
            {items.length > 0 && (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div className="md:col-span-2">
                        <Label className="text-xs">Nome do Produto</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          placeholder="Totem de chão..."
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Qtd</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Valor Unit. (R$)</Label>
                        <Input
                          value={item.unitPrice ? formatCurrency((item.unitPrice * 100).toFixed(0)) : ''}
                          onChange={(e) => updateItem(index, 'unitPrice', parseCurrency(formatCurrency(e.target.value)))}
                          placeholder="1.500,00"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Frete (R$)</Label>
                        <Input
                          value={item.shippingValue ? formatCurrency((item.shippingValue * 100).toFixed(0)) : ''}
                          onChange={(e) => updateItem(index, 'shippingValue', parseCurrency(formatCurrency(e.target.value)))}
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Descrição</Label>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => updateItem(index, 'description', DEFAULT_DESCRIPTIONS.totemChao)}
                          >
                            Chão
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => updateItem(index, 'description', DEFAULT_DESCRIPTIONS.totemMesa8)}
                          >
                            Mesa 8"
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => updateItem(index, 'description', DEFAULT_DESCRIPTIONS.totemMesa10)}
                          >
                            Mesa 10"
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        rows={3}
                        placeholder="Descrição detalhada do produto..."
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">Subtotal: </span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}
                        </span>
                        {item.shippingValue > 0 && (
                          <span className="text-muted-foreground ml-2">
                            + Frete: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.shippingValue)}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Item: </span>
                        <span className="font-semibold text-primary">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal + (item.shippingValue || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label>Frete Adicional (R$)</Label>
              <Input
                value={shippingValue}
                onChange={(e) => setShippingValue(formatCurrency(e.target.value))}
                placeholder="0,00"
              />
              <p className="text-xs text-muted-foreground mt-1">Frete extra além do frete de cada item</p>
            </div>
            <div className="flex items-end">
              <div className="p-4 bg-primary/10 rounded-lg w-full">
                <span className="text-sm text-muted-foreground">Total da Proposta:</span>
                <p className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Imagens do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-5 w-5" />
            Imagens da Proposta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Imagens do Sistema */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Imagens do Sistema (Demonstrativo)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SYSTEM_IMAGES.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => addSystemImage(img)}
                  className={`p-2 border-2 rounded-lg transition-all hover:border-primary ${
                    images.find(i => i.imageUrl === img.url)
                      ? 'border-primary bg-primary/10'
                      : 'border-muted'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.caption}
                    className="w-full h-20 object-cover rounded"
                  />
                  <p className="text-xs mt-1 truncate">{img.caption}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Biblioteca de Imagens Personalizadas */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">
                Minhas Imagens (Biblioteca)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLibrary(!showLibrary)}
                className="gap-1"
              >
                <FolderOpen className="h-4 w-4" />
                {showLibrary ? 'Ocultar' : 'Ver'} Biblioteca ({libraryImages.length})
              </Button>
            </div>

            {showLibrary && (
              <div className="space-y-4">
                {/* Upload de nova imagem */}
                <div className="flex gap-3 items-end p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block">Legenda (opcional)</Label>
                    <Input
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                      placeholder="Ex: Totem modelo X"
                      disabled={uploading}
                    />
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadImage}
                      className="hidden"
                      id="library-image-upload"
                      disabled={uploading}
                    />
                    <label htmlFor="library-image-upload">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="gap-1 cursor-pointer"
                        disabled={uploading}
                        asChild
                      >
                        <span>
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {uploading ? 'Enviando...' : 'Enviar Imagem'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

                {/* Lista de imagens da biblioteca */}
                {libraryImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {libraryImages.map((img) => (
                      <div
                        key={img.id}
                        className={`group relative p-2 border-2 rounded-lg transition-all ${
                          images.find(i => i.imageUrl === img.imageUrl)
                            ? 'border-primary bg-primary/10'
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => addLibraryImage(img)}
                          className="w-full"
                        >
                          <img
                            src={img.imageUrl}
                            alt={img.caption || 'Imagem'}
                            className="w-full h-20 object-cover rounded"
                          />
                          <p className="text-xs mt-1 truncate">{img.caption || 'Sem legenda'}</p>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); deleteLibraryImage(img.id); }}
                          className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                          title="Remover da biblioteca"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma imagem na biblioteca. Envie suas próprias imagens acima.
                  </p>
                )}
              </div>
            )}
          </div>

          {images.length > 0 && (
            <div className="space-y-2">
              <Label>Imagens Selecionadas:</Label>
              <div className="flex flex-wrap gap-2">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="relative group bg-muted rounded-lg p-2 flex items-center gap-2"
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.caption}
                      className="h-10 w-16 object-cover rounded"
                    />
                    <span className="text-sm">{img.caption}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assinatura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome do Responsável</Label>
              <Input
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Seu nome (deixe vazio para usar padrão)"
              />
            </div>
            <div>
              <Label>Telefone de Contato</Label>
              <Input
                value={signaturePhone}
                onChange={(e) => setSignaturePhone(formatPhone(e.target.value))}
                placeholder="(61) 99999-9999"
                maxLength={15}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar (Mobile) */}
      <div className="flex justify-end pb-6">
        <Button type="submit" disabled={saving} size="lg" className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Proposta
        </Button>
      </div>
    </form>
  );
}

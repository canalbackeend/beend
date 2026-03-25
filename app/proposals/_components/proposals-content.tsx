'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  FileText,
  Copy,
  Edit,
  Trash2,
  Mail,
  Download,
  Eye,
  LayoutTemplate,
  Calendar,
  Building2,
  DollarSign,
  Loader2,
} from 'lucide-react';

interface Proposal {
  id: string;
  proposalNumber: string;
  clientName: string;
  clientContactPerson: string | null;
  clientEmail: string | null;
  status: string;
  proposalDate: string;
  validUntil: string | null;
  totalValue: string | null;
  template: { name: string } | null;
  user: { name: string; companyName: string | null } | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-gray-500' },
  SENT: { label: 'Enviada', color: 'bg-blue-500' },
  ACCEPTED: { label: 'Aceita', color: 'bg-green-500' },
  REJECTED: { label: 'Rejeitada', color: 'bg-red-500' },
  EXPIRED: { label: 'Expirada', color: 'bg-orange-500' },
};

export function ProposalsContent() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  
  // Estados do modal de envio de email
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [emailTo, setEmailTo] = useState('');

  useEffect(() => {
    fetchProposals();
  }, [statusFilter]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/proposals?${params.toString()}`);
      if (!response.ok) throw new Error('Erro ao carregar propostas');
      const data = await response.json();
      setProposals(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar propostas');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProposals();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const response = await fetch(`/api/proposals/${deleteId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao excluir');
      toast.success('Proposta excluída com sucesso');
      fetchProposals();
    } catch (error) {
      toast.error('Erro ao excluir proposta');
    } finally {
      setDeleteId(null);
    }
  };

  const handleClone = async (id: string) => {
    try {
      setCloning(id);
      const response = await fetch(`/api/proposals/${id}/clone`, { method: 'POST' });
      if (!response.ok) throw new Error('Erro ao clonar');
      const cloned = await response.json();
      toast.success('Proposta clonada com sucesso');
      router.push(`/proposals/${cloned.id}/edit`);
    } catch (error) {
      toast.error('Erro ao clonar proposta');
    } finally {
      setCloning(null);
    }
  };

  const openEmailDialog = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setEmailTo(proposal.clientEmail || '');
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedProposal) return;
    
    if (!emailTo) {
      toast.error('Informe o email do destinatário');
      return;
    }
    
    try {
      setSending(selectedProposal.id);
      const response = await fetch(`/api/proposals/${selectedProposal.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: emailTo }),
      });
      if (!response.ok) throw new Error('Erro ao enviar');
      toast.success(`Proposta enviada para ${emailTo}`);
      setEmailDialogOpen(false);
      fetchProposals();
    } catch (error) {
      toast.error('Erro ao enviar proposta por email');
    } finally {
      setSending(null);
    }
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Propostas Comerciais
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas propostas comerciais
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/proposals/templates">
            <Button variant="outline" className="gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Templates
            </Button>
          </Link>
          <Link href="/proposals/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Proposta
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Buscar por cliente ou número..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="DRAFT">Rascunho</SelectItem>
                <SelectItem value="SENT">Enviada</SelectItem>
                <SelectItem value="ACCEPTED">Aceita</SelectItem>
                <SelectItem value="REJECTED">Rejeitada</SelectItem>
                <SelectItem value="EXPIRED">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Propostas */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma proposta encontrada</h2>
            <p className="text-muted-foreground mb-6">Crie sua primeira proposta comercial</p>
            <Link href="/proposals/new">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Criar Proposta
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Info Principal */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-muted-foreground">
                        {proposal.proposalNumber}
                      </span>
                      <Badge className={`${statusConfig[proposal.status]?.color} text-white`}>
                        {statusConfig[proposal.status]?.label || proposal.status}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {proposal.clientName}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(proposal.proposalDate)}
                      </span>
                      {proposal.totalValue && (
                        <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(proposal.totalValue)}
                        </span>
                      )}
                      {proposal.template && (
                        <span className="flex items-center gap-1">
                          <LayoutTemplate className="h-4 w-4" />
                          {proposal.template.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/proposals/${proposal.id}/preview`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Visualizar</span>
                      </Button>
                    </Link>
                    <Link href={`/proposals/${proposal.id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleClone(proposal.id)}
                      disabled={cloning === proposal.id}
                    >
                      {cloning === proposal.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">Clonar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => openEmailDialog(proposal)}
                      disabled={sending === proposal.id}
                    >
                      {sending === proposal.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">Enviar</span>
                    </Button>
                    <a
                      href={`/api/proposals/${proposal.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="gap-1">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">PDF</span>
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteId(proposal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Proposta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Envio de Email */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Proposta por Email</DialogTitle>
            <DialogDescription>
              {selectedProposal && (
                <>Proposta {selectedProposal.proposalNumber} para {selectedProposal.clientName}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email do Destinatário *</Label>
              <Input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="cliente@empresa.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={sending === selectedProposal?.id}
              className="gap-2"
            >
              {sending === selectedProposal?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

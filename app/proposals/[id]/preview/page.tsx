'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  Mail,
  Edit,
  Printer,
  Loader2,
  Send,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ProposalPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [proposal, setProposal] = useState<any>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    fetchProposal();
    fetchPdfHtml();
  }, [proposalId]);

  const fetchProposal = async () => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}`);
      if (response.ok) {
        const data = await response.json();
        setProposal(data);
        setEmailTo(data.clientEmail || '');
        setEmailSubject(`Proposta Comercial ${data.proposalNumber}`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchPdfHtml = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proposals/${proposalId}/pdf`);
      if (!response.ok) throw new Error('Erro ao carregar');
      const html = await response.text();
      setHtmlContent(html);
    } catch (error) {
      toast.error('Erro ao carregar preview');
      router.push('/proposals');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownloadPdf = () => {
    const printWindow = window.open(`/api/proposals/${proposalId}/pdf`, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo) {
      toast.error('Informe o email do destinatário');
      return;
    }

    try {
      setSendingEmail(true);
      const response = await fetch(`/api/proposals/${proposalId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: emailTo,
          subject: emailSubject,
          message: emailMessage,
        }),
      });

      if (!response.ok) throw new Error('Erro ao enviar');
      
      toast.success(`Proposta enviada para ${emailTo}`);
      setEmailDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao enviar email');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/proposals">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-semibold">{proposal?.proposalNumber}</h1>
                <p className="text-sm text-muted-foreground">{proposal?.clientName}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/proposals/${proposalId}/edit`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="gap-1">
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button size="sm" onClick={() => setEmailDialogOpen(true)} className="gap-1">
                <Mail className="h-4 w-4" />
                Enviar por Email
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden max-w-4xl mx-auto">
          <iframe
            srcDoc={htmlContent}
            className="w-full min-h-[1200px] border-0"
            title="Preview da Proposta"
          />
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Proposta por Email</DialogTitle>
            <DialogDescription>
              A proposta será enviada como um email formatado com resumo dos valores.
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
            <div>
              <Label>Assunto</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Assunto do email"
              />
            </div>
            <div>
              <Label>Mensagem Personalizada (opcional)</Label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Adicione uma mensagem personalizada..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail} className="gap-2">
              {sendingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

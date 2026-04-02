'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Download,
  Printer,
  Loader2,
} from 'lucide-react';

export default function ProposalPublicPage() {
  const params = useParams();
  const proposalId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [proposalNumber, setProposalNumber] = useState('');
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    fetchPublicProposal();
  }, [proposalId]);

  const fetchPublicProposal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proposals/${proposalId}/public`);
      if (!response.ok) throw new Error('Erro ao carregar');
      const html = await response.text();
      setHtmlContent(html);
      
      // Extrair o número da proposta e nome do cliente do HTML
      const titleMatch = html.match(/<title>Proposta ([^<]+)<\/title>/);
      if (titleMatch) {
        setProposalNumber(titleMatch[1]);
      }
      const clientMatch = html.match(/<strong>([^<]+)<\/strong>\.<\/p>/);
      if (clientMatch) {
        setClientName(clientMatch[1]);
      }
    } catch (error) {
      toast.error('Erro ao carregar proposta');
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
    const printWindow = window.open(`/api/proposals/${proposalId}/public`, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-semibold text-gray-900">{proposalNumber}</h1>
              <p className="text-sm text-gray-500">{clientName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button size="sm" onClick={handleDownloadPdf} className="gap-1 bg-orange-500 hover:bg-orange-600">
                <Download className="h-4 w-4" />
                Baixar PDF
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

      {/* Footer */}
      <div className="bg-gray-800 text-white py-4 text-center text-sm">
        <p>Proposta gerada por <strong>Beend</strong> - Sistema de Pesquisa de Satisfação</p>
        <p className="text-gray-400 mt-1">sistema.beend.tech</p>
      </div>
    </div>
  );
}

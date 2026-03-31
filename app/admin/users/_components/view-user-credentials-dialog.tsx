'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Terminal {
  id: string;
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  campaign?: {
    id: string;
    title: string;
  };
}

interface UserCredentials {
  user: {
    id: string;
    name: string;
    email: string;
    companyName?: string;
    responsiblePerson?: string;
  };
  terminals: Terminal[];
}

interface ViewUserCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function ViewUserCredentialsDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: ViewUserCredentialsDialogProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<UserCredentials | null>(null);

  useEffect(() => {
    if (open && userId) {
      fetchCredentials();
    }
  }, [open, userId]);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/credentials`);
      if (!response.ok) {
        throw new Error('Erro ao buscar credenciais');
      }
      const data = await response.json();
      setCredentials(data);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      toast.error('Erro ao carregar credenciais');
    } finally {
      setLoading(false);
    }
  };

  const generateCredentialsText = () => {
    if (!credentials) return '';

    const terminalsList = credentials.terminals
      .map((terminal) => {
        return `Terminal: ${terminal.name}\nLogin: ${terminal.email}\nSenha: term123`;
      })
      .join('\n\n');

    return `Olá ${userName}, segue os acessos para teste da plataforma:\n\nSegue os acessos:\n\nEndereço da plataforma: https://totem.beend.tech\nLogin: ${credentials.user.email}\nSenha(Provisória): 123456\n\n${credentials.terminals.length > 0 ? `Acesso dos terminais:\n\n${terminalsList}\n\n` : ''}Link para download do APK de instalação do tablet:\nhttps://totem.beend.tech/beend.apk`;
  };

  const handleCopy = async () => {
    const text = generateCredentialsText();
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Credenciais copiadas!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying:', error);
      toast.error('Erro ao copiar credenciais');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Credenciais de Acesso - {userName}</DialogTitle>
          <DialogDescription>
            Visualize e copie todas as credenciais do usuário
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : credentials ? (
          <div className="space-y-6">
            {/* Preview das Credenciais */}
            <div className="bg-muted/50 rounded-lg p-6 space-y-4 border-2 border-border">
              <div className="space-y-2">
                <p className="font-semibold text-lg">Olá {userName}, segue os acessos para teste da plataforma:</p>
              </div>

              <div className="space-y-3 pt-2">
                <p className="font-semibold">Segue os acessos:</p>
                
                <div className="bg-background rounded-md p-4 space-y-2 border">
                  <p className="text-sm">
                    <span className="font-medium">Endereço da plataforma:</span>{' '}
                    <span className="text-blue-600 dark:text-blue-400">https://totem.beend.tech</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Login:</span>{' '}
                    <span className="font-mono">{credentials.user.email}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Senha(Provisória):</span>{' '}
                    <span className="font-mono">123456</span>
                  </p>
                </div>

                {credentials.terminals.length > 0 && (
                  <>
                    <p className="font-semibold pt-2">Acesso dos terminais:</p>
                    {credentials.terminals.map((terminal) => (
                      <div key={terminal.id} className="bg-background rounded-md p-4 space-y-2 border">
                        <p className="text-sm">
                          <span className="font-medium">Terminal:</span>{' '}
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{terminal.name}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Login:</span>{' '}
                          <span className="font-mono">{terminal.email}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Senha:</span>{' '}
                          <span className="font-mono">term123</span>
                        </p>
                        {terminal.campaign && (
                          <p className="text-sm">
                            <span className="font-medium">Campanha:</span>{' '}
                            <span className="text-muted-foreground">{terminal.campaign.title}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </>
                )}

                <div className="bg-background rounded-md p-4 space-y-2 border mt-4">
                  <p className="text-sm font-medium">Link para download do APK de instalação do tablet:</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 break-all">
                    https://totem.beend.tech/beend.apk
                  </p>
                </div>
              </div>
            </div>

            {/* Botão de Copiar */}
            <Button onClick={handleCopy} className="w-full" size="lg">
              {copied ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 mr-2" />
                  Copiar Todas as Credenciais
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Erro ao carregar credenciais
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

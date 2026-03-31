'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Check, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Terminal {
  id: string;
  name: string;
  email: string;
  isDefaultPassword: boolean;
}

interface CopyCredentialsProps {
  userName: string;
  userEmail: string;
}

export function CopyCredentials({ userName, userEmail }: CopyCredentialsProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [terminals, setTerminals] = useState<Terminal[]>([]);

  useEffect(() => {
    if (open) {
      fetchTerminals();
    }
  }, [open]);

  const fetchTerminals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/terminals');
      const data = await response.json();
      setTerminals(data ?? []);
    } catch (error) {
      console.error('Error fetching terminals:', error);
      toast.error('Erro ao carregar terminais');
    } finally {
      setLoading(false);
    }
  };

  const generateCredentialsText = () => {
    const terminalsList = terminals
      .map((terminal, index) => {
        return `Terminal: ${terminal.name}\nLogin: ${terminal.email}\nSenha: term123`;
      })
      .join('\n\n');

    return `Olá ${userName}, segue os acessos para teste da plataforma:\n\nSegue os acessos:\n\nEndereço da plataforma: https://totem.beend.tech\nLogin: ${userEmail}\nSenha(Provisória): 123456\n\n${terminals.length > 0 ? `Painel individual dos terminais: https://totem.beend.tech/terminal-panel/login\n\nAcesso dos terminais:\n\n${terminalsList}\n\n` : ''}Link para download do APK de instalação do tablet:\nhttps://totem.beend.tech/beend.apk`;
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Credenciais de Acesso
          </CardTitle>
          <CardDescription>
            Copie todas as credenciais para compartilhar com o cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setOpen(true)} className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            Copiar Credenciais de Acesso
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Credenciais de Acesso</DialogTitle>
            <DialogDescription>
              Visualize e copie todas as credenciais para enviar ao cliente
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                      <span className="font-mono">{userEmail}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Senha(Provisória):</span>{' '}
                      <span className="font-mono">123456</span>
                    </p>
                  </div>

                  {terminals.length > 0 && (
                    <>
                      <div className="bg-background rounded-md p-4 space-y-2 border mt-4">
                        <p className="text-sm font-medium">Painel individual dos terminais:</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 break-all">
                          https://totem.beend.tech/terminal-panel/login
                        </p>
                      </div>

                      <p className="font-semibold pt-2">Acesso dos terminais:</p>
                      {terminals.map((terminal, index) => (
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

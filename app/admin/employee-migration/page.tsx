'use client';

import { Suspense, useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CurrentOption {
  id: string;
  text: string;
}

interface OrphanedAnswer {
  answerId: string;
  employeeId: string;
  relatedComment?: string;
}

interface OrphanedResponse {
  responseId: string;
  createdAt: string;
  answers: OrphanedAnswer[];
}

interface EmployeeMatch {
  oldId: string;
  suggestedNewId?: string;
  suggestedName: string;
  comment?: string;
}

function EmployeeMigrationContent() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [matches, setMatches] = useState<EmployeeMatch[]>([]);

  useEffect(() => {
    if (!campaignId) {
      loadCampaigns();
    }
  }, []);

  useEffect(() => {
    if (campaignId) {
      loadMigrationData(campaignId);
    }
  }, [campaignId]);

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const loadMigrationData = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${id}`);
      const campaign = await response.json();
      
      // Buscar employees da pergunta EMPLOYEE_RATING
      const employeeQuestion = campaign.questions?.find((q: any) => q.type === 'EMPLOYEE_RATING');
      const simpleSmileQuestion = campaign.questions?.find((q: any) => q.type === 'SIMPLE_SMILE');
      
      if (!employeeQuestion) {
        setData({ error: 'Campanha não tem pergunta EMPLOYEE_RATING' });
        setLoading(false);
        return;
      }

      // Verificar respostas órfãs
      const responsesRes = await fetch(`/api/debug/responses/${id}`);
      const responsesData = await responsesRes.json();
      
      const currentOptions = employeeQuestion.options || [];
      const currentOptionIds = currentOptions.map((o: any) => o.id);
      
      // Encontrar respostas com IDs órfãos e tentar encontrar o comentário relacionado
      const orphaned: OrphanedResponse[] = [];
      const newMatches: EmployeeMatch[] = [];
      
      if (responsesData.responses) {
        responsesData.responses.forEach((r: any) => {
          // Encontrar a resposta EMPLOYEE_RATING
          const empAnswer = r.answers.find((a: any) => a.questionType === 'EMPLOYEE_RATING');
          // Encontrar o comentário da resposta SIMPLE_SMILE (geralmente contém o nome)
          const smileAnswer = r.answers.find((a: any) => a.questionType === 'SIMPLE_SMILE');
          
          if (empAnswer && empAnswer.selectedOptions?.[0] && !currentOptionIds.includes(empAnswer.selectedOptions[0])) {
            const comment = smileAnswer?.comment || '';
            
            orphaned.push({
              responseId: r.id,
              createdAt: r.createdAt,
              answers: [{
                answerId: empAnswer.id,
                employeeId: empAnswer.selectedOptions[0],
                relatedComment: comment,
              }],
            });
            
            // Tentar encontrar o employee pelo comentário
            let suggestedName = 'Employee ID: ' + empAnswer.selectedOptions[0].substring(0, 8) + '...';
            let suggestedNewId: string | undefined;
            
            // Buscar correspondência pelo comentário
            const commentLower = comment.toLowerCase().trim();
            for (const opt of currentOptions) {
              if (opt.text.toLowerCase().includes(commentLower) || 
                  commentLower.includes(opt.text.toLowerCase())) {
                suggestedName = opt.text;
                suggestedNewId = opt.id;
                break;
              }
            }
            
            newMatches.push({
              oldId: empAnswer.selectedOptions[0],
              suggestedNewId,
              suggestedName,
              comment,
            });
          }
        });
      }

      setData({
        campaign: { id: campaign.id, title: campaign.title },
        currentOptions: currentOptions,
        employeeQuestionId: employeeQuestion.id,
        orphanedResponses: orphaned,
        totalResponses: responsesData.total || 0,
      });
      
      setMatches(newMatches);
    } catch (error) {
      console.error('Error:', error);
      setData({ error: 'Erro ao carregar dados' });
    }
    setLoading(false);
  };

  const handleFix = async (answerId: string, newEmployeeId: string) => {
    try {
      const response = await fetch('/api/admin/fix-employee-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId, newEmployeeId }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Correção aplicada!');
        if (campaignId) loadMigrationData(campaignId);
      } else {
        toast.error(data.error || 'Erro ao corrigir');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao corrigir');
    }
  };

  const handleFixAll = async () => {
    if (!data?.orphanedResponses) return;
    
    const mapping = matches.reduce((acc: Record<string, string>, m) => {
      if (m.suggestedNewId) {
        acc[m.oldId] = m.suggestedNewId;
      }
      return acc;
    }, {});
    
    const promises = data.orphanedResponses.flatMap((r: OrphanedResponse) =>
      r.answers
        .filter((a: OrphanedAnswer) => mapping[a.employeeId])
        .map((a: OrphanedAnswer) =>
          fetch('/api/admin/fix-employee-id', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              answerId: a.answerId, 
              newEmployeeId: mapping[a.employeeId] 
            }),
          })
        )
    );
    
    await Promise.all(promises);
    toast.success('Correções automáticas aplicadas!');
    if (campaignId) loadMigrationData(campaignId);
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Correção de IDs de Employees</h1>
      
      {/* Seletor de campanha */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Selecionar Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {campaigns.map((c: any) => (
              <Button
                key={c.id}
                variant={campaignId === c.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => window.location.href = `?campaignId=${c.id}`}
              >
                {c.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {campaignId && data && (
        <>
          {/* Employees atuais */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Employees Atuais (IDs válidos)</CardTitle>
            </CardHeader>
            <CardContent>
              {data.currentOptions?.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {data.currentOptions.map((opt: CurrentOption) => (
                    <div key={opt.id} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <code className="text-xs bg-gray-200 px-1 rounded">{opt.id.substring(0, 12)}...</code>
                      <span className="font-medium">{opt.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nenhum employee encontrado</p>
              )}
            </CardContent>
          </Card>

          {/* Sugestões de correção automático */}
          {matches.length > 0 && (
            <Card className="mb-6 border-blue-300 bg-blue-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sugestões de Correção</CardTitle>
                  <Badge variant="default">{matches.length} encontradas</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Baseado nos comentários das respostas, o sistema tentou identificar os employees
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {matches.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <code className="text-xs bg-red-100 px-1 rounded text-red-600">{m.oldId.substring(0, 12)}...</code>
                      <span>→</span>
                      <span className="font-medium text-green-600">{m.suggestedName}</span>
                      {m.comment && <span className="text-gray-500">("{' '}{m.comment}{' '}")</span>}
                      {m.suggestedNewId && <Badge variant="secondary" className="ml-2">Automático</Badge>}
                    </div>
                  ))}
                </div>
                {matches.some(m => m.suggestedNewId) && (
                  <Button onClick={handleFixAll} className="w-full">
                    Aplicar Correções Automáticas
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Respostas órfãs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Todas as Respostas comIDs Antigos</CardTitle>
                <Badge variant="destructive">{data.orphanedResponses?.length || 0}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {data.orphanedResponses?.length > 0 ? (
                <div className="space-y-3">
                  {data.orphanedResponses.map((r: OrphanedResponse, idx: number) => (
                    <div key={idx} className="p-3 border rounded bg-yellow-50">
                      <div className="text-sm text-gray-600 mb-2">
                        {new Date(r.createdAt).toLocaleString('pt-BR')}
                      </div>
                      {r.answers.map((a: OrphanedAnswer) => (
                        <div key={a.answerId} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-red-100 px-1 rounded text-red-600">{a.employeeId.substring(0, 12)}...</code>
                            {a.relatedComment && (
                              <span className="text-xs text-gray-500">- &quot;{a.relatedComment}&quot;</span>
                            )}
                            <span>→</span>
                            <select
                              className="border rounded px-2 py-1 text-sm"
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleFix(a.answerId, e.target.value);
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="">Selecione o employee...</option>
                              {data.currentOptions.map((opt: CurrentOption) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.text}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-green-600 p-4 bg-green-50 rounded">
                  ✓ Todas as respostas estão com IDs válidos!
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function EmployeeMigrationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <EmployeeMigrationContent />
    </Suspense>
  );
}
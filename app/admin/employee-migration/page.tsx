'use client';

import { useEffect, useState } from 'react';
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
}

interface OrphanedResponse {
  responseId: string;
  createdAt: string;
  answers: OrphanedAnswer[];
}

export default function EmployeeMigrationPage() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);

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
      
      if (!employeeQuestion) {
        setData({ error: 'Campanha não tem pergunta EMPLOYEE_RATING' });
        setLoading(false);
        return;
      }

      // Verificar respostas órfãs
      const responsesRes = await fetch(`/api/debug/responses/${id}`);
      const responsesData = await responsesRes.json();
      
      const currentOptionIds = (employeeQuestion.options || []).map((o: any) => o.id);
      
      // Encontrar respostas com IDs órfãos
      const orphaned: OrphanedResponse[] = [];
      
      if (responsesData.responses) {
        responsesData.responses.forEach((r: any) => {
          const orphanedAnswers = r.answers
            .filter((a: any) => a.questionType === 'EMPLOYEE_RATING' && a.selectedOptions?.[0] && !currentOptionIds.includes(a.selectedOptions[0]))
            .map((a: any) => ({
              answerId: a.id,
              employeeId: a.selectedOptions[0],
            }));
          
          if (orphanedAnswers.length > 0) {
            orphaned.push({
              responseId: r.id,
              createdAt: r.createdAt,
              answers: orphanedAnswers,
            });
          }
        });
      }

      setData({
        campaign: { id: campaign.id, title: campaign.title },
        currentOptions: employeeQuestion.options || [],
        employeeQuestionId: employeeQuestion.id,
        orphanedResponses: orphaned,
        totalResponses: responsesData.total || 0,
      });
    } catch (error) {
      console.error('Error:', error);
      setData({ error: 'Erro ao carregar dados' });
    }
    setLoading(false);
  };

  const handleFix = async (answerId: string, newEmployeeId: string) => {
    try {
      const response = await fetch('/api/campaigns/fix-employee-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId, newEmployeeId }),
      });
      
      if (response.ok) {
        toast.success('Correção aplicada!');
        if (campaignId) loadMigrationData(campaignId);
      } else {
        toast.error('Erro ao corrigir');
      }
    } catch (error) {
      toast.error('Erro ao corrigir');
    }
  };

  const handleFixAll = async (mapping: Record<string, string>) => {
    if (!data?.orphanedResponses) return;
    
    const promises = data.orphanedResponses.flatMap((r: OrphanedResponse) =>
      r.answers
        .filter((a: OrphanedAnswer) => mapping[a.employeeId])
        .map((a: OrphanedAnswer) =>
          fetch('/api/campaigns/fix-employee-id', {
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
    toast.success('Todas as correções foram aplicadas!');
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
                <div className="space-y-2">
                  {data.currentOptions.map((opt: CurrentOption) => (
                    <div key={opt.id} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <code className="text-xs bg-gray-200 px-1 rounded">{opt.id}</code>
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nenhum employee encontrado</p>
              )}
            </CardContent>
          </Card>

          {/* Respostas órfãs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Respostas que precisam de correção</CardTitle>
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
                            <code className="text-xs bg-red-100 px-1 rounded text-red-600">{a.employeeId}</code>
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
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Employee {
  id: string;
  text: string;
}

function RedistributePage() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (campaignId) {
      loadData(campaignId);
    }
  }, [campaignId]);

  const loadData = async (id: string) => {
    setLoading(true);
    try {
      const campRes = await fetch(`/api/campaigns/${id}`);
      const campaign = await campRes.json();
      
      const employeeQuestion = campaign.questions?.find((q: any) => q.type === 'EMPLOYEE_RATING');
      
      if (employeeQuestion?.options) {
        setEmployees(employeeQuestion.options.map((o: any) => ({ id: o.id, text: o.text })));
      }
      
      setCampaignTitle(campaign.title);
      
      const respRes = await fetch(`/api/debug/responses/${id}`);
      const respData = await respRes.json();
      
      const empResponses = respData.responses?.map((r: any) => {
        const empAnswer = r.answers.find((a: any) => a.questionType === 'EMPLOYEE_RATING');
        const smileAnswer = r.answers.find((a: any) => a.questionType === 'SIMPLE_SMILE');
        return {
          responseId: r.id,
          answerId: empAnswer?.id,
          employeeId: empAnswer?.selectedOptions?.[0],
          rating: smileAnswer?.rating,
          comment: smileAnswer?.comment,
          createdAt: r.createdAt,
        };
      }).filter((r: any) => r.answerId) || [];
      
      setResponses(empResponses);
      
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleUpdate = async (responseId: string, answerId: string, newEmployeeId: string) => {
    try {
      const res = await fetch('/api/admin/fix-employee-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId, newEmployeeId }),
      });
      
      if (res.ok) {
        setResponses(prev => prev.map(r => 
          r.responseId === responseId 
            ? { ...r, employeeId: newEmployeeId }
            : r
        ));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    let success = 0;
    let failed = 0;
    
    for (const r of responses) {
      if (r.selectedEmployeeId && r.selectedEmployeeId !== r.employeeId) {
        const ok = await handleUpdate(r.responseId, r.answerId, r.selectedEmployeeId);
        if (ok) success++;
        else failed++;
      }
    }
    
    setSaving(false);
    
    if (failed > 0) {
      toast.error(`${failed} correções falharam`);
    } else {
      toast.success(`${success} correções aplicadas!`);
    }
    
    if (campaignId) loadData(campaignId);
  };

  const updateResponse = (responseId: string, employeeId: string) => {
    setResponses(prev => prev.map(r => 
      r.responseId === responseId 
        ? { ...r, selectedEmployeeId: employeeId }
        : r
    ));
  };

  const getCurrentEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? emp.text : 'Desconhecido';
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-2">Redistribuir Votos</h1>
      <p className="text-gray-600 mb-6">{campaignTitle}</p>
      
      <div className="mb-4 flex items-center justify-between">
        <Badge variant="outline">{responses.length} respostas</Badge>
        <Button onClick={handleSaveAll} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Todas as Alterações'}
        </Button>
      </div>

      <div className="space-y-3">
        {responses.map((r) => (
          <Card key={r.responseId} className={r.selectedEmployeeId && r.selectedEmployeeId !== r.employeeId ? 'border-green-500' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-sm text-gray-500 min-w-[100px]">
                  {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                </div>
                
                <div className="min-w-[80px]">
                  <span className="font-bold">Nota: </span>
                  <span className={r.rating >= 4 ? 'text-green-600' : r.rating >= 3 ? 'text-yellow-600' : 'text-red-600'}>
                    {r.rating}
                  </span>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <span className="text-sm text-gray-600">&quot;{r.comment || 'Sem comentário'}&quot;</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm">Atual:</span>
                  <Badge variant="secondary">{getCurrentEmployeeName(r.employeeId)}</Badge>
                </div>
                
                <span>→</span>
                
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={r.selectedEmployeeId || r.employeeId}
                  onChange={(e) => updateResponse(r.responseId, e.target.value)}
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.text}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function RedistributePageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <RedistributePage />
    </Suspense>
  );
}
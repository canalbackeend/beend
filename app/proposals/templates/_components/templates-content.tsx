'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  LayoutTemplate,
  Loader2,
  Save,
  FileText,
} from 'lucide-react';

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
  createdAt: string;
}

const emptyTemplate: Omit<Template, 'id' | 'createdAt'> = {
  name: '',
  description: '',
  generalDescription: '',
  implementationReqs: '',
  technicalSupport: '',
  warranty: '',
  systemFeatures: '',
  paymentTerms: '',
  finalConsiderations: '',
  defaultItems: [],
};

export function TemplatesContent() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<(Omit<Template, 'id' | 'createdAt'> & { id?: string }) | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/proposal-templates');
      if (!response.ok) throw new Error('Erro ao carregar');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingTemplate({ ...emptyTemplate });
    setDialogOpen(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate({
      id: template.id,
      name: template.name,
      description: template.description || '',
      generalDescription: template.generalDescription || '',
      implementationReqs: template.implementationReqs || '',
      technicalSupport: template.technicalSupport || '',
      warranty: template.warranty || '',
      systemFeatures: template.systemFeatures || '',
      paymentTerms: template.paymentTerms || '',
      finalConsiderations: template.finalConsiderations || '',
      defaultItems: template.defaultItems || [],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingTemplate?.name.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    try {
      setSaving(true);
      const isEdit = !!editingTemplate.id;
      const url = isEdit
        ? `/api/proposal-templates/${editingTemplate.id}`
        : '/api/proposal-templates';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate),
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      toast.success(isEdit ? 'Template atualizado!' : 'Template criado!');
      setDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      toast.error('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/proposal-templates/${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir');

      toast.success('Template excluído');
      fetchTemplates();
    } catch (error) {
      toast.error('Erro ao excluir template');
    } finally {
      setDeleteId(null);
    }
  };

  const updateEditingField = (field: string, value: any) => {
    if (editingTemplate) {
      setEditingTemplate({ ...editingTemplate, [field]: value });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/proposals">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Templates de Proposta</h1>
            <p className="text-muted-foreground text-sm">
              Crie templates com textos pré-configurados para agilizar a criação de propostas
            </p>
          </div>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LayoutTemplate className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum template criado</h2>
            <p className="text-muted-foreground mb-6">
              Crie templates para agilizar a criação de propostas
            </p>
            <Button onClick={handleNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                </div>
                {template.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-1 mb-4">
                  {template.generalDescription && (
                    <p>• Descrição geral configurada</p>
                  )}
                  {template.systemFeatures && (
                    <p>• Recursos do sistema configurados</p>
                  )}
                  {template.paymentTerms && (
                    <p>• Forma de pagamento configurada</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="flex-1 gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(template.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate?.id ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              Configure os textos padrão que serão preenchidos automaticamente
            </DialogDescription>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Template *</Label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => updateEditingField('name', e.target.value)}
                    placeholder="Ex: Proposta Padrão"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={editingTemplate.description || ''}
                    onChange={(e) => updateEditingField('description', e.target.value)}
                    placeholder="Descrição curta do template"
                  />
                </div>
              </div>

              <div>
                <Label>Descrição Geral</Label>
                <Textarea
                  value={editingTemplate.generalDescription || ''}
                  onChange={(e) => updateEditingField('generalDescription', e.target.value)}
                  rows={4}
                  placeholder="Texto padrão para descrição geral..."
                />
              </div>

              <div>
                <Label>Requisitos de Implementação</Label>
                <Textarea
                  value={editingTemplate.implementationReqs || ''}
                  onChange={(e) => updateEditingField('implementationReqs', e.target.value)}
                  rows={3}
                  placeholder="Texto padrão..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Suporte Técnico</Label>
                  <Textarea
                    value={editingTemplate.technicalSupport || ''}
                    onChange={(e) => updateEditingField('technicalSupport', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Garantia</Label>
                  <Textarea
                    value={editingTemplate.warranty || ''}
                    onChange={(e) => updateEditingField('warranty', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label>Recursos do Sistema</Label>
                <Textarea
                  value={editingTemplate.systemFeatures || ''}
                  onChange={(e) => updateEditingField('systemFeatures', e.target.value)}
                  rows={5}
                  placeholder="• Recurso 1
• Recurso 2..."
                />
              </div>

              <div>
                <Label>Forma de Pagamento</Label>
                <Textarea
                  value={editingTemplate.paymentTerms || ''}
                  onChange={(e) => updateEditingField('paymentTerms', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label>Considerações Finais</Label>
                <Textarea
                  value={editingTemplate.finalConsiderations || ''}
                  onChange={(e) => updateEditingField('finalConsiderations', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este template? As propostas que usam este template não serão afetadas.
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
    </div>
  );
}

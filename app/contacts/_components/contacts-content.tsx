'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Plus,
  Upload,
  Pencil,
  Trash2,
  Users,
  Mail,
  FolderOpen,
  Search,
  Building2,
  Phone,
  Download,
  List,
  UserPlus,
} from 'lucide-react';

interface ContactList {
  id: string;
  name: string;
  description?: string;
  _count: { contacts: number };
}

interface Contact {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  list?: { id: string; name: string };
  createdAt: string;
}

export function ContactsContent() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [lists, setLists] = useState<ContactList[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListId, setSelectedListId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteListDialogOpen, setDeleteListDialogOpen] = useState(false);

  // Form states
  const [editingList, setEditingList] = useState<ContactList | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [deletingList, setDeletingList] = useState<ContactList | null>(null);

  const [listForm, setListForm] = useState({ name: '', description: '' });
  const [contactForm, setContactForm] = useState({
    email: '',
    name: '',
    phone: '',
    company: '',
    listId: '_none',
  });
  const [importListId, setImportListId] = useState('_none');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchLists();
      fetchContacts();
    }
  }, [status, router]);

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/contact-lists');
      if (res.ok) {
        const data = await res.json();
        setLists(data);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const fetchContacts = async (listId?: string) => {
    setLoading(true);
    try {
      let url = '/api/contacts';
      if (listId && listId !== 'all') {
        url += `?listId=${listId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  // List handlers
  const openListDialog = (list?: ContactList) => {
    if (list) {
      setEditingList(list);
      setListForm({ name: list.name, description: list.description || '' });
    } else {
      setEditingList(null);
      setListForm({ name: '', description: '' });
    }
    setListDialogOpen(true);
  };

  const handleSaveList = async () => {
    if (!listForm.name.trim()) {
      toast.error('Nome da lista é obrigatório');
      return;
    }

    try {
      const url = editingList
        ? `/api/contact-lists/${editingList.id}`
        : '/api/contact-lists';
      const method = editingList ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listForm),
      });

      if (res.ok) {
        toast.success(editingList ? 'Lista atualizada!' : 'Lista criada!');
        setListDialogOpen(false);
        fetchLists();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao salvar lista');
      }
    } catch (error) {
      console.error('Error saving list:', error);
      toast.error('Erro ao salvar lista');
    }
  };

  const handleDeleteList = async () => {
    if (!deletingList) return;

    try {
      const res = await fetch(`/api/contact-lists/${deletingList.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Lista excluída!');
        setDeleteListDialogOpen(false);
        setDeletingList(null);
        fetchLists();
        if (selectedListId === deletingList.id) {
          setSelectedListId('all');
          fetchContacts();
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao excluir lista');
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Erro ao excluir lista');
    }
  };

  // Contact handlers
  const openContactDialog = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setContactForm({
        email: contact.email,
        name: contact.name || '',
        phone: contact.phone || '',
        company: contact.company || '',
        listId: contact.list?.id || '_none',
      });
    } else {
      setEditingContact(null);
      setContactForm({
        email: '',
        name: '',
        phone: '',
        company: '',
        listId: selectedListId !== 'all' ? selectedListId : '_none',
      });
    }
    setContactDialogOpen(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    try {
      const url = editingContact
        ? `/api/contacts/${editingContact.id}`
        : '/api/contacts';
      const method = editingContact ? 'PUT' : 'POST';

      // Converter "_none" para string vazia antes de enviar
      const payload = {
        ...contactForm,
        listId: contactForm.listId === '_none' ? '' : contactForm.listId,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingContact ? 'Contato atualizado!' : 'Contato adicionado!');
        setContactDialogOpen(false);
        fetchContacts(selectedListId);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao salvar contato');
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Erro ao salvar contato');
    }
  };

  const handleDeleteContact = async () => {
    if (!deletingContact) return;

    try {
      const res = await fetch(`/api/contacts/${deletingContact.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Contato excluído!');
        setDeleteDialogOpen(false);
        setDeletingContact(null);
        fetchContacts(selectedListId);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao excluir contato');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Erro ao excluir contato');
    }
  };

  // Import CSV
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('Arquivo vazio ou sem dados');
        return;
      }

      // Parse header
      const headerLine = lines[0].toLowerCase();
      const separator = headerLine.includes(';') ? ';' : ',';
      const headers = headerLine.split(separator).map(h => h.trim().replace(/"/g, ''));
      
      const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('e-mail'));
      const nameIdx = headers.findIndex(h => h.includes('nome') || h.includes('name'));
      const phoneIdx = headers.findIndex(h => h.includes('telefone') || h.includes('phone') || h.includes('celular'));
      const companyIdx = headers.findIndex(h => h.includes('empresa') || h.includes('company'));

      if (emailIdx === -1) {
        toast.error('Coluna de email não encontrada. Use: email, e-mail');
        return;
      }

      // Parse contacts
      const contacts: { email: string; name?: string; phone?: string; company?: string }[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
        if (values[emailIdx]) {
          contacts.push({
            email: values[emailIdx],
            name: nameIdx >= 0 ? values[nameIdx] : undefined,
            phone: phoneIdx >= 0 ? values[phoneIdx] : undefined,
            company: companyIdx >= 0 ? values[companyIdx] : undefined,
          });
        }
      }

      if (contacts.length === 0) {
        toast.error('Nenhum contato válido encontrado');
        return;
      }

      // Send to API
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts,
          listId: importListId === '_none' ? null : importListId,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(
          `Importação concluída! ${result.imported} importados, ${result.duplicates} duplicados`
        );
        setImportDialogOpen(false);
        fetchContacts(selectedListId);
        fetchLists();
      } else {
        toast.error(result.error || 'Erro na importação');
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Erro ao processar arquivo');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const csv = 'email;nome;telefone;empresa\nexemplo@email.com;João Silva;11999999999;Empresa XYZ';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_contatos.csv';
    a.click();
  };

  const filteredContacts = contacts.filter(c =>
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Contatos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus contatos e listas para campanhas de email
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openListDialog()}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Nova Lista
          </Button>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Button onClick={() => openContactDialog()}>
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Contato
          </Button>
        </div>
      </div>

      {/* Lists Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedListId === 'all' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => {
            setSelectedListId('all');
            fetchContacts();
          }}
        >
          <CardContent className="p-4 flex flex-col items-center">
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <p className="font-medium text-sm">Todos</p>
            <p className="text-xs text-muted-foreground">{contacts.length} contatos</p>
          </CardContent>
        </Card>

        {lists.map((list) => (
          <Card
            key={list.id}
            className={`cursor-pointer transition-all hover:shadow-md group relative ${
              selectedListId === list.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => {
              setSelectedListId(list.id);
              fetchContacts(list.id);
            }}
          >
            <CardContent className="p-4 flex flex-col items-center">
              <List className="h-8 w-8 text-purple-600 mb-2" />
              <p className="font-medium text-sm text-center truncate w-full">{list.name}</p>
              <p className="text-xs text-muted-foreground">{list._count.contacts} contatos</p>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    openListDialog(list);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingList(list);
                    setDeleteListDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Contacts Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="text-lg">
              {selectedListId === 'all'
                ? 'Todos os Contatos'
                : lists.find((l) => l.id === selectedListId)?.name || 'Contatos'}
            </CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum contato encontrado</p>
              <Button className="mt-4" onClick={() => openContactDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Contato
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Telefone</TableHead>
                    <TableHead className="hidden lg:table-cell">Empresa</TableHead>
                    <TableHead className="hidden md:table-cell">Lista</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.email}</TableCell>
                      <TableCell>{contact.name || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {contact.phone || '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {contact.company || '-'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {contact.list ? (
                          <Badge variant="secondary">{contact.list.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openContactDialog(contact)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => {
                              setDeletingContact(contact);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* List Dialog */}
      <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingList ? 'Editar Lista' : 'Nova Lista'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome da Lista *</Label>
              <Input
                value={listForm.name}
                onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                placeholder="Ex: Clientes VIP"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={listForm.description}
                onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveList}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'Editar Contato' : 'Novo Contato'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            <div>
              <Label>Nome</Label>
              <Input
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder="Nome do contato"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div>
                <Label>Empresa</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Lista</Label>
              <Select
                value={contactForm.listId}
                onValueChange={(v) => setContactForm({ ...contactForm, listId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma lista (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sem lista</SelectItem>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveContact}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Contatos via CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                O arquivo CSV deve conter pelo menos a coluna <strong>email</strong>.
                Colunas opcionais: nome, telefone, empresa.
              </p>
              <Button variant="link" className="p-0 h-auto" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-1" />
                Baixar modelo CSV
              </Button>
            </div>
            <div>
              <Label>Adicionar à Lista (opcional)</Label>
              <Select value={importListId} onValueChange={setImportListId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma lista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sem lista</SelectItem>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arquivo CSV</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                disabled={importing}
              />
            </div>
            {importing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Importando...
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contato{' '}
              <strong>{deletingContact?.email}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteContact}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete List Dialog */}
      <AlertDialog open={deleteListDialogOpen} onOpenChange={setDeleteListDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lista</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a lista{' '}
              <strong>{deletingList?.name}</strong>?{' '}
              Os contatos serão mantidos, mas ficarão sem lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteList}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

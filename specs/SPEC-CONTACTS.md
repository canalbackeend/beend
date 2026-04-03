# SPEC-SDD: Módulo de Contatos e Listas de Contato

## 1. Visão do Produto

### 1.1 Propósito do Módulo
O módulo de Contatos permite o gerenciamento de contatos e listas de contatos para uso em campanhas de email marketing. Inclui importação em massa, organização por listas e integração com propostas.

### 1.2 Problema que Resolve
- dificuldade em gerenciar base de clientes
- Necessidade de enviar propostas por email
- Falta de organização de contatos por segmento
- Processos manuais de importação

### 1.3 Objetivos de Negócio
- Centralizar gestão de contatos
- Facilitar envio de propostas por email
- Permitir segmentação por listas
- Reduzir tempo de importação de contatos

---

## 2. Requisitos Funcionais

### 2.1 Gestão de Contatos

#### RF-001: Criar Contato
- **Descrição**: Adicionar novo contato manualmente
- **Campos obrigatórios**:
  - name (nome completo)
  - email (email único por lista)
- **Campos opcionais**:
  - phone (telefone)
  - company (empresa)
  - role (cargo)
  - notes (observações)
  - tags (array de strings)
- **Validações**:
  - Email válido
  - Email único na lista

#### RF-002: Editar Contato
- **Descrição**: Modificar informações do contato

#### RF-003: Excluir Contato
- **Descrição**: Remover contato
- **Cascade**: Remove de todas as listas vinculadas

#### RF-004: Importar Contatos (CSV)
- **Descrição**: Importação em massa via arquivo CSV
- **Formato**: name,email,phone,company,role
- **Limite**: 5.000 contatos por arquivo
- **Fluxo**:
  1. Usuário faz upload do arquivo CSV
  2. Sistema parseia arquivo
  3. Sistema valida dados (email válido, não duplicado)
  4. Sistema mostra预览 de importação
  5. Usuário confirma
  6. Sistema importa contatos
  7. Retorna relatório (sucesso/erros)

#### RF-005: Exportar Contatos
- **Descrição**: Exportar contatos para CSV
- **Campos**: name, email, phone, company, role, createdAt

### 2.2 Gestão de Listas de Contato

#### RF-006: Criar Lista
- **Descrição**: Criar nova lista de contatos
- **Campos**:
  - name (nome da lista)
  - description (descrição opcional)
- **Validações**: Nome único por usuário

#### RF-007: Editar Lista
- **Descrição**: Modificar lista

#### RF-008: Excluir Lista
- **Descrição**: Remover lista
- **Regra**: Contatos não são excluídos, apenas desvinculados

#### RF-009: Adicionar Contato à Lista
- **Descrição**: Vincular contato existente a uma lista
- **Regra**: Contato pode estar em múltiplas listas
- **Validações**: Email único na lista

#### RF-010: Remover Contato da Lista
- **Descrição**: Desvincular contato da lista

#### RF-011: Importar para Lista
- **Descrição**: Importar CSV diretamente para lista específica

### 2.3 Busca e Filtros

#### RF-012: Buscar Contatos
- **Descrição**: Pesquisar contatos por nome ou email
- **Tempo real**: Busca após 3 caracteres digitados

#### RF-013: Filtrar por Lista
- **Descrição**: Visualizar contatos de uma lista específica

#### RF-014: Filtrar por Tags
- **Descrição**: Filtrar contatos por tags específicas

---

## 3. Requisitos Não-Funcionais

### 3.1 Performance
- Importação de 1.000 contatos < 10 segundos
- Busca < 200ms
- Listagem com paginação (50 por página)

### 3.2 Escalabilidade
- Suporte a 50.000 contatos por usuário
- Suporte a 100 listas por usuário

### 3.3 Segurança
- Contatos são privados (usuário só vê seus contatos)
- Validação de CSV (sanitização de dados)
- Rate limiting: 10 imports por minuto

---

## 4. Design do Banco de Dados

### 4.1 Tabelas

#### Contact
```prisma
model Contact {
  id        String   @id @default(cuid())
  userId    String
  name      String
  email     String
  phone     String?
  company   String?
  role      String?
  notes     String?
  tags      String[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id])
  lists     ContactListContact[]
  
  @@unique([userId, email]) // Email único por usuário
}
```

#### ContactList
```prisma
model ContactList {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  contacts    ContactListContact[]
  
  @@unique([userId, name]) // Nome único por usuário
}
```

#### ContactListContact
```prisma
model ContactListContact {
  id         String      @id @default(cuid())
  contactId  String
  listId     String
  addedAt    DateTime   @default(now())
  
  contact    Contact    @relation(fields: [contactId], references: [id], onDelete: Cascade)
  list        ContactList @relation(fields: [listId], references: [id], onDelete: Cascade)
  
  @@unique([contactId, listId])
}
```

---

## 5. Constitution (Regras Não Negociáveis)

### 5.1 Regras de Importação

1. **Validação de CSV**
   - Verificar extensão .csv
   - Parsear com charset UTF-8
   - Sanitizar campos de texto

2. **Limites**
   - Máximo 5.000 contatos por arquivo
   - timeout de 30 segundos para processamento

3. **Duplicatas**
   - Verificar email duplicado antes de inserir
   - Oferecer opção de pular ou substituir

### 5.2 Regras de Acesso

1. **Privacidade**
   - Usuário só vê seus próprios contatos
   - Listas são privadas
   - Dados nunca compartilhados entre usuários

---

## 6. API Endpoints

### 6.1 Contatos

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /api/contacts | Listar contatos | ✅ |
| POST | /api/contacts | Criar contato | ✅ |
| GET | /api/contacts/[id] | Detalhar contato | ✅ |
| PUT | /api/contacts/[id] | Atualizar contato | ✅ |
| DELETE | /api/contacts/[id] | Excluir contato | ✅ |
| POST | /api/contacts/import | Importar CSV | ✅ |
| GET | /api/contacts/export | Exportar CSV | ✅ |

### 6.2 Listas

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /api/contact-lists | Listar listas | ✅ |
| POST | /api/contact-lists | Criar lista | ✅ |
| GET | /api/contact-lists/[id] | Detalhar lista | ✅ |
| PUT | /api/contact-lists/[id] | Atualizar lista | ✅ |
| DELETE | /api/contact-lists/[id] | Excluir lista | ✅ |
| POST | /api/contact-lists/[id]/contacts | Adicionar contatos | ✅ |
| DELETE | /api/contact-lists/[id]/contacts/[contactId] | Remover contato | ✅ |

---

## 7. Decomposição em Tasks

### Epic: Contatos

| Task | Descrição | Prioridade |
|------|-----------|------------|
| TASK-001 | Schema Contact, ContactList | Alta |
| TASK-002 | CRUD de contatos | Alta |
| TASK-003 | CRUD de listas | Alta |
| TASK-004 | Importação CSV | Alta |
| TASK-005 | Exportação CSV | Média |
| TASK-006 | Busca e filtros | Média |
| TASK-007 | Vincular contatos a listas | Alta |
| TASK-008 | Tags em contatos | Baixa |

---

## 8. Fluxo: Importar Contatos
```
1. Usuário acessa /contacts
2. Clica em "Importar"
3. Seleciona arquivo CSV
4. Sistema valida arquivo
5. Sistema mostra preview (primeiros 10)
6. Usuário seleciona lista destino (opcional)
7. Clica em "Importar"
8. Sistema processa arquivo
9. Sistema retorna relatório
10. Contatos disponíveis
```

---

## 9. Glossário

| Termo | Definição |
|-------|-----------|
| Contact | Contato individual (nome, email, etc.) |
| ContactList | Grupo de contatos |
| CSV | Formato de arquivo separado por vírgula |
| Tags | Labels para categorização de contatos |

---

**Versão**: 1.0  
**Criado**: 2026-04-02  
**Autor**: Specification SDD - Beend  
**Status**: Approved
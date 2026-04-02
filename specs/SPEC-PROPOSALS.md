# SPEC-SDD: Módulo de Propostas Comerciais

## 1. Visão do Produto

### 1.1 Propósito do Módulo
O módulo de Propostas Comerciais permite a criação, gerenciamento, personalização e envio de propostas comerciais de forma profissional. Inclui gerenciamento de biblioteca de imagens, geração de PDF e envio por email.

### 1.2 Problema que Resolve
- Dificuldade em criar propostas profissionais padronizadas
- Processo manual de envio por email
- Falta de controle de status das propostas
- Ausência de versionamento e histórico

### 1.3 Objetivos de Negócio
- Reduzir tempo de criação de propostas em 70%
- Aumentar taxa de resposta de propostas em 30%
- Padronizar identidade visual das propostas
- Melhorar acompanhamento de conversões

---

## 2. Requisitos Funcionais

### 2.1 Gestão de Propostas

#### RF-001: Criar Proposta
- **Descrição**: Criar nova proposta comercial
- **Campos obrigatórios**:
  - clientName (nome do cliente)
  - proposalNumber (número único da proposta)
- **Campos opcionais**:
  - clientContactPerson (pessoa de contato)
  - clientEmail (email do cliente)
  - clientPhone (telefone do cliente)
  - clientCep, clientAddress, clientNumber, clientNeighborhood, clientState (endereço)
  - greeting (saudação inicial)
  - generalDescription (descrição geral do serviço/produto)
  - implementationReqs (requisitos de implementação)
  - technicalSupport (suporte técnico)
  - warranty (garantia)
  - systemFeatures (recursos do sistema - formato lista)
  - paymentTerms (forma de pagamento)
  - finalConsiderations (considerações finais)
  - planType, planValue, planDescription (informações do plano)
  - shippingValue (valor do frete)
  - signatureName (nome do signatário)
  - signaturePhone (telefone do signatário)
- **Validações**:
  - clientName: mín 2, máx 200 caracteres
  - proposalNumber: formato "001/2026" ou automático
  - emails devem ser válidos se informados

#### RF-002: Editar Proposta
- **Descrição**: Modificar proposta existente
- **Restrições**: 
  - Propostas com status SENT ou APPROVED podem ter restrições de edição
  - Histórico de alterações deve ser mantido

#### RF-003: Listar Propostas
- **Descrição**: Exibir todas as propostas do usuário
- **Filtros**: status, cliente, data
- **Ordenação**: Data de criação, data de envio, número
- **Paginação**: 20 itens por página

#### RF-004: Clonar Proposta
- **Descrição**: Criar cópia de proposta existente
- **Fluxo**:
  1. Usuário clica em "Clonar" em uma proposta
  2. Sistema cria cópia com:
     - Mesmo conteúdo
     - Novo ID
     - Novo proposalNumber
     - Status DRAFT
     - Nova data de criação

#### RF-005: Excluir Proposta
- **Descrição**: Remover proposta do sistema
- **Restrições**: Apenas propostas com status DRAFT podem ser excluídas
- **Cascade**: Exclui itens e imagens relacionados

### 2.2 Gestão de Itens

#### RF-006: Adicionar Item
- **Descrição**: Adicionar item/serviço à proposta
- **Campos**:
  - name (nome do item)
  - description (descrição detalhada)
  - quantity (quantidade)
  - unitPrice (valor unitário)
  - subtotal (calculado automaticamente: quantity × unitPrice)
  - order (ordem de exibição)
- **Fluxo**:
  1. Usuário clica em "Adicionar Item"
  2. Preenche campos do item
  3. Sistema calcula subtotal automaticamente
  4. Sistema recalcula total da proposta

#### RF-007: Editar Item
- **Descrição**: Modificar item existente
- **Reativo**: Totais são recalculados automaticamente

#### RF-008: Remover Item
- **Descrição**: Excluir item da proposta
- **Reativo**: Totais são recalculados automaticamente

#### RF-009: Reordenar Itens
- **Descrição**: Alterar ordem dos itens na proposta
- **Interface**: Drag and drop ou botões de ordenação

### 2.3 Biblioteca de Imagens

#### RF-010: Listar Imagens
- **Descrição**: Exibir biblioteca de imagens do usuário
- **Campos exibidos**: thumbnail, caption, data de upload
- **Ações**: Visualizar, deletar

#### RF-011: Upload de Imagem
- **Descrição**: Enviar nova imagem para biblioteca
- **Especificações**:
  - Formatos: JPEG, PNG, WebP
  - Tamanho máximo: 5MB
  - Geração de thumbnail automática
- **Fluxo**:
  1. Usuário seleciona arquivo
  2. Sistema valida tipo e tamanho
  3. Upload para storage (Supabase ou S3)
  4. Gera URL pública
  5. Salva registro no banco com caption opcional

#### RF-012: Excluir Imagem
- **Descrição**: Remover imagem da biblioteca
- **Cascade**: Remove arquivo do storage e registro do banco

#### RF-013: Usar Imagem na Proposta
- **Descrição**: Adicionar imagem da biblioteca à proposta
- **Campos**:
  - imageUrl (URL da imagem)
  - caption (legenda)
  - imageType (custom, system_screenshot)
  - order (ordem de exibição)
- **Limite**: Máximo 10 imagens por proposta

### 2.4 Geração de PDF

#### RF-014: Gerar PDF
- **Descrição**: Criar arquivo PDF da proposta
- **Template**:
  - Logo do usuário em header
  - Dados do cliente
  - Corpo da proposta (descrições)
  - Tabela de itens com valores
  - Total geral
  - Informações de pagamento
  - Imagens do sistema
  - Assinatura
- **Formato**: A4, portrait, UTF-8
- **Fluxo**:
  1. Usuário clica em "Gerar PDF"
  2. Sistema monta HTML do template
  3. Converte para PDF (browser print ou API)
  4. Exibe preview ou faz download

### 2.5 Envio por Email

#### RF-015: Enviar Proposta por Email
- **Descrição**: Enviar proposta em PDF por email
- **Campos**:
  - recipientEmail (email do destinatário)
  - subject (assunto do email)
  - message (mensagem adicional opcional)
- **Fluxo**:
  1. Usuário clica em "Enviar por Email"
  2. Preenche campos do email
  3. Sistema gera PDF
  4. Sistema envia email com PDF em anexo
  5. Atualiza status para SENT
  6. Registra data de envio

#### RF-016: Templates de Email
- **Descrição**: Modelos de email para envio
- **Default**: Template padrão com cores da marca
- **Personalizável**: Mensagem customizável

### 2.6 Status e Workflow

#### RF-017: Atualizar Status
- **Descrição**: Alterar status da proposta
- **Statuses válidos**:
  - DRAFT: Rascunho
  - SENT: Enviada ao cliente
  - VIEWED: Visualizada pelo cliente
  - APPROVED: Aprovada pelo cliente
  - REPROVED: Reprovada pelo cliente
  - EXPIRED: Expirou (data de validade passou)

#### RF-018: Definir Validade
- **Descrição**: Definir data de validade da proposta
- **Campo**: validUntil (date)
- **Regra**: Ao atingir data, status pode自动 mudar para EXPIRED

---

## 3. Requisitos Não-Funcionais

### 3.1 Performance
- Geração de PDF < 5 segundos
- Envio de email < 3 segundos
- Carregamento da listagem < 1 segundo

### 3.2 Escalabilidade
- Suporte a 10.000 propostas por usuário
- Biblioteca de imagens: até 1.000 imagens por usuário

### 3.3 Segurança
- Validação de acesso (usuário só vê suas propostas)
- Upload de arquivos: validação de tipo e tamanho
- Tokens de acesso a storage com expiração
- Rate limiting: 50 requisições/minuto

### 3.4 Usabilidade
- Interface intuitiva com preview em tempo real
- Atalhos de teclado para ações frequentes
- Autosave de rascunhos a cada 30 segundos
- Ctrl+S para salvar

---

## 4. Design do Banco de Dados

### 4.1 Tabelas

#### Proposal
```prisma
model Proposal {
  id                    String   @id @default(cuid())
  userId                String
  proposalNumber        String
  clientName            String
  clientContactPerson   String?
  clientEmail           String?
  clientPhone           String?
  clientCep             String?
  clientAddress         String?
  clientAddressNumber   String?
  clientNeighborhood   String?
  clientState           String?
  
  greeting              String?
  generalDescription   String?
  implementationReqs   String?
  technicalSupport     String?
  warranty             String?
  systemFeatures       String?
  paymentTerms         String?
  finalConsiderations  String?
  
  planType             String?
  planValue            Float?
  planDescription      String?
  
  shippingValue        Float?
  totalValue           Float?
  
  proposalDate         DateTime @default(now())
  validUntil           DateTime?
  status               String   @default("DRAFT")
  
  signatureName        String?
  signaturePhone       String?
  
  templateId           String?
  
  sentAt               DateTime?
  viewedAt             DateTime?
  
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  
  user                 User     @relation(fields: [userId], references: [id])
  items                ProposalItem[]
  images               ProposalImage[]
  template             ProposalTemplate? @relation(fields: [templateId], references: [id])
}
```

#### ProposalItem
```prisma
model ProposalItem {
  id            String   @id @default(cuid())
  proposalId    String
  name          String
  description   String?
  quantity      Int      @default(1)
  unitPrice     Float
  subtotal      Float
  shippingValue Float?
  order         Int      @default(0)
  
  proposal      Proposal @relation(fields: [proposalId], references: [id], onDelete: Cascade)
}
```

#### ProposalImage
```prisma
model ProposalImage {
  id          String   @id @default(cuid())
  proposalId  String
  imageUrl    String
  caption     String?
  imageType   String   @default("custom")
  order       Int      @default(0)
  
  proposal    Proposal @relation(fields: [proposalId], references: [id], onDelete: Cascade)
}
```

#### ProposalLibraryImage
```prisma
model ProposalLibraryImage {
  id               String   @id @default(cuid())
  userId           String
  imageUrl         String
  cloudStoragePath String?
  caption          String?
  createdAt        DateTime @default(now())
  
  user             User     @relation(fields: [userId], references: [id])
}
```

#### ProposalTemplate
```prisma
model ProposalTemplate {
  id                 String   @id @default(cuid())
  userId             String
  name               String
  description        String?
  generalDescription String?
  implementationReqs String?
  technicalSupport   String?
  warranty           String?
  systemFeatures     String?
  paymentTerms       String?
  finalConsiderations String?
  isDefault          Boolean  @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  user               User     @relation(fields: [userId], references: [id])
  proposals          Proposal[]
}
```

---

## 5. Constitution (Regras Não Negociáveis)

### 5.1 Regras de Implementação

1. **Númeração de Propostas**
   - Formato: `${序号}/${ano}` (ex: 001/2026)
   - Deve ser único por usuário
   - Gerado automaticamente ou manual

2. **Cálculos Financeiros**
   - Usar floats para valores, sempre com 2 casas decimais
   - Arredondamento: Math.round(valor * 100) / 100
   - Validar valores negativos ou zero

3. **Upload de Imagens**
   - Validar MIME type server-side (não confiar no client)
   - Limite de 5MB rigidamente aplicado
   - Nome de arquivo sanitizado

4. **Status Transitions**
   - DRAFT → qualquer status
   - SENT → VIEWED, APPROVED, REPROVED, EXPIRED
   - VIEWED → APPROVED, REPROVED, EXPIRED
   - APPROVED/REPROVED/EXPIRED → não permite mudança

### 5.2 Regras de UI/UX

1. **Formulários**
   - Campos obrigatórios marcados com *
   - Validação inline em tempo real
   - Mensagens de erro claras e posicionadas

2. **Preview**
   - Sempre mostrar preview da proposta antes de enviar
   - Preview deve refletir exatamente o PDF final

3. **Feedback**
   - Toast para todas as ações (sucesso/erro)
   - Loading states em todas as operações async

---

## 6. API Endpoints

### 6.1 Propostas

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /api/proposals | Listar propostas | ✅ |
| POST | /api/proposals | Criar proposta | ✅ |
| GET | /api/proposals/[id] | Detalhar proposta | ✅ |
| PUT | /api/proposals/[id] | Atualizar proposta | ✅ |
| DELETE | /api/proposals/[id] | Excluir proposta | ✅ |
| POST | /api/proposals/[id]/clone | Clonar proposta | ✅ |
| POST | /api/proposals/[id]/email | Enviar por email | ✅ |
| GET | /api/proposals/[id]/pdf | Gerar PDF | ✅ |

### 6.2 Itens

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | /api/proposals/[id]/items | Adicionar item | ✅ |
| PUT | /api/proposals/[id]/items/[itemId] | Atualizar item | ✅ |
| DELETE | /api/proposals/[id]/items/[itemId] | Remover item | ✅ |

### 6.3 Imagens

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /api/proposals/library-images | Listar biblioteca | ✅ |
| POST | /api/proposals/library-images | Upload imagem | ✅ |
| DELETE | /api/proposals/library-images/[id] | Remover imagem | ✅ |
| POST | /api/proposals/[id]/images | Adicionar à proposta | ✅ |
| DELETE | /api/proposals/[id]/images/[imageId] | Remover da proposta | ✅ |

### 6.4 Templates

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /api/proposal-templates | Listar templates | ✅ |
| POST | /api/proposal-templates | Criar template | ✅ |
| PUT | /api/proposal-templates/[id] | Atualizar template | ✅ |
| DELETE | /api/proposal-templates/[id] | Excluir template | ✅ |

---

## 7. Decomposição em Tasks

### Epic: Propostas Comerciais

| Task | Descrição | Prioridade |
|------|-----------|------------|
| TASK-001 | Setup do banco (Proposal, ProposalItem, ProposalImage, ProposalLibraryImage) | Alta |
| TASK-002 | CRUD completo de propostas | Alta |
| TASK-003 | Gestão de itens com cálculos automáticos | Alta |
| TASK-004 | Biblioteca de imagens com upload | Alta |
| TASK-005 | Template de PDF | Alta |
| TASK-006 | Envio por email com PDF | Alta |
| TASK-007 | Workflow de status | Média |
| TASK-008 | Templates de proposta | Média |
| TASK-009 | Clonagem de propostas | Média |
| TASK-010 | Autosave de rascunhos | Baixa |

---

## 8. Fluxos Principais

### Fluxo: Criar e Enviar Proposta
```
1. Usuário acessa /proposals/new
2. Preenche dados do cliente
3. Adiciona itens com valores
4. Seleciona imagens da biblioteca (opcional)
5. Define condições de pagamento
6. Define data de validade
7. Clica em "Preview"
8. Revisa o layout
9. Clica em "Enviar por Email"
10. Preenche destinatário e mensagem
11. Confirma envio
12. Sistema envia email com PDF
13. Status muda para SENT
14. Usuário visualiza na listagem
```

### Fluxo: Usar Template
```
1. Usuário acessa /proposals/new
2. Seleciona template existente
3. Campos são preenchidos automaticamente
4. Usuário personaliza conforme necessidade
5. Continua fluxo normal de criação
```

---

## 9. Glossário

| Termo | Definição |
|-------|-----------|
| Proposal | Proposta comercial completa |
| ProposalItem | Item/serviço da proposta com preço |
| ProposalImage | Imagem inserida na proposta |
| ProposalLibraryImage | Imagem armazenada na biblioteca do usuário |
| ProposalTemplate | Modelo de proposta com textos padrão |
| Status DRAFT | Proposta em edição |
| Status SENT | Proposta enviada ao cliente |
| Status APPROVED | Proposta aprovada pelo cliente |

---

## 10. Referências

- Template de PDF baseado em propostas comerciais tradicionais
- Sistema de biblioteca similar a gerenciadores de mídia
- Envio de email via API externa (AbacusAI/Gmail/SendGrid)

---

**Versão**: 1.0  
**Criado**: 2026-04-02  
**Autor**: Specification SDD - Beend  
**Status**: Approved
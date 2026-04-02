# Módulo de Propostas Comerciais

## Visão Geral

O módulo de propostas permite criar, editar, enviar e gerenciar propostas comerciais de forma profissional.

---

## Estrutura de Dados

### Proposta (Proposal)
```prisma
model Proposal {
  id                  String   @id @default(cuid())
  userId              String
  proposalNumber      String
  clientName          String
  clientContactPerson String?
  clientEmail         String?
  clientPhone         String?
  clientCep           String?
  clientAddress       String?
  
  greeting            String?
  generalDescription String?
  implementationReqs String?
  technicalSupport   String?
  warranty           String?
  systemFeatures     String?
  paymentTerms       String?
  finalConsiderations String?
  
  planType           String?
  planValue          Float?
  planDescription    String?
  
  shippingValue      Float?
  totalValue         Float?
  
  proposalDate       DateTime @default(now())
  validUntil         DateTime?
  status             String   @default("DRAFT")
  
  signatureName      String?
  signaturePhone     String?
  
  templateId         String?
  
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  user               User     @relation(fields: [userId], references: [id])
  items              ProposalItem[]
  images             ProposalImage[]
}
```

### Item de Proposta (ProposalItem)
```prisma
model ProposalItem {
  id          String   @id @default(cuid())
  proposalId  String
  name        String
  description String?
  quantity    Int      @default(1)
  unitPrice   Float
  subtotal    Float
  shippingValue Float?
  order       Int      @default(0)
  
  proposal    Proposal @relation(fields: [proposalId], references: [id], onDelete: Cascade)
}
```

### Imagem de Proposta (ProposalImage)
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

---

## Biblioteca de Imagens

### Armazenamento
- Imagens armazenadas em **Supabase Storage** ou **AWS S3**
- Caminho: `proposal-images/{userId}/{timestamp}-{filename}`

### API

#### GET `/api/proposals/library-images`
Lista todas as imagens da biblioteca do usuário

#### POST `/api/proposals/library-images`
Dois tipos de ação:

1. **Obter URL de upload**
```json
{
  "action": "get-upload-url",
  "fileName": "imagem.jpg",
  "contentType": "image/jpeg"
}
```

2. **Salvar na biblioteca**
```json
{
  "action": "save",
  "cloudStoragePath": "proposal-images/xxx/xxx.jpg",
  "caption": "Descrição da imagem"
}
```

#### DELETE `/api/proposals/library-images/[id]`
Remove imagem da biblioteca e do storage

---

## Fluxo de Criação de Proposta

### 1. Informações do Cliente
- Nome/Razão Social
- Pessoa de contato
- Email e telefone
- Endereço (CEP, endereço, etc.)

### 2. Conteúdo da Proposta
- Saudação inicial
- Descrição geral
- Requisitos de implementação
- Suporte técnico
- Garantia
- Recursos do sistema
- Forma de pagamento
- Considerações finais

### 3. Itens e Valores
- Adicionar itens com nome, descrição, quantidade e valor
- Cálculo automático de subtotal
- Valor de frete
- Total geral

### 4. Imagens
- Selecionar da biblioteca
- Ou fazer upload de novas imagens

### 5. Assinatura
- Nome do signatário
- Telefone

---

## Geração de PDF

### Processo
1. Gerar HTML baseado no template
2. Incluir dados da proposta, itens, imagens
3. Converter para PDF (via browser print ou API)

### Template HTML
O sistema gera um PDF profissional com:
- Logo da empresa
- Dados do cliente e proposta
- Descrição dos serviços/produtos
- Tabela de valores
- Imagens do sistema
- Informações de pagamento
- Assinatura

---

## Envio por Email

### API: POST `/api/proposals/[id]/email`

**Request:**
```json
{
  "recipientEmail": "cliente@email.com",
  "subject": "Proposta Comercial #001",
  "message": "Olá, segue a proposta..."
}
```

### Configuração de Email

O sistema pode usar:
- **AbacusAI API** (atual)
- **Gmail SMTP** (em implementação)
- **SendGrid/Mailgun** (futuro)

---

## Status das Propostas

| Status | Descrição |
|--------|-----------|
| **DRAFT** | Rascunho - em edição |
| **SENT** | Enviada ao cliente |
| **VIEWED** | Visualizada pelo cliente |
| **APPROVED** | Aprovada pelo cliente |
| **REJECTED** | Reprovada pelo cliente |
| **EXPIRED** | Expirou (passou da validade) |

---

## Templates de Proposta

O sistema permite criar templates com:
- Texto padrão para reuse
- Configurações de layout
- Claúsulas fixas

---

## API de Propostas

### GET `/api/proposals`
Lista propostas do usuário

### POST `/api/proposals`
Cria nova proposta

### GET `/api/proposals/[id]`
Busca proposta por ID

### PUT `/api/proposals/[id]`
Atualiza proposta

### DELETE `/api/proposals/[id]`
Remove proposta

### POST `/api/proposals/[id]/email`
Envia proposta por email

### GET `/api/proposals/[id]/pdf`
Gera PDF da proposta

### POST `/api/proposals/[id]/clone`
Clona proposta existente
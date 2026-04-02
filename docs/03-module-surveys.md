# Módulo de Pesquisas de Satisfação

## Visão Geral

O módulo de pesquisas permite criar e gerenciar campanhas de pesquisa de satisfação com diversos tipos de perguntas e formas de coleta.

---

## Tipos de Perguntas

| Tipo | Descrição | Uso |
|------|-----------|-----|
| **SMILE** | 5 opções de emoji (muito satisfeito a muito insatisfeito) | Satisfação geral |
| **SIMPLE_SMILE** | 2 opções (Satisfeito/Insatisfeito) | Feedback rápido |
| **NPS** | Escala 0-10 | Net Promoter Score |
| **SCALE** | Escala customizável (ex: 1-5 ou 1-10) | Avaliação numérica |
| **SINGLE_CHOICE** | Uma opção entre várias | Escolha única |
| **MULTIPLE_CHOICE** | Múltiplas opções | Seleção múltipla |
| **TEXT_INPUT** | Campo de texto livre | Comentários |
| **EMPLOYEE_RATING** | Avaliação de funcionário específico | Avaliação de colaboradores |

---

## Fluxo de Criação de Campanha

1. **Informações básicas**
   - Título da campanha
   - Descrição
   - Status (Ativa/Inativa)

2. **Configuração de perguntas**
   - Adicionar perguntas
   - Definir tipo de cada pergunta
   - Marcar como obrigatória
   - Permitir comentário opcional
   - Ordenar perguntas

3. **Configurações adicionais**
   - Coletar nome do respondente
   - Coletar telefone
   - Coletar email
   - Texto LGPD

4. **Publicação**
   - Gerar link público único
   - Vincular a terminais

---

## Pesquisa Pública (`/survey/[uniqueLink]`)

### Acesso
- URL: `https://beend.app/survey/[uniqueLink]`
- Link único por campanha
- Pode ter parâmetro `?qr=true` para identificar origem

### Comportamento
1. Expande automaticamente a primeira pergunta
2. Ao responder, avança para próxima pergunta
3. Ao final, coletor de dados do cliente (se configurado)
4. Tela de agradecimento

### Estrutura de Dados
```typescript
interface Answer {
  questionId: string;
  rating: number | null;      // Para SMILE, NPS, SCALE
  selectedOptions: string[];   // Para SINGLE_CHOICE, MULTIPLE_CHOICE
  comment: string;            // Para TEXT_INPUT
}
```

---

## Terminal de Pesquisa (`/terminal-v2`)

### Fluxo
1. **Login do terminal** → Autenticação com usuário/senha
2. **Selecionar campanha** → Escolher campanha ativa
3. **Pesquisa** → Interface otimizada para totem
4. **Coleta de dados** → (opcional) Nome/telefone/email
5. **Agradecimento** → Tela final

### Características
- Timeout de 120 segundos entre interações
- Interface dark mode
- Layout otimizado para touchscreen
- Auto-avanço nas perguntas (sem botão)

### Diferenças vs Pesquisa Pública
| Aspecto | Pública | Terminal |
|---------|---------|----------|
| Autenticação | Nenhuma | Login obrigatório |
| Interface | Expand/collapse | Uma pergunta por tela |
| Avanço | Automático | Automático (sem comentário) |
| Timeout | Não | 120 segundos |

---

## Armazenamento de Respostas

### Tabela: Response
```prisma
model Response {
  id              String   @id @default(cuid())
  campaignId      String
  terminalId      String?  // Para respostas de terminal
  respondentName  String?
  respondentPhone String?
  respondentEmail String?
  createdAt       DateTime @default(now())
  
  answers         Answer[]
}
```

### Tabela: Answer
```prisma
model Answer {
  id                String   @id @default(cuid())
  responseId        String
  questionId        String
  rating            Int?     // Rating (1-5 ou 0-10)
  selectedOptions   String[] // Opções selecionadas
  comment           String?  // Comentário
  selectedEmployeeId String? // Para Employee Rating
  createdAt         DateTime @default(now())
  
  response          Response @relation(fields: [responseId], references: [id])
}
```

---

## API de Respostas

### POST `/api/responses`
Cria nova resposta de pesquisa

**Request:**
```json
{
  "campaignId": "cmngxxx",
  "terminalId": "cmngyyy", // opcional
  "answers": [
    {
      "questionId": "perg1",
      "rating": 5,
      "selectedOptions": [],
      "comment": null
    }
  ]
}
```

**Response:**
```json
{
  "id": "cmngzzz",
  "campaignId": "cmngxxx",
  "answers": [...]
}
```

### PATCH `/api/responses`
Atualiza dados de contato de uma resposta existente

---

## Dashboards

O sistema oferece dashboards com:
- Total de respostas
- Média de satisfação
- Distribuição de ratings
- Respostas por dia
- Palavras-chave de sentiment analysis
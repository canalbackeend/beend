# SPEC-SDD: Módulo de Pesquisas de Satisfação

## 1. Visão do Produto

### 1.1 Propósito do Módulo
O módulo de Pesquisas de Satisfação permite a criação, gerenciamento e coleta de respostas de pesquisas de satisfação através de múltiplos canais (link público, terminais físicos, QR Code). O módulo fornece dashboards analíticos para acompanhamento em tempo real dos resultados.

### 1.2 Problema que Resolve
- Dificuldade em coletar feedback de clientes em pontos de atendimento físicos
- Falta de padronização na avaliação de satisfação
- Ausência de dados estruturados para análise de experiência do cliente
- Inabilidade de correlacionar satisfação com características específicas do atendimento

### 1.3 Objetivos de Negócio
- Aumentar taxa de resposta de pesquisas em 50%
- Reduzir tempo de coleta de feedback de dias para minutos
- Fornecer NPS e Satisfaction Score em tempo real
- Identificar problemas de satisfação rapidamente

---

## 2. Requisitos Funcionais

### 2.1 Gestão de Campanhas

#### RF-001: Criar Campanha
- **Descrição**: Criar nova campanha de pesquisa com configurações básicas
- **Entradas**: título, descrição, status (ativa/inativa), cor_theme
- **Validações**:
  - Título obrigatório (mín 3, máx 100 caracteres)
  - Descrição opcional (máx 500 caracteres)
- **Fluxo**:
  1. Usuário acessa /campaigns/new
  2. Preenche formulário com dados da campanha
  3. Sistema valida entradas
  4. Cria registro no banco
  5. Retorna para listagem com mensagem de sucesso
- **Resultado**: Campanha criada com ID único

#### RF-002: Editar Campanha
- **Descrição**: Modificar configurações de campanha existente
- **Restrições**: Apenas campanhas com status DRAFT podem ter alterações estruturais
- **Fluxo**:
  1. Usuário acessa /campaigns/[id]/edit
  2. Carrega dados existentes no formulário
  3. Usuário modifica campos desejados
  4. Sistema valida e atualiza registro

#### RF-003: Listar Campanhas
- **Descrição**: Exibir todas as campanhas do usuário logado
- **Filtros**: status (todas/ativas/inativas), data de criação
- **Ordenação**: Data de criação (mais recente primeiro)
- **Paginação**: 20 itens por página

#### RF-004: Ativar/Desativar Campanha
- **Descrição**: Alterar status da campanha
- **Regra de Negócio**:
  - Campanhas ativas aceitam respostas
  - Campanhas inativas não aceitam novas respostas
  - Respostas históricas são mantidas ao desativar

### 2.2 Gestão de Perguntas

#### RF-005: Adicionar Pergunta
- **Descrição**: Incluir nova pergunta em uma campanha
- **Campos**:
  - texto (obrigatório)
  - tipo (obrigatório): SMILE | SIMPLE_SMILE | NPS | SCALE | SINGLE_CHOICE | MULTIPLE_CHOICE | TEXT_INPUT | EMPLOYEE_RATING
  - ordem (automático)
  - isRequired (boolean, default: false)
  - allowOptionalComment (boolean, default: false)
  - options (array, apenas para tipos choice)
  - scaleMin, scaleMax (para tipos SCALE)
  - scaleMinLabel, scaleMaxLabel (para tipos SCALE)

#### RF-006: Editar Pergunta
- **Descrição**: Modificar pergunta existente
- **Restrições**: Não permitido após primeira resposta recebida

#### RF-007: Reordenar Perguntas
- **Descrição**: Alterar ordem das perguntas na campanha
- **Interface**: Drag and drop ou botões de subir/descer

#### RF-008: Remover Pergunta
- **Descrição**: Excluir pergunta da campanha
- **Restrições**: Não permitido após primeira resposta recebida

### 2.3 Tipos de Pergunta

#### SMILE (Emoji 5 opções)
- 5 ícones: Muito Satisfeito (5), Satisfeito (4), Regular (3), Insatisfeito (2), Muito Insatisfeito (1)
- Labels configuráveis por opção
- Cores por opção (opcional)

#### SIMPLE_SMILE (Sim/Não)
- 2 opções: Satisfeito (1), Insatisfeito (0)
- Para feedback rápido

#### NPS (Net Promoter Score)
- Escala: 0-10
- Categorização automática:
  - 9-10: Promotor
  - 7-8: Passivo
  - 0-6: Detrator
- Cálculo automático: NPS = %Promotores - %Detratores

#### SCALE (Escala Numérica)
- Limites configuráveis (ex: 1-5, 1-7, 1-10)
- Labels de extremidade configuráveis
- Cálculo de média automática

#### SINGLE_CHOICE (Escolha Única)
- Múltiplas opções definidas pelo usuário
- Selecionar apenas uma opção

#### MULTIPLE_CHOICE (Escolha Múltipla)
- Múltiplas opções definidas pelo usuário
- Permitir múltiplas seleção

#### TEXT_INPUT (Texto Livre)
- Campo de texto multilinha
- Limite de caracteres configurável
- Análise de sentiment (futuro)

#### EMPLOYEE_RATING (Avaliação de Colaborador)
- Selecionar colaborador específico
- Avaliação por estrelas (1-5)
- Vinculado ao cadastro de employees

### 2.4 Configurações de Coleta

#### RF-009: Configurar Dados do Respondente
- **Campos opcionais**:
  - collectName: boolean
  - collectPhone: boolean
  - collectEmail: boolean
- **Regra**: Ao menos um dado deve ser coletado ou configuração desabilitada

#### RF-010: Configurar Texto LGPD
- **Descrição**: Texto exibido antes da pesquisa sobre tratamento de dados
- **Campos**: lgpdText (text, opcional)
- **Default**: "Seus dados serão tratados com confidencialidade..."

### 2.5 Respostas de Pesquisa

#### RF-011: Responder Pesquisa (Pública)
- **URL**: /survey/[uniqueLink]
- **Fluxo**:
  1. Acessar link único da campanha
  2. Visualizar perguntas (formato accordion)
  3. Responder cada pergunta
  4. Ao final, coletar dados do respondente (se configurado)
  5. Exibir tela de agradecimento

#### RF-012: Responder Pesquisa (Terminal)
- **URL**: /terminal-v2/survey
- **Diferenças**:
  - Autenticação de terminal obrigatória
  - Uma pergunta por tela
  - Auto-avanço após resposta (sem comentário opcional)
  - Timeout de 120 segundos

#### RF-013: Armazenar Resposta
- **Campos**:
  - campaignId (string, obrigatório)
  - terminalId (string, opcional - apenas para respostas de terminal)
  - respondentName (string, opcional)
  - respondentPhone (string, opcional)
  - respondentEmail (string, opcional)
  - answers (array, obrigatório)
    - questionId (string)
    - rating (number | null)
    - selectedOptions (array de strings)
    - comment (string | null)
    - selectedEmployeeId (string | null)

### 2.6 Dashboards e Relatórios

#### RF-014: Dashboard Principal
- Total de respostas
- Média de satisfação geral
- NPS atual
- Distribuição de ratings (gráfico)
- Respostas por dia (gráfico de linha)
- Evolução temporal (gráfico)

#### RF-015: Detalhamento por Pergunta
- Média por pergunta
- Distribuição de respostas
- Comparação entre perguntas

#### RF-016: Análise de Sentimentos
- Extrair palavras-chave de comentários
- Classificação Positivo/Negativo/Neutro
- nuvem de palavras mais frequentes

---

## 3. Requisitos Não-Funcionais

### 3.1 Performance
- Tempo de carregamento da página de pesquisa < 2s
- Tempo de resposta da API de envío de respostas < 500ms
- Suporte a 100 respostas simultâneas

### 3.2 Escalabilidade
- Banco de dados deve suportar até 1 milhão de respostas
- Storage para imagens de evidências (futuro)

### 3.3 Segurança
- Validação de entrada em todos os endpoints
- Sanitização de dados do respondente
- Rate limiting: máx 100 requisições/minuto por IP
- Link único da campanha não pode ser adivinhável (UUID)

### 3.4 Usabilidade
- Interface responsiva para mobile
- Compatibilidade: Chrome, Firefox, Safari, Edge
- Accessibility: WCAG 2.1 Level A
- Dark mode para terminal

### 3.5 Disponibilidade
- Uptime: 99.5%
- Backup automático diário do banco

---

## 4. Design do Banco de Dados

### 4.1 Tabelas

#### Campaign
```prisma
model Campaign {
  id              String     @id @default(cuid())
  userId          String
  title           String
  description     String?
  status          String     @default("DRAFT") // DRAFT, ACTIVE, INACTIVE
  themeColor      String?
  collectName     Boolean    @default(false)
  collectPhone    Boolean    @default(false)
  collectEmail    Boolean    @default(false)
  lgpdText        String?
  uniqueLink     String     @unique // UUID para acesso público
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  user            User       @relation(fields: [userId], references: [id])
  questions       Question[]
  responses       Response[]
  terminalCampaigns TerminalCampaign[]
}
```

#### Question
```prisma
model Question {
  id                   String   @id @default(cuid())
  campaignId           String
  text                 String
  type                 String   // SMILE, SIMPLE_SMILE, NPS, SCALE, SINGLE_CHOICE, MULTIPLE_CHOICE, TEXT_INPUT, EMPLOYEE_RATING
  order                Int
  isRequired           Boolean  @default(false)
  allowOptionalComment Boolean  @default(false)
  scaleMin             Int?
  scaleMax             Int?
  scaleMinLabel        String?
  scaleMaxLabel        String?
  createdAt            DateTime @default(now())
  
  campaign             Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  options              QuestionOption[]
  answers              Answer[]
}
```

#### QuestionOption
```prisma
model QuestionOption {
  id          String   @id @default(cuid())
  questionId  String
  text        String
  color       String?  // Hex color para representação visual
  imageUrl    String?  // Para Employee Rating
  order       Int      @default(0)
  
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
}
```

#### Response
```prisma
model Response {
  id                String    @id @default(cuid())
  campaignId        String
  terminalId        String?   // Null para respostas públicas
  respondentName    String?
  respondentPhone   String?
  respondentEmail   String?
  source            String?   // WEB, TERMINAL, QR_CODE
  createdAt         DateTime  @default(now())
  
  campaign          Campaign  @relation(fields: [campaignId], references: [id])
  terminal          Terminal? @relation(fields: [terminalId], references: [id])
  answers           Answer[]
}
```

#### Answer
```prisma
model Answer {
  id                  String   @id @default(cuid())
  responseId          String
  questionId          String
  rating              Int?     // 1-5 ou 0-10
  selectedOptions     String[] // IDs das opções selecionadas
  comment             String?
  selectedEmployeeId  String?  // Para Employee Rating
  createdAt          DateTime  @default(now())
  
  response            Response @relation(fields: [responseId], references: [id], onDelete: Cascade)
  question            Question @relation(fields: [questionId], references: [id])
  employee            Employee? @relation(fields: [selectedEmployeeId], references: [id])
}
```

---

## 5. Constitution (Regras Não Negociáveis)

### 5.1 Regras de Implementação

1. **Validação de Entrada**
   - Todo endpoint de API deve validar dados de entrada
   - Usar validação de tipos (TypeScript)
   - Sanitizar strings antes de persistir

2. **Respostas de API**
   - Todas as APIs devem retornar JSON estruturado
   - Success: `{ "success": true, "data": ... }`
   - Error: `{ "success": false, "error": "mensagem" }`
   - Códigos HTTP corretos: 200, 201, 400, 401, 404, 500

3. **Tratamento de Erros**
   - Nunca expor stack trace em produção
   - Log de erros em console/server
   - Mensagens amigáveis para usuário final

4. **Autenticação**
   - Validar sessão em todas as rotas privadas
   - Usar middleware para proteção de rotas
   - Tokens JWT com expiração máxima de 7 dias

### 5.2 Regras de Frontend

1. **Componentes**
   - Usar componentes shadcn/ui
   - Manter consistência visual
   - Implementar loading states

2. **Feedback ao Usuário**
   - Toast notifications para ações do usuário
   - Loading spinners durante requisições
   - Validação inline em formulários

3. **Responsividade**
   - Mobile-first design
   - Breakpoints: sm (640px), md (768px), lg (1024px)

### 5.3 Regras de Banco

1. **Migrações**
   - Nunca modificar migrations existentes
   - Sempre criar nova migration para alterações
   - Testar migrations em ambiente local antes de produção

2. **Índices**
   - Criar índice em campaignId na tabela Response
   - Criar índice em campaignId na tabela Question
   - Criar índice em uniqueLink na tabela Campaign

---

## 6. API Endpoints

### 6.1 Campanhas

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /api/campaigns | Listar campanhas | ✅ |
| POST | /api/campaigns | Criar campanha | ✅ |
| GET | /api/campaigns/[id] | Detalhar campanha | ✅ |
| PUT | /api/campaigns/[id] | Atualizar campanha | ✅ |
| DELETE | /api/campaigns/[id] | Excluir campanha | ✅ |

### 6.2 Perguntas

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | /api/campaigns/[id]/questions | Adicionar pergunta | ✅ |
| PUT | /api/campaigns/[id]/questions/[questionId] | Atualizar pergunta | ✅ |
| DELETE | /api/campaigns/[id]/questions/[questionId] | Remover pergunta | ✅ |
| PUT | /api/campaigns/[id]/questions/reorder | Reordenar perguntas | ✅ |

### 6.3 Respostas (Público)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | /api/responses | Enviar resposta | ❌ |
| PATCH | /api/responses | Atualizar dados do respondente | ❌ |
| GET | /api/survey/[uniqueLink] | Obter dados da pesquisa | ❌ |

---

## 7. Decomposição em Tasks

### Epic: Pesquisas de Satisfação

| Task | Descrição | Prioridade |
|------|-----------|------------|
| TASK-001 | Setup do banco (migration Campaign, Question, Response, Answer) | Alta |
| TASK-002 | CRUD de Campanhas | Alta |
| TASK-003 | CRUD de Perguntas com tipos | Alta |
| TASK-004 | API pública de survey ([uniqueLink]) | Alta |
| TASK-005 | Frontend de survey público | Alta |
| TASK-006 | Resposta storage e validação | Alta |
| TASK-007 | Dashboard de resultados | Média |
| TASK-008 | Gráficos e visualizações | Média |
| TASK-009 | Calculadora de NPS | Média |
| TASK-010 | Análise de sentiment (avançado) | Baixa |

---

## 8. Casos de Uso Principais

### UC-001: Criar Pesquisa de Satisfação
1. Usuário faz login
2. Acessa /campaigns/new
3. Preenche título e descrição
4. Adiciona perguntas (ex: 3 perguntas SMILE)
5. Configura coleta de dados (nome, email)
6. Ativa campanha
7. Sistema gera link único
8. Usuário compartilha link

### UC-002: Responder Pesquisa via Link
1. Cliente acessa link público
2. Visualiza primeira pergunta expandida
3. Seleciona resposta
4. Sistema avança para próxima pergunta
5. Ao final, solicita dados de contato
6. Exibe tela de agradecimento

### UC-002: Responder Pesquisa via Terminal
1. Operador faz login no terminal
2. Seleciona campanha ativa
3. Cliente toca na tela para iniciar
4. Seleciona resposta (auto-avanço)
5. Ao final, optional dados de contato
6. Tela de agradecimento
7. Timeout retorna para início

---

## 9. Glossário

| Termo | Definição |
|-------|-----------|
| NPS | Net Promoter Score - métrica de lealdade do cliente |
| Campaign | Conjunto de perguntas de uma pesquisa |
| Question | Uma pergunta individual da pesquisa |
| Response | Conjunto de respostas de um respondente |
| Answer | Resposta individual a uma pergunta |
| Terminal | Dispositivo físico para coleta de pesquisa |
| uniqueLink | URL pública única para acesso à pesquisa |

---

## 10. Referências

- Tipo de pesquisas baseado em metodologias NPS, CSAT, CES
- UI参考: pesquisade satisfação do tipo accordion (accordeon)
- Terminais: padrões de totem autoatendimento

---

**Versão**: 1.0  
**Criado**: 2026-04-02  
**Autor**: Specification SDD - Beend  
**Status**: Approved
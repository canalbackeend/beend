# SPEC-SDD: Módulo de Terminais

## 1. Visão do Produto

### 1.1 Propósito do Módulo
O módulo de Terminais permite a configuração e gerenciamento de dispositivos físicos (totens, tablets, quiosques) para coleta de pesquisas de satisfação em pontos de atendimento. Inclui autenticação de dispositivo, vínculo com campanhas e monitoramento de uso.

### 1.2 Problema que Resolve
- Necessidade de coleta de feedback em pontos físicos
- Falta de controle de acesso aos dispositivos de pesquisa
- Dificuldade em gerenciar múltiplos terminais
- Ausência de timeout e segurança em dispositivos compartilhados

### 1.3 Objetivos de Negócio
- Reduzir barreira de uso em terminais (login simplificado)
- Garantir segurança com timeout automático
- Permitir gerenciamento centralizado de múltiplos dispositivos
- Fornecer dados de uso por terminal

---

## 2. Requisitos Funcionais

### 2.1 Gestão de Terminais

#### RF-001: Criar Terminal
- **Descrição**: Registrar novo terminal no sistema
- **Campos obrigatórios**:
  - name (nome de identificação)
  - email (email único para login)
  - password (senha de acesso)
- **Campos opcionais**:
  - location (localização física, ex: "Recepção", "Caixa")
  - description (descrição adicional)
- **Validações**:
  - email deve ser único no sistema
  - nome: mín 2, máx 100 caracteres
  - senha: mín 6 caracteres

#### RF-002: Editar Terminal
- **Descrição**: Modificar configurações do terminal
- **Campos editáveis**: name, location, description, isActive
- **Restrição**: Email não pode ser alterado após criação

#### RF-003: Listar Terminais
- **Descrição**: Exibir todos os terminais do usuário
- **Informações exibidas**: nome, location, status (ativo/inativo), última resposta
- **Filtros**: status (todos/ativos/inativos)
- **Ações rápidas**: Ativar/desativar, editar, excluir

#### RF-004: Ativar/Desativar Terminal
- **Descrição**: Alterar status do terminal
- **Regra**: Terminais inativos não podem fazer login nem responder pesquisas
- **Histórico**: Manter registro de ativações/desativações

#### RF-005: Alterar Senha do Terminal
- **Descrição**: Redefinir senha de acesso
- **Fluxo**:
  1. Usuário solicita redefinição
  2. Sistema gera nova senha temporária
  3. Exibe nova senha para configuração no terminal

### 2.2 Autenticação de Terminal

#### RF-006: Login no Terminal
- **URL**: /terminal-v2/login
- **Campos**: email, password
- **Fluxo**:
  1. Operador informa credenciais
  2. Sistema valida credenciais
  3. Sistema verifica terminal ativo
  4. Sistema cria sessão JWT
  5. Redireciona para seleção de campanha
- **Validações**:
  - Credenciais corretas
  - Terminal está ativo
  - Usuário (dono do terminal) está ativo

#### RF-007: Logout do Terminal
- **Descrição**: Encerrar sessão do terminal
- **Fluxo**:
  1. Operador clica em logout
  2. Sistema limpa sessão
  3. Redireciona para tela de login

#### RF-008: Sessão JWT
- **Descrição**: Gerenciar token de sessão
- **Configurações**:
  - expiration: 24 horas (em desenvolvimento; 8h em produção)
  - cookie: httpOnly, secure, sameSite: strict
  - renewal: automático enquanto em uso

### 2.3 Vinculação de Campanhas

#### RF-009: Vincular Campanhas
- **Descrição**: Associar campanhas a um terminal
- **Campos**:
  - campaignId (ID da campanha)
  - order (ordem de execução)
  - customTitle (título customizado para o terminal)
  - isActive (ativa/inativa para este terminal)
- **Limite**: Máximo 50 campanhas por terminal

#### RF-010: Desvincular Campanha
- **Descrição**: Remover vínculo entre terminal e campanha
- **Regra**: Respostas históricas são mantidas

#### RF-011: Reordenar Campanhas
- **Descrição**: Alterar ordem de execução das campanhas no terminal

### 2.4 Sessão de Pesquisa no Terminal

#### RF-012: Iniciar Sessão de Pesquisa
- **URL**: /terminal-v2/survey
- **Pré-requisitos**:
  - Terminal autenticado
  - Campanha selecionada previamente
- **Fluxo**:
  1. Sistema carrega dados da sessão (localStorage)
  2. Exibe primeira pergunta
  3. Inicia timer de timeout

#### RF-013: Timeout de Sessão
- **Descrição**: Encerrar sessão por inatividade
- **Configuração**:
  - Timeout: 120 segundos (2 minutos)
  - Reset: a cada interação do usuário (touch/click)
- **Comportamento ao expirar**:
  - Limpar dados da sessão
  - Resetar para tela inicial
  - Não salvar respostas intermediárias

#### RF-014: Auto-avanço de Perguntas
- **Descrição**: Avançar automaticamente após resposta
- **Comportamento**:
  - Para perguntas sem comentário opcional: auto-avanço após 300ms
  - Para perguntas com comentário opcional: botão "Continuar"
  - Para última pergunta: submeter respostas

#### RF-015: Coleta de Dados do Respondente
- **Descrição**: Coletar dados opcionais ao final da pesquisa
- **Campos**: Baseados na configuração da campanha (nome, telefone, email)
- **Tela**: Exibida apenas se a campanha tiver coleta habilitada

#### RF-016: Tela de Agradecimento
- **URL**: /terminal-v2/thankyou
- **Descrição**: Exibida após envio da pesquisa
- **Comportamento**: Retorna para início após 10 segundos ou timeout

### 2.5 Monitoramento

#### RF-017: Dashboard de Terminais
- **Descrição**: Visão geral dos terminais
- **Informações**:
  - Total de terminais (ativos/inativos)
  - Total de respostas hoje
  - Média de satisfação por terminal
  - Status de conectividade

#### RF-018: Relatório por Terminal
- **Descrição**: Detalhamento de respostas por terminal
- **Métricas**:
  - Total de respostas no período
  - Média de satisfação
  - Distribuição de ratings
  - Horários de maior movimento

---

## 3. Requisitos Não-Funcionais

### 3.1 Performance
- Tempo de login < 1 segundo
- Carregamento de pesquisa < 2 segundos
- Timeout precisao: +/- 1 segundo

### 3.2 Segurança
- Senhas hasheadas com bcrypt (cost factor 12)
- JWT com chave secreta obrigatória
- Cookie httpOnly (prevenir XSS)
- Rate limiting: 10 tentativas de login por minuto

### 3.3 Confiabilidade
- Dados de sessão perdidos = pesquisa reiniciada (não parcial)
- Reconexão não recupera sessão anterior
- Timeout preciso para uso em ambiente público

### 3.4 Usabilidade
- Interface otimizada para touchscreen
- Botões grandes (mín 48x48px)
- Alto contraste (dark mode)
- Feedback visual de interação

---

## 4. Design do Banco de Dados

### 4.1 Tabelas

#### Terminal
```prisma
model Terminal {
  id          String   @id @default(cuid())
  userId      String
  name        String
  email       String   @unique
  password    String   // hashed
  location    String?
  description String?
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  campaigns   TerminalCampaign[]
  responses   Response[]
}
```

#### TerminalCampaign
```prisma
model TerminalCampaign {
  id           String   @id @default(cuid())
  terminalId   String
  campaignId   String
  order        Int      @default(0)
  isActive     Boolean  @default(true)
  customTitle  String?  // Título customizado para o terminal
  createdAt    DateTime @default(now())
  
  terminal     Terminal @relation(fields: [terminalId], references: [id], onDelete: Cascade)
  campaign     Campaign @relation(fields: [campaignId], references: [id])
  
  @@unique([terminalId, campaignId])
}
```

---

## 5. Constitution (Regras Não Negociáveis)

### 5.1 Regras de Segurança

1. **Senhas**
   - Obrigatório uso de bcrypt com cost factor mínimo 10
   - Não almacenar senha em texto plano
   - Validação de complexidade: mín 6 caracteres

2. **JWT**
   - Chave secreta (NEXTAUTH_SECRET) obrigatória em produção
   - Não usar fallback hardcoded em produção
   - Expiração máxima: 24 horas

3. **Rate Limiting**
   - Login: 10 tentativas por IP por minuto
   - API de respostas: 100 por IP por minuto

4. **Timeout**
   - Obrigatório implementação de timeout
   - Tempo máximo: 120 segundos (configurável)
   - Timeout = dados não salvos (comportamento esperado)

### 5.2 Regras de Interface

1. **Terminal**
   - Dark mode obrigatório
   - Botões de no mínimo 48x48px para touch
   - Feedback visual em todas as interações
   - Loading states durante carregamento

2. **Sessão**
   - Não guardar dados sensíveis no localStorage sem criptografia
   - Limpar sessão ao fazer logout
   - Timeout deve ser preciso (não usar aproximações)

---

## 6. API Endpoints

### 6.1 Terminais

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /api/terminals | Listar terminais | ✅ |
| POST | /api/terminals | Criar terminal | ✅ |
| GET | /api/terminals/[id] | Detalhar terminal | ✅ |
| PUT | /api/terminals/[id] | Atualizar terminal | ✅ |
| DELETE | /api/terminals/[id] | Excluir terminal | ✅ |
| PATCH | /api/terminals/[id]/status | Ativar/desativar | ✅ |
| POST | /api/terminals/[id]/password | Alterar senha | ✅ |

### 6.2 Vinculação

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /api/terminals/[id]/campaigns | Listar vinculadas | ✅ |
| POST | /api/terminals/[id]/campaigns | Vincular campanha | ✅ |
| DELETE | /api/terminals/[id]/campaigns/[campaignId] | Desvincular | ✅ |
| PUT | /api/terminals/[id]/campaigns/reorder | Reordenar | ✅ |

### 6.3 Autenticação

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | /api/terminal/auth | Login terminal | ❌ |
| POST | /api/terminal/logout | Logout terminal | ❌ |

### 6.4 Relatórios

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /api/terminal-panel/reports | Relatório geral | ✅ |
| GET | /api/terminals/[id]/reports | Relatório por terminal | ✅ |

---

## 7. Decomposição em Tasks

### Epic: Terminais

| Task | Descrição | Prioridade |
|------|-----------|------------|
| TASK-001 | Setup do banco (Terminal, TerminalCampaign) | Alta |
| TASK-002 | CRUD de terminais | Alta |
| TASK-003 | Login/logout de terminal (API + UI) | Alta |
| TASK-004 | Vincular campanhas ao terminal | Alta |
| TASK-005 | Sessão de pesquisa com timeout | Alta |
| TASK-006 | Auto-avanço de perguntas | Alta |
| TASK-007 | Tela de agradecimento | Alta |
| TASK-008 | Dashboard de terminais | Média |
| TASK-009 | Relatórios por terminal | Média |
| TASK-010 | Reordenação de campanhas via UI | Baixa |

---

## 8. Fluxos Principais

### Fluxo: Configuração de Terminal
```
1. Usuário acessa /terminals/new
2. Preenche nome, localização
3. Define email e senha
4. Sistema cria terminal
5. Usuário acessa /terminals/[id]/campaigns
6. Vincula campanhas ativas
7. Define ordem de execução
8. Terminal pronto para uso
```

### Fluxo: Uso do Terminal
```
1. Operadorliga o totem
2. Tela mostra tela de login
3. Operador informa credenciais
4. Sistema valida e redireciona para seleção de campanha
5. Operador seleciona campanha
6. Pesquisa inicia
7. Cliente interage (touch)
8. Timeout reseta a cada toque
9. Ao final, opcional coleta de dados
10. Tela de agradecimento
11. Timeout retorna para início
```

---

## 9. Glossário

| Termo | Definição |
|-------|-----------|
| Terminal | Dispositivo físico para coleta de pesquisas |
| TerminalCampaign | Vínculo entre terminal e campanha |
| Timeout | Tempo máximo de inatividade |
| Auto-avanço | Avanzar automaticamente após resposta |
| Sessão | Período de uso ativo do terminal |

---

## 10. Referências

- Interface similar a totens de autoatendimento
- Timeout 参考: sistemas de autoatendimento bancário
- Autenticação 参考: sistemas de ponto de venda

---

**Versão**: 1.0  
**Criado**: 2026-04-02  
**Autor**: Specification SDD - Beend  
**Status**: Approved
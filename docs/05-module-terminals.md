# Módulo de Terminais

## Visão Geral

O módulo de terminais permite configurar totens físicos para coleta de pesquisas de satisfação em pontos de atendimento.

---

## Tipos de Terminal

### 1. Terminal Legado (`/terminal`)
- Primeira versão do sistema
-仍在使用 mas sem manutenção

### 2. Terminal V2 (`/terminal-v2`)
- Versão atual e recomendada
- Interface dark mode
- Timeout de 120 segundos
- Auto-avanço de perguntas

### 3. Terminal Panel (`/terminal-panel`)
- Dashboard para operadores de terminal
- Visualização de relatórios
- Gestão de respondentes

---

## Estrutura de Dados

### Terminal
```prisma
model Terminal {
  id          String   @id @default(cuid())
  userId      String
  name        String
  location    String?
  isActive    Boolean  @default(true)
  
  // Credenciais
  email       String   @unique
  password    String   // hasheada
  
  // Relacionamentos
  campaigns   TerminalCampaign[]
  responses   Response[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
}
```

### TerminalCampaign
```prisma
model TerminalCampaign {
  id          String   @id @default(cuid())
  terminalId  String
  campaignId  String
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  customTitle String?   // Título customizado da campanha
  
  terminal    Terminal @relation(fields: [terminalId], references: [id], onDelete: Cascade)
  campaign    Campaign @relation(fields: [campaignId], references: [id])
}
```

---

## Fluxo do Terminal

### 1. Login
- **URL**: `/terminal-v2/login`
- **Credenciais**: Email + Senha do terminal
- **Validação**: Verifica se terminal está ativo

### 2. Seleção de Campanha
- **URL**: `/terminal-v2/select-campaign`
- Lista de campanhas ativas vinculadas ao terminal
- Armazena seleção no localStorage

### 3. Pesquisa
- **URL**: `/terminal-v2/survey`
- Sessão armazenada em `terminalSessionV2`
- Interface otimizada para totem
- Timeout: 120 segundos de inatividade

### 4. Agradecimento
- **URL**: `/terminal-v2/thankyou`
- Tela de agradecimento
- Retorno para início após timeout

---

## Autenticação de Terminal

### Login (API: POST `/api/terminal/auth`)
```typescript
// Request
{
  "email": "terminal1@empresa.com",
  "password": "senha123"
}

// Response
{
  "token": "jwt-token-aqui",
  "terminal": {
    "id": "cmngxxx",
    "name": "Terminal 1 - Recepção",
    "location": "Recepção Principal"
  }
}
```

### Middleware
O arquivo `lib/terminal-auth.ts` gerencia a verificação do token JWT:
```typescript
export async function getTerminalSession(): Promise<TerminalSession | null> {
  const token = cookieStore.get('terminal-token');
  const decoded = verify(token.value, getJwtSecret());
  return decoded as TerminalSession;
}
```

---

## Configuração de Terminal

### Criar Terminal (Admin)
1. Acessar painel de administração
2. Criar novo terminal
3. Definir nome e localização
4. Vincular campanhas
5. Gerar credenciais

### Vincular Campanhas
- Múltiplas campanhas por terminal
- Ordem de execução configurável
- Possibilidade de desativar campanhas específicas

---

## Timeout e Reset

### Comportamento
- **Timeout**: 120 segundos de inatividade
- **Reset**: Ao tocar na tela, o timer reseta
- **Ao expirar**: Retorna para início da pesquisa

### Implementação
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setRemainingTime((prev) => {
      if (prev <= 1) {
        handleResetSurvey();
        return 120;
      }
      return prev - 1;
    });
  }, 1000);
}, []);
```

---

## Relatórios do Terminal

### API: GET `/api/terminal-panel/reports`
Retorna dados de respostas por terminal:
- Total de respostas
- Média de satisfação
- Distribuição por rating
- Respostas por dia/hora

---

## Melhores Práticas

1. **Rede**: Terminal deve ter conexão estável
2. **Tela**: Usar dispositivos com tela touch
3. **Posicionamento**: Altura adequada para usuários
4. **Manutenção**: Reiniciar diariamente
5. **Monitoramento**: Verificar logs regularmente
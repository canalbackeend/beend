# SPEC-SDD: Módulo de Autenticação e Usuários

## 1. Visão do Produto

### 1.1 Propósito do Módulo
O módulo de Autenticação e Usuários gerencia o cadastro, login, logout e perfil de usuários do sistema. Inclui autenticação JWT, proteção de rotas, gerenciamento de perfil e configurações de conta.

### 1.2 Problema que Resolve
- Controle de acesso ao sistema
- Identificação de usuários para funcionalidades restritas
- Gerenciamento de sessões
- Perfis de acesso (admin vs usuário comum)

### 1.3 Objetivos de Negócio
- Garantir segurança no acesso ao sistema
- Proteger dados de clientes e pesquisas
- Permitir gestão de múltiplos usuários (admin)
- Fornecer experiência de login fluida

---

## 2. Requisitos Funcionais

### 2.1 Gestão de Usuários

#### RF-001: Cadastrar Usuário (Signup)
- **Descrição**: Criar nova conta de usuário
- **Campos obrigatórios**:
  - name (nome completo)
  - email (email único)
  - password (mín 8 caracteres)
- **Campos opcionais**:
  - phone (telefone)
  - companyName (nome da empresa)
- **Validações**:
  - Email deve ser válido e único
  - Senha: mín 8 caracteres, pelo menos uma letra e um número
  - Nome: mín 2 caracteres
- **Fluxo**:
  1. Usuário preenche formulário
  2. Sistema valida dados
  3. Sistema hashea senha com bcrypt
  4. Cria registro no banco (role: USER)
  5. Envia email de boas-vindas (futuro)
  6. Redireciona para login

#### RF-002: Login
- **URL**: /login
- **Campos**: email, password
- **Fluxo**:
  1. Usuário informa credenciais
  2. Sistema busca usuário por email
  3. Sistema verifica senha com bcrypt
  4. Sistema verifica usuário ativo (isActive: true)
  5. Sistema gera token JWT
  6. Sistema cria cookie de sessão
  7. Redireciona para dashboard

#### RF-003: Logout
- **Descrição**: Encerrar sessão
- **Fluxo**:
  1. Usuário clica em logout
  2. Sistema limpa cookie de sessão
  3. Redireciona para login

#### RF-004: Editar Perfil
- **URL**: /profile
- **Campos editáveis**:
  - name
  - phone
  - companyName
  - cep, address, addressNumber, neighborhood, state, city (endereço)
  - cnpj (pessoa jurídica)
- **Fluxo**:
  1. Usuário acessa perfil
  2. Altera campos desejados
  3. Salva alterações
  4. Sistema atualiza registro

#### RF-005: Alterar Senha
- **Descrição**: Trocar senha do usuário logado
- **Campos**:
  - currentPassword (senha atual)
  - newPassword (nova senha)
  - confirmPassword (confirmação)
- **Validações**:
  - Senha atual deve estar correta
  - Nova senha deve ser diferente da atual
  - Confirmação deve ser igual à nova senha

### 2.2 Gestão de Logo

#### RF-006: Upload de Logo
- **Descrição**: Adicionar logo da empresa
- **Especificações**:
  - Formatos: PNG, JPEG, SVG
  - Tamanho máximo: 5MB
  - Dimensão recomendada: 400x200px
- **Fluxo**:
  1. Usuário seleciona arquivo
  2. Sistema valida tipo e tamanho
  3. Upload para storage
  4. Salva URL no perfil do usuário
  5. Exibe preview

#### RF-007: Remover Logo
- **Descrição**: Remover logo do perfil
- **Fluxo**:
  1. Usuário clica em remover
  2. Sistema confirma ação
  3. Remove arquivo do storage
  4. Limpa URL do perfil

### 2.3 Gestão de Administrador

#### RF-008: Listar Usuários (Admin)
- **Descrição**: Listar todos os usuários do sistema
- **Apenas admin**: Role ADMIN
- **Informações**: nome, email, role, status, último acesso

#### RF-009: Ativar/Desativar Usuário (Admin)
- **Descrição**: Alterar status do usuário
- **Regra**: Usuários inativos não podem fazer login

#### RF-010: Alterar Role (Admin)
- **Descrição**: Mudar role de usuário
- **Roles**: USER, ADMIN

#### RF-011: Impersonate (Admin)
- **Descrição**: Admin fazer login como outro usuário
- **Uso**: Suporte e debug
- **Log**: Registrar quem fez impersonate

### 2.4 Autenticação JWT

#### RF-012: Estrutura do Token
- **Payload**:
  ```json
  {
    "sub": "user_id",
    "email": "user@email.com",
    "role": "USER",
    "iat": timestamp,
    "exp": timestamp + 7 dias
  }
  ```

#### RF-013: Cookie de Sessão
- **Nome**: next-auth.session-token
- **Configurações**:
  - httpOnly: true (prevenir XSS)
  - secure: true (produção)
  - sameSite: lax
  - path: /
  - maxAge: 7 dias

#### RF-014: Refresh Token
- **Descrição**: Renovação automática de token
- **Behavior**: NextAuth gerencia automaticamente

### 2.5 Middleware de Proteção

#### RF-015: Proteger Rotas
- **Descrição**: Middleware para verificar autenticação
- **Rotas protegidas**: /dashboard, /campaigns, /proposals, /terminals, /settings, /profile
- **Rotas públicas**: /login, /signup, /, /survey/[link], /terminal-v2/login

---

## 3. Requisitos Não-Funcionais

### 3.1 Segurança
- Senhas hasheadas com bcrypt (cost factor 12)
- JWT com expiração máxima de 7 dias
- httpOnly cookies (obrigatório)
- Rate limiting: 5 tentativas de login por minuto
- Bloqueio temporário após 10 tentativas falhas (15 min)

### 3.2 Performance
- Tempo de login < 500ms
- Tempo de logout < 100ms
- Verificação de sessão < 50ms

### 3.3 Disponibilidade
- Uptime: 99.5%
- Sesão perdida = redirecionar para login (não erro)

---

## 4. Design do Banco de Dados

### 4.1 Tabelas

#### User
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  password      String?  // hashed, nullable para OAuth futuro
  phone         String?
  companyName   String?
  
  // Endereço
  cep           String?
  address       String?
  addressNumber String?
  neighborhood  String?
  state         String?
  city          String?
  country       String?
  
  // Empresa
  cnpj          String?
  
  // Logo
  logoUrl       String?
  
  // Status e roles
  role          String   @default("USER") // USER, ADMIN
  isActive      Boolean  @default(true)
  
  // Metadata
  lastAccess    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  campaigns     Campaign[]
  terminals     Terminal[]
  proposals     Proposal[]
  employees     Employee[]
  contacts      Contact[]
  contactLists  ContactList[]
  libraryImages ProposalLibraryImage[]
  templates     ProposalTemplate[]
}
```

---

## 5. Constitution (Regras Não Negociáveis)

### 5.1 Regras de Senha

1. **Hashing obrigatório**
   - Usar bcrypt com cost factor mínimo 12
   - Nunca almacenar senha em texto plano
   - Validar força da senha no frontend e backend

2. **Políticas de senha**
   - Mínimo 8 caracteres
   - Pelo menos uma letra e um número
   - Sem espaços em branco

3. **Mudança de senha**
   - Validar senha atual antes de permitir mudança
   - Não permitir reutilização das últimas 5 senhas

### 5.2 Regras de Sessão

1. **JWT**
   - Expiração máxima: 7 dias
   - Não incluir dados sensíveis no payload
   - Validar em todas as requisições autenticadas

2. **Cookies**
   - httpOnly: true (obrigatório)
   - secure: true em produção
   - sameSite: lax

3. **Logout**
   - Limpar cookie de sessão
   - Invalidar token no servidor (futuro: token blacklist)

### 5.3 Regras de Acesso

1. **Admin**
   - Acesso a todas as funcionalidades
   - pode modificar qualquer usuário
   - pode acessar logs de sistema

2. **Usuário comum**
   - Acesso aos seus próprios dados
   - Não pode acessar dados de outros usuários
   - Não pode acessar funcionalidades de admin

---

## 6. API Endpoints

### 6.1 Autenticação

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | /api/auth/signup | Criar conta | ❌ |
| POST | /api/auth/signin | Login | ❌ |
| POST | /api/auth/signout | Logout | ✅ |
| GET | /api/auth/session | Obter sessão | ✅ |

### 6.2 Usuário

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /api/users/profile | Meu perfil | ✅ |
| PUT | /api/users/profile | Atualizar perfil | ✅ |
| PUT | /api/users/password | Alterar senha | ✅ |
| POST | /api/users/logo | Upload logo | ✅ |
| DELETE | /api/users/logo | Remover logo | ✅ |

### 6.3 Admin

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /api/admin/users | Listar usuários | ADMIN |
| GET | /api/admin/users/[id] | Detalhar usuário | ADMIN |
| PUT | /api/admin/users/[id] | Atualizar usuário | ADMIN |
| PATCH | /api/admin/users/[id]/status | Ativar/desativar | ADMIN |
| POST | /api/auth/impersonate | Impersonate | ADMIN |

---

## 7. Decomposição em Tasks

### Epic: Autenticação

| Task | Descrição | Prioridade |
|------|-----------|------------|
| TASK-001 | Schema User no banco | Alta |
| TASK-002 | Configuração NextAuth | Alta |
| TASK-003 | Login/logout UI e API | Alta |
| TASK-004 | Signup com validação | Alta |
| TASK-005 | Middleware de proteção | Alta |
| TASK-006 | Gestão de perfil | Alta |
| TASK-007 | Upload de logo | Alta |
| TASK-008 | Alteração de senha | Alta |
| TASK-009 | Painel admin de usuários | Média |
| TASK-010 | Impersonate | Baixa |
| TASK-011 | Rate limiting em login | Baixa |

---

## 8. Fluxos Principais

### Fluxo: Criar Conta
```
1. Usuário acessa /signup
2. Preenche name, email, password
3. Sistema valida email único
4. Sistema valida força da senha
5. Sistema hashea senha
6. Cria usuário com role USER
7. Redireciona para /login
8. Usuário faz login
```

### Fluxo: Login
```
1. Usuário acessa /login
2. Informa email e password
3. Sistema busca usuário por email
4. Sistema compara senha com bcrypt
5. Sistema verifica isActive
6. Sistema gera JWT
7. Sistema cria cookie
8. Redireciona para /dashboard
```

### Fluxo: Alterar Senha
```
1. Usuário acessa /profile
2. Clica em "Alterar Senha"
3. Preenche atual, nova, confirmação
4. Sistema valida senha atual
5. Sistema hashea nova senha
6. Sistema atualiza registro
7. Usuário faz logout obrigatório
8. Usuário faz login com nova senha
```

---

## 9. Glossário

| Termo | Definição |
|-------|-----------|
| JWT | JSON Web Token - padrão de token de acesso |
| Session | Sessão autenticada do usuário |
| bcrypt | Biblioteca de hash de senhas |
| Role | Papel do usuário (USER, ADMIN) |
| isActive | Status do usuário para login |
| Impersonate | Admin acessar como outro usuário |

---

## 10. Referências

- NextAuth.js para autenticação
- bcrypt para hash de senhas
- Middleware Next.js para proteção de rotas

---

**Versão**: 1.0  
**Criado**: 2026-04-02  
**Autor**: Specification SDD - Beend  
**Status**: Approved
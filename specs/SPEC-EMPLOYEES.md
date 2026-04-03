# SPEC-SDD: Módulo de Employees (Colaboradores)

## 1. Visão do Produto

### 1.1 Propósito do Módulo
O módulo de Employees permite o cadastro e gerenciamento de colaboradores que podem ser avaliados nas pesquisas de satisfação do tipo Employee Rating. Cada employee pode ter foto, nome, departamento e outras informações para identificação nas pesquisas.

### 1.2 Problema que Resolve
- Necessidade de avaliar colaboradores específicos em pesquisas
- Falta de padronização de dados de employees
- Dificuldade em gerenciar grande número de colaboradores
- Integração com pesquisas de satisfação

### 1.3 Objetivos de Negócio
- Permitir avaliação de atendimento por colaborador
- Fornecer dados visuais para identificação nas pesquisas
- Facilitar gestão de múltiplos colaboradores por empresa

---

## 2. Requisitos Funcionais

### 2.1 Gestão de Employees

#### RF-001: Criar Employee
- **Descrição**: Cadastrar novo colaborador
- **Campos obrigatórios**:
  - name (nome completo)
- **Campos opcionais**:
  - department (departamento/setor)
  - role (cargo/função)
  - imageUrl (URL da foto)
  - email (email institucional)
  - isActive (boolean, default: true)
- **Validações**:
  - Nome: mín 2, máx 100 caracteres
  - Email deve ser único se informado

#### RF-002: Editar Employee
- **Descrição**: Modificar dados do colaborador

#### RF-003: Excluir Employee
- **Descrição**: Remover colaborador
- **Restrição**: Se vinculado a respostas, apenas inativar

#### RF-004: Listar Employees
- **Descrição**: Exibir todos os colaboradores
- **Filtros**: department, isActive
- **Ordenação**: nome (A-Z)
- **Paginação**: 20 por página

#### RF-005: Upload de Foto
- **Descrição**: Adicionar foto do colaborador
- **Especificações**:
  - Formatos: JPEG, PNG
  - Tamanho máximo: 2MB
  - Dimensão mínima: 200x200px
  - Recomendado: 400x400px (quadrada)
- **Fluxo**:
  1. Usuário seleciona imagem
  2. Sistema valida tipo e tamanho
  3. Upload para storage
  4. Salva URL no employee

### 2.2 Departamentos

#### RF-006: Criar Departamento
- **Descrição**: Criar departamento/setor
- **Campos**:
  - name (nome do departamento)
  - description (descrição opcional)

#### RF-007: Listar Departamentos
- **Descrição**: Listar todos os departamentos

#### RF-008: Editar Departamento
- **Descrição**: Modificar departamento

#### RF-009: Excluir Departamento
- **Descrição**: Remover departamento
- **Regra**: Employees vinculados são movidos para "Sem departamento"

### 2.3 Integração com Pesquisas

#### RF-010: Disponibilizar para Pesquisa
- **Descrição**: Employee disponível como opção em Employee Rating
- **Critérios**: isActive: true
- **Visível em**: Pesquisas com pergunta tipo EMPLOYEE_RATING

#### RF-011: Selecionar Employee na Pesquisa
- **Descrição**: Resposta vincula employee selecionado
- **Campo em Answer**: selectedEmployeeId
- **Armazenado**: ID do employee avaliado

---

## 3. Requisitos Não-Funcionais

### 3.1 Performance
- Listagem < 500ms
- Upload de foto < 3 segundos
- Busca por nome < 200ms

### 3.2 Escalabilidade
- Suporte a 1.000 employees por usuário
- Suporte a 50 departamentos

### 3.3 Segurança
- Fotos armazenadas com URL pública (ou signed URL)
- Rate limiting: 20 uploads por minuto

---

## 4. Design do Banco de Dados

### 4.1 Tabelas

#### Employee
```prisma
model Employee {
  id         String   @id @default(cuid())
  userId     String   // Dono do employee
  name       String
  department String?
  role       String?
  imageUrl   String?
  email      String?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  user       User     @relation(fields: [userId], references: [id])
  answers    Answer[]
  
  @@unique([userId, email]) // Email único por usuário se informado
}
```

---

## 5. Constitution (Regras Não Negociáveis)

### 5.1 Regras de Dados

1. **Fotos**
   - Sanitizar nome do arquivo
   - Validar MIME type server-side
   - Limite de tamanho rigoroso (2MB)

2. **Dados**
   - Nome é obrigatório
   - Employees inativos não aparecem em pesquisas
   - Exclusão não remove histórico de respostas

### 5.2 Regras de UI

1. **Lista**
   - Exibir thumbnail da foto
   - Mostrar department
   - Indicador de status (ativo/inativo)

---

## 6. API Endpoints

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | /api/employees | Listar employees | ✅ |
| POST | /api/employees | Criar employee | ✅ |
| GET | /api/employees/[id] | Detalhar employee | ✅ |
| PUT | /api/employees/[id] | Atualizar employee | ✅ |
| DELETE | /api/employees/[id] | Excluir employee | ✅ |
| POST | /api/employees/[id]/photo | Upload foto | ✅ |

---

## 7. Decomposição em Tasks

### Epic: Employees

| Task | Descrição | Prioridade |
|------|-----------|------------|
| TASK-001 | Schema Employee no banco | Alta |
| TASK-002 | CRUD de employees | Alta |
| TASK-003 | Upload de foto | Alta |
| TASK-004 | Integração com Employee Rating | Alta |
| TASK-005 | Filtrar por department | Média |
| TASK-006 | Lista de departments | Baixa |

---

## 8. Fluxo: Criar Employee
```
1. Usuário acessa /employees
2. Clica em "Novo Colaborador"
3. Preenche nome (obrigatório)
4. Preenche department (opcional)
5. Opcional: upload de foto
6. Clica em "Salvar"
7. Employee disponível em pesquisas
```

---

## 9. Glossário

| Termo | Definição |
|-------|-----------|
| Employee | Colaborador avaliado em pesquisas |
| Department | Departamento/setor do colaborador |
| Employee Rating | Tipo de pergunta de avaliação de colaborador |

---

**Versão**: 1.0  
**Criado**: 2026-04-02  
**Autor**: Specification SDD - Beend  
**Status**: Approved
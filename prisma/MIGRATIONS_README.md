# 🗄️ Instruções de Banco de Dados

## 📋 Migrations Incluídas

Este projeto inclui migrations do Prisma para criar todo o schema do banco de dados.

### Arquivos de Migration:
- `prisma/migrations/20250208160000_add_employee_rating_system/migration.sql`
- `prisma/migrations/migration_lock.toml`

## 🚀 Como Aplicar as Migrations

### Opção 1: Usando Prisma Migrate (Recomendado)

```bash
# 1. Instalar dependências
npm install --legacy-peer-deps

# 2. Configurar variável de ambiente
export DATABASE_URL="postgresql://usuario:senha@host:5432/nome_do_banco"

# 3. Aplicar migrations
npx prisma migrate deploy

# 4. Gerar cliente Prisma
npx prisma generate
```

### Opção 2: SQL Direto

Se preferir, execute o arquivo `migration.sql` diretamente no PostgreSQL:

```bash
psql -U seu_usuario -d seu_banco -f prisma/migrations/20250208160000_add_employee_rating_system/migration.sql
```

### Opção 3: Usando Prisma Studio (Interface Visual)

```bash
npx prisma studio
```

## 📊 Schema do Banco

### Tabelas Principais:
- **User** - Usuários do sistema
- **Campaign** - Campanhas de pesquisa
- **Question** - Perguntas das campanhas
- **QuestionOption** - Opções de resposta (com suporte a imagens)
- **Employee** - Colaboradores/funcionários
- **QuestionEmployee** - Relação entre perguntas e colaboradores
- **Response** - Respostas dos respondentes
- **Answer** - Respostas individuais (com selectedEmployeeId)
- **Terminal** - Terminais/dispositivos de coleta

### Enumerações:
- **QuestionType** - Tipos de pergunta (inclui EMPLOYEE_RATING)
- **UserRole** - Papéis de usuário (ADMIN, USER)
- **CampaignStatus** - Status da campanha
- E outras...

## ⚠️ Importante

### Se o banco já existir:
Se você já tem um banco com dados, FAÇA BACKUP antes de aplicar as migrations:

```bash
# Backup
pg_dump -U usuario -d banco > backup_$(date +%Y%m%d_%H%M%S).sql

# Depois aplique as migrations
npx prisma migrate deploy
```

### Se der erro de "Drift detected":
Isso acontece quando o banco já existe mas não tem histórico de migrations. Soluções:

1. **Reset completo** (apaga todos os dados):
```bash
npx prisma migrate reset
```

2. **Baseline** (marca o estado atual como baseline):
```bash
npx prisma migrate resolve --applied 20250208160000_add_employee_rating_system
```

3. **Db Push** (apenas desenvolvimento):
```bash
npx prisma db push
```

## 🔍 Verificação

Após aplicar as migrations, verifique se funcionou:

```bash
# Conectar ao banco
npx prisma studio

# Ou verificar status
npx prisma migrate status
```

## 📞 Suporte

Se tiver problemas:
1. Verifique se o PostgreSQL está rodando
2. Confirme a DATABASE_URL no .env
3. Verifique permissões do usuário do banco
4. Consulte a documentação: https://www.prisma.io/docs/concepts/components/prisma-migrate

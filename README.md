# Beend - Sistema de Pesquisa de Satisfação e Gestão Comercial

## Visão Geral

O **Beend** é uma plataforma completa para pesquisas de satisfação de clientes e gestão de propostas comerciais. Desenvolvido em Next.js com banco de dados PostgreSQL, oferece uma solução integrada para empresas que desejam medir e melhorar a experiência do cliente.

---

## Módulos Principais

### 1. Pesquisas de Satisfação
- Criação de campanhas de pesquisa com diferentes tipos de perguntas
- Tipos: Smile (emoji), NPS, Scale, Single Choice, Multiple Choice, Text Input, Employee Rating
- Respostas anônimas ou com coleta de dados do respondente
- Pesquisa pública via link único ou em terminais físicos (totens)
-dashboards em tempo real com gráficos e métricas

### 2. Propostas Comerciais
- Criação de propostas com itens, valores e descrições
- Biblioteca de imagens para personalização
- Geração de PDF profissional com template customizável
- Envio por email diretamente pelo sistema
- Controle de status (Rascunho, Enviado, Aprovado, Reprovado)

### 3. Terminais (Totens)
- Sistema de terminal para pesquisas em pontos físicos
- Autenticação de terminal com login/senha
- Sessão de pesquisa com timeout automático
- Modo offline com sincronização posterior (em desenvolvimento)

### 4. Gestão de Contatos
- Importação de contatos via CSV
- Listas de contato para campanhas de email
- Integração com propostas comerciais

### 5. Employees
- Cadastro de funcionários para avaliação
- Sistema de Employee Rating nas pesquisas
- Foto e informações do colaborador

---

## Stack Tecnológica

| Componente | Tecnologia |
|------------|------------|
| Frontend | Next.js 14 (App Router), React, TypeScript |
| UI Components | shadcn/ui, Tailwind CSS, Lucide Icons |
| Backend | Next.js API Routes, Prisma ORM |
| Banco de Dados | PostgreSQL (Supabase) |
| Storage | AWS S3 ou Supabase Storage |
| Autenticação | NextAuth.js (JWT) |
| Deploy | Coolify (self-hosted) |
| Email | AbacusAI API / Gmail SMTP (em implementação) |

---

## Estrutura do Projeto

```
beend/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── survey/            # Pesquisa pública
│   ├── terminal-v2/       # Terminal de pesquisa
│   ├── proposals/         # Módulo de propostas
│   ├── campaigns/          # Gestão de campanhas
│   ├── dashboard/          # Dashboard principal
│   └── ...
├── lib/                    # Bibliotecas utilitárias
│   ├── db.ts              # Prisma client
│   ├── auth.ts            # NextAuth config
│   ├── supabase.ts        # Supabase client
│   └── s3.ts              # AWS S3 utilities
├── components/            # Componentes React
├── docs/                  # Documentação
└── prisma/                # Schema do banco
```

---

## Banco de Dados

### Tabelas Principais

- **User** - Usuários do sistema (admin, usuário)
- **Campaign** - Campanhas de pesquisa
- **Question** - Perguntas das campanhas
- **Response** - Respostas das pesquisas
- **Answer** - Respostas individuais por pergunta
- **Terminal** - Terminais/totens
- **Proposal** - Propostas comerciais
- **ProposalItem** - Itens das propostas
- **ProposalLibraryImage** - Imagens da biblioteca
- **Employee** - Funcionários para avaliação

---

## Variáveis de Ambiente

```env
# Banco de dados
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta"
NEXTAUTH_URL="https://sistema.beend.tech"

# AWS S3 (opcional)
AWS_BUCKET_NAME=""
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""

# Supabase (alternativo ao S3)
SUPABASE_URL=""
SUPABASE_ANON_KEY=""

# AbacusAI (email)
ABACUSAI_API_KEY=""
```

---

## Deploy

### Coolify (Recomendado)

1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Build automático com Nixpacks
4. Deploy em container Docker

### URLs de Produção

- **Sistema**: https://sistema.beend.tech
- **Pesquisa Pública**: https://beend.app/survey/[link]
- **Terminal**: https://beend.tech/terminal-v2

---

## Segurança

- Autenticação JWT com cookies seguros (httpOnly, secure)
- Senhas hasheadas com bcrypt
- Validação de entrada em todas as APIs
- Rate limiting (a implementar)
- Sanitização de dados de entrada
- Verificação de sessão em rotas protegidas

---

## Contribuição

1. Fork do repositório
2. Criar branch feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit das mudanças (`git commit -m 'feat: nova funcionalidade'`)
4. Push para branch (`git push origin feature/nova-funcionalidade`)
5. Abrir Pull Request

---

## Licença

MIT License

---

## Contato

- Email: canalbackeend@gmail.com
- Website: www.backeend.com.br
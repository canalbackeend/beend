# Arquitetura do Sistema Beend

## Visão Geral da Arquitetura

O Beend segue a arquitetura **Next.js App Router** com renderização híbrida (server-side e client-side), utilizando API Routes para o backend e Prisma como ORM.

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   Pages     │ │   API       │ │ Components  │            │
│  │  (React)    │ │  (Routes)   │ │   (UI)      │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (API Routes)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │  Auth       │ │  Business   │ │  Storage    │            │
│  │  Logic      │ │  Logic      │ │  Logic      │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │  Prisma     │ │  Supabase   │ │  AWS S3     │            │
│  │  (Postgre)  │ │  (Storage)  │ │  (Files)    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológica

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Ícones**: Lucide React + Font Awesome
- **Estado**: React useState/useEffect

### Backend
- **Runtime**: Next.js API Routes
- **ORM**: Prisma
- **Autenticação**: NextAuth.js (JWT)
- **Validação**: Zod (parcialmente)

### Dados
- **Banco**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage ou AWS S3
- **Cache**: none (stateless)

---

## Estrutura de Pastas

```
beend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rotas de autenticação
│   │   ├── login/
│   │   └── signup/
│   ├── api/                     # API Routes
│   │   ├── auth/                # NextAuth
│   │   ├── campaigns/           # Campanhas
│   │   ├── responses/           # Respostas
│   │   ├── proposals/           # Propostas
│   │   └── ...
│   ├── survey/                  # Pesquisa pública
│   │   └── [uniqueLink]/
│   ├── terminal-v2/             # Terminal de pesquisa
│   │   ├── login/
│   │   ├── survey/
│   │   └── thankyou/
│   ├── proposals/               # Módulo de propostas
│   │   ├── new/
│   │   ├── [id]/
│   │   └── templates/
│   ├── campaigns/               # Gestão de campanhas
│   ├── dashboard/               # Dashboard principal
│   └── ...
│
├── lib/                         # Bibliotecas
│   ├── db.ts                   # Prisma client
│   ├── auth.ts                 # NextAuth config
│   ├── supabase.ts             # Supabase client
│   ├── s3.ts                   # AWS S3 utilities
│   └── terminal-auth.ts        # Auth de terminais
│
├── components/                  # Componentes reutilizáveis
│   ├── ui/                    # shadcn/ui
│   ├── navbar.tsx
│   └── footer.tsx
│
├── docs/                        # Documentação
└── prisma/                      # Schema do banco
    └── schema.prisma
```

---

## Fluxo de Dados

### 1. Requisição do Usuário
```
User → Next.js Route → Middleware (auth) → Handler
```

### 2. Consulta ao Banco
```
Handler → Prisma Client → PostgreSQL → Prisma → Response
```

### 3. Resposta ao Usuário
```
Response → JSON → Next.js Route → User
```

---

## Padrões de Código

### API Routes
```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // lógica...
}
```

### Componentes React
```typescript
export function ComponentName() {
  const [state, setState] = useState(initialValue);
  // render...
}
```

---

## Ambientes

| Ambiente | URL | Descrição |
|----------|-----|-----------|
| Development | localhost:3000 | Desenvolvimento local |
| Production | sistema.beend.tech | Deploy principal |

---

## Considerações de Escalabilidade

1. **Database**: Supabase oferece até 500MB no plano gratuito
2. **API**: Next.js em serverless tem limites de execuções concorrentes
3. **Storage**: Supabase Storage ou S3 para imagens
4. **CDN**: Implementar para assets estáticos
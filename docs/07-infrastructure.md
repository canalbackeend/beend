# Infraestrutura e Deploy

## Visão Geral

O sistema Beend é hospedado em infrastructure self-hosted utilizando Coolify, com banco de dados PostgreSQL via Supabase e armazenamento em Supabase Storage ou AWS S3.

---

## Arquitetura de Infraestrutura

```
┌─────────────────────────────────────────────────────────────┐
│                      INTERNET                                │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Navegador    │   │   Navegador   │   │   Navegador   │
│  (Usuário)    │   │  (Terminal)   │   │   (Admin)     │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (DNS)                          │
│                 sistema.beend.tech                          │
│                    beend.app                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    COOLIFY (Docker)                         │
│                   187.77.243.122                           │
│    ┌─────────────────────────────────────────────────┐      │
│    │              Next.js App (Container)            │      │
│    │         Docker Image: canalbackeend/beend        │      │
│    │              Porta: 3000                         │      │
│    └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                │                       │
                ▼                       ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│    SUPABASE            │   │    SUPABASE             │
│    (PostgreSQL)        │   │    (Storage)            │
│    Banco de dados      │   │    Imagens/Arquivos     │
└─────────────────────────┘   └─────────────────────────┘
```

---

## Hospedagem

### Coolify (Self-Hosted)

| Configuração | Valor |
|--------------|-------|
| Servidor | 187.77.243.122 |
| Docker | 29.3.0 with BuildKit |
| Image | canalbackeend/beend:main |
| Build | Nixpacks (Node 22) |
| Domínio | sistema.beend.tech |

### URLs de Produção

| Serviço | URL |
|---------|-----|
| Sistema Principal | https://sistema.beend.tech |
| Pesquisa Pública | https://beend.app/survey/[link] |
| Terminal V2 | https://sistema.beend.tech/terminal-v2 |
| Landing | https://beend.tech |

---

## Banco de Dados

### Supabase (PostgreSQL)

- **URL**: Fornecida pelo Supabase
- **Plano**: Free tier (500MB)
- **Backup**: Automático (Fornecido pelo Supabase)

### Tabelas Principais
- User, Campaign, Question
- Response, Answer
- Terminal, TerminalCampaign
- Proposal, ProposalItem, ProposalImage
- Employee, Contact, ContactList

---

## Armazenamento

### Supabase Storage (Primário)
- Bucket: `uploads`
- Caminhos:
  - `logos/{userId}/` - Logos de empresas
  - `employees/{userId}/` - Fotos de funcionários
  - `proposal-images/{userId}/` - Imagens de propostas

### AWS S3 (Alternativo)
- Configurado via variáveis de ambiente
- Usado se Supabase não estiver disponível

---

## Configuração de Domínio

### Cloudflare
- DNS configurado para apontar para Coolify
- Proxy ativo para proteção

### Domínios
- `sistema.beend.tech` - Sistema principal
- `beend.app` - Pesquisa pública
- `beend.tech` - Landing page

---

## Variáveis de Ambiente

### Obrigatórias
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=chave-jwt-secreta
NEXTAUTH_URL=https://sistema.beend.tech
```

### Opcionais (Storage)
```env
# Supabase (alternativo ao S3)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=chave-anonima

# AWS S3
AWS_BUCKET_NAME=
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

### Opcionais (Email)
```env
ABACUSAI_API_KEY=
# EMAIL_USER=  (em implementação)
# EMAIL_PASS= (em implementação)
```

---

## Deploy Automático

### Fluxo
1. Push para GitHub (`canalbackeend/beend`)
2. Coolify detecta nova versão
3. Build automático via Nixpacks
4. Deploy do container Docker
5. Rolling update sem downtime

### Logs de Deploy
```
2026-Apr-01 18:05:28 - Starting deployment
2026-Apr-01 18:08:16 - Building docker image completed
2026-Apr-01 18:08:20 - Rolling update completed
```

---

## Manutenção

### Backup
- Banco de dados: Automático (Supabase)
- Código: GitHub

### Monitoramento
- Logs via Coolify
- Erros via Sentry (a implementar)

### Atualizações
1. Desenvolvimento local
2. Push para GitHub
3. Deploy automático

---

## Troubleshooting

### Problemas Comuns

| Problema | Solução |
|----------|---------|
| App não inicia | Verificar NEXTAUTH_SECRET |
| Erro banco dados | Verificar DATABASE_URL |
| Imagens não carregam | Verificar Supabase/S3 config |
| Email não envia | Verificar ABACUSAI_API_KEY |
# Configuração do Sistema

## Variáveis de Ambiente

O sistema Beend utiliza variáveis de ambiente para configuração. Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`.

---

## Variáveis Obrigatórias

### Banco de Dados
```env
# PostgreSQL - Supabase ou outro provedor
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### Autenticação
```env
# Chave secreta para JWT (OBRIGATÓRIA em produção)
NEXTAUTH_SECRET="gerar-uma-chave-secreta-aqui"

# URL base da aplicação
NEXTAUTH_URL="https://sistema.beend.tech"
```

### Como gerar NEXTAUTH_SECRET

```bash
# Usando openssl
openssl rand -base64 32

# Ou usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Variáveis Opcionais

### Supabase (Storage)
```env
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="chave-anonima-do-supabase"
```

### AWS S3 (Storage Alternativo)
```env
AWS_BUCKET_NAME="nome-do-bucket"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
```

### Email (AbacusAI)
```env
ABACUSAI_API_KEY="chave-da-api-abacus"
```

### Email (Gmail SMTP - Em implementação)
```env
EMAIL_USER="seu-email@gmail.com"
EMAIL_PASS="app-password-gerada"
```

---

## Configuração de Email

### Usando AbacusAI (Padrão Atual)

1. Obtenha a API key em [AbacusAI](https://abacus.ai)
2. Adicione ao `.env`:
   ```
   ABACUSAI_API_KEY=sua-api-key-aqui
   ```

### Usando Gmail SMTP (Em implementação)

1. **Ative a Verificação em Duas Etapas** na sua conta Google
2. **Crie uma App Password**:
   - Acesse: myaccount.google.com → Segurança
   - Procure "Senhas de App"
   - Crie uma senha para "Mail"
3. Adicione ao `.env`:
   ```
   EMAIL_USER=canalbackeend@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop
   ```

---

## Configuração de Storage

### Supabase (Recomendado)

1. Crie projeto em [supabase.com](https://supabase.com)
2. Vá em Settings → API
3. Copie URL e anon key
4. Crie um bucket chamado `uploads`
5. Configure políticas de acesso:
   - Public bucket para uploads
   - Sel policy: `Give public access to uploads`

### AWS S3 (Alternativo)

1. Crie conta AWS
2. Crie bucket S3
3. Configure CORS:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedOrigins": ["https://sistema.beend.tech"],
       "ExposeHeaders": []
     }
   ]
   ```
4. Crie IAM user com permissões S3
5. Copie credenciais para variáveis de ambiente

---

## Configuração de Banco de Dados

### Supabase (Recomendado)

1. Crie projeto em supabase.com
2. Vá em Settings → Database
3. Copie a string de conexão (Connection string)
4. Use no formato:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

### Variável Prisma

No arquivo `.env`:
```env
DATABASE_URL="postgresql://postgres:senha@db.xxx.supabase.co:5432/postgres"
```

---

## Configuração de Produção

### Coolify

Ao fazer deploy no Coolify, defina as variáveis:

1. Acesse seu projeto no Coolify
2. Vá em "Environment Variables"
3. Adicione cada variável
4. O deploy automático irá usar as variáveis

### Lista Completa de Variáveis

```env
# === OBRIGATÓRIAS ===
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=sua-chave-jwt
NEXTAUTH_URL=https://sistema.beend.tech

# === STORAGE (escolha uma opção) ===
# Opção 1: Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# Opção 2: AWS S3
AWS_BUCKET_NAME=xxx
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# === EMAIL ===
ABACUSAI_API_KEY=xxx

# === OPÇÕES ===
NODE_ENV=production
```

---

## Troubleshooting

### App não inicia
- Verifique se `NEXTAUTH_SECRET` está configurado
- Verifique se `DATABASE_URL` está correta

### Imagens não carregam
- Verifique se Supabase ou S3 está configurado
- Verifique se bucket existe e tem permissões

### Email não envia
- Verifique API key do AbacusAI
- Se usando Gmail, verifique App Password

---

## Referências

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Coolify Documentation](https://coolify.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [AWS S3 Docs](https://docs.aws.amazon.com/s3/)
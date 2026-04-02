# Segurança do Sistema Beend

## Visão Geral

Este documento descreve as medidas de segurança implementadas no sistema Beend, incluindo autenticação, proteção de dados e mitigação de vulnerabilidades.

---

## Autenticação e Autorização

### NextAuth.js

O sistema usa NextAuth.js com as seguintes configurações de segurança:

```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,        // Previne XSS
        sameSite: 'lax',      // CSRF protection
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    CredentialsProvider({
      // validação de credenciais...
    }),
  ],
  session: {
    strategy: 'jwt',
  },
};
```

### Hash de Senhas

Todas as senhas são hasheadas usando **bcrypt**:

```typescript
// Criar hash
const hashedPassword = await bcrypt.hash(password, 12);

// Verificar hash
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Auth de Terminal

O sistema de terminal usa JWT com as seguintes características:

- **Token**: Armazenado em cookie `terminal-token`
- **Secret**: Obtido de `NEXTAUTH_SECRET` (obrigatório em produção)
- **Validação**: Verificação de tipo `'terminal'`

---

## Proteção de APIs

### Autenticação em Rotas

Todas as APIs privadas verificam sessão:

```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  // lógica...
}
```

### Validação de Entrada

O sistema implementa sanitização de dados:

```typescript
// Exemplo em /api/responses/route.ts
const sanitizedName = respondentName?.trim().slice(0, 255) || null;
const sanitizedPhone = respondentPhone?.replace(/\D/g, '').slice(0, 11) || null;
const sanitizedEmail = respondentEmail?.trim().toLowerCase().slice(0, 255) || null;

// Validar formato de email
if (sanitizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
  return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
}
```

---

## Vulnerabilidades e Mitigações

### Vulnerabilidades Identificadas

| Vulnerabilidade | Status | Mitigação |
|-----------------|--------|-----------|
| XSS | ✅ Mitigada | httpOnly cookies, React auto-escaping |
| CSRF | ✅ Mitigada | sameSite cookies, validação de sessão |
| SQL Injection | ✅ Mitigada | Prisma ORM (parametrized queries) |
| Rate Limiting | ⚠️ A implementar | Needs implementation |
| Hardcoded Secrets | ✅ Corrigido | NEXTAUTH_SECRET agora obrigatório |
| Input Validation | ✅ Parcial | Sanitização em APIs críticas |

### Correções Aplicadas

#### 1. Hardcoded JWT Secret (Corrigido)
```typescript
// ANTES (vulnerável)
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

// DEPOIS (seguro)
const getJwtSecret = (): string => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable is required...');
  }
  return secret;
};
```

---

## Dados Sensíveis

### O que Armazenamos
- Dados de usuários (nome, email, empresa)
- Dados de clientes das propostas
- Respostas das pesquisas (anonimizadas ou não,取决于 configuração)
- Tokens JWT (em cookies seguros)

### O que NÃO Armazenamos
- Senhas em texto plano (sempre hasheadas)
- Dados de cartão de crédito
- Informações biométricas

---

## Boas Práticas Implementadas

1. **Cookies seguros**: httpOnly, secure, sameSite
2. **Senhas hasheadas**: bcrypt com salt adequado
3. **Validação de entrada**: Sanitização de dados
4. **Autenticação em camadas**: Middleware + API routes
5. **Verificação de propriedade**: Usuários só acessam seus dados
6. **Rate limiting**: A implementar

---

## Recomendações Futuras

### Implementar
1. **Rate Limiting** - Prevenir ataques de força bruta
2. **WAF** - Web Application Firewall
3. **Logging** - Monitoramento de segurança
4. **2FA** - Autenticação de dois fatores
5. **Audit Logs** - Histórico de ações

### Melhores Práticas
- Rotação de `NEXTAUTH_SECRET` periodicamente
- Monitorar tentativas de login falhas
- Implementar alertas de segurança
- Backup regular do banco de dados

---

## Relatório de Vulnerabilidades

Se você encontrar uma vulnerabilidade de segurança, por favor entre em contato: **canalbackeend@gmail.com**

---

## Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Prisma Security](https://www.prisma.io/docs/guides/security)
# Referência de APIs

## Visão Geral

O sistema Beend expõe APIs RESTful através do Next.js API Routes. Todas as APIs requerem autenticação exceto as públicas de pesquisa.

---

## Autenticação

### Authentication API
- **Arquivo**: `app/api/auth/[...nextauth]/route.ts`
- **Provedor**: Credentials (email + senha)
- **Estratégia**: JWT
- **Cookie**: `next-auth.session-token` (httpOnly, secure)

### Autenticação de Terminal
- **Arquivo**: `app/api/terminal/auth/route.ts`
- **Token**: JWT armazenado em cookie `terminal-token`

---

## APIs Públicas

### Survey Access
**POST** `/api/survey-access`

Registra acesso à pesquisa (opcional).

```json
{
  "campaignId": "cmngxxx",
  "terminalId": "cmngyyy",
  "source": "WEBVIEW | TERMINAL | QR_CODE"
}
```

### Respostas
**POST** `/api/responses`

Cria nova resposta de pesquisa (pública).

```json
{
  "campaignId": "cmngxxx",
  "terminalId": "cmngyyy", // opcional
  "answers": [
    {
      "questionId": "perg1",
      "rating": 5,
      "selectedOptions": [],
      "comment": null
    }
  ]
}
```

**PATCH** `/api/responses`

Atualiza dados de contato.

```json
{
  "responseId": "cmngzzz",
  "respondentName": "João",
  "respondentPhone": "11999999999",
  "respondentEmail": "joão@email.com"
}
```

### Pesquisa por Link
**GET** `/api/survey/[uniqueLink]`

Retorna dados da campanha para o link público.

---

## APIs de Campanhas

### Listar Campanhas
**GET** `/api/campaigns`

Retorna lista de campanhas do usuário.

### Criar Campanha
**POST** `/api/campaigns`

```json
{
  "title": "Pesquisa de Satisfação",
  "description": "Avaliação do atendimento",
  "status": "ACTIVE",
  "collectName": true,
  "collectPhone": false,
  "collectEmail": true,
  "questions": [
    {
      "text": "Como você avalia nosso atendimento?",
      "type": "SMILE",
      "isRequired": true,
      "allowOptionalComment": true,
      "order": 0
    }
  ]
}
```

### Atualizar Campanha
**PUT** `/api/campaigns/[id]**

### Deletar Campanha
**DELETE** `/api/campaigns/[id]`

---

## APIs de Terminais

### Login de Terminal
**POST** `/api/terminal/auth`

```json
{
  "email": "terminal@empresa.com",
  "password": "senha"
}
```

### Listar Terminais
**GET** `/api/terminals`

### Criar Terminal
**POST** `/api/terminals`

```json
{
  "name": "Terminal 1",
  "location": "Recepção",
  "email": "terminal1@empresa.com",
  "password": "senha123"
}
```

### Vincular Campanhas
**POST** `/api/terminals/[id]/campaigns`

```json
{
  "campaignId": "cmngxxx",
  "order": 0
}
```

---

## APIs de Propostas

### Listar Propostas
**GET** `/api/proposals`

### Criar Proposta
**POST** `/api/proposals`

### Buscar Proposta
**GET** `/api/proposals/[id]`

### Atualizar Proposta
**PUT** `/api/proposals/[id]`

### Deletar Proposta
**DELETE** `/api/proposals/[id]`

### Enviar por Email
**POST** `/api/proposals/[id]/email`

```json
{
  "recipientEmail": "cliente@email.com",
  "subject": "Proposta Comercial",
  "message": "Olá, segue a proposta..."
}
```

### Gerar PDF
**GET** `/api/proposals/[id]/pdf`

### Clonar Proposta
**POST** `/api/proposals/[id]/clone`

---

## APIs de Biblioteca de Imagens

### Listar Imagens
**GET** `/api/proposals/library-images`

### Upload de Imagem
**POST** `/api/proposals/library-images`

```json
{
  "action": "get-upload-url",
  "fileName": "imagem.jpg",
  "contentType": "image/jpeg"
}
```

```json
{
  "action": "save",
  "cloudStoragePath": "proposal-images/xxx/xxx.jpg",
  "caption": "Descrição"
}
```

### Deletar Imagem
**DELETE** `/api/proposals/library-images/[id]`

---

## APIs de Usuário

### Perfil
**GET** `/api/users/profile` - Buscar perfil
**PUT** `/api/users/profile` - Atualizar perfil

### Logo
**PUT** `/api/users/logo` - Definir logo
**DELETE** `/api/users/logo` - Remover logo

---

## APIs de employees

### Listar employees
**GET** `/api/employees`

### Criar employee
**POST** `/api/employees`

```json
{
  "name": "João Silva",
  "department": "Atendimento",
  "imageUrl": "https://..."
}
```

### Atualizar employee
**PUT** `/api/employees/[id]**

### Deletar employee
**DELETE** `/api/employees/[id]`

---

## Códigos de Erro

| Código | Significado |
|--------|-------------|
| 400 | Dados inválidos |
| 401 | Não autorizado |
| 404 | Não encontrado |
| 500 | Erro interno do servidor |

---

## Rate Limiting

**Status**: A implementar

APIs públicas como `/api/responses` devem ter rate limiting para evitar abuso.
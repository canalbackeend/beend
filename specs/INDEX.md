# Índice de Especificações SDD - Beend

Este documento serve como índice central para todas as especificações de módulos do sistema Beend, seguindo a metodologia SDD (Spec Driven Development).

---

## Visão Geral do Projeto

O **Beend** é uma plataforma de pesquisas de satisfação e gestão de propostas comerciais, desenvolvido em Next.js com banco de dados PostgreSQL.

---

## Especificações por Módulo

| Módulo | Arquivo | Versão | Status |
|--------|---------|--------|--------|
| Pesquisas de Satisfação | [SPEC-SURVEYS.md](./SPEC-SURVEYS.md) | 1.0 | ✅ Approved |
| Propostas Comerciais | [SPEC-PROPOSALS.md](./SPEC-PROPOSALS.md) | 1.0 | ✅ Approved |
| Terminais | [SPEC-TERMINALS.md](./SPEC-TERMINALS.md) | 1.0 | ✅ Approved |
| Autenticação e Usuários | [SPEC-AUTH.md](./SPEC-AUTH.md) | 1.0 | ✅ Approved |
| Contatos e Listas | [SPEC-CONTACTS.md](./SPEC-CONTACTS.md) | 1.0 | ✅ Approved |
| Employees (Colaboradores) | [SPEC-EMPLOYEES.md](./SPEC-EMPLOYEES.md) | 1.0 | ✅ Approved |

---

## Estrutura de Cada SPEC

Cada especificação segue o padrão SDD:

1. **Visão do Produto** - Propósito, problema resolvido, objetivos
2. **Requisitos Funcionais** - RF-001, RF-002, etc.
3. **Requisitos Não-Funcionais** - Performance, segurança, escalabilidade
4. **Design do Banco de Dados** - Tabelas Prisma
5. **Constitution** - Regras não negociáveis
6. **API Endpoints** - Tabela de rotas
7. **Decomposição em Tasks** - Epics e tarefas priorizadas
8. **Fluxos Principais** - User flows
9. **Glossário** - Definições de termos

---

## Como Usar Estas Specs

### Para Desenvolvimento com IA (SDD)

1. Antes de pedir para a IA implementar algo, consultar a spec do módulo
2. Usar a seção "Constitution" como regras hardcoded
3. Decompor tasks e dar uma por vez para o agente
4. Usar os fluxos como referência para validação

### Para Onboarding

1. Ler a spec do módulo que vai trabalhar
2. Consultar o glossário para terminologia
3. Verificar a decomposition de tasks

---

## Modules Dependencies

```
┌─────────────────────────────────────────────────────┐
│                    CORE (Auth)                      │
│                 SPEC-AUTH.md                        │
└─────────────────────┬───────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    ▼                 ▼                 ▼
┌─────────┐     ┌───────────┐     ┌───────────┐
│Survey   │     │Proposals  │     │ Terminals │
│SPEC-    │     │SPEC-      │     │SPEC-      │
│SURVEYS  │     │PROPOSALS  │     │TERMINALS  │
└────┬────┘     └─────┬─────┘     └─────┬─────┘
     │                │                 │
     ▼                ▼                 ▼
┌─────────┐     ┌───────────┐     ┌───────────┐
│Contacts │     │Employees  │     │           │
│SPEC-    │     │SPEC-      │     │           │
│CONTACTS │     │EMPLOYEES  │     │           │
└─────────┘     └───────────┘     └───────────┘
```

---

## Documentação Adicional

- [README.md](../README.md) - Visão geral do projeto
- [docs/](./docs/) - Documentação técnica completa

---

## Notas de Uso

1. **Specs são autoritativas** - O código deve seguir a spec, não o contrário
2. ** Constitution é inegociável** - Regras nessa seção devem ser seguidas
3. **Tasks são prioritizadas** - Implementar em ordem de prioridade
4. **Revisão periódica** - Atualizar specs quando houver mudanças significativas

---

**Criado**: 2026-04-02  
**Metodologia**: SDD (Spec Driven Development)  
**Versão do Índice**: 1.0
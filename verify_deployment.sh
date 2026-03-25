#!/bin/bash

echo "🔍 Verificando arquivos essenciais para deploy..."
echo ""

# Verificar schema.prisma
if grep -q "EMPLOYEE_RATING" prisma/schema.prisma; then
    echo "✅ Schema prisma: EMPLOYEE_RATING encontrado"
else
    echo "❌ Schema prisma: EMPLOYEE_RATING NÃO encontrado"
fi

# Verificar migration
if [ -f "prisma/migrations/20250208160000_add_employee_rating_system/migration.sql" ]; then
    echo "✅ Migration: Arquivo encontrado"
    if grep -q "EMPLOYEE_RATING" prisma/migrations/20250208160000_add_employee_rating_system/migration.sql; then
        echo "✅ Migration: EMPLOYEE_RATING no SQL"
    else
        echo "❌ Migration: EMPLOYEE_RATING NÃO encontrado no SQL"
    fi
else
    echo "❌ Migration: Arquivo NÃO encontrado"
fi

# Verificar tabela Employee
if grep -q "model Employee" prisma/schema.prisma; then
    echo "✅ Schema: Model Employee encontrado"
else
    echo "❌ Schema: Model Employee NÃO encontrado"
fi

# Verificar API de employees
if [ -d "app/api/employees" ]; then
    echo "✅ API: Pasta app/api/employees encontrada"
else
    echo "❌ API: Pasta app/api/employees NÃO encontrada"
fi

# Verificar página de employees
if [ -f "app/employees/page.tsx" ]; then
    echo "✅ Página: app/employees/page.tsx encontrada"
else
    echo "❌ Página: app/employees/page.tsx NÃO encontrada"
fi

# Verificar dashboard atualizado
if grep -q "QuestionType" app/dashboard/_components/dashboard-content.tsx; then
    echo "✅ Dashboard: Tipos de questão atualizados"
else
    echo "❌ Dashboard: Tipos de questão NÃO atualizados"
fi

# Verificar health endpoint
if [ -f "app/api/health/route.ts" ]; then
    echo "✅ Health: Endpoint encontrado"
else
    echo "❌ Health: Endpoint NÃO encontrado"
fi

echo ""
echo "📊 Resumo da verificação concluído!"

#!/bin/bash
echo "🔧 Configurando aplicação..."
npx prisma generate
echo "✅ Prisma gerado"
npm run start

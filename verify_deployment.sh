#!/bin/bash
echo "🔧 Configurando aplicação..."
export DATABASE_URL="postgresql://postgres:Mk693FX3LcHPfjEnI0wKHtRKh1Mtd0gJVauSBGYUUi6XleE2ohxqygvrkhRhPfXh@q7axdm9q41z8shvjto9ll932:5432/pesquisa_satisfacao"
export NEXTAUTH_SECRET="a6d298cac14b79fd093602316da7923f"
export NEXTAUTH_URL="https://totem.beend.tech"
export NEXT_PUBLIC_APP_URL="https://totem.beend.tech"
npx prisma generate
echo "✅ Prisma gerado"
npm run start

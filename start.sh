#!/bin/bash
set -a
source .env.production
set +a
npx prisma generate
npm run start

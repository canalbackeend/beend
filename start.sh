#!/bin/bash
export $(cat .env.production | grep -v '^#' | xargs)
npx prisma generate
npm run start

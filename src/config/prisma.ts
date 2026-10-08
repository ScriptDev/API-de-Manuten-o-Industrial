import { PrismaClient } from '@prisma/client';

// [Arquitetura] Singleton do PrismaClient para gerenciar pool de conexões com o SQLite
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

export default prisma;

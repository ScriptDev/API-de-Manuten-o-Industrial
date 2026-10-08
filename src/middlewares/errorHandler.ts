import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

// [DevSecOps] Middleware central de tratamento e saneamento de erros
export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response | void {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      statusCode: error.statusCode,
      message: error.message,
    });
  }

  // Tratamento de violação de integridade referencial do Prisma (Problema 6)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Operação recusada: O registro possui relacionamentos ativos (Ordens de Serviço, Defeitos ou Manutenções) que impedem a exclusão.',
        code: error.code,
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Registro não encontrado no banco de dados.',
        code: error.code,
      });
    }
  }

  // Falha não tratada
  console.error('[ERRO_INTERNO]', error);
  return res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: 'Erro interno do servidor. Contate o suporte da plataforma.',
  });
}

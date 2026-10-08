import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export class DefeitoController {
  // [CRUD] Listar todos os defeitos cadastrados
  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const severidade = req.query.severidade ? String(req.query.severidade) : undefined;
      const equipamentoId = req.query.equipamentoId ? String(req.query.equipamentoId) : undefined;

      const where: any = {};
      if (severidade) where.severidade = severidade;
      if (equipamentoId) where.equipamentoId = equipamentoId;

      const defeitos = await prisma.defeito.findMany({
        where,
        include: { equipamento: true },
        orderBy: { dataRegistro: 'desc' },
      });

      return res.json(defeitos);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Buscar defeito por ID
  static async getById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);

      const defeito = await prisma.defeito.findUnique({
        where: { id },
        include: { equipamento: true },
      });

      if (!defeito) {
        throw new AppError('Defeito não encontrado.', 404);
      }

      return res.json(defeito);
    } catch (error) {
      return next(error);
    }
  }

  // [Problema 5 & CRUD] Registrar defeito destacando severidade crítica
  static async create(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { equipamentoId, descricao, severidade, dataRegistro } = req.body;

      if (!equipamentoId || !descricao || !severidade) {
        throw new AppError('Campos obrigatórios ausentes: equipamentoId, descricao e severidade são obrigatórios.', 400);
      }

      const severidadesValidas = ['Baixo', 'Médio', 'Medio', 'Alto', 'Crítico', 'Critico'];
      if (!severidadesValidas.map(s => s.toLowerCase()).includes(severidade.toLowerCase())) {
        throw new AppError('Grau de severidade inválido. Valores aceitos: Baixo, Médio, Alto, Crítico.', 400);
      }

      // Validar se o equipamento associado existe
      const equipamento = await prisma.equipamento.findUnique({
        where: { id: String(equipamentoId) },
      });

      if (!equipamento) {
        throw new AppError('Equipamento associado inexistente.', 404);
      }

      // Padroniza a severidade
      const severidadeFormatada =
        severidade.toLowerCase() === 'critico' ? 'Crítico' :
        severidade.toLowerCase() === 'medio' ? 'Médio' :
        severidade.charAt(0).toUpperCase() + severidade.slice(1).toLowerCase();

      const defeito = await prisma.defeito.create({
        data: {
          equipamentoId: String(equipamentoId),
          descricao,
          severidade: severidadeFormatada,
          dataRegistro: dataRegistro ? new Date(dataRegistro) : new Date(),
        },
        include: { equipamento: true },
      });

      // [Problema 5] Destacar prioridade imediata para defeitos Críticos ou Altos
      if (severidadeFormatada === 'Crítico' || severidadeFormatada === 'Alto') {
        return res.status(201).json({
          status: 'PRIORIDADE_MAXIMA',
          alertaPrioridade: `🚨 ATENÇÃO OPERACIONAL: Defeito com grau de severidade "${severidadeFormatada.toUpperCase()}" registrado! Notificação enviada à equipe técnica para contenção imediata da máquina ${equipamento.nome}.`,
          defeito,
        });
      }

      return res.status(201).json(defeito);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Atualizar registro de defeito
  static async update(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);
      const { descricao, severidade } = req.body;

      const existente = await prisma.defeito.findUnique({ where: { id } });
      if (!existente) {
        throw new AppError('Registro de defeito inexistente.', 404);
      }

      const dataToUpdate: any = {};
      if (descricao !== undefined) dataToUpdate.descricao = descricao;
      if (severidade !== undefined) {
        const severidadeFormatada =
          severidade.toLowerCase() === 'critico' ? 'Crítico' :
          severidade.toLowerCase() === 'medio' ? 'Médio' :
          severidade.charAt(0).toUpperCase() + severidade.slice(1).toLowerCase();
        dataToUpdate.severidade = severidadeFormatada;
      }

      const atualizado = await prisma.defeito.update({
        where: { id },
        data: dataToUpdate,
        include: { equipamento: true },
      });

      return res.json(atualizado);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Excluir defeito
  static async delete(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);

      const defeito = await prisma.defeito.findUnique({ where: { id } });
      if (!defeito) {
        throw new AppError('Defeito não encontrado.', 404);
      }

      await prisma.defeito.delete({ where: { id } });

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  // [Problema 5] Endpoint para listar defeitos críticos
  static async listCriticos(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const defeitosCriticos = await prisma.defeito.findMany({
        where: { severidade: { in: ['Crítico', 'Alto'] } },
        include: { equipamento: true },
        orderBy: { dataRegistro: 'desc' },
      });

      return res.json({
        totalCriticos: defeitosCriticos.length,
        alerta: 'Lista de falhas com alta severidade requerendo intervenção.',
        defeitos: defeitosCriticos,
      });
    } catch (error) {
      return next(error);
    }
  }
}

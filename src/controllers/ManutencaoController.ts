import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export class ManutencaoController {
  // [CRUD] Listar todas as programações de manutenção preventiva
  static async list(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const manutencoes = await prisma.manutencaoPreventiva.findMany({
        include: { equipamento: true },
        orderBy: { proximaManutencao: 'asc' },
      });

      return res.json(manutencoes);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Buscar manutenção preventiva por ID
  static async getById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);

      const manutencao = await prisma.manutencaoPreventiva.findUnique({
        where: { id },
        include: { equipamento: true },
      });

      if (!manutencao) {
        throw new AppError('Programação de manutenção preventiva não encontrada.', 404);
      }

      return res.json(manutencao);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Criar programação de manutenção preventiva
  static async create(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { equipamentoId, periodicidadeDias, ultimaManutencao, proximaManutencao } = req.body;

      if (!equipamentoId || !periodicidadeDias || !ultimaManutencao) {
        throw new AppError('Campos obrigatórios ausentes: equipamentoId, periodicidadeDias e ultimaManutencao.', 400);
      }

      const equipamento = await prisma.equipamento.findUnique({
        where: { id: String(equipamentoId) },
      });

      if (!equipamento) {
        throw new AppError('Equipamento informado inexistente.', 404);
      }

      const ultimaData = new Date(ultimaManutencao);
      if (isNaN(ultimaData.getTime())) {
        throw new AppError('Formato de ultimaManutencao inválido.', 400);
      }

      // Se proximaManutencao não for informada, calcula dinamicamente pela periodicidade
      let proximaData: Date;
      if (proximaManutencao) {
        proximaData = new Date(proximaManutencao);
        if (isNaN(proximaData.getTime())) {
          throw new AppError('Formato de proximaManutencao inválido.', 400);
        }
      } else {
        proximaData = new Date(ultimaData);
        proximaData.setDate(proximaData.getDate() + Number(periodicidadeDias));
      }

      const registro = await prisma.manutencaoPreventiva.create({
        data: {
          equipamentoId: String(equipamentoId),
          periodicidadeDias: Number(periodicidadeDias),
          ultimaManutencao: ultimaData,
          proximaManutencao: proximaData,
        },
        include: { equipamento: true },
      });

      return res.status(201).json(registro);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Atualizar programação
  static async update(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);
      const { periodicidadeDias, ultimaManutencao, proximaManutencao } = req.body;

      const existente = await prisma.manutencaoPreventiva.findUnique({ where: { id } });
      if (!existente) {
        throw new AppError('Programação de manutenção não encontrada.', 404);
      }

      const dataToUpdate: any = {};
      if (periodicidadeDias !== undefined) {
        dataToUpdate.periodicidadeDias = Number(periodicidadeDias);
      }
      if (ultimaManutencao !== undefined) {
        dataToUpdate.ultimaManutencao = new Date(ultimaManutencao);
      }
      if (proximaManutencao !== undefined) {
        dataToUpdate.proximaManutencao = new Date(proximaManutencao);
      }

      const atualizado = await prisma.manutencaoPreventiva.update({
        where: { id },
        data: dataToUpdate,
        include: { equipamento: true },
      });

      return res.json(atualizado);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Excluir programação
  static async delete(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);

      const existente = await prisma.manutencaoPreventiva.findUnique({ where: { id } });
      if (!existente) {
        throw new AppError('Programação de manutenção não encontrada.', 404);
      }

      await prisma.manutencaoPreventiva.delete({ where: { id } });

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  // [Problema 3] Identificar manutenções preventivas vencidas e emitir alerta
  static async listVencidas(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const hoje = new Date();

      const vencidas = await prisma.manutencaoPreventiva.findMany({
        where: {
          proximaManutencao: {
            lt: hoje,
          },
        },
        include: { equipamento: true },
        orderBy: { proximaManutencao: 'asc' },
      });

      const relatorioVencidas = vencidas.map((item) => {
        const diffEmMs = hoje.getTime() - new Date(item.proximaManutencao).getTime();
        const diasAtraso = Math.floor(diffEmMs / (1000 * 60 * 60 * 24));

        return {
          id: item.id,
          equipamento: {
            id: item.equipamento.id,
            nome: item.equipamento.nome,
            modelo: item.equipamento.modelo,
            status: item.equipamento.status,
          },
          periodicidadeDias: item.periodicidadeDias,
          ultimaManutencao: item.ultimaManutencao,
          proximaManutencaoPrevista: item.proximaManutencao,
          diasAtraso,
          alertaOperacional: `⚠️ ATENÇÃO: MANUTENÇÃO PREVENTIVA VENCIDA HÁ ${diasAtraso} DIA(S)! Risco de parada não programada da máquina.`,
        };
      });

      return res.json({
        totalVencidas: relatorioVencidas.length,
        statusAlerta: relatorioVencidas.length > 0 ? 'ALERTA_ATIVO' : 'REGULAR',
        mensagemGeral:
          relatorioVencidas.length > 0
            ? 'Existem máquinas operando com manutenção preventiva em atraso.'
            : 'Todas as manutenções preventivas estão em dia.',
        vencidas: relatorioVencidas,
      });
    } catch (error) {
      return next(error);
    }
  }
}

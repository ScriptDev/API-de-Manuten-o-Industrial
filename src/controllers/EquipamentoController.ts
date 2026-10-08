import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export class EquipamentoController {
  // [CRUD] Listar todos os equipamentos (suporta filtro opcional por status)
  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      const where = status ? { status } : {};

      const equipamentos = await prisma.equipamento.findMany({
        where,
        include: {
          _count: {
            select: {
              ordens: true,
              defeitos: true,
              manutencoes: true,
            },
          },
        },
        orderBy: { nome: 'asc' },
      });

      return res.json(equipamentos);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Obter equipamento por ID
  static async getById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);

      const equipamento = await prisma.equipamento.findUnique({
        where: { id },
        include: {
          ordens: {
            include: { pecas: true },
          },
          defeitos: true,
          manutencoes: true,
        },
      });

      if (!equipamento) {
        throw new AppError('Equipamento inexistente.', 404);
      }

      return res.json(equipamento);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Cadastrar novo equipamento
  static async create(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { nome, modelo, fabricante, dataInstalacao, status } = req.body;

      // [Regra de Negócio] Validação de campos obrigatórios
      if (!nome || !modelo || !fabricante || !dataInstalacao || !status) {
        throw new AppError('Campos obrigatórios ausentes: nome, modelo, fabricante, dataInstalacao e status são obrigatórios.', 400);
      }

      const statusValidos = ['Ativo', 'Em manutenção', 'Inativo'];
      if (!statusValidos.includes(status)) {
        throw new AppError(`Status inválido. Valores aceitos: ${statusValidos.join(', ')}.`, 400);
      }

      const parsedDate = new Date(dataInstalacao);
      if (isNaN(parsedDate.getTime())) {
        throw new AppError('Formato de dataInstalacao inválido. Use o padrão ISO-8601 (ex: YYYY-MM-DD).', 400);
      }

      const equipamento = await prisma.equipamento.create({
        data: {
          nome,
          modelo,
          fabricante,
          dataInstalacao: parsedDate,
          status,
        },
      });

      return res.status(201).json(equipamento);
    } catch (error) {
      return next(error);
    }
  }

  // [Problema 1] Atualizar máquina cadastrada incorretamente
  static async update(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);
      const { nome, modelo, fabricante, dataInstalacao, status } = req.body;

      const existente = await prisma.equipamento.findUnique({ where: { id } });
      if (!existente) {
        throw new AppError('Equipamento inexistente. Impossível atualizar.', 404);
      }

      const dataToUpdate: any = {};
      if (nome !== undefined) dataToUpdate.nome = nome;
      if (modelo !== undefined) dataToUpdate.modelo = modelo;
      if (fabricante !== undefined) dataToUpdate.fabricante = fabricante;
      if (status !== undefined) {
        const statusValidos = ['Ativo', 'Em manutenção', 'Inativo'];
        if (!statusValidos.includes(status)) {
          throw new AppError(`Status inválido. Valores permitidos: ${statusValidos.join(', ')}.`, 400);
        }
        dataToUpdate.status = status;
      }
      if (dataInstalacao !== undefined) {
        const parsedDate = new Date(dataInstalacao);
        if (isNaN(parsedDate.getTime())) {
          throw new AppError('Formato de dataInstalacao inválido.', 400);
        }
        dataToUpdate.dataInstalacao = parsedDate;
      }

      const atualizado = await prisma.equipamento.update({
        where: { id },
        data: dataToUpdate,
      });

      return res.json({
        mensagem: 'Equipamento atualizado com sucesso.',
        equipamento: atualizado,
      });
    } catch (error) {
      return next(error);
    }
  }

  // [Problema 6] Excluir equipamento impedindo caso haja OS vinculadas
  static async delete(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);

      const equipamento = await prisma.equipamento.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              ordens: true,
              defeitos: true,
              manutencoes: true,
            },
          },
        },
      });

      if (!equipamento) {
        throw new AppError('Equipamento inexistente.', 404);
      }

      // [Problema 6] Verificação explícita de regra de negócio
      if (equipamento._count.ordens > 0 || equipamento._count.defeitos > 0 || equipamento._count.manutencoes > 0) {
        throw new AppError(
          `Impossível excluir equipamento: Existem registros vinculados (${equipamento._count.ordens} Ordens de Serviço, ${equipamento._count.defeitos} Defeitos, ${equipamento._count.manutencoes} Manutenções).`,
          400
        );
      }

      await prisma.equipamento.delete({ where: { id } });

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  // [Problema 7] Consultar equipamentos que estão atualmente em manutenção
  static async listInMaintenance(_req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const equipamentos = await prisma.equipamento.findMany({
        where: { status: 'Em manutenção' },
        include: {
          ordens: {
            where: { status: { in: ['Aberta', 'Em andamento'] } },
          },
        },
      });

      return res.json({
        total: equipamentos.length,
        descricao: 'Equipamentos que estão atualmente sob processo de manutenção.',
        equipamentos,
      });
    } catch (error) {
      return next(error);
    }
  }
}

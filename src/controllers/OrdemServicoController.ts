import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export class OrdemServicoController {
  // [CRUD] Listar todas as ordens de serviço
  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      const tipo = req.query.tipo ? String(req.query.tipo) : undefined;
      const equipamentoId = req.query.equipamentoId ? String(req.query.equipamentoId) : undefined;

      const where: any = {};
      if (status) where.status = status;
      if (tipo) where.tipo = tipo;
      if (equipamentoId) where.equipamentoId = equipamentoId;

      const ordens = await prisma.ordemServico.findMany({
        where,
        include: {
          equipamento: true,
          pecas: true,
        },
        orderBy: { dataAbertura: 'desc' },
      });

      return res.json(ordens);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Buscar OS por ID
  static async getById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);

      const os = await prisma.ordemServico.findUnique({
        where: { id },
        include: {
          equipamento: true,
          pecas: true,
        },
      });

      if (!os) {
        throw new AppError('Ordem de serviço inexistente.', 404);
      }

      return res.json(os);
    } catch (error) {
      return next(error);
    }
  }

  // [Problema 2 & CRUD] Cadastrar OS impedindo equipamento inexistente
  static async create(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { equipamentoId, tipo, responsavel, status, dataAbertura } = req.body;

      // [Regra de Negócio] Validação de campos obrigatórios
      if (!equipamentoId || !tipo || !responsavel) {
        throw new AppError('Campos obrigatórios ausentes: equipamentoId, tipo e responsavel são obrigatórios.', 400);
      }

      const tiposValidos = ['Preventiva', 'Corretiva'];
      if (!tiposValidos.includes(tipo)) {
        throw new AppError(`Tipo de manutenção inválido. Valores aceitos: ${tiposValidos.join(', ')}.`, 400);
      }

      const statusInicial = status || 'Aberta';
      const statusValidos = ['Aberta', 'Em andamento', 'Finalizada'];
      if (!statusValidos.includes(statusInicial)) {
        throw new AppError(`Status inválido. Valores aceitos: ${statusValidos.join(', ')}.`, 400);
      }

      // [Problema 2] Validação estrita de existência do equipamento
      const equipamento = await prisma.equipamento.findUnique({
        where: { id: String(equipamentoId) },
      });

      if (!equipamento) {
        throw new AppError('Equipamento inexistente. Cadastro de Ordem de Serviço negado.', 404);
      }

      // Se a OS for iniciada como Em andamento, atualiza status do equipamento para Em manutenção se estiver Ativo
      if (statusInicial === 'Em andamento' && equipamento.status === 'Ativo') {
        await prisma.equipamento.update({
          where: { id: String(equipamentoId) },
          data: { status: 'Em manutenção' },
        });
      }

      const os = await prisma.ordemServico.create({
        data: {
          equipamentoId: String(equipamentoId),
          tipo,
          responsavel,
          status: statusInicial,
          dataAbertura: dataAbertura ? new Date(dataAbertura) : new Date(),
        },
        include: {
          equipamento: true,
        },
      });

      return res.status(201).json(os);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Atualizar Ordem de Serviço
  static async update(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);
      const { tipo, responsavel, status, dataConclusao } = req.body;

      const osExistente = await prisma.ordemServico.findUnique({
        where: { id },
      });

      if (!osExistente) {
        throw new AppError('Ordem de serviço não encontrada.', 404);
      }

      // [Regra de Negócio Obrigatória] Tratamento de erro: "Ordem de serviço já finalizada"
      if (osExistente.status === 'Finalizada') {
        throw new AppError('Operação negada: A Ordem de Serviço já está finalizada e não pode ser modificada.', 400);
      }

      const dataToUpdate: any = {};
      if (tipo !== undefined) {
        const tiposValidos = ['Preventiva', 'Corretiva'];
        if (!tiposValidos.includes(tipo)) {
          throw new AppError(`Tipo inválido. Valores permitidos: ${tiposValidos.join(', ')}.`, 400);
        }
        dataToUpdate.tipo = tipo;
      }

      if (responsavel !== undefined) dataToUpdate.responsavel = responsavel;

      if (status !== undefined) {
        const statusValidos = ['Aberta', 'Em andamento', 'Finalizada'];
        if (!statusValidos.includes(status)) {
          throw new AppError(`Status inválido. Valores permitidos: ${statusValidos.join(', ')}.`, 400);
        }
        dataToUpdate.status = status;

        if (status === 'Finalizada' && !dataConclusao && !osExistente.dataConclusao) {
          dataToUpdate.dataConclusao = new Date();
        }
      }

      if (dataConclusao !== undefined) {
        dataToUpdate.dataConclusao = new Date(dataConclusao);
      }

      const osAtualizada = await prisma.ordemServico.update({
        where: { id },
        data: dataToUpdate,
        include: { equipamento: true, pecas: true },
      });

      return res.json(osAtualizada);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Excluir Ordem de Serviço
  static async delete(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);

      const os = await prisma.ordemServico.findUnique({ where: { id } });
      if (!os) {
        throw new AppError('Ordem de serviço não encontrada.', 404);
      }

      if (os.status === 'Finalizada') {
        throw new AppError('Operação negada: Não é permitido excluir uma Ordem de Serviço que já foi finalizada por motivos de auditoria.', 400);
      }

      await prisma.ordemServico.delete({ where: { id } });

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  // [Problema 8] Calcular o custo total de peças utilizadas em uma Ordem de Serviço
  static async calcularCustoPecas(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);

      const os: any = await prisma.ordemServico.findUnique({
        where: { id },
        include: {
          equipamento: true,
          pecas: true,
        },
      });

      if (!os) {
        throw new AppError('Ordem de serviço inexistente.', 404);
      }

      const pecas: any[] = os.pecas || [];
      const totalPecas = pecas.reduce((acc: number, peca: any) => acc + peca.quantidade, 0);
      const custoTotal = pecas.reduce((acc: number, peca: any) => {
        return acc + (peca.quantidade * peca.custoUnitario);
      }, 0);

      const pecasDetalhadas = pecas.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        codigo: p.codigo,
        quantidade: p.quantidade,
        custoUnitario: p.custoUnitario,
        subtotal: Number((p.quantidade * p.custoUnitario).toFixed(2)),
      }));

      return res.json({
        ordemServicoId: os.id,
        statusOS: os.status,
        responsavel: os.responsavel,
        equipamento: {
          id: os.equipamento?.id,
          nome: os.equipamento?.nome,
          modelo: os.equipamento?.modelo,
        },
        totalItensSubstituidos: totalPecas,
        custoTotal: Number(custoTotal.toFixed(2)),
        custoTotalFormatado: `R$ ${custoTotal.toFixed(2).replace('.', ',')}`,
        pecas: pecasDetalhadas,
      });
    } catch (error) {
      return next(error);
    }
  }
}

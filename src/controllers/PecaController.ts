import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export class PecaController {
  // [CRUD] Listar todas as peças substituídas
  static async list(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const codigo = req.query.codigo ? String(req.query.codigo) : undefined;
      const ordemServicoId = req.query.ordemServicoId ? String(req.query.ordemServicoId) : undefined;

      const where: any = {};
      if (codigo) where.codigo = codigo;
      if (ordemServicoId) where.ordemServicoId = ordemServicoId;

      const pecas = await prisma.pecaSubstituida.findMany({
        where,
        include: {
          ordemServico: {
            include: { equipamento: true },
          },
        },
        orderBy: { nome: 'asc' },
      });

      return res.json(pecas);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Buscar peça por ID
  static async getById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);

      const peca = await prisma.pecaSubstituida.findUnique({
        where: { id },
        include: {
          ordemServico: {
            include: { equipamento: true },
          },
        },
      });

      if (!peca) {
        throw new AppError('Peça substituída não encontrada.', 404);
      }

      return res.json(peca);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Cadastrar peça vinculada à Ordem de Serviço
  static async create(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { nome, codigo, quantidade, custoUnitario, ordemServicoId } = req.body;

      if (!nome || !codigo || quantidade === undefined || custoUnitario === undefined || !ordemServicoId) {
        throw new AppError('Campos obrigatórios ausentes: nome, codigo, quantidade, custoUnitario e ordemServicoId.', 400);
      }

      if (Number(quantidade) <= 0) {
        throw new AppError('A quantidade deve ser um número inteiro positivo maior que zero.', 400);
      }

      if (Number(custoUnitario) < 0) {
        throw new AppError('O custo unitário não pode ser negativo.', 400);
      }

      // Validar existência da Ordem de Serviço
      const os = await prisma.ordemServico.findUnique({
        where: { id: String(ordemServicoId) },
      });

      if (!os) {
        throw new AppError('Ordem de serviço vinculada não encontrada.', 404);
      }

      // [Regra de Negócio Obrigatória] Impedir inclusão em OS já finalizada
      if (os.status === 'Finalizada') {
        throw new AppError('Operação negada: Não é permitido adicionar peças a uma Ordem de Serviço já finalizada.', 400);
      }

      const peca = await prisma.pecaSubstituida.create({
        data: {
          nome,
          codigo,
          quantidade: Number(quantidade),
          custoUnitario: Number(custoUnitario),
          ordemServicoId: String(ordemServicoId),
        },
        include: {
          ordemServico: true,
        },
      });

      return res.status(201).json(peca);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Atualizar registro de peça
  static async update(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);
      const { nome, codigo, quantidade, custoUnitario } = req.body;

      const existente: any = await prisma.pecaSubstituida.findUnique({
        where: { id },
        include: { ordemServico: true },
      });

      if (!existente) {
        throw new AppError('Peça não encontrada.', 404);
      }

      if (existente.ordemServico?.status === 'Finalizada') {
        throw new AppError('Operação negada: A Ordem de Serviço desta peça já está finalizada.', 400);
      }

      const dataToUpdate: any = {};
      if (nome !== undefined) dataToUpdate.nome = nome;
      if (codigo !== undefined) dataToUpdate.codigo = codigo;
      if (quantidade !== undefined) {
        if (Number(quantidade) <= 0) throw new AppError('Quantidade deve ser positiva.', 400);
        dataToUpdate.quantidade = Number(quantidade);
      }
      if (custoUnitario !== undefined) {
        if (Number(custoUnitario) < 0) throw new AppError('Custo unitário não pode ser negativo.', 400);
        dataToUpdate.custoUnitario = Number(custoUnitario);
      }

      const atualizado = await prisma.pecaSubstituida.update({
        where: { id },
        data: dataToUpdate,
      });

      return res.json(atualizado);
    } catch (error) {
      return next(error);
    }
  }

  // [CRUD] Excluir registro de peça
  static async delete(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const id = String(req.params.id);

      const existente: any = await prisma.pecaSubstituida.findUnique({
        where: { id },
        include: { ordemServico: true },
      });

      if (!existente) {
        throw new AppError('Peça não encontrada.', 404);
      }

      if (existente.ordemServico?.status === 'Finalizada') {
        throw new AppError('Operação negada: Não é permitido remover peças de uma Ordem de Serviço finalizada.', 400);
      }

      await prisma.pecaSubstituida.delete({ where: { id } });

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  // [Problema 4] Consultar histórico de uma peça específica por código
  static async getHistoricoByCodigo(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const codigo = String(req.params.codigo);

      const historico: any[] = await prisma.pecaSubstituida.findMany({
        where: {
          codigo: {
            equals: codigo,
          },
        },
        include: {
          ordemServico: {
            include: {
              equipamento: true,
            },
          },
        },
        orderBy: {
          ordemServico: {
            dataAbertura: 'desc',
          },
        },
      });

      if (historico.length === 0) {
        return res.json({
          codigoPeca: codigo,
          totalSubstituicoes: 0,
          quantidadeTotalConsumida: 0,
          custoTotalAcumulado: 0,
          mensagem: 'Nenhum registro de substituição encontrado para o código de peça fornecido.',
          registros: [],
        });
      }

      const quantidadeTotal = historico.reduce((acc: number, item: any) => acc + item.quantidade, 0);
      const custoTotalAcumulado = historico.reduce(
        (acc: number, item: any) => acc + item.quantidade * item.custoUnitario,
        0
      );

      const registrosFormatados = historico.map((item: any) => ({
        substituicaoId: item.id,
        nomePeca: item.nome,
        quantidade: item.quantidade,
        custoUnitario: item.custoUnitario,
        custoSubtotal: Number((item.quantidade * item.custoUnitario).toFixed(2)),
        ordemServico: {
          id: item.ordemServico?.id,
          tipo: item.ordemServico?.tipo,
          status: item.ordemServico?.status,
          responsavel: item.ordemServico?.responsavel,
          dataAbertura: item.ordemServico?.dataAbertura,
          dataConclusao: item.ordemServico?.dataConclusao,
        },
        equipamento: {
          id: item.ordemServico?.equipamento?.id,
          nome: item.ordemServico?.equipamento?.nome,
          modelo: item.ordemServico?.equipamento?.modelo,
          fabricante: item.ordemServico?.equipamento?.fabricante,
        },
      }));

      return res.json({
        codigoPeca: codigo,
        nomeReferencia: historico[0].nome,
        totalOcorrencias: historico.length,
        quantidadeTotalConsumida: quantidadeTotal,
        custoTotalAcumulado: Number(custoTotalAcumulado.toFixed(2)),
        custoTotalFormatado: `R$ ${custoTotalAcumulado.toFixed(2).replace('.', ',')}`,
        historicoSubstituicoes: registrosFormatados,
      });
    } catch (error) {
      return next(error);
    }
  }
}

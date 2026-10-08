import { Router } from 'express';
import equipamentoRoutes from './equipamento.routes';
import ordemServicoRoutes from './ordemServico.routes';
import defeitoRoutes from './defeito.routes';
import manutencaoRoutes from './manutencao.routes';
import pecaRoutes from './peca.routes';

const routes = Router();

routes.get('/', (_req, res) => {
  res.json({
    message: 'API de Controle de Manutenção Industrial - Online',
    documentacao: '/api-docs',
    versao: '1.0.0',
    status: 'operacional',
  });
});

routes.use('/equipamentos', equipamentoRoutes);
routes.use('/ordens-servico', ordemServicoRoutes);
routes.use('/defeitos', defeitoRoutes);
routes.use('/manutencoes', manutencaoRoutes);
routes.use('/pecas', pecaRoutes);

export default routes;

import { Router } from 'express';
import { PecaController } from '../controllers/PecaController';

const router = Router();

// [Problema 4] Consultar histórico de uma peça específica por código
router.get('/historico/:codigo', PecaController.getHistoricoByCodigo);

// [CRUD] Peças Substituídas
router.get('/', PecaController.list);
router.get('/:id', PecaController.getById);
router.post('/', PecaController.create);
router.put('/:id', PecaController.update);
router.delete('/:id', PecaController.delete);

export default router;

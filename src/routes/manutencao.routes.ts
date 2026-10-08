import { Router } from 'express';
import { ManutencaoController } from '../controllers/ManutencaoController';

const router = Router();

// [Problema 3] Listar manutenções preventivas vencidas e emitir alertas
router.get('/vencidas', ManutencaoController.listVencidas);

// [CRUD] Manutenção Preventiva
router.get('/', ManutencaoController.list);
router.get('/:id', ManutencaoController.getById);
router.post('/', ManutencaoController.create);
router.put('/:id', ManutencaoController.update);
router.delete('/:id', ManutencaoController.delete);

export default router;

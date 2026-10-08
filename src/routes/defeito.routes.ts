import { Router } from 'express';
import { DefeitoController } from '../controllers/DefeitoController';

const router = Router();

// [Problema 5] Listagem rápida de defeitos críticos/altos
router.get('/criticos', DefeitoController.listCriticos);

// [CRUD] Defeitos
router.get('/', DefeitoController.list);
router.get('/:id', DefeitoController.getById);

// [Problema 5] Registrar defeito com destaque de criticidade
router.post('/', DefeitoController.create);

router.put('/:id', DefeitoController.update);
router.delete('/:id', DefeitoController.delete);

export default router;

import { Router } from 'express';
import { OrdemServicoController } from '../controllers/OrdemServicoController';

const router = Router();

// [Problema 8] Calcular o custo total de peças utilizadas em uma OS
router.get('/:id/custo-pecas', OrdemServicoController.calcularCustoPecas);

// [CRUD] Ordens de Serviço
router.get('/', OrdemServicoController.list);
router.get('/:id', OrdemServicoController.getById);

// [Problema 2] Cadastro de OS impedindo equipamento inexistente
router.post('/', OrdemServicoController.create);

router.put('/:id', OrdemServicoController.update);
router.delete('/:id', OrdemServicoController.delete);

export default router;

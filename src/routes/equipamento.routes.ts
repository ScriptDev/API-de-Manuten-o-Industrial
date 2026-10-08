import { Router } from 'express';
import { EquipamentoController } from '../controllers/EquipamentoController';

const router = Router();

// [Problema 7] Consulta de equipamentos em manutenção (registrado antes do :id para evitar conflito de rota)
router.get('/em-manutencao', EquipamentoController.listInMaintenance);

// [CRUD] Equipamentos
router.get('/', EquipamentoController.list);
router.get('/:id', EquipamentoController.getById);
router.post('/', EquipamentoController.create);

// [Problema 1] Atualizar equipamento cadastrado incorretamente
router.put('/:id', EquipamentoController.update);

// [Problema 6] Excluir equipamento (com validação de integridade referencial)
router.delete('/:id', EquipamentoController.delete);

export default router;

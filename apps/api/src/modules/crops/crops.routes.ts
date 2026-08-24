import { Router } from 'express';
import { cropsController } from './crops.controller.js';

const router = Router();

router.get('/', cropsController.listCrops);
router.get('/:id', cropsController.getCropById);
router.get('/:id/seasons', cropsController.getCropSeasons);

export default router;

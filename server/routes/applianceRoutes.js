import express from 'express';
import {
  getAppliances,
  getApplianceById,
  createAppliance,
  toggleAppliance,
  toggleApplianceStatus,
  updateAppliance,
  deleteAppliance,
} from '../controllers/applianceController.js';
import { extractUser, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(extractUser);
router.use(protect);

router.route('/')
  .get(getAppliances)
  .post(createAppliance);

router.route('/:id')
  .get(getApplianceById)
  .put(updateAppliance)
  .delete(deleteAppliance);

router.patch('/:id/toggle', protect, toggleAppliance);

export default router;

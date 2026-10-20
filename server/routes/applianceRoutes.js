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
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to resolve user session/token
router.use(protect);

router.route('/')
  .get(getAppliances)
  .post(createAppliance);

router.route('/:id')
  .get(getApplianceById)
  .put(updateAppliance)
  .delete(deleteAppliance);

router.patch('/:id/toggle', toggleAppliance);

export default router;

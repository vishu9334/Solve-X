import { Router } from "express";
import QNGController from '../controllers/QNG.controller.js'


const router = Router();

router.post(
  "/attempts/:attemptId/generate",
  QNGController
);

export default router;
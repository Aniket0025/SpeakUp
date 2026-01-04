import { Router } from "express";
import { me } from "../controller/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/me", authenticate, me);

export default router;

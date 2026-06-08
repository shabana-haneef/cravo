import { Router } from "express";

import authRoutes from "../../modules/auth/routes/auth.routes.js";
import userRoutes from "../../modules/users/routes/user.routes.js";
import addressRoutes from "../../modules/users/routes/address.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users/addresses", addressRoutes);
router.use("/users", userRoutes);

export default router;
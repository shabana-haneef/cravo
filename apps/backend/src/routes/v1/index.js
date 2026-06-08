import { Router } from "express";

import authRoutes from "../../modules/auth/routes/auth.routes.js";
import userRoutes from "../../modules/users/routes/user.routes.js";
import addressRoutes from "../../modules/users/routes/address.routes.js";
import sellerRoutes from "../../modules/sellers/routes/seller.routes.js";
import adminRoutes from "../../modules/admin/routes/admin.routes.js";
import shopRoutes from "../../modules/shops/routes/shop.routes.js";
import categoryRoutes from "../../modules/products/routes/category.routes.js";
import productRoutes from "../../modules/products/routes/product.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users/addresses", addressRoutes);
router.use("/users", userRoutes);
router.use("/sellers", sellerRoutes);
router.use("/admin", adminRoutes);
router.use("/shops", shopRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);

export default router;
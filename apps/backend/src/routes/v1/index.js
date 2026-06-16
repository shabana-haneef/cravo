import { Router } from "express";

import authRoutes from "../../modules/auth/routes/auth.routes.js";
import userRoutes from "../../modules/users/routes/user.routes.js";
import addressRoutes from "../../modules/users/routes/address.routes.js";
import sellerRoutes from "../../modules/sellers/routes/seller.routes.js";
import adminRoutes from "../../modules/admin/routes/admin.routes.js";
import shopRoutes from "../../modules/shops/routes/shop.routes.js";
import categoryRoutes from "../../modules/categories/routes/category.routes.js";
import productRoutes from "../../modules/products/routes/product.routes.js";
import inventoryRoutes from "../../modules/inventory/routes/inventory.routes.js";
import cartRoutes from "../../modules/cart/routes/cart.routes.js";
import orderRoutes from "../../modules/orders/routes/order.routes.js";
import paymentRoutes from "../../modules/payments/routes/payment.routes.js";
import deliveryRoutes from "../../modules/delivery/routes/delivery.routes.js";
import wishlistRoutes from "../../modules/wishlist/routes/wishlist.routes.js";
import { adminAdRoutes, sellerAdRoutes, publicAdRoutes } from "../../modules/advertisements/routes/ad.routes.js";
import notificationRoutes from "../../modules/notifications/routes/notification.routes.js";

const router = Router();

// -------------------------------------------------------------
// USER / PUBLIC ROUTES
// -------------------------------------------------------------
router.use("/auth", authRoutes);
router.use("/users/addresses", addressRoutes);
router.use("/users", userRoutes);
router.use("/sellers", sellerRoutes);
router.use("/wishlist", wishlistRoutes);

// Public Ads
router.use("/ads", publicAdRoutes);

// -------------------------------------------------------------
// ADMIN ROUTES
// -------------------------------------------------------------
router.use("/admin", adminRoutes);
router.use("/shops", shopRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/deliveries", deliveryRoutes);
router.use("/admin/ads", adminAdRoutes);
router.use("/sellers/ads", sellerAdRoutes);
router.use("/notifications", notificationRoutes);

export default router;
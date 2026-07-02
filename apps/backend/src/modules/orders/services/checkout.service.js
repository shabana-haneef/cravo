import { cartService } from '../../cart/services/cart.service.js';
import { orderRepository } from '../repositories/order.repository.js';
import { paymentRepository } from '../../payments/repositories/payment.repository.js';
import { razorpayService } from '../../payments/services/razorpay.service.js';
import { inventoryService } from '../../inventory/services/inventory.service.js';
import { addressRepository } from '../../users/repositories/address.repository.js';
import { orderSettingsService } from '../../admin/services/orderSettings.service.js';
import { deliverySettingsService } from '../../admin/services/deliverySettings.service.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/services/logger.js';
import prisma from '../../../lib/prisma.js';


function generateOrderNumber() {
  const year = new Date().getFullYear();
  const randomStr = Math.floor(100000 + Math.random() * 900000).toString();
  return `CRV-${year}-${randomStr}`;
}

export const checkoutService = {
  async getPreview(userId, buyNowParams = {}) {
    let cart;
    if (buyNowParams.buyNow) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: buyNowParams.variantId },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
              category: true,
              shop: true
            }
          }
        }
      });
      if (!variant || !variant.isActive || variant.product.status !== 'APPROVED') {
        throw new AppError("Product variant not available", 400);
      }
      const subtotal = variant.price * buyNowParams.quantity;
      const imageUrl = variant.product.images?.[0]?.imageUrl || null;
      cart = {
        id: 'buy-now-mock-cart',
        shopId: variant.product.shopId,
        shop: { name: variant.product.shop.name, slug: variant.product.shop.slug },
        items: [
          {
            id: 'buy-now-mock-item',
            productId: variant.productId,
            variantId: variant.id,
            productSlug: variant.product.slug,
            productName: variant.product.name,
            variantName: variant.name,
            imageUrl,
            quantity: buyNowParams.quantity,
            unitPrice: variant.price,
            totalPrice: subtotal
          }
        ],
        summary: {
          subtotal,
          totalItems: buyNowParams.quantity,
          estimatedTotal: subtotal
        }
      };
    } else {
      cart = await cartService.getCart(userId);
      if (!cart || cart.items.length === 0) {
        throw new AppError("Cart is empty", 400);
      }
    }

    const deliverySettings = await deliverySettingsService.get();
    if (!deliverySettings.enableDeliveryOrders) {
      throw new AppError("Delivery orders are currently disabled.", 400);
    }

    const subtotal = cart.summary.subtotal;
    let deliveryCharge = 0;
    if (deliverySettings.enableDeliveryCharges) {
      if (subtotal >= deliverySettings.freeDeliveryThreshold) {
        deliveryCharge = 0;
      } else {
        deliveryCharge = deliverySettings.defaultDeliveryCharge;
      }
    }
    const discount = 0;
    const grandTotal = subtotal + deliveryCharge - discount;

    return {
      cart,
      deliveryEstimate: {
        charge: deliveryCharge,
        currency: 'INR'
      },
      summary: {
        subtotal,
        deliveryCharge,
        discount,
        grandTotal
      }
    };
  },

  async processCheckout(userId, addressId, buyNowParams = {}) {
    const settings = await orderSettingsService.get();

    // 1. User Status & Protection Rules
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError("User account not found", 404);
    }

    if (settings.blockSuspendedUsers && user.status === 'SUSPENDED') {
      throw new AppError("Your account is suspended. Ordering is disabled.", 403);
    }

    if (settings.requireVerifiedEmail && !user.isEmailVerified) {
      throw new AppError("A verified email address is required to place orders.", 403);
    }

    if (!settings.allowGuestOrders && user.role === 'GUEST') {
      throw new AppError("Guest checkout is disabled. Please register or login to place orders.", 403);
    }

    const deliverySettings = await deliverySettingsService.get();
    if (!deliverySettings.enableDeliveryOrders) {
      throw new AppError("Delivery orders are currently disabled.", 400);
    }

    let cart;
    if (buyNowParams.buyNow) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: buyNowParams.variantId },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
              category: true,
              shop: true
            }
          }
        }
      });
      if (!variant || !variant.isActive || variant.product.status !== 'APPROVED') {
        throw new AppError("Product variant not available", 400);
      }
      const subtotal = variant.price * buyNowParams.quantity;
      const imageUrl = variant.product.images?.[0]?.imageUrl || null;
      cart = {
        id: 'buy-now-mock-cart',
        shopId: variant.product.shopId,
        shop: { name: variant.product.shop.name, slug: variant.product.shop.slug },
        items: [
          {
            id: 'buy-now-mock-item',
            productId: variant.productId,
            variantId: variant.id,
            productSlug: variant.product.slug,
            productName: variant.product.name,
            variantName: variant.name,
            imageUrl,
            quantity: buyNowParams.quantity,
            unitPrice: variant.price,
            totalPrice: subtotal
          }
        ],
        summary: {
          subtotal,
          totalItems: buyNowParams.quantity,
          estimatedTotal: subtotal
        }
      };
    } else {
      cart = await cartService.getCart(userId);
      if (!cart || cart.items.length === 0) {
        throw new AppError("Cart is empty", 400);
      }
    }

    const address = await addressRepository.findByIdAndUserId(addressId, userId);
    if (settings.requireActiveAddress && !address) {
      throw new AppError("An active, verified delivery address is required to place orders.", 400);
    }
    if (!address) {
      throw new AppError("Invalid delivery address", 400);
    }

    if (deliverySettings.requireVerifiedAddress && (!address.phone || address.phone.length < 10)) {
      throw new AppError("A verified address with a valid phone number is required.", 400);
    }

    if (deliverySettings.requireDefaultAddress && !address.isDefault) {
      throw new AppError("Delivery is restricted to your default address.", 400);
    }

    if (deliverySettings.restrictOutsideKerala && !deliverySettings.allowFutureStateExpansion) {
      if (!address.state || address.state.trim().toLowerCase() !== 'kerala') {
        throw new AppError("Delivery outside Kerala is blocked.", 400);
      }
    }

    const subtotal = cart.summary.subtotal;
    let deliveryCharge = 0;
    if (deliverySettings.enableDeliveryCharges) {
      if (subtotal >= deliverySettings.freeDeliveryThreshold) {
        deliveryCharge = 0;
      } else {
        deliveryCharge = deliverySettings.defaultDeliveryCharge;
      }
    }
    const discount = 0;
    const grandTotal = subtotal + deliveryCharge - discount;

    // 2. Order Value Limits Checks
    if (grandTotal < settings.minOrderValue) {
      throw new AppError(`Order total must be at least ₹${settings.minOrderValue}`, 400);
    }
    if (grandTotal > settings.maxOrderValue) {
      throw new AppError(`Order total cannot exceed ₹${settings.maxOrderValue}`, 400);
    }

    // 3. Items Count & Quantities Limits Checks
    const totalItemsCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItemsCount > settings.maxItemsPerOrder) {
      throw new AppError(`Maximum items count allowed per order is ${settings.maxItemsPerOrder}`, 400);
    }

    for (const item of cart.items) {
      if (item.quantity > settings.maxQtyPerProduct) {
        throw new AppError(`Maximum quantity allowed per product is ${settings.maxQtyPerProduct}`, 400);
      }
    }

    const orderNumber = generateOrderNumber();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Reserve Stock for all items
      for (const item of cart.items) {
        const inventory = await tx.inventory.findUnique({
          where: { productVariantId: item.variantId }
        });
        if (!inventory || inventory.availableStock < item.quantity) {
          throw new AppError(`Item ${item.variantName} is out of stock`, 400);
        }

        const newAvailable = inventory.availableStock - item.quantity;
        const newReserved = inventory.reservedStock + item.quantity;

        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            availableStock: newAvailable,
            reservedStock: newReserved
          }
        });

        await tx.inventoryTransaction.create({
          data: {
            inventoryId: inventory.id,
            type: 'ORDER_RESERVED',
            quantity: item.quantity,
            previousStock: inventory.availableStock,
            newStock: newAvailable,
            reason: `Reserved for order ${orderNumber}`,
            createdBy: userId
          }
        });
      }

      // 2. Create Order
      const order = await orderRepository.create({
        orderNumber,
        customerId: userId,
        shopId: cart.shopId,
        addressId,
        subtotal,
        deliveryCharge,
        discount,
        grandTotal,
        status: 'PENDING_PAYMENT',
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            productVariantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }))
        }
      }, tx);

      // 3. Clear Cart (ONLY if it's NOT a buyNow checkout!)
      if (!buyNowParams.buyNow) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.cart.update({ where: { id: cart.id }, data: { shopId: null } });
      }

      // 4. Create Razorpay Order
      let rzpOrder;
      try {
        rzpOrder = await razorpayService.createOrder(grandTotal, order.id);
      } catch (err) {
        throw new AppError("Payment gateway unavailable. Please try again later.", 500);
      }

      // 5. Create Payment Record
      const payment = await paymentRepository.create({
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        amount: grandTotal,
        status: 'PENDING'
      }, tx);

      logger.info({ userId, orderId: order.id }, 'Order initialized and stock reserved');

      const shop = await tx.shop.findUnique({
        where: { id: cart.shopId },
        select: { seller: { select: { userId: true } } }
      });

      return {
        order,
        payment: {
          razorpayOrderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID
        },
        sellerUserId: shop?.seller?.userId
      };
    });

    if (result.sellerUserId) {
      import('../../notifications/services/notification.service.js').then(({ notificationService }) => {
        notificationService.createAndEmit(
          result.sellerUserId,
          'ORDER_PLACED',
          'New Order Initiated 🛍️',
          `Order #${result.order.orderNumber} has been initiated (Pending Payment).`,
          { orderId: result.order.id, orderNumber: result.order.orderNumber }
        ).catch(() => {});
      });
    }

    delete result.sellerUserId;
    return result;
  }
};

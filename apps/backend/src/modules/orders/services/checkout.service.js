import { userRepository } from '../../users/repositories/user.repository.js';
import { shopRepository } from '../../shops/repositories/shop.repository.js';
import { productVariantRepository } from '../../products/repositories/productVariant.repository.js';
import { cartService } from '../../cart/services/cart.service.js';
import { orderRepository } from '../repositories/order.repository.js';
import { paymentRepository } from '../../payments/repositories/payment.repository.js';
import { razorpayService } from '../../payments/services/razorpay.service.js';
import { inventoryService } from '../../inventory/services/inventory.service.js';
import { addressRepository } from '../../users/repositories/address.repository.js';
import { orderSettingsService } from '../../admin/services/orderSettings.service.js';
import { deliverySettingsService } from '../../admin/services/deliverySettings.service.js';
import { delhiveryService } from '../../delivery/services/delhiveryService.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/services/logger.js';
import prisma from '../../../lib/prisma.js';

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const randomStr = Math.floor(100000 + Math.random() * 900000).toString();
  return `CRV-${year}-${randomStr}`;
}

// ---------------------------------------------------------
// PRIVATE HELPER METHODS
// ---------------------------------------------------------

async function _validateUser(userId, settings) {
  const user = await userRepository.findById(userId);

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
  return user;
}

async function _resolveCart(userId, buyNowParams) {
  let cart;
  if (buyNowParams.buyNow) {
    const variant = await productVariantRepository.findByIdWithFullProductDetails(buyNowParams.variantId);
    if (!variant || !variant.isActive || variant.product.status !== 'APPROVED') {
      throw new AppError("Product variant not available", 400);
    }
    const pricePaise = Math.round(variant.price * 100);
    const subtotalPaise = pricePaise * buyNowParams.quantity;
    const subtotal = subtotalPaise / 100;
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
          totalPrice: subtotal,
          weightGrams: variant.weight || 500
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
  return cart;
}

async function _validateAddress(userId, addressId, settings, deliverySettings) {
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

  return address;
}

async function _calculateShipping(cart, address, deliverySettings) {
  const subtotal = cart.summary.subtotal;
  let deliveryCharge = 0;

  if (deliverySettings.enableDeliveryCharges) {
    if (subtotal >= deliverySettings.freeDeliveryThreshold) {
      deliveryCharge = 0;
    } else if (address && address.postalCode) {
      const destPincode = address.postalCode;
      
      const shop = await shopRepository.findByIdWithSeller(cart.shopId);
      
      const originPincode = shop?.seller?.pickupPincode || '682001';
      
      const totalWeightGrams = cart.items.reduce((sum, item) => {
        const itemWeight = item.weightGrams || 500;
        return sum + (itemWeight * item.quantity);
      }, 0);

      deliveryCharge = await delhiveryService.calculateShippingCharge(
        originPincode,
        destPincode,
        totalWeightGrams,
        deliverySettings.defaultDeliveryCharge
      );
    } else if (!address) {
      deliveryCharge = null; 
    }
  }
  return deliveryCharge;
}

async function _validateOrderLimits(userId, cart, grandTotal, settings) {
  if (grandTotal < settings.minOrderValue) {
    throw new AppError(`Order total must be at least ₹${settings.minOrderValue}`, 400);
  }
  if (grandTotal > settings.maxOrderValue) {
    throw new AppError(`Order total cannot exceed ₹${settings.maxOrderValue}`, 400);
  }

  const totalItemsCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalItemsCount > settings.maxItemsPerOrder) {
    throw new AppError(`Maximum items count allowed per order is ${settings.maxItemsPerOrder}`, 400);
  }

  // Calculate Cumulative 24-Hour Purchase History
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recentPurchases = await prisma.orderItem.groupBy({
    by: ['productVariantId'],
    where: {
      order: {
        customerId: userId,
        createdAt: { gte: twentyFourHoursAgo },
        status: { notIn: ['CANCELLED', 'FAILED'] }
      },
      productVariantId: { in: cart.items.map(i => i.productVariantId) }
    },
    _sum: {
      quantity: true
    }
  });

  const purchasedMap = recentPurchases.reduce((acc, curr) => {
    acc[curr.productVariantId] = curr._sum.quantity || 0;
    return acc;
  }, {});

  for (const item of cart.items) {
    const historicalQty = purchasedMap[item.productVariantId] || 0;
    const remainingAllowance = settings.maxQtyPerProduct - historicalQty;
    
    if (item.quantity > remainingAllowance) {
      if (remainingAllowance <= 0) {
        throw new AppError(`You have reached the daily limit of ${settings.maxQtyPerProduct} for ${item.variantName || 'this item'}`, 400);
      }
      throw new AppError(`You can only purchase ${remainingAllowance} more of ${item.variantName || 'this item'} today`, 400);
    }
  }
}

async function _reserveInventory(tx, cartItems, orderNumber, userId) {
  for (const item of cartItems) {
    const inventory = await tx.inventory.findUnique({
      where: { productVariantId: item.variantId }
    });
    if (!inventory || inventory.availableStock < item.quantity) {
      throw new AppError(`Item ${item.variantName} is out of stock`, 400);
    }

    const newAvailable = inventory.availableStock - item.quantity;
    const newReserved = inventory.reservedStock + item.quantity;

    // ATOMIC CHECK-AND-SET using database native math
    const updateResult = await tx.inventory.updateMany({
      where: { 
        id: inventory.id,
        availableStock: { gte: item.quantity }
      },
      data: {
        availableStock: { decrement: item.quantity },
        reservedStock: { increment: item.quantity }
      }
    });

    if (updateResult.count === 0) {
      throw new AppError(`High demand! Stock for ${item.variantName} changed during checkout. Please try again.`, 409);
    }

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
}

async function _createOrderRecord(tx, cart, subtotal, deliveryCharge, discount, grandTotal, addressId, orderNumber, userId) {
  return orderRepository.create({
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
}

async function _clearCartIfApplicable(tx, cart, buyNowParams) {
  if (!buyNowParams.buyNow) {
    const itemIdsToDelete = cart.items.map(i => i.id);
    await tx.cartItem.deleteMany({ 
      where: { 
        cartId: cart.id,
        id: { in: itemIdsToDelete }
      } 
    });
    
    const remainingItems = await tx.cartItem.count({ where: { cartId: cart.id } });
    if (remainingItems === 0) {
      await tx.cart.update({ where: { id: cart.id }, data: { shopId: null } });
    }
  }
}

async function _initializePayment(tx, orderId, grandTotal) {
  let rzpOrder;
  try {
    rzpOrder = await razorpayService.createOrder(grandTotal, orderId);
  } catch (err) {
    throw new AppError("Payment gateway unavailable. Please try again later.", 500);
  }

  const payment = await paymentRepository.create({
    orderId: orderId,
    razorpayOrderId: rzpOrder.id,
    amount: grandTotal,
    status: 'PENDING'
  }, tx);

  return { rzpOrder, payment };
}

function _sendNotifications(sellerUserId, order) {
  if (sellerUserId) {
    import('../../notifications/services/notification.service.js').then(({ notificationService }) => {
      notificationService.createAndEmit(
        sellerUserId,
        'ORDER_PLACED',
        'New Order Initiated 🛍️',
        `Order #${order.orderNumber} has been initiated (Pending Payment).`,
        { orderId: order.id, orderNumber: order.orderNumber }
      ).catch(() => {});
    });
  }
}


// ---------------------------------------------------------
// PUBLIC EXPORTS
// ---------------------------------------------------------

export const checkoutService = {
  async getPreview(userId, buyNowParams = {}, addressId = null, unselectedItemIds = []) {
    let cart = await _resolveCart(userId, buyNowParams);
    
    if (!buyNowParams.buyNow && unselectedItemIds && unselectedItemIds.length > 0) {
      cart.items = cart.items.filter(item => !unselectedItemIds.includes(item.id));
      if (cart.items.length === 0) {
        throw new AppError("No items selected for checkout", 400);
      }
      
      const subtotalPaise = cart.items.reduce((sum, item) => sum + Math.round(item.totalPrice * 100), 0);
      const subtotal = subtotalPaise / 100;
      const totalItems = cart.items.length;
      cart.summary = {
        subtotal,
        totalItems,
        estimatedTotal: subtotal
      };
    }

    const deliverySettings = await deliverySettingsService.get();
    if (!deliverySettings.enableDeliveryOrders) {
      throw new AppError("Delivery orders are currently disabled.", 400);
    }

    let address = null;
    if (addressId) {
      address = await addressRepository.findByIdAndUserId(addressId, userId);
    }

    const subtotal = cart.summary.subtotal;
    const deliveryCharge = await _calculateShipping(cart, address, deliverySettings);
    
    const discount = 0;
    
    const subtotalPaise = Math.round(subtotal * 100);
    const deliveryChargePaise = deliveryCharge ? Math.round(deliveryCharge * 100) : 0;
    const discountPaise = Math.round(discount * 100);
    
    // Strict Financial Safety Assertions
    if (discountPaise < 0) throw new AppError("Invalid discount applied", 400);
    if (discountPaise > subtotalPaise + deliveryChargePaise) throw new AppError("Discount cannot exceed order total", 400);

    const grandTotalPaise = subtotalPaise + deliveryChargePaise - discountPaise;
    
    if (grandTotalPaise < 0) throw new AppError("Order total cannot be negative", 400);
    if (!Number.isSafeInteger(grandTotalPaise)) throw new AppError("Mathematical overflow detected in cart totals", 400);
    
    const grandTotal = grandTotalPaise / 100;

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
    const deliverySettings = await deliverySettingsService.get();

    // 1. User Status & Protection Rules
    await _validateUser(userId, settings);

    if (!deliverySettings.enableDeliveryOrders) {
      throw new AppError("Delivery orders are currently disabled.", 400);
    }

    // 2. Resolve Cart
    const cart = await _resolveCart(userId, buyNowParams);

    // 3. Resolve Address
    const address = await _validateAddress(userId, addressId, settings, deliverySettings);

    // 4. Calculate Shipping
    const deliveryCharge = await _calculateShipping(cart, address, deliverySettings);
    
    const subtotal = cart.summary.subtotal;
    const discount = 0;
    const subtotalPaise = Math.round(subtotal * 100);
    const deliveryChargePaise = deliveryCharge ? Math.round(deliveryCharge * 100) : 0;
    const discountPaise = Math.round(discount * 100);
    
    // Strict Financial Safety Assertions
    if (discountPaise < 0) throw new AppError("Invalid discount applied", 400);
    if (discountPaise > subtotalPaise + deliveryChargePaise) throw new AppError("Discount cannot exceed order total", 400);

    const grandTotalPaise = subtotalPaise + deliveryChargePaise - discountPaise;
    
    // Gateway Requirement: Razorpay minimum is 1 INR (100 paise)
    if (grandTotalPaise < 100) throw new AppError("Order total must be at least ₹1", 400);
    if (!Number.isSafeInteger(grandTotalPaise)) throw new AppError("Mathematical overflow detected in cart totals", 400);
    
    const grandTotal = grandTotalPaise / 100;

    // 5. Order Value Limits Checks
    await _validateOrderLimits(userId, cart, grandTotal, settings);

    const orderNumber = generateOrderNumber();

    const result = await prisma.$transaction(async (tx) => {
      // 6. Reserve Stock
      await _reserveInventory(tx, cart.items, orderNumber, userId);

      // 7. Create Order
      const order = await _createOrderRecord(tx, cart, subtotal, deliveryCharge, discount, grandTotal, addressId, orderNumber, userId);

      // 8. Clear Cart
      await _clearCartIfApplicable(tx, cart, buyNowParams);

      // 9. Create Razorpay Order & DB Payment Rec
      const { rzpOrder } = await _initializePayment(tx, order.id, grandTotal);

      logger.info({ userId, orderId: order.id }, 'Order initialized and stock reserved');

      const shop = await tx.shop.findUnique({
        where: { id: cart.shopId },
        select: { seller: { select: { userId: true } } }
      });

      return {
        order,
        rzpOrder,
        sellerUserId: shop?.seller?.userId
      };
    });

    // 10. Send Notifications
    _sendNotifications(result.sellerUserId, result.order);

    return {
      order: result.order,
      payment: {
        razorpayOrderId: result.rzpOrder.id,
        amount: result.rzpOrder.amount,
        currency: result.rzpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    };
  }
};

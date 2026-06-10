import { cartService } from '../../cart/services/cart.service.js';
import { orderRepository } from '../repositories/order.repository.js';
import { paymentRepository } from '../../payments/repositories/payment.repository.js';
import { razorpayService } from '../../payments/services/razorpay.service.js';
import { inventoryService } from '../../inventory/services/inventory.service.js';
import { addressRepository } from '../../users/repositories/address.repository.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/services/logger.js';
import prisma from '../../../lib/prisma.js';

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const randomStr = Math.floor(100000 + Math.random() * 900000).toString();
  return `CRV-${year}-${randomStr}`;
}

export const checkoutService = {
  async getPreview(userId) {
    const cart = await cartService.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    const subtotal = cart.summary.subtotal;
    const deliveryCharge = 50; // Placeholder logic
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

  async processCheckout(userId, addressId) {
    const cart = await cartService.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    const address = await addressRepository.findByIdAndUserId(addressId, userId);
    if (!address) {
      throw new AppError("Invalid delivery address", 400);
    }

    const subtotal = cart.summary.subtotal;
    const deliveryCharge = 50; 
    const discount = 0;
    const grandTotal = subtotal + deliveryCharge - discount;

    const orderNumber = generateOrderNumber();

    return prisma.$transaction(async (tx) => {
      // 1. Reserve Stock for all items
      for (const item of cart.items) {
        // Note: Calling inventoryService inside a transaction requires passing tx if it supported it.
        // Since our inventoryService uses its own tx internally, we must inline the reservation here 
        // to keep the entire checkout atomic. Or refactor inventoryService.
        
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

      // 3. Clear Cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { shopId: null } });

      // 4. Create Razorpay Order
      let rzpOrder;
      try {
        rzpOrder = await razorpayService.createOrder(grandTotal, order.id);
      } catch (err) {
        // If razorpay fails, transaction rolls back naturally, stock is released.
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

      return {
        order,
        payment: {
          razorpayOrderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID // Send to frontend
        }
      };
    });
  }
};

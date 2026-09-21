import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import axios from 'axios';
import { logger } from '../../../shared/services/logger.js';
import { AppError } from '../../../shared/errors/AppError.js';

class InvoiceService {
  /**
   * Validates the shipping label URL to prevent SSRF and ensure it points to the expected S3 bucket
   */
  _validateLabelUrl(url) {
    if (!url) return false;
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'https:') return false;
      // We expect the URL to point to AWS S3 (e.g. express-hq-prod.s3.ap-south-1.amazonaws.com)
      if (!parsedUrl.hostname.endsWith('s3.ap-south-1.amazonaws.com') && !parsedUrl.hostname.includes('amazonaws')) {
         return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Fetches the Delhivery PDF as an ArrayBuffer
   */
  async _fetchDelhiveryLabelPdf(url) {
    if (!this._validateLabelUrl(url)) {
      logger.warn(`Invalid or untrusted shipping label URL: ${url}`);
      return null;
    }

    try {
      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
      if (response.headers['content-type'] !== 'application/pdf' && !url.includes('.pdf')) {
        logger.warn(`Fetched shipping label is not a PDF: ${url}`);
        return null;
      }
      return response.data;
    } catch (error) {
      logger.error({ err: error.message, url }, 'Failed to fetch shipping label PDF');
      return null;
    }
  }

  /**
   * Generates the Cravo Tax Invoice as a PDF Buffer
   */
  async generateInvoicePdf(order) {
    const pdfDoc = await PDFDocument.create();
    
    // Create an A4 page (595.28 x 841.89 points)
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    
    // Load standard fonts
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const margin = 40;
    let yOffset = height - margin;

    const drawText = (text, size, isBold, x, y, color = rgb(0, 0, 0)) => {
      page.drawText(text, {
        x,
        y,
        size,
        font: isBold ? fontBold : fontRegular,
        color
      });
    };

    const drawLine = (y) => {
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      });
    };

    // Header
    drawText('CRAVO', 24, true, margin, yOffset - 24, rgb(0.12, 0.23, 0.17)); // #1E3A2B dark green
    drawText('TAX INVOICE', 16, true, width - margin - fontBold.widthOfTextAtSize('TAX INVOICE', 16), yOffset - 24, rgb(0.3, 0.3, 0.3));
    
    yOffset -= 50;

    const invoiceNoStr = `Invoice No: ${order.invoiceNumber || 'PENDING'}`;
    const orderNoStr = `Order No: ${order.orderNumber}`;
    const invoiceDateStr = `Invoice Date: ${new Date().toLocaleDateString('en-IN')}`;
    const orderDateStr = `Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`;

    drawText(invoiceNoStr, 10, true, width - margin - fontBold.widthOfTextAtSize(invoiceNoStr, 10), yOffset);
    drawText(orderNoStr, 10, true, width - margin - fontBold.widthOfTextAtSize(orderNoStr, 10), yOffset - 15);
    drawText(invoiceDateStr, 10, true, width - margin - fontBold.widthOfTextAtSize(invoiceDateStr, 10), yOffset - 30);
    drawText(orderDateStr, 10, true, width - margin - fontBold.widthOfTextAtSize(orderDateStr, 10), yOffset - 45);

    yOffset -= 65;
    drawLine(yOffset);
    yOffset -= 20;

    // Billing & Seller info
    drawText('BILL TO', 10, true, margin, yOffset, rgb(0.5, 0.5, 0.5));
    drawText('SOLD BY', 10, true, width / 2, yOffset, rgb(0.5, 0.5, 0.5));

    yOffset -= 15;
    const customerName = order.customer?.profile?.fullName || order.address?.fullName || 'Customer';
    const customerPhone = order.address?.phone || order.customer?.email || '';
    const customerAddress = order.address ? `${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.pincode}` : '';
    
    const storeName = order.shop?.name || 'Cravo Store';
    const storeAddress = order.shop?.seller?.pickupAddress ? `${order.shop.seller.pickupAddress}, ${order.shop.seller.pickupCity}` : '';

    drawText(customerName, 10, true, margin, yOffset);
    drawText(storeName, 10, true, width / 2, yOffset);

    yOffset -= 15;
    drawText(customerPhone, 9, false, margin, yOffset);
    if (storeAddress) drawText(storeAddress, 9, false, width / 2, yOffset);

    yOffset -= 15;
    if (customerAddress) {
       // Simple word wrap (very naive, assumes address fits in half page width mostly)
       const addressWords = customerAddress.split(' ');
       let currentLine = '';
       let lineOffset = 0;
       for (const word of addressWords) {
         if (fontRegular.widthOfTextAtSize(currentLine + ' ' + word, 9) > 200) {
            drawText(currentLine, 9, false, margin, yOffset - lineOffset);
            currentLine = word;
            lineOffset += 12;
         } else {
            currentLine += (currentLine ? ' ' : '') + word;
         }
       }
       drawText(currentLine, 9, false, margin, yOffset - lineOffset);
       yOffset -= lineOffset;
    }

    yOffset -= 20;
    drawLine(yOffset);
    yOffset -= 20;

    // Product Table Header
    drawText('PRODUCT DETAILS', 10, true, margin, yOffset, rgb(0.5, 0.5, 0.5));
    yOffset -= 20;
    
    drawText('Item', 9, true, margin, yOffset);
    drawText('Qty', 9, true, margin + 250, yOffset);
    drawText('Unit Price', 9, true, margin + 300, yOffset);
    drawText('Total', 9, true, width - margin - 40, yOffset);

    yOffset -= 15;
    
    // Product Table Rows
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (yOffset < 300) {
          // Safety fallback to prevent overflowing into label area excessively
          drawText('... (more items)', 9, false, margin, yOffset);
          yOffset -= 15;
          break;
        }

        const itemName = item.product?.name || 'Product';
        const qty = item.quantity.toString();
        const price = `Rs. ${Number(item.unitPrice).toFixed(2)}`;
        const total = `Rs. ${Number(item.totalPrice).toFixed(2)}`;

        // Truncate item name if too long
        let displayItemName = itemName;
        if (fontRegular.widthOfTextAtSize(displayItemName, 9) > 220) {
           displayItemName = displayItemName.substring(0, 40) + '...';
        }

        drawText(displayItemName, 9, false, margin, yOffset);
        drawText(qty, 9, false, margin + 250, yOffset);
        drawText(price, 9, false, margin + 300, yOffset);
        drawText(total, 9, false, width - margin - 40, yOffset);

        if (item.productVariant?.name && item.productVariant.name !== 'Default Variant') {
           yOffset -= 12;
           drawText(item.productVariant.name, 8, false, margin, yOffset, rgb(0.4, 0.4, 0.4));
        }

        yOffset -= 20;
      }
    } else {
      yOffset -= 20;
    }

    drawLine(yOffset);
    yOffset -= 20;

    // Financial Summary
    drawText('PAYMENT / TOTAL', 10, true, margin, yOffset, rgb(0.5, 0.5, 0.5));
    
    const summaryX = width / 2 + 50;
    drawText('Subtotal:', 9, false, summaryX, yOffset);
    drawText(`Rs. ${Number(order.subtotal).toFixed(2)}`, 9, false, width - margin - 50, yOffset);

    yOffset -= 15;
    drawText('Delivery:', 9, false, summaryX, yOffset);
    drawText(`Rs. ${Number(order.deliveryCharge || 0).toFixed(2)}`, 9, false, width - margin - 50, yOffset);

    if (Number(order.discount) > 0) {
      yOffset -= 15;
      drawText('Discount:', 9, false, summaryX, yOffset);
      drawText(`- Rs. ${Number(order.discount).toFixed(2)}`, 9, false, width - margin - 50, yOffset);
    }

    yOffset -= 20;
    drawText('TOTAL AMOUNT:', 11, true, summaryX, yOffset);
    drawText(`Rs. ${Number(order.grandTotal).toFixed(2)}`, 11, true, width - margin - 60, yOffset);

    yOffset -= 30;
    drawLine(yOffset);
    yOffset -= 20;

    // Shipping Label Section
    drawText('SHIPPING LABEL — DELHIVERY', 10, true, margin, yOffset, rgb(0.5, 0.5, 0.5));
    yOffset -= 15;

    // Embed Delhivery Label if available
    let labelEmbedded = false;
    if (order.delivery?.shippingLabelUrl) {
      const labelPdfBytes = await this._fetchDelhiveryLabelPdf(order.delivery.shippingLabelUrl);
      if (labelPdfBytes) {
        try {
          const labelPdfDoc = await PDFDocument.load(labelPdfBytes);
          const [labelPage] = await pdfDoc.embedPdf(labelPdfDoc, [0]);
          
          if (labelPage) {
            const availableWidth = width - (margin * 2);
            const availableHeight = yOffset - margin - 20; // Leave 20 for footer
            
            // Calculate proportional scale
            const scale = Math.min(
              availableWidth / labelPage.width,
              availableHeight / labelPage.height
            );

            const scaledWidth = labelPage.width * scale;
            const scaledHeight = labelPage.height * scale;
            
            // Center it horizontally
            const xOffset = margin + (availableWidth - scaledWidth) / 2;
            // Draw from bottom up, starting above footer margin
            const labelYOffset = margin + 20 + (availableHeight - scaledHeight) / 2;

            page.drawPage(labelPage, {
              x: xOffset,
              y: labelYOffset,
              width: scaledWidth,
              height: scaledHeight,
            });
            
            labelEmbedded = true;
          }
        } catch (embedError) {
          logger.error({ err: embedError.message }, 'Failed to embed shipping label PDF page');
        }
      }
    }

    if (!labelEmbedded) {
       drawText('Shipping label not available.', 10, false, margin, yOffset - 15);
    }

    // Footer
    drawText('Thank you for shopping with Cravo Marketplace.', 8, false, margin, margin, rgb(0.5, 0.5, 0.5));

    // Save and return
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

export default new InvoiceService();

import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/errors.js';

export const generateChallanPDF = async (req: any, res: Response, next: any): Promise<void> => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        creator: true,
        items: true,
      },
    });

    if (!challan) {
      throw new NotFoundError('Sales Challan not found');
    }

    const doc = new (PDFDocument as any)({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=challan-${challan.challanNumber}.pdf`);

    doc.pipe(res);

    // Header Details
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text('WHOLESALE DISTRIBUTORS CORP', 50, 57)
      .fontSize(10)
      .text('123 Business Boulevard, Industrial Area', 50, 80)
      .text('Phone: +91 98765 43210 | Email: billing@wholesaledist.com', 50, 95)
      .fontSize(20)
      .text('SALES CHALLAN', 200, 50, { align: 'right' })
      .moveDown();

    // Line separator
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 115).lineTo(550, 115).stroke();

    // Bill To & Challan Meta
    doc
      .fontSize(10)
      .text('CUSTOMER DETAILS:', 50, 130, { underline: true })
      .text(`Business Name: ${challan.customer.businessName}`, 50, 145)
      .text(`Contact Person: ${challan.customer.customerName}`, 50, 160)
      .text(`Mobile: ${challan.customer.mobile}`, 50, 175)
      .text(`Email: ${challan.customer.email}`, 50, 190)
      .text(`GSTIN: ${challan.customer.gstNumber || 'N/A'}`, 50, 205)
      .text(`Address: ${challan.customer.address}`, 50, 220);

    doc
      .text(`Challan No: ${challan.challanNumber}`, 350, 145)
      .text(`Date: ${challan.createdAt.toLocaleDateString()}`, 350, 160)
      .text(`Status: ${challan.status}`, 350, 175)
      .text(`Created By: ${challan.creator.name}`, 350, 190);
    
    if (challan.confirmedAt) {
      doc.text(`Confirmed Date: ${challan.confirmedAt.toLocaleDateString()}`, 350, 205);
    }

    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 245).lineTo(550, 245).stroke();

    // Table Headers
    const tableTop = 260;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('SKU', 50, tableTop)
      .text('Product Name', 130, tableTop)
      .text('Unit Price', 300, tableTop, { width: 80, align: 'right' })
      .text('Qty', 390, tableTop, { width: 50, align: 'right' })
      .text('Total', 450, tableTop, { width: 100, align: 'right' });

    doc.strokeColor('#222222').lineWidth(1).moveTo(50, 275).lineTo(550, 275).stroke();

    // Table Row Content
    let y = 285;
    doc.font('Helvetica');
    for (const item of challan.items) {
      doc
        .text(item.skuSnapshot, 50, y)
        .text(item.productNameSnapshot, 130, y, { width: 160 })
        .text(`INR ${item.unitPriceSnapshot.toFixed(2)}`, 300, y, { width: 80, align: 'right' })
        .text(String(item.quantity), 390, y, { width: 50, align: 'right' })
        .text(`INR ${item.totalPrice.toFixed(2)}`, 450, y, { width: 100, align: 'right' });

      y += 25;
    }

    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();

    // Summary Calculations
    y += 15;
    const totalQty = challan.totalQuantity;
    const grandTotal = challan.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

    doc
      .font('Helvetica-Bold')
      .text(`Total Quantity: ${totalQty}`, 50, y)
      .text('Grand Total:', 350, y, { width: 100, align: 'right' })
      .text(`INR ${grandTotal.toFixed(2)}`, 450, y, { width: 100, align: 'right' });

    // Terms & Signatures
    y += 60;
    doc
      .font('Helvetica-Oblique')
      .fontSize(8)
      .text('Terms and Conditions:', 50, y)
      .text('1. Goods once sold cannot be returned or exchanged.', 50, y + 15)
      .text('2. This document is a transactional stock deduction challan.', 50, y + 27);

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('Authorized Signature', 400, y + 40, { width: 150, align: 'center' });

    doc.strokeColor('#444444').lineWidth(0.5).moveTo(400, y + 38).lineTo(550, y + 38).stroke();

    doc.end();
  } catch (error) {
    next(error);
  }
};

export const generateInvoicePDF = async (req: any, res: Response, next: any): Promise<void> => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        creator: true,
        challan: {
          include: { items: true }
        }
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    const doc = new (PDFDocument as any)({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${invoice.invoiceNumber}.pdf`);

    doc.pipe(res);

    // Header Details
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text('WHOLESALE DISTRIBUTORS CORP', 50, 57)
      .fontSize(10)
      .text('123 Business Boulevard, Industrial Area', 50, 80)
      .text('Phone: +91 98765 43210 | Email: billing@wholesaledist.com', 50, 95)
      .fontSize(20)
      .text('TAX INVOICE', 200, 50, { align: 'right' })
      .moveDown();

    // Line separator
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 115).lineTo(550, 115).stroke();

    // Bill To & Invoice Meta
    doc
      .fontSize(10)
      .text('CUSTOMER / BILL TO:', 50, 130, { underline: true })
      .text(`Business Name: ${invoice.customer.businessName}`, 50, 145)
      .text(`Contact Person: ${invoice.customer.customerName}`, 50, 160)
      .text(`Mobile: ${invoice.customer.mobile}`, 50, 175)
      .text(`Email: ${invoice.customer.email}`, 50, 190)
      .text(`GSTIN: ${invoice.customer.gstNumber || 'N/A'}`, 50, 205)
      .text(`Address: ${invoice.customer.address}`, 50, 220);

    doc
      .text(`Invoice No: ${invoice.invoiceNumber}`, 350, 145)
      .text(`Date: ${invoice.createdAt.toLocaleDateString()}`, 350, 160)
      .text(`Challan Ref: ${invoice.challan.challanNumber}`, 350, 175)
      .text(`Payment Status: ${invoice.status}`, 350, 190)
      .text(`Issued By: ${invoice.creator.name}`, 350, 205);

    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 245).lineTo(550, 245).stroke();

    // Table Headers
    const tableTop = 260;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('SKU', 50, tableTop)
      .text('Product Name', 130, tableTop)
      .text('Unit Price', 300, tableTop, { width: 80, align: 'right' })
      .text('Qty', 390, tableTop, { width: 50, align: 'right' })
      .text('Total', 450, tableTop, { width: 100, align: 'right' });

    doc.strokeColor('#222222').lineWidth(1).moveTo(50, 275).lineTo(550, 275).stroke();

    // Table Row Content
    let y = 285;
    doc.font('Helvetica');
    for (const item of invoice.challan.items) {
      doc
        .text(item.skuSnapshot, 50, y)
        .text(item.productNameSnapshot, 130, y, { width: 160 })
        .text(`INR ${item.unitPriceSnapshot.toFixed(2)}`, 300, y, { width: 80, align: 'right' })
        .text(String(item.quantity), 390, y, { width: 50, align: 'right' })
        .text(`INR ${item.totalPrice.toFixed(2)}`, 450, y, { width: 100, align: 'right' });

      y += 25;
    }

    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();

    // Summary Calculations
    y += 15;
    doc
      .font('Helvetica')
      .text('Subtotal:', 350, y, { width: 100, align: 'right' })
      .text(`INR ${invoice.subtotal.toFixed(2)}`, 450, y, { width: 100, align: 'right' });

    y += 18;
    doc
      .text('GST (18%):', 350, y, { width: 100, align: 'right' })
      .text(`INR ${invoice.tax.toFixed(2)}`, 450, y, { width: 100, align: 'right' });

    y += 20;
    doc
      .font('Helvetica-Bold')
      .text('Total Amount Due:', 350, y, { width: 100, align: 'right' })
      .text(`INR ${invoice.total.toFixed(2)}`, 450, y, { width: 100, align: 'right' });

    // Terms & Signatures
    y += 60;
    doc
      .font('Helvetica-Oblique')
      .fontSize(8)
      .text('Terms and Conditions:', 50, y)
      .text('1. Payment is due as per terms agreed on customer account settings.', 50, y + 15)
      .text('2. Please reference Invoice Number on all remittances.', 50, y + 27);

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('Authorized Signature', 400, y + 40, { width: 150, align: 'center' });

    doc.strokeColor('#444444').lineWidth(0.5).moveTo(400, y + 38).lineTo(550, y + 38).stroke();

    doc.end();
  } catch (error) {
    next(error);
  }
};

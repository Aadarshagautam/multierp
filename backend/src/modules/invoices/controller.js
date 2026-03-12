import Invoice from "../../shared/invoices/model.js";
import UserModel from "../../core/models/User.js";
import PDFDocument from "pdfkit";
import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";
import {
  PAYMENT_METHOD_LABELS,
  TAX_REGISTRATION_LABEL,
  formatCurrencyNpr,
  formatDateNepal,
} from "../../core/utils/nepal.js";
import {
  buildInvoiceStatusState,
  calculateInvoiceTotals,
  getNextInvoiceNumber as reserveNextInvoiceNumber,
  peekNextInvoiceNumber as previewNextInvoiceNumber,
} from "../../shared/billing/index.js";
import { buildTenantFilter, mergeTenantFilter } from "../../core/utils/tenant.js";
import { hydrateInvoiceItemsWithProducts } from "../../shared/products/service.js";
import { sharedCustomerService } from "../../shared/customers/service.js";
import { sharedAccountingService } from "../../shared/accounting/index.js";
import { buildAuditChanges, logAudit } from "../../core/utils/auditLogger.js";

const formatMoney = (value) => `NPR ${formatCurrencyNpr(value)}`;

export const getInvoices = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, startDate, endDate } = req.query;

    const filter = buildTenantFilter(req);
    if (status && status !== "all") filter.status = status;
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, { data: invoices });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findOne(mergeTenantFilter(req, { _id: id }));
    if (!invoice) {
      return sendError(res, { status: 404, message: "Invoice not found" });
    }
    return sendSuccess(res, { data: invoice });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const getInvoiceStats = async (req, res) => {
  try {
    const filter = buildTenantFilter(req);
    const invoices = await Invoice.find(filter);

    const stats = {
      totalInvoices: invoices.length,
      totalRevenue: 0,
      paidCount: 0,
      unpaidCount: 0,
      overdueCount: 0,
      draftCount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
    };

    invoices.forEach((inv) => {
      stats.totalRevenue += inv.grandTotal;
      if (inv.status === "paid") {
        stats.paidCount++;
        stats.paidAmount += inv.grandTotal;
      } else if (inv.status === "overdue") {
        stats.overdueCount++;
        stats.unpaidAmount += inv.grandTotal;
      } else if (inv.status === "draft") {
        stats.draftCount++;
      } else if (inv.status === "sent") {
        stats.unpaidCount++;
        stats.unpaidAmount += inv.grandTotal;
      }
    });

    return sendSuccess(res, { data: stats });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const getNextInvoiceNumber = async (req, res) => {
  try {
    const userId = req.userId;
    const numbering = await previewNextInvoiceNumber(
      { orgId: req.orgId, userId },
      {}
    );

    return sendSuccess(res, { data: { invoiceNumber: numbering.invoiceNumber } });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const userId = req.userId;
    const ownerFilter = buildTenantFilter(req);
    const {
      customerId, items, overallDiscountType, overallDiscountValue,
      withoutVat, vatDiscountMode, dueDate, paymentMethod, notes, status,
    } = req.validated?.body ?? req.body;

    const customer = await sharedCustomerService.getById(customerId, req, {
      branchMode: "all",
    });
    if (!customer) {
      return sendError(res, { status: 404, message: "Customer not found" });
    }
    const customerSnapshot = sharedCustomerService.buildSnapshot(customer);

    const numbering = await reserveNextInvoiceNumber(
      { orgId: req.orgId, userId },
      {}
    );
    const hydratedItems = await hydrateInvoiceItemsWithProducts(items, req);
    const totals = calculateInvoiceTotals({
      items: hydratedItems,
      overallDiscountType: overallDiscountType || "none",
      overallDiscountValue: overallDiscountValue || 0,
      withoutVat: withoutVat || false,
      vatDiscountMode: vatDiscountMode || "after_vat_no_prorate",
    });
    const invoiceStatus = buildInvoiceStatusState({
      status: status || "draft",
    });

    const invoice = new Invoice({
      userId,
      orgId: req.orgId,
      invoiceNumber: numbering.invoiceNumber,
      customerId: customerSnapshot.customerId,
      customerName: customerSnapshot.customerName,
      customerEmail: customerSnapshot.customerEmail,
      customerPhone: customerSnapshot.customerPhone,
      customerAddress: customerSnapshot.customerAddress,
      customerGstin: customerSnapshot.customerGstin,
      items: totals.items,
      subtotal: totals.subtotal,
      totalVat: totals.totalVat,
      totalItemDiscount: totals.totalItemDiscount,
      overallDiscountType: totals.overallDiscountType,
      overallDiscountValue: totals.overallDiscountValue,
      overallDiscountAmount: totals.overallDiscountAmount,
      grandTotal: totals.grandTotal,
      withoutVat: totals.withoutVat,
      vatDiscountMode: totals.vatDiscountMode,
      status: invoiceStatus.status,
      issueDate: new Date(),
      dueDate: new Date(dueDate),
      paidDate: invoiceStatus.paidDate,
      paymentMethod: paymentMethod || "cash",
      notes: notes || "",
    });

    await invoice.save();
    await sharedAccountingService.syncInvoice(invoice, req);
    await logAudit(
      {
        action: "create",
        module: "invoices",
        targetId: invoice._id,
        targetName: invoice.invoiceNumber,
        description: `Created invoice ${invoice.invoiceNumber}`,
        metadata: {
          status: invoice.status,
          grandTotal: invoice.grandTotal,
          customerName: invoice.customerName,
        },
      },
      req
    );
    return sendCreated(res, invoice, "Invoice created");
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerFilter = buildTenantFilter(req);
    const {
      customerId, items, overallDiscountType, overallDiscountValue,
      withoutVat, vatDiscountMode, dueDate, paymentMethod, notes, status,
    } = req.validated?.body ?? req.body;

    const invoice = await Invoice.findOne({ _id: id, ...ownerFilter });
    if (!invoice) {
      return sendError(res, { status: 404, message: "Invoice not found" });
    }
    const invoiceSnapshot = invoice.toObject();

    const shouldRecalculate = Boolean(
      items ||
      overallDiscountType !== undefined ||
      overallDiscountValue !== undefined ||
      withoutVat !== undefined ||
      vatDiscountMode !== undefined
    );

    if (shouldRecalculate) {
      const hydratedItems = items
        ? await hydrateInvoiceItemsWithProducts(items, req)
        : invoice.items;
      const totals = calculateInvoiceTotals({
        items: hydratedItems,
        overallDiscountType: overallDiscountType || invoice.overallDiscountType,
        overallDiscountValue:
          overallDiscountValue !== undefined
            ? overallDiscountValue
            : invoice.overallDiscountValue,
        withoutVat: withoutVat !== undefined ? withoutVat : invoice.withoutVat,
        vatDiscountMode: vatDiscountMode || invoice.vatDiscountMode,
      });

      invoice.items = totals.items;
      invoice.subtotal = totals.subtotal;
      invoice.totalVat = totals.totalVat;
      invoice.totalItemDiscount = totals.totalItemDiscount;
      invoice.overallDiscountType = totals.overallDiscountType;
      invoice.overallDiscountValue = totals.overallDiscountValue;
      invoice.overallDiscountAmount = totals.overallDiscountAmount;
      invoice.grandTotal = totals.grandTotal;
      invoice.withoutVat = totals.withoutVat;
      invoice.vatDiscountMode = totals.vatDiscountMode;
    }

    if (customerId) {
      const customer = await sharedCustomerService.getById(customerId, req, {
        branchMode: "all",
      });
      if (!customer) {
        return sendError(res, { status: 404, message: "Customer not found" });
      }
      const customerSnapshot = sharedCustomerService.buildSnapshot(customer);

      invoice.customerId = customerSnapshot.customerId;
      invoice.customerName = customerSnapshot.customerName;
      invoice.customerEmail = customerSnapshot.customerEmail;
      invoice.customerPhone = customerSnapshot.customerPhone;
      invoice.customerAddress = customerSnapshot.customerAddress;
      invoice.customerGstin = customerSnapshot.customerGstin;
    }

    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (notes !== undefined) invoice.notes = notes;
    if (status) {
      const invoiceStatus = buildInvoiceStatusState({
        status,
        currentPaidDate: invoice.paidDate,
      });
      invoice.status = invoiceStatus.status;
      invoice.paidDate = invoiceStatus.paidDate;
    }

    await invoice.save();
    await sharedAccountingService.syncInvoice(invoice, req);
    await logAudit(
      {
        action: "update",
        module: "invoices",
        targetId: invoice._id,
        targetName: invoice.invoiceNumber,
        description: `Updated invoice ${invoice.invoiceNumber}`,
        changes: buildAuditChanges(invoiceSnapshot, invoice.toObject(), [
          "customerName",
          "customerPhone",
          "subtotal",
          "totalVat",
          "totalItemDiscount",
          "overallDiscountAmount",
          "grandTotal",
          "withoutVat",
          "vatDiscountMode",
          "status",
          "dueDate",
          "paymentMethod",
          "notes",
        ]),
        metadata: {
          itemCountBefore: Array.isArray(invoiceSnapshot.items) ? invoiceSnapshot.items.length : 0,
          itemCountAfter: Array.isArray(invoice.items) ? invoice.items.length : 0,
        },
      },
      req
    );
    return sendSuccess(res, { data: invoice, message: "Invoice updated" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.validated?.body ?? req.body;
    const ownerFilter = buildTenantFilter(req);

    const invoice = await Invoice.findOne({ _id: id, ...ownerFilter });
    if (!invoice) {
      return sendError(res, { status: 404, message: "Invoice not found" });
    }
    const invoiceSnapshot = invoice.toObject();

    const invoiceStatus = buildInvoiceStatusState({
      status,
      currentPaidDate: invoice.paidDate,
    });
    invoice.status = invoiceStatus.status;
    invoice.paidDate = invoiceStatus.paidDate;

    await invoice.save();
    await sharedAccountingService.syncInvoice(invoice, req);
    await logAudit(
      {
        action: "status_change",
        module: "invoices",
        targetId: invoice._id,
        targetName: invoice.invoiceNumber,
        description: `Changed invoice ${invoice.invoiceNumber} status to ${invoice.status}`,
        changes: buildAuditChanges(invoiceSnapshot, invoice.toObject(), ["status", "paidDate"]),
      },
      req
    );
    return sendSuccess(res, { data: invoice, message: "Invoice status updated" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerFilter = buildTenantFilter(req);

    const invoice = await Invoice.findOneAndDelete({ _id: id, ...ownerFilter });
    if (!invoice) {
      return sendError(res, { status: 404, message: "Invoice not found" });
    }

    await sharedAccountingService.removeInvoice(id, req);
    await logAudit(
      {
        action: "delete",
        module: "invoices",
        targetId: invoice._id,
        targetName: invoice.invoiceNumber,
        description: `Deleted invoice ${invoice.invoiceNumber}`,
        metadata: {
          status: invoice.status,
          grandTotal: invoice.grandTotal,
          customerName: invoice.customerName,
        },
      },
      req
    );

    return sendSuccess(res, { message: "Invoice deleted" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const generateInvoicePDF = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const ownerFilter = buildTenantFilter(req);

    const invoice = await Invoice.findOne({ _id: id, ...ownerFilter });
    if (!invoice) {
      return sendError(res, { status: 404, message: "Invoice not found" });
    }

    const user = await UserModel.findById(userId).select("username email");

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${invoice.invoiceNumber}.pdf`
    );

    doc.pipe(res);

    // Header
    doc.fontSize(24).font("Helvetica-Bold").text("INVOICE", 400, 50, { align: "right" });
    doc.fontSize(11).font("Helvetica-Bold").text(user.username || "ThinkBoard", 50, 50);
    doc.fontSize(9).font("Helvetica").text(user.email || "", 50, 65);

    // Invoice details
    const detailsY = 100;
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Invoice No:", 370, detailsY);
    doc.font("Helvetica").text(invoice.invoiceNumber, 450, detailsY);
    doc.font("Helvetica-Bold").text("Issue Date:", 370, detailsY + 15);
    doc.font("Helvetica").text(formatDateNepal(invoice.issueDate), 450, detailsY + 15);
    doc.font("Helvetica-Bold").text("Due Date:", 370, detailsY + 30);
    doc.font("Helvetica").text(formatDateNepal(invoice.dueDate), 450, detailsY + 30);
    doc.font("Helvetica-Bold").text("Status:", 370, detailsY + 45);
    doc.font("Helvetica").text(invoice.status.toUpperCase(), 450, detailsY + 45);
    doc.font("Helvetica-Bold").text("Payment:", 370, detailsY + 60);
    doc.font("Helvetica").text(PAYMENT_METHOD_LABELS[invoice.paymentMethod] || invoice.paymentMethod, 450, detailsY + 60);

    // Bill To
    doc.font("Helvetica-Bold").fontSize(10).text("Bill To:", 50, detailsY);
    doc.font("Helvetica").fontSize(9);
    doc.text(invoice.customerName, 50, detailsY + 15);
    if (invoice.customerEmail) doc.text(invoice.customerEmail);
    if (invoice.customerPhone) doc.text(invoice.customerPhone);
    const addr = invoice.customerAddress;
    if (addr && addr.street) {
      doc.text([addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(", "));
    }
    if (invoice.customerGstin) doc.text(`${TAX_REGISTRATION_LABEL}: ${invoice.customerGstin}`);

    // Items table header
    const tableTop = 220;
    doc.rect(45, tableTop - 5, 510, 20).fill("#4f46e5");
    doc.fill("#ffffff").font("Helvetica-Bold").fontSize(8);
    doc.text("Item", 50, tableTop);
    doc.text("Qty", 230, tableTop);
    doc.text("Price", 270, tableTop);
    doc.text("VAT%", 330, tableTop);
    doc.text("Discount", 380, tableTop);
    doc.text("Total", 460, tableTop);

    // Items rows
    doc.fill("#000000").font("Helvetica").fontSize(8);
    let rowY = tableTop + 25;
    invoice.items.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.rect(45, rowY - 5, 510, 18).fill("#f9fafb");
        doc.fill("#000000");
      }
      doc.text(item.productName, 50, rowY, { width: 170 });
      doc.text(String(item.quantity), 230, rowY);
      doc.text(formatMoney(item.unitPrice), 270, rowY);
      doc.text(invoice.withoutVat ? "0%" : `${item.vatRate}%`, 330, rowY);
      doc.text(formatMoney(item.discountAmount), 380, rowY);
      doc.text(formatMoney(item.lineTotal), 460, rowY);
      rowY += 20;
    });

    // Line separator
    doc.moveTo(45, rowY + 5).lineTo(555, rowY + 5).stroke("#e5e7eb");

    // Totals
    const totalsX = 370;
    let totalsY = rowY + 15;
    doc.font("Helvetica").fontSize(9);

    doc.text("Subtotal:", totalsX, totalsY);
    doc.text(formatMoney(invoice.subtotal), 470, totalsY);
    totalsY += 18;

    if (invoice.totalItemDiscount > 0) {
      doc.text("Item Discounts:", totalsX, totalsY);
      doc.text(`- ${formatMoney(invoice.totalItemDiscount)}`, 470, totalsY);
      totalsY += 18;
    }

    if (!invoice.withoutVat && invoice.totalVat > 0) {
      doc.text("Total VAT:", totalsX, totalsY);
      doc.text(formatMoney(invoice.totalVat), 470, totalsY);
      totalsY += 18;
    }

    if (invoice.overallDiscountAmount > 0) {
      const label =
        invoice.overallDiscountType === "percentage"
          ? `Overall Discount (${invoice.overallDiscountValue}%):`
          : "Overall Discount:";
      doc.text(label, totalsX, totalsY);
      doc.text(`- ${formatMoney(invoice.overallDiscountAmount)}`, 470, totalsY);
      totalsY += 18;
    }

    // Grand Total
    doc.rect(365, totalsY, 190, 28).fill("#4f46e5");
    doc.fill("#ffffff").font("Helvetica-Bold").fontSize(12);
    doc.text("Grand Total:", 370, totalsY + 7);
    doc.text(formatMoney(invoice.grandTotal), 470, totalsY + 7);

    // Notes
    if (invoice.notes) {
      doc.fill("#000000").font("Helvetica-Bold").fontSize(9).text("Notes:", 50, totalsY + 50);
      doc.font("Helvetica").fontSize(8).text(invoice.notes, 50, totalsY + 65, { width: 300 });
    }

    // Footer
    doc.fill("#888888").font("Helvetica").fontSize(7);
    doc.text("Thank you for your business!", 50, 750, { align: "center", width: 500 });

    doc.end();
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "PDF generation failed" });
  }
};

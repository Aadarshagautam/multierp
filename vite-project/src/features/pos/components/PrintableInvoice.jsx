import React from "react";
import {
  PAYMENT_METHOD_LABELS,
  formatDateTimeNepal,
  formatShortCurrencyNpr,
} from "../../../utils/nepal.js";

const formatMoney = (value) => formatShortCurrencyNpr(Number(value || 0));

const getCustomerSnapshot = (sale) => ({
  name: sale.customerName || sale.customerId?.name || "Walk-in",
  phone: sale.customerPhone || sale.customerId?.phone || "",
  email: sale.customerEmail || sale.customerId?.email || "",
  address: sale.customerAddressText || sale.customerId?.addressText || "",
  type: sale.customerType || sale.customerId?.customerType || "walk_in",
});

const getPaymentLines = (sale) => {
  if (Array.isArray(sale.payments) && sale.payments.length > 0) {
    return sale.payments;
  }

  if (!sale.paymentMethod) {
    return [];
  }

  return [{
    method: sale.paymentMethod,
    label: PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod,
    amount: sale.receivedAmount || sale.paidAmount || sale.grandTotal || 0,
  }];
};

const getPaymentLabel = (payment) =>
  payment.label || PAYMENT_METHOD_LABELS[payment.method] || payment.method || "Cash";

const PrintableInvoice = ({ sale }) => {
  if (!sale) return null;

  const customer = getCustomerSnapshot(sale);
  const paymentLines = getPaymentLines(sale);
  const isWalkIn = customer.type === "walk_in" && !sale.customerId;
  const paymentModeLabel =
    sale.paymentMode === "mixed"
      ? "Split payment"
      : PAYMENT_METHOD_LABELS[sale.paymentMode || sale.paymentMethod] ||
        sale.paymentMode ||
        sale.paymentMethod ||
        "Cash";

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-8 print:border-0 print:p-4 print:shadow-none">
        <div className="mb-8 flex items-start justify-between gap-6 print:mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">POS receipt</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 print:text-xl">
              {sale.invoiceNo || "Receipt"}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {sale.orderType === "dine-in"
                ? "Dine-in bill"
                : sale.orderType === "delivery"
                  ? "Delivery bill"
                  : "Counter bill"}
            </p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>{formatDateTimeNepal(sale.createdAt)}</p>
            <p className="mt-1 uppercase tracking-wide text-gray-400">Status: {sale.status}</p>
            {sale.tableNumber ? <p className="mt-1">Table #{sale.tableNumber}</p> : null}
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4 print:border print:border-gray-200 print:bg-transparent">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Customer</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{customer.name}</p>
            {!isWalkIn && customer.phone ? <p className="mt-1 text-sm text-gray-600">{customer.phone}</p> : null}
            {!isWalkIn && customer.email ? <p className="text-sm text-gray-600">{customer.email}</p> : null}
            {!isWalkIn && customer.address ? <p className="text-sm text-gray-600">{customer.address}</p> : null}
            <p className="mt-2 text-xs uppercase tracking-wide text-gray-400">
              {String(customer.type || "walk_in").replace(/_/g, " ")}
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-4 text-white print:border print:border-gray-200 print:bg-white print:text-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70 print:text-gray-500">
              Settlement
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/60 print:text-gray-500">Payment</p>
                <p className="font-semibold">{paymentModeLabel}</p>
              </div>
              <div>
                <p className="text-white/60 print:text-gray-500">Received</p>
                <p className="font-semibold">{formatMoney(sale.receivedAmount || sale.paidAmount)}</p>
              </div>
              <div>
                <p className="text-white/60 print:text-gray-500">Paid</p>
                <p className="font-semibold">{formatMoney(sale.paidAmount)}</p>
              </div>
              <div>
                <p className="text-white/60 print:text-gray-500">Due</p>
                <p className="font-semibold">{formatMoney(sale.dueAmount)}</p>
              </div>
            </div>
            {sale.changeAmount > 0 ? (
              <p className="mt-3 text-sm font-semibold text-emerald-300 print:text-emerald-600">
                Change: {formatMoney(sale.changeAmount)}
              </p>
            ) : null}
          </div>
        </div>

        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-2 text-left font-medium text-gray-600">Item</th>
              <th className="py-2 text-right font-medium text-gray-600">Qty</th>
              <th className="py-2 text-right font-medium text-gray-600">Rate</th>
              <th className="py-2 text-right font-medium text-gray-600">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sale.items.map((item, index) => (
              <tr key={`${item.productId || item.nameSnapshot}-${index}`}>
                <td className="py-3">
                  <p className="font-medium text-gray-900">{item.nameSnapshot}</p>
                  {item.skuSnapshot ? <p className="text-xs text-gray-400">{item.skuSnapshot}</p> : null}
                  {item.modifiers?.length > 0 ? (
                    <p className="text-xs text-indigo-600">
                      {item.modifiers.map((modifier) => modifier.option).join(", ")}
                    </p>
                  ) : null}
                  {item.notes ? <p className="text-xs italic text-rose-500">{item.notes}</p> : null}
                </td>
                <td className="py-3 text-right">{item.qty}</td>
                <td className="py-3 text-right">
                  <p>{formatMoney(item.price)}</p>
                  {item.discount > 0 ? <p className="text-xs text-red-500">Disc. {formatMoney(item.discount)}</p> : null}
                  {item.tax > 0 ? <p className="text-xs text-gray-400">VAT {formatMoney(item.tax)}</p> : null}
                </td>
                <td className="py-3 text-right font-medium">{formatMoney(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto max-w-sm space-y-2 border-t-2 border-gray-200 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatMoney(sale.subTotal)}</span>
          </div>
          {sale.itemDiscountTotal > 0 ? (
            <div className="flex justify-between">
              <span className="text-gray-600">Item discount</span>
              <span className="text-red-500">- {formatMoney(sale.itemDiscountTotal)}</span>
            </div>
          ) : null}
          {sale.overallDiscount > 0 ? (
            <div className="flex justify-between">
              <span className="text-gray-600">Overall discount</span>
              <span className="text-red-500">- {formatMoney(sale.overallDiscount)}</span>
            </div>
          ) : null}
          {sale.loyaltyDiscount > 0 ? (
            <div className="flex justify-between">
              <span className="text-gray-600">Loyalty discount</span>
              <span className="text-purple-600">- {formatMoney(sale.loyaltyDiscount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-gray-600">VAT</span>
            <span>{formatMoney(sale.taxTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
            <span>Grand total</span>
            <span>{formatMoney(sale.grandTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Paid</span>
            <span className="font-medium text-emerald-600">{formatMoney(sale.paidAmount)}</span>
          </div>
          {sale.dueAmount > 0 ? (
            <div className="flex justify-between">
              <span className="text-gray-600">Due</span>
              <span className="font-medium text-amber-600">{formatMoney(sale.dueAmount)}</span>
            </div>
          ) : null}
        </div>

        {paymentLines.length > 0 || sale.notes ? (
          <div className="mt-6 border-t border-gray-100 pt-4 text-sm text-gray-600">
            {paymentLines.map((payment, index) => (
              <div key={`${payment.method}-${index}`} className="flex justify-between">
                <span>{getPaymentLabel(payment)}</span>
                <span>{formatMoney(payment.amount)}</span>
              </div>
            ))}
            {sale.notes ? <p className="mt-3">Notes: {sale.notes}</p> : null}
          </div>
        ) : null}

        <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
          <p>Thank you for your purchase.</p>
        </div>
      </div>

      <div className="page-break-before mt-8 hidden print:block">
        <div className="mx-auto max-w-[80mm] font-mono text-[11px] leading-5">
          <div className="text-center">
            <p className="text-sm font-bold">RECEIPT</p>
            <p>{sale.invoiceNo}</p>
            <p>{formatDateTimeNepal(sale.createdAt)}</p>
          </div>

          <hr className="my-2 border-dashed" />
          <p>{isWalkIn ? "Walk-in customer" : customer.name}</p>
          {!isWalkIn && customer.phone ? <p>{customer.phone}</p> : null}
          {sale.tableNumber ? <p>Table #{sale.tableNumber}</p> : null}

          <hr className="my-2 border-dashed" />
          {sale.items.map((item, index) => (
            <div key={`${item.productId || item.nameSnapshot}-${index}`} className="mb-2">
              <div className="flex justify-between gap-2">
                <span className="max-w-[58%] truncate">{item.nameSnapshot}</span>
                <span>{formatMoney(item.lineTotal)}</span>
              </div>
              <div className="text-[10px] text-gray-600">
                {item.qty} x {formatMoney(item.price)}
                {item.modifiers?.length > 0
                  ? ` | ${item.modifiers.map((modifier) => modifier.option).join(", ")}`
                  : ""}
              </div>
            </div>
          ))}

          <hr className="my-2 border-dashed" />
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(sale.subTotal)}</span>
          </div>
          {sale.discountTotal > 0 ? (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>- {formatMoney(sale.discountTotal)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span>VAT</span>
            <span>{formatMoney(sale.taxTotal)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-dashed pt-1 font-bold">
            <span>TOTAL</span>
            <span>{formatMoney(sale.grandTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid</span>
            <span>{formatMoney(sale.paidAmount)}</span>
          </div>
          {sale.changeAmount > 0 ? (
            <div className="flex justify-between">
              <span>Change</span>
              <span>{formatMoney(sale.changeAmount)}</span>
            </div>
          ) : null}
          {sale.dueAmount > 0 ? (
            <div className="flex justify-between">
              <span>Due</span>
              <span>{formatMoney(sale.dueAmount)}</span>
            </div>
          ) : null}

          {paymentLines.length > 0 ? (
            <>
              <hr className="my-2 border-dashed" />
              {paymentLines.map((payment, index) => (
                <div key={`${payment.method}-${index}`} className="flex justify-between">
                  <span>{getPaymentLabel(payment)}</span>
                  <span>{formatMoney(payment.amount)}</span>
                </div>
              ))}
            </>
          ) : null}

          {sale.notes ? (
            <>
              <hr className="my-2 border-dashed" />
              <p>Note: {sale.notes}</p>
            </>
          ) : null}

          <hr className="my-2 border-dashed" />
          <p className="text-center">Thank you</p>
        </div>
      </div>
    </>
  );
};

export default PrintableInvoice;

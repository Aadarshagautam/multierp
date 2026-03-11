import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye, Receipt, Filter } from "lucide-react";
import { posSaleApi } from "../../api/posApi";
import {
  PAYMENT_METHOD_LABELS,
  formatDateTimeNepal,
  formatShortCurrencyNpr,
} from "../../utils/nepal.js";

const statusColors = {
  paid: "bg-green-100 text-green-700",
  partial: "bg-amber-100 text-amber-700",
  due: "bg-red-100 text-red-700",
  refund: "bg-gray-100 text-gray-600",
};

const getCustomerLabel = (sale) => sale.customerName || sale.customerId?.name || "Walk-in";

const getPaymentLabel = (sale) => {
  if (sale.paymentMode === "mixed") return PAYMENT_METHOD_LABELS.mixed || "Split";
  return PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod || "Cash";
};

const getItemCount = (sale) =>
  Array.isArray(sale.items)
    ? sale.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
    : 0;

const SalesHistory = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pos-sales", page, status, startDate, endDate],
    queryFn: () =>
      posSaleApi.list({
        page,
        limit: 20,
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      }),
  });

  const sales = data?.data?.sales || [];
  const pagination = data?.data?.pagination || {};

  return (
    <div className="p-4 pt-20 lg:pl-[17.5rem]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
            <p className="text-sm text-gray-500">View all POS transactions</p>
          </div>
          <Link
            to="/pos/billing"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + New Sale
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
              <option value="refund">Refund</option>
            </select>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {(status || startDate || endDate) ? (
            <button
              onClick={() => { setStatus(""); setStartDate(""); setEndDate(""); setPage(1); }}
              className="text-sm text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Receipt className="mb-3 h-12 w-12" />
              <p className="text-sm">No sales found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Invoice</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Qty</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Paid / Due</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Payment</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((sale) => (
                    <tr key={sale._id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div>
                          <p>{sale.invoiceNo}</p>
                          <p className="text-xs font-normal uppercase tracking-wide text-gray-400">
                            {sale.orderType || "takeaway"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDateTimeNepal(sale.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>
                          <p className="font-medium text-gray-800">{getCustomerLabel(sale)}</p>
                          {sale.customerPhone ? <p className="text-xs text-gray-400">{sale.customerPhone}</p> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{getItemCount(sale)}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatShortCurrencyNpr(sale.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium text-emerald-600">{formatShortCurrencyNpr(sale.paidAmount)}</p>
                        {sale.dueAmount > 0 ? (
                          <p className="text-xs text-amber-600">
                            Due {formatShortCurrencyNpr(sale.dueAmount)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[sale.status] || "bg-gray-100 text-gray-600"}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-xs text-gray-500">
                          <p className="font-medium uppercase">{getPaymentLabel(sale)}</p>
                          {sale.changeAmount > 0 ? (
                            <p className="text-[11px] text-emerald-600">
                              Change {formatShortCurrencyNpr(sale.changeAmount)}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          to={`/pos/sales/${sale._id}`}
                          className="inline-flex rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 ? (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages} ({pagination.total} sales)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
                  disabled={page >= pagination.pages}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SalesHistory;

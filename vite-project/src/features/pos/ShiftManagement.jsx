import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, DollarSign, TrendingUp, X, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { posShiftApi } from "../../api/posApi";

const fmt = (n) =>
  `Rs. ${(n || 0).toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const METHOD_COLORS = {
  cash: "text-green-600",
  card: "text-blue-600",
  esewa: "text-emerald-600",
  khalti: "text-fuchsia-600",
  credit: "text-red-600",
  mixed: "text-amber-600",
};

function duration(from, to) {
  const diff = Math.floor((new Date(to || Date.now()) - new Date(from)) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function ShiftManagement() {
  const qc = useQueryClient();
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [showCloseForm, setShowCloseForm] = useState(false);

  const { data: currentData, isLoading: currentLoading } = useQuery({
    queryKey: ["pos-shift-current"],
    queryFn: () => posShiftApi.current(),
    refetchInterval: 30000,
  });

  const { data: historyData } = useQuery({
    queryKey: ["pos-shifts"],
    queryFn: () => posShiftApi.list(),
  });

  const shift = currentData?.data;
  const history = historyData?.data || [];

  const openMut = useMutation({
    mutationFn: (data) => posShiftApi.open(data),
    onSuccess: () => {
      toast.success("Shift opened!");
      qc.invalidateQueries({ queryKey: ["pos-shift-current"] });
      qc.invalidateQueries({ queryKey: ["pos-shifts"] });
      setOpeningCash("");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  const closeMut = useMutation({
    mutationFn: ({ id, data }) => posShiftApi.close(id, data),
    onSuccess: () => {
      toast.success("Shift closed!");
      qc.invalidateQueries({ queryKey: ["pos-shift-current"] });
      qc.invalidateQueries({ queryKey: ["pos-shifts"] });
      setShowCloseForm(false);
      setClosingCash("");
      setCloseNotes("");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  const handleOpen = (e) => {
    e.preventDefault();
    openMut.mutate({ openingCash: Number(openingCash) || 0 });
  };

  const handleClose = (e) => {
    e.preventDefault();
    if (!shift) return;
    closeMut.mutate({
      id: shift._id,
      data: { closingCash: Number(closingCash) || 0, notes: closeNotes },
    });
  };

  return (
    <div className="p-4 lg:pl-[17.5rem] pt-20 min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
          <p className="text-sm text-gray-500">Open and close your cash register shifts with Nepal-ready settlement totals.</p>
        </div>

        {/* Current shift status */}
        {currentLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex items-center justify-center">
            <div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : shift ? (
          /* ── Open Shift Card ── */
          <div className="bg-white rounded-2xl border-2 border-green-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <h2 className="text-lg font-bold text-gray-900">Shift Active</h2>
              </div>
              <span className="text-sm text-gray-500">{duration(shift.openedAt, null)} elapsed</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Opened at</p>
                <p className="font-semibold text-gray-800 text-sm mt-0.5">
                  {new Date(shift.openedAt).toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Opening Cash</p>
                <p className="font-semibold text-gray-800 text-sm mt-0.5">{fmt(shift.openingCash)}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Total Sales</p>
                <p className="font-semibold text-green-700 text-sm mt-0.5">{fmt(shift.totalSales)}</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Transactions</p>
                <p className="font-semibold text-indigo-700 text-sm mt-0.5">{shift.totalTransactions || 0}</p>
              </div>
            </div>

            {!showCloseForm ? (
              <button
                onClick={() => setShowCloseForm(true)}
                className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold text-sm transition-colors"
              >
                Close Shift
              </button>
            ) : (
              <form onSubmit={handleClose} className="border-t border-gray-100 pt-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Close Shift</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Physical Cash Count (Rs.)</label>
                  <input
                    type="number" min="0" step="0.01" value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    placeholder="Count the cash in your drawer..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave blank to use expected amount automatically</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea
                    rows={2} value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)}
                    placeholder="Any notes for this shift..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCloseForm(false)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={closeMut.isPending}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                    {closeMut.isPending ? "Closing..." : "Confirm Close"}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* ── Open shift form ── */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">No Active Shift</h2>
                <p className="text-sm text-gray-500">Open a shift to start accepting payments</p>
              </div>
            </div>
            <form onSubmit={handleOpen} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Cash Balance (Rs.)</label>
                <input
                  type="number" min="0" step="0.01" value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">Enter the starting cash amount in the register</p>
              </div>
              <button type="submit" disabled={openMut.isPending}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm disabled:opacity-50">
                {openMut.isPending ? "Opening..." : "Open Shift"}
              </button>
            </form>
          </div>
        )}

        {/* Shift history */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Recent Shifts</h3>
          </div>
          {history.filter((s) => s.status === "closed").length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm">No closed shifts yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {history.filter((s) => s.status === "closed").slice(0, 10).map((s) => (
                <div key={s._id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(s.openedAt).toLocaleDateString("en-NP", { weekday: "short", month: "short", day: "numeric" })}
                        <span className="text-gray-400 font-normal ml-2 text-xs">
                          {new Date(s.openedAt).toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" })} →{" "}
                          {new Date(s.closedAt).toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{duration(s.openedAt, s.closedAt)} · {s.totalTransactions} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{fmt(s.totalSales)}</p>
                      {s.cashDifference !== 0 && (
                        <div className={`flex items-center gap-1 text-xs mt-0.5 ${s.cashDifference > 0 ? "text-green-600" : "text-red-600"}`}>
                          {s.cashDifference > 0 ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {s.cashDifference > 0 ? "+" : ""}{fmt(s.cashDifference)} difference
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Sales by method */}
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(s.salesByMethod || {}).filter(([, v]) => v > 0).map(([method, amount]) => (
                      <div key={method} className="text-xs">
                        <span className="text-gray-400 capitalize">{method}: </span>
                        <span className={`font-medium ${METHOD_COLORS[method] || "text-gray-700"}`}>{fmt(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock, DollarSign, Receipt, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import StatePanel from "../../components/StatePanel.jsx";
import {
  DataTableShell,
  EmptyCard,
  FieldLabel,
  KpiCard,
  PageHeader,
  SectionCard,
  StatusBadge,
  WorkspacePage,
} from "../../components/ui/ErpPrimitives.jsx";
import { posShiftApi } from "../../api/posApi";
import AppContext from "../../context/app-context.js";

const fmt = (n) =>
  `Rs. ${(n || 0).toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const METHOD_LABELS = {
  cash: "Cash",
  card: "Card",
  esewa: "eSewa",
  khalti: "Khalti",
  credit: "Credit",
  mixed: "Mixed",
};

function duration(from, to) {
  const diff = Math.floor((new Date(to || Date.now()) - new Date(from)) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function ShiftManagement() {
  const { hasPermission } = useContext(AppContext);
  const qc = useQueryClient();
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [showCloseForm, setShowCloseForm] = useState(false);
  const canOpenShift = hasPermission("pos.shifts.open");
  const canCloseShift = hasPermission("pos.shifts.close");

  const { data: currentData, isLoading: currentLoading, isError: hasCurrentError } = useQuery({
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
      toast.success("Shift opened");
      qc.invalidateQueries({ queryKey: ["pos-shift-current"] });
      qc.invalidateQueries({ queryKey: ["pos-shifts"] });
      setOpeningCash("");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Unable to open shift"),
  });

  const closeMut = useMutation({
    mutationFn: ({ id, data }) => posShiftApi.close(id, data),
    onSuccess: () => {
      toast.success("Shift closed");
      qc.invalidateQueries({ queryKey: ["pos-shift-current"] });
      qc.invalidateQueries({ queryKey: ["pos-shifts"] });
      setShowCloseForm(false);
      setClosingCash("");
      setCloseNotes("");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Unable to close shift"),
  });

  const handleOpen = (event) => {
    event.preventDefault();
    if (!canOpenShift) {
      toast.error("Your role cannot open shifts.");
      return;
    }
    openMut.mutate({ openingCash: Number(openingCash) || 0 });
  };

  const handleClose = (event) => {
    event.preventDefault();
    if (!shift) return;
    if (!canCloseShift) {
      toast.error("Your role cannot close shifts.");
      return;
    }
    closeMut.mutate({
      id: shift._id,
      data: { closingCash: Number(closingCash) || 0, notes: closeNotes },
    });
  };

  if (currentLoading) {
    return (
      <WorkspacePage>
        <StatePanel
          tone="teal"
          title="Loading shift workspace"
          message="Checking whether the cashier already has an active shift and collecting the latest close data."
        />
      </WorkspacePage>
    );
  }

  if (hasCurrentError) {
    return (
      <WorkspacePage>
        <StatePanel
          tone="rose"
          title="Unable to load shift data"
          message="The POS shift workspace could not load right now. Refresh and try again."
        />
      </WorkspacePage>
    );
  }

  return (
    <WorkspacePage className="max-w-7xl">
      <PageHeader
        eyebrow="Shift Close"
        title="Cashier shift management"
        description="Open a shift, monitor the till, then close the day with cash and wallet totals in one simple workflow."
        badges={[
          shift ? "Shift open" : "No active shift",
          new Date().toLocaleDateString("en-NP", { weekday: "long", month: "long", day: "numeric" }),
        ]}
      />

      {shift ? (
        <>
          <section className="grid gap-4 xl:grid-cols-4">
            <KpiCard icon={Clock} title="Shift time" value={duration(shift.openedAt, null)} detail={`Opened ${new Date(shift.openedAt).toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" })}`} tone="blue" />
            <KpiCard icon={Wallet} title="Opening cash" value={fmt(shift.openingCash)} detail="Cash counted at shift start" tone="amber" />
            <KpiCard icon={DollarSign} title="Total sales" value={fmt(shift.totalSales)} detail={`${shift.totalTransactions || 0} transactions so far`} tone="teal" />
            <KpiCard icon={Receipt} title="Expected cash" value={fmt(shift.expectedCash || shift.openingCash)} detail="Opening cash plus cash sales" tone="slate" />
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
            <SectionCard
              eyebrow="Active Shift"
              title="Review the current shift before closing."
              description="The cashier should only need cash count, notes, and a quick method check before sign-off."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="erp-subtle">
                  <p className="text-sm font-semibold text-slate-900">Settlement snapshot</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Transactions</span>
                      <span className="font-semibold text-slate-900">{shift.totalTransactions || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Expected cash</span>
                      <span className="font-semibold text-slate-900">{fmt(shift.expectedCash || shift.openingCash)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Current status</span>
                      <StatusBadge tone="teal">Active</StatusBadge>
                    </div>
                  </div>
                </div>

                <div className="erp-subtle">
                  <p className="text-sm font-semibold text-slate-900">Payment methods</p>
                  <div className="mt-4 space-y-3">
                    {Object.entries(shift.salesByMethod || {}).filter(([, value]) => value > 0).length === 0 ? (
                      <p className="text-sm text-slate-500">No payment totals yet.</p>
                    ) : (
                      Object.entries(shift.salesByMethod || {})
                        .filter(([, value]) => value > 0)
                        .map(([method, amount]) => (
                          <div key={method} className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">{METHOD_LABELS[method] || method}</span>
                            <span className="font-semibold text-slate-900">{fmt(amount)}</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Close Shift"
              title="Count cash and finish the shift."
              description="Keep this form short so staff can close the day quickly and consistently."
            >
              {!showCloseForm ? (
                <div className="erp-subtle">
                  <p className="text-sm leading-6 text-slate-600">
                    Use the close action when the cashier has counted the drawer and checked any unusual difference.
                  </p>
                  {canCloseShift ? (
                    <button
                      onClick={() => setShowCloseForm(true)}
                      className="btn-primary mt-5 w-full"
                    >
                      Close shift
                    </button>
                  ) : (
                    <p className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                      This role can review shift totals but cannot close the shift.
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleClose} className="space-y-4">
                  <div>
                    <FieldLabel>Physical cash count (Rs.)</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={closingCash}
                      onChange={(event) => setClosingCash(event.target.value)}
                      placeholder="Count the cash in the drawer"
                      className="input-primary"
                    />
                    <p className="mt-2 text-xs text-slate-500">Leave blank if the physical cash matches the expected total.</p>
                  </div>
                  <div>
                    <FieldLabel optional>Close note</FieldLabel>
                    <textarea
                      rows={3}
                      value={closeNotes}
                      onChange={(event) => setCloseNotes(event.target.value)}
                      placeholder="Short note about handover, shortage, or wallet issue"
                      className="input-primary resize-none"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setShowCloseForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={closeMut.isPending}
                      className="btn-danger"
                    >
                      {closeMut.isPending ? "Closing..." : "Confirm close"}
                    </button>
                  </div>
                </form>
              )}
            </SectionCard>
          </div>
        </>
      ) : (
        <SectionCard
          eyebrow="Open Shift"
          title="Start the cashier shift."
          description="The cashier only needs the opening cash amount before billing begins."
        >
          <form onSubmit={handleOpen} className="grid gap-4 xl:grid-cols-[1fr,auto] xl:items-end">
            <div className="max-w-xl">
              <FieldLabel>Opening cash balance (Rs.)</FieldLabel>
              <input
                type="number"
                min="0"
                step="0.01"
                value={openingCash}
                onChange={(event) => setOpeningCash(event.target.value)}
                placeholder="0.00"
                className="input-primary"
              />
              <p className="mt-2 text-sm text-slate-500">Enter the cash available in the drawer before the first sale.</p>
            </div>
            {canOpenShift ? (
              <button
                type="submit"
                disabled={openMut.isPending}
                className="btn-primary"
              >
                {openMut.isPending ? "Opening..." : "Open shift"}
              </button>
            ) : (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                This role can review shift history but cannot open a new shift.
              </p>
            )}
          </form>
        </SectionCard>
      )}

      <SectionCard
        eyebrow="Recent History"
        title="Closed shifts"
        description="Owners and managers should be able to check recent close totals, payment mix, and differences without a long audit screen."
      >
        {history.filter((item) => item.status === "closed").length === 0 ? (
          <EmptyCard
            icon={Clock}
            title="No closed shifts yet"
            message="Once cashiers start closing shifts, the recent history will appear here."
          />
        ) : (
          <DataTableShell>
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Duration</th>
                    <th>Sales</th>
                    <th>Cash difference</th>
                    <th>Methods</th>
                  </tr>
                </thead>
                <tbody>
                  {history
                    .filter((item) => item.status === "closed")
                    .slice(0, 10)
                    .map((item) => (
                      <tr key={item._id}>
                        <td>
                          <p className="font-semibold text-slate-900">
                            {new Date(item.openedAt).toLocaleDateString("en-NP", { weekday: "short", month: "short", day: "numeric" })}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(item.openedAt).toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" })} to{" "}
                            {new Date(item.closedAt).toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>
                        <td>{duration(item.openedAt, item.closedAt)}</td>
                        <td>
                          <p className="font-semibold text-slate-900">{fmt(item.totalSales)}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.totalTransactions || 0} transactions</p>
                        </td>
                        <td>
                          {item.cashDifference === 0 ? (
                            <StatusBadge tone="teal">Matched</StatusBadge>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${item.cashDifference > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                              {item.cashDifference > 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                              {item.cashDifference > 0 ? "+" : ""}
                              {fmt(item.cashDifference)}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(item.salesByMethod || {})
                              .filter(([, value]) => value > 0)
                              .map(([method, amount]) => (
                                <StatusBadge key={method} tone="slate">
                                  {METHOD_LABELS[method] || method}: {fmt(amount)}
                                </StatusBadge>
                              ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </DataTableShell>
        )}
      </SectionCard>
    </WorkspacePage>
  );
}

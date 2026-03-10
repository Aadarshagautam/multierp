import React, { useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, ChefHat, CheckCircle2, Bell, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { posKdsApi, posSaleApi } from "../../api/posApi";
import { getBusinessPosMeta } from "../../config/businessConfigs.js";
import AppContext from "../../context/app-context.js";

const STATUS_NEXT = {
  pending:   { next: "preparing", label: "Start Preparing", color: "bg-amber-500 hover:bg-amber-600" },
  preparing: { next: "ready",     label: "Mark Ready",      color: "bg-teal-500 hover:bg-teal-600" },
  ready:     { next: "served",    label: "Mark Served",     color: "bg-green-600 hover:bg-green-700" },
};

const CARD_STYLE = {
  pending:   "border-amber-200 bg-amber-50",
  preparing: "border-teal-200 bg-teal-50",
  ready:     "border-green-200 bg-green-50",
};

const HEADER_STYLE = {
  pending:   "bg-amber-500",
  preparing: "bg-teal-500",
  ready:     "bg-green-500",
};

function elapsed(createdAt) {
  const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

export default function KitchenDisplay() {
  const { orgBusinessType } = useContext(AppContext);
  const qc = useQueryClient();
  const posMeta = getBusinessPosMeta(orgBusinessType);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["pos-kds"],
    queryFn: () => posKdsApi.list(),
    refetchInterval: 10000,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => posSaleApi.updateOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pos-kds"] }),
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  const orders = data?.data || [];
  const pending   = orders.filter((o) => o.orderStatus === "pending");
  const preparing = orders.filter((o) => o.orderStatus === "preparing");
  const ready     = orders.filter((o) => o.orderStatus === "ready");

  const KDSCard = ({ order }) => {
    const cfg = STATUS_NEXT[order.orderStatus];
    if (!cfg) return null;
    const age = Math.floor((Date.now() - new Date(order.createdAt)) / 1000 / 60);
    const isUrgent = age >= 15;

    return (
      <div className={`rounded-2xl border-2 overflow-hidden shadow-sm ${CARD_STYLE[order.orderStatus]} ${isUrgent ? "ring-2 ring-red-400" : ""}`}>
        {/* Card header */}
        <div className={`${HEADER_STYLE[order.orderStatus]} text-white px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {order.tableId ? (
              <span className="font-bold text-lg">T-{order.tableId.number || order.tableNumber}</span>
            ) : (
              <span className="font-semibold text-sm uppercase">{order.orderType}</span>
            )}
            {order.invoiceNo && <span className="text-xs opacity-75">{order.invoiceNo}</span>}
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            {isUrgent && <Bell className="w-4 h-4 animate-bounce" />}
            <Clock className="w-3.5 h-3.5 opacity-75" />
            <span>{elapsed(order.createdAt)}</span>
          </div>
        </div>

        {/* Items */}
        <div className="p-3 space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="bg-white/70 rounded-xl px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800">
                  <span className="text-base mr-1">{item.qty}×</span>{item.nameSnapshot}
                </span>
                {item.status && item.status !== "pending" && (
                  <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full capitalize">{item.status}</span>
                )}
              </div>
              {item.modifiers?.length > 0 && (
                <p className="text-xs text-gray-500 mt-0.5 pl-5">
                  {item.modifiers.map((m) => `${m.option}`).join(", ")}
                </p>
              )}
              {item.notes && <p className="text-xs text-rose-600 mt-0.5 pl-5 italic">{item.notes}</p>}
            </div>
          ))}
        </div>

        {/* Order note */}
        {order.notes && (
          <div className="px-3 pb-2">
            <p className="text-xs text-gray-500 italic bg-white/60 rounded-lg px-2 py-1">Note: {order.notes}</p>
          </div>
        )}

        {/* Action */}
        <div className="px-3 pb-3">
          <button
            onClick={() => statusMut.mutate({ id: order._id, status: cfg.next })}
            disabled={statusMut.isPending}
            className={`w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${cfg.color} disabled:opacity-50`}
          >
            {cfg.label}
          </button>
        </div>
      </div>
    );
  };

  if (!posMeta.allowKitchen) {
    return (
      <div className="p-4 lg:pl-[17.5rem] pt-20 min-h-screen bg-gray-50/50">
        <div className="max-w-3xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Kitchen display is not part of this package</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This workspace is using a focused cafe or shop flow, so kitchen coordination stays hidden.
          </p>
          <Link to="/pos" className="mt-5 inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
            Back to POS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:pl-[17.5rem] pt-20 min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Kitchen Display</h1>
              <p className="text-sm text-gray-400">{orders.length} active order{orders.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl py-24 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-300 font-medium">All caught up!</p>
            <p className="text-gray-500 text-sm mt-1">No active kitchen orders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pending column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <h2 className="text-sm font-semibold text-white">Pending ({pending.length})</h2>
              </div>
              <div className="space-y-3">
                {pending.map((o) => <KDSCard key={o._id} order={o} />)}
                {pending.length === 0 && <p className="text-xs text-gray-600 text-center py-8">No pending orders</p>}
              </div>
            </div>

            {/* Preparing column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <h2 className="text-sm font-semibold text-white">Preparing ({preparing.length})</h2>
              </div>
              <div className="space-y-3">
                {preparing.map((o) => <KDSCard key={o._id} order={o} />)}
                {preparing.length === 0 && <p className="text-xs text-gray-600 text-center py-8">Nothing being prepared</p>}
              </div>
            </div>

            {/* Ready column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <h2 className="text-sm font-semibold text-white">Ready ({ready.length})</h2>
              </div>
              <div className="space-y-3">
                {ready.map((o) => <KDSCard key={o._id} order={o} />)}
                {ready.length === 0 && <p className="text-xs text-gray-600 text-center py-8">Nothing ready yet</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

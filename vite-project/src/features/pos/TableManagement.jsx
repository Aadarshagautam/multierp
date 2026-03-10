import React, { useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Edit3, Plus, Trash2, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { posTableApi } from "../../api/posApi";
import { getBusinessPosMeta } from "../../config/businessConfigs.js";
import AppContext from "../../context/app-context.js";
import {
  DEFAULT_PHONE_PLACEHOLDER,
  formatDateTimeNepal,
} from "../../utils/nepal.js";

const STATUS_CONFIG = {
  available: {
    label: "Available",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    card: "border-emerald-200 bg-white",
  },
  occupied: {
    label: "Occupied",
    badge: "border-rose-200 bg-rose-50 text-rose-800",
    card: "border-rose-200 bg-white",
  },
  reserved: {
    label: "Reserved",
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    card: "border-amber-200 bg-white",
  },
  cleaning: {
    label: "Cleaning",
    badge: "border-stone-200 bg-stone-100 text-stone-700",
    card: "border-stone-200 bg-white",
  },
};

const STATUS_OPTIONS = ["available", "occupied", "cleaning"];
const emptyTableForm = { number: "", name: "", capacity: 4, section: "Main Hall" };
const emptyReservationForm = {
  customerName: "",
  phone: "",
  partySize: 2,
  reservationAt: "",
  source: "phone",
  notes: "",
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const statusSummary = (tables) =>
  Object.entries(STATUS_CONFIG).map(([key, config]) => ({
    key,
    label: config.label,
    count: tables.filter((table) => table.status === key).length,
    badge: config.badge,
  }));

export default function TableManagement() {
  const { orgBusinessType } = useContext(AppContext);
  const qc = useQueryClient();
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableForm, setTableForm] = useState(emptyTableForm);
  const [editingTableId, setEditingTableId] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationForm, setReservationForm] = useState(emptyReservationForm);
  const [reservationTarget, setReservationTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const posMeta = getBusinessPosMeta(orgBusinessType);

  const { data, isLoading } = useQuery({
    queryKey: ["pos-tables"],
    queryFn: () => posTableApi.list(),
    refetchInterval: 15000,
  });

  const tables = data?.data || [];
  const filteredTables =
    statusFilter === "all"
      ? tables
      : tables.filter((table) => table.status === statusFilter);

  const closeTableModal = () => {
    setShowTableModal(false);
    setEditingTableId(null);
    setTableForm(emptyTableForm);
  };

  const closeReservationModal = () => {
    setShowReservationModal(false);
    setReservationTarget(null);
    setReservationForm(emptyReservationForm);
  };

  const invalidateTables = () =>
    qc.invalidateQueries({ queryKey: ["pos-tables"] });

  const createTableMut = useMutation({
    mutationFn: (payload) => posTableApi.create(payload),
    onSuccess: () => {
      toast.success("Table added");
      invalidateTables();
      closeTableModal();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Unable to add table"),
  });

  const updateTableMut = useMutation({
    mutationFn: ({ id, payload }) => posTableApi.update(id, payload),
    onSuccess: () => {
      toast.success("Table updated");
      invalidateTables();
      closeTableModal();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Unable to update table"),
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }) => posTableApi.updateStatus(id, status),
    onSuccess: () => invalidateTables(),
    onError: (error) =>
      toast.error(error.response?.data?.message || "Unable to update status"),
  });

  const reserveTableMut = useMutation({
    mutationFn: ({ id, payload }) => posTableApi.reserve(id, payload),
    onSuccess: () => {
      toast.success("Reservation saved");
      invalidateTables();
      closeReservationModal();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Unable to save reservation"),
  });

  const cancelReservationMut = useMutation({
    mutationFn: (id) => posTableApi.cancelReservation(id),
    onSuccess: () => {
      toast.success("Reservation cleared");
      invalidateTables();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Unable to clear reservation"),
  });

  const deleteTableMut = useMutation({
    mutationFn: (id) => posTableApi.delete(id),
    onSuccess: () => {
      toast.success("Table removed");
      invalidateTables();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Unable to remove table"),
  });

  const openCreateTable = () => {
    setEditingTableId(null);
    setTableForm(emptyTableForm);
    setShowTableModal(true);
  };

  const openEditTable = (table) => {
    setEditingTableId(table._id);
    setTableForm({
      number: table.number,
      name: table.name || "",
      capacity: table.capacity || 4,
      section: table.section || "Main Hall",
    });
    setShowTableModal(true);
  };

  const openReservation = (table) => {
    setReservationTarget(table);
    setReservationForm({
      customerName: table.reservation?.customerName || "",
      phone: table.reservation?.phone || "",
      partySize: table.reservation?.partySize || table.capacity || 2,
      reservationAt: toDateTimeLocal(table.reservation?.reservationAt),
      source: table.reservation?.source || "phone",
      notes: table.reservation?.notes || "",
    });
    setShowReservationModal(true);
  };

  const handleTableSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...tableForm,
      number: Number(tableForm.number),
      capacity: Number(tableForm.capacity),
    };

    if (editingTableId) {
      updateTableMut.mutate({ id: editingTableId, payload });
      return;
    }

    createTableMut.mutate(payload);
  };

  const handleReservationSubmit = (event) => {
    event.preventDefault();
    if (!reservationTarget) return;

    reserveTableMut.mutate({
      id: reservationTarget._id,
      payload: {
        ...reservationForm,
        partySize: Number(reservationForm.partySize),
        reservationAt: new Date(reservationForm.reservationAt).toISOString(),
      },
    });
  };

  if (!posMeta.allowTables) {
    return (
      <div className="page-shell">
        <div className="panel mx-auto max-w-3xl p-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Floor plan is not part of this package
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This workspace is using a focused cafe or shop flow, so reservations
            and dining-floor controls stay hidden.
          </p>
          <Link
            to="/pos"
            className="btn-primary mt-5 inline-flex"
          >
            Back to POS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="panel p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Dining Floor</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Manage tables and reservations in one screen.
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Keep the host desk simple: sections, seating, reservation time,
              and guest notes stay tied to the table instead of living on paper.
            </p>
          </div>
          <button onClick={openCreateTable} className="btn-primary">
            <Plus className="h-4 w-4" />
            Add table
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statusSummary(tables).map((item) => (
          <button
            key={item.key}
            onClick={() =>
              setStatusFilter((current) => (current === item.key ? "all" : item.key))
            }
            className={`panel p-5 text-left transition ${
              statusFilter === item.key ? "ring-2 ring-amber-300" : ""
            }`}
          >
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${item.badge}`}>
              {item.label}
            </span>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              {item.count}
            </p>
          </button>
        ))}
      </section>

      <section className="panel p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">Live Floor</p>
            <h2 className="mt-2 section-heading">
              {statusFilter === "all"
                ? "Every active table"
                : `${STATUS_CONFIG[statusFilter]?.label || "Filtered"} tables`}
            </h2>
          </div>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="btn-secondary"
            >
              Show all tables
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-emerald-700" />
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
            <p className="text-base font-semibold text-slate-900">
              No tables in this view
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add a table or clear the filter to see the whole dining floor.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTables.map((table) => {
              const status = STATUS_CONFIG[table.status] || STATUS_CONFIG.available;
              const hasReservation = Boolean(table.reservation?.customerName);
              const reservationLocked = table.status === "occupied" && !hasReservation;

              return (
                <article
                  key={table._id}
                  className={`rounded-3xl border p-5 shadow-sm ${status.card}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="section-kicker">{table.section || "Dining Floor"}</p>
                      <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                        #{table.number}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {table.name || "No alias"}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${status.badge}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    <Users className="h-4 w-4" />
                    {table.capacity} seats
                  </div>

                  {hasReservation && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-amber-900">
                          {table.reservation.customerName}
                        </p>
                        <span className="text-xs font-medium text-amber-700">
                          {table.reservation.partySize} guests
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-amber-800">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateTimeNepal(table.reservation.reservationAt)}
                      </div>
                      {table.reservation.phone && (
                        <p className="mt-2 text-xs text-amber-800">
                          {table.reservation.phone}
                        </p>
                      )}
                      {table.reservation.notes && (
                        <p className="mt-2 text-xs leading-5 text-amber-800">
                          {table.reservation.notes}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-5 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                        Floor status
                      </label>
                      <select
                        value={table.status === "reserved" ? "available" : table.status}
                        onChange={(event) =>
                          updateStatusMut.mutate({
                            id: table._id,
                            status: event.target.value,
                          })
                        }
                        className="input-primary"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {STATUS_CONFIG[option].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        onClick={() => openReservation(table)}
                        disabled={reservationLocked}
                        className="btn-secondary"
                      >
                        {hasReservation ? "Edit reservation" : "Reserve table"}
                      </button>
                      {hasReservation ? (
                        <button
                          onClick={() => cancelReservationMut.mutate(table._id)}
                          className="btn-secondary"
                        >
                          Clear reservation
                        </button>
                      ) : (
                        <button
                          onClick={() => openEditTable(table)}
                          className="btn-secondary"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit table
                        </button>
                      )}
                    </div>

                    {!hasReservation && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Remove table #${table.number}?`)) {
                            deleteTableMut.mutate(table._id);
                          }
                        }}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove table
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker">Floor Setup</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  {editingTableId ? "Edit table" : "Add table"}
                </h2>
              </div>
              <button
                onClick={closeTableModal}
                className="rounded-2xl border border-stone-200 p-2 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleTableSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Table number
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={tableForm.number}
                    onChange={(event) =>
                      setTableForm((current) => ({
                        ...current,
                        number: event.target.value,
                      }))
                    }
                    className="input-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tableForm.capacity}
                    onChange={(event) =>
                      setTableForm((current) => ({
                        ...current,
                        capacity: event.target.value,
                      }))
                    }
                    className="input-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Alias
                </label>
                <input
                  type="text"
                  value={tableForm.name}
                  onChange={(event) =>
                    setTableForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Window Seat"
                  className="input-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Section
                </label>
                <input
                  type="text"
                  value={tableForm.section}
                  onChange={(event) =>
                    setTableForm((current) => ({
                      ...current,
                      section: event.target.value,
                    }))
                  }
                  placeholder="Main Hall"
                  className="input-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeTableModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createTableMut.isPending || updateTableMut.isPending}
                >
                  {createTableMut.isPending || updateTableMut.isPending
                    ? "Saving..."
                    : editingTableId
                      ? "Update table"
                      : "Add table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReservationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <div className="panel w-full max-w-lg p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker">Reservation</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  {reservationTarget
                    ? `Table #${reservationTarget.number}`
                    : "Reserve table"}
                </h2>
              </div>
              <button
                onClick={closeReservationModal}
                className="rounded-2xl border border-stone-200 p-2 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleReservationSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Guest name
                  </label>
                  <input
                    type="text"
                    required
                    value={reservationForm.customerName}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        customerName: event.target.value,
                      }))
                    }
                    className="input-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={reservationForm.phone}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder={DEFAULT_PHONE_PLACEHOLDER}
                    className="input-primary"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Guest count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={reservationForm.partySize}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        partySize: event.target.value,
                      }))
                    }
                    className="input-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Source
                  </label>
                  <select
                    value={reservationForm.source}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        source: event.target.value,
                      }))
                    }
                    className="input-primary"
                  >
                    <option value="phone">Phone</option>
                    <option value="walk-in">Walk-in</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Reservation time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={reservationForm.reservationAt}
                  onChange={(event) =>
                    setReservationForm((current) => ({
                      ...current,
                      reservationAt: event.target.value,
                    }))
                  }
                  className="input-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  rows="3"
                  value={reservationForm.notes}
                  onChange={(event) =>
                    setReservationForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Birthday booking, terrace preference, special setup..."
                  className="input-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeReservationModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={reserveTableMut.isPending}
                >
                  {reserveTableMut.isPending
                    ? "Saving..."
                    : "Save reservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Booking = base44.entities.Booking;

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyForm = {
  customer_name: "",
  service: "",
  start_time: "",
  end_time: "",
  notes: "",
  status: "pending",
};

export default function BookingForm({ booking, onSaved, onCancel }) {
  const [form, setForm] = useState(() =>
    booking
      ? {
          customer_name: booking.customer_name || "",
          service: booking.service || "",
          start_time: toLocalInput(booking.start_time),
          end_time: toLocalInput(booking.end_time),
          notes: booking.notes || "",
          status: booking.status || "pending",
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.start_time) return;
    setSaving(true);
    try {
      const payload = {
        customer_name: form.customer_name.trim(),
        service: form.service.trim(),
        start_time: new Date(form.start_time).toISOString(),
        notes: form.notes.trim(),
        status: form.status,
      };
      if (form.end_time) {
        payload.end_time = new Date(form.end_time).toISOString();
      } else if (booking?.end_time) {
        payload.end_time = null;
      }
      if (booking?.id) {
        await Booking.update(booking.id, payload);
      } else {
        await Booking.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <Input
        value={form.customer_name}
        onChange={(e) => update("customer_name", e.target.value)}
        placeholder="Customer name"
        className="h-10"
      />
      <Input
        value={form.service}
        onChange={(e) => update("service", e.target.value)}
        placeholder="Service (e.g. haircut)"
        className="h-10"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-slate-500">
          Starts
          <Input
            type="datetime-local"
            value={form.start_time}
            onChange={(e) => update("start_time", e.target.value)}
            className="h-10 mt-1"
          />
        </label>
        <label className="text-xs text-slate-500">
          Ends
          <Input
            type="datetime-local"
            value={form.end_time}
            onChange={(e) => update("end_time", e.target.value)}
            className="h-10 mt-1"
          />
        </label>
      </div>
      <textarea
        value={form.notes}
        onChange={(e) => update("notes", e.target.value)}
        placeholder="Notes"
        rows={2}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <select
        value={form.status}
        onChange={(e) => update("status", e.target.value)}
        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <div className="flex gap-2">
        <Button type="button" onClick={handleSubmit} disabled={!form.customer_name.trim() || !form.start_time} className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800">
          {booking ? "Save changes" : "Add booking"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="h-10 px-4 rounded-xl">
          Cancel
        </Button>
      </div>
    </form>
  );
}
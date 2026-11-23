import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CalendarCheck } from "lucide-react";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

function formatRange(booking) {
  const start = new Date(booking.start_time);
  const date = start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (!booking.end_time) return `${date}, ${time}`;
  const end = new Date(booking.end_time);
  const endTime = end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const sameDay = end.toDateString() === start.toDateString();
  return sameDay
    ? `${date}, ${time} - ${endTime}`
    : `${date}, ${time} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${endTime}`;
}

export default function BookingRow({ booking, onEdit, onDelete }) {
  const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;

  return (
    <div className="group flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-800 truncate">{booking.customer_name}</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${statusStyle}`}>
            {booking.status || "pending"}
          </span>
          {booking.google_event_id && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
              <CalendarCheck className="w-3 h-3" /> In calendar
            </span>
          )}
        </div>
        {booking.service && <p className="text-sm text-slate-500 mt-0.5 truncate">{booking.service}</p>}
        <p className="text-xs text-slate-400 mt-1">{formatRange(booking)}</p>
        {booking.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{booking.notes}</p>}
      </div>
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(booking)}
          className="h-8 w-8 text-slate-400 hover:text-slate-700"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(booking.id)}
          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
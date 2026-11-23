import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays } from "lucide-react";
import BookingForm from "./BookingForm";
import BookingRow from "./BookingRow";

const Booking = base44.entities.Booking;

export default function BookingsSection() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchBookings = async () => {
    const page = await Booking.filter({}, { sort: "start_time", limit: 100 });
    setBookings(page.items || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (booking) => {
    setEditing(booking);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSaved = async () => {
    closeForm();
    await fetchBookings();
  };

  const handleDelete = async (id) => {
    await Booking.delete(id);
    fetchBookings();
  };

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <CalendarDays className="w-5 h-5 text-orange-500" />
          Bookings
        </h2>
        <Button onClick={openNew} className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {formOpen && (
        <div className="mb-4">
          <BookingForm booking={editing} onSaved={handleSaved} onCancel={closeForm} />
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-400">No bookings yet. Add one above.</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} onEdit={openEdit} onDelete={handleDelete} />
          ))
        )}
      </div>
    </section>
  );
}
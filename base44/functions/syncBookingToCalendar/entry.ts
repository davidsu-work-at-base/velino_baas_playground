import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const TIMEOUT = 20000;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { booking_id, event_type, google_event_id } = await req.json().catch(() => ({}));
    if (!booking_id) return Response.json({ error: 'booking_id is required' }, { status: 400 });

    let accessToken = null;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn?.accessToken || null;
    } catch (e) {
      accessToken = null;
    }
    if (!accessToken) return Response.json({ status: 'not_connected' });

    const authHeader = { Authorization: `Bearer ${accessToken}` };

    if (event_type === 'delete') {
      if (!google_event_id) return Response.json({ status: 'nothing_to_remove' });
      const delRes = await fetch(`${EVENTS_URL}/${encodeURIComponent(google_event_id)}`, {
        method: 'DELETE',
        headers: authHeader,
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (!delRes.ok && delRes.status !== 404 && delRes.status !== 410) {
        return Response.json({ status: 'calendar_error', code: delRes.status }, { status: 502 });
      }
      return Response.json({ status: 'deleted' });
    }

    const booking = await base44.asServiceRole.entities.Booking
      .get(booking_id)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
    if (!booking.start_time) return Response.json({ status: 'skipped', reason: 'missing start time' });

    const end = booking.end_time
      || new Date(new Date(booking.start_time).getTime() + 60 * 60 * 1000).toISOString();

    const event = {
      summary: booking.service ? `${booking.customer_name} - ${booking.service}` : booking.customer_name,
      description: booking.notes || '',
      start: { dateTime: booking.start_time },
      end: { dateTime: end },
    };

    const writeHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const eventId = booking.google_event_id || null;

    if (eventId) {
      const patchRes = await fetch(`${EVENTS_URL}/${encodeURIComponent(eventId)}`, {
        method: 'PATCH',
        headers: writeHeader,
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (patchRes.ok) return Response.json({ status: 'updated', event_id: eventId });
      if (patchRes.status !== 404 && patchRes.status !== 410) {
        return Response.json({ error: 'Google Calendar update failed' }, { status: 502 });
      }
    }

    const createRes = await fetch(EVENTS_URL, {
      method: 'POST',
      headers: writeHeader,
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!createRes.ok) {
      return Response.json({ error: 'Google Calendar rejected the event' }, { status: 502 });
    }
    const created = await createRes.json();
    await base44.asServiceRole.entities.Booking.update(booking_id, { google_event_id: created.id });

    return Response.json({ status: 'synced', event_id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
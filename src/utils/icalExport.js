// utils/icalExport.js
// Generates a .ics calendar file from a weekly route schedule.

function pad(n) { return String(n).padStart(2, '0'); }

function toICSDate(date) {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  );
}

const DAY_OFFSETS = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4 };

export function exportScheduleToICS(schedule, weekStartDate = new Date()) {
  // Snap to the next Monday
  const startDate = new Date(weekStartDate);
  const dow = startDate.getDay(); // 0=Sun, 1=Mon ...
  const daysUntilMonday = dow === 0 ? 1 : (8 - dow) % 7 || 7;
  startDate.setDate(startDate.getDate() + daysUntilMonday);
  startDate.setHours(8, 0, 0, 0); // Start at 8am

  const events = [];

  for (const day of schedule.week ?? []) {
    const offset  = DAY_OFFSETS[day.day] ?? 0;
    let currentMinutes = 0; // minutes from 8am

    for (const stop of day.stops) {
      currentMinutes += stop.driveMinutesFromPrevious || 0;

      const start = new Date(startDate);
      start.setDate(start.getDate() + offset);
      start.setMinutes(start.getMinutes() + currentMinutes);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30); // 30-min visit block

      const uid = `scout-${stop.id}-${Date.now()}@employbridge`;

      events.push([
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART:${toICSDate(start)}`,
        `DTEND:${toICSDate(end)}`,
        `SUMMARY:${stop.type === 'client' ? '✓ ' : ''}${stop.name}`,
        `LOCATION:${stop.address}`,
        stop.notes ? `DESCRIPTION:${stop.notes}` : '',
        'END:VEVENT',
      ].filter(Boolean).join('\r\n'));

      currentMinutes += 30; // account for visit time
    }
  }

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Scout//Territory Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `scout-route-${startDate.toISOString().split('T')[0]}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

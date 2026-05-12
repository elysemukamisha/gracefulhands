/**
 * Graceful Hands — Google Calendar Webhook
 * Deploy as: Apps Script Web App → Execute as "Me" → Anyone can access
 *
 * Called by the booking form via GET request with query parameters.
 * Creates an event directly in aubine.massage@gmail.com's calendar.
 */

function doGet(e) {
  try {
    var p = e.parameter;

    // Parse date ("Mon May 20 2026") and time ("10:00")
    var startDate = new Date(p.date);
    var timeParts = (p.time || '09:00').split(':');
    startDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);

    var duration = parseInt(p.duration || '60');
    var endDate = new Date(startDate.getTime() + duration * 60000);

    var title = (p.service || 'Massage') + ' — ' + (p.name || 'Client');

    var description = [
      '👤 Client: '    + (p.name  || 'N/A'),
      '📞 Phone: '     + (p.phone || 'N/A'),
      '📧 Email: '     + (p.email || 'N/A'),
      '',
      '💆 Service: '   + (p.service  || 'N/A'),
      '⏱ Duration: '        + duration + ' min',
      '💵 Total: $'    + (p.price || '0'),
      '',
      '📋 Intake',
      'Pressure: '               + (p.pressure || 'N/A'),
      'Focus Areas: '            + (p.focus    || 'None specified'),
      'Medical Notes: '          + (p.medical  || 'None'),
      '',
      'Source: Graceful Hands Website'
    ].join('\n');

    var calendar = CalendarApp.getDefaultCalendar();
    var event = calendar.createEvent(title, startDate, endDate, {
      description: description,
      location: 'Edmonton, Alberta'
    });

    event.setColor(CalendarApp.EventColor.GREEN);
    event.addEmailReminder(24 * 60); // 24 h before
    event.addPopupReminder(60);      // 1 h before

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, eventId: event.getId() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

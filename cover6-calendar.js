// Cover 6 calendar renderer
// Builds the visible calendar and MusicEvent schema from window.COVER6_GIGS.

(() => {
  const gigs = Array.isArray(window.COVER6_GIGS) ? window.COVER6_GIGS : [];
  const list = document.getElementById('cover6GigsList') || document.querySelector('.gigs-list');
  const empty = document.querySelector('.gigs-empty');
  if (!list) return;

  const tzOffset = '-05:00';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  function parseDate(date) {
    return new Date(`${date}T00:00:00`);
  }

  function addDays(dateString, days) {
    const d = parseDate(dateString);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function eventEndDate(gig) {
    if (!gig.endTime || !gig.startTime) return gig.date;
    return gig.endTime <= gig.startTime ? addDays(gig.date, 1) : gig.date;
  }

  function prettyTime(gig) {
    if (gig.displayTime) return gig.displayTime;
    if (!gig.startTime && !gig.endTime) return 'TBA';
    if (gig.startTime && !gig.endTime) return formatTime(gig.startTime);
    return `${formatTime(gig.startTime)} – ${formatTime(gig.endTime)}`;
  }

  function formatTime(value) {
    if (!value) return '';
    const [hRaw, mRaw] = value.split(':');
    let h = Number(hRaw);
    const m = Number(mRaw || '0');
    const suffix = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, '0')}${suffix}`;
  }

  function locationText(gig) {
    return gig.displayLocation || [gig.city, gig.state].filter(Boolean).join(', ');
  }

  function makeRow(gig) {
    const d = parseDate(gig.date);
    const row = document.createElement('div');
    row.className = 'gig-row reveal';
    row.dataset.date = gig.date;
    row.innerHTML = `
      <div class="gig-date"><span class="gig-month">${monthNames[d.getMonth()]}</span><span class="gig-day">${String(d.getDate()).padStart(2, '0')}</span><span class="gig-year">${d.getFullYear()}</span></div>
      <div class="gig-info"><h3 class="gig-venue">${escapeHtml(gig.venue)}</h3><p class="gig-location">${escapeHtml(locationText(gig))}</p><p class="gig-details">${escapeHtml(prettyTime(gig))}</p></div>
    `;
    return row;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));
  }

  const upcoming = gigs
    .filter(gig => gig.date && parseDate(gig.date) >= today)
    .sort((a, b) => `${a.date}T${a.startTime || '23:59'}`.localeCompare(`${b.date}T${b.startTime || '23:59'}`));

  list.innerHTML = '';
  upcoming.forEach(gig => list.appendChild(makeRow(gig)));

  if (empty) empty.style.display = upcoming.length > 0 ? 'none' : 'block';

  const events = upcoming.map(gig => ({
    '@type': 'MusicEvent',
    name: `Cover 6 Band Live at ${gig.venue}`,
    startDate: gig.startTime ? `${gig.date}T${gig.startTime}:00${tzOffset}` : gig.date,
    ...(gig.endTime ? { endDate: `${eventEndDate(gig)}T${gig.endTime}:00${tzOffset}` } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    description: `Cover 6 Band performs live at ${gig.venue}${locationText(gig) ? ` in ${locationText(gig)}` : ''}.`,
    image: 'https://www.cover6band.com/images/og-image.jpg',
    location: {
      '@type': 'Place',
      name: gig.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: gig.city || '',
        addressRegion: gig.state || 'LA',
        addressCountry: 'US'
      }
    },
    performer: {
      '@type': 'MusicGroup',
      name: 'Cover 6 Band',
      url: 'https://www.cover6band.com/'
    },
    organizer: {
      '@type': 'MusicGroup',
      name: 'Cover 6 Band',
      url: 'https://www.cover6band.com/'
    },
    offers: gig.status === 'private' ? undefined : {
      '@type': 'Offer',
      url: 'https://www.cover6band.com/#gigs',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    }
  })).map(event => Object.fromEntries(Object.entries(event).filter(([, value]) => value !== undefined)));

  const oldSchema = document.getElementById('cover6-generated-event-schema');
  if (oldSchema) oldSchema.remove();
  const schema = document.createElement('script');
  schema.type = 'application/ld+json';
  schema.id = 'cover6-generated-event-schema';
  schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': events }, null, 2);
  document.head.appendChild(schema);
})();

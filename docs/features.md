# Features & Requirements

## Functional requirements

### F1. Flight search
- Enter a flight number (format: 2 alphanumeric carrier code + 1–4 digit number, e.g. `AA100`, `BA2490`).
- Validate format **client-side** before sending the request.
- Re-validate **server-side** before hitting the upstream API.
- Show clear error messages for invalid input.

### F2. Flight detail view
For a given flight, show:
- Airline + flight number + status badge (En route / Scheduled / Landed / Delayed / Cancelled).
- Origin and destination IATA codes and city names.
- Scheduled vs actual departure time, gate.
- Scheduled vs estimated arrival time, gate.
- Live position (latitude, longitude, altitude, heading, ground speed) when airborne.
- Aircraft model and registration.
- A map showing origin, destination, route, and live position.
- Live weather at both origin and destination.

### F3. Tracked flights
- "Track this flight" button on the detail page.
- Tracked flights persist across browser sessions (localStorage).
- Home page shows a card for each tracked flight with status + progress bar.
- Cards auto-refresh every 60 seconds.
- Each card has an "Untrack" action.

### F4. Share link
- "Share link" button generates a URL like `/share/<random-id>`.
- The link is copied to clipboard automatically.
- Anyone with the link can view the flight read-only — no account needed.
- Links expire after 7 days.

### F5. Weather impact indicator
- Each weather card has a colour-coded left border:
  - **Green** = clear conditions for flight
  - **Amber** = caution (high wind 35–60 kph or visibility 2–8 km)
  - **Red** = severe (wind ≥ 60 kph or visibility < 2 km)

### F6. Progressive Web App
- Installable on desktop and mobile.
- Works offline for the shell (cached static assets).
- Custom theme color and icons.

---

## Non-functional requirements

### Performance
- Initial page load under 2 seconds on a typical connection.
- API responses under 800 ms p95.
- Use polling (30 s for detail, 60 s for cards) — no aggressive refreshing.

### Security & privacy
- API keys live only on the server. The client never sees them.
- All user input (flight numbers, free text) sanitized before storage.
- Rate limit per IP at 120 requests / minute.
- No third-party tracking; no analytics in v1.

### Accessibility
- All interactive elements reachable by keyboard.
- Form errors announced via `aria-describedby` and `role="alert"`.
- Sufficient color contrast (≥ 4.5:1 for body text).
- Don't rely on color alone for status — always pair with a text label.

### Browser support
- Latest 2 versions of Chrome, Firefox, Safari, Edge.
- Mobile Safari and Chrome Android.

### Code quality
- Each module has a clear owner (see README).
- All design values come from the token section at the top of `app.css` (no magic numbers / hex codes elsewhere).
- Validators shared between client and server (single source of truth).

---

## Acceptance criteria for "done"

A feature is done when:
1. It works with real (not mocked) data.
2. It has at least one happy-path manual test recorded.
3. Error states are handled (loading, error, empty).
4. CSS uses tokens from the top of `app.css`.
5. There's an `OWNER:` comment at the top of new files.
6. It's been merged to `main` via PR with at least one review.

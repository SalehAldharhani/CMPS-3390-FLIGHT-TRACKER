# Features & Requirements

## Functional Requirements

### F1. Flight Search

- Type in a flight number like `AA100` or `BA2490` (2 letters/numbers for the airline + 1 to 4 digits).
- The app checks the format before even sending a request (client-side).
- The server also checks the format again before calling the flight API (server-side).
- If the format is wrong, a clear error message is shown.

### F2. Flight Detail View

When you look up a flight, the app shows:

- Airline name, flight number, and a status badge (En route / Scheduled / Landed / Delayed / Cancelled).
- Where the flight is coming from and going to (airport code + city name).
- Departure time (scheduled vs actual) and gate.
- Arrival time (scheduled vs estimated) and gate.
- Live position (altitude, speed, heading) while the flight is in the air.
- Aircraft model and registration number.
- A globe map showing the route and live plane position.
- Current weather at both the departure and arrival airports.

### F3. Tracked Flights

- You can click "Track this flight" on any flight detail page.
- Your tracked flights are saved in the browser and stay there even if you close the tab.
- Each user only sees their own tracked flights — not other users'.
- The home page shows a card for each tracked flight with its status and a progress bar.
- Cards have a manual refresh button to get the latest data.
- Each card has an "Untrack" button to remove it.

### F4. Share Link

- Click "Share link" on any flight detail page to generate a unique URL.
- The link is automatically copied to your clipboard.
- Anyone with the link can view the flight — no account needed.
- Share links expire after 7 days.

### F5. Weather Impact Indicator

Each weather card has a color-coded left border showing flying conditions:

- **Green** = clear, good conditions
- **Amber** = caution (wind between 35–60 kph or visibility between 2–8 km)
- **Red** = severe (wind 60+ kph or visibility under 2 km)

### F6. Progressive Web App (PWA)

- The app can be installed on desktop and mobile like a native app.
- Basic shell works offline (cached static files).
- Has a custom icon and theme color.

### F7. Accounts (Sign Up / Sign In)

- Create an account with a username (3–20 characters, letters/numbers/underscores/hyphens) and a password (8+ characters).
- Existing users can sign back in anytime.
- Input is validated before submitting.
- Accounts are stored in your browser's localStorage — nothing is sent to a server.
- You must be signed in to search flights or use the home page.
- Share links (`/share/...`) are public — no account needed to view them.
- The header shows your username and a Sign Out button when you're logged in.
- Signing out ends your session but does not delete your account.
- Each user has their own separate tracked flights list.

**Note:** Accounts are for personalization only. Passwords are stored in plaintext in the browser — do not reuse a real password. Proper server-side auth is out of scope for this version.

---

## Non-Functional Requirements

### Performance

- Page should load in under 2 seconds on a normal connection.
- API responses should come back in under 800 ms.
- No automatic polling — users manually refresh flight data using the refresh button.

### Security & Privacy

- API keys are only stored on the server. The browser never sees them.
- All user input is sanitized before use.
- Rate limited to 120 requests per minute per IP address.
- No third-party tracking or analytics.

### Accessibility

- Everything works with a keyboard — no mouse required.
- Form errors are announced to screen readers.
- Text has enough color contrast to be readable.
- Status is always shown as text, not just color.

### Browser Support

- Works on the latest 2 versions of Chrome, Firefox, Safari, and Edge.
- Works on Mobile Safari and Chrome on Android.

---

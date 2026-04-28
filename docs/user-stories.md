# User Profiles & Stories

## Target audience

The app serves three overlapping personas:

### 1. The frequent flyer ("Maya")
Travels for work twice a month. Wants a fast way to check on her own connecting flight without digging through an airline app or a cluttered website.

### 2. The waiting family member ("Carlos")
Picking someone up from the airport. Doesn't have the airline app installed, doesn't want to install one. Just got a text saying "I'm on AA100" and wants to see when to leave for the airport.

### 3. The aviation enthusiast ("Sam")
Watches flights for fun. Likes seeing live position, weather, and details about the aircraft. Wants the experience to feel polished, not like a database dump.

---

## User stories

These drive the feature set. Each story uses the standard *As a … I want … so that …* form.

### Core

1. **As Maya**, I want to sign in once and have my tracked flights waiting for me whenever I open the app, so that I don't have to re-type flight numbers every visit.
2. **As Maya**, I want my tracked flights to persist when I close the tab, so that I can come back to them tomorrow without re-typing.
3. **As Carlos**, I want to open a link from a friend and see their live flight without creating an account, so that I can just figure out when to leave.
4. **As Sam**, I want to see the live position of a flight on a map with a great-circle route, so that the app feels like a real flight tracker.

### Weather context

5. **As Maya**, I want to see the weather at both my origin and destination airport, so that I can pack appropriately and anticipate delays.
6. **As Carlos**, I want a clear visual cue when weather is bad enough to delay a flight, so that I can adjust my pickup time.

### Sharing

7. **As Maya**, I want to send a one-tap shareable link to my partner, so that they can follow my flight without installing anything.
8. **As Carlos**, I want the shared link to show me a clean, read-only view, so that I'm not confused by tracking controls I don't need.

### Accounts

9. **As Maya**, I want to create a quick account with a username and password, so that my tracked flights are tied to me rather than just to this browser.
10. **As Maya**, I want to sign in and out, so that I can hand my laptop to a roommate without showing them my flights.
11. **As any user**, I want a clear error message if my password is wrong or my username is already taken, so that I don't have to guess what went wrong.
12. **As Carlos**, I do NOT want to be forced to sign up just to view a flight someone shared with me, so that I can use the link with zero friction.

### Quality / polish

13. **As Sam**, I want the app to look distinctive and intentional, so that I'd actually choose it over the generic alternatives.
14. **As any user**, I want the app to install to my home screen / desktop as a PWA, so that I can open it like a native app.
15. **As any user**, I want the app to be fast and respond instantly to invalid input (like "ZZZ999"), so that I don't waste time waiting for an error.

---

## Out of scope (for v1)

- Push notifications when a flight status changes — *nice to have, requires service worker + backend infra.*
- Real server-side authentication (database + bcrypt-hashed passwords + session tokens) — *we have local accounts in browser localStorage; real auth would be 10-20 hours and isn't on our spec list.*
- Cross-device account sync — *because accounts live in localStorage, signing in on a phone doesn't see laptop accounts.*
- Booking, ticketing, or commercial integrations.
- Historical flight data / trip log.

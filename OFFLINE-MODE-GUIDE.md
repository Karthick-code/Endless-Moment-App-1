# Offline access policy — Endless Moment Admin

- A fresh login still calls the backend and requires internet access.
- After a successful online login, the app saves a device-local offline access grant with a 7-day age limit.
- The app can reopen offline during that window and show the most recently cached leads and projects.
- Successful online fetches refresh the local cache.
- Explicit logout removes the offline access grant, so offline re-entry is not allowed after logout.
- Photo uploads to Cloudinary and server synchronization require internet.

## Important limitations

This implements offline reopening and cached viewing, not offline record creation/editing or synchronization. Project photos may not display offline unless the device's webview has already cached them. The bearer token is kept in browser local storage for offline session restoration; this is a practical compromise for the existing app, not hardware-backed secure storage. The backend remains the authority for server requests, and token expiration may require another online login.

For stronger production security, use native secure storage (Android Keystore via a Capacitor secure-storage plugin), encrypt locally cached business records, and implement a durable mutation queue with conflict handling before enabling offline edits.

// Base URL of the RollCore API. Set EXPO_PUBLIC_API_URL (see mobile/.env.example
// and eas.json). Expo inlines EXPO_PUBLIC_* variables at build time.
const raw = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_URL = (raw && raw.length > 0 ? raw : 'http://localhost:8080').replace(/\/+$/, '');

// Render's free tier sleeps after ~15 min idle; the first request can take ~50 s.
export const REQUEST_TIMEOUT_MS = 70_000;

// After this long without a response we tell the user the server is waking up.
export const SLOW_REQUEST_HINT_MS = 6_000;

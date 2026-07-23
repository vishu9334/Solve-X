/**
 * initAuth.js
 * -----------
 * This module runs ONCE at import time (before any React component mounts).
 * It attempts to refresh the access token using the HttpOnly refresh-token cookie.
 * The result is written directly into the Zustand store.
 *
 * All components then just READ from the store — no race conditions possible.
 */
import useAuthStore from "../features/auth/store/auth.store.js";
import { regenerateTokenApi } from "../features/auth/api/auth.api.js";

// This promise is the single source of truth for initialization.
// It is module-scoped, so it is created exactly once per page load.
export const authInitPromise = (async () => {
  const store = useAuthStore.getState();

  // If somehow a token is already in memory (e.g. hot reload), mark as done.
  if (store.accessToken) {
    store.setSessionInitialized();
    return;
  }

  try {
    const res = await regenerateTokenApi();
    if (res?.accessToken) {
      useAuthStore.getState().setAccessToken(res.accessToken);
    }
  } catch {
    // No valid refresh token cookie — user is not authenticated. That's fine.
  } finally {
    useAuthStore.getState().setSessionInitialized();
  }
})();

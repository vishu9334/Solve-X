import { create } from "zustand";
import { devtools } from "zustand/middleware";

const useAuthStore = create(
  devtools(
    (set) => ({
      accessToken: null,
      user: null,
      isCheckingSession: false,
      sessionInitialized: false,

      setAccessToken: (token) =>
        set({ accessToken: token }, false, "auth/setAccessToken"),

      setUser: (user) =>
        set({ user }, false, "auth/setUser"),

      setCheckingSession: (isCheckingSession) =>
        set({ isCheckingSession }, false, "auth/setCheckingSession"),

      setSessionInitialized: () =>
        set({ sessionInitialized: true }, false, "auth/setSessionInitialized"),

      logout: () =>
        set(
          {
            accessToken: null,
            user: null,
            isCheckingSession: false,
            sessionInitialized: true,
          },
          false,
          "auth/logout"
        ),
    }),
    {
      name: "AuthStore",
    }
  )
);

export default useAuthStore;

import { create } from "zustand";
import { devtools } from "zustand/middleware";

const useAuthStore = create(
  devtools(
    (set) => ({
      accessToken: null,
      user: null,
      isCheckingSession: false,

      setAccessToken: (token) =>
        set({ accessToken: token }, false, "auth/setAccessToken"),

      setUser: (user) =>
        set({ user }, false, "auth/setUser"),

      setCheckingSession: (isCheckingSession) =>
        set({ isCheckingSession }, false, "auth/setCheckingSession"),

      logout: () =>
        set(
          {
            accessToken: null,
            user: null,
            isCheckingSession: false,
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
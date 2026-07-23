import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { getCurrentUserApi } from "../api/auth.api";
import useAuthStore from "../store/auth.store";

export const useCurrentUser = () => {
  const setUser    = useAuthStore((state) => state.setUser);
  const logout     = useAuthStore((state) => state.logout);
  const accessToken          = useAuthStore((state) => state.accessToken);
  const storeUser            = useAuthStore((state) => state.user);
  const sessionInitialized   = useAuthStore((state) => state.sessionInitialized);

  // Only fetch /me once sessionInitialized (token refresh done) AND token exists
  const query = useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: getCurrentUserApi,
    enabled: !!accessToken && sessionInitialized,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  useEffect(() => {
    if (query.isError && accessToken) {
      logout();
    }
  }, [query.isError, accessToken, logout]);

  // isPending stays true until:
  //   1. initAuth.js has finished (sessionInitialized = true)
  //   2. AND if there's a token, the /me query has resolved (data or error)
  const user = query.data || storeUser;

  const isPending =
    (!sessionInitialized && !storeUser) ||
    (!!accessToken && !user && !query.isError);

  return {
    ...query,
    data: user,
    isPending,
  };
};

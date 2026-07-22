import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { getCurrentUserApi } from "../api/auth.api";
import useAuthStore from "../store/auth.store";

export const useCurrentUser = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const accessToken = useAuthStore((state) => state.accessToken);

  const query = useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: getCurrentUserApi,
    enabled: !!accessToken,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  useEffect(() => {
    if (query.isError) {
      logout();
    }
  }, [query.isError, logout]);

  return query;
};
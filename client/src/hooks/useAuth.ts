import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

function getLocalUser(): User | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("neuro_user") : null;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function useAuth() {
  const { data: user } = useQuery<User | null>({
    queryKey: ["local_auth_user"],
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => getLocalUser(),
  });

  return {
    user: user ?? null,
    isLoading: false,
    isAuthenticated: !!user,
  };
}

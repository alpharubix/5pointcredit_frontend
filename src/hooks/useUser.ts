import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/user";

export function useMe() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: getMe,
    staleTime: 1000 * 60 * 5, // 5 minutes — don't refetch on every navigation
    retry: 1,
  });
}

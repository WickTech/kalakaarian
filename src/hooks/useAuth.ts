import { useAuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const context = useAuthContext();
  
  return {
    ...context,
    isBrand: context.user?.role === "brand",
    isInfluencer: context.user?.role === "influencer",
    isAdmin: context.user?.role === "admin",
  };
}

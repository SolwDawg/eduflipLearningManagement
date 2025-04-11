import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Hook that periodically checks token expiration and logs out the user when expired
 * @param intervalMs - How often to check token validity (default: every minute)
 */
export const useTokenExpirationCheck = (intervalMs = 60000) => {
  const router = useRouter();

  useEffect(() => {
    // Function to check token validity
    const checkTokenValidity = async () => {
      if (typeof window === "undefined" || !window.Clerk) {
        return; // Skip check if no window or Clerk
      }

      try {
        // Try to get a fresh token
        const token = await window.Clerk.session?.getToken();

        if (!token) {
          // Token is expired or invalid - trigger logout
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

          try {
            await window.Clerk.signOut();
          } catch (error) {
            console.error("Error during sign out:", error);
          }

          router.push("/signin");
        }
      } catch (error) {
        console.error("Token validation error:", error);
      }
    };

    // Check token immediately on mount
    checkTokenValidity();

    // Set up periodic checks
    const intervalId = setInterval(checkTokenValidity, intervalMs);

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [router, intervalMs]);
};

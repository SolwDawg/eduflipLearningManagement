import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

/**
 * Custom hook that provides a function to check token expiration
 * before performing sensitive actions
 */
export const useTokenCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  const checkTokenBeforeAction = useCallback(
    async (action: Function) => {
      if (typeof window === "undefined" || !window.Clerk) {
        // Can't check token on server or if Clerk isn't available
        return action();
      }

      setIsChecking(true);

      try {
        // Try to get a fresh token from Clerk
        const token = await window.Clerk.session?.getToken();

        if (!token) {
          // Token is expired or invalid
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

          try {
            await window.Clerk.signOut();
          } catch (error) {
            console.error("Error during sign out:", error);
          }

          router.push("/signin");
          return;
        }

        // Token is valid, proceed with the action
        return action();
      } catch (error) {
        console.error("Token validation error:", error);
        toast.error("Lỗi xác thực. Vui lòng đăng nhập lại.");

        try {
          await window.Clerk.signOut();
        } catch (signOutError) {
          console.error("Error during sign out:", signOutError);
        }

        router.push("/signin");
      } finally {
        setIsChecking(false);
      }
    },
    [router]
  );

  return { checkTokenBeforeAction, isChecking };
};

// Adapted from shadcn/ui Toast component
// https://ui.shadcn.com/docs/components/toast

import { useContext } from "react";

interface ToastProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

// A simple mock implementation of the toast hook
export function useToast() {
  return {
    toast: (props: ToastProps) => {
      console.log("[Toast]", props.title, props.description);
      // In a real implementation, this would display a toast notification
    },
    dismiss: (toastId?: string) => {
      console.log("[Toast] dismiss", toastId);
    },
  };
}

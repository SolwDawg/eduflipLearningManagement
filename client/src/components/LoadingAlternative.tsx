import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingProps {
  variant?: "spinner" | "pulse" | "skeleton" | "border" | "minimal";
  text?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  className?: string;
}

const LoadingAlternative = ({
  variant = "spinner",
  text = "Loading...",
  size = "md",
  fullScreen = false,
  className,
}: LoadingProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center gap-2",
    fullScreen && "fixed inset-0 bg-background/50",
    className
  );

  const renderLoadingIndicator = () => {
    switch (variant) {
      case "pulse":
        return (
          <div className="space-y-2">
            <Skeleton
              className={cn("rounded-md bg-primary/10", sizeClasses[size])}
            />
            {text && <Skeleton className="h-4 w-24 rounded-md bg-primary/10" />}
          </div>
        );
      case "skeleton":
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
            {text && <Skeleton className="h-4 w-24 mt-2" />}
          </div>
        );
      case "border":
        return (
          <>
            <div
              className={cn(
                "animate-spin rounded-full border-t-2 border-b-2 border-primary",
                sizeClasses[size]
              )}
            />
            {text && (
              <span className="text-sm font-medium text-primary-700">
                {text}
              </span>
            )}
          </>
        );
      case "minimal":
        return (
          <div
            className={cn(
              "animate-spin rounded-full border-2 border-primary border-t-transparent",
              sizeClasses[size]
            )}
          />
        );
      case "spinner":
      default:
        return (
          <>
            <Loader2
              className={cn("animate-spin text-primary", sizeClasses[size])}
            />
            {text && (
              <span className="text-sm font-medium text-primary-700">
                {text}
              </span>
            )}
          </>
        );
    }
  };

  return <div className={containerClasses}>{renderLoadingIndicator()}</div>;
};

export default LoadingAlternative;

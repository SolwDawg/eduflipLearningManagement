import React from "react";
import { GripVertical } from "lucide-react";
import { ResizableHandle } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

interface CustomResizableHandleProps {
  withHandle?: boolean;
  className?: string;
  hidden?: boolean;
}

export function CustomResizableHandle({
  withHandle = true,
  className,
  hidden = false,
}: CustomResizableHandleProps) {
  return (
    <ResizableHandle
      className={cn(
        "relative flex w-1.5 items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[hover]:bg-primary/20",
        hidden && "hidden md:flex",
        className
      )}
      withHandle={false}
    >
      {withHandle && (
        <div className="z-10 flex h-8 w-2 items-center justify-center rounded-sm border bg-background">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </ResizableHandle>
  );
}

"use client";
import AppSidebar from "@/components/AppSidebar";
import Loading from "@/components/Loading";
import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ChaptersSidebar from "./courses/[courseId]/ChaptersSidebar";
import { Toaster } from "sonner";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import SmartSearch from "@/components/SmartSearch";
import { UserButton } from "@clerk/nextjs";
import StudentSidebar from "@/components/StudentSidebar";
import { useTokenExpirationCheck } from "@/hooks/useTokenExpirationCheck";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [courseId, setCourseId] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const isMobile = useIsMobile();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isCoursePage = /^\/user\/courses\/[^\/]+(?:\/chapters\/[^\/]+)?$/.test(
    pathname
  );

  // Check token periodically (every 2 minutes)
  useTokenExpirationCheck(120000);

  useEffect(() => {
    if (isCoursePage) {
      const match = pathname.match(/\/user\/courses\/([^\/]+)/);
      setCourseId(match ? match[1] : null);
    } else {
      setCourseId(null);
    }
  }, [isCoursePage, pathname]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/signin");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) return <Loading />;
  if (!user) return null;

  // Mobile layout
  if (isMobile) {
    return (
      <div className="dashboard flex flex-col h-screen">
        <Navbar isCoursePage={isCoursePage}>
          <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
            <SheetTrigger asChild>
              <button
                className="p-2 text-muted-foreground hover:text-foreground"
                aria-label="Menu"
              >
                <Menu size={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
              <StudentSidebar />
              {courseId && <ChaptersSidebar />}
            </SheetContent>
          </Sheet>
        </Navbar>
        <main className="dashboard__body flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    );
  }

  // Desktop layout with resizable panels
  return (
    <SidebarProvider>
      <ResizablePanelGroup
        direction="horizontal"
        className="dashboard min-h-screen"
      >
        {/* Student Sidebar Panel - fixed minimum width */}
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={25}
          className="hidden md:block"
        >
          <StudentSidebar />
        </ResizablePanel>

        {/* Resizable handle between main sidebar and content */}
        <ResizableHandle withHandle />

        {/* Content area with optional chapter sidebar */}
        {courseId ? (
          <ResizablePanelGroup direction="horizontal">
            {/* Chapters sidebar */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
              <ChaptersSidebar />
            </ResizablePanel>

            {/* Resizable handle between chapter sidebar and main content */}
            <ResizableHandle withHandle />

            {/* Main content area */}
            <ResizablePanel defaultSize={75}>
              <div className="flex flex-col h-screen">
                <Navbar isCoursePage={isCoursePage} />
                <main className="dashboard__body flex-1 overflow-auto p-4">
                  {children}
                </main>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          /* Main content without chapter sidebar */
          <ResizablePanel defaultSize={80}>
            <div className="flex flex-col h-screen">
              <Navbar isCoursePage={isCoursePage} />
              <main className="dashboard__body flex-1 overflow-auto p-4">
                {children}
              </main>
            </div>
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </SidebarProvider>
  );
}

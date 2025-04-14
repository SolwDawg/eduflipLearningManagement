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
import MobileNavigation from "@/components/MobileNavigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CustomResizableHandle } from "@/components/ui/custom-resizable-handle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [courseId, setCourseId] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const isCoursePage = /^\/user\/courses\/[^\/]+(?:\/chapters\/[^\/]+)?$/.test(
    pathname
  );

  // Default sidebar sizes with localStorage support
  const [navSize, setNavSize] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("navSize");
      return saved ? parseInt(saved) : 15;
    }
    return 15;
  });

  const [contentSize, setContentSize] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("contentSize");
      return saved ? parseInt(saved) : 85;
    }
    return 85;
  });

  const [chaptersSize, setChaptersSize] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chaptersSize");
      return saved ? parseInt(saved) : 20;
    }
    return 20;
  });

  const [mainContentSize, setMainContentSize] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mainContentSize");
      return saved ? parseInt(saved) : 80;
    }
    return 80;
  });

  // Save sizes to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("navSize", navSize.toString());
      localStorage.setItem("contentSize", contentSize.toString());
      localStorage.setItem("chaptersSize", chaptersSize.toString());
      localStorage.setItem("mainContentSize", mainContentSize.toString());
    }
  }, [navSize, contentSize, chaptersSize, mainContentSize]);

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

  return (
    <SidebarProvider>
      <ResizablePanelGroup
        direction="horizontal"
        className="h-screen w-full overflow-hidden"
      >
        {/* Navigation sidebar - hidden on mobile */}
        <ResizablePanel
          defaultSize={navSize}
          minSize={10}
          maxSize={25}
          className="hidden md:block"
          onResize={(size) => setNavSize(size)}
        >
          <StudentSidebar />
        </ResizablePanel>

        <CustomResizableHandle hidden withHandle />

        {/* Content area with conditional chapters sidebar */}
        <ResizablePanel
          defaultSize={contentSize}
          onResize={(size) => setContentSize(size)}
        >
          {courseId ? (
            <ResizablePanelGroup direction="horizontal">
              {/* Chapters sidebar - only visible when in a course */}
              <ResizablePanel
                defaultSize={chaptersSize}
                minSize={15}
                maxSize={30}
                className="hidden md:block"
                onResize={(size) => setChaptersSize(size)}
              >
                <ChaptersSidebar />
              </ResizablePanel>

              <CustomResizableHandle hidden withHandle />

              {/* Main content area */}
              <ResizablePanel
                defaultSize={mainContentSize}
                onResize={(size) => setMainContentSize(size)}
              >
                <div className="flex flex-col h-full overflow-hidden">
                  <Navbar isCoursePage={isCoursePage} />
                  <main className="flex-1 overflow-y-auto p-4 pb-16 md:pb-4">
                    {children}
                  </main>
                  <MobileNavigation />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <Navbar isCoursePage={isCoursePage} />
              <main className="flex-1 overflow-y-auto p-4 pb-16 md:pb-4">
                {children}
              </main>
              <MobileNavigation />
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </SidebarProvider>
  );
}

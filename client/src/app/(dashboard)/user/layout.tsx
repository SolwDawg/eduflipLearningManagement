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
      <div className="flex h-screen w-full overflow-hidden">
        <StudentSidebar />
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          {courseId && <ChaptersSidebar />}
          <div
            className={cn(
              "flex flex-col flex-1 overflow-y-auto",
              isCoursePage && "md:pl-0"
            )}
          >
            <Navbar isCoursePage={isCoursePage} />
            <main className="flex-1 overflow-y-auto p-4 pb-16 md:pb-4">
              {children}
            </main>
            <MobileNavigation />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

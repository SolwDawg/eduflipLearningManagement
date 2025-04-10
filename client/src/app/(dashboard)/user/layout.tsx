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
      <div className="dashboard">
        <StudentSidebar />
        <div className="dashboard__content">
          {courseId && <ChaptersSidebar />}
          <div
            className={cn(
              "dashboard__main",
              isCoursePage && "dashboard__main--not-course"
            )}
            style={{ height: "100vh" }}
          >
            <Navbar isCoursePage={isCoursePage} />
            <main className="dashboard__body">{children}</main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

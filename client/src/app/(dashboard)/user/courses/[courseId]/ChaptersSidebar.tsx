"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useGetCourseQuery, useGetUserCourseProgressQuery } from "@/state/api";
import { useUser } from "@clerk/nextjs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Lock, Play, BookOpen, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ChaptersSidebar() {
  const { courseId, chapterId } = useParams();
  const pathname = usePathname();
  const { user } = useUser();
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're in a mobile viewport on component mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for resize
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { data: course, isLoading: isLoadingCourse } = useGetCourseQuery(
    courseId as string
  );

  const { data: progress } = useGetUserCourseProgressQuery(
    { userId: user?.id || "", courseId: courseId as string },
    { skip: !user?.id }
  );

  if (isLoadingCourse)
    return (
      <div className="w-full h-full border-r p-3 sm:p-4 flex flex-col">
        <Skeleton className="h-5 sm:h-6 w-3/4 mb-1 sm:mb-2" />
        <Skeleton className="h-3 sm:h-4 w-1/2 mb-4 sm:mb-6" />
        <div className="space-y-3 sm:space-y-4 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5 sm:space-y-2">
              <Skeleton className="h-4 sm:h-5 w-2/3 mb-1 sm:mb-2" />
              <div className="space-y-1 sm:space-y-1.5">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-7 sm:h-8 w-full rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (!course)
    return (
      <div className="p-3 sm:p-4 text-muted-foreground text-xs sm:text-sm h-full flex flex-col items-center justify-center">
        Không tìm thấy khóa học
      </div>
    );

  // Function to check if a chapter is completed
  const isChapterCompleted = (chapterId: string) => {
    if (!progress?.completedChapters) return false;
    return progress.completedChapters.includes(chapterId);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r overflow-hidden">
      <div className="p-3 sm:p-4 border-b flex-shrink-0 bg-white">
        <h3 className="font-medium text-sm sm:text-base md:text-lg truncate">
          {course.title}
        </h3>
        <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1">
          <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span>Nội dung khóa học</span>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto" type="auto">
        <div className="p-2 sm:p-3 md:p-4">
          {course.sections?.map((section, sectionIndex) => (
            <div
              key={section.sectionId}
              className="mb-3 sm:mb-4 md:mb-6 last:mb-2"
            >
              <h4 className="font-medium mb-1.5 sm:mb-2 md:mb-3 text-xs sm:text-sm text-muted-foreground uppercase tracking-wide flex items-center">
                <span>Section {sectionIndex + 1}:</span>
                <span className="ml-1 truncate">{section.sectionTitle}</span>
              </h4>
              <ul className="space-y-1 sm:space-y-1.5">
                {section.chapters.map((chapter, chapterIndex) => {
                  const isActive = chapter.chapterId === chapterId;
                  const isCompleted = isChapterCompleted(chapter.chapterId);

                  return (
                    <li key={chapter.chapterId}>
                      <Link
                        href={`/user/courses/${courseId}/chapters/${chapter.chapterId}`}
                        className={cn(
                          "flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-2.5 text-xs sm:text-sm rounded-md transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                          {isCompleted ? (
                            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                          ) : isActive ? (
                            <Play
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary"
                              fill="currentColor"
                            />
                          ) : (
                            <div className="h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-full border border-muted-foreground/60 flex items-center justify-center text-[9px] sm:text-[10px] md:text-xs">
                              {chapterIndex + 1}
                            </div>
                          )}
                        </div>
                        <span className="flex-1 truncate">{chapter.title}</span>
                        {isCompleted && !isActive && (
                          <span className="hidden sm:flex text-[9px] md:text-xs font-medium text-green-500 px-1 py-0.5 rounded-full bg-green-50">
                            Đã Hoàn thành
                          </span>
                        )}
                        {isMobile && isCompleted && !isActive && (
                          <CheckCircle className="sm:hidden h-3 w-3 text-green-500 flex-shrink-0" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

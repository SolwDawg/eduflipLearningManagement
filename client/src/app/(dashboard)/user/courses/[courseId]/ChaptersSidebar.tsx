"use client";

import React from "react";
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
  const isMobile =
    typeof window !== "undefined" ? window.innerWidth < 768 : false;

  const { data: course, isLoading: isLoadingCourse } = useGetCourseQuery(
    courseId as string
  );

  const { data: progress } = useGetUserCourseProgressQuery(
    { userId: user?.id || "", courseId: courseId as string },
    { skip: !user?.id }
  );

  if (isLoadingCourse)
    return (
      <div className="w-full h-full border-r p-3 sm:p-4">
        <Skeleton className="h-6 sm:h-7 w-3/4 mb-1 sm:mb-2" />
        <Skeleton className="h-3 sm:h-4 w-1/2 mb-4 sm:mb-6" />
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5 sm:space-y-2">
              <Skeleton className="h-4 sm:h-5 w-2/3 mb-1 sm:mb-2" />
              <div className="space-y-1">
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
      <div className="p-3 sm:p-4 text-muted-foreground text-sm">
        Course not found
      </div>
    );

  // Function to check if a chapter is completed
  const isChapterCompleted = (chapterId: string) => {
    if (!progress?.completedChapters) return false;
    return progress.completedChapters.includes(chapterId);
  };

  return (
    <div className="flex flex-col">
      <div className="p-3 sm:p-4 border-b flex-shrink-0">
        <h3 className="font-medium text-base sm:text-lg truncate">
          {course.title}
        </h3>
        <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1">
          <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span>Course content</span>
        </div>
      </div>

      <ScrollArea
        className="flex-1 h-[calc(100vh-5rem)] sm:h-[calc(100vh-7rem)]"
        type="auto"
      >
        <div className="p-3 sm:p-4">
          {course.sections?.map((section, sectionIndex) => (
            <div key={section.sectionId} className="mb-4 sm:mb-6 last:mb-2">
              <h4 className="font-medium mb-2 sm:mb-3 text-xs sm:text-sm text-muted-foreground uppercase tracking-wide flex items-center">
                <span>Section {sectionIndex + 1}:</span>
                <span className="ml-1 truncate">{section.sectionTitle}</span>
              </h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {section.chapters.map((chapter, chapterIndex) => {
                  const isActive = chapter.chapterId === chapterId;
                  const isCompleted = isChapterCompleted(chapter.chapterId);

                  return (
                    <li key={chapter.chapterId}>
                      <Link
                        href={`/user/courses/${courseId}/chapters/${chapter.chapterId}`}
                        className={cn(
                          "flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 text-xs sm:text-sm rounded-md transition-colors",
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
                            <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border border-muted-foreground/60 flex items-center justify-center text-[10px] sm:text-xs">
                              {chapterIndex + 1}
                            </div>
                          )}
                        </div>
                        <span className="flex-1 truncate">{chapter.title}</span>
                        {isCompleted && !isActive && (
                          <span className="hidden sm:flex text-xs font-medium text-green-500 px-1.5 py-0.5 rounded-full bg-green-50">
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

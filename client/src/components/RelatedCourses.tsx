"use client";

import { useGetRelatedCoursesQuery } from "@/state/api";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";
import { BookOpen } from "lucide-react";

interface RelatedCoursesProps {
  categorySlug: string;
  currentCourseId: string;
}

export default function RelatedCourses({
  categorySlug,
  currentCourseId,
}: RelatedCoursesProps) {
  const router = useRouter();
  const {
    data: relatedCoursesData,
    isLoading,
    isError,
  } = useGetRelatedCoursesQuery(categorySlug);

  // Filter out the current course and only show up to 3 related courses
  const relatedCourses = relatedCoursesData?.data
    ?.filter((course: Course) => course.courseId !== currentCourseId)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold">Các khóa học liên quan</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-20 w-28 rounded-md" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !relatedCourses || relatedCourses.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold">Các khóa học liên quan</h3>
      <div className="space-y-4">
        {relatedCourses.map((course: Course) => (
          <div
            key={course.courseId}
            className="flex gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="relative h-20 w-28 min-w-28 rounded-md overflow-hidden">
              {course.image ? (
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  <BookOpen size={24} className="text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between flex-1">
              <div>
                <h4 className="font-medium line-clamp-1">{course.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {course.description}
                </p>
              </div>
              <Link
                href={`/user/courses/${course.courseId}`}
                className="self-start"
              >
                <Button size="sm" variant="outline">
                  Xem khóa học
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

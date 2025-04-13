"use client";

import React from "react";
import TeacherCourseTracker from "@/components/teacher/TeacherCourseTracker";
import PageTitle from "@/components/PageTitle";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useGetCourseQuery } from "@/state/api";
import LoadingAlternative from "@/components/LoadingAlternative";

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const { data: course, isLoading } = useGetCourseQuery(courseId);

  if (isLoading) {
    return <LoadingAlternative />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/teacher/course-tracker")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageTitle title={course?.title || "Chi tiết khoá học"} />
        </div>
      </div>

      <TeacherCourseTracker courseId={courseId} />
    </div>
  );
}

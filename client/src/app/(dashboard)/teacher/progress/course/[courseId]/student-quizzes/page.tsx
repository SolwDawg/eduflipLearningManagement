"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { ChevronLeft } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import CourseQuizResults from "@/components/CourseQuizResults";
import { useGetCourseQuery } from "@/state/api";

export default function StudentQuizzesPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { data: course, isLoading } = useGetCourseQuery(courseId as string);
  const [courseTitle, setCourseTitle] = useState<string>("Loading...");

  useEffect(() => {
    if (course && course.title) {
      setCourseTitle(course.title);
    }
  }, [course]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Breadcrumb className="text-white">
              <BreadcrumbItem>
                <BreadcrumbLink href="/teacher/progress">
                  Tiến độ
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/teacher/progress/course/${courseId}`}>
                  {isLoading ? "" : courseTitle}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink>Bài kiểm tra</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
            <PageTitle
              title="Kết quả bài kiểm tra"
              description="Xem kết quả bài kiểm tra và hiệu suất của tất cả học sinh"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Button>
        </div>

        <CourseQuizResults courseId={courseId as string} />
      </div>
    </div>
  );
}

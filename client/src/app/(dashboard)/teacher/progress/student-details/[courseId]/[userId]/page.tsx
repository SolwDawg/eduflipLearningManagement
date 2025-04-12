"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import StudentProgressDetails from "@/components/teacher/StudentProgressDetails";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle } from "lucide-react";
import { useGetCourseQuery } from "@/state/api";
import { useGetUserQuery } from "@/state/api";
import LoadingAlternative from "@/components/LoadingAlternative";

const StudentProgressDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const userId = params.userId as string;

  const [username, setUsername] = useState<string>("Student");
  const [courseTitle, setCourseTitle] = useState<string>("Course");

  const { data: courseData, isLoading: isLoadingCourse } =
    useGetCourseQuery(courseId);
  const { data: userData, isLoading: isLoadingUser } = useGetUserQuery(userId);

  useEffect(() => {
    if (userData && userData.data) {
      const user = userData.data;
      setUsername(user.fullName || user.username || "Học sinh");
    }

    if (courseData) {
      setCourseTitle(courseData.title || "Khóa học");
    }
  }, [userData, courseData]);

  const handleBack = () => {
    router.back();
  };

  const handleGoToCourseAnalytics = () => {
    router.push(`/teacher/progress/course/${courseId}`);
  };

  const isLoading = isLoadingCourse || isLoadingUser;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {isLoading ? (
              <LoadingAlternative variant="skeleton" size="sm" />
            ) : (
              <>
                <UserCircle className="h-6 w-6 text-primary" />
                Tiến độ học tập của {username}
              </>
            )}
          </h1>
        </div>
        <Button variant="outline" onClick={handleGoToCourseAnalytics}>
          Phân tích khóa học
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <LoadingAlternative variant="skeleton" size="lg" />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1">
              Khóa học: {courseTitle}
            </h2>
            <p className="text-muted-foreground">
              Phân tích chi tiết tiến độ học tập của học sinh trong khóa học
            </p>
          </div>

          <StudentProgressDetails courseId={courseId} userId={userId} />
        </>
      )}
    </div>
  );
};

export default StudentProgressDetailsPage;

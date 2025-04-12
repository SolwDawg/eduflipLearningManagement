"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  ChevronRight,
  Users,
  BookOpen,
  MessageSquare,
  FileText,
  RefreshCw,
} from "lucide-react";
import PageTitle from "@/components/PageTitle";
import { Progress } from "@/components/ui/progress";
import { useGetAllTeacherCoursesWithAnalyticsQuery } from "@/state/api";

interface CourseProgress {
  id: string;
  title: string;
  studentCount: number;
  averageProgress: number;
  completionRate: number;
  materialAccessCount: number;
  quizAverage: number;
  discussionPostCount: number;
}

const TeacherProgressPage = () => {
  const router = useRouter();

  // Use the combined RTK Query hook for fetching courses with analytics
  const {
    data: coursesWithAnalytics,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllTeacherCoursesWithAnalyticsQuery();

  // Convert the raw API response to the format needed for display
  const courses =
    coursesWithAnalytics?.map((course: any) => ({
      id: course.courseId || course.id,
      title: course.title,
      studentCount: course.studentCount || 0,
      averageProgress: course.averageProgress || 0,
      completionRate: course.completionRate || 0,
      materialAccessCount: course.materialAccessCount || 0,
      quizAverage: course.quizAverage || 0,
      discussionPostCount: course.discussionPostCount || 0,
    })) || [];

  const handleRefresh = () => {
    refetch();
  };

  const viewCourseProgress = (courseId: string) => {
    router.push(`/teacher/progress/course/${courseId}`);
  };

  const isRefreshing = isFetching && !isLoading;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Phân tích tiến độ học tập</h1>
          <p className="text-muted-foreground">
            Theo dõi tiến độ học tập của học sinh trong từng khóa học của bạn
          </p>
        </div>
        <Button
          onClick={() => router.push("/teacher/progress/all-students")}
          className="flex items-center"
        >
          <Users className="mr-2 h-4 w-4" />
          Xem tiến độ tất cả học sinh
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <PageTitle title="Tiến độ học sinh" />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Đang làm mới..." : "Làm mới dữ liệu"}
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center my-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium">Không tìm thấy khóa học</h3>
          <p className="text-muted-foreground mt-2">
            Tạo khóa học để bắt đầu theo dõi tiến độ học sinh
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {courses.map((course: CourseProgress) => (
            <Card
              key={course.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-2">
                <CardTitle>{course.title}</CardTitle>
                <CardDescription className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{course.studentCount} học sinh đã đăng ký</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tiến độ trung bình</span>
                      <span className="font-medium">
                        {Math.round(course.averageProgress)}%
                      </span>
                    </div>
                    <Progress value={course.averageProgress} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tỷ lệ hoàn thành bài kiểm tra</span>
                      <span className="font-medium">
                        {Math.round(course.completionRate)}%
                      </span>
                    </div>
                    <Progress value={course.completionRate} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="flex flex-col items-center p-2 rounded-md">
                      <BookOpen className="h-5 w-5 text-blue-500 mb-1" />
                      <span className="text-xs text-center">
                        Lượt xem tài liệu
                      </span>
                      <span className="font-semibold">
                        {course.materialAccessCount}
                      </span>
                    </div>

                    <div className="flex flex-col items-center p-2 rounded-md">
                      <FileText className="h-5 w-5 text-green-500 mb-1" />
                      <span className="text-xs text-center">
                        Điểm trung bình bài kiểm tra
                      </span>
                      <span className="font-semibold">
                        {Math.round(course.quizAverage)}%
                      </span>
                    </div>

                    <div className="flex flex-col items-center p-2 rounded-md">
                      <MessageSquare className="h-5 w-5 text-purple-500 mb-1" />
                      <span className="text-xs text-center">
                        Số bài viết trong thảo luận
                      </span>
                      <span className="font-semibold">
                        {course.discussionPostCount}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-2 flex justify-between items-center"
                    onClick={() => viewCourseProgress(course.id)}
                  >
                    <span className="flex items-center">
                      <BarChart className="mr-2 h-4 w-4" />
                      Xem phân tích chi tiết
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherProgressPage;

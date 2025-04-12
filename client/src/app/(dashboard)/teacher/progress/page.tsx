"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
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
import { StudentProgressAnalytics } from "@/lib/studentProgressApi";

interface CourseProgress {
  id: string;
  title: string;
  studentCount: number;
  averageProgress: number;
  completionRate: number;
  materialAccessCount: number;
  quizAverage: number;
  discussionPostCount: number;
  isPlaceholder: boolean;
}

// Add a function to create default analytics data
const createDefaultAnalytics = (
  courseId: string
): StudentProgressAnalytics => ({
  totalStudents: 0,
  averageProgress: 0,
  materialAccessData: {
    totalAccesses: 0,
    averageAccessesPerStudent: 0,
    studentsWithNoAccess: 0,
  },
  quizData: {
    averageScore: 0,
    studentsWithNoQuizzes: 0,
    completionRate: 0,
  },
  discussionData: {
    totalPosts: 0,
    averagePostsPerStudent: 0,
    participationLevels: { high: 0, medium: 0, low: 0, none: 0 },
  },
  studentDetails: [],
});

const TeacherProgressPage = () => {
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchCourses = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Fetch teacher's courses
      const coursesResponse = await axios.get("/api/teacher/courses");

      // If no courses, show empty state
      if (!coursesResponse.data || coursesResponse.data.length === 0) {
        console.log("No courses found for teacher");
        setCourses([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log(`Found ${coursesResponse.data.length} courses for teacher`);

      const coursesWithAnalytics = await Promise.all(
        coursesResponse.data.map(async (course: any) => {
          try {
            console.log(`Fetching analytics for course ${course.id}`);
            const analyticsResponse = await axios.get(
              `/api/progress/analytics/course/${course.id}`
            );

            if (analyticsResponse.data && analyticsResponse.data.data) {
              console.log(`Using real analytics data for course ${course.id}`);
              const analytics = analyticsResponse.data.data;

              return {
                id: course.id,
                title: course.title,
                studentCount: analytics.totalStudents || 0,
                averageProgress: analytics.averageProgress || 0,
                completionRate: analytics.quizData?.completionRate || 0,
                materialAccessCount:
                  analytics.materialAccessData?.totalAccesses || 0,
                quizAverage: analytics.quizData?.averageScore || 0,
                discussionPostCount: analytics.discussionData?.totalPosts || 0,
                isPlaceholder: false,
              };
            } else {
              console.warn(
                `Empty or invalid analytics response for course ${course.id}, using placeholder data`
              );
              const placeholderData = createDefaultAnalytics(course.id);

              return {
                id: course.id,
                title: course.title,
                studentCount: placeholderData.totalStudents,
                averageProgress: placeholderData.averageProgress,
                completionRate: placeholderData.quizData.completionRate,
                materialAccessCount:
                  placeholderData.materialAccessData.totalAccesses,
                quizAverage: placeholderData.quizData.averageScore,
                discussionPostCount: placeholderData.discussionData.totalPosts,
                isPlaceholder: true,
              };
            }
          } catch (error) {
            // More detailed error logging
            if (axios.isAxiosError(error) && error.response) {
              console.error(
                `Failed to fetch analytics for course ${course.id}: HTTP ${error.response.status}`,
                error.response.data || "No response data"
              );
            } else {
              console.error(
                `Failed to fetch analytics for course ${course.id}:`,
                error
              );
            }

            const placeholderData = createDefaultAnalytics(course.id);

            return {
              id: course.id,
              title: course.title,
              studentCount: placeholderData.totalStudents,
              averageProgress: placeholderData.averageProgress,
              completionRate: placeholderData.quizData.completionRate,
              materialAccessCount:
                placeholderData.materialAccessData.totalAccesses,
              quizAverage: placeholderData.quizData.averageScore,
              discussionPostCount: placeholderData.discussionData.totalPosts,
              isPlaceholder: true,
            };
          }
        })
      );

      setCourses(coursesWithAnalytics);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error(
            `Failed to fetch courses: HTTP ${error.response.status}`,
            error.response.data || "No response data"
          );
        } else if (error.request) {
          console.error(
            "Failed to fetch courses: No response received",
            error.request
          );
        } else {
          console.error(`Failed to fetch courses: ${error.message}`);
        }
      } else {
        console.error("Failed to fetch courses:", error);
      }

      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchCourses(true);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const viewCourseProgress = (courseId: string) => {
    router.push(`/teacher/progress/course/${courseId}`);
  };

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
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Đang làm mới..." : "Làm mới dữ liệu"}
          </Button>
        </div>
      </div>
      {loading ? (
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
          {courses.map((course) => (
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

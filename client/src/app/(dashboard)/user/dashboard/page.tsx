"use client";

import React from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileText,
  Award,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import PageTitle from "@/components/PageTitle";
import LoadingAlternative from "@/components/LoadingAlternative";
import { formatDateString, formatDistanceToNow } from "@/lib/utils";
import { useGetUserDashboardQuery } from "@/state/api";

interface EnrolledCourse {
  courseId: string;
  title: string;
  image: string;
  teacherName: string;
  level: string;
  enrollmentDate: string;
  lastAccessedTimestamp: string | null;
  overallProgress: number;
  totalChapters: number;
  completedChapters: number;
}

interface QuizResult {
  quizId: string;
  quizTitle: string;
  sectionTitle: string;
  courseId: string;
  courseTitle: string;
  score: number;
  passingScore: number;
  passed: boolean;
  completedAt: string;
  timeSpent: number;
}

interface OverallStats {
  totalCourses: number;
  coursesInProgress: number;
  coursesCompleted: number;
  averageScore: number;
}

interface DashboardData {
  enrolledCourses: EnrolledCourse[];
  quizResults: QuizResult[];
  overallStats: OverallStats;
}

export default function UserDashboardPage() {
  const { userId } = useAuth();
  const router = useRouter();

  const { data: dashboard, isLoading } = useGetUserDashboardQuery(
    userId as string,
    { skip: !userId }
  );
  console.log("dashboard raw: ", dashboard);

  if (!userId) {
    return <div>Đăng nhập để xem tiến độ của bạn.</div>;
  }

  if (isLoading) {
    return <LoadingAlternative />;
  }

  // Properly handle the nested data structure from the API
  const dashboardData = (dashboard?.data || {}) as DashboardData;

  // Access data from the correct structure
  const enrolledCourses = dashboardData.enrolledCourses || [];
  const quizResults = dashboardData.quizResults || [];
  const overallStats = dashboardData.overallStats || {
    totalCourses: 0,
    coursesInProgress: 0,
    coursesCompleted: 0,
    averageScore: 0,
  };

  console.log("Extracted enrolledCourses: ", enrolledCourses);
  console.log("Extracted quizResults: ", quizResults);
  console.log("Extracted overallStats: ", overallStats);

  return (
    <div className="p-6 space-y-6">
      <PageTitle title="Trang tổng quan học tập" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng số khóa học
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.totalCourses || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đang tiến triển
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.coursesInProgress || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.coursesCompleted || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Điểm trung bình
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.averageScore || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList>
          <TabsTrigger value="courses">Khóa học của tôi</TabsTrigger>
          <TabsTrigger value="quizzes">Bài kiểm tra của tôi</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Khóa học đã đăng ký</CardTitle>
              <CardDescription>
                Xem tiến độ của bạn trong tất cả khóa học đã đăng ký
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrolledCourses?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khóa học</TableHead>
                      <TableHead>Giáo viên</TableHead>
                      <TableHead>Cấp độ</TableHead>
                      <TableHead>Ngày đăng ký</TableHead>
                      <TableHead>Lần truy cập cuối</TableHead>
                      <TableHead>Tiến độ</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledCourses.map((course: EnrolledCourse) => (
                      <TableRow key={course.courseId}>
                        <TableCell className="font-medium">
                          {course.title}
                        </TableCell>
                        <TableCell>{course.teacherName}</TableCell>
                        <TableCell>{course.level}</TableCell>
                        <TableCell>
                          {formatDateString(course.enrollmentDate)}
                        </TableCell>
                        <TableCell>
                          {course.lastAccessedTimestamp
                            ? formatDistanceToNow(
                                new Date(course.lastAccessedTimestamp)
                              )
                            : "Not accessed yet"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress
                              value={course.overallProgress}
                              className="h-2"
                            />
                            <span className="text-xs text-muted-foreground">
                              {course.overallProgress}%
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {course.completedChapters}/{course.totalChapters}{" "}
                            chapters
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/user/courses/${course.courseId}`)
                            }
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Bạn chưa đăng ký khóa học nào.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => router.push("/user/courses")}
                  >
                    Xem khóa học
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kết quả bài kiểm tra</CardTitle>
              <CardDescription>
                Xem tất cả các bài kiểm tra của bạn và kết quả
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quizResults?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bài kiểm tra</TableHead>
                      <TableHead>Khóa học</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizResults.map((quiz: QuizResult) => (
                      <TableRow key={quiz.quizId}>
                        <TableCell className="font-medium">
                          {quiz.quizTitle}
                        </TableCell>
                        <TableCell>{quiz.courseTitle}</TableCell>
                        <TableCell>
                          {quiz.score}% ({quiz.passingScore}% để đạt)
                        </TableCell>
                        <TableCell>
                          {quiz.passed ? (
                            <div className="flex items-center text-green-500">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Đạt
                            </div>
                          ) : (
                            <div className="flex items-center text-red-500">
                              <XCircle className="h-4 w-4 mr-1" />
                              Không đạt
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(quiz.completedAt))}
                        </TableCell>
                        <TableCell>
                          {Math.floor(quiz.timeSpent / 60)} min{" "}
                          {quiz.timeSpent % 60} sec
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Bạn chưa hoàn thành bài kiểm tra nào.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => router.push("/user/courses")}
                  >
                    Xem khóa học
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

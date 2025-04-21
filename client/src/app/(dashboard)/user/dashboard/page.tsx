"use client";

import React, { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  FileText,
  Award,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  GraduationCap,
} from "lucide-react";
import PageTitle from "@/components/PageTitle";
import LoadingAlternative from "@/components/LoadingAlternative";
import {
  formatDate,
  formatDateString,
  formatDistanceToNow,
  formatDuration,
} from "@/lib/utils";
import {
  useGetUserDashboardQuery,
  useGetGradesQuery,
  useGetCoursesQuery,
} from "@/state/api";

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
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);

  const { data: dashboard, isLoading } = useGetUserDashboardQuery(
    userId as string,
    { skip: !userId }
  );

  // Fetch grades
  const { data: grades, isLoading: gradesLoading } = useGetGradesQuery();

  // Fetch all courses
  const { data: allCourses, isLoading: coursesLoading } = useGetCoursesQuery();

  // Filter courses when grade is selected
  useEffect(() => {
    if (selectedGradeId && allCourses && grades) {
      // Find the selected grade to get its course IDs
      const selectedGrade = grades.find(
        (grade) => grade.gradeId === selectedGradeId
      );

      if (selectedGrade && selectedGrade.courseIds) {
        // Filter courses that match the course IDs in the selected grade
        const coursesForGrade = allCourses.filter((course) =>
          selectedGrade.courseIds.includes(course.courseId)
        );
        setFilteredCourses(coursesForGrade);
      } else {
        setFilteredCourses([]);
      }
    } else {
      setFilteredCourses([]);
    }
  }, [selectedGradeId, allCourses, grades]);

  const handleGradeChange = (gradeId: string) => {
    setSelectedGradeId(gradeId);
  };

  console.log("dashboard raw: ", dashboard);

  if (!userId) {
    return <div>Đăng nhập để xem tiến độ của bạn.</div>;
  }

  if (isLoading || gradesLoading || coursesLoading) {
    return <LoadingAlternative />;
  }

  // RTK Query sometimes nests the data differently from how it appears in the console
  // Try to get the data from where it actually exists rather than where it should be
  const dashboardResponse = dashboard as any;

  // Based on the console.log image, the actual data appears to be in the _ property
  let enrolledCourses: any[] = [];
  let quizResults: any[] = [];
  let overallStats = {
    totalCourses: 0,
    coursesInProgress: 0,
    coursesCompleted: 0,
    averageScore: 0,
  };

  // Try all possible locations where the data might be
  if (dashboardResponse?.data?.enrolledCourses) {
    enrolledCourses = dashboardResponse.data.enrolledCourses;
  } else if (dashboardResponse?.enrolledCourses) {
    enrolledCourses = dashboardResponse.enrolledCourses;
  } else if (dashboardResponse?._?.enrolledCourses) {
    enrolledCourses = dashboardResponse._.enrolledCourses;
  }

  if (dashboardResponse?.data?.quizResults) {
    quizResults = dashboardResponse.data.quizResults;
  } else if (dashboardResponse?.quizResults) {
    quizResults = dashboardResponse.quizResults;
  } else if (dashboardResponse?._?.quizResults) {
    quizResults = dashboardResponse._.quizResults;
  }

  if (dashboardResponse?.data?.overallStats) {
    overallStats = dashboardResponse.data.overallStats;
  } else if (dashboardResponse?.overallStats) {
    overallStats = dashboardResponse.overallStats;
  } else if (dashboardResponse?._?.overallStats) {
    overallStats = dashboardResponse._.overallStats;
  }

  console.log("Extracted enrolledCourses: ", enrolledCourses);
  console.log("Extracted quizResults: ", quizResults);
  console.log("Extracted overallStats: ", overallStats);
  console.log("enrolledCourses length:", enrolledCourses.length);

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
      </div>

      {/* Grade selection dropdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="h-5 w-5 mr-2" />
            Khóa học theo khối lớp
          </CardTitle>
          <CardDescription>
            Chọn khối lớp để xem danh sách khóa học phù hợp
          </CardDescription>
        </CardHeader>
        <CardContent>
          {grades && grades.length > 0 ? (
            <div className="space-y-4">
              <Select value={selectedGradeId} onValueChange={handleGradeChange}>
                <SelectTrigger className="w-full md:w-[260px]">
                  <SelectValue placeholder="Chọn khối lớp" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.gradeId} value={grade.gradeId}>
                      {grade.name} (Lớp {grade.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedGradeId && filteredCourses.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">
                    Danh sách khóa học
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCourses.map((course) => (
                      <Card key={course.courseId} className="overflow-hidden">
                        <div className="h-40 bg-muted relative">
                          {course.image ? (
                            <img
                              src={course.image}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-secondary/30">
                              <BookOpen className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardHeader className="p-4">
                          <CardTitle className="text-base line-clamp-1">
                            {course.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {course.description || "Không có mô tả"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <Button
                            onClick={() =>
                              router.push(`/user/courses/${course.courseId}`)
                            }
                            className="w-full"
                          >
                            Xem khóa học
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : selectedGradeId ? (
                <div className="py-4 text-center text-muted-foreground">
                  Không có khóa học nào cho khối lớp này.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                Không có khối lớp nào được tìm thấy.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
                        <TableCell>
                          {formatDate(course.enrollmentDate)}
                        </TableCell>
                        <TableCell>
                          {course.lastAccessedTimestamp
                            ? formatDate(course.lastAccessedTimestamp)
                            : "Chưa truy cập"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Progress
                              value={course.overallProgress}
                              className="h-2"
                            />
                          </div>
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {course.overallProgress}%
                            </span>
                            <div className="text-xs text-muted-foreground mt-1">
                              {course.completedChapters}/{course.totalChapters}{" "}
                              Chương
                            </div>
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
                        <TableCell>{quiz.score / 10}</TableCell>
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
                        <TableCell>{formatDate(quiz.completedAt)}</TableCell>
                        <TableCell>{formatDuration(quiz.timeSpent)}</TableCell>
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

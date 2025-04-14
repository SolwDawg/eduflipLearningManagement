"use client";

import { useEffect, useState } from "react";
import {
  useGetCoursesQuery,
  useGetCourseQuizCompletionCountQuery,
  useGetStudentsWithQuizCompletionsQuery,
} from "@/state/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import PageTitle from "@/components/PageTitle";
import {
  BookOpen,
  UserRound,
  CheckCircle,
  BarChart3,
  Calendar,
  Award,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function QuizTrackingPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("summary");

  const {
    data: courses,
    isLoading: isLoadingCourses,
    error: coursesError,
  } = useGetCoursesQuery();

  const {
    data: quizCompletionCount,
    isLoading: isLoadingQuizCount,
    error: quizCountError,
  } = useGetCourseQuizCompletionCountQuery(selectedCourseId, {
    skip: !selectedCourseId,
  });

  const {
    data: studentsWithQuizzes,
    isLoading: isLoadingStudents,
    error: studentsError,
    refetch: refetchStudents,
  } = useGetStudentsWithQuizCompletionsQuery(selectedCourseId, {
    skip: !selectedCourseId,
  });

  // Refetch data when course selection changes
  useEffect(() => {
    if (selectedCourseId) {
      refetchStudents();
    }
  }, [selectedCourseId, refetchStudents]);

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch (error) {
      return "Không có dữ liệu";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <PageTitle
        title="Theo dõi hoàn thành bài kiểm tra"
        description="Xem thông tin chi tiết về học viên đã hoàn thành bài kiểm tra trong khóa học"
        icon={<CheckCircle className="h-6 w-6" />}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Chọn khóa học</CardTitle>
          <CardDescription>Xem thông tin bài kiểm tra chi tiết</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCourses ? (
            <Skeleton className="h-10 w-full" />
          ) : coursesError ? (
            <Alert variant="destructive">
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>
                Không thể tải danh sách khóa học
              </AlertDescription>
            </Alert>
          ) : (
            <Select
              value={selectedCourseId}
              onValueChange={(value) => {
                setSelectedCourseId(value);
                setActiveTab("summary"); // Reset to summary tab on course change
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn khóa học" />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((course) => (
                  <SelectItem key={course.courseId} value={course.courseId}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedCourseId && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Tổng quan</TabsTrigger>
            <TabsTrigger value="students">Chi tiết học viên</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tổng quan hoàn thành bài kiểm tra</CardTitle>
                <CardDescription>
                  {quizCompletionCount?.title || "Đang tải thông tin..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingQuizCount ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-2/3" />
                  </div>
                ) : quizCountError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>
                      Không thể tải thông tin hoàn thành bài kiểm tra
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-primary-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Tổng số học viên
                            </p>
                            <h2 className="text-3xl font-bold text-primary-700 mt-1">
                              {quizCompletionCount?.enrollmentCount || 0}
                            </h2>
                          </div>
                          <div className="bg-primary-100 p-3 rounded-full">
                            <UserRound className="h-6 w-6 text-primary-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Học viên đã làm bài kiểm tra
                            </p>
                            <h2 className="text-3xl font-bold text-green-700 mt-1">
                              {quizCompletionCount?.quizCompletionCount || 0}
                            </h2>
                          </div>
                          <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Tỷ lệ hoàn thành
                            </p>
                            <h2 className="text-3xl font-bold text-blue-700 mt-1">
                              {quizCompletionCount?.completionRate || 0}%
                            </h2>
                          </div>
                          <div className="bg-blue-100 p-3 rounded-full">
                            <BarChart3 className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        Thống kê theo bài kiểm tra
                      </h3>
                      {quizCompletionCount?.quizData &&
                      quizCompletionCount.quizData.length > 0 ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Tên bài kiểm tra</TableHead>
                                <TableHead>Số học viên hoàn thành</TableHead>
                                <TableHead>Điểm trung bình</TableHead>
                                <TableHead>Tỷ lệ hoàn thành</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {quizCompletionCount.quizData.map((quiz) => (
                                <TableRow key={quiz.quizId}>
                                  <TableCell className="font-medium">
                                    {quiz.title}
                                  </TableCell>
                                  <TableCell>{quiz.completedCount}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Award className="h-4 w-4 mr-2 text-yellow-500" />
                                      <span>
                                        {quiz.averageScore.toFixed(1)}%
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                          {quizCompletionCount.enrollmentCount >
                                          0
                                            ? (
                                                (quiz.completedCount /
                                                  quizCompletionCount.enrollmentCount) *
                                                100
                                              ).toFixed(0)
                                            : 0}
                                          %
                                        </span>
                                      </div>
                                      <Progress
                                        value={
                                          quizCompletionCount.enrollmentCount >
                                          0
                                            ? (quiz.completedCount /
                                                quizCompletionCount.enrollmentCount) *
                                              100
                                            : 0
                                        }
                                        className="h-2"
                                      />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-md">
                          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                          <p className="text-gray-500">
                            Chưa có bài kiểm tra nào được hoàn thành trong khóa
                            học này
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  Chi tiết hoàn thành bài kiểm tra theo học viên
                </CardTitle>
                <CardDescription>
                  Thông tin chi tiết về bài kiểm tra mà mỗi học viên đã hoàn
                  thành
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStudents ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : studentsError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>
                      Không thể tải thông tin chi tiết học viên
                    </AlertDescription>
                  </Alert>
                ) : studentsWithQuizzes?.studentsWithQuizzes?.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <UserRound className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-500">
                      Chưa có học viên nào hoàn thành bài kiểm tra trong khóa
                      học này
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {studentsWithQuizzes?.studentsWithQuizzes.map((student) => (
                      <div
                        key={student.userId}
                        className="border rounded-lg overflow-hidden"
                      >
                        <div className="bg-gray-50 p-4 border-b">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium">
                                {student.fullName}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {student.email}
                              </p>
                            </div>
                            <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                {student.totalQuizzesCompleted} bài kiểm tra
                                hoàn thành
                              </Badge>
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                Điểm:{" "}
                                {student.averageQuizScore.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Tên bài kiểm tra</TableHead>
                                <TableHead>Điểm số</TableHead>
                                <TableHead>Số câu hỏi</TableHead>
                                <TableHead>Số lần làm</TableHead>
                                <TableHead>Ngày hoàn thành</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {student.completedQuizzes.map((quiz) => (
                                <TableRow key={quiz.quizId}>
                                  <TableCell className="font-medium">
                                    {quiz.title}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      className={`
                                        ${
                                          quiz.score >= 80
                                            ? "bg-green-100 text-green-800 border-green-200"
                                            : quiz.score >= 60
                                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                            : "bg-red-100 text-red-800 border-red-200"
                                        }
                                      `}
                                    >
                                      {quiz.score /10}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{quiz.totalQuestions}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <span>{quiz.attemptCount}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                      <span>
                                        {formatDate(quiz.completionDate)}
                                      </span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

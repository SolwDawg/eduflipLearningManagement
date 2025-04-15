"use client";

import { useEffect, useState } from "react";
import {
  useGetCoursesQuery,
  useGetCourseEnrollmentCountQuery,
  useGetCourseEnrollmentDetailsQuery,
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
import { UserRound, Users, Calendar, Clock, BarChart3 } from "lucide-react";
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

export default function EnrollmentTracking() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("summary");

  const {
    data: courses,
    isLoading: isLoadingCourses,
    error: coursesError,
  } = useGetCoursesQuery();

  const {
    data: enrollmentCount,
    isLoading: isLoadingCount,
    error: countError,
  } = useGetCourseEnrollmentCountQuery(selectedCourseId, {
    skip: !selectedCourseId,
  });

  const {
    data: enrollmentDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
    refetch: refetchDetails,
  } = useGetCourseEnrollmentDetailsQuery(selectedCourseId, {
    skip: !selectedCourseId,
  });

  // Refetch enrollment data when course selection changes
  useEffect(() => {
    if (selectedCourseId) {
      refetchDetails();
    }
  }, [selectedCourseId, refetchDetails]);

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch (error) {
      return "Không có dữ liệu";
    }
  };

  return (
    <div className="container mx-auto p-6 mb-6">
      <PageTitle
        title="Theo dõi đăng ký khoá học"
        description="Xem thông tin chi tiết về học viên đã đăng ký khoá học của bạn"
        icon={<UserRound className="h-6 w-6" />}
      />

      <Card className="m-6">
        <CardHeader>
          <CardTitle>Chọn khoá học</CardTitle>
          <CardDescription>Xem thông tin đăng ký chi tiết</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCourses ? (
            <Skeleton className="h-10 w-full" />
          ) : coursesError ? (
            <Alert variant="destructive">
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>
                Không thể tải danh sách khoá học
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
                <SelectValue placeholder="Chọn khoá học" />
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
            <TabsTrigger value="students">Danh sách học viên</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin đăng ký</CardTitle>
                <CardDescription>
                  {enrollmentCount?.title ||
                    enrollmentDetails?.title ||
                    "Đang tải thông tin..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCount ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-2/3" />
                  </div>
                ) : countError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>
                      Không thể tải thông tin đăng ký
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Tổng số học viên đăng ký
                      </p>
                      <h2 className="text-3xl font-bold text-primary-700 mt-1">
                        {enrollmentCount?.enrollmentCount ||
                          enrollmentDetails?.enrollmentCount ||
                          0}
                      </h2>
                    </div>
                    <div className="bg-primary-100 p-4 rounded-full">
                      <Users className="h-8 w-8 text-primary-600" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách học viên đăng ký</CardTitle>
                <CardDescription>
                  Chi tiết về học viên đã đăng ký khóa học này
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDetails ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : detailsError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>
                      Không thể tải thông tin chi tiết học viên
                    </AlertDescription>
                  </Alert>
                ) : enrollmentDetails?.enrolledStudents?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Chưa có học viên nào đăng ký khóa học này
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Học viên</TableHead>
                          <TableHead>Ngày đăng ký</TableHead>
                          <TableHead>Tiến độ</TableHead>
                          <TableHead>Truy cập gần nhất</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrollmentDetails?.enrolledStudents.map((student) => (
                          <TableRow key={student.userId}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {student.fullName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {student.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                <span>
                                  {formatDate(student.enrollmentDate)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">
                                    {student.overallProgress}%
                                  </span>
                                  <Badge
                                    variant={
                                      student.overallProgress >= 80
                                        ? "default"
                                        : student.overallProgress >= 50
                                          ? "secondary"
                                          : "outline"
                                    }
                                    className={`text-xs ${
                                      student.overallProgress >= 80
                                        ? "bg-green-100 text-green-800 border-green-200"
                                        : student.overallProgress >= 50
                                          ? "bg-blue-100 text-blue-800 border-blue-200"
                                          : ""
                                    }`}
                                  >
                                    {student.overallProgress >= 80
                                      ? "Hoàn thành"
                                      : student.overallProgress >= 50
                                        ? "Đang tiến triển"
                                        : "Mới bắt đầu"}
                                  </Badge>
                                </div>
                                <Progress
                                  value={student.overallProgress}
                                  className="h-2"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                <span>
                                  {formatDate(student.lastAccessDate)}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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

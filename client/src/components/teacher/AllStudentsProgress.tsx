import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetAllStudentsProgressQuery } from "@/state/api";
import LoadingAlternative from "@/components/LoadingAlternative";
import { formatDateString } from "@/lib/utils";
import {
  Search,
  ArrowUpDown,
  UserCircle,
  Eye,
  BookOpen,
  BarChart4,
  Calendar,
  CheckCircle2,
} from "lucide-react";

interface Course {
  courseId: string;
  title: string;
  totalStudents: number;
}

interface EnrolledCourse {
  courseId: string;
  title: string;
  progress: number;
  lastActivity: string;
}

interface Student {
  userId: string;
  fullName: string;
  email: string;
  enrolledCourses: EnrolledCourse[];
  overallProgress: number;
  lastActivity: string;
}

interface AllStudentsProgressData {
  courses: Course[];
  students: Student[];
}

const AllStudentsProgress = () => {
  const router = useRouter();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"students" | "courses">(
    "students"
  );
  const [sortField, setSortField] = useState<string>("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { data, isLoading, error } = useGetAllStudentsProgressQuery(
    user?.id || ""
  );

  // Handle searching
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    if (!data?.data?.students) return [];

    let studentsData = [...data.data.students];

    // Filter by search term
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      studentsData = studentsData.filter(
        (student) =>
          student.fullName.toLowerCase().includes(lowercasedSearch) ||
          student.email.toLowerCase().includes(lowercasedSearch) ||
          student.enrolledCourses.some((course: any) =>
            course.title.toLowerCase().includes(lowercasedSearch)
          )
      );
    }

    // Sort data
    studentsData.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "fullName":
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "overallProgress":
          comparison = a.overallProgress - b.overallProgress;
          break;
        case "coursesCount":
          comparison = a.enrolledCourses.length - b.enrolledCourses.length;
          break;
        case "lastActivity":
          comparison =
            new Date(a.lastActivity).getTime() -
            new Date(b.lastActivity).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return studentsData;
  }, [data, searchTerm, sortField, sortDirection]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data?.data) {
      return {
        totalStudents: 0,
        totalCourses: 0,
        averageProgress: 0,
        activeStudents: 0,
        studentsWithMultipleCourses: 0,
      };
    }

    const { students, courses } = data.data;

    // Calculate average progress
    const totalProgress = students.reduce(
      (sum: number, student: Student) => sum + student.overallProgress,
      0
    );
    const averageProgress =
      students.length > 0 ? Math.round(totalProgress / students.length) : 0;

    // Count active students (activity in the last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const activeStudents = students.filter((student: Student) => {
      const lastActivity = new Date(student.lastActivity);
      return lastActivity >= oneWeekAgo;
    }).length;

    // Count students enrolled in multiple courses
    const studentsWithMultipleCourses = students.filter(
      (student: Student) => student.enrolledCourses.length > 1
    ).length;

    return {
      totalStudents: students.length,
      totalCourses: courses.length,
      averageProgress,
      activeStudents,
      studentsWithMultipleCourses,
    };
  }, [data]);

  // View student details handler
  const handleViewStudentDetails = (studentId: string) => {
    router.push(`/teacher/progress/student/${studentId}`);
  };

  // View course progress handler
  const handleViewCourseProgress = (courseId: string) => {
    router.push(`/teacher/progress/course/${courseId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <LoadingAlternative variant="spinner" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">
            Lỗi khi tải dữ liệu học sinh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Không thể tải dữ liệu tiến độ học tập của học sinh. Vui lòng thử lại
            sau.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.data || !data.data.students.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tiến độ học tập của học sinh</CardTitle>
          <CardDescription>
            Không có dữ liệu học sinh nào được tìm thấy
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <UserCircle className="h-5 w-5 mr-2 text-primary" />
              Tổng số học sinh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-indigo-500" />
              Tổng số khóa học
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCourses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart4 className="h-5 w-5 mr-2 text-blue-500" />
              Tiến độ trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Progress value={stats.averageProgress} className="h-2 flex-1" />
              <span className="text-xl font-semibold">
                {stats.averageProgress}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-500" />
              Học sinh hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.activeStudents}
            </div>
            <p className="text-xs text-muted-foreground">7 ngày qua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-amber-500" />
              Nhiều khóa học
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {stats.studentsWithMultipleCourses}
            </div>
            <p className="text-xs text-muted-foreground">Học sinh đã đăng ký</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Tiến độ học tập của học sinh</CardTitle>
          <CardDescription>
            Theo dõi tiến độ học tập của tất cả học sinh trong tất cả khóa học
          </CardDescription>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm học sinh hoặc khóa học..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "students" | "courses")}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="students">Học sinh</TabsTrigger>
                <TabsTrigger value="courses">Khóa học</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          {activeTab === "students" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("fullName")}
                    >
                      Học sinh
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("email")}
                    >
                      Email
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div
                      className="flex items-center justify-center cursor-pointer"
                      onClick={() => handleSort("coursesCount")}
                    >
                      Khóa học
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("overallProgress")}
                    >
                      Tiến độ trung bình
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("lastActivity")}
                    >
                      Hoạt động gần đây
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.userId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                        {student.fullName}
                      </div>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">
                        {student.enrolledCourses.length}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={student.overallProgress}
                          className={`h-2 w-20 ${
                            student.overallProgress >= 75
                              ? "bg-green-100"
                              : student.overallProgress >= 50
                              ? "bg-amber-100"
                              : "bg-red-100"
                          }`}
                        />
                        <span>{student.overallProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDateString(student.lastActivity)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleViewStudentDetails(student.userId)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Tên khóa học</TableHead>
                  <TableHead className="text-center">Số học sinh</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.courses.map((course: Course) => (
                  <TableRow key={course.courseId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-indigo-500" />
                        {course.title}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">
                        {course.totalStudents}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() =>
                          handleViewCourseProgress(course.courseId)
                        }
                      >
                        <BarChart4 className="h-3.5 w-3.5" />
                        Xem phân tích
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            {activeTab === "students"
              ? `Hiển thị ${filteredStudents.length} / ${
                  data?.data?.students.length || 0
                } học sinh`
              : `Hiển thị ${data?.data?.courses.length || 0} khóa học`}
          </div>
        </CardFooter>
      </Card>

      {/* Student Courses Expanded View */}
      {filteredStudents.length > 0 && activeTab === "students" && (
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết khóa học của học sinh</CardTitle>
            <CardDescription>
              Tiến độ của từng học sinh trong các khóa học cụ thể
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {filteredStudents.slice(0, 5).map((student) => (
                <div key={`expanded-${student.userId}`} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">{student.fullName}</h3>
                      <span className="text-sm text-muted-foreground">
                        ({student.email})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewStudentDetails(student.userId)}
                    >
                      Xem tất cả
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {student.enrolledCourses.map((course: any) => (
                      <Card
                        key={`${student.userId}-${course.courseId}`}
                        className="border shadow-sm"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {course.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Tiến độ</span>
                              <span>{course.progress}%</span>
                            </div>
                            <Progress
                              value={course.progress}
                              className="h-1.5"
                            />
                            <div className="text-xs text-muted-foreground">
                              Hoạt động gần đây:{" "}
                              {formatDateString(course.lastActivity)}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              router.push(
                                `/teacher/progress/student-details/${course.courseId}/${student.userId}`
                              )
                            }
                          >
                            Xem chi tiết
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}

              {filteredStudents.length > 5 && (
                <div className="text-center pt-2">
                  <Button
                    variant="link"
                    onClick={() => router.push("/teacher/progress/students")}
                  >
                    Xem tất cả học sinh ({filteredStudents.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AllStudentsProgress;

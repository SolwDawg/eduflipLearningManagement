import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useGetEnrolledStudentsWithProgressQuery } from "@/state/api";
import LoadingAlternative from "@/components/LoadingAlternative";
import { formatDateString } from "@/lib/utils";
import { UserCircle, Search, ArrowUpDown, Eye } from "lucide-react";

interface StudentProgress {
  userId: string;
  fullName: string;
  email: string;
  enrollmentDate: string;
  overallProgress: number;
  lastAccessedTimestamp: string;
  completedChapters: number;
  totalChapters: number;
  quizResults: {
    quizId: string;
    score: number;
    maxScore: number;
    submittedAt: string;
  }[];
  averageQuizScore: number;
}

interface EnrolledStudentsProgressProps {
  courseId: string;
}

const EnrolledStudentsProgress: React.FC<EnrolledStudentsProgressProps> = ({
  courseId,
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof StudentProgress;
    direction: "ascending" | "descending";
  } | null>(null);

  const { data, isLoading, error } =
    useGetEnrolledStudentsWithProgressQuery(courseId);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle view student details
  const handleViewStudentDetails = (studentId: string) => {
    router.push(`/teacher/progress/student-details/${courseId}/${studentId}`);
  };

  // Sorting function
  const requestSort = (key: keyof StudentProgress) => {
    let direction: "ascending" | "descending" = "ascending";

    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }

    setSortConfig({ key, direction });
  };

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    if (!data?.data) return [];

    let studentsData = [...data.data];

    // Filter by search term
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      studentsData = studentsData.filter(
        (student) =>
          student.fullName.toLowerCase().includes(lowercasedSearch) ||
          student.email.toLowerCase().includes(lowercasedSearch)
      );
    }

    // Sort if sort config is set
    if (sortConfig) {
      studentsData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return studentsData;
  }, [data, searchTerm, sortConfig]);

  // Calculate overall statistics
  const stats = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return {
        totalStudents: 0,
        averageProgress: 0,
        completionRate: 0,
        averageQuizScore: 0,
      };
    }

    const students = data.data as StudentProgress[];
    const totalStudents = students.length;
    const totalProgress = students.reduce(
      (sum: number, student: StudentProgress) => sum + student.overallProgress,
      0
    );
    const averageProgress = Math.round(totalProgress / totalStudents);

    const completedStudents = students.filter(
      (student: StudentProgress) => student.overallProgress === 100
    ).length;
    const completionRate = Math.round(
      (completedStudents / totalStudents) * 100
    );

    const studentsWithQuizzes = students.filter(
      (student: StudentProgress) =>
        student.quizResults && student.quizResults.length > 0
    );
    const totalQuizScore = studentsWithQuizzes.reduce(
      (sum: number, student: StudentProgress) => sum + student.averageQuizScore,
      0
    );
    const averageQuizScore =
      studentsWithQuizzes.length > 0
        ? Math.round(totalQuizScore / studentsWithQuizzes.length)
        : 0;

    return {
      totalStudents,
      averageProgress,
      completionRate,
      averageQuizScore,
    };
  }, [data]);

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
            Lỗi khi tải danh sách học sinh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Không thể tải danh sách học sinh đã đăng ký. Vui lòng thử lại sau.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Học sinh đã đăng ký</CardTitle>
          <CardDescription>
            Không có học sinh nào đã đăng ký khóa học này
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tổng số học sinh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tiến độ trung bình</CardTitle>
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
            <CardTitle className="text-lg">Tỷ lệ hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {stats.completionRate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Điểm trung bình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">
              {stats.averageQuizScore}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách học sinh đã đăng ký</CardTitle>
          <CardDescription>
            Theo dõi tiến độ và hiệu suất của học sinh
          </CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm học sinh..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => requestSort("fullName")}
                  >
                    Họ và tên
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => requestSort("email")}
                  >
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => requestSort("overallProgress")}
                  >
                    Tiến độ
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div
                    className="flex items-center justify-end cursor-pointer"
                    onClick={() => requestSort("completedChapters")}
                  >
                    Chương đã học
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div
                    className="flex items-center justify-end cursor-pointer"
                    onClick={() => requestSort("averageQuizScore")}
                  >
                    Điểm trung bình
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => requestSort("lastAccessedTimestamp")}
                  >
                    Truy cập gần đây
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
                      {student.overallProgress === 100 && (
                        <Badge className="bg-green-500 text-white">
                          Hoàn thành
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {student.completedChapters}/{student.totalChapters}
                  </TableCell>
                  <TableCell className="text-right">
                    {student.averageQuizScore > 0 ? (
                      <span
                        className={
                          student.averageQuizScore >= 80
                            ? "text-green-600"
                            : student.averageQuizScore >= 60
                            ? "text-amber-600"
                            : "text-red-600"
                        }
                      >
                        {student.averageQuizScore}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.lastAccessedTimestamp ? (
                      formatDateString(student.lastAccessedTimestamp)
                    ) : (
                      <span className="text-muted-foreground">
                        Chưa truy cập
                      </span>
                    )}
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
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Hiển thị {filteredStudents.length} / {data.data.length} học sinh
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EnrolledStudentsProgress;

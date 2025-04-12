"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { format } from "date-fns";
import {
  fetchAllStudentsProgress,
  StudentWithProgress,
  AllStudentsProgressResponse,
  TeacherCourseInfo,
} from "@/lib/studentProgressApi";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  BookOpen,
  ChevronDown,
  FileText,
  Filter,
  Search,
  SlidersHorizontal,
  Calendar,
  ArrowUpDown,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AllStudentsProgressPage = () => {
  const router = useRouter();
  const { userId } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AllStudentsProgressResponse>({
    courses: [],
    students: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [filteredStudents, setFilteredStudents] = useState<
    StudentWithProgress[]
  >([]);
  const [activeTab, setActiveTab] = useState("students");

  // Fetch all student progress data
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const responseData = await fetchAllStudentsProgress(userId);
        setData(responseData);
      } catch (error) {
        console.error("Failed to fetch student progress data:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu tiến độ học tập của học sinh.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, toast]);

  // Filter and sort students based on search query, course filter, and sort options
  useEffect(() => {
    let filtered = [...data.students];

    // Apply course filter
    if (courseFilter !== "all") {
      filtered = filtered.filter((student) =>
        student.courses.some((course) => course.courseId === courseFilter)
      );
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.fullName.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case "courses":
          comparison = a.totalCourses - b.totalCourses;
          break;
        case "progress":
          comparison = a.averageProgress - b.averageProgress;
          break;
        case "lastActivity":
          comparison =
            new Date(a.lastActivity).getTime() -
            new Date(b.lastActivity).getTime();
          break;
        default:
          comparison = a.fullName.localeCompare(b.fullName);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredStudents(filtered);
  }, [data.students, searchQuery, courseFilter, sortField, sortOrder]);

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  const renderCourseFilterOptions = () => {
    return (
      <Select value={courseFilter} onValueChange={setCourseFilter}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Lọc theo khóa học" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả khóa học</SelectItem>
          {data.courses.map((course) => (
            <SelectItem key={course.courseId} value={course.courseId}>
              {course.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const studentDetailCard = (student: StudentWithProgress) => (
    <Card key={student.userId} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {student.avatarUrl ? (
                <AvatarImage src={student.avatarUrl} alt={student.fullName} />
              ) : (
                <AvatarFallback>
                  {student.fullName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <CardTitle className="text-lg">{student.fullName}</CardTitle>
              <CardDescription>{student.email}</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/teacher/progress/student/${student.userId}`)
            }
          >
            <BarChart className="h-4 w-4 mr-2" />
            Xem chi tiết
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              Khóa học đã đăng ký
            </span>
            <span className="text-lg font-medium">{student.totalCourses}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              Tiến độ học tập trung bình
            </span>
            <div className="flex items-center gap-2">
              <Progress
                value={student.averageProgress * 100}
                className="h-2 w-20"
              />
              <span className="text-lg font-medium">
                {Math.round(student.averageProgress * 100)}%
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              Hoạt động cuối cùng
            </span>
            <span className="text-lg font-medium">
              {formatDate(student.lastActivity)}
            </span>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="text-sm font-medium mb-2">Tiến độ khóa học</h4>
          <div className="space-y-3">
            {student.courses.map((course) => (
              <div
                key={course.courseId}
                className="flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {course.courseTitle}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Đã đăng ký: {formatDate(course.enrollmentDate)}
                  </div>
                </div>
                <div className="flex items-center gap-4 min-w-[180px]">
                  <div className="flex items-center gap-2">
                    <Progress
                      value={course.progress * 100}
                      className="h-2 w-20"
                    />
                    <span className="text-sm">
                      {Math.round(course.progress * 100)}%
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-8 w-8"
                    onClick={() =>
                      router.push(
                        `/teacher/progress/student-details/${course.courseId}/${student.userId}`
                      )
                    }
                    title="Xem chi tiết phân tích"
                  >
                    <BarChart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Tiến độ học tập của tất cả học sinh
        </h1>
        <p className="text-muted-foreground">
          Xem và theo dõi tiến độ học tập của tất cả học sinh trong khóa học của
          bạn
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm học sinh..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {renderCourseFilterOptions()}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span>
                  Sắp xếp theo:{" "}
                  {sortField.charAt(0).toUpperCase() + sortField.slice(1)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSortChange("name")}>
                Tên{" "}
                {sortField === "name" &&
                  (sortOrder === "asc" ? "(A-Z)" : "(Z-A)")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("courses")}>
                Khóa học đã đăng ký{" "}
                {sortField === "courses" &&
                  (sortOrder === "asc" ? "(Thấp-Cao)" : "(Cao-Thấp)")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("progress")}>
                Tiến độ học tập trung bình{" "}
                {sortField === "progress" &&
                  (sortOrder === "asc" ? "(Thấp-Cao)" : "(Cao-Thấp)")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSortChange("lastActivity")}
              >
                Hoạt động cuối cùng{" "}
                {sortField === "lastActivity" &&
                  (sortOrder === "asc" ? "(Cũ-Mới)" : "(Mới-Cũ)")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs
        defaultValue="students"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="students">Thẻ học sinh</TabsTrigger>
          <TabsTrigger value="table">Bảng xem</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4 mt-4">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-10">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">
                Không tìm thấy học sinh
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || courseFilter !== "all"
                  ? "Thử điều chỉnh bộ lọc của bạn"
                  : "Không có học sinh đã đăng ký khóa học của bạn"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredStudents.map((student) => studentDetailCard(student))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-10">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">
                Không tìm thấy học sinh
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || courseFilter !== "all"
                  ? "Thử điều chỉnh bộ lọc của bạn"
                  : "Không có học sinh đã đăng ký khóa học của bạn"}
              </p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">
                        <button
                          className="flex items-center"
                          onClick={() => handleSortChange("name")}
                        >
                          Học sinh
                          {sortField === "name" && (
                            <ChevronDown
                              className={`ml-1 h-4 w-4 ${
                                sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center"
                          onClick={() => handleSortChange("courses")}
                        >
                          Khóa học đã đăng ký
                          {sortField === "courses" && (
                            <ChevronDown
                              className={`ml-1 h-4 w-4 ${
                                sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          className="flex items-center"
                          onClick={() => handleSortChange("progress")}
                        >
                          Tiến độ học tập trung bình
                          {sortField === "progress" && (
                            <ChevronDown
                              className={`ml-1 h-4 w-4 ${
                                sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center"
                          onClick={() => handleSortChange("lastActivity")}
                        >
                          Hoạt động cuối cùng
                          {sortField === "lastActivity" && (
                            <ChevronDown
                              className={`ml-1 h-4 w-4 ${
                                sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.userId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {student.avatarUrl ? (
                                <AvatarImage
                                  src={student.avatarUrl}
                                  alt={student.fullName}
                                />
                              ) : (
                                <AvatarFallback>
                                  {student.fullName
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {student.fullName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{student.totalCourses}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm">
                              {Math.round(student.averageProgress * 100)}%
                            </span>
                            <Progress
                              value={student.averageProgress * 100}
                              className="w-20"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {formatDate(student.lastActivity)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/teacher/progress/student/${student.userId}`
                              )
                            }
                          >
                            Xem chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AllStudentsProgressPage;

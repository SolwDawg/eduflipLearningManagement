"use client";

import Toolbar from "@/components/Toolbar";
import CourseCard from "@/components/CourseCard";
import {
  useGetUserEnrolledCoursesQuery,
  useGetGradesQuery,
  useGetCoursesQuery,
} from "@/state/api";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useUser } from "@clerk/nextjs";
import { useState, useMemo, useEffect } from "react";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Bookmark, Filter } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Courses = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterByGrade, setFilterByGrade] = useState<boolean>(false);
  const [userGradeId, setUserGradeId] = useState<string | null>(null);

  // New state for grade filter
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [isGradeFilterActive, setIsGradeFilterActive] =
    useState<boolean>(false);

  // Fetch grades
  const { data: grades, isLoading: isLoadingGrades } = useGetGradesQuery();

  // Fetch all courses (for grade filtering)
  const { data: allCourses, isLoading: isAllCoursesLoading } =
    useGetCoursesQuery();

  // State for grade-filtered courses
  const [gradeFilteredCourses, setGradeFilteredCourses] = useState<any[]>([]);

  // Fetch user metadata to get grade
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/users/${user.id}`);
        const data = await response.json();
        setUserGradeId(data.gradeId);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (isLoaded && user) {
      fetchUserData();
    }
  }, [user, isLoaded]);

  const {
    data: courses,
    isLoading,
    isError,
    error,
  } = useGetUserEnrolledCoursesQuery(user?.id ?? "", {
    skip: !isLoaded || !user,
  });

  // Find the user's grade from the grades list
  const userGrade = useMemo(() => {
    if (!grades || !userGradeId) return null;
    return grades.find((grade) => grade.gradeId === userGradeId);
  }, [grades, userGradeId]);

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
        setGradeFilteredCourses(coursesForGrade);
        setIsGradeFilterActive(true);
      } else {
        setGradeFilteredCourses([]);
        setIsGradeFilterActive(false);
      }
    } else {
      setGradeFilteredCourses([]);
      setIsGradeFilterActive(false);
    }
  }, [selectedGradeId, allCourses, grades]);

  const handleGradeChange = (gradeId: string) => {
    setSelectedGradeId(gradeId);
  };

  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    const filtered = courses.filter((course) => {
      const matchesSearch = course.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (filterByGrade && userGradeId) {
      // If filtering by grade, sort courses to prioritize those in the user's grade
      return filtered.sort((a, b) => {
        const aInGrade = a.gradeId === userGradeId;
        const bInGrade = b.gradeId === userGradeId;

        if (aInGrade && !bInGrade) return -1;
        if (!aInGrade && bInGrade) return 1;
        return 0;
      });
    }

    return filtered;
  }, [courses, searchTerm, selectedCategory, filterByGrade, userGradeId]);

  const handleGoToCourse = (course: Course) => {
    if (
      course.sections &&
      course.sections.length > 0 &&
      course.sections[0].chapters.length > 0
    ) {
      const firstChapter = course.sections[0].chapters[0];
      router.push(
        `/user/courses/${course.courseId}/chapters/${firstChapter.chapterId}`,
        {
          scroll: false,
        }
      );
    } else {
      router.push(`/user/courses/${course.courseId}`, {
        scroll: false,
      });
    }
  };

  // Find grade by ID
  const getGradeName = (gradeId: string | undefined) => {
    if (!gradeId || !grades) return null;
    const grade = grades.find((g) => g.gradeId === gradeId);
    return grade ? `${grade.name} (Lớp ${grade.level})` : null;
  };

  if (!isLoaded || isLoading || isLoadingGrades || isAllCoursesLoading)
    return <Loading />;
  if (!user)
    return <div>Vui lòng đăng nhập để xem danh sách khóa học của bạn.</div>;

  if (isError) {
    console.error("Error fetching courses:", error);
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-500 mb-2">
          Lỗi khi tải danh sách khóa học của bạn
        </h2>
        <p className="mb-4">
          Có lỗi xảy ra khi tải danh sách khóa học của bạn. Vui lòng thử lại
          sau.
        </p>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="p-8 text-center">
        <Header
          title="Khóa học của tôi"
          subtitle="Xem khóa học đã đăng ký của bạn"
        />
        <div className="py-12">
          <h2 className="text-xl font-semibold mb-4">
            Bạn chưa có khóa học nào
          </h2>
          <p className="mb-6 text-muted-foreground">
            Hãy khám phá danh sách khóa học để tìm kiếm khóa học phù hợp với bạn
          </p>
          <Button onClick={() => router.push("/courses")}>
            Tìm kiếm khóa học
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-courses p-6 space-y-6">
      <Header
        title="Khóa học của tôi"
        subtitle="Xem khóa học đã đăng ký của bạn"
      />

      <Tabs defaultValue="enrolled" className="w-full">
        <TabsList>
          <TabsTrigger value="enrolled">Khóa học đã đăng ký</TabsTrigger>
          <TabsTrigger value="by-grade">Khóa học theo khối lớp</TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="space-y-6">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {userGrade && (
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span>
                  Lớp của bạn:{" "}
                  <strong>
                    {userGrade.name} (Lớp {userGrade.level})
                  </strong>
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => setFilterByGrade(!filterByGrade)}
                >
                  {filterByGrade
                    ? "Hiển thị tất cả"
                    : "Ưu tiên khóa học theo lớp"}
                </Button>
              </div>
            )}

            <Toolbar
              onSearch={setSearchTerm}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          <div className="user-courses__grid">
            {filteredCourses.map((course) => (
              <div key={course.courseId} className="relative">
                {course.gradeId && course.gradeId === userGradeId && (
                  <Badge className="absolute top-2 right-2 z-10 bg-green-500">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Lớp của bạn
                  </Badge>
                )}
                <CourseCard course={course} onGoToCourse={handleGoToCourse} />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="by-grade" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="h-5 w-5 mr-2" />
                Tìm khóa học theo khối lớp
              </CardTitle>
              <CardDescription>
                Chọn khối lớp để xem danh sách khóa học phù hợp
              </CardDescription>
            </CardHeader>
            <CardContent>
              {grades && grades.length > 0 ? (
                <div className="space-y-4">
                  <Select
                    value={selectedGradeId}
                    onValueChange={handleGradeChange}
                  >
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

                  {selectedGradeId && gradeFilteredCourses.length > 0 ? (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-4">
                        Khóa học cho {getGradeName(selectedGradeId)}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gradeFilteredCourses.map((course) => (
                          <div key={course.courseId} className="relative">
                            {course.courseId &&
                              (() => {
                                // Check if course is already enrolled
                                const isEnrolled = courses.some(
                                  (c) => c.courseId === course.courseId
                                );

                                if (isEnrolled) {
                                  return (
                                    <Badge className="absolute top-2 right-2 z-10 bg-blue-500">
                                      <Bookmark className="h-3 w-3 mr-1" />
                                      Đã đăng ký
                                    </Badge>
                                  );
                                }

                                return null;
                              })()}
                            <CourseCard
                              course={course}
                              onGoToCourse={(c) => {
                                // Check if already enrolled
                                const isEnrolled = courses.some(
                                  (ec) => ec.courseId === c.courseId
                                );

                                if (isEnrolled) {
                                  handleGoToCourse(c);
                                } else {
                                  // Go to course details instead
                                  router.push(`/courses/${c.courseId}`);
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : selectedGradeId ? (
                    <div className="py-6 text-center text-muted-foreground">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Courses;

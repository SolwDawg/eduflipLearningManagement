"use client";

import { useGetCoursesQuery } from "@/state/api";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import Toolbar from "@/components/Toolbar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Loading from "@/components/Loading";

export default function CoursesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: courses, isLoading, isError } = useGetCoursesQuery();

  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    return courses.filter((course) => {
      const matchesSearch = course.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      return matchesSearch && course.status === "Published";
    });
  }, [courses, searchTerm]);

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  if (isLoading) return <Loading />;

  if (isError || !courses) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lỗi tải danh sách khóa học</h1>
          <p>
            Có lỗi xảy ra khi tải danh sách khóa học. Vui lòng thử lại sau.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Khám phá khóa học của chúng tôi</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Tìm kiếm khóa học hoàn hảo để nâng cao kỹ năng và kiến thức của bạn
        </p>
      </div>

      <Toolbar
        onSearch={setSearchTerm}
        onCategoryChange={setSelectedCategory}
      />

      {filteredCourses.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">Không tìm thấy khóa học</h2>
          <p className="text-muted-foreground">
            Điều chỉnh tìm kiếm hoặc bộ lọc danh mục
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filteredCourses.map((course) => (
            <Card
              key={course.courseId}
              className="overflow-hidden cursor-pointer transition-transform hover:-translate-y-1"
              onClick={() => handleCourseClick(course.courseId)}
            >
              <div className="relative h-48 w-full">
                <Image
                  src={course.image || "/placeholder.png"}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description || "No description available"}
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="" alt={course.teacherName} />
                    <AvatarFallback className="text-xs">
                      {course.teacherName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {course.teacherName}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {course.category}
                </span>
                <span className="text-xs bg-primary-500/20 text-primary-500 px-2 py-1 rounded">
                  {course.level}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Toolbar from "@/components/Toolbar";
import CourseCard from "@/components/CourseCard";
import { useGetUserEnrolledCoursesQuery } from "@/state/api";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useUser } from "@clerk/nextjs";
import { useState, useMemo } from "react";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";

const Courses = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const {
    data: courses,
    isLoading,
    isError,
    error,
  } = useGetUserEnrolledCoursesQuery(user?.id ?? "", {
    skip: !isLoaded || !user,
  });

  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    return courses.filter((course) => {
      const matchesSearch = course.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchTerm, selectedCategory]);

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

  if (!isLoaded || isLoading) return <Loading />;
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
    <div className="user-courses">
      <Header
        title="Khóa học của tôi"
        subtitle="Xem khóa học đã đăng ký của bạn"
      />
      {/* <Toolbar
        onSearch={setSearchTerm}
        onCategoryChange={setSelectedCategory}
      /> */}
      <div className="user-courses__grid">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.courseId}
            course={course}
            onGoToCourse={handleGoToCourse}
          />
        ))}
      </div>
    </div>
  );
};

export default Courses;

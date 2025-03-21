"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useCarousel } from "@/hooks/useCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCoursesQuery, useGetGradesQuery } from "@/state/api";
import { useRouter } from "next/navigation";
import CourseCardSearch from "@/components/CourseCardSearch";
import { useUser } from "@clerk/nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MonthlyLeaderboard from "@/components/MonthlyLeaderboard";

const LoadingSkeleton = () => {
  return (
    <div className="landing-skeleton">
      <div className="landing-skeleton__hero">
        <div className="landing-skeleton__hero-content">
          <Skeleton className="landing-skeleton__title" />
          <Skeleton className="landing-skeleton__subtitle" />
          <Skeleton className="landing-skeleton__subtitle-secondary" />
          <Skeleton className="landing-skeleton__button" />
        </div>
        <Skeleton className="landing-skeleton__hero-image" />
      </div>

      <div className="landing-skeleton__featured">
        <Skeleton className="landing-skeleton__featured-title" />
        <Skeleton className="landing-skeleton__featured-description" />

        <div className="landing-skeleton__tags">
          {[1, 2, 3, 4, 5].map((_, index) => (
            <Skeleton key={index} className="landing-skeleton__tag" />
          ))}
        </div>

        <div className="landing-skeleton__courses">
          {[1, 2, 3, 4].map((_, index) => (
            <Skeleton key={index} className="landing-skeleton__course-card" />
          ))}
        </div>
      </div>
    </div>
  );
};

const Landing = () => {
  const router = useRouter();
  const currentImage = useCarousel({ totalImages: 3 });
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const {
    data: grades,
    isLoading: isGradesLoading,
    error: gradesError,
  } = useGetGradesQuery();
  const {
    data: courses,
    isLoading: isCoursesLoading,
    isError,
  } = useGetCoursesQuery({});
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);

  // Debug grades data
  useEffect(() => {
    console.log("Grades data:", grades);
    console.log("Grades error:", gradesError);
  }, [grades, gradesError]);

  // Filter courses based on selected grade
  useEffect(() => {
    if (courses && selectedGradeId) {
      // Find grade to get courseIds
      const selectedGrade = Array.isArray(grades)
        ? grades.find((grade) => grade.gradeId === selectedGradeId)
        : undefined;
      if (selectedGrade && selectedGrade.courseIds) {
        // Filter courses that match the course IDs in the selected grade
        const coursesForGrade = courses.filter((course) =>
          selectedGrade.courseIds.includes(course.courseId)
        );
        setFilteredCourses(coursesForGrade);
      } else {
        setFilteredCourses([]);
      }
    } else if (courses) {
      // If no grade is selected, show all courses
      setFilteredCourses(courses);
    }
  }, [selectedGradeId, courses, grades]);

  const handleCourseClick = (courseId: string) => {
    router.push(`/search?id=${courseId}`, {
      scroll: false,
    });
  };

  const handleGradeChange = (gradeId: string) => {
    setSelectedGradeId(gradeId);
  };

  if (isCoursesLoading || isGradesLoading) return <LoadingSkeleton />;

  // Handle errors loading grades
  const hasGrades = grades && Array.isArray(grades) && grades.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="landing"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="landing__hero"
      >
        <div className="landing__hero-content">
          <h1 className="landing__title">Khoá học</h1>
          <p className="landing__description">
            Đây là danh sách các khóa học bạn có thể đăng ký.
            <br />
            Khóa học khi bạn cần chúng và muốn chúng.
          </p>
          <div className="landing__cta">
            <Link href="/search" scroll={false}>
              <div className="landing__cta-button">Tìm khoá học</div>
            </Link>
          </div>
        </div>
        <div className="landing__hero-images">
          {["/hero1.jpg", "/hero2.jpg", "/hero3.jpg"].map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`Hero Banner ${index + 1}`}
              fill
              priority={index === currentImage}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`landing__hero-image ${
                index === currentImage ? "landing__hero-image--active" : ""
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Monthly Leaderboard Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ amount: 0.3, once: true }}
        className="px-4 py-8 flex flex-col items-center"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Học viên xuất sắc tháng này
        </h2>
        <MonthlyLeaderboard />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ amount: 0.3, once: true }}
        className="landing__featured"
      >
        <h2 className="landing__featured-title">Khoá học hữu ích</h2>
        <p className="landing__featured-description">
          Từ người mới bắt đầu đến người nâng cao, trong tất cả các ngành, chúng
          tôi có khóa học chính xác chỉ dành cho bạn và chuẩn bị hành trình của
          bạn từ việc học tập đến việc làm việc và tạo ra nhiều điều tốt nhất.
        </p>

        {/* Grade Selection Component */}
        <div className="landing__grade-selection my-6">
          <h3 className="text-lg font-medium mb-2">Chọn khối lớp</h3>
          {gradesError ? (
            <p className="text-red-500 mb-2">
              Không thể tải danh sách khối lớp. Vui lòng thử lại sau.
            </p>
          ) : !hasGrades ? (
            <p className="text-amber-500 mb-2">
              {/* Chưa có khối lớp nào. Liên hệ quản trị viên để tạo khối lớp. */}
            </p>
          ) : null}
          <Select
            onValueChange={handleGradeChange}
            value={selectedGradeId || undefined}
          >
            <SelectTrigger className="w-full md:w-72">
              <SelectValue placeholder="Chọn khối lớp để xem khoá học" />
            </SelectTrigger>
            <SelectContent>
              {grades &&
                Array.isArray(grades) &&
                grades.map((grade) => (
                  <SelectItem key={grade.gradeId} value={grade.gradeId}>
                    {grade.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="landing__courses">
          {selectedGradeId ? (
            filteredCourses.length > 0 ? (
              filteredCourses.slice(0, 4).map((course, index) => (
                <motion.div
                  key={course.courseId}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ amount: 0.4 }}
                >
                  <CourseCardSearch
                    course={course}
                    onClick={() => handleCourseClick(course.courseId)}
                  />
                </motion.div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-500">
                Không có khoá học nào cho khối lớp này
              </p>
            )
          ) : (
            <p className="text-center py-8 text-primary-700">
              Vui lòng chọn khối lớp để xem khoá học
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Landing;

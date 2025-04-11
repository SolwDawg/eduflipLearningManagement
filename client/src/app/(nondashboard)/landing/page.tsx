"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useCarousel } from "@/hooks/useCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetCoursesQuery,
  useGetGradesQuery,
  useGetHomepageImagesQuery,
} from "@/state/api";
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

// Add this interface near imports
interface HomepageImage {
  imageId: string;
  imageUrl: string;
  createdAt: string;
  updatedAt?: string;
}

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
  const { data: homepageImages } = useGetHomepageImagesQuery(undefined);
  const totalImages = homepageImages?.length || 0;
  const currentImage = useCarousel({ totalImages: Math.max(1, totalImages) });
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const {
    data: grades,
    isLoading: isGradesLoading,
    error: gradesError,
  } = useGetGradesQuery();
  const {
    data: courses,
    isLoading: coursesLoading,
    isError: coursesError,
  } = useGetCoursesQuery();
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);

  // Debug grades data
  useEffect(() => {
    console.log("Grades data:", grades);
    console.log("Is grades loading:", isGradesLoading);
    console.log("Grades error:", gradesError);

    if (gradesError) {
      console.error(
        "Detailed grades error:",
        JSON.stringify(gradesError, null, 2)
      );
    }
  }, [grades, gradesError, isGradesLoading]);

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

  if (coursesLoading || isGradesLoading) return <LoadingSkeleton />;

  // Handle errors loading grades
  const hasGrades = grades && Array.isArray(grades) && grades.length > 0;

  // Default fallback images if no images from API
  const heroImages =
    homepageImages && homepageImages.length > 0
      ? homepageImages.map((img: HomepageImage) => img.imageUrl)
      : ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg"];

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
            Chào mừng đến với nền tảng học tập của chúng tôi.
            <br />
            Vui lòng chọn khối lớp của bạn để bắt đầu.
          </p>
          <div className="landing__cta">
            <Link href="/search" scroll={false}>
              <div className="landing__cta-button">Tìm khoá học</div>
            </Link>
          </div>
        </div>
        <div className="landing__hero-images">
          {heroImages.map((src: string, index: number) => (
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

      {/* Grade Selection Component - Moved up for prominence */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ amount: 0.3, once: true }}
        className="landing__grade-selection mt-60 mb-8 p-6  rounded-lg shadow-sm max-w-3xl mx-auto"
      >
        <h2 className="text-2xl font-semibold mb-4 text-center text-primary-700">
          Bước 1: Chọn khối lớp của bạn
        </h2>
        <p className="text-center mb-4 text-foreground">
          Để đăng ký các khóa học, trước tiên bạn cần chọn khối lớp phù hợp với
          bạn. Mỗi khối lớp có những khóa học được thiết kế riêng theo trình độ.
        </p>
        {gradesError ? (
          <p className="text-destructive mb-2 text-center">
            Không thể tải danh sách khối lớp. Vui lòng thử lại sau.
          </p>
        ) : !hasGrades ? (
          <p className="text-chart-1 mb-2 text-center">
            Chưa có khối lớp nào. Liên hệ quản trị viên để tạo khối lớp.
          </p>
        ) : null}
        <Select
          onValueChange={handleGradeChange}
          value={selectedGradeId || undefined}
        >
          <SelectTrigger className="w-full max-w-md mx-auto">
            <SelectValue placeholder="Chọn khối lớp của bạn" />
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

        {selectedGradeId && (
          <div className="mt-4 text-center text-primary-600 font-medium">
            Bạn đã chọn khối lớp. Hãy xem các khóa học phù hợp bên dưới!
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ amount: 0.3, once: true }}
        className="landing__featured"
      >
        <h2 className="landing__featured-title">
          {selectedGradeId
            ? "Bước 2: Chọn khóa học phù hợp"
            : "Khoá học hữu ích"}
        </h2>
        <p className="landing__featured-description">
          {selectedGradeId
            ? "Dưới đây là các khóa học được thiết kế dành riêng cho khối lớp bạn đã chọn. Chọn một khóa học để xem chi tiết và đăng ký."
            : "Vui lòng chọn khối lớp ở trên để xem danh sách các khóa học phù hợp với trình độ của bạn."}
        </p>

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
              <p className="text-center py-8 text-foreground">
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

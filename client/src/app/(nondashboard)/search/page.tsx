"use client";

import Loading from "@/components/Loading";
import { useGetCoursesQuery, useGetGradesQuery } from "@/state/api";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CourseCardSearch from "@/components/CourseCardSearch";
import SelectedCourse from "./SelectedCourse";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Search = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const gradeParam = searchParams.get("grade");

  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(
    gradeParam
  );
  const { data: grades, isLoading: isGradesLoading } = useGetGradesQuery();
  const {
    data: courses,
    isLoading: isCoursesLoading,
    isError,
  } = useGetCoursesQuery({});
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const router = useRouter();

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

        // If a course is selected, check if it's in the filtered courses
        if (
          selectedCourse &&
          !coursesForGrade.some((c) => c.courseId === selectedCourse.courseId)
        ) {
          // If the selected course is not in the filtered list, select the first one from filtered list
          setSelectedCourse(
            coursesForGrade.length > 0 ? coursesForGrade[0] : null
          );
        }
      } else {
        setFilteredCourses([]);
        setSelectedCourse(null);
      }
    } else if (courses) {
      // If no grade is selected, show all courses
      setFilteredCourses(courses);
    }
  }, [selectedGradeId, courses, grades, selectedCourse]);

  // Set selected course based on URL parameter
  useEffect(() => {
    if (filteredCourses.length > 0) {
      if (id) {
        const course = filteredCourses.find((c) => c.courseId === id);
        setSelectedCourse(course || filteredCourses[0]);
      } else {
        setSelectedCourse(filteredCourses[0]);
      }
    }
  }, [filteredCourses, id]);

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);

    // Update URL to include both course ID and grade filter
    const query = new URLSearchParams();
    if (course.courseId) query.set("id", course.courseId);
    if (selectedGradeId) query.set("grade", selectedGradeId);

    router.push(`/search?${query.toString()}`, {
      scroll: false,
    });
  };

  const handleGradeChange = (gradeId: string) => {
    setSelectedGradeId(gradeId);

    // Update URL to include the grade filter
    const query = new URLSearchParams();
    if (id) query.set("id", id);
    query.set("grade", gradeId);

    router.push(`/search?${query.toString()}`, {
      scroll: false,
    });
  };

  const handleEnrollNow = (courseId: string) => {
    // In a real application, you would make an API call to enroll the user
    // For now, just redirect to the course page
    router.push(`/user/courses/${courseId}`, {
      scroll: false,
    });
  };

  if (isCoursesLoading || isGradesLoading) return <Loading />;
  if (isError || !courses) return <div>Lỗi khi tải khoá học</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="search"
    >
      <h1 className="search__title">Danh sách khoá học có sẵn</h1>

      {/* Grade Selection */}
      <div className="my-4">
        <h3 className="text-lg font-medium mb-2">
          Chọn khối lớp để xem khoá học
        </h3>
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

      <h2 className="search__subtitle">
        {selectedGradeId
          ? `${filteredCourses.length} khoá học khối ${
              (Array.isArray(grades) &&
                grades.find((g) => g.gradeId === selectedGradeId)?.name) ||
              ""
            }`
          : `${courses.length} khoá học`}
      </h2>

      <div className="search__content">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="search__courses-grid"
        >
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <CourseCardSearch
                key={course.courseId}
                course={course}
                isSelected={selectedCourse?.courseId === course.courseId}
                onClick={() => handleCourseSelect(course)}
              />
            ))
          ) : (
            <p className="text-center py-8 text-gray-500">
              {selectedGradeId
                ? "Không có khoá học nào cho khối lớp này"
                : "Vui lòng chọn khối lớp để xem khoá học"}
            </p>
          )}
        </motion.div>

        {selectedCourse && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="search__selected-course"
          >
            <SelectedCourse
              course={selectedCourse}
              handleEnrollNow={handleEnrollNow}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Search;

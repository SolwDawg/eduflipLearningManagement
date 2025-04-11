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
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";

const Search = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const gradeParam = searchParams.get("grade");
  const queryParam = searchParams.get("query");

  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(
    gradeParam
  );
  const [searchQuery, setSearchQuery] = useState<string>(queryParam || "");

  const { data: grades, isLoading: isGradesLoading } = useGetGradesQuery();
  const {
    data: courses,
    isLoading: coursesLoading,
    isError: coursesError,
  } = useGetCoursesQuery();

  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const router = useRouter();

  // Fetch search results if query parameter is present
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!queryParam || queryParam.trim() === "") return;

      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL
          }/courses/search?query=${encodeURIComponent(queryParam)}`
        );

        const data = await response.json();

        // Check if data contains valid courses array
        if (data && data.courses && Array.isArray(data.courses)) {
          setFilteredCourses(data.courses);

          // Select the first result if any are found
          if (data.courses.length > 0) {
            setSelectedCourse(data.courses[0]);
          } else {
            setSelectedCourse(null);
          }
        } else {
          // Handle invalid response format
          setFilteredCourses([]);
          setSelectedCourse(null);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
        setFilteredCourses([]);
        setSelectedCourse(null);
      }
    };

    if (queryParam) {
      fetchSearchResults();
    }
  }, [queryParam]);

  // Filter courses based on selected grade
  useEffect(() => {
    if (courses && selectedGradeId && !queryParam) {
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
    } else if (courses && !queryParam) {
      // If no grade is selected and no search query, show all courses
      setFilteredCourses(courses);
    }
  }, [selectedGradeId, courses, grades, selectedCourse, queryParam]);

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

    // Update URL to include course ID, grade filter, and search query
    const query = new URLSearchParams();
    if (course.courseId) query.set("id", course.courseId);
    if (selectedGradeId) query.set("grade", selectedGradeId);
    if (searchQuery) query.set("query", searchQuery);

    router.push(`/search?${query.toString()}`, {
      scroll: false,
    });
  };

  const handleGradeChange = (gradeId: string) => {
    setSelectedGradeId(gradeId);
    setSearchQuery(""); // Clear search query when changing grade

    // Update URL to include the grade filter
    const query = new URLSearchParams();
    if (id) query.set("id", id);
    query.set("grade", gradeId);

    router.push(`/search?${query.toString()}`, {
      scroll: false,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Update URL with search query
    const query = new URLSearchParams();
    if (id) query.set("id", id);
    if (selectedGradeId) query.set("grade", selectedGradeId);
    query.set("query", searchQuery);

    router.push(`/search?${query.toString()}`, {
      scroll: false,
    });
  };

  const handleEnrollNow = (courseId: string) => {
    router.push(`/courses/${courseId}`, {
      scroll: false,
    });
  };

  if (coursesLoading || isGradesLoading) return <Loading />;
  if (coursesError || !courses) return <div>Lỗi khi tải khoá học</div>;

  // Determine title based on search context
  const getPageTitle = () => {
    if (queryParam) {
      return `Kết quả tìm kiếm cho "${queryParam}"`;
    }
    return "Danh sách khoá học có sẵn";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="search"
    >
      <h1 className="search__title">{getPageTitle()}</h1>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-xl bg-white-50 border-primary-300">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm khoá học..."
            className="pl-10 pr-4 py-2 w-full "
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded text-sm"
          >
            Tìm kiếm
          </button>
        </div>
      </form>

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
        {filteredCourses.length} khoá học{" "}
        {queryParam
          ? `phù hợp`
          : selectedGradeId
          ? `khối ${
              (Array.isArray(grades) &&
                grades.find((g) => g.gradeId === selectedGradeId)?.name) ||
              ""
            }`
          : ""}
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
              {queryParam
                ? "Không tìm thấy khoá học nào phù hợp"
                : selectedGradeId
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

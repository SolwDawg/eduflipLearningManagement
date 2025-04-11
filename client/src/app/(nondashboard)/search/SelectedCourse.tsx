import AccordionSections from "@/components/AccordionSections";
import { Button } from "@/components/ui/button";
import { useTokenCheck } from "@/hooks/useTokenCheck";
import React from "react";

const SelectedCourse = ({ course, handleEnrollNow }: SelectedCourseProps) => {
  // Use our token check hook
  const { checkTokenBeforeAction, isChecking } = useTokenCheck();

  // Wrap the enrollment handler with token check
  const handleEnrollmentWithTokenCheck = (courseId: string) => {
    checkTokenBeforeAction(() => handleEnrollNow(courseId));
  };

  return (
    <div className="selected-course">
      <div>
        <h3 className="selected-course__title">{course.title}</h3>
        <p className="selected-course__author">
          <span className="selected-course__enrollment-count">
            {course?.enrollments?.length}
          </span>
        </p>
      </div>

      <div className="selected-course__content">
        <p className="selected-course__description">{course.description}</p>

        <div className="selected-course__sections">
          <h4 className="selected-course__sections-title">Nội dung khóa học</h4>
          <AccordionSections sections={course.sections} />
        </div>

        <div className="selected-course__footer">
          <Button
            onClick={() => handleEnrollmentWithTokenCheck(course.courseId)}
            className="bg-primary-700 hover:bg-primary-600"
            disabled={isChecking}
          >
            {isChecking ? "Đang xử lý..." : "Tham gia khoá học"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectedCourse;

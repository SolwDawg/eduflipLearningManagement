import Image from "next/image";
import React from "react";
import AccordionSections from "./AccordionSections";

const CoursePreview = ({ course }: CoursePreviewProps) => {
  return (
    <div className="course-preview">
      <div className="course-preview__container border border-primary-300 rounded-lg p-4">
        <div className="course-preview__image-wrapper">
          <Image
            src={course.image || "/placeholder.png"}
            alt="Course Preview"
            width={640}
            height={360}
            className="w-full"
          />
        </div>
        <div>
          <h2 className="course-preview__title">{course.title}</h2>
          <p className="text-primary-400 text-md mb-4">
            bởi {course.teacherName}
          </p>
          <p className="text-sm text-primary-500">{course.description}</p>
        </div>

        <div>
          <h4 className="text-primary-800 font-semibold mb-2">Các Phần</h4>
          <AccordionSections sections={course.sections} />
        </div>
      </div>
    </div>
  );
};

export default CoursePreview;

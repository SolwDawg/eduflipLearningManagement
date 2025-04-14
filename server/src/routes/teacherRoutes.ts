import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getTeacherDashboard,
  getTeacherCourses,
  getTeacherStudentsOverview,
  getCourseEnrollmentCount,
  getCourseEnrollmentDetails,
  getCourseQuizCompletionCount,
  getStudentsWithQuizCompletions,
} from "../controllers/teacherController";

const router = express.Router();

// Get teacher dashboard data (courses, total students, etc)
router.get("/dashboard", requireAuth(), getTeacherDashboard);

// Get all courses created by the teacher
router.get("/courses", requireAuth(), getTeacherCourses);

// Get overview of all students across all teacher's courses
router.get("/students-overview", requireAuth(), getTeacherStudentsOverview);

// Get exact enrollment count for a specific course
router.get(
  "/course/:courseId/enrollment-count",
  requireAuth(),
  getCourseEnrollmentCount
);

// Get detailed enrollment information for a specific course
router.get(
  "/course/:courseId/enrollment-details",
  requireAuth(),
  getCourseEnrollmentDetails
);

// Get count of students who have completed quizzes for a specific course
router.get(
  "/course/:courseId/quiz-completion-count",
  requireAuth(),
  getCourseQuizCompletionCount
);

// Get detailed information about students who have completed quizzes for a specific course
router.get(
  "/course/:courseId/students-with-quiz-completions",
  requireAuth(),
  getStudentsWithQuizCompletions
);

export default router;

import express, { RequestHandler } from "express";
import {
  getUserCourseProgress,
  getUserEnrolledCourses,
  updateUserCourseProgress,
  enrollCourse,
  getMonthlyLeaderboard,
  trackMaterialAccess,
  trackQuizResult,
  trackDiscussionActivity,
  getStudentProgressAnalytics,
  getStudentProgressDetails,
  getUserQuizResults,
  getCourseQuizResults,
  getEnrolledStudentsWithProgress,
  getAllStudentsProgress,
} from "../controllers/userCourseProgressController";

const router = express.Router();

router.get(
  "/:userId/enrolled-courses",
  getUserEnrolledCourses as RequestHandler
);
router.get(
  "/:userId/courses/:courseId",
  getUserCourseProgress as RequestHandler
);
router.post(
  "/:userId/courses/:courseId/enroll",
  enrollCourse as RequestHandler
);
router.put(
  "/:userId/courses/:courseId",
  updateUserCourseProgress as RequestHandler
);
router.get("/leaderboard/monthly", getMonthlyLeaderboard as RequestHandler);

// New routes for tracking student activity
router.post("/track/material-access", trackMaterialAccess as RequestHandler);
router.post("/track/quiz-result", trackQuizResult as RequestHandler);
router.post(
  "/track/discussion-activity",
  trackDiscussionActivity as RequestHandler
);

router.get(
  "/analytics/course/:courseId",
  getStudentProgressAnalytics as RequestHandler
);
router.get(
  "/analytics/course/:courseId/student/:userId",
  getStudentProgressDetails as RequestHandler
);

router.get("/:userId/quiz-results", getUserQuizResults as RequestHandler);

// New route for teacher to view all quiz results in a course
router.get(
  "/analytics/course/:courseId/quiz-results",
  getCourseQuizResults as RequestHandler
);

// New route to get all enrolled students for a course with their progress
router.get(
  "/analytics/course/:courseId/enrolled-students",
  getEnrolledStudentsWithProgress as RequestHandler
);

// New route to get all students across all courses with their progress
router.get("/analytics/all-students", getAllStudentsProgress as RequestHandler);

export default router;

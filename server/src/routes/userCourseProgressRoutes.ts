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

// New routes for teacher analytics
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

export default router;

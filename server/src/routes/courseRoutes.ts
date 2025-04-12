import express from "express";
import multer from "multer";
import {
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourse,
  getUploadVideoUrl,
  getUploadImageUrl,
  updateMeetLink,
  searchCourses,
  getStudentsProgress,
  getStudentDetailedProgress,
} from "../controllers/courseController";
import {
  getChapterComments,
  addChapterComment,
  deleteChapterComment,
} from "../controllers/commentController";
import { requireAuth } from "@clerk/express";
import { RequestHandler } from "express";
import {
  getPPTUploadUrl,
  uploadPowerPoint,
} from "../controllers/lectureController";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", listCourses as RequestHandler);
router.get("/search", searchCourses as RequestHandler);
router.post("/", requireAuth(), createCourse as RequestHandler);

router.get("/:courseId", getCourse as RequestHandler);
router.put(
  "/:courseId",
  requireAuth(),
  upload.single("image"),
  updateCourse as RequestHandler
);
router.delete("/:courseId", requireAuth(), deleteCourse as RequestHandler);

// Google Meet link route
router.put(
  "/:courseId/meet-link",
  requireAuth(),
  updateMeetLink as RequestHandler
);

router.post(
  "/:courseId/get-upload-image-url",
  requireAuth(),
  getUploadImageUrl as RequestHandler
);

router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/get-upload-url",
  requireAuth(),
  getUploadVideoUrl as RequestHandler
);

router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/get-ppt-upload-url",
  requireAuth(),
  getPPTUploadUrl as RequestHandler
);

// Direct server-side PowerPoint upload route
router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/upload-ppt",
  requireAuth(),
  upload.single("file"),
  uploadPowerPoint as RequestHandler
);

// Chapter comments routes
router.get(
  "/:courseId/sections/:sectionId/chapters/:chapterId/comments",
  getChapterComments as RequestHandler
);

router.post(
  "/:courseId/sections/:sectionId/chapters/:chapterId/comments",
  requireAuth(),
  addChapterComment as RequestHandler
);

router.delete(
  "/:courseId/sections/:sectionId/chapters/:chapterId/comments/:commentId",
  requireAuth(),
  deleteChapterComment as RequestHandler
);

router.get("/:courseId/students-progress", requireAuth(), getStudentsProgress);
router.get(
  "/:courseId/student/:studentId/progress",
  requireAuth(),
  getStudentDetailedProgress
);

export default router;

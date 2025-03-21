import express from "express";
import {
  getAllGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
  addCourseToGrade,
  removeCourseFromGrade,
  getGradeCourses,
} from "../controllers/gradeController";
import { RequestHandler } from "express";

const router = express.Router();

// Grade CRUD routes
router.get("/", getAllGrades as RequestHandler);
router.get("/:gradeId", getGradeById as RequestHandler);
router.post("/", createGrade as RequestHandler);
router.put("/:gradeId", updateGrade as RequestHandler);
router.delete("/:gradeId", deleteGrade as RequestHandler);

// Grade-Course relationship routes
router.get("/:gradeId/courses", getGradeCourses as RequestHandler);
router.post("/:gradeId/courses", addCourseToGrade as RequestHandler);
router.delete(
  "/:gradeId/courses/:courseId",
  removeCourseFromGrade as RequestHandler
);

export default router;

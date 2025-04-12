import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getTeacherDashboard,
  getTeacherCourses,
  getTeacherStudentsOverview,
} from "../controllers/teacherController";

const router = express.Router();

// Get teacher dashboard data (courses, total students, etc)
router.get("/dashboard", requireAuth(), getTeacherDashboard);

// Get all courses created by the teacher
router.get("/courses", requireAuth(), getTeacherCourses);

// Get overview of all students across all teacher's courses
router.get("/students-overview", requireAuth(), getTeacherStudentsOverview);

export default router;

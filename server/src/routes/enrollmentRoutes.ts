import express from "express";
import {
  enrollInCourse,
  listEnrollments,
} from "../controllers/enrollmentController";

const router = express.Router();

router.get("/", listEnrollments);
router.post("/", enrollInCourse);

export default router;

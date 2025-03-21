import express from "express";
import { requireAuth } from "@clerk/express";
import { RequestHandler } from "express";
import {
  createQuiz,
  getCourseQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  addQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
} from "../controllers/quizController";

const router = express.Router();

// Quiz routes
router.post("/", requireAuth(), createQuiz as RequestHandler);
router.get("/course/:courseId", getCourseQuizzes as RequestHandler);
router.get("/:quizId", getQuiz as RequestHandler);
router.put("/:quizId", requireAuth(), updateQuiz as RequestHandler);
router.delete("/:quizId", requireAuth(), deleteQuiz as RequestHandler);

// Question routes
router.post(
  "/:quizId/questions",
  requireAuth(),
  addQuizQuestion as RequestHandler
);
router.put(
  "/:quizId/questions/:questionId",
  requireAuth(),
  updateQuizQuestion as RequestHandler
);
router.delete(
  "/:quizId/questions/:questionId",
  requireAuth(),
  deleteQuizQuestion as RequestHandler
);

export default router;

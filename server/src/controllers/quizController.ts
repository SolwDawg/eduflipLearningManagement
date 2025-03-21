import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import Quiz, { QuizScope } from "../models/quizModel";
import Course from "../models/courseModel";

// Helper function to check teacher permissions
const checkTeacherPermission = async (
  courseId: string,
  userId: string
): Promise<boolean> => {
  try {
    const course = await Course.get(courseId);
    return course && course.teacherId === userId;
  } catch (error) {
    return false;
  }
};

// Create a new quiz
export const createQuiz = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = getAuth(req);
  const {
    title,
    description,
    scope,
    courseId,
    sectionId,
    chapterId,
    timeLimit,
  } = req.body;

  // Validate required fields based on scope
  if (!title || !scope || !courseId) {
    res.status(400).json({
      message:
        "Missing required fields: title, scope, and courseId are required",
    });
    return;
  }

  if (scope === QuizScope.SECTION && !sectionId) {
    res.status(400).json({
      message: "sectionId is required for section-level quizzes",
    });
    return;
  }

  if (scope === QuizScope.CHAPTER && (!sectionId || !chapterId)) {
    res.status(400).json({
      message: "sectionId and chapterId are required for chapter-level quizzes",
    });
    return;
  }

  try {
    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    // Check if user has permission to create quiz for this course
    const hasPermission = await checkTeacherPermission(courseId, userId);
    if (!hasPermission) {
      res.status(403).json({
        message: "Not authorized to create quizzes for this course",
      });
      return;
    }

    // Create new quiz
    const quiz = new Quiz({
      title,
      description,
      scope,
      courseId,
      sectionId,
      chapterId,
      timeLimit,
      questions: [],
    });

    await quiz.save();

    res.status(201).json({
      message: "Quiz created successfully",
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating quiz",
      error,
    });
  }
};

// Get all quizzes for a course
export const getCourseQuizzes = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;

  // Validate courseId
  if (!courseId) {
    res.status(400).json({
      message: "Course ID is required",
    });
    return;
  }

  try {
    // Fix: Using scan().where() instead of find() which doesn't exist in dynamoose
    const quizzes = await Quiz.scan("courseId").eq(courseId).exec();
    res.json(quizzes || []);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({
      message: "Error fetching quizzes",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get a specific quiz by ID
export const getQuiz = async (req: Request, res: Response): Promise<void> => {
  const { quizId } = req.params;

  try {
    // Fix: Using get() instead of findOne() which doesn't exist in dynamoose
    const quiz = await Quiz.get(quizId);

    if (!quiz) {
      res.status(404).json({ message: "Quiz not found" });
      return;
    }

    res.json(quiz);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching quiz",
      error,
    });
  }
};

// Update a quiz
export const updateQuiz = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { quizId } = req.params;
  const { userId } = getAuth(req);
  const updates = req.body;

  try {
    // Add additional logging to help diagnose issues
    console.log(`Updating quiz ${quizId} with data:`, JSON.stringify(updates));

    if (!quizId) {
      res.status(400).json({ message: "Quiz ID is required" });
      return;
    }

    // Fix: Using get() instead of findOne() which doesn't exist in dynamoose
    const quiz = await Quiz.get(quizId);

    if (!quiz) {
      res.status(404).json({ message: "Quiz not found" });
      return;
    }

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    // Check if user has permission to update quiz
    const hasPermission = await checkTeacherPermission(quiz.courseId, userId);
    if (!hasPermission) {
      res.status(403).json({
        message: "Not authorized to update this quiz",
      });
      return;
    }

    // Apply updates safely
    Object.keys(updates).forEach((key) => {
      if (key !== "quizId" && key !== "courseId") {
        // Only update if the value exists and is not undefined
        if (updates[key] !== undefined) {
          // In dynamoose, directly assign the value
          quiz[key] = updates[key];
        }
      }
    });

    // Save the updated quiz
    await quiz.save();

    res.json({
      message: "Quiz updated successfully",
      data: quiz,
    });
  } catch (error) {
    console.error(`Error updating quiz ${quizId}:`, error);
    res.status(500).json({
      message: "Error updating quiz",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Delete a quiz
export const deleteQuiz = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { quizId } = req.params;
  const { userId } = getAuth(req);

  try {
    // Fix: Using get() instead of findOne() which doesn't exist in dynamoose
    const quiz = await Quiz.get(quizId);

    if (!quiz) {
      res.status(404).json({ message: "Quiz not found" });
      return;
    }

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    // Check if user has permission to delete quiz
    const hasPermission = await checkTeacherPermission(quiz.courseId, userId);
    if (!hasPermission) {
      res.status(403).json({
        message: "Not authorized to delete this quiz",
      });
      return;
    }

    // Fix: Using delete() instead of deleteOne() which doesn't exist in dynamoose
    await quiz.delete();

    res.json({
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting quiz",
      error,
    });
  }
};

// Add a question to a quiz
export const addQuizQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { quizId } = req.params;
  const { userId } = getAuth(req);
  const questionData = req.body;

  try {
    // Fix: Using get() instead of findOne() which doesn't exist in dynamoose
    const quiz = await Quiz.get(quizId);

    if (!quiz) {
      res.status(404).json({ message: "Quiz not found" });
      return;
    }

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    // Check if user has permission to update quiz
    const hasPermission = await checkTeacherPermission(quiz.courseId, userId);
    if (!hasPermission) {
      res.status(403).json({
        message: "Not authorized to update this quiz",
      });
      return;
    }

    // Add question to quiz
    quiz.questions.push(questionData);
    await quiz.save();

    res.status(201).json({
      message: "Question added successfully",
      data: quiz.questions[quiz.questions.length - 1],
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding question",
      error,
    });
  }
};

// Update a question
export const updateQuizQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { quizId, questionId } = req.params;
  const { userId } = getAuth(req);
  const updates = req.body;

  try {
    // Fix: Using get() instead of findOne() which doesn't exist in dynamoose
    const quiz = await Quiz.get(quizId);

    if (!quiz) {
      res.status(404).json({ message: "Quiz not found" });
      return;
    }

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    // Check if user has permission to update quiz
    const hasPermission = await checkTeacherPermission(quiz.courseId, userId);
    if (!hasPermission) {
      res.status(403).json({
        message: "Not authorized to update this quiz",
      });
      return;
    }

    // Find the question
    const questionIndex = quiz.questions.findIndex(
      (q: { questionId: string }) => q.questionId === questionId
    );

    if (questionIndex === -1) {
      res.status(404).json({ message: "Question not found" });
      return;
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      if (key !== "questionId") {
        quiz.questions[questionIndex][key] = updates[key];
      }
    });

    await quiz.save();

    res.json({
      message: "Question updated successfully",
      data: quiz.questions[questionIndex],
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating question",
      error,
    });
  }
};

// Delete a question
export const deleteQuizQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { quizId, questionId } = req.params;
  const { userId } = getAuth(req);

  try {
    // Fix: Using get() instead of findOne() which doesn't exist in dynamoose
    const quiz = await Quiz.get(quizId);

    if (!quiz) {
      res.status(404).json({ message: "Quiz not found" });
      return;
    }

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    // Check if user has permission to update quiz
    const hasPermission = await checkTeacherPermission(quiz.courseId, userId);
    if (!hasPermission) {
      res.status(403).json({
        message: "Not authorized to update this quiz",
      });
      return;
    }

    // Find the question
    const questionIndex = quiz.questions.findIndex(
      (q: { questionId: string }) => q.questionId === questionId
    );

    if (questionIndex === -1) {
      res.status(404).json({ message: "Question not found" });
      return;
    }

    // Remove the question
    quiz.questions.splice(questionIndex, 1);
    await quiz.save();

    res.json({
      message: "Question deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting question",
      error,
    });
  }
};

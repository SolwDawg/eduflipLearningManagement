import * as dynamoose from "dynamoose";
import { v4 as uuidv4 } from "uuid";

// Question types enum
export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  ESSAY = "essay",
}

// Quiz scope enum
export enum QuizScope {
  CHAPTER = "chapter",
  SECTION = "section",
  COURSE = "course",
}

// Option schema for multiple choice questions
const optionSchema = new dynamoose.Schema({
  optionId: {
    type: String,
    default: uuidv4,
  },
  text: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
});

// Question schema
const questionSchema = new dynamoose.Schema({
  questionId: {
    type: String,
    default: uuidv4,
  },
  type: {
    type: String,
    enum: Object.values(QuestionType),
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    schema: [optionSchema],
    default: [],
  },
  correctAnswer: String,
  points: {
    type: Number,
    default: 1,
  },
});

// Quiz schema
const quizSchema = new dynamoose.Schema({
  quizId: {
    type: String,
    hashKey: true,
    default: uuidv4,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  scope: {
    type: String,
    enum: Object.values(QuizScope),
    required: true,
  },
  courseId: {
    type: String,
    required: true,
    index: {
      name: "courseIndex",
      type: "global",
    },
  },
  sectionId: String,
  chapterId: String,
  questions: {
    type: Array,
    schema: [questionSchema],
    default: [],
  },
  timeLimit: Number,
  isPublished: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the Quiz model
const Quiz = dynamoose.model("Quiz", quizSchema);

export default Quiz;

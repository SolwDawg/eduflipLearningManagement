import { Schema, model } from "dynamoose";

const chapterProgressSchema = new Schema({
  chapterId: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    required: true,
  },
  accessCount: {
    type: Number,
    required: true,
    default: 0,
  },
  lastAccessDate: {
    type: String,
    required: false,
  },
});

const sectionProgressSchema = new Schema({
  sectionId: {
    type: String,
    required: true,
  },
  chapters: {
    type: Array,
    schema: [chapterProgressSchema],
  },
});

const quizResultSchema = new Schema({
  quizId: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  completionDate: {
    type: String,
    required: true,
  },
  attemptCount: {
    type: Number,
    required: true,
    default: 1,
  },
  timeSpent: {
    type: Number,
    required: false,
    description: "Time spent on quiz in seconds",
  },
});

const discussionActivitySchema = new Schema({
  discussionId: {
    type: String,
    required: true,
  },
  postsCount: {
    type: Number,
    required: true,
    default: 0,
  },
  lastActivityDate: {
    type: String,
    required: true,
  },
});

const userCourseProgressSchema = new Schema(
  {
    userId: {
      type: String,
      hashKey: true,
      required: true,
    },
    courseId: {
      type: String,
      rangeKey: true,
      required: true,
    },
    enrollmentDate: {
      type: String,
      required: true,
    },
    overallProgress: {
      type: Number,
      required: true,
    },
    sections: {
      type: Array,
      schema: [sectionProgressSchema],
    },
    lastAccessedTimestamp: {
      type: String,
      required: true,
    },
    completedChapters: {
      type: Array,
      schema: [String],
      default: [],
    },
    quizResults: {
      type: Array,
      schema: [quizResultSchema],
      default: [],
    },
    discussionActivity: {
      type: Array,
      schema: [discussionActivitySchema],
      default: [],
    },
    totalMaterialAccessCount: {
      type: Number,
      required: true,
      default: 0,
    },
    averageQuizScore: {
      type: Number,
      required: false,
    },
    participationLevel: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const UserCourseProgress = model(
  "UserCourseProgress",
  userCourseProgressSchema
);
export default UserCourseProgress;

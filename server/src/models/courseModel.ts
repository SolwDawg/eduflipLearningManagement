import { Schema, model } from "dynamoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       required:
 *         - courseId
 *         - teacherId
 *         - teacherName
 *         - title
 *         - level
 *         - status
 *       properties:
 *         courseId:
 *           type: string
 *           description: The unique identifier for the course
 *         teacherId:
 *           type: string
 *           description: The ID of the teacher who created the course
 *         teacherName:
 *           type: string
 *           description: The name of the teacher
 *         title:
 *           type: string
 *           description: The title of the course
 *         description:
 *           type: string
 *           description: A description of the course
 *         image:
 *           type: string
 *           description: URL to the course image
 *         level:
 *           type: string
 *           enum: [Beginner, Intermediate, Advanced]
 *           description: The difficulty level of the course
 *         status:
 *           type: string
 *           enum: [Draft, Published]
 *           description: The publication status of the course
 *         meetLink:
 *           type: string
 *           description: Google Meet link for virtual classroom sessions
 *         sections:
 *           type: array
 *           description: The sections of the course
 *         enrollments:
 *           type: array
 *           description: Students enrolled in the course
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the course was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the course was last updated
 */
const commentSchema = new Schema({
  commentId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: String,
    required: true,
  },
});

const chapterSchema = new Schema({
  chapterId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Text", "Quiz", "Video", "Lecture", "Summary"],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  comments: {
    type: Array,
    schema: [commentSchema],
  },
  video: {
    type: String,
  },
  presentation: {
    type: String,
  },
  quiz: {
    type: Object,
    schema: new Schema({
      questions: {
        type: Array,
        default: [],
        schema: [],
      },
      timeLimit: Number,
      passingScore: Number,
    }),
    default: {},
  },
  summary: {
    type: String,
  },
  discussionForum: {
    type: Array,
    schema: [
      new Schema({
        postId: String,
        userId: String,
        userName: String,
        content: String,
        images: {
          type: Array,
        },
        timestamp: String,
        replies: {
          type: Array,
        },
      }),
    ],
  },
});

const sectionSchema = new Schema({
  sectionId: {
    type: String,
    required: true,
  },
  sectionTitle: {
    type: String,
    required: true,
  },
  sectionDescription: {
    type: String,
  },
  chapters: {
    type: Array,
    schema: [chapterSchema],
  },
});

const courseSchema = new Schema(
  {
    courseId: {
      type: String,
      hashKey: true,
      required: true,
    },
    teacherId: {
      type: String,
      required: true,
    },
    teacherName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
    },
    image: {
      type: String,
    },
    level: {
      type: String,
      required: true,
      enum: ["Beginner", "Intermediate", "Advanced"],
    },
    status: {
      type: String,
      required: true,
      enum: ["Draft", "Published"],
    },
    meetLink: {
      type: String,
      default: "",
    },
    sections: {
      type: Array,
      schema: [sectionSchema],
    },
    enrollments: {
      type: Array,
      schema: [
        new Schema({
          userId: {
            type: String,
            required: true,
          },
        }),
      ],
    },
  },
  {
    timestamps: true,
  }
);

const Course = model("Course", courseSchema);

export default Course;

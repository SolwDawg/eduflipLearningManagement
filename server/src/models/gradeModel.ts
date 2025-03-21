import { Schema, model } from "dynamoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     Grade:
 *       type: object
 *       required:
 *         - gradeId
 *         - name
 *         - level
 *       properties:
 *         gradeId:
 *           type: string
 *           description: The unique identifier for the grade
 *         name:
 *           type: string
 *           description: The name of the grade
 *         description:
 *           type: string
 *           description: A description of the grade
 *         level:
 *           type: number
 *           description: The level of the grade (e.g., 1, 2, 3)
 *         courseIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of course IDs associated with this grade
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the grade was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the grade was last updated
 *       example:
 *         gradeId: "grade-123"
 *         name: "First Grade"
 *         description: "Elementary school first grade"
 *         level: 1
 *         courseIds: ["course-1", "course-2"]
 *         createdAt: "2023-01-01T00:00:00.000Z"
 *         updatedAt: "2023-01-01T00:00:00.000Z"
 */
const gradeSchema = new Schema(
  {
    gradeId: {
      type: String,
      hashKey: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    level: {
      type: Number,
      required: true,
    },
    courseIds: {
      type: Array,
      schema: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Grade = model("Grade", gradeSchema);
export default Grade;

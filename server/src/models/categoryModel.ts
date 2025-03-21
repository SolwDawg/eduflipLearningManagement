import { Schema, model } from "dynamoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - slug
 *         - isActive
 *         - order
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the category
 *         description:
 *           type: string
 *           description: A description of the category
 *         slug:
 *           type: string
 *           description: URL-friendly identifier for the category
 *         isActive:
 *           type: boolean
 *           description: Whether the category is active
 *         order:
 *           type: number
 *           description: Display order for the category
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the category was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the category was last updated
 */
const categorySchema = new Schema(
  {
    slug: {
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
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Category = model("Category", categorySchema);
export default Category;

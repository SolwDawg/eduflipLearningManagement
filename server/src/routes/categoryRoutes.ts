import express from "express";
import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";

const router = express.Router();

// GET /categories - Get all categories
router.get("/", listCategories);

// GET /categories/:slug - Get a specific category by slug
router.get("/:slug", getCategory);

// POST /categories - Create a new category
router.post("/", createCategory);

// PUT /categories/:slug - Update a category
router.put("/:slug", updateCategory);

// DELETE /categories/:slug - Delete a category
router.delete("/:slug", deleteCategory);

export default router;

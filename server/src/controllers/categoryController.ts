import { Request, Response } from "express";
import Category from "../models/categoryModel";

export const listCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Fetching categories from database...");
    const categories = await Category.scan().exec();
    console.log(`Found ${categories.length} categories`);

    res.json({
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Error retrieving categories:", error);
    res.status(500).json({
      message: "Error retrieving categories",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { slug } = req.params;
  try {
    const category = await Category.get(slug);
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.json({ message: "Category retrieved successfully", data: category });
  } catch (error) {
    console.error("Error retrieving category:", error);
    res.status(500).json({
      message: "Error retrieving category",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description, slug, isActive, order } = req.body;

    // Check if category with slug already exists
    const existingCategory = await Category.get(slug).catch(() => null);
    if (existingCategory) {
      res
        .status(400)
        .json({ message: "Category with this slug already exists" });
      return;
    }

    const newCategory = new Category({
      name,
      description,
      slug,
      isActive: isActive !== undefined ? isActive : true,
      order: order !== undefined ? order : 0,
    });

    await newCategory.save();
    res
      .status(201)
      .json({ message: "Category created successfully", data: newCategory });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      message: "Error creating category",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { slug } = req.params;
  const { name, description, isActive, order } = req.body;

  try {
    const category = await Category.get(slug);
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive;
    if (order !== undefined) updates.order = order;

    const updatedCategory = await Category.update({ slug }, updates);
    res.json({
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      message: "Error updating category",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { slug } = req.params;

  try {
    // Check if category exists
    const category = await Category.get(slug);
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    await Category.delete(slug);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      message: "Error deleting category",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

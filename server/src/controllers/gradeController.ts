import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import Grade from "../models/gradeModel";
import Course from "../models/courseModel";

// Get all grades
export const getAllGrades = async (req: Request, res: Response) => {
  try {
    console.log("Attempting to fetch all grades");
    const grades = await Grade.scan().exec();

    // Log the result for debugging
    console.log(`Found ${grades.length} grades`);

    // Return the grades, even if empty array
    res.status(200).json({
      message: "Grades retrieved successfully",
      data: grades || [],
    });
  } catch (error) {
    console.error("Error fetching grades:", error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // Return a more descriptive error
    res.status(500).json({
      message: "Failed to fetch grades",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get grade by ID
export const getGradeById = async (req: Request, res: Response) => {
  try {
    const { gradeId } = req.params;
    const grade = await Grade.get({ gradeId });

    if (!grade) {
      return res.status(404).json({ message: "Grade not found" });
    }

    res.status(200).json(grade);
  } catch (error) {
    console.error("Error fetching grade:", error);
    res.status(500).json({ message: "Failed to fetch grade", error });
  }
};

// Create a new grade
export const createGrade = async (req: Request, res: Response) => {
  try {
    const { name, description, level, courseIds } = req.body;

    // Validate required fields
    if (!name || level === undefined) {
      return res.status(400).json({ message: "Name and level are required" });
    }

    // Create new grade with unique ID
    const newGrade = new Grade({
      gradeId: uuidv4(),
      name,
      description,
      level,
      courseIds: courseIds || [],
    });

    await newGrade.save();
    res.status(201).json(newGrade);
  } catch (error) {
    console.error("Error creating grade:", error);
    res.status(500).json({ message: "Failed to create grade", error });
  }
};

// Update a grade
export const updateGrade = async (req: Request, res: Response) => {
  try {
    const { gradeId } = req.params;
    const { name, description, level, courseIds } = req.body;

    // Check if grade exists
    const existingGrade = await Grade.get({ gradeId });
    if (!existingGrade) {
      return res.status(404).json({ message: "Grade not found" });
    }

    // Prepare update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (level !== undefined) updateData.level = level;
    if (courseIds !== undefined) updateData.courseIds = courseIds;

    // Update the grade
    const updatedGrade = await Grade.update({ gradeId }, updateData);

    res.status(200).json(updatedGrade);
  } catch (error) {
    console.error("Error updating grade:", error);
    res.status(500).json({ message: "Failed to update grade", error });
  }
};

// Delete a grade
export const deleteGrade = async (req: Request, res: Response) => {
  try {
    const { gradeId } = req.params;

    // Check if grade exists
    const existingGrade = await Grade.get({ gradeId });
    if (!existingGrade) {
      return res.status(404).json({ message: "Grade not found" });
    }

    // Delete the grade
    await Grade.delete({ gradeId });

    res.status(200).json({ message: "Grade deleted successfully" });
  } catch (error) {
    console.error("Error deleting grade:", error);
    res.status(500).json({ message: "Failed to delete grade", error });
  }
};

// Add a course to a grade
export const addCourseToGrade = async (req: Request, res: Response) => {
  try {
    const { gradeId } = req.params;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    const grade = await Grade.get({ gradeId });
    if (!grade) {
      return res.status(404).json({ message: "Grade not found" });
    }

    const course = await Course.get({ courseId });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if course is already in the grade
    if (grade.courseIds && grade.courseIds.includes(courseId)) {
      return res.status(400).json({ message: "Course already in this grade" });
    }

    // Add course to grade
    const courseIds = grade.courseIds || [];
    courseIds.push(courseId);

    const updatedGrade = await Grade.update({ gradeId }, { courseIds });

    res.status(200).json(updatedGrade);
  } catch (error) {
    console.error("Error adding course to grade:", error);
    res.status(500).json({ message: "Failed to add course to grade", error });
  }
};

// Remove a course from a grade
export const removeCourseFromGrade = async (req: Request, res: Response) => {
  try {
    const { gradeId, courseId } = req.params;

    // Check if grade exists
    const grade = await Grade.get({ gradeId });
    if (!grade) {
      return res.status(404).json({ message: "Grade not found" });
    }

    // Check if course is in the grade
    if (!grade.courseIds || !grade.courseIds.includes(courseId)) {
      return res.status(400).json({ message: "Course not in this grade" });
    }

    // Remove course from grade
    const courseIds = grade.courseIds.filter((id: string) => id !== courseId);

    const updatedGrade = await Grade.update({ gradeId }, { courseIds });

    res.status(200).json(updatedGrade);
  } catch (error) {
    console.error("Error removing course from grade:", error);
    res
      .status(500)
      .json({ message: "Failed to remove course from grade", error });
  }
};

// Get all courses in a grade
export const getGradeCourses = async (req: Request, res: Response) => {
  try {
    const { gradeId } = req.params;

    // Get the grade
    const grade = await Grade.get({ gradeId });
    if (!grade) {
      return res.status(404).json({ message: "Grade not found" });
    }

    if (!grade.courseIds || grade.courseIds.length === 0) {
      return res.status(200).json([]);
    }

    // Get all courses in the grade
    const courses = [];
    for (const courseId of grade.courseIds) {
      try {
        const course = await Course.get({ courseId });
        if (course) {
          courses.push(course);
        }
      } catch (error) {
        console.error(`Error fetching course ${courseId}:`, error);
      }
    }

    res.status(200).json(courses);
  } catch (error) {
    console.error("Error fetching grade courses:", error);
    res.status(500).json({ message: "Failed to fetch grade courses", error });
  }
};

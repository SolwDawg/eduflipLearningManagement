import Grade from "../models/gradeModel";
import fs from "fs";
import path from "path";

const seedGrades = async (): Promise<void> => {
  console.log("Starting grade seeding...");

  try {
    // Read the grades data from the JSON files
    const gradesDataPath = path.join(__dirname, "./data/grades.json");
    const subjectGradesDataPath = path.join(
      __dirname,
      "./data/subjectGrades.json"
    );

    const gradesData = JSON.parse(fs.readFileSync(gradesDataPath, "utf8"));
    const subjectGradesData = JSON.parse(
      fs.readFileSync(subjectGradesDataPath, "utf8")
    );

    // Combine both grade data arrays
    const allGradesData = [...gradesData, ...subjectGradesData];

    // Delete existing grades first (clean start)
    try {
      const existingGrades = await Grade.scan().exec();
      if (existingGrades && existingGrades.length > 0) {
        console.log(
          `Found ${existingGrades.length} existing grades, removing them first...`
        );
        for (const grade of existingGrades) {
          await grade.delete();
        }
        console.log("Existing grades removed successfully");
      }
    } catch (deleteError) {
      console.error("Error while removing existing grades:", deleteError);
    }

    // Insert all the grades from the JSON files
    console.log(`Starting to seed ${allGradesData.length} grades...`);
    for (const gradeData of allGradesData) {
      try {
        await Grade.create({
          gradeId: gradeData.gradeId,
          name: gradeData.name,
          description: gradeData.description,
          level: gradeData.level,
          courseIds: gradeData.courseIds || [],
        });
        console.log(`Grade created: ${gradeData.name} (${gradeData.gradeId})`);
      } catch (error) {
        console.error(`Error creating grade ${gradeData.gradeId}:`, error);
      }
    }

    console.log("Grade seeding completed successfully");
  } catch (error) {
    console.error("Error seeding grades:", error);
    throw error;
  }
};

export default seedGrades;

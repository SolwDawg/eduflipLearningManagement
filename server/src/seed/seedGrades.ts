#!/usr/bin/env node

import dotenv from "dotenv";
import seedGrades from "./gradeSeeder";

// Load environment variables
dotenv.config();

/**
 * Main function to seed only the grades data
 */
async function seedOnlyGrades() {
  console.log("Starting grades seeding process...");

  try {
    await seedGrades();
    console.log("✅ Grades seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding grades:", error);
    process.exit(1);
  }
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedOnlyGrades()
    .then(() => {
      console.log("Grades seeding process finished.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to seed grades:", error);
      process.exit(1);
    });
}

export default seedOnlyGrades;

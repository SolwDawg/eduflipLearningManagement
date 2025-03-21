import Category from "../models/categoryModel";

const seedCategories = async (): Promise<void> => {
  console.log("Starting category seeding...");

  try {
    // Initial categories data
    const categories = [
      {
        name: "Technology",
        description:
          "Technology courses covering programming, web development, and more",
        slug: "technology",
        isActive: true,
        order: 1,
      },
      {
        name: "Science",
        description:
          "Science courses covering physics, chemistry, biology, and more",
        slug: "science",
        isActive: true,
        order: 2,
      },
      {
        name: "Mathematics",
        description:
          "Mathematics courses covering algebra, calculus, statistics, and more",
        slug: "mathematics",
        isActive: true,
        order: 3,
      },
      {
        name: "Artificial Intelligence",
        description:
          "AI courses covering machine learning, deep learning, and more",
        slug: "artificial-intelligence",
        isActive: true,
        order: 4,
      },
    ];

    // Create each category
    for (const categoryData of categories) {
      // Check if category already exists
      const existingCategory = await Category.get(categoryData.slug).catch(
        () => null
      );

      if (!existingCategory) {
        console.log(`Creating category: ${categoryData.name}`);
        const category = new Category(categoryData);
        await category.save();
      } else {
        console.log(`Category already exists: ${categoryData.name}`);
      }
    }

    console.log("Category seeding completed");
  } catch (error) {
    console.error("Error seeding categories:", error);
  }
};

export default seedCategories;

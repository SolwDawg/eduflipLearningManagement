import { HomepageImage } from "../models/homepageImageModel";
import fs from "fs";
import path from "path";

export default async function seedHomepageImages() {
  try {
    console.log("Seeding homepage images...");

    // Read the homepage images data from the JSON file
    const homepageImagesPath = path.join(
      __dirname,
      "data",
      "homepageImages.json"
    );
    const homepageImagesData = JSON.parse(
      fs.readFileSync(homepageImagesPath, "utf8")
    );

    // First, delete all existing homepage images
    const existingImages = await HomepageImage.scan().exec();
    if (existingImages.length > 0) {
      console.log(
        `Deleting ${existingImages.length} existing homepage images...`
      );
      for (const image of existingImages) {
        await HomepageImage.delete({ imageId: image.imageId });
      }
    }

    // Create each homepage image
    for (const imageData of homepageImagesData) {
      await HomepageImage.create({
        imageId: imageData.imageId,
        imageUrl: imageData.imageUrl,
        createdAt: new Date(imageData.createdAt),
      });
    }

    console.log(
      `Successfully seeded ${homepageImagesData.length} homepage images`
    );
    return true;
  } catch (error) {
    console.error("Error seeding homepage images:", error);
    return false;
  }
}

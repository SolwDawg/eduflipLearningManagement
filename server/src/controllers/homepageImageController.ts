import { Request, Response } from "express";
import {
  HomepageImage,
  HomepageImageDocument,
} from "../models/homepageImageModel";
import { v4 as uuidv4 } from "uuid";
import { generateUploadUrl, deleteFileFromS3 } from "../utils/fileUpload";

// Get all homepage images
export const getAllHomepageImages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const images = await HomepageImage.scan().exec();
    res.status(200).json({
      message: "Homepage images retrieved successfully",
      data: images,
    });
  } catch (error) {
    console.error("Error fetching homepage images:", error);
    res.status(500).json({
      message: "Failed to fetch homepage images",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Generate presigned URLs for image uploads
export const getUploadUrls = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      res.status(400).json({
        message: "Files information is required and must be an array",
      });
      return;
    }

    const uploadUrls = [];

    for (const file of files) {
      const { name, type } = file;

      if (!name || !type) {
        res.status(400).json({ message: "Each file must have name and type" });
        return;
      }

      const uploadData = await generateUploadUrl(name, type);
      uploadUrls.push(uploadData);
    }

    res.status(200).json({ uploadUrls });
  } catch (error) {
    console.error("Error generating upload URLs:", error);
    res.status(500).json({ message: "Failed to generate upload URLs", error });
  }
};

// Add new homepage images
export const addHomepageImages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      res
        .status(400)
        .json({ message: "Image URLs are required and must be an array" });
      return;
    }

    const createdImages: HomepageImageDocument[] = [];

    // Create image records for each URL
    for (const imageUrl of imageUrls) {
      const newImage = {
        imageId: uuidv4(),
        imageUrl,
        createdAt: new Date(),
      };

      const savedImage = await HomepageImage.create(newImage);
      createdImages.push(savedImage);
    }

    res.status(201).json(createdImages);
  } catch (error) {
    console.error("Error adding homepage images:", error);
    res.status(500).json({ message: "Failed to add homepage images", error });
  }
};

// Update a homepage image
export const updateHomepageImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { imageId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      res.status(400).json({ message: "Image URL is required" });
      return;
    }

    // Get current image to extract file key for deletion
    const currentImage = await HomepageImage.get({ imageId });

    if (currentImage && currentImage.imageUrl) {
      // Extract file key from URL
      const currentFileKey = currentImage.imageUrl.split(".amazonaws.com/")[1];
      if (currentFileKey) {
        try {
          // Delete old file from S3
          await deleteFileFromS3(currentFileKey);
        } catch (deleteError) {
          console.error(
            "Warning: Failed to delete old file from S3:",
            deleteError
          );
          // Continue with update even if delete fails
        }
      }
    }

    const updatedImage = await HomepageImage.update(
      { imageId },
      { imageUrl, updatedAt: new Date() }
    );

    res.status(200).json(updatedImage);
  } catch (error) {
    console.error("Error updating homepage image:", error);
    res.status(500).json({ message: "Failed to update homepage image", error });
  }
};

// Delete a homepage image
export const deleteHomepageImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { imageId } = req.params;

    // Get the image to extract file key for deletion
    const image = await HomepageImage.get({ imageId });

    if (!image) {
      res.status(404).json({ message: "Homepage image not found" });
      return;
    }

    // Extract file key from URL
    if (image.imageUrl) {
      const fileKey = image.imageUrl.split(".amazonaws.com/")[1];
      if (fileKey) {
        try {
          // Delete file from S3
          await deleteFileFromS3(fileKey);
        } catch (deleteError) {
          console.error("Warning: Failed to delete file from S3:", deleteError);
          // Continue with DB deletion even if S3 delete fails
        }
      }
    }

    // Delete from database
    await HomepageImage.delete({ imageId });

    res.status(200).json({ message: "Homepage image deleted successfully" });
  } catch (error) {
    console.error("Error deleting homepage image:", error);
    res.status(500).json({ message: "Failed to delete homepage image", error });
  }
};

// Get a single homepage image by ID
export const getHomepageImageById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { imageId } = req.params;

    const image = await HomepageImage.get({ imageId });

    if (!image) {
      res.status(404).json({ message: "Homepage image not found" });
      return;
    }

    res.status(200).json(image);
  } catch (error) {
    console.error("Error fetching homepage image:", error);
    res.status(500).json({ message: "Failed to fetch homepage image", error });
  }
};

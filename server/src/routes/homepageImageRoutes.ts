import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getAllHomepageImages,
  addHomepageImages,
  updateHomepageImage,
  deleteHomepageImage,
  getHomepageImageById,
  getUploadUrls,
} from "../controllers/homepageImageController";

const router = express.Router();

// Public routes
router.get("/", getAllHomepageImages);
router.get("/:imageId", getHomepageImageById);

// Protected routes
router.post("/", requireAuth(), addHomepageImages);
router.post("/upload-urls", requireAuth(), getUploadUrls);
router.put("/:imageId", requireAuth(), updateHomepageImage);
router.delete("/:imageId", requireAuth(), deleteHomepageImage);

export default router;

import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import Course from "../models/courseModel";
import { getAuth } from "@clerk/express";
import { generateUploadUrl } from "../utils/mediaStorage";
import AWS from "aws-sdk";
import path from "path";

// Create a new lecture
export const createLecture = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId } = req.params;
  const { title, type, content } = req.body;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify teacher permissions
    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to edit this course" });
      return;
    }

    const sectionIndex = course.sections.findIndex(
      (section: any) => section.sectionId === sectionId
    );

    if (sectionIndex === -1) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const newLecture = {
      chapterId: uuidv4(),
      type,
      title,
      content,
      comments: [],
    };

    course.sections[sectionIndex].chapters.push(newLecture);
    await course.save();

    res.status(201).json({
      message: "Lecture created successfully",
      data: newLecture,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating lecture", error });
  }
};

// Update a lecture
export const updateLecture = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { title, type, content } = req.body;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify teacher permissions
    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to edit this course" });
      return;
    }

    const sectionIndex = course.sections.findIndex(
      (section: any) => section.sectionId === sectionId
    );

    if (sectionIndex === -1) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapterIndex = course.sections[sectionIndex].chapters.findIndex(
      (chapter: any) => chapter.chapterId === chapterId
    );

    if (chapterIndex === -1) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Update the lecture
    if (title)
      course.sections[sectionIndex].chapters[chapterIndex].title = title;
    if (type) course.sections[sectionIndex].chapters[chapterIndex].type = type;
    if (content)
      course.sections[sectionIndex].chapters[chapterIndex].content = content;

    await course.save();

    res.json({
      message: "Lecture updated successfully",
      data: course.sections[sectionIndex].chapters[chapterIndex],
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating lecture", error });
  }
};

// Delete a lecture
export const deleteLecture = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify teacher permissions
    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to edit this course" });
      return;
    }

    const sectionIndex = course.sections.findIndex(
      (section: any) => section.sectionId === sectionId
    );

    if (sectionIndex === -1) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapterIndex = course.sections[sectionIndex].chapters.findIndex(
      (chapter: any) => chapter.chapterId === chapterId
    );

    if (chapterIndex === -1) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Remove the lecture
    course.sections[sectionIndex].chapters.splice(chapterIndex, 1);
    await course.save();

    res.json({
      message: "Lecture deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting lecture", error });
  }
};

// Get PPT upload URL
export const getPPTUploadUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { fileName, fileType } = req.body;
  const { userId } = getAuth(req);

  if (!fileName || !fileType) {
    res.status(400).json({ message: "File name and type are required" });
    return;
  }

  // Validate file extension
  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  const validExtensions = ["ppt", "pptx", "pps", "ppsx"];

  if (!fileExtension || !validExtensions.includes(fileExtension)) {
    res.status(400).json({
      message:
        "Invalid file type. Only PowerPoint files (.ppt, .pptx, .pps, .ppsx) are allowed.",
    });
    return;
  }

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify teacher permissions
    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to edit this course" });
      return;
    }

    const uniqueId = uuidv4();
    const fileKey = `lectures/${courseId}/${sectionId}/${chapterId}/ppt/${uniqueId}-${fileName}`;
    const { uploadUrl, fileUrl } = await generateUploadUrl(fileKey);

    console.log(
      `Generated PowerPoint upload URL for file: ${fileName} (${fileType})`
    );
    console.log(`File will be stored at: ${fileKey}`);

    res.json({
      uploadUrl,
      presentationUrl: fileUrl,
    });
  } catch (error) {
    console.error("Error generating PowerPoint upload URL:", error);
    res.status(500).json({ message: "Error generating upload URL", error });
  }
};

// Get video upload URL
export const getVideoUploadUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { fileName, fileType } = req.body;
  const { userId } = getAuth(req);

  if (!fileName || !fileType) {
    res.status(400).json({ message: "File name and type are required" });
    return;
  }

  // Validate file extension
  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  const validExtensions = ["mp4", "webm", "m3u8", "mpd", "ts"];

  if (!fileExtension || !validExtensions.includes(fileExtension)) {
    res.status(400).json({
      message:
        "Invalid file type. Only video files (.mp4, .webm, .m3u8, .mpd, .ts) are allowed.",
    });
    return;
  }

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify teacher permissions
    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to edit this course" });
      return;
    }

    const uniqueId = uuidv4();
    const fileKey = `lectures/${courseId}/${sectionId}/${chapterId}/video/${uniqueId}-${fileName}`;
    const { uploadUrl, fileUrl } = await generateUploadUrl(fileKey);

    console.log(
      `Generated video upload URL for file: ${fileName} (${fileType})`
    );
    console.log(`File will be stored at: ${fileKey}`);

    res.json({
      uploadUrl,
      videoUrl: fileUrl,
    });
  } catch (error) {
    console.error("Error generating video upload URL:", error);
    res.status(500).json({ message: "Error generating upload URL", error });
  }
};

// Publish a lecture (change status from Draft to Published)
export const publishLecture = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.get(courseId);

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Verify teacher permissions
    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to edit this course" });
      return;
    }

    const sectionIndex = course.sections.findIndex(
      (section: any) => section.sectionId === sectionId
    );

    if (sectionIndex === -1) {
      res.status(404).json({ message: "Section not found" });
      return;
    }

    const chapterIndex = course.sections[sectionIndex].chapters.findIndex(
      (chapter: any) => chapter.chapterId === chapterId
    );

    if (chapterIndex === -1) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Set status to published
    course.sections[sectionIndex].chapters[chapterIndex].status = "Published";
    await course.save();

    res.json({
      message: "Lecture published successfully",
      data: course.sections[sectionIndex].chapters[chapterIndex],
    });
  } catch (error) {
    res.status(500).json({ message: "Error publishing lecture", error });
  }
};

// Upload PowerPoint file directly (server-side)
export const uploadPowerPoint = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { courseId, sectionId, chapterId } = req.params;
    const { userId } = getAuth(req);

    // Ensure this is a multipart request with a file
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    // Get the file details
    const file = req.file;
    const originalFileName = file.originalname;
    const fileExtension = originalFileName.split(".").pop()?.toLowerCase();

    // Validate file extension
    const validExtensions = ["ppt", "pptx", "pps", "ppsx"];
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      res.status(400).json({
        message:
          "Invalid file type. Only PowerPoint files (.ppt, .pptx, .pps, .ppsx) are allowed.",
      });
      return;
    }

    console.log(
      `Processing PowerPoint file upload: ${originalFileName} (${fileExtension} format)`
    );

    // Check permission
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({ message: "Not authorized to edit this course" });
      return;
    }

    // Configure S3 upload
    const uniqueId = uuidv4();
    const s3Key = `lectures/${courseId}/${sectionId}/${chapterId}/ppt/${uniqueId}-${originalFileName}`;

    const s3 = new AWS.S3({
      signatureVersion: "v4",
    });

    const bucketName = process.env.S3_BUCKET_NAME || "eduflip-s3";
    const contentType = getContentTypeForPresentation(originalFileName);

    // Upload to S3 with proper content type
    const params = {
      Bucket: bucketName,
      Key: s3Key,
      Body: file.buffer,
      ContentType: contentType,
    };

    console.log(
      `Uploading PowerPoint file (${file.size} bytes) to S3: ${s3Key}`
    );
    console.log(`Using content type: ${contentType}`);

    // Perform the upload
    const uploadResult = await s3.upload(params).promise();

    // Construct the URL for the uploaded file
    const fileUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;

    console.log(`PowerPoint file uploaded successfully: ${fileUrl}`);
    console.log(
      `S3 upload result: ${JSON.stringify({
        Location: uploadResult.Location,
        Key: uploadResult.Key,
        Bucket: uploadResult.Bucket,
      })}`
    );

    // Return the success response
    res.status(200).json({
      message: "PowerPoint file uploaded successfully",
      data: {
        presentationUrl: fileUrl,
        fileName: originalFileName,
        fileSize: file.size,
        fileType: contentType,
      },
    });
  } catch (error) {
    console.error("Error uploading PowerPoint file:", error);
    res.status(500).json({
      message: "Error uploading PowerPoint file",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Helper function to determine content type based on file extension
const getContentTypeForPresentation = (filename: string): string => {
  const extension = path.extname(filename).toLowerCase();

  switch (extension) {
    case ".ppt":
    case ".pps":
      return "application/vnd.ms-powerpoint";
    case ".pptx":
    case ".ppsx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    default:
      return "application/octet-stream";
  }
};

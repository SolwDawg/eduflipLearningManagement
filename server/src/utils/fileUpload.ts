import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

// Configure AWS S3
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
});

// S3 bucket name from environment variables
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "buckets3edu";

/**
 * Generate a presigned URL for uploading a file to S3
 * @param fileName - The desired file name for the upload
 * @param fileType - The MIME type of the file
 * @returns Object containing the upload URL and the file key
 */
export const generateUploadUrl = async (fileName: string, fileType: string) => {
  if (!BUCKET_NAME) {
    throw new Error("S3 bucket name is not defined");
  }

  // Generate a unique key for the file
  const fileKey = `homepage-images/${uuidv4()}-${fileName}`;

  // Set parameters for the presigned URL
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
    Expires: 60 * 15, // URL expires in 15 minutes
  };

  try {
    // Generate the presigned URL
    const uploadUrl = await s3.getSignedUrlPromise("putObject", params);

    return {
      uploadUrl,
      fileKey,
      fileUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`,
    };
  } catch (error) {
    console.error("Error generating S3 presigned URL:", error);
    throw error;
  }
};

/**
 * Delete a file from S3
 * @param fileKey - The key of the file to delete
 */
export const deleteFileFromS3 = async (fileKey: string) => {
  if (!BUCKET_NAME) {
    throw new Error("S3 bucket name is not defined");
  }

  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`File deleted successfully: ${fileKey}`);
  } catch (error) {
    console.error(`Error deleting file ${fileKey}:`, error);
    throw error;
  }
};

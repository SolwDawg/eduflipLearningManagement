import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

const s3 = new AWS.S3({
  signatureVersion: "v4",
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "eduflip-media";
const EXPIRES_IN = 3600; // URL expires in 1 hour

/**
 * Generates a pre-signed URL for uploading files to S3
 * @param fileKey The key (path) where the file will be stored in S3
 * @returns Object containing the upload URL and the URL where the file will be accessible
 */
export const generateUploadUrl = async (
  fileKey: string
): Promise<{ uploadUrl: string; fileUrl: string }> => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Expires: EXPIRES_IN,
    ContentType: getContentType(fileKey),
    ACL: "public-read",
  };

  try {
    const uploadUrl = await s3.getSignedUrlPromise("putObject", params);
    const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

    return {
      uploadUrl,
      fileUrl,
    };
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    throw new Error("Failed to generate upload URL");
  }
};

/**
 * Helper function to determine content type based on file extension
 */
const getContentType = (filename: string): string => {
  const extension = filename.split(".").pop()?.toLowerCase() || "";

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "pdf":
      return "application/pdf";
    case "ppt":
    case "pptx":
      return "application/vnd.ms-powerpoint";
    case "doc":
    case "docx":
      return "application/msword";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    default:
      return "application/octet-stream";
  }
};

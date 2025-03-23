import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "ap-southeast-1",
});

const s3 = new AWS.S3({
  signatureVersion: "v4",
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "eduflip-s3";
const EXPIRES_IN = 3600; // URL expires in 1 hour

/**
 * Check if a bucket exists in S3
 * @param bucketName The name of the bucket to check
 * @returns True if the bucket exists, false otherwise
 */
export const checkBucketExists = async (
  bucketName: string
): Promise<boolean> => {
  try {
    console.log(`Checking if bucket "${bucketName}" exists...`);
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`Bucket "${bucketName}" exists and is accessible.`);
    return true;
  } catch (error: any) {
    if (error.code === "NotFound" || error.code === "NoSuchBucket") {
      console.error(`Bucket "${bucketName}" does not exist.`);
      return false;
    } else if (error.code === "Forbidden") {
      console.error(
        `Bucket "${bucketName}" exists but you don't have permission to access it.`
      );
      return false;
    } else {
      console.error(`Error checking if bucket "${bucketName}" exists:`, error);
      return false;
    }
  }
};

/**
 * Generates a pre-signed URL for uploading files to S3
 * @param fileKey The key (path) where the file will be stored in S3
 * @returns Object containing the upload URL and the URL where the file will be accessible
 */
export const generateUploadUrl = async (
  fileKey: string
): Promise<{ uploadUrl: string; fileUrl: string }> => {
  // Check if bucket exists first
  const bucketExists = await checkBucketExists(BUCKET_NAME);
  if (!bucketExists) {
    console.error(
      `The S3 bucket "${BUCKET_NAME}" does not exist or is not accessible.`
    );
    throw new Error(
      `S3 bucket "${BUCKET_NAME}" is not available. Please check your configuration.`
    );
  }

  // Get file's content type for proper header configuration
  const contentType = getContentType(fileKey);
  console.log(
    `Generating pre-signed URL for ${fileKey} with content type: ${contentType}`
  );

  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Expires: EXPIRES_IN,
    ContentType: contentType,
  };

  try {
    // Enhanced logging before getting the signed URL
    console.log(
      `S3 putObject params: ${JSON.stringify({
        Bucket: params.Bucket,
        Key: params.Key,
        ContentType: params.ContentType,
        Expires: params.Expires,
      })}`
    );

    const uploadUrl = await s3.getSignedUrlPromise("putObject", params);
    // Log sanitized version of URL for debugging
    const sanitizedUrl = uploadUrl.split("?")[0]; // Remove query parameters containing keys
    console.log(
      `Generated pre-signed URL: ${sanitizedUrl}?[signature-removed]`
    );

    const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

    return {
      uploadUrl,
      fileUrl,
    };
  } catch (error) {
    // Enhanced error logging
    console.error("Error generating pre-signed URL:", error);

    if (error instanceof Error) {
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }

    // Check for AWS specific errors
    if (error && typeof error === "object" && "code" in error) {
      console.error(`AWS Error code: ${(error as any).code}`);
      console.error(`AWS Error message: ${(error as any).message}`);
    }

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
    // PowerPoint formats - updated content types for better compatibility
    case "ppt":
    case "pps":
      return "application/vnd.ms-powerpoint";
    case "pptx":
      // Added console.log for debugging
      console.log("Setting content type for PPTX file");
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "ppsx":
      return "application/vnd.openxmlformats-officedocument.presentationml.slideshow";
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
      console.log(`Unknown file extension: ${extension}, using octet-stream`);
      return "application/octet-stream";
  }
};

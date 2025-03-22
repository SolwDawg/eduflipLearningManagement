"use client";

import React, { useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, UploadCloud } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface UploadMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  sectionId: string;
  chapterId: string;
  type: "presentation" | "video";
}

const UploadMaterialDialog = ({
  open,
  onOpenChange,
  courseId,
  sectionId,
  chapterId,
  type,
}: UploadMaterialDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate PowerPoint file types
      if (type === "presentation") {
        const fileExt = file.name.split(".").pop()?.toLowerCase();
        const validExtensions = ["ppt", "pptx", "pps", "ppsx"];

        if (!fileExt || !validExtensions.includes(fileExt)) {
          toast({
            title: "Định dạng tệp không hợp lệ",
            description:
              "Vui lòng chọn một tệp PowerPoint hợp lệ (.ppt, .pptx, .pps, .ppsx)",
            variant: "destructive",
          });
          return;
        }
      }

      setFile(file);
    }
  };

  const getPreSignedUrl = async () => {
    try {
      const endpoint =
        type === "presentation"
          ? `/api/courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/get-ppt-upload-url`
          : `/api/courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/get-video-upload-url`;

      const response = await axios.post(endpoint);
      return response.data.uploadUrl;
    } catch (error) {
      console.error("Failed to get pre-signed URL:", error);
      throw error;
    }
  };

  const uploadFileDirectly = async () => {
    try {
      if (!file) {
        throw new Error("No file selected");
      }

      // For PowerPoint files, validate extensions
      if (type === "presentation") {
        const fileExt = file.name.split(".").pop()?.toLowerCase();
        const validExtensions = ["ppt", "pptx", "pps", "ppsx"];

        if (!fileExt || !validExtensions.includes(fileExt)) {
          throw new Error(
            `Invalid PowerPoint file type: ${fileExt}. Supported types: .ppt, .pptx, .pps, .ppsx`
          );
        }
      }

      const endpoint =
        type === "presentation"
          ? `/api/courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/upload-ppt`
          : `/api/courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/upload-video`;

      console.log(`Direct upload to endpoint: ${endpoint}`);

      const formData = new FormData();
      formData.append("file", file);

      // Add custom timeout based on file size
      const timeout =
        type === "presentation"
          ? Math.max(45000, file.size / 768) // PowerPoint: 45s minimum or ~1.3ms per KB
          : Math.max(60000, file.size / 512); // Video: 60s minimum or 2ms per KB

      console.log(
        `Upload timeout set to ${Math.round(timeout / 1000)}s for file size ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)} MB`
      );

      const response = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        },
      });

      // Check for successful response
      if (response.status !== 200) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      console.log("Server-side upload successful:", response.data);

      // Return the URL from the response if needed
      return type === "presentation"
        ? response.data.data?.presentationUrl
        : response.data.data?.videoUrl;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle Axios errors with more detail
        const errorMsg = error.response?.data?.message || error.message;
        console.error(`Failed to upload file directly:`, {
          message: errorMsg,
          status: error.response?.status,
          data: error.response?.data,
        });
        throw new Error(`Upload failed: ${errorMsg}`);
      } else {
        console.error("Failed to upload file directly:", error);
        throw error;
      }
    }
  };

  const uploadToPreSignedUrl = async (preSignedUrl: string) => {
    try {
      console.log(`Starting upload to pre-signed URL for file: ${file?.name}`);

      // For videos, use larger timeout
      const timeout = Math.max(120000, (file?.size || 0) / 256); // minimum 2 minutes or 4ms per KB
      console.log(
        `Upload timeout set to ${Math.round(timeout / 1000)}s for file size ${(
          (file?.size || 0) /
          (1024 * 1024)
        ).toFixed(2)} MB`
      );

      const response = await axios.put(preSignedUrl, file, {
        headers: {
          "Content-Type": file?.type || "application/octet-stream",
          // "x-amz-acl": "public-read",  // Important for S3 permissions
        },
        timeout,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        },
      });

      console.log(`Upload completed with status: ${response.status}`);
      if (response.status !== 200) {
        throw new Error(
          `Server responded with status: ${response.status}, ${response.statusText}`
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Check if it's a timeout
        if (error.code === "ECONNABORTED") {
          console.error(
            `Upload timed out for file ${file?.name}. File might be too large or connection too slow.`
          );
          throw new Error(
            `Upload timed out. The file may be too large or your connection is slow.`
          );
        }

        // Log more detailed error information
        console.error(`Network error when uploading file:`, {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data || "No response data",
        });

        throw new Error(`Network error during upload: ${error.message}`);
      }

      console.error("Failed to upload to pre-signed URL:", error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Không có tệp được chọn",
        description: "Vui lòng chọn một tệp để tải lên.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      let fileUrl;

      // Log file details before upload
      console.log(
        `Preparing to upload file: ${file.name} (${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)} MB)`
      );
      console.log(`File type: ${file.type}`);

      // For PowerPoint files, prefer server-side upload
      // For videos, prefer pre-signed URL (client-side upload)
      if (type === "presentation") {
        console.log(`Using server-side upload for PowerPoint: ${file.name}`);
        // Use direct upload for PowerPoint files
        fileUrl = await uploadFileDirectly();
        console.log(`PowerPoint uploaded successfully, URL: ${fileUrl}`);
      } else {
        console.log(`Using pre-signed URL upload for video: ${file.name}`);
        // Use pre-signed URL for video files (better for larger files)
        const preSignedUrl = await getPreSignedUrl();
        await uploadToPreSignedUrl(preSignedUrl);
      }

      toast({
        title: "Tải lên thành công",
        description: `${
          type === "presentation" ? "Bài trình bày PowerPoint" : "Video"
        } đã được tải lên thành công.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Upload failed:", error);

      // Provide clearer error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tải lên tệp. Vui lòng thử lại.";

      toast({
        title: "Tải lên thất bại",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {type === "presentation"
              ? "Tải lên bài trình bày PowerPoint"
              : "Tải lên bài giảng video"}
          </DialogTitle>
          <DialogDescription>
            {type === "presentation"
              ? "Tải lên bài trình bày PowerPoint cho chương này."
              : "Tải lên bài giảng video cho chương này."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">
              {type === "presentation" ? "Tệp PowerPoint" : "Tệp video"}
            </Label>
            <Input
              id="file"
              type="file"
              accept={
                type === "presentation"
                  ? ".ppt,.pptx,.pps,.ppsx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.presentationml.slideshow"
                  : "video/*"
              }
              onChange={handleFileChange}
            />
            {type === "presentation" && (
              <div className="text-xs text-gray-500 mt-1">
                Định dạng hỗ trợ: .ppt, .pptx, .pps, .ppsx
              </div>
            )}
          </div>
          {file && (
            <div className="text-sm">
              Tệp đã chọn: <span className="font-medium">{file.name}</span> (
              {(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
          {loading && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <div className="text-xs text-center mt-1">
                {uploadProgress}% đã tải lên
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            ) : (
              <UploadCloud className="mr-2 h-4 w-4" />
            )}
            {loading ? "Đang tải lên..." : "Tải lên"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadMaterialDialog;

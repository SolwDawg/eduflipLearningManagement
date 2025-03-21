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
      setFile(e.target.files[0]);
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
      const endpoint =
        type === "presentation"
          ? `/api/courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/upload-ppt`
          : `/api/courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/upload-video`;

      const formData = new FormData();
      formData.append("file", file as File);

      await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      });
    } catch (error) {
      console.error("Failed to upload file directly:", error);
      throw error;
    }
  };

  const uploadToPreSignedUrl = async (preSignedUrl: string) => {
    try {
      await axios.put(preSignedUrl, file, {
        headers: {
          "Content-Type": file?.type || "application/octet-stream",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      });
    } catch (error) {
      console.error("Failed to upload to pre-signed URL:", error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Method 1: Use pre-signed URL (recommended for larger files)
      const preSignedUrl = await getPreSignedUrl();
      await uploadToPreSignedUrl(preSignedUrl);

      // Alternative Method 2: Upload directly to API endpoint
      // await uploadFileDirectly();

      toast({
        title: "Upload successful",
        description: `${type === "presentation" ? "Presentation" : "Video"} uploaded successfully.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description:
          "There was an error uploading your file. Please try again.",
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
              ? "Upload Presentation"
              : "Upload Video Lecture"}
          </DialogTitle>
          <DialogDescription>
            {type === "presentation"
              ? "Upload a PowerPoint presentation for this chapter."
              : "Upload a video lecture for this chapter."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">
              {type === "presentation" ? "PowerPoint File" : "Video File"}
            </Label>
            <Input
              id="file"
              type="file"
              accept={
                type === "presentation"
                  ? ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  : "video/*"
              }
              onChange={handleFileChange}
            />
          </div>
          {file && (
            <div className="text-sm">
              Selected file: <span className="font-medium">{file.name}</span> (
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
                {uploadProgress}% uploaded
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
            Cancel
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
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadMaterialDialog;

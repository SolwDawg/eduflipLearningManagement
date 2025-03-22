"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Trash2, Upload, Loader2 } from "lucide-react";
import {
  useGetHomepageImagesQuery,
  useGetUploadUrlsMutation,
  useAddHomepageImagesMutation,
  useDeleteHomepageImageMutation,
} from "@/state/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// Add this interface near the top of the file
interface HomepageImage {
  imageId: string;
  imageUrl: string;
  createdAt: string;
  updatedAt?: string;
}

const HomepageImageAdmin = () => {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API hooks
  const {
    data: images,
    isLoading,
    refetch,
  } = useGetHomepageImagesQuery(undefined);
  const [getUploadUrls] = useGetUploadUrlsMutation();
  const [addHomepageImages] = useAddHomepageImagesMutation();
  const [deleteHomepageImage] = useDeleteHomepageImageMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
    }
  };

  const handleFileDelete = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleImageDelete = async (imageId: string) => {
    try {
      await deleteHomepageImage(imageId).unwrap();
      toast.success("Hình ảnh đã được xóa thành công");
      refetch();
    } catch (error) {
      console.error("Lỗi xóa hình ảnh:", error);
      toast.error("Không thể xóa hình ảnh");
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Vui lòng chọn ít nhất một tệp để tải lên");
      return;
    }

    setUploading(true);

    try {
      // 1. Get pre-signed URLs for each file
      const fileInfos = files.map((file) => ({
        name: file.name,
        type: file.type,
      }));

      const { uploadUrls } = await getUploadUrls(fileInfos).unwrap();

      // 2. Upload files to S3 using the pre-signed URLs
      const uploadPromises = uploadUrls.map(
        async (uploadData: any, index: number) => {
          const file = files[index];
          const response = await fetch(uploadData.uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          return uploadData.fileUrl;
        }
      );

      const uploadedUrls = await Promise.all(uploadPromises);

      // 3. Save the image URLs to the database
      await addHomepageImages(uploadedUrls).unwrap();

      // 4. Clear the form and refresh the list
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      refetch();
      toast.success("Hình ảnh đã được tải lên thành công");
    } catch (error) {
      console.error("Lỗi tải lên hình ảnh:", error);
      toast.error("Không thể tải lên hình ảnh");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Hình ảnh trang chủ</h1>
        <p className="text-muted-foreground">
          Quản lý hình ảnh được hiển thị trong carousel trang chủ.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Tải lên hình ảnh mới</CardTitle>
          <CardDescription>
            Chọn hình ảnh để thêm vào carousel trang chủ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
            />

            {files.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative border rounded-md overflow-hidden p-2"
                  >
                    <div className="aspect-video relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="object-cover w-full h-full rounded"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm truncate max-w-[80%]">
                        {file.name}
                      </span>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleFileDelete(index)}
                        disabled={uploading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải lên...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Tải lên hình ảnh
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hình ảnh hiện tại trên trang chủ</CardTitle>
          <CardDescription>
            Các hình ảnh này đang được hiển thị trên trang chủ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-[200px] w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : images && images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image: HomepageImage) => (
                <div
                  key={image.imageId}
                  className="relative border rounded-md overflow-hidden"
                >
                  <div className="aspect-video relative">
                    <Image
                      src={image.imageUrl}
                      alt="Homepage image"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleImageDelete(image.imageId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Không có hình ảnh nào đã được tải lên.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HomepageImageAdmin;

"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUp, Video, ArrowLeft } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import UploadMaterialDialog from "@/components/teacher/UploadMaterialDialog";

interface Chapter {
  id: string;
  title: string;
  hasPresentation: boolean;
  hasVideo: boolean;
}

interface Section {
  id: string;
  title: string;
  chapters: Chapter[];
}

interface Course {
  id: string;
  title: string;
  sections: Section[];
}

const CourseMaterialsPage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<{
    chapterId: string;
    sectionId: string;
    uploadType: "presentation" | "video";
  } | null>(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await axios.get(`/api/teacher/courses/${courseId}`);
        setCourse(response.data);
      } catch (error) {
        console.error("Failed to fetch course details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  const handleUploadClick = (
    sectionId: string,
    chapterId: string,
    type: "presentation" | "video"
  ) => {
    setSelectedChapter({ sectionId, chapterId, uploadType: type });
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <Button
        variant="ghost"
        className="mb-6 flex items-center"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Courses
      </Button>

      {loading ? (
        <div className="flex justify-center my-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : course ? (
        <>
          <PageTitle
            title={`Materials for ${course.title}`}
            description="Upload and manage presentations and videos for each chapter"
          />

          <div className="mt-6">
            <Accordion type="single" collapsible className="w-full">
              {course.sections.map((section) => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger className="text-lg font-medium">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pl-4">
                      {section.chapters.map((chapter) => (
                        <Card key={chapter.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                              <div className="font-medium mb-2 md:mb-0">
                                {chapter.title}
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant={
                                    chapter.hasPresentation
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  className="flex items-center"
                                  onClick={() =>
                                    handleUploadClick(
                                      section.id,
                                      chapter.id,
                                      "presentation"
                                    )
                                  }
                                >
                                  <FileUp className="mr-1 h-4 w-4" />
                                  {chapter.hasPresentation
                                    ? "Update Presentation"
                                    : "Upload Presentation"}
                                </Button>
                                <Button
                                  variant={
                                    chapter.hasVideo ? "default" : "outline"
                                  }
                                  size="sm"
                                  className="flex items-center"
                                  onClick={() =>
                                    handleUploadClick(
                                      section.id,
                                      chapter.id,
                                      "video"
                                    )
                                  }
                                >
                                  <Video className="mr-1 h-4 w-4" />
                                  {chapter.hasVideo
                                    ? "Update Video"
                                    : "Upload Video"}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </>
      ) : (
        <div className="text-center my-10">Course not found</div>
      )}

      {isDialogOpen && selectedChapter && (
        <UploadMaterialDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          courseId={courseId}
          sectionId={selectedChapter.sectionId}
          chapterId={selectedChapter.chapterId}
          type={selectedChapter.uploadType}
        />
      )}
    </div>
  );
};

export default CourseMaterialsPage;

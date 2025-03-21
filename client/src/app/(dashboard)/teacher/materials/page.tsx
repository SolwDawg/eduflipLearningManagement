"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight } from "lucide-react";
import PageTitle from "@/components/PageTitle";

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

const TeacherMaterialsPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // This would be replaced with your actual API endpoint
        const response = await axios.get("/api/teacher/courses");
        setCourses(response.data);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const navigateToCourse = (courseId: string) => {
    router.push(`/teacher/materials/course/${courseId}`);
  };

  return (
    <div className="container mx-auto p-6">
      <PageTitle
        title="Teaching Materials"
        description="Upload and manage course materials"
      />

      {loading ? (
        <div className="flex justify-center my-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-2">
                <CardTitle>{course.title}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full mt-4 flex justify-between items-center"
                  onClick={() => navigateToCourse(course.id)}
                >
                  <span className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Materials
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherMaterialsPage;

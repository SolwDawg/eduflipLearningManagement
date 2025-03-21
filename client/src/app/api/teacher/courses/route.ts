import { NextResponse } from "next/server";

// Mock data for teacher courses
const mockTeacherCourses = [
  {
    id: "1",
    title: "Web Development Fundamentals",
    description:
      "Learn the basics of web development including HTML, CSS, and JavaScript.",
    image: "/images/courses/web-dev.jpg",
    students: 24,
    progress: 67,
  },
  {
    id: "2",
    title: "Advanced React Techniques",
    description:
      "Master advanced concepts in React including hooks, context API, and Redux.",
    image: "/images/courses/react.jpg",
    students: 18,
    progress: 45,
  },
  {
    id: "3",
    title: "Python for Data Science",
    description:
      "Use Python for data analysis, visualization, and machine learning.",
    image: "/images/courses/python.jpg",
    students: 32,
    progress: 89,
  },
];

export async function GET() {
  // Simulate a slight delay to mimic a real API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json(mockTeacherCourses);
}

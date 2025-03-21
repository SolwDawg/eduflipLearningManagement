import { NextResponse } from "next/server";

// Mock data for courses with sections and chapters
const mockCourses = {
  "1": {
    id: "1",
    title: "Introduction to Web Development",
    description: "Learn the basics of HTML, CSS, and JavaScript",
    sections: [
      {
        id: "s1",
        title: "HTML Fundamentals",
        chapters: [
          {
            id: "c1",
            title: "Understanding HTML Structure",
            hasPresentation: true,
            hasVideo: false,
          },
          {
            id: "c2",
            title: "Working with HTML Forms",
            hasPresentation: false,
            hasVideo: true,
          },
        ],
      },
      {
        id: "s2",
        title: "CSS Styling",
        chapters: [
          {
            id: "c3",
            title: "CSS Selectors",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c4",
            title: "CSS Layout",
            hasPresentation: false,
            hasVideo: false,
          },
        ],
      },
    ],
  },
  "2": {
    id: "2",
    title: "Advanced React Techniques",
    description: "Master hooks, context API, and performance optimization",
    sections: [
      {
        id: "s3",
        title: "React Hooks",
        chapters: [
          {
            id: "c5",
            title: "useState and useEffect",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c6",
            title: "Custom Hooks",
            hasPresentation: true,
            hasVideo: false,
          },
        ],
      },
      {
        id: "s4",
        title: "Performance Optimization",
        chapters: [
          {
            id: "c7",
            title: "Memoization with useMemo",
            hasPresentation: false,
            hasVideo: true,
          },
          {
            id: "c8",
            title: "React.memo and useCallback",
            hasPresentation: false,
            hasVideo: false,
          },
        ],
      },
    ],
  },
  "3": {
    id: "3",
    title: "Database Design and SQL",
    description:
      "Learn how to design efficient databases and write complex queries",
    sections: [
      {
        id: "s5",
        title: "SQL Basics",
        chapters: [
          {
            id: "c9",
            title: "SELECT Statements",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c10",
            title: "Filtering with WHERE",
            hasPresentation: true,
            hasVideo: true,
          },
        ],
      },
      {
        id: "s6",
        title: "Database Design",
        chapters: [
          {
            id: "c11",
            title: "Entity Relationship Diagrams",
            hasPresentation: true,
            hasVideo: false,
          },
          {
            id: "c12",
            title: "Normalization",
            hasPresentation: false,
            hasVideo: true,
          },
        ],
      },
    ],
  },
};

export async function GET(
  request: Request,
  context: { params: { courseId: string } }
) {
  // Destructure params from context
  const { params } = context;
  const { courseId } = params;

  const course = mockCourses[courseId as keyof typeof mockCourses];

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Simulate a slight delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return NextResponse.json(course);
}

import { NextResponse } from "next/server";

// Mock student progress data by course ID
const mockStudentProgress = {
  "1": [
    {
      id: "s1",
      name: "Alice Johnson",
      email: "alice.j@example.com",
      profileImage: "/images/avatars/alice.jpg",
      progress: 85,
      lastActivity: "2023-08-10T14:30:00Z",
      completedChapters: 7,
      totalChapters: 8,
      totalTime: 14.5,
    },
    {
      id: "s2",
      name: "Bob Smith",
      email: "bob.smith@example.com",
      profileImage: "/images/avatars/bob.jpg",
      progress: 65,
      lastActivity: "2023-08-09T11:45:00Z",
      completedChapters: 5,
      totalChapters: 8,
      totalTime: 9.2,
    },
    {
      id: "s3",
      name: "Charlie Davis",
      email: "charlie.d@example.com",
      profileImage: "/images/avatars/charlie.jpg",
      progress: 40,
      lastActivity: "2023-08-07T09:20:00Z",
      completedChapters: 3,
      totalChapters: 8,
      totalTime: 6.8,
    },
    {
      id: "s4",
      name: "Diana Wilson",
      email: "diana.w@example.com",
      profileImage: "/images/avatars/diana.jpg",
      progress: 90,
      lastActivity: "2023-08-10T16:15:00Z",
      completedChapters: 8,
      totalChapters: 8,
      totalTime: 16.3,
    },
  ],
  "2": [
    {
      id: "s1",
      name: "Alice Johnson",
      email: "alice.j@example.com",
      profileImage: "/images/avatars/alice.jpg",
      progress: 60,
      lastActivity: "2023-08-08T10:15:00Z",
      completedChapters: 4,
      totalChapters: 8,
      totalTime: 8.7,
    },
    {
      id: "s5",
      name: "Ethan Brown",
      email: "ethan.b@example.com",
      profileImage: "/images/avatars/ethan.jpg",
      progress: 75,
      lastActivity: "2023-08-09T13:30:00Z",
      completedChapters: 6,
      totalChapters: 8,
      totalTime: 12.4,
    },
    {
      id: "s6",
      name: "Fiona Green",
      email: "fiona.g@example.com",
      profileImage: "/images/avatars/fiona.jpg",
      progress: 30,
      lastActivity: "2023-08-05T08:45:00Z",
      completedChapters: 2,
      totalChapters: 8,
      totalTime: 4.6,
    },
  ],
  "3": [
    {
      id: "s2",
      name: "Bob Smith",
      email: "bob.smith@example.com",
      profileImage: "/images/avatars/bob.jpg",
      progress: 80,
      lastActivity: "2023-08-10T09:30:00Z",
      completedChapters: 6,
      totalChapters: 8,
      totalTime: 10.8,
    },
    {
      id: "s3",
      name: "Charlie Davis",
      email: "charlie.d@example.com",
      profileImage: "/images/avatars/charlie.jpg",
      progress: 55,
      lastActivity: "2023-08-08T14:20:00Z",
      completedChapters: 4,
      totalChapters: 8,
      totalTime: 7.9,
    },
    {
      id: "s7",
      name: "George Hamilton",
      email: "george.h@example.com",
      profileImage: "/images/avatars/george.jpg",
      progress: 95,
      lastActivity: "2023-08-10T15:45:00Z",
      completedChapters: 8,
      totalChapters: 8,
      totalTime: 15.2,
    },
    {
      id: "s8",
      name: "Hannah Lee",
      email: "hannah.l@example.com",
      profileImage: "/images/avatars/hannah.jpg",
      progress: 70,
      lastActivity: "2023-08-09T10:10:00Z",
      completedChapters: 5,
      totalChapters: 8,
      totalTime: 9.5,
    },
    {
      id: "s9",
      name: "Ian Miller",
      email: "ian.m@example.com",
      profileImage: "/images/avatars/ian.jpg",
      progress: 45,
      lastActivity: "2023-08-07T11:30:00Z",
      completedChapters: 3,
      totalChapters: 8,
      totalTime: 5.3,
    },
  ],
};

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  const courseId = params.courseId;
  const students =
    mockStudentProgress[courseId as keyof typeof mockStudentProgress] || [];

  // Simulate a slight delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return NextResponse.json(students);
}

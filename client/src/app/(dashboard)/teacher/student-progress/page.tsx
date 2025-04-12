import React from "react";
import StudentLearningProgress from "@/components/StudentLearningProgress";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Learning Progress | eduflip",
  description: "Track detailed progress of all your students",
};

export default function StudentProgressPage() {
  return (
    <div className="container mx-auto py-6">
      <StudentLearningProgress />
    </div>
  );
}

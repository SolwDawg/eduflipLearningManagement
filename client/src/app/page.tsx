"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import NonDashboardNavbar from "@/components/NonDashboardNavbar";
import Footer from "@/components/Footer";
import Landing from "./(nondashboard)/landing/page";

export default function Home() {
  const router = useRouter();
  const [showLanding, setShowLanding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has visited before
    const hasVisitedBefore = localStorage.getItem("hasVisitedBefore");

    if (hasVisitedBefore) {
      // Skip welcome page for returning users
      setShowLanding(true);
    }

    setIsLoading(false);
  }, []);

  const handleStart = () => {
    // Save that user has visited
    localStorage.setItem("hasVisitedBefore", "true");
    setShowLanding(true);
  };

  // Show loading state while checking localStorage
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-t-2 border-b-2 border-primary-700 rounded-full animate-spin"></div>
          <p className="text-primary-700">Đang tải...</p>
        </div>
      </div>
    );
  }

  // If user has visited before or clicked "Bắt đầu", show the landing page
  if (showLanding) {
    return (
      <div className="nondashboard-layout">
        <NonDashboardNavbar />
        <main className="nondashboard-layout__main">
          <Landing />
        </main>
        <Footer />
      </div>
    );
  }

  // Otherwise, show the welcome page with updated colors
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white-50 to-primary-100">
      <div className="max-w-3xl w-full p-6 text-center">
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/eduflipLogo.png"
            alt="EduFlip Logo"
            width={300}
            height={150}
            priority
            className="h-auto"
          />
        </div>

        <h1 className="text-4xl font-bold mb-4 text-primary-700">
          Lớp học đổi chiều - Tư duy bức phá
        </h1>

        <p className="text-lg mb-8 text-foreground">
          Cùng tham gia nền tảng học tập thú vị với hàng ngàn bài học và trò
          chơi giáo dục
        </p>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleStart}
            className="w-full max-w-xs py-4 px-8 bg-primary-600 hover:bg-primary-500 text-primary-50 font-bold rounded-full text-xl transition-colors duration-200"
          >
            BẮT ĐẦU
          </button>

          <Link
            href="/signin"
            className="py-3 px-6 text-primary-700 hover:text-primary-600 font-medium"
          >
            TÔI ĐÃ CÓ TÀI KHOẢN
          </Link>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-8 px-4">
        <div className="flex items-center justify-center w-16 h-16 bg-chart-1 rounded-full animate-bounce shadow-md">
          <span className="text-lg font-bold">🔤</span>
        </div>
        <div
          className="flex items-center justify-center w-16 h-16 bg-chart-2 rounded-full animate-bounce shadow-md"
          style={{ animationDelay: "0.2s" }}
        >
          <span className="text-lg font-bold">🎮</span>
        </div>
        <div
          className="flex items-center justify-center w-16 h-16 bg-chart-3 rounded-full animate-bounce shadow-md"
          style={{ animationDelay: "0.4s" }}
        >
          <span className="text-lg font-bold">📚</span>
        </div>
        <div
          className="flex items-center justify-center w-16 h-16 bg-chart-4 rounded-full animate-bounce shadow-md"
          style={{ animationDelay: "0.6s" }}
        >
          <span className="text-lg font-bold">🏆</span>
        </div>
        <div
          className="flex items-center justify-center w-16 h-16 bg-chart-5 rounded-full animate-bounce shadow-md"
          style={{ animationDelay: "0.8s" }}
        >
          <span className="text-lg font-bold">🌟</span>
        </div>
      </div>
    </div>
  );
}

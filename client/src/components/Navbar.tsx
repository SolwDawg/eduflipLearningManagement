"use client";

import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Bell, BookOpen, Menu } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import SmartSearch from "./SmartSearch";

const Navbar = ({ isCoursePage }: { isCoursePage: boolean }) => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.userType as "student" | "teacher";

  return (
    <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-2 sm:px-6">
      <div className="flex h-14 items-center justify-between">
        <div className="flex items-center">
          <div className="block md:hidden">
            <SidebarTrigger className="mr-2 p-2 rounded-md hover:bg-gray-100">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
          </div>
          <SmartSearch placeholder="Tìm kiếm khoá học..." />
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <button className="relative p-2 rounded-full hover:bg-gray-100">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          <UserButton
            appearance={{
              baseTheme: dark,
              elements: {
                userButtonOuterIdentifier: "text-customgreys-dirtyGrey",
                userButtonBox: "scale-90 sm:scale-100",
              },
            }}
            showName={true}
            userProfileMode="navigation"
            userProfileUrl={
              userRole === "teacher" ? "/teacher/profile" : "/user/profile"
            }
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen, BarChart, User, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileNavigation = () => {
  const pathname = usePathname();

  const navLinks = [
    { icon: Home, label: "Home", href: "/user" },
    { icon: BookOpen, label: "Courses", href: "/user/courses" },
    { icon: BarChart, label: "Progress", href: "/user/progress" },
    { icon: User, label: "Profile", href: "/user/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-10">
      <div className="flex justify-between items-center px-2">
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center py-2 px-3",
                isActive ? "text-primary-700" : "text-gray-500"
              )}
            >
              <link.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary-700" : "text-gray-500"
                )}
              />
              <span className="text-xs mt-1">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavigation;

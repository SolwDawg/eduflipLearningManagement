"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layout,
  LayoutGrid,
  Book,
  User,
  Settings,
  Bell,
  MessageSquare,
} from "lucide-react";

const sidebarItems = [
  { href: "/student/dashboard", text: "Dashboard", icon: LayoutGrid },
  { href: "/student/courses", text: "My Courses", icon: Layout },
  { href: "/student/explore", text: "Explore", icon: Book },
  { href: "/student/messages", text: "Messages", icon: MessageSquare },
  { href: "/student/profile", text: "Profile", icon: User },
  { href: "/student/notifications", text: "Notifications", icon: Bell },
  { href: "/student/settings", text: "Settings", icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="h-full border-r flex flex-col p-4">
      <div className="flex-1 py-2">
        <nav className="grid items-start gap-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname.includes(item.href)
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {<item.icon className="h-4 w-4" />}
              {item.text}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

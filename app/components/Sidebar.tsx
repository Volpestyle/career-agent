"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Bookmark,
  User,
  Settings,
  Play,
  Building2,
  Clock,
  Palette,
} from "lucide-react";

const baseSidebarItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Job Search",
    href: "/search",
    icon: Search,
  },
  {
    title: "Saved Jobs",
    href: "/jobs",
    icon: Bookmark,
  },
  {
    title: "Job Boards",
    href: "/boards",
    icon: Building2,
  },
  {
    title: "History",
    href: "/history",
    icon: Clock,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

// Add Components page only in development
const devOnlyItems =
  process.env.NODE_ENV === "development"
    ? [
        {
          title: "Components",
          href: "/components",
          icon: Palette,
        },
      ]
    : [];

const sidebarItems = [
  ...baseSidebarItems.slice(0, -1), // All items except Settings
  ...devOnlyItems, // Add dev-only items
  baseSidebarItems[baseSidebarItems.length - 1], // Settings at the end
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6">
        <h1 className="text-lg font-heading font-medium text-foreground">
          Career Agent
        </h1>
        <p className="text-sm font-body text-muted-foreground">AI Job Search</p>
      </div>

      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-body transition-colors
                    ${
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-xs font-body text-muted-foreground">
          <span>v0.1.0</span>
          <span>Anonymous Mode</span>
        </div>
      </div>
    </div>
  );
}

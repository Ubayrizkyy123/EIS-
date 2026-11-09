"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import styles from "../skillset.module.css";

type MenuItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

type AccordionKey = "analytics" | "courses";

const primaryItems: MenuItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Mentors", icon: GraduationCap },
  { label: "Students", icon: Users },
];

const accordions: {
  key: AccordionKey;
  label: string;
  icon: LucideIcon;
  items: string[];
}[] = [
  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart3,
    items: ["Overview", "Performance", "Reports"],
  },
  {
    key: "courses",
    label: "Courses",
    icon: BookOpen,
    items: ["All Courses", "Categories", "Instructors"],
  },
];

const bottomItems: MenuItem[] = [
  { label: "Settings", icon: Settings },
  { label: "Help Center", icon: LifeBuoy },
  { label: "Log out", icon: LogOut },
];

function ItemIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <Icon aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={1.8} />
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [openAccordion, setOpenAccordion] = useState<AccordionKey | null>(
    null,
  );

  function toggleAccordion(key: AccordionKey) {
    setOpenAccordion((current) => (current === key ? null : key));
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white px-4 py-5">
      <Link
        href="/skillset"
        className="flex items-center gap-2.5 px-2"
        onClick={onNavigate}
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-xl bg-zinc-950 text-sm font-bold text-white"
        >
          S
        </span>
        <span
          translate="no"
          className="text-xl font-bold tracking-tight text-zinc-950"
        >
          Skillset
        </span>
      </Link>

      <nav aria-label="Primary navigation" className="mt-9 flex flex-col gap-1">
        {primaryItems.map((item) => (
          <button
            key={item.label}
            type="button"
            aria-current={item.active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition duration-300 active:scale-[0.98]",
              item.active
                ? "bg-zinc-100 text-zinc-950"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
            )}
          >
            <ItemIcon icon={item.icon} />
            {item.label}
          </button>
        ))}

        {accordions.map((item) => {
          const isOpen = openAccordion === item.key;

          return (
            <div key={item.key}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${item.key}-submenu`}
                onClick={() => toggleAccordion(item.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition duration-300 active:scale-[0.98]",
                  isOpen
                    ? "bg-zinc-50 text-zinc-950"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
                )}
              >
                <ItemIcon icon={item.icon} />
                <span className="flex-1">{item.label}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "size-4 transition-transform duration-300",
                    isOpen && "rotate-180",
                  )}
                  strokeWidth={1.8}
                />
              </button>

              {isOpen ? (
                <div id={`${item.key}-submenu`} className={styles.submenu}>
                  <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-zinc-200 pl-4">
                    {item.items.map((subItem) => (
                      <button
                        key={subItem}
                        type="button"
                        onClick={onNavigate}
                        className="rounded-lg px-3 py-2 text-left text-sm text-zinc-500 transition-colors duration-300 hover:bg-zinc-50 hover:text-zinc-950 active:scale-[0.98]"
                      >
                        {subItem}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        <button
          type="button"
          onClick={onNavigate}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-zinc-500 transition duration-300 hover:bg-zinc-100 hover:text-zinc-950 active:scale-[0.98]"
        >
          <ItemIcon icon={MessageSquare} />
          Forum
        </button>
      </nav>

      <div className="mt-auto pt-8">
        <div className="rounded-2xl bg-zinc-950 p-4 text-white">
          <p className="text-sm font-semibold">Upgrade To Pro</p>
          <p className="mt-1.5 text-xs leading-5 text-zinc-400">
            Get access to additional features and content
          </p>
          <button
            type="button"
            className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition duration-300 hover:bg-white/10 active:scale-95"
          >
            Upgrade
          </button>
        </div>

        <div className="mt-5 border-t border-zinc-100 pt-3">
          {bottomItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={onNavigate}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-zinc-500 transition duration-300 hover:bg-zinc-100 hover:text-zinc-950 active:scale-[0.98]"
            >
              <ItemIcon icon={item.icon} />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkillsetSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-zinc-200/80 bg-white lg:flex">
      <SidebarContent />
    </aside>
  );
}

export function SkillsetMobileSidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return <SidebarContent onNavigate={onNavigate} />;
}

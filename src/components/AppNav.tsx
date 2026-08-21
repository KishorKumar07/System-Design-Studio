"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, LayoutDashboard, UserRound, LogOut, Menu, X, Boxes } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const TABS = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "problems", label: "Problems", href: "/problems", icon: LayoutGrid },
  { key: "account", label: "Account", href: "/account", icon: UserRound },
] as const;

export function AppNav({ active }: { active: "dashboard" | "problems" | "account" }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Boxes size={16} />
          </span>
          Architect
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active === tab.key ? "text-foreground" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {active === tab.key && (
                <motion.span
                  layoutId="nav-active-pill"
                  className="absolute inset-0 -z-10 rounded-md bg-surface-strong"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground sm:flex"
          >
            <LogOut size={14} />
            Sign out
          </button>
          <button
            aria-label="Menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground-muted sm:hidden"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border sm:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-3">
              {TABS.map((tab) => (
                <Link
                  key={tab.key}
                  href={tab.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    active === tab.key ? "bg-surface-strong text-foreground" : "text-foreground-muted"
                  }`}
                >
                  <tab.icon size={15} />
                  {tab.label}
                </Link>
              ))}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-foreground-muted"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

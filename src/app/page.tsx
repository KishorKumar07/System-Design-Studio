"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Boxes, Gauge, GitBranch, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/Motion";

const FEATURES = [
  {
    icon: Gauge,
    title: "Capacity checkpoint",
    body: "Commit to real QPS, storage, and read/write numbers before grading — the review checks your diagram against your own math.",
  },
  {
    icon: GitBranch,
    title: "Connection-level review",
    body: "Every edge is judged individually — sound, questionable, or flat-out wrong — not just an overall vibe score.",
  },
  {
    icon: ShieldCheck,
    title: "Built like production",
    body: "Rate-limited AI calls, ownership checks on every route, prompt-injection guarding, and a real account-deletion flow.",
  },
];

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <nav className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Boxes size={17} />
          </span>
          Architect
        </span>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </nav>

      <div className="pointer-events-none absolute inset-0 bg-blueprint [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_20%,transparent_75%)]" />
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />

      <main className="relative z-10 mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-7 px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground-muted"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          AI-graded, portfolio-ready
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-4xl font-semibold tracking-tight sm:text-6xl"
        >
          Design systems on a
          <br />
          <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
            real canvas.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-xl text-balance text-lg text-foreground-muted"
        >
          Pick a problem, build the architecture, commit to real capacity numbers, and get
          AI-scored feedback across completeness, scalability, reliability, security, and cost —
          graded like a staff interview review.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Link href="/problems">
            <Button size="lg" className="group">
              Browse problems
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </motion.div>
      </main>

      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24">
        <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <StaggerItem key={f.title}>
              <Card hoverable className="h-full p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <f.icon size={16} />
                </div>
                <h3 className="mb-1.5 font-semibold">{f.title}</h3>
                <p className="text-sm text-foreground-muted">{f.body}</p>
              </Card>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      <FadeIn className="relative z-10 px-8 pb-6 text-center text-xs text-foreground-subtle">
        AI-generated feedback is a review aid, not an authoritative assessment.
      </FadeIn>
    </div>
  );
}

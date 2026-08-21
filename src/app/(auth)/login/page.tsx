"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Boxes, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { GitHubIcon } from "@/components/icons/GitHubIcon";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(callbackUrl);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <Card className="p-7">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Boxes size={19} />
          </span>
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-foreground-muted">Log in to keep building.</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle" />
            <Input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative">
            <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle" />
            <Input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
            />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-danger">
              {error}
            </motion.p>
          )}

          <Button type="submit" loading={loading} className="mt-1 w-full">
            Log in
            <ArrowRight size={15} />
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-foreground-subtle">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={() => signIn("github", { callbackUrl })}>
          <GitHubIcon size={15} />
          Continue with GitHub
        </Button>

        <p className="mt-6 text-center text-sm text-foreground-muted">
          No account?{" "}
          <Link href="/register" className="font-medium text-accent hover:text-accent-hover">
            Sign up
          </Link>
        </p>
      </Card>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center bg-blueprint px-6">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function StartDesignButton({ problemId }: { problemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    const res = await fetch("/api/designs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId }),
    });
    const body = await res.json();
    setLoading(false);
    if (res.ok) router.push(`/designs/${body.design.id}`);
  }

  return (
    <Button onClick={start} loading={loading} size="lg">
      {!loading && "Start a new design"}
      {!loading && <ArrowRight size={16} />}
    </Button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StaggerList, StaggerItem } from "@/components/ui/Motion";
import type { Evaluation } from "@/lib/ai/schema";

const STATUS_META = {
  sound: { tone: "success" as const, icon: CheckCircle2 },
  questionable: { tone: "warning" as const, icon: AlertTriangle },
  incorrect: { tone: "danger" as const, icon: XCircle },
};

function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, target, {
      duration: 0.7,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [target]);
  return value;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-foreground-muted">{label}</span>
        <span className="font-medium">{score}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-strong">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-1.5 rounded-full bg-accent"
        />
      </div>
    </div>
  );
}

export function EvaluationResults({ evaluation }: { evaluation: Evaluation }) {
  const displayScore = useCountUp(evaluation.overallScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 overflow-y-auto p-4 text-sm"
    >
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums">{displayScore}</span>
          <span className="text-foreground-subtle">/ 100</span>
        </div>
        <p className="mt-1 text-foreground-muted">{evaluation.verdict}</p>
      </div>

      <div className="flex flex-col gap-3">
        <ScoreBar label="Completeness" score={evaluation.criteria.completeness.score} />
        <ScoreBar label="Scalability" score={evaluation.criteria.scalability.score} />
        <ScoreBar label="Reliability" score={evaluation.criteria.reliability.score} />
        <ScoreBar label="Security" score={evaluation.criteria.security.score} />
        <ScoreBar label="Cost efficiency" score={evaluation.criteria.costEfficiency.score} />
      </div>

      <div
        className={`rounded-lg border p-3 text-xs ${
          evaluation.capacityCheck.consistent ? "border-success/30 bg-success-soft" : "border-warning/30 bg-warning-soft"
        }`}
      >
        <p className={`mb-1 font-semibold ${evaluation.capacityCheck.consistent ? "text-success" : "text-warning"}`}>
          Capacity checkpoint: {evaluation.capacityCheck.consistent ? "Consistent" : "Needs attention"}
        </p>
        <p className="text-foreground-muted">{evaluation.capacityCheck.note}</p>
      </div>

      {evaluation.strengths.length > 0 && <Section title="Strengths" items={evaluation.strengths} />}
      {evaluation.weaknesses.length > 0 && <Section title="Weaknesses" items={evaluation.weaknesses} />}
      {evaluation.missingComponents.length > 0 && (
        <Section title="Missing components" items={evaluation.missingComponents} />
      )}
      {evaluation.suggestions.length > 0 && <Section title="Suggestions" items={evaluation.suggestions} />}

      {evaluation.connectionFeedback.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
            Connection feedback
          </p>
          <StaggerList className="flex flex-col gap-2">
            {evaluation.connectionFeedback.map((c, i) => {
              const meta = STATUS_META[c.status];
              return (
                <StaggerItem key={i}>
                  <div className="rounded-lg border border-border bg-surface p-2.5">
                    <div className="mb-1 flex items-center gap-1.5">
                      <meta.icon size={13} className={`text-${meta.tone}`} style={{ color: `var(--${meta.tone})` }} />
                      <span className="text-xs font-semibold">{c.connection}</span>
                      <Badge tone={meta.tone}>{c.status}</Badge>
                    </div>
                    <p className="text-xs text-foreground-muted">{c.note}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerList>
        </div>
      )}
    </motion.div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">{title}</p>
      <ul className="list-disc space-y-1 pl-4 text-xs text-foreground-muted">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
